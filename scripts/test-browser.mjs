import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import net from 'node:net';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import { SITE_VERSION } from '../site.version.mjs';
await mkdir('.runtime', { recursive: true });

const root = process.cwd();
const browserPath = process.env.TOOLIFYBOX_BROWSER || [
  path.join(process.env.LOCALAPPDATA || '', 'ms-playwright/chromium-1243/chrome-win64/chrome.exe'),
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium', '/usr/bin/google-chrome',
].find(candidate => existsSync(candidate));
assert.ok(browserPath, 'Set TOOLIFYBOX_BROWSER to an installed Chrome/Chromium executable.');
const debugPort = await new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    server.close(error => error ? reject(error) : resolve(port));
  });
});
const chrome = spawn(browserPath, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
  '--remote-allow-origins=*',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${path.join(root, `.runtime/browser-profile-${debugPort}`)}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
const pending = new Map();
let next = 0;
let consoleErrors = [];
let pageCount = 0;
const hydrationWarnings = [];
try {
  const baseUrl = process.env.TOOLIFYBOX_TEST_URL || 'http://127.0.0.1:5174';
  const toolsUrl = new URL('/tools', baseUrl).href;
  // A cold Nuxt dev server must compile its SSR module graph before responding.
  const preview = await fetch(baseUrl, { signal: AbortSignal.timeout(120000) });
  assert.ok(preview.ok, `Preview returned HTTP ${preview.status}`);
  const toolsPreview = await fetch(toolsUrl, { signal: AbortSignal.timeout(120000) });
  assert.ok(toolsPreview.ok, `Tools page returned HTTP ${toolsPreview.status}`);
  let page;
  for (let i = 0; i < 50; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(x => x.type === 'page'); if (page) break; } catch {}
    await pause(200);
  }
  assert.ok(page, 'Browser did not start');
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject, timer } = pending.get(message.id);
      pending.delete(message.id); clearTimeout(timer);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') consoleErrors.push(message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled') {
      const output = message.params.args.map(argument => argument.value || argument.description || '').join(' ');
      if (/hydration|mismatch/i.test(output)) hydrationWarnings.push(output);
    }
  });
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++next;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 20000);
      pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (value.exceptionDetails) throw new Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text);
    return value.result.value;
  }
  async function waitFor(expression) {
    for (let i = 0; i < 300; i++) { if (await evaluate(expression)) return; await pause(100); }
    throw new Error(`Condition not met: ${expression}`);
  }
  async function viewport(width, height, mobile = false) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await pause(250);
  }
  async function screenshot(filename) {
    await evaluate(`document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' });`);
    await pause(150);
    const metrics = await send('Page.getLayoutMetrics');
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: metrics.cssContentSize.width, height: metrics.cssContentSize.height, scale: 1 } });
    await writeFile(path.join(root, '.runtime', filename), Buffer.from(result.data, 'base64'));
  }
  async function revealPage() {
    await evaluate(`(async () => { for (const element of document.querySelectorAll('[data-reveal]')) { element.scrollIntoView({ behavior: 'instant', block: 'center' }); await new Promise(r => setTimeout(r, 140)); } window.scrollTo({ top: 0, behavior: 'instant' }); })()`);
    await pause(1000);
  }
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  const uploads = [];
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Network.requestWillBeSent') {
      const request = message.params.request;
      if (request.url.startsWith('http') && !['GET', 'HEAD'].includes(request.method)) uploads.push(request.url);
    }
  });
  const imageBase64 = await evaluate(`(() => { const c = document.createElement('canvas'); c.width = 120; c.height = 80; const x = c.getContext('2d'); x.fillStyle = '#dd3020'; x.fillRect(0, 0, 120, 80); return c.toDataURL('image/png').split(',')[1]; })()`);
  const paragraph = text => `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`;
  async function fixture({ long = false, pageBreak = false, landscape = false, badSize = false, noPageSettings = false, zeroMargins = false, mixedOrientation = false, headerFooter = false } = {}) {
    const zip = new JSZip();
    const table = `<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="6"/><w:insideV w:val="single" w:sz="6"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="4000"/><w:gridCol w:w="4000"/></w:tblGrid><w:tr><w:tc>${paragraph('Document')}</w:tc><w:tc>${paragraph('Converted successfully')}</w:tc></w:tr></w:tbl>`;
    const picture = `<w:p><w:r><w:drawing><wp:inline><wp:extent cx="1143000" cy="762000"/><wp:docPr id="1" name="Red image"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="image.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImage"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1143000" cy="762000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
    let body = paragraph('Toolifybox browser verification') + paragraph('This PDF was converted entirely on this device.') + table + picture;
    if (long) body += Array.from({ length: 90 }, (_, i) => paragraph(`Paragraph ${i + 1}. A complete report with text flowing naturally across many pages. This content must remain in the final PDF.`)).join('');
    if (pageBreak) body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' + paragraph('Second page after the explicit page break.');
    if (mixedOrientation) body += '<w:p><w:pPr><w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:bottom="1440" w:left="1440" w:right="1440"/></w:sectPr></w:pPr></w:p>' + paragraph('Landscape appendix.');
    const width = badSize ? 50000 : landscape || mixedOrientation ? 15840 : 12240;
    const height = landscape || mixedOrientation ? 12240 : 15840;
    if (!noPageSettings) body += `<w:sectPr>${headerFooter ? '<w:headerReference w:type="default" r:id="rIdHeader"/><w:footerReference w:type="default" r:id="rIdFooter"/>' : ''}<w:pgSz w:w="${width}" w:h="${height}"/><w:pgMar w:top="${zeroMargins ? 0 : 1440}" w:bottom="${zeroMargins ? 0 : 1440}" w:left="1440" w:right="1440" w:header="720" w:footer="720"/></w:sectPr>`;
    zip.file('[Content_Types].xml', `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
    zip.file('_rels/.rels', `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
    zip.file('word/document.xml', `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}</w:body></w:document>`);
    zip.file('word/_rels/document.xml.rels', `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdImage" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image.png"/></Relationships>`);
    zip.file('word/media/image.png', imageBase64, { base64: true });
    if (headerFooter) {
      const types = await zip.file('[Content_Types].xml').async('string');
      zip.file('[Content_Types].xml', types.replace('</Types>', '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>'));
      const relationships = await zip.file('word/_rels/document.xml.rels').async('string');
      zip.file('word/_rels/document.xml.rels', relationships.replace('</Relationships>', '<Relationship Id="rIdHeader" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>'));
      zip.file('word/header1.xml', `<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${paragraph('Report header')}</w:hdr>`);
      zip.file('word/footer1.xml', `<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${paragraph('Report footer')}</w:ftr>`);
    }
    return zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
  }
  const sample = await fixture();
  async function upload(name, base64 = sample) {
    await evaluate(`(() => { const data = new DataTransfer(); data.items.add(new File([Uint8Array.from(atob(${JSON.stringify(base64)}), c => c.charCodeAt(0))], ${JSON.stringify(name)})); const input = document.querySelector('input[type=file]'); input.files = data.files; input.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await pause(150);
  }
  async function uploadMany(files) {
    await evaluate(`(() => { const data = new DataTransfer(); for (const item of ${JSON.stringify(files)}) data.items.add(new File([Uint8Array.from(atob(item.base64), c => c.charCodeAt(0))], item.name, { type: item.type })); const input = document.querySelector('input[type=file]'); input.files = data.files; input.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await pause(200);
  }
  async function savePdf(filename) {
    const encoded = await evaluate(`(() => { const url = document.querySelector('a[download]').href; return new Promise((resolve, reject) => { const xhr = new XMLHttpRequest(); xhr.open('GET', url); xhr.responseType = 'blob'; xhr.onload = () => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(xhr.response); }; xhr.onerror = reject; xhr.send(); }); })()`);
    const pdf = Buffer.from(encoded, 'base64');
    assert.ok(pdf.toString('latin1').startsWith('%PDF-'));
    assert.ok(pdf.toString('latin1').includes('/Subtype /Image'));
    await writeFile(path.join(root, '.runtime', filename), pdf);
    return pdf.toString('latin1');
  }
  await viewport(1440, 1000);
  await send('Page.navigate', { url: toolsUrl });
  await waitFor(`!!document.querySelector('.choose-button')`);
  await waitFor(`document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false`);
  await evaluate(`Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 5000))]).then(() => true)`);
  await pause(1000);
  assert.equal(await evaluate(`document.querySelector('.brand-name')?.textContent`), 'toolifybox', 'Header must use the new Toolifybox wordmark');
  assert.equal(await evaluate(`!!document.querySelector('.brand-mark') && !document.querySelector('.brand-symbol')`), true, 'Header must use the polished folded T mark');
  assert.equal(await evaluate(`document.documentElement.dataset.theme`), 'light', 'Light must be the default theme');
  assert.equal(await evaluate(`document.querySelector('.theme-toggle')?.getAttribute('aria-label')`), 'Switch to dark theme');
  assert.equal(await evaluate(`!!document.querySelector('#tool-search')`), true, 'Tools page must include the tool search');
  await evaluate(`document.querySelector('#tool-search').value = 'Combine PNG'; document.querySelector('#tool-search').dispatchEvent(new Event('input', { bubbles: true }));`);
  await waitFor(`document.querySelectorAll('.tool-card').length === 1`);
  assert.equal(await evaluate(`document.querySelector('.tool-card')?.getAttribute('href')`), '/tools/images-to-pdf', 'Tool search must filter the catalog');
  await evaluate(`document.querySelector('.search-clear').click()`);
  await waitFor(`document.querySelectorAll('.tool-card').length > 4`);
  assert.equal(await evaluate(`document.querySelectorAll('.footer-tools a').length`), 9, 'Footer must link to all active converters and the tools page');
  await evaluate(`document.querySelector('.theme-toggle').click()`);
  await waitFor(`document.documentElement.dataset.theme === 'dark'`);
  assert.equal(await evaluate(`localStorage.getItem('toolifybox-theme')`), 'dark', 'Dark theme choice must be saved');
  assert.equal(await evaluate(`document.querySelectorAll('a.tool-card[href="/tools/word-to-pdf"], a.tool-card[href="/tools/pdf-to-word"], a.tool-card[href="/tools/pdf-to-images"], a.tool-card[href="/tools/images-to-pdf"], a.tool-card[href="/tools/merge-pdf"], a.tool-card[href="/tools/split-pdf"], a.tool-card[href="/tools/compress-pdf"], a.tool-card[href="/tools/compress-image"]').length`), 8, 'All active tool cards must be links');
  await evaluate(`document.querySelector('a.tool-card[href="/tools/images-to-pdf"]').click()`);
  await waitFor(`location.pathname === '/tools/images-to-pdf' && document.querySelector('.converter')?.getAttribute('aria-label') === 'Images to PDF converter'`);
  assert.equal(await evaluate(`document.documentElement.dataset.theme`), 'dark', 'Theme choice must persist across routes');
  assert.equal(await evaluate(`document.querySelector('.theme-toggle')?.getAttribute('aria-label')`), 'Switch to light theme');
  await viewport(390, 844, true);
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, 'Dark theme header overflows on mobile');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.mobile-menu-toggle')).display`), 'grid', 'Mobile hamburger must be visible');
  await evaluate(`document.querySelector('.mobile-menu-toggle').click()`);
  await waitFor(`!!document.querySelector('#mobile-navigation')`);
  assert.equal(await evaluate(`!!document.querySelector('.mobile-tool-finder input[aria-label="Search all tools"]')`), true, 'Mobile menu must include the scalable tool finder');
  assert.equal(await evaluate(`!!document.querySelector('.mobile-tools-list')`), false, 'Mobile menu must not hard-code converter links');
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, 'Open mobile navigation overflows');
  await screenshot('design-mobile-menu.png');
  await evaluate(`(() => { const input = document.querySelector('.mobile-tool-finder input'); input.value = 'PDF to Word'; input.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('.mobile-tool-finder form').requestSubmit(); })()`);
  await waitFor(`location.pathname === '/tools' && location.hash === '#tool-results' && new URLSearchParams(location.search).get('search') === 'PDF to Word'`);
  await waitFor(`!document.querySelector('#mobile-navigation') && document.querySelectorAll('.tool-card').length === 1 && (() => { const top = document.querySelector('#tool-results').getBoundingClientRect().top; return top >= 0 && top < innerHeight * 0.35; })()`);
  assert.equal(await evaluate(`document.querySelector('.tool-card')?.getAttribute('href')`), '/tools/pdf-to-word', 'Header search must show the matching tool');
  const searchScroll = await evaluate(`(() => ({ top: document.querySelector('#tool-results').getBoundingClientRect().top, scrollY, height: innerHeight }))()`);
  assert.ok(searchScroll.top >= 0 && searchScroll.top < searchScroll.height * 0.35, `Header search must scroll to the result catalog: ${JSON.stringify(searchScroll)}`);
  await send('Page.navigate', { url: new URL('/tools/images-to-pdf', baseUrl).href });
  await waitFor(`location.pathname === '/tools/images-to-pdf' && document.querySelector('.converter')?.getAttribute('aria-label') === 'Images to PDF converter'`);
  await screenshot('design-dark-theme-mobile.png');
  await viewport(1440, 1100);
  await evaluate(`document.querySelector('.theme-toggle').click()`);
  await waitFor(`document.documentElement.dataset.theme === 'light'`);
  assert.equal(await evaluate(`localStorage.getItem('toolifybox-theme')`), 'light', 'Light theme choice must be saved');
  const [greenImage, blueImage] = await Promise.all([
    evaluate(`(() => { const c = document.createElement('canvas'); c.width = 120; c.height = 80; const x = c.getContext('2d'); x.fillStyle = '#16a34a'; x.fillRect(0, 0, 120, 80); x.fillStyle = '#fff'; x.font = '20px Arial'; x.fillText('GREEN', 20, 48); return c.toDataURL('image/png').split(',')[1]; })()`),
    evaluate(`(() => { const c = document.createElement('canvas'); c.width = 80; c.height = 120; const x = c.getContext('2d'); x.fillStyle = '#2563eb'; x.fillRect(0, 0, 80, 120); x.fillStyle = '#fff'; x.font = '18px Arial'; x.fillText('BLUE', 12, 66); return c.toDataURL('image/png').split(',')[1]; })()`),
  ]);
  await uploadMany([
    { name: 'red.png', type: 'image/png', base64: imageBase64 },
    { name: 'green.png', type: 'image/png', base64: greenImage },
    { name: 'blue.png', type: 'image/png', base64: blueImage },
  ]);
  await waitFor(`document.querySelectorAll('.image-preview-card').length === 3`);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.image-preview-info strong')].map(item => item.textContent)`), ['red.png', 'green.png', 'blue.png']);
  await evaluate(`document.querySelector('[aria-label="Move page 3 earlier"]').click()`);
  await evaluate(`document.querySelector('[aria-label="Move page 2 earlier"]').click()`);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.image-preview-info strong')].map(item => item.textContent)`), ['blue.png', 'red.png', 'green.png'], 'Move controls must change PDF page order');
  await evaluate(`document.querySelector('[aria-label="Rotate page 1"]').click()`);
  await viewport(390, 844, true);
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, 'Images to PDF preview overflows on mobile');
  await screenshot('design-images-to-pdf-arranged.png');
  await viewport(1440, 1100);
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('.result-state') || !!document.querySelector('[role=alert]')`);
  if (await evaluate(`!!document.querySelector('[role=alert]')`)) throw new Error(await evaluate(`document.querySelector('[role=alert]').textContent`));
  assert.equal(await evaluate(`document.querySelector('a[download]').download`), 'blue-images.pdf');
  const combinedImagesPdf = await savePdf('images-to-pdf-result.pdf');
  assert.ok(combinedImagesPdf.includes('/Count 3'), 'Images to PDF must create one page per image');
  await send('Page.navigate', { url: toolsUrl });
  await waitFor(`location.pathname === '/tools' && !!document.querySelector('.choose-button')`);
  await waitFor(`document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false`);
  await evaluate(`document.querySelector('a.tool-card[href="/tools/pdf-to-images"]').click()`);
  await waitFor(`location.pathname === '/tools/pdf-to-images' && document.querySelector('.converter')?.getAttribute('aria-label') === 'PDF to images converter'`);
  const imagePdf = new jsPDF({ unit: 'pt', format: 'a4' });
  imagePdf.setTextColor('#2563eb'); imagePdf.setFontSize(24); imagePdf.text('Selected page one', 50, 80);
  imagePdf.addPage(); imagePdf.setTextColor('#e11d48'); imagePdf.text('Skipped page two', 50, 80);
  imagePdf.addPage(); imagePdf.setTextColor('#16a34a'); imagePdf.text('Selected page three', 50, 80);
  await upload('multi-page.pdf', Buffer.from(imagePdf.output('arraybuffer')).toString('base64'));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`document.querySelectorAll('.pdf-page-card').length === 3`);
  assert.equal(await evaluate(`[...document.querySelectorAll('.page-select')].every(button => button.getAttribute('aria-pressed') === 'true')`), true, 'All PDF pages should start selected');
  await evaluate(`document.querySelectorAll('.page-select')[1].click()`);
  assert.equal(await evaluate(`document.querySelector('.image-selection-summary strong').textContent`), '2 of 3 pages selected');
  await viewport(390, 844, true);
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, 'PDF image selector overflows on mobile');
  await screenshot('design-pdf-images-selected.png');
  await viewport(1440, 1100);
  await evaluate(`document.querySelectorAll('.image-output-options select')[0].value = 'jpg'; document.querySelectorAll('.image-output-options select')[0].dispatchEvent(new Event('change', { bubbles: true })); document.querySelectorAll('.image-output-options select')[1].value = '1'; document.querySelectorAll('.image-output-options select')[1].dispatchEvent(new Event('change', { bubbles: true })); window.__toolifyboxDownload = null; HTMLAnchorElement.prototype.click = function () { window.__toolifyboxDownload = { href: this.href, download: this.download }; }; document.querySelector('.image-download-selected').click();`);
  await waitFor(`!!window.__toolifyboxDownload`);
  const imageArchive = await evaluate(`(async () => { const item = window.__toolifyboxDownload; const blob = await (await fetch(item.href)).blob(); const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob); }); return { filename: item.download, data }; })()`);
  assert.equal(imageArchive.filename, 'multi-page-images.zip');
  const imageZip = await JSZip.loadAsync(Buffer.from(imageArchive.data, 'base64'));
  assert.deepEqual(Object.keys(imageZip.files).sort(), ['multi-page-page-01.jpg', 'multi-page-page-03.jpg']);
  for (const item of Object.values(imageZip.files)) {
    const bytes = await item.async('nodebuffer');
    assert.equal(bytes[0], 0xff); assert.equal(bytes[1], 0xd8);
  }
  await send('Page.navigate', { url: toolsUrl });
  await waitFor(`location.pathname === '/tools' && !!document.querySelector('.choose-button')`);
  await waitFor(`document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false`);
  await evaluate(`document.querySelector('a.tool-card[href="/tools/pdf-to-word"]').click()`);
  await waitFor(`location.pathname === '/tools/pdf-to-word' && document.querySelector('.converter')?.getAttribute('aria-label') === 'PDF to Word converter'`);
  assert.equal(await evaluate(`document.querySelector('.choose-button').textContent.includes('PDF')`), true, 'PDF to Word card opened the wrong converter');
  await send('Page.navigate', { url: toolsUrl });
  await waitFor(`location.pathname === '/tools' && !!document.querySelector('.choose-button')`);
  await waitFor(`document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false`);
  await evaluate(`document.querySelector('a.tool-card[href="/tools/word-to-pdf"]').click()`);
  await waitFor(`location.pathname === '/tools/word-to-pdf' && document.querySelector('.converter')?.getAttribute('aria-label') === 'Word to PDF converter'`);
  assert.equal(await evaluate(`document.querySelector('.choose-button').textContent.includes('Word')`), true, 'Word to PDF card opened the wrong converter');
  await send('Page.navigate', { url: toolsUrl });
  await waitFor(`location.pathname === '/tools' && !!document.querySelector('.choose-button')`);
  await waitFor(`document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false`);
  await pause(500);
  await revealPage();
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true);
  await screenshot('design-desktop.png');
  await viewport(390, 844, true); await revealPage();
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true);
  await screenshot('design-mobile.png');
  await viewport(320, 750, true);
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true);
  await viewport(1440, 1000);
  if (!process.env.TOOLIFYBOX_TEST_PDF_ONLY) {
  await upload('old.doc');
  assert.ok((await evaluate(`document.querySelector('[role=alert]').textContent`)).includes('.docx'));
  await upload('empty.docx', '');
  assert.ok((await evaluate(`document.querySelector('[role=alert]').textContent`)).includes('empty'));
  await upload('Résumé.final.docx');
  await evaluate(`document.querySelector('.convert-button').click(); document.querySelector('.convert-button').click();`);
  await waitFor(`!!document.querySelector('.result-state') || !!document.querySelector('[role=alert]')`);
  if (await evaluate(`!!document.querySelector('[role=alert]')`)) throw new Error(await evaluate(`document.querySelector('[role=alert]').textContent`));
  assert.equal(await evaluate(`document.querySelector('a[download]').download`), 'Résumé.final.pdf');
  assert.equal(await evaluate(`document.querySelectorAll('[data-document-renderer]').length`), 0, 'Conversion frame leaked');
  const onePage = await savePdf('browser-result.pdf');
  assert.ok(onePage.includes('/Count 1'));
  await screenshot('design-success.png');
  await evaluate(`document.querySelector('.result-state button').click()`);
  await upload('damaged.docx', Buffer.from('Not a valid Word document').toString('base64'));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('[role=alert]')`);
  assert.equal(await evaluate(`document.querySelector('.convert-button').disabled`), false);
  await upload('bad-size.docx', await fixture({ badSize: true }));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('[role=alert]')`);
  assert.ok((await evaluate(`document.querySelector('[role=alert]').textContent`)).includes('page dimensions'));
  assert.equal(await evaluate(`document.querySelectorAll('[data-document-renderer]').length`), 0, 'Frame leaked on failure');
  await upload('two-pages.docx', await fixture({ pageBreak: true }));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('.result-state')`);
  assert.ok((await savePdf('browser-two-pages.pdf')).includes('/Count 2'));
  await evaluate(`document.querySelector('.result-state button').click()`);
  await upload('long-report.docx', await fixture({ long: true }));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('.result-state')`);
  const longPdf = await savePdf('browser-long-report.pdf');
  pageCount = Number(longPdf.match(/\/Count (\d+)/)?.[1]);
  assert.ok(pageCount > 2, 'Long content was not paginated');
  const pdfBytes = Buffer.from(longPdf, 'latin1');
  const lastImageStart = pdfBytes.lastIndexOf(Buffer.from([0xff, 0xd8]));
  const lastImageEnd = pdfBytes.indexOf(Buffer.from([0xff, 0xd9]), lastImageStart) + 2;
  assert.ok(lastImageStart >= 0 && lastImageEnd > lastImageStart);
  const lastImage = pdfBytes.subarray(lastImageStart, lastImageEnd).toString('base64');
  const hasLastPageContent = await evaluate(`(async () => { const bytes = Uint8Array.from(atob(${JSON.stringify(lastImage)}), c => c.charCodeAt(0)); const image = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' })); const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height; const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0); const pixels = ctx.getImageData(0, 0, image.width, image.height).data; let ink = 0; for (let i = 0; i < pixels.length; i += 16) if (Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) < 150) ink++; image.close(); return ink > 100; })()`);
  assert.equal(hasLastPageContent, true, 'Long report ends with an unintended blank page');
  await evaluate(`document.querySelector('.result-state button').click()`);
  await viewport(390, 844, true);
  await upload('landscape.docx', await fixture({ landscape: true }));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('.result-state')`);
  const landscape = await savePdf('browser-landscape.pdf');
  assert.ok(landscape.includes('/MediaBox [0 0 792. 612.]'), 'Landscape page size lost');
  await evaluate(`document.querySelector('.result-state button').click()`);
  await upload('without-page-settings.docx', await fixture({ noPageSettings: true }));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('.result-state') || !!document.querySelector('[role=alert]')`);
  assert.equal(await evaluate(`!!document.querySelector('[role=alert]')`), false, 'A valid DOCX without page settings was rejected');
  await savePdf('browser-default-page.pdf');
  await evaluate(`document.querySelector('.result-state button').click()`);
  await upload('zero-margins.docx', await fixture({ long: true, zeroMargins: true }));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('.result-state')`);
  await savePdf('browser-zero-margins.pdf');
  await evaluate(`document.querySelector('.result-state button').click()`);
  await upload('mixed-orientation.docx', await fixture({ mixedOrientation: true }));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('.result-state')`);
  const mixed = await savePdf('browser-mixed-orientation.pdf');
  assert.ok(mixed.includes('/Count 2') && mixed.includes('/MediaBox [0 0 792. 612.]') && mixed.includes('/MediaBox [0 0 612. 792.]'), 'Mixed page sizes were lost');
  await evaluate(`document.querySelector('.result-state button').click()`);
  await upload('cancelled.docx', await fixture({ long: true }));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('.cancel-conversion')`);
  await evaluate(`document.querySelector('.cancel-conversion').click()`);
  await waitFor(`!document.querySelector('.convert-button').disabled`);
  assert.equal(await evaluate(`document.querySelectorAll('[data-document-renderer]').length`), 0, 'Cancelled conversion leaked its frame');
  await upload('with-headers.docx', await fixture({ long: true, headerFooter: true }));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('.result-state')`);
  const decorated = await savePdf('browser-header-footer.pdf');
  const decoratedPages = Number(decorated.match(/\/Count (\d+)/)?.[1]);
  assert.ok((decorated.match(/\/Subtype \/Image/g) || []).length >= decoratedPages + 2, 'Header and footer images were not embedded');

  }
  // Exercise the actual PDF.js worker and DOCX generator in the static Nuxt site.
  await evaluate(`document.querySelector('.direction-switch button:nth-child(2)').click()`);
  await waitFor(`document.querySelector('.choose-button').textContent.includes('PDF')`);
  assert.equal(await evaluate(`document.querySelector('input[value=editable]').checked`), true, 'PDF-to-Word must default to real editable text');
  await viewport(320, 750, true);
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true);
  await screenshot('design-pdf-word-mobile.png');
  await viewport(1440, 1100);
  await upload('wrong.docx');
  assert.match(await evaluate(`document.querySelector('[role=alert]').textContent`), /\.pdf/);
  await upload('broken.pdf', Buffer.from('broken pdf').toString('base64'));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('[role=alert]')`);
  assert.match(await evaluate(`document.querySelector('[role=alert]').textContent`), /valid PDF/);


  await upload('damaged-header.pdf', Buffer.from('%PDF-1.7\ninvalid data').toString('base64'));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('[role=alert]')`);
  assert.match(await evaluate(`document.querySelector('[role=alert]').textContent`), /damaged|unreadable/);

  const protectedPdf = new jsPDF({ encryption: { userPassword: 'test', ownerPassword: 'owner', userPermissions: [] } });
  protectedPdf.text('Protected text', 20, 20);
  const tooMany = new jsPDF(); for (let i = 1; i < 101; i++) tooMany.addPage();
  const oversized = new jsPDF({ unit: 'pt', format: [2000, 2000] });
  for (const [name, fixture, message] of [
    ['protected.pdf', protectedPdf, /Password-protected/],
    ['too-many.pdf', tooMany, /1 to 100/],
    ['oversized.pdf', oversized, /page size/],
  ]) {
    await upload(name, Buffer.from(fixture.output('arraybuffer')).toString('base64'));
    await evaluate(`document.querySelector('.convert-button').click()`);
    await waitFor(`!!document.querySelector('[role=alert]')`);
    assert.match(await evaluate(`document.querySelector('[role=alert]').textContent`), message);
    assert.equal(await evaluate(`document.querySelector('.convert-button').disabled`), false);
  }
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  pdf.saveGraphicsState(); pdf.rect(0, 0, 595.28, 841.89); pdf.clip(); pdf.discardPath();
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(28); pdf.setTextColor('#2563eb');
  pdf.text('Color & content verification', 45, 70);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(12); pdf.setTextColor('#202938');
  pdf.text('This paragraph must be editable in the Word document.', 45, 110);
  pdf.setTextColor('#e11d48'); pdf.text('Red text', 45, 145);
  pdf.setTextColor('#16a34a'); pdf.text('Green text', 130, 145);
  pdf.setFillColor('#e7eefb'); pdf.rect(45, 180, 460, 70, 'F');
  pdf.setDrawColor('#475569'); pdf.rect(45, 180, 460, 70); pdf.line(260, 180, 260, 250); pdf.line(45, 215, 505, 215);
  pdf.setTextColor('#123456'); pdf.text('Table cell one', 55, 202); pdf.text('Table cell two', 270, 202);
  pdf.text('All content retained', 55, 237); pdf.text('Images and colors', 270, 237);
  pdf.addImage(imageBase64, 'PNG', 45, 285, 150, 100);
  pdf.setFillColor('#101f42'); pdf.rect(0, 760, 595.28, 81.89, 'F');
  pdf.setTextColor('#ffffff'); pdf.text('White footer text on a dark background', 45, 795);
  pdf.restoreGraphicsState();
  pdf.addPage('a4', 'landscape'); pdf.setTextColor('#16a34a'); pdf.setFontSize(24);
  pdf.text('Landscape second page', 45, 70);
  pdf.setFillColor('#f97316'); pdf.circle(130, 180, 65, 'F');
  const scannedImage = await evaluate(`(() => { const c = document.createElement('canvas'); c.width = 900; c.height = 1200; const x = c.getContext('2d'); x.fillStyle = '#f4f0ff'; x.fillRect(0,0,900,1200); x.fillStyle = '#5332b3'; x.font = 'bold 48px Arial'; x.fillText('Scanned page content',60,120); x.fillStyle = '#e11d48'; x.fillRect(60,200,500,160); return c.toDataURL('image/png').split(',')[1]; })()`);
  pdf.addPage('a4', 'portrait'); pdf.addImage(scannedImage, 'PNG', 0, 0, 595.28, 841.89);
  const sourcePdf = Buffer.from(pdf.output('arraybuffer'));
  await writeFile(path.join(root, '.runtime', 'pdf-word-source.pdf'), sourcePdf);
  async function saveWord(filename, { pages = 3, landscape = true } = {}) {
    const encoded = await evaluate(`(async () => { const blob = await (await fetch(document.querySelector('a[download]').href)).blob(); return await new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result.split(',')[1]); r.readAsDataURL(blob); }); })()`);
    const bytes = Buffer.from(encoded, 'base64');
    await writeFile(path.join(root, '.runtime', filename), bytes);
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml').async('string');
    assert.equal((xml.match(/<w:sectPr[ >]/g) || []).length, pages, 'PDF pages were lost');
    if (landscape) assert.match(xml, /w:w="16838" w:h="11906"/, 'Landscape PDF size was lost');
    assert.equal(Object.keys(zip.files).filter(name => name.startsWith('word/media/') && name.endsWith('.png')).length, pages);
    const text = [...xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(match => match[1]).join('');
    return { zip, xml, text };
  }
  await upload('R\u00e9sum\u00e9.colors.PDF', sourcePdf.toString('base64'));
  await evaluate(`document.querySelector('input[value=appearance]').click()`);
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('.result-state') || !!document.querySelector('[role=alert]')`);
  if (await evaluate(`!!document.querySelector('[role=alert]')`)) throw new Error(await evaluate(`document.querySelector('[role=alert]').textContent`));
  assert.equal(await evaluate(`document.querySelector('a[download]').download`), 'R\u00e9sum\u00e9.colors.docx');
  assert.match(await evaluate(`document.querySelector('.output-details').textContent`), /not editable/);
  const appearance = await saveWord('pdf-word-appearance.docx');
  const media = await Promise.all(Object.values(appearance.zip.files).filter(file => file.name.endsWith('.png')).map(file => file.async('base64')));
  assert.ok(await evaluate(`(async () => { const image = await createImageBitmap(new Blob([Uint8Array.from(atob(${JSON.stringify(media[0])}), c => c.charCodeAt(0))], { type: 'image/png' })); const c = document.createElement('canvas'); c.width=image.width; c.height=image.height; const x=c.getContext('2d'); x.drawImage(image,0,0); const pixels=x.getImageData(0,0,c.width,c.height).data; let red=0,blue=0; for(let i=0;i<pixels.length;i+=4) { if(pixels[i]>180 && pixels[i+1]<100 && pixels[i+2]<100) red++; if(pixels[i]<80 && pixels[i+1]<150 && pixels[i+2]>180) blue++; } image.close(); return red>1000 && blue>500; })()`), 'Page colors missing');
  await evaluate(`document.querySelector('.result-state button').click()`);
  await upload('editable.pdf', sourcePdf.toString('base64'));
  assert.equal(await evaluate(`document.querySelector('input[value=editable]').checked`), true, 'New conversions must return to editable mode');
  await screenshot('design-pdf-word-selected.png');
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('.result-state') || !!document.querySelector('[role=alert]')`);
  if (await evaluate(`!!document.querySelector('[role=alert]')`)) throw new Error(await evaluate(`document.querySelector('[role=alert]').textContent`));
  assert.match(await evaluate(`document.querySelector('.output-details').textContent`), /3 editable pages/);
  assert.match(await evaluate(`document.querySelector('.output-details').textContent`), /1 page recognized with OCR/);
  const editable = await saveWord('pdf-word-editable.docx');
  for (const content of ['Color &amp; content verification', 'Table cell one', 'Table cell two', 'Landscape second page', 'White footer text on a dark background', 'Scanned page content']) assert.ok(editable.text.includes(content), 'Editable text lost: ' + content);
  for (const color of ['2563EB', 'E11D48', '16A34A', 'FFFFFF']) assert.ok(editable.xml.includes('w:val="' + color + '"'), 'Text color lost: ' + color);
  assert.ok(editable.xml.includes('w:framePr'), 'Editable text positions missing');
  await screenshot('design-pdf-word-success.png');
  await evaluate(`document.querySelector('.result-state button').click()`);
  const hindiImage = await evaluate(`(() => { const c = document.createElement('canvas'); c.width = 1200; c.height = 700; const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0,0,1200,700); x.fillStyle = '#1456aa'; x.font = '48px "Nirmala UI", Arial'; x.fillText('\u092F\u0939 \u090F\u0915 \u0939\u093F\u0902\u0926\u0940 \u0926\u0938\u094D\u0924\u093E\u0935\u0947\u091C \u0939\u0948',60,120); return c.toDataURL('image/png').split(',')[1]; })()`);
  const hindiPdf = new jsPDF({ unit: 'pt', format: 'a4' });
  hindiPdf.addImage(hindiImage, 'PNG', 0, 0, 595.28, 347.25);
  await upload('hindi-scan.pdf', Buffer.from(hindiPdf.output('arraybuffer')).toString('base64'));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('.result-state') || !!document.querySelector('[role=alert]')`);
  if (await evaluate(`!!document.querySelector('[role=alert]')`)) throw new Error(await evaluate(`document.querySelector('[role=alert]').textContent`));
  const hindiWord = await saveWord('pdf-word-hindi.docx', { pages: 1, landscape: false });
  assert.match(hindiWord.xml, /[\u0900-\u097F]/u, 'Scanned Hindi text must become Word text');
  assert.match(hindiWord.xml, /Nirmala UI/, 'Hindi text needs a suitable Word font');
  await evaluate(`document.querySelector('.result-state button').click()`);
  const emptyPdf = new jsPDF();
  await upload('no-text.pdf', Buffer.from(emptyPdf.output('arraybuffer')).toString('base64'));
  await evaluate(`document.querySelector('.ocr-language select').value = 'eng'; document.querySelector('.ocr-language select').dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('[role=alert]')`);
  assert.match(await evaluate(`document.querySelector('[role=alert]').textContent`), /No readable text/);
  assert.equal(await evaluate(`!!document.querySelector('a[download]')`), false, 'Do not label an image-only document as editable');
  await evaluate(`document.querySelector('[aria-label="Remove selected document"]').click()`);
  const rotated = new jsPDF({ unit: 'pt' });
  rotated.setTextColor('#2563eb'); rotated.text('Keep rotated content', 140, 200, { angle: 90 });
  await upload('rotated.pdf', Buffer.from(rotated.output('arraybuffer')).toString('base64'));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`!!document.querySelector('.result-state') || !!document.querySelector('[role=alert]')`);
  if (await evaluate(`!!document.querySelector('[role=alert]')`)) {
    assert.match(await evaluate(`document.querySelector('[role=alert]').textContent`), /No readable text/);
    await evaluate(`document.querySelector('[aria-label="Remove selected document"]').click()`);
  } else {
    assert.match(await evaluate(`document.querySelector('.output-details').textContent`), /1 editable page/);
    await evaluate(`document.querySelector('.result-state button').click()`);
  }
  await upload('cancel.pdf', sourcePdf.toString('base64'));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`/text recognition|scanned text/.test(document.querySelector('.progress-track')?.textContent || '')`);
  assert.equal(await evaluate(`document.querySelector('.direction-switch button').disabled`), true);
  await evaluate(`document.querySelector('.cancel-conversion').click()`);
  await waitFor(`!document.querySelector('.convert-button').disabled`);
  assert.equal(await evaluate(`!!document.querySelector('.result-state')`), false);

  // Merge original PDF pages after previewing and reordering both files.
  await send('Page.navigate', { url: new URL('/tools/merge-pdf', baseUrl).href });
  await waitFor(`location.pathname === '/tools/merge-pdf' && document.querySelector('.converter')?.getAttribute('aria-label') === 'Merge PDF converter'`);
  await waitFor(`document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false`);
  const firstMergePdf = new jsPDF({ unit: 'pt', format: 'a4' });
  firstMergePdf.setTextColor('#2563eb'); firstMergePdf.text('First document, page one', 40, 60);
  firstMergePdf.addPage(); firstMergePdf.text('First document, page two', 40, 60);
  const secondMergePdf = new jsPDF({ unit: 'pt', format: [500, 300], orientation: 'landscape' });
  secondMergePdf.setTextColor('#16a34a'); secondMergePdf.text('Second document comes first after reordering', 35, 55);
  await uploadMany([
    { name: 'first.pdf', type: 'application/pdf', base64: Buffer.from(firstMergePdf.output('arraybuffer')).toString('base64') },
    { name: 'second.pdf', type: 'application/pdf', base64: Buffer.from(secondMergePdf.output('arraybuffer')).toString('base64') },
  ]);
  await waitFor(`document.querySelectorAll('.merge-document-card').length === 2 && document.querySelectorAll('.merge-page-strip figure').length === 3 && !document.querySelector('.merge-pdf-button').disabled`);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.merge-document-head strong')].map(item => item.textContent)`), ['first.pdf', 'second.pdf'], 'Merge preview must show both PDFs in selection order');
  await evaluate(`document.querySelector('[aria-label="Move second.pdf earlier"]').click()`);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.merge-document-head strong')].map(item => item.textContent)`), ['second.pdf', 'first.pdf'], 'Merge controls must change PDF order');
  await viewport(390, 844, true);
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, 'Merge PDF previews overflow on mobile');
  await screenshot('design-merge-pdf-preview.png');
  await viewport(1440, 1100);
  await evaluate(`document.querySelector('.merge-pdf-button').click()`);
  await waitFor(`!!document.querySelector('.merge-result a[download]') || !!document.querySelector('[role=alert]')`);
  if (await evaluate(`!!document.querySelector('[role=alert]')`)) throw new Error(await evaluate(`document.querySelector('[role=alert]').textContent`));
  assert.equal(await evaluate(`document.querySelector('.merge-result a').download`), 'second-merged.pdf');
  const mergedBase64 = await evaluate(`(async () => { const blob = await (await fetch(document.querySelector('.merge-result a').href)).blob(); return await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.readAsDataURL(blob); }); })()`);
  const mergedBytes = Buffer.from(mergedBase64, 'base64');
  const mergedDocument = await PDFDocument.load(mergedBytes);
  assert.equal(mergedDocument.getPageCount(), 3, 'Merged PDF must contain every source page');
  const [mergedFirstPage, mergedSecondPage] = mergedDocument.getPages();
  assert.ok(mergedFirstPage.getWidth() > mergedFirstPage.getHeight(), 'Reordered PDF must supply the first merged page');
  assert.ok(mergedSecondPage.getHeight() > mergedSecondPage.getWidth(), 'Original portrait pages must follow the reordered PDF');
  await writeFile(path.join(root, '.runtime', 'merged-result.pdf'), mergedBytes);

  // Split one PDF at multiple visual break points and preserve every page.
  await send('Page.navigate', { url: new URL('/tools/split-pdf', baseUrl).href });
  await waitFor(`location.pathname === '/tools/split-pdf' && document.querySelector('.converter')?.getAttribute('aria-label') === 'Split PDF converter'`);
  await waitFor(`document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false`);
  const splitSource = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  splitSource.setTextColor('#2563eb'); splitSource.text('Split source page 1', 40, 60);
  splitSource.addPage('a4', 'portrait'); splitSource.text('Split source page 2', 40, 60);
  splitSource.addPage([500, 300], 'landscape'); splitSource.text('Split source page 3 landscape', 35, 55);
  splitSource.addPage([500, 300], 'landscape'); splitSource.text('Split source page 4 landscape', 35, 55);
  splitSource.addPage([240, 420], 'portrait'); splitSource.text('Split source page 5', 30, 50);
  await upload('quarterly-report.pdf', Buffer.from(splitSource.output('arraybuffer')).toString('base64'));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`document.querySelectorAll('.split-page-card').length === 5 || !!document.querySelector('[role=alert]')`);
  if (await evaluate(`!!document.querySelector('[role=alert]')`)) throw new Error(await evaluate(`document.querySelector('[role=alert]').textContent`));
  const splitControl = await evaluate(`(() => { const button = document.querySelector('[aria-label="Split after page 2"]'); const style = getComputedStyle(button); const box = button.getBoundingClientRect(); return { text: button.textContent.trim(), display: style.display, visibility: style.visibility, color: style.color, fill: style.webkitTextFillColor, width: box.width, height: box.height }; })()`);
  assert.match(splitControl.text, /Split after page 2/);
  assert.ok(splitControl.display !== 'none' && splitControl.visibility === 'visible' && splitControl.width > 80 && splitControl.height >= 40 && splitControl.color !== 'rgba(0, 0, 0, 0)' && splitControl.fill !== 'rgba(0, 0, 0, 0)', `Split control must be clearly visible: ${JSON.stringify(splitControl)}`);
  await evaluate(`document.querySelector('[aria-label="Split after page 2"]').click(); document.querySelector('[aria-label="Split after page 4"]').click()`);
  await waitFor(`document.querySelectorAll('.split-page-card.split-selected').length === 2 && !document.querySelector('.split-pdf-button').disabled`);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.split-range-list > span')].map(item => item.textContent.replace(/\\s+/g, ' ').trim())`), ['Part 1 Pages 1–2', 'Part 2 Pages 3–4', 'Part 3 Pages 5–5'], 'Split ranges must match the selected page breaks');
  assert.match(await evaluate(`document.querySelector('.split-pdf-button').textContent`), /Create 3 PDF parts/);
  await viewport(390, 844, true);
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, 'Split PDF previews overflow on mobile');
  await screenshot('design-split-pdf-preview.png');
  await viewport(1440, 1100);
  await evaluate(`document.querySelector('.split-pdf-button').click()`);
  await waitFor(`!!document.querySelector('.split-results') || !!document.querySelector('[role=alert]')`);
  if (await evaluate(`!!document.querySelector('[role=alert]')`)) throw new Error(await evaluate(`document.querySelector('[role=alert]').textContent`));
  assert.equal(await evaluate(`document.querySelectorAll('.split-result-list a[download]').length`), 3, 'Split tool must offer every PDF part separately');
  assert.equal(await evaluate(`document.querySelector('.split-results-heading a').download`), 'quarterly-report-split-parts.zip');
  const splitArchiveBase64 = await evaluate(`(async () => { const blob = await (await fetch(document.querySelector('.split-results-heading a').href)).blob(); return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob); }); })()`);
  const splitArchive = await JSZip.loadAsync(Buffer.from(splitArchiveBase64, 'base64'));
  assert.equal(Object.values(splitArchive.files).filter(entry => !entry.dir && entry.name.endsWith('.pdf')).length, 3, 'Download-all ZIP must contain every split PDF part');
  const splitPartsBase64 = await evaluate(`Promise.all([...document.querySelectorAll('.split-result-list a')].map(async link => { const blob = await (await fetch(link.href)).blob(); return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob); }); }))`);
  const splitDocuments = await Promise.all(splitPartsBase64.map(value => PDFDocument.load(Buffer.from(value, 'base64'))));
  assert.deepEqual(splitDocuments.map(document => document.getPageCount()), [2, 2, 1], 'Split PDF parts must contain the selected page ranges');
  assert.ok(splitDocuments[0].getPage(0).getHeight() > splitDocuments[0].getPage(0).getWidth(), 'First split part must preserve portrait pages');
  assert.ok(splitDocuments[1].getPage(0).getWidth() > splitDocuments[1].getPage(0).getHeight(), 'Second split part must preserve landscape pages');
  assert.ok(splitDocuments[2].getPage(0).getHeight() > splitDocuments[2].getPage(0).getWidth(), 'Last split part must preserve its portrait page');
  await Promise.all(splitPartsBase64.map((value, index) => writeFile(path.join(root, '.runtime', `split-result-${index + 1}.pdf`), Buffer.from(value, 'base64'))));

  // Compress an image-heavy PDF with visual page previews and a clear quality choice.
  await send('Page.navigate', { url: new URL('/tools/compress-pdf', baseUrl).href });
  await waitFor(`location.pathname === '/tools/compress-pdf' && document.querySelector('.converter')?.getAttribute('aria-label') === 'Compress PDF converter'`);
  await waitFor(`document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false`);
  const compressionSource = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait', compress: false });
  const compressionWidth = 700;
  const compressionHeight = 900;
  for (let page = 0; page < 3; page++) {
    if (page) compressionSource.addPage('a4', 'portrait');
    const pixels = new Uint8ClampedArray(compressionWidth * compressionHeight * 4);
    for (let pixel = 0; pixel < compressionWidth * compressionHeight; pixel++) {
      const offset = pixel * 4;
      const x = pixel % compressionWidth;
      const y = Math.floor(pixel / compressionWidth);
      pixels[offset] = (x * 3 + y + page * 41) % 256;
      pixels[offset + 1] = (x + y * 2 + page * 79) % 256;
      pixels[offset + 2] = (x * 2 + y * 3 + page * 23) % 256;
      pixels[offset + 3] = 255;
    }
    compressionSource.addImage({ data: pixels, width: compressionWidth, height: compressionHeight }, 'RGBA', 0, 0, 595.28, 841.89);
    compressionSource.setFillColor(255, 255, 255); compressionSource.roundedRect(32, 32, 260, 42, 7, 7, 'F');
    compressionSource.setTextColor('#0f172a'); compressionSource.text(`Compression quality page ${page + 1}`, 48, 58);
  }
  const compressionBytes = Buffer.from(compressionSource.output('arraybuffer'));
  assert.ok(compressionBytes.length < 20 * 1024 * 1024, 'Compression browser fixture must stay within the upload limit');
  await upload('photo-report.pdf', compressionBytes.toString('base64'));
  await evaluate(`document.querySelector('.convert-button').click()`);
  await waitFor(`document.querySelectorAll('.compress-page-strip figure').length === 3 || !!document.querySelector('[role=alert]')`);
  if (await evaluate(`!!document.querySelector('[role=alert]')`)) throw new Error(await evaluate(`document.querySelector('[role=alert]').textContent`));
  assert.equal(await evaluate(`document.querySelectorAll('.compress-options > button').length`), 4, 'Compress tool must provide three quality presets and a custom target size');
  assert.match(await evaluate(`document.querySelector('.compress-options > button[aria-pressed="true"]').textContent`), /Exact quality/);
  await evaluate(`document.querySelectorAll('.compress-options > button')[1].click()`);
  await waitFor(`document.querySelector('.compress-mode-note')?.classList.contains('flattened')`);
  assert.match(await evaluate(`document.querySelector('.compress-mode-note').textContent`), /page dimensions stay the same/i);
  await evaluate(`document.querySelectorAll('.compress-options > button')[3].click()`);
  await waitFor(`!!document.querySelector('.compress-target-size')`);
  await evaluate(`document.querySelector('#compress-target-value').value = '1'; document.querySelector('#compress-target-value').dispatchEvent(new Event('input', { bubbles: true }));`);
  assert.equal(await evaluate(`document.querySelector('.compress-target-size select').value`), 'MB');
  assert.match(await evaluate(`document.querySelector('.compress-mode-note').textContent`), /best-effort maximum/i);
  await viewport(390, 844, true);
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, 'Compress PDF controls overflow on mobile');
  await screenshot('design-compress-pdf-preview.png');
  await viewport(1440, 1100);
  await evaluate(`document.querySelector('.compress-pdf-button').click()`);
  await waitFor(`!!document.querySelector('.compress-result a[download]') || !!document.querySelector('[role=alert]')`);
  if (await evaluate(`!!document.querySelector('[role=alert]')`)) throw new Error(await evaluate(`document.querySelector('[role=alert]').textContent`));
  assert.equal(await evaluate(`document.querySelector('.compress-result a').download`), 'photo-report-compressed.pdf');
  const compressedBase64 = await evaluate(`(async () => { const blob = await (await fetch(document.querySelector('.compress-result a').href)).blob(); return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob); }); })()`);
  const compressedBytes = Buffer.from(compressedBase64, 'base64');
  const compressedDocument = await PDFDocument.load(compressedBytes);
  assert.equal(compressedDocument.getPageCount(), 3, 'Compressed PDF must preserve every source page');
  assert.ok(compressedBytes.length < compressionBytes.length, 'Target-size compression must reduce the image-heavy PDF fixture');
  assert.ok(compressedBytes.length <= 1024 * 1024, 'Custom 1 MB target must be met for the compressible browser fixture');
  assert.ok(compressedDocument.getPage(0).getHeight() > compressedDocument.getPage(0).getWidth(), 'Compression must preserve portrait page dimensions');
  assert.match(await evaluate(`document.querySelector('.compress-result strong').textContent`), /Target size reached/i);
  await writeFile(path.join(root, '.runtime', 'compressed-result.pdf'), compressedBytes);

  // Compress a high-detail PNG with preview, presets and a custom KB target.
  await send('Page.navigate', { url: new URL('/tools/compress-image', baseUrl).href });
  await waitFor(`location.pathname === '/tools/compress-image' && document.querySelector('.converter')?.getAttribute('aria-label') === 'Compress Image converter'`);
  await waitFor(`document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false`);
  const compressionImageBase64 = await evaluate(`(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 800;
    const context = canvas.getContext('2d'); const image = context.createImageData(canvas.width, canvas.height);
    let seed = 246813579;
    for (let pixel = 0; pixel < canvas.width * canvas.height; pixel++) {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      const offset = pixel * 4; const x = pixel % canvas.width; const y = Math.floor(pixel / canvas.width);
      image.data[offset] = ((seed >>> 0) + x * 3) % 256;
      image.data[offset + 1] = ((seed >>> 8) + y * 2) % 256;
      image.data[offset + 2] = ((seed >>> 16) + x + y) % 256;
      image.data[offset + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    context.fillStyle = 'rgba(255,255,255,.92)'; context.fillRect(45, 45, 470, 86);
    context.fillStyle = '#0f172a'; context.font = '700 35px Arial'; context.fillText('Toolifybox image quality', 70, 99);
    return canvas.toDataURL('image/png').split(',')[1];
  })()`);
  const compressionImageBytes = Buffer.from(compressionImageBase64, 'base64');
  assert.ok(compressionImageBytes.length > 500 * 1024 && compressionImageBytes.length < 20 * 1024 * 1024, 'Image compression fixture must be large and stay within the upload limit');
  await upload('large-artwork.png', compressionImageBase64);
  await waitFor(`!!document.querySelector('.compress-image-preview img') || !!document.querySelector('[role=alert]')`);
  if (await evaluate(`!!document.querySelector('[role=alert]')`)) throw new Error(await evaluate(`document.querySelector('[role=alert]').textContent`));
  assert.equal(await evaluate(`document.querySelectorAll('.image-compress-options > button').length`), 4, 'Image compressor must provide three quality presets and a custom target size');
  assert.match(await evaluate(`document.querySelector('.image-compress-options > button[aria-pressed="true"]').textContent`), /High quality/);
  assert.match(await evaluate(`document.querySelector('.compress-image-summary span').textContent`), /1200 × 800 px/);
  await evaluate(`document.querySelectorAll('.image-compress-options > button')[3].click()`);
  await waitFor(`!!document.querySelector('#compress-image-target')`);
  await evaluate(`document.querySelector('#compress-image-target').value = '180'; document.querySelector('#compress-image-target').dispatchEvent(new Event('input', { bubbles: true }));`);
  assert.equal(await evaluate(`document.querySelector('.compress-target-size select').value`), 'KB');
  await viewport(390, 844, true);
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, 'Compress Image controls overflow on mobile');
  await screenshot('design-compress-image-preview.png');
  await viewport(1440, 1100);
  await evaluate(`document.querySelector('.compress-image-button').click()`);
  await waitFor(`!!document.querySelector('.image-compress-result a[download]') || !!document.querySelector('[role=alert]')`);
  if (await evaluate(`!!document.querySelector('[role=alert]')`)) throw new Error(await evaluate(`document.querySelector('[role=alert]').textContent`));
  assert.equal(await evaluate(`document.querySelector('.image-compress-result a').download`), 'large-artwork-compressed.webp');
  const compressedImage = await evaluate(`(async () => {
    const blob = await (await fetch(document.querySelector('.image-compress-result a').href)).blob();
    const bitmap = await createImageBitmap(blob);
    const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob); });
    const output = { base64, size: blob.size, type: blob.type, width: bitmap.width, height: bitmap.height }; bitmap.close(); return output;
  })()`);
  assert.equal(compressedImage.type, 'image/webp', 'Custom target image should use efficient WebP compression');
  assert.ok(compressedImage.size < compressionImageBytes.length, 'Custom target must reduce the PNG fixture');
  assert.ok(compressedImage.size <= 180 * 1024, 'Custom 180 KB image target must be met for the compressible fixture');
  assert.ok(compressedImage.width > 0 && compressedImage.height > 0, 'Compressed image must remain readable with valid dimensions');
  assert.match(await evaluate(`document.querySelector('.image-compress-result strong').textContent`), /Target size reached/i);
  await writeFile(path.join(root, '.runtime', 'compressed-image.webp'), Buffer.from(compressedImage.base64, 'base64'));

  await viewport(390, 844, true);
  await send('Page.navigate', { url: new URL('/contact', baseUrl).href });
  await waitFor(`!!document.querySelector('form[name="contact"]')`);
  await waitFor(`document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false`);
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, 'Contact page overflows on mobile');
  assert.equal(await evaluate(`document.querySelector('form[name="contact"]').hasAttribute('data-netlify')`), true);
  assert.equal(await evaluate(`document.querySelector('input[name="form-name"]')?.value`), 'contact');
  await screenshot('contact-mobile.png');

  await viewport(1440, 1000);
  await send('Page.navigate', { url: new URL('/about', baseUrl).href });
  await waitFor(`!!document.querySelector('h1') && !!document.querySelector('.about-tools-grid')`);
  await waitFor(`document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false`);
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, 'About page overflows on desktop');
  assert.equal(await evaluate(`document.querySelectorAll('.about-tools-grid a').length`), 8, 'About page should link to every active tool');
  await screenshot('about-desktop.png');

  await viewport(390, 844, true);
  await send('Page.navigate', { url: new URL('/privacy-policy', baseUrl).href });
  await waitFor(`!!document.querySelector('#privacy-content') && document.querySelectorAll('.legal-content > section').length >= 10`);
  await waitFor(`document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false`);
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, 'Privacy Policy overflows on mobile');
  assert.equal(await evaluate(`document.querySelector('time')?.getAttribute('datetime')`), '2026-10-16');
  const mobileVersion = await evaluate(`(() => { const badge = document.querySelector('.site-version'); const parent = badge.parentElement; const box = badge.getBoundingClientRect(); const parentBox = parent.getBoundingClientRect(); return { text: badge.textContent.trim(), width: box.width, height: box.height, inside: box.left >= parentBox.left && box.right <= parentBox.right && box.top >= parentBox.top && box.bottom <= parentBox.bottom, whiteSpace: getComputedStyle(badge).whiteSpace }; })()`);
  assert.equal(mobileVersion.text, `v${SITE_VERSION}`, 'Mobile footer must show the complete configured version');
  assert.equal(mobileVersion.inside, true, 'Mobile version badge must stay fully inside the footer');
  assert.ok(mobileVersion.width > 30 && mobileVersion.height >= 24 && mobileVersion.whiteSpace === 'nowrap', 'Mobile version badge is clipped');
  await screenshot('privacy-policy-mobile.png');

  await viewport(1440, 1000);
  await send('Page.navigate', { url: new URL('/terms-and-conditions', baseUrl).href });
  await waitFor(`!!document.querySelector('#terms-content') && document.querySelectorAll('.legal-content > section').length >= 12`);
  await waitFor(`document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false`);
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, 'Terms and Conditions overflows on desktop');
  assert.equal(await evaluate(`!!document.querySelector('a[href="/privacy-policy"]')`), true, 'Terms must link to the Privacy Policy');
  await screenshot('terms-and-conditions-desktop.png');

  await send('Page.navigate', { url: baseUrl });
  await waitFor(`!!document.querySelector('.theme-toggle')`);
  await waitFor(`document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false`);
  assert.equal(await evaluate(`!!document.querySelector('#converter')`), false, 'Landing page should not embed the converter');
  assert.equal(await evaluate(`!!document.querySelector('a[href="/tools"]')`), true, 'Landing page should link to the Tools page');
  await revealPage();
  await screenshot('landing-desktop.png');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.hero-copy > *')).animationName`), 'none');
  assert.deepEqual(uploads, [], 'Document data was sent over HTTP');
  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(hydrationWarnings, [], 'Nuxt hydration warnings');
  if (process.env.TOOLIFYBOX_TEST_PDF_ONLY) console.log('PDF-to-Word browser checks passed: editable by default, real Word text, English/Hindi OCR, text colors, clipping, blank-page errors, page-image option, OCR cancellation, mobile layout, and zero uploads.');
  else console.log(`Browser-only checks passed: default light theme, saved dark theme across routes, desktop/mobile/320px, arranged images to a 3-page PDF, selected PDF pages to JPG ZIP, merged PDFs, split PDFs with multiple page breaks and ZIP download, compressed PDFs and images with custom target sizes, actual PDF output, page defaults, zero margins, mixed orientations, repeated headers/footers, cancellation, recovery, frame cleanup, ${pageCount}-page report, editable Word text, English/Hindi OCR, blank-page errors, and zero document uploads.`);
} finally {
  socket?.close(); chrome.kill();
  for (const { timer } of pending.values()) clearTimeout(timer);
}
