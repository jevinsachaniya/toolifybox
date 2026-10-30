import { validateDocxPackage, pageSliceEnd } from './docx-package.js';
import { runConversionTask } from './conversion-task.js';

const MAX_PAGES = 450;
const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 0));

function checkCancelled(signal) {
  if (signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError');
}

function contentBoundaries(section, frameDocument) {
  const origin = section.getBoundingClientRect().top;
  const boundaries = [];
  const walker = frameDocument.createTreeWalker(section, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    if (walker.currentNode.parentElement?.closest('header, footer')) continue;
    if (!walker.currentNode.textContent.trim()) continue;
    const range = frameDocument.createRange();
    range.selectNodeContents(walker.currentNode);
    for (const rect of range.getClientRects()) boundaries.push([rect.top - origin, rect.bottom - origin]);
  }
  for (const element of section.querySelectorAll('img, tr')) {
    if (element.closest('header, footer')) continue;
    const rect = element.getBoundingClientRect();
    boundaries.push([rect.top - origin, rect.bottom - origin]);
  }
  return boundaries.sort((a, b) => b[0] - a[0]);
}

async function waitForImages(frameDocument) {
  await Promise.all([...frameDocument.images].map(image => {
    if (image.complete) return Promise.resolve();
    return new Promise(resolve => {
      const timer = setTimeout(resolve, 5000);
      const complete = () => { clearTimeout(timer); resolve(); };
      image.addEventListener('load', complete, { once: true });
      image.addEventListener('error', complete, { once: true });
    });
  }));
  for (const image of frameDocument.images) {
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('An image in this document could not be loaded. Replace linked or damaged images with embedded PNG or JPG images in Word.');
  }
}

export async function convertDocument(file, { signal, onProgress = () => {} } = {}) {
  let frame;
  try {
    checkCancelled(signal);
    onProgress('Reading your Word document…');
    const data = await runConversionTask(() => file.arrayBuffer(), { signal, timeout: 15000 });
    validateDocxPackage(data);
    const [{ renderAsync }, { default: html2canvas }, { jsPDF }] = await runConversionTask(() => Promise.all([
      import('docx-preview'), import('html2canvas'), import('jspdf'),
    ]), { signal, timeout: 30000, message: 'The converter could not load. Check your connection, refresh this page, and try again.' });
    checkCancelled(signal);
    onProgress('Preparing the document layout…');

    // Render in an isolated document, without app styles, scripts, or external resources.
    frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-same-origin');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('data-document-renderer', '');
    frame.tabIndex = -1;
    Object.assign(frame.style, { position: 'fixed', left: '-100000px', top: '0', width: '2000px', height: '1200px', border: '0', pointerEvents: 'none' });
    document.body.appendChild(frame);
    const frameDocument = frame.contentDocument;
    frameDocument.open();
    frameDocument.write(`<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; font-src data: blob:; style-src 'unsafe-inline'"><style>html,body{margin:0;background:white;color:black}body{font-family:Arial,sans-serif}section.docx{box-shadow:none!important;margin:0!important}a{color:inherit;text-decoration:none}</style></head><body><div id="styles"></div><div id="document"></div></body></html>`);
    frameDocument.close();
    await runConversionTask(() => renderAsync(data, frameDocument.getElementById('document'), frameDocument.getElementById('styles'), {
      inWrapper: false, useBase64URL: true, ignoreLastRenderedPageBreak: true,
      renderAltChunks: false, renderComments: false, renderChanges: false,
    }), { signal, timeout: 45000, message: 'The document layout took too long to prepare. Try a smaller file or fewer images.' });
    checkCancelled(signal);
    for (const link of frameDocument.querySelectorAll('a')) link.removeAttribute('href');
    await runConversionTask(() => frameDocument.fonts.ready, { signal, timeout: 15000, message: 'Document fonts did not finish loading. Try saving the document with standard fonts.' });
    await runConversionTask(() => waitForImages(frameDocument), { signal, timeout: 15000, message: 'Document images did not finish loading. Try smaller images.' });
    const sections = [...frameDocument.querySelectorAll('section.docx')];
    if (!sections.length) throw new Error('We couldn’t read any pages in this document. Please choose another .docx file.');
    let inheritedHeader;
    let inheritedFooter;
    for (const section of sections) {
      if (!section.style.width || section.style.width === 'auto') section.style.width = '210mm';
      if (!section.style.minHeight || section.style.minHeight === 'auto') section.style.minHeight = '297mm';
      section.style.flexShrink = '0';
      let header = section.querySelector(':scope > header');
      let footer = section.querySelector(':scope > footer');
      if (!header && inheritedHeader) { header = inheritedHeader.cloneNode(true); section.prepend(header); }
      if (!footer && inheritedFooter) { footer = inheritedFooter.cloneNode(true); section.append(footer); }
      inheritedHeader = header;
      inheritedFooter = footer;
    }
    // Let the browser lay out the fallback dimensions before measuring page slices.
    await yieldToBrowser();

    let pdf;
    let pageCount = 0;
    for (const section of sections) {
      checkCancelled(signal);
      const style = frame.contentWindow.getComputedStyle(section);
      const width = section.getBoundingClientRect().width;
      const pageHeight = parseFloat(style.minHeight) || width * 297 / 210;
      if (width < 192 || width > 1920 || pageHeight < 192 || pageHeight > 1920) throw new Error('This document uses unsupported page dimensions. Try standard A4 or Letter pages.');
      let totalHeight = Math.max(section.scrollHeight, Math.ceil(section.getBoundingClientRect().height));
      const boundaries = contentBoundaries(section, frameDocument);
      // Overflow pages already receive a bottom margin in the PDF. Do not turn
      // the source section's trailing padding into an extra empty page.
      if (totalHeight > pageHeight + 2 && boundaries.length) {
        const contentEnd = boundaries.reduce((end, [, bottom]) => Math.max(end, bottom), 0);
        totalHeight = Math.max(pageHeight, Math.min(totalHeight, Math.ceil(contentEnd)));
      }
      const topMargin = Number.isFinite(parseFloat(style.paddingTop)) ? parseFloat(style.paddingTop) : 32;
      const bottomMargin = Number.isFinite(parseFloat(style.paddingBottom)) ? parseFloat(style.paddingBottom) : 32;
      if (topMargin + bottomMargin > pageHeight * .6) throw new Error('This document’s margins leave too little space to convert. Try smaller margins.');
      const overflow = totalHeight > pageHeight + 2;
      const decorations = [];
      const sectionRect = section.getBoundingClientRect();
      for (const element of section.querySelectorAll(':scope > header, :scope > footer')) {
        const rect = element.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1 || (!element.textContent.trim() && !element.querySelector('img, svg'))) continue;
        const isFooter = element.tagName === 'FOOTER';
        const y = isFooter ? pageHeight - (sectionRect.bottom - rect.top) : rect.top - sectionRect.top;
        const canvas = await runConversionTask(() => html2canvas(element, {
          backgroundColor: '#ffffff', scale: Math.min(1.7, 1400 / width),
          width: rect.width, height: rect.height, scrollX: 0, scrollY: 0,
          windowWidth: 2000, windowHeight: Math.max(1200, Math.ceil(sectionRect.height)),
          logging: false, allowTaint: false, useCORS: false,
        }), { signal, timeout: 30000 });
        try {
          decorations.push({ image: canvas.toDataURL('image/jpeg', .92), x: rect.left - sectionRect.left, y: Math.max(0, y), width: rect.width, height: rect.height });
        } finally { canvas.width = 0; canvas.height = 0; }
      }
      let offset = 0;
      while (offset < totalHeight) {
        if (++pageCount > MAX_PAGES) throw new Error('Browser conversion supports up to 450 pages. Please split this document into smaller files.');
        checkCancelled(signal);
        onProgress(`Creating PDF page ${pageCount}…`);
        await yieldToBrowser();
        const inset = offset > 0 ? topMargin : 0;
        const capacity = overflow ? pageHeight - inset - bottomMargin : pageHeight;
        const end = pageSliceEnd(offset, capacity, totalHeight, boundaries);
        const height = end - offset;
        const canvas = await runConversionTask(() => html2canvas(section, {
          backgroundColor: '#ffffff', scale: Math.min(1.7, 1400 / width),
          x: 0, y: offset, width, height, scrollX: 0, scrollY: 0,
          windowWidth: 2000, windowHeight: Math.max(1200, Math.ceil(totalHeight)),
          logging: false, allowTaint: false, useCORS: false,
          onclone: (clonedDocument, clonedSection) => {
            for (const element of clonedDocument.querySelectorAll('iframe, script')) element.remove();
            for (const element of clonedSection.querySelectorAll(':scope > header, :scope > footer')) element.style.visibility = 'hidden';
          },
        }), { signal, timeout: 30000, message: `PDF page ${pageCount} took too long to render. Try a smaller document or fewer images.` });
        checkCancelled(signal);
        const format = [width * .75, pageHeight * .75];
        const orientation = width > pageHeight ? 'landscape' : 'portrait';
        if (!pdf) {
          pdf = new jsPDF({ orientation, unit: 'pt', format, compress: true });
          pdf.setProperties({ title: file.name.replace(/\.docx$/i, ''), creator: 'We Make PDF — browser conversion' });
        } else pdf.addPage(format, orientation);
        try {
          const expectedInk = boundaries.some(([top, bottom]) => bottom > offset && top < end);
          if (expectedInk) {
            const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
            let visible = false;
            for (let i = 0; i < pixels.length; i += 4) {
              if (pixels[i] < 245 || pixels[i + 1] < 245 || pixels[i + 2] < 245) { visible = true; break; }
            }
            if (!visible) throw new Error(`PDF page ${pageCount} rendered blank. This document's layout may not be supported. Try saving a new copy in Word.`);
          }
          pdf.addImage(canvas.toDataURL('image/jpeg', .92), 'JPEG', 0, inset * .75, width * .75, height * .75, undefined, 'FAST');
          for (const decoration of decorations) pdf.addImage(decoration.image, 'JPEG', decoration.x * .75, decoration.y * .75, decoration.width * .75, decoration.height * .75, undefined, 'FAST');
        } finally { canvas.width = 0; canvas.height = 0; }
        offset = end;
      }
    }
    onProgress('Finishing your PDF…');
    checkCancelled(signal);
    return { blob: pdf.output('blob'), pageCount };
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    if (/dynamically imported module|Loading chunk|Importing a module script/i.test(error.message)) throw new Error('The converter couldn’t load. Check your internet connection and try again.');
    if (/zip|central directory|compression|end of data|xml|Cannot read/i.test(error.message)) throw new Error('This document appears damaged or unsupported. Please choose another .docx file.');
    throw error;
  } finally {
    frame?.remove();
  }
}
