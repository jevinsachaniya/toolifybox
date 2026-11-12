import JSZip from 'jszip';

/**
 * Standard Favicon & App Icon specifications for web, mobile & PWA
 */
export const FAVICON_SIZES = [
  { id: '16', size: 16, name: 'favicon-16x16.png', label: '16×16 px', role: 'Browser Tab', desc: 'Standard desktop browser tab icon' },
  { id: '32', size: 32, name: 'favicon-32x32.png', label: '32×32 px', role: 'Retina Tab', desc: 'High-DPI browser tab & taskbar' },
  { id: '48', size: 48, name: 'favicon-48x48.png', label: '48×48 px', role: 'Windows Pin', desc: 'Windows desktop shortcut & pinned site' },
  { id: '64', size: 64, name: 'favicon-64x64.png', label: '64×64 px', role: 'High-Res Icon', desc: 'High-definition browser bookmark' },
  { id: '128', size: 128, name: 'favicon-128x128.png', label: '128×128 px', role: 'Chrome Store', desc: 'Chrome Web Store & desktop application' },
  { id: '180', size: 180, name: 'apple-touch-icon.png', label: '180×180 px', role: 'Apple Touch', desc: 'iOS Safari home screen bookmark' },
  { id: '192', size: 192, name: 'android-chrome-192x192.png', label: '192×192 px', role: 'Android Chrome', desc: 'Android home screen web app' },
  { id: '256', size: 256, name: 'favicon-256x256.png', label: '256×256 px', role: 'HD Windows / Mac', desc: 'Modern High-DPI Windows & macOS icon' },
  { id: '512', size: 512, name: 'android-chrome-512x512.png', label: '512×512 px', role: 'PWA Splash', desc: 'Progressive Web App launch splash' },
];

export const ICO_SIZES = [256, 128, 64, 48, 32, 16];

export const SHAPE_OPTIONS = [
  { id: 'square', label: 'Square', desc: 'Default 1:1 rectangular aspect' },
  { id: 'rounded', label: 'Rounded Squircle', desc: 'Smooth modern app-style curves' },
  { id: 'circle', label: 'Circle', desc: 'Circular avatar / emblem shape' },
];

export const BG_PRESETS = [
  { id: 'transparent', label: 'Transparent', value: 'transparent' },
  { id: 'white', label: 'White', value: '#ffffff' },
  { id: 'dark', label: 'Dark Navy', value: '#0f172a' },
  { id: 'black', label: 'Solid Black', value: '#000000' },
  { id: 'custom', label: 'Custom Color', value: '#6366f1' },
];

/**
 * Builds a multi-resolution Windows ICO binary Blob from PNG byte arrays
 */
export function buildIcoBlob(images) {
  // images: array of { width, height, data: Uint8Array }
  const count = images.length;
  const headerSize = 6 + (16 * count);
  let totalSize = headerSize;
  for (const img of images) {
    totalSize += img.data.length;
  }

  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);

  // ICONDIR header
  view.setUint16(0, 0, true); // Reserved (must be 0)
  view.setUint16(2, 1, true); // Type: 1 = ICO
  view.setUint16(4, count, true); // Number of images

  let currentOffset = headerSize;
  images.forEach((img, index) => {
    const entryOffset = 6 + (index * 16);
    view.setUint8(entryOffset, img.width >= 256 ? 0 : img.width);
    view.setUint8(entryOffset + 1, img.height >= 256 ? 0 : img.height);
    view.setUint8(entryOffset + 2, 0); // Color count (0 for 256+ colors)
    view.setUint8(entryOffset + 3, 0); // Reserved
    view.setUint16(entryOffset + 4, 1, true); // Color planes
    view.setUint16(entryOffset + 6, 32, true); // Bits per pixel (32bpp RGBA)
    view.setUint32(entryOffset + 8, img.data.length, true); // Resource byte length
    view.setUint32(entryOffset + 12, currentOffset, true); // File offset to image data

    buffer.set(img.data, currentOffset);
    currentOffset += img.data.length;
  });

  return new Blob([buffer], { type: 'image/x-icon' });
}

/**
 * High-quality stepped downsampling to avoid blur, aliasing and loss of detail
 */
function drawImageHighQuality(ctx, img, dx, dy, dw, dh) {
  const sw = img.naturalWidth || img.width || dw;
  const sh = img.naturalHeight || img.height || dh;

  // If source is already within 2x of target, standard high-quality smooth draw is crisp
  if (sw <= dw * 2 && sh <= dh * 2) {
    ctx.drawImage(img, dx, dy, dw, dh);
    return;
  }

  // Stepped downscaling: halve the size step by step to preserve contrast and edges
  let curCanvas = document.createElement('canvas');
  curCanvas.width = sw;
  curCanvas.height = sh;
  let curCtx = curCanvas.getContext('2d');
  if (!curCtx) {
    ctx.drawImage(img, dx, dy, dw, dh);
    return;
  }
  curCtx.imageSmoothingEnabled = true;
  curCtx.imageSmoothingQuality = 'high';
  curCtx.drawImage(img, 0, 0, sw, sh);

  let curW = sw;
  let curH = sh;

  while (curW * 0.5 >= dw && curH * 0.5 >= dh) {
    const nextW = Math.max(dw, Math.round(curW * 0.5));
    const nextH = Math.max(dh, Math.round(curH * 0.5));
    const stepCanvas = document.createElement('canvas');
    stepCanvas.width = nextW;
    stepCanvas.height = nextH;
    const stepCtx = stepCanvas.getContext('2d');
    if (!stepCtx) break;
    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = 'high';
    stepCtx.drawImage(curCanvas, 0, 0, nextW, nextH);

    curCanvas = stepCanvas;
    curW = nextW;
    curH = nextH;
  }

  // Final draw to target canvas
  ctx.drawImage(curCanvas, dx, dy, dw, dh);
}

/**
 * Mild unsharp mask filter to give small icons (16, 32, 48) crisp, readable edges
 */
function applyMildSharpen(canvas, strength = 0.22) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  if (w > 64 || h > 64) return; // Only apply to small icon sizes

  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const copy = new Uint8ClampedArray(data);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        const alpha = copy[idx + 3];
        if (alpha < 32) continue; // Skip near-transparent pixels

        for (let c = 0; c < 3; c++) {
          const top = copy[((y - 1) * w + x) * 4 + c];
          const bottom = copy[((y + 1) * w + x) * 4 + c];
          const left = copy[(y * w + (x - 1)) * 4 + c];
          const right = copy[(y * w + (x + 1)) * 4 + c];
          const center = copy[idx + c];
          const avg = (top + bottom + left + right) * 0.25;
          const delta = center - avg;
          data[idx + c] = Math.min(255, Math.max(0, center + delta * strength));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    // If canvas is tainted, gracefully fallback
  }
}

/**
 * Renders a source image element onto an offscreen canvas with target size and style options
 */
export function renderFaviconToCanvas(img, size, options = {}) {
  const {
    shape = 'square',
    backgroundColor = 'transparent',
    padding = 0, // 0 to 40%
    fit = 'contain',
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) return canvas;

  // Smoothing for crisp downscaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Define clipping path based on shape
  ctx.save();
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  } else if (shape === 'rounded') {
    const radius = Math.round(size * 0.22);
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(0, 0, size, size, radius);
    } else {
      // Fallback manual rounded rect
      ctx.moveTo(radius, 0);
      ctx.lineTo(size - radius, 0);
      ctx.quadraticCurveTo(size, 0, size, radius);
      ctx.lineTo(size, size - radius);
      ctx.quadraticCurveTo(size, size, size - radius, size);
      ctx.lineTo(radius, size);
      ctx.quadraticCurveTo(0, size, 0, size - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
    }
    ctx.closePath();
    ctx.clip();
  }

  // Draw background color if not transparent
  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);
  }

  // Calculate draw coordinates with padding
  const paddingPx = (size * (padding / 100));
  const availW = Math.max(1, size - paddingPx * 2);
  const availH = Math.max(1, size - paddingPx * 2);

  const imgW = img.naturalWidth || img.width || 1;
  const imgH = img.naturalHeight || img.height || 1;

  let drawW = availW;
  let drawH = availH;

  if (fit === 'contain') {
    const scale = Math.min(availW / imgW, availH / imgH);
    drawW = imgW * scale;
    drawH = imgH * scale;
  } else if (fit === 'cover') {
    const scale = Math.max(availW / imgW, availH / imgH);
    drawW = imgW * scale;
    drawH = imgH * scale;
  }

  const drawX = Math.round((size - drawW) / 2);
  const drawY = Math.round((size - drawH) / 2);

  // Stepped high quality draw
  drawImageHighQuality(ctx, img, drawX, drawY, drawW, drawH);
  ctx.restore();

  // Mild sharpening on small sizes to keep icons crisp & clear
  if (size <= 48) {
    applyMildSharpen(canvas, 0.25);
  }

  return canvas;
}

/**
 * Converts canvas to PNG Uint8Array bytes
 */
export async function canvasToPngBytes(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        return reject(new Error('Failed to create PNG blob from canvas'));
      }
      blob.arrayBuffer().then((buffer) => {
        resolve(new Uint8Array(buffer));
      }).catch(reject);
    }, 'image/png');
  });
}

/**
 * Generates HTML head tags snippet
 */
export function generateHtmlSnippet(appName = 'My Website', themeColor = '#ffffff') {
  return `<!-- Favicon & App Icons generated by We Make PDF (wemakepdf.com) -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="icon" type="image/png" sizes="256x256" href="/favicon-256x256.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="${themeColor}">
<meta name="apple-mobile-web-app-title" content="${appName}">`;
}

/**
 * Generates Web App Manifest JSON snippet
 */
export function generateManifestSnippet(appName = 'My Web App', themeColor = '#ffffff') {
  const manifest = {
    name: appName,
    short_name: appName.length > 12 ? appName.slice(0, 12) : appName,
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: themeColor,
    background_color: themeColor === 'transparent' ? '#ffffff' : themeColor,
    display: 'standalone',
  };
  return JSON.stringify(manifest, null, 2);
}

/**
 * Generates the full Favicon package including all PNGs, multi-res ICO, webmanifest, and zip
 */
export async function generateFaviconPackage(imageElement, options = {}, onProgress = () => {}) {
  const appName = options.appName || 'My Website';
  const themeColor = options.backgroundColor === 'transparent' ? '#ffffff' : (options.backgroundColor || '#ffffff');

  onProgress('Rendering resolution canvases...');
  const iconResults = [];
  const icoParts = [];

  for (let i = 0; i < FAVICON_SIZES.length; i++) {
    const item = FAVICON_SIZES[i];
    onProgress(`Rendering ${item.label} (${item.role})...`);

    const canvas = renderFaviconToCanvas(imageElement, item.size, options);
    const dataUrl = canvas.toDataURL('image/png');
    const pngBytes = await canvasToPngBytes(canvas);
    const blob = new Blob([pngBytes], { type: 'image/png' });

    iconResults.push({
      ...item,
      canvas,
      dataUrl,
      blob,
      bytes: pngBytes,
      sizeBytes: pngBytes.length,
    });

    if (ICO_SIZES.includes(item.size)) {
      icoParts.push({
        width: item.size,
        height: item.size,
        data: pngBytes,
      });
    }
  }

  // Build multi-res ICO (sorted largest to smallest: 256, 128, 64, 48, 32, 16)
  // This ensures image viewers show the 256x256 HD version by default when zoomed in!
  icoParts.sort((a, b) => b.width - a.width);
  onProgress('Assembling multi-resolution favicon.ico binary...');
  const icoBlob = buildIcoBlob(icoParts);
  const icoUrl = URL.createObjectURL(icoBlob);

  // Generate Manifest & HTML
  const manifestJson = generateManifestSnippet(appName, themeColor);
  const htmlSnippet = generateHtmlSnippet(appName, themeColor);

  // Build ZIP bundle
  onProgress('Packaging ZIP archive with all assets...');
  const zip = new JSZip();
  zip.file('favicon.ico', icoBlob);

  for (const item of iconResults) {
    zip.file(item.name, item.blob);
  }

  zip.file('site.webmanifest', manifestJson);
  zip.file('html-head-tags.html', htmlSnippet);
  zip.file(
    'README.txt',
    `FAVICON PACKAGE GENERATED BY WE MAKE PDF
========================================
Website: https://wemakepdf.com/tools/image-to-favicon
Date: ${new Date().toISOString()}

INSTRUCTIONS:
1. Place favicon.ico, site.webmanifest, and all PNG images into the ROOT directory of your web project (e.g. /public or /static).
2. Copy and paste the HTML tags inside 'html-head-tags.html' into the <head> section of your website HTML files.
3. Reload your website with Ctrl+F5 (or Cmd+Shift+R) to clear browser icon cache.

INCLUDED FILES:
- favicon.ico (Multi-size HD: 256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
- favicon-16x16.png
- favicon-32x32.png
- favicon-48x48.png
- favicon-64x64.png
- favicon-128x128.png
- apple-touch-icon.png (180x180 for iOS)
- android-chrome-192x192.png (Android home screen)
- favicon-256x256.png (HD 256x256 for Windows & Mac)
- android-chrome-512x512.png (PWA splash)
- site.webmanifest
- html-head-tags.html
`
  );

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipUrl = URL.createObjectURL(zipBlob);

  onProgress('Favicon package ready!');

  return {
    icons: iconResults,
    icoBlob,
    icoUrl,
    icoSizeBytes: icoBlob.size,
    zipBlob,
    zipUrl,
    zipSizeBytes: zipBlob.size,
    htmlSnippet,
    manifestSnippet: manifestJson,
  };
}

/**
 * Creates a beautiful sample 512x512 logo artwork canvas in browser memory
 */
export function generateSampleFaviconLogo() {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background rounded squircle
  const bgGrad = ctx.createLinearGradient(0, 0, 512, 512);
  bgGrad.addColorStop(0, '#6366f1');
  bgGrad.addColorStop(0.5, '#8b5cf6');
  bgGrad.addColorStop(1, '#ec4899');

  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(32, 32, 448, 448, 96);
  } else {
    ctx.arc(256, 256, 220, 0, Math.PI * 2);
  }
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Glass shine arc
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(32, 32, 448, 448, 96);
  }
  ctx.clip();
  const shineGrad = ctx.createLinearGradient(0, 32, 512, 280);
  shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = shineGrad;
  ctx.beginPath();
  ctx.moveTo(32, 32);
  ctx.lineTo(480, 32);
  ctx.lineTo(480, 200);
  ctx.bezierCurveTo(360, 260, 160, 260, 32, 200);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Modern Lightning / Diamond Star Emblem in center
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 12;

  // 4-point geometric spark / star
  ctx.beginPath();
  ctx.moveTo(256, 120);
  ctx.quadraticCurveTo(256, 256, 392, 256);
  ctx.quadraticCurveTo(256, 256, 256, 392);
  ctx.quadraticCurveTo(256, 256, 120, 256);
  ctx.quadraticCurveTo(256, 256, 256, 120);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Central inner gem
  ctx.beginPath();
  ctx.arc(256, 256, 28, 0, Math.PI * 2);
  ctx.fillStyle = '#fde047';
  ctx.fill();

  ctx.restore();

  return canvas.toDataURL('image/png');
}

