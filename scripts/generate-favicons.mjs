import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const browserPath = process.env.TOOLIFYBOX_BROWSER || [
  path.join(process.env.LOCALAPPDATA || '', 'ms-playwright/chromium-1243/chrome-win64/chrome.exe'),
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium', '/usr/bin/google-chrome',
].find(candidate => existsSync(candidate));

if (!browserPath) {
  throw new Error('No Chrome/Chromium/Edge browser found to generate favicons.');
}

// 1. Read clean SVG
const svgContent = await readFile(path.join(root, 'public/favicon.svg'), 'utf8');

// 2. Start headless browser with debug port
const debugPort = await new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    server.close(error => error ? reject(error) : resolve(port));
  });
});

const runtimeDir = path.join(root, '.runtime');
await mkdir(runtimeDir, { recursive: true });

const chrome = spawn(browserPath, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
  '--remote-allow-origins=*',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${path.join(runtimeDir, `favicon-browser-${debugPort}`)}`,
  'about:blank',
], { windowsHide: true, stdio: 'ignore' });

const pause = ms => new Promise(res => setTimeout(res, ms));

let socket;
const pending = new Map();
let next = 0;

try {
  let page;
  for (let i = 0; i < 50; i++) {
    try {
      page = (await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(x => x.type === 'page');
      if (page) break;
    } catch {}
    await pause(150);
  }

  if (!page) throw new Error('Browser did not start');

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject, timer } = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(timer);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  });

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++next;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (value.exceptionDetails) throw new Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text);
    return value.result.value;
  }

  // Generate PNGs inside the browser using HTML5 Canvas & Image
  const sizes = [16, 32, 48, 64, 128, 180, 192, 256, 512];
  const encodedSvg = Buffer.from(svgContent, 'utf8').toString('base64');
  const svgDataUrl = `data:image/svg+xml;base64,${encodedSvg}`;

  const renderScript = `
    (async () => {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load SVG into image'));
        img.src = ${JSON.stringify(svgDataUrl)};
      });

      const sizes = ${JSON.stringify(sizes)};
      const results = {};

      for (const s of sizes) {
        const canvas = document.createElement('canvas');
        canvas.width = s;
        canvas.height = s;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, s, s);
        results[s] = canvas.toDataURL('image/png').split(',')[1];
      }

      return results;
    })()
  `;

  const results = await evaluate(renderScript);

  // Write PNG files
  const pngBuffers = {};
  for (const s of sizes) {
    const buffer = Buffer.from(results[s], 'base64');
    pngBuffers[s] = buffer;
  }

  await writeFile(path.join(root, 'public/favicon-16x16.png'), pngBuffers[16]);
  await writeFile(path.join(root, 'public/favicon-32x32.png'), pngBuffers[32]);
  await writeFile(path.join(root, 'public/favicon-48x48.png'), pngBuffers[48]);
  await writeFile(path.join(root, 'public/apple-touch-icon.png'), pngBuffers[180]);
  await writeFile(path.join(root, 'public/android-chrome-192x192.png'), pngBuffers[192]);
  await writeFile(path.join(root, 'public/android-chrome-512x512.png'), pngBuffers[512]);
  await writeFile(path.join(root, 'public/favicon.png'), pngBuffers[48]); // 48x48 standard favicon.png for Google

  // Build binary ICO containing 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const images = icoSizes.map(s => ({
    width: s,
    height: s,
    data: pngBuffers[s],
  }));

  const count = images.length;
  const headerSize = 6 + (16 * count);
  let totalSize = headerSize;
  for (const item of images) {
    totalSize += item.data.length;
  }

  const icoBuffer = Buffer.alloc(totalSize);
  // ICONDIR header
  icoBuffer.writeUInt16LE(0, 0); // Reserved
  icoBuffer.writeUInt16LE(1, 2); // Type 1 = ICO
  icoBuffer.writeUInt16LE(count, 4); // Number of images

  let currentOffset = headerSize;
  images.forEach((item, index) => {
    const entryOffset = 6 + (index * 16);
    icoBuffer.writeUInt8(item.width >= 256 ? 0 : item.width, entryOffset);
    icoBuffer.writeUInt8(item.height >= 256 ? 0 : item.height, entryOffset + 1);
    icoBuffer.writeUInt8(0, entryOffset + 2); // Color count
    icoBuffer.writeUInt8(0, entryOffset + 3); // Reserved
    icoBuffer.writeUInt16LE(1, entryOffset + 4); // Color planes
    icoBuffer.writeUInt16LE(32, entryOffset + 6); // Bits per pixel
    icoBuffer.writeUInt32LE(item.data.length, entryOffset + 8); // Image size in bytes
    icoBuffer.writeUInt32LE(currentOffset, entryOffset + 12); // Offset of image data

    item.data.copy(icoBuffer, currentOffset);
    currentOffset += item.data.length;
  });

  await writeFile(path.join(root, 'public/favicon.ico'), icoBuffer);

  console.log('Successfully generated valid binary favicon.ico and PNG favicons (16, 32, 48, 180, 192, 512)!');
} finally {
  if (socket) {
    try { socket.close(); } catch {}
  }
  chrome.kill('SIGTERM');
}

