import { runConversionTask } from './conversion-task.js';

export const MAX_IMAGE_COUNT = 50;
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
export const MAX_TOTAL_IMAGE_SIZE = 100 * 1024 * 1024;

const supportedExtension = /\.(?:jpe?g|png|webp)$/i;

export function validateImages(files, existingCount = 0, existingBytes = 0) {
  const chosen = Array.from(files || []);
  if (!chosen.length) return 'Choose at least one JPG, PNG, or WebP image.';
  if (chosen.length + existingCount > MAX_IMAGE_COUNT) return `Choose up to ${MAX_IMAGE_COUNT} images per PDF.`;
  const unsupported = chosen.find(file => !supportedExtension.test(file.name) || (file.type && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)));
  if (unsupported) return `${unsupported.name} is not a supported image. Choose JPG, PNG, or WebP files.`;
  const empty = chosen.find(file => !file.size);
  if (empty) return `${empty.name} is empty. Choose another image.`;
  const oversized = chosen.find(file => file.size > MAX_IMAGE_SIZE);
  if (oversized) return `${oversized.name} is larger than 20 MB.`;
  if (existingBytes + chosen.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_IMAGE_SIZE) return 'The selected images are larger than 100 MB in total. Choose fewer images.';
  return '';
}

export function imagesPdfFilename(name = 'images') {
  const base = name.replace(/\.(?:jpe?g|png|webp)$/i, '').trim() || 'images';
  return `${base}-images.pdf`;
}

function loadImage(url, signal) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const abort = () => { image.src = ''; reject(new DOMException('Conversion cancelled.', 'AbortError')); };
    signal?.addEventListener('abort', abort, { once: true });
    image.onload = () => { signal?.removeEventListener('abort', abort); resolve(image); };
    image.onerror = () => { signal?.removeEventListener('abort', abort); reject(new Error('An image could not be read. Remove it and try again.')); };
    image.src = url;
  });
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => canvas.toBlob(
    blob => blob ? resolve(blob) : reject(new Error('An image could not be prepared for the PDF.')),
    type,
    quality,
  ));
}

const pageFormats = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

function pageDimensions(imageWidth, imageHeight, pageSize, margin) {
  if (pageSize === 'image') {
    const longest = Math.max(imageWidth, imageHeight);
    const scale = Math.min(1, 7200 / longest) * 0.75;
    return [Math.max(72, imageWidth * scale + margin * 2), Math.max(72, imageHeight * scale + margin * 2)];
  }
  const portrait = pageFormats[pageSize] || pageFormats.a4;
  return imageWidth > imageHeight ? [portrait[1], portrait[0]] : [...portrait];
}

function drawSize(imageWidth, imageHeight, pageWidth, pageHeight, margin, mode) {
  const availableWidth = Math.max(1, pageWidth - margin * 2);
  const availableHeight = Math.max(1, pageHeight - margin * 2);
  const ratio = mode === 'fill'
    ? Math.max(availableWidth / imageWidth, availableHeight / imageHeight)
    : Math.min(availableWidth / imageWidth, availableHeight / imageHeight);
  const width = imageWidth * ratio;
  const height = imageHeight * ratio;
  return { width, height, x: (pageWidth - width) / 2, y: (pageHeight - height) / 2 };
}

export async function convertImagesToPdf(items, {
  pageSize = 'a4',
  fit = 'contain',
  margin = 18,
  quality = 'maximum',
  signal,
  onProgress = () => {},
} = {}) {
  if (!items.length) throw new Error('Choose at least one image.');
  const task = (operation, timeout = 60_000) => runConversionTask(operation, { signal, timeout });
  const { jsPDF } = await task(() => import('jspdf'));
  const settings = quality === 'balanced'
    ? { maxPixels: 16_000_000, jpegQuality: 0.92 }
    : { maxPixels: 30_000_000, jpegQuality: 0.98 };
  let pdf;

  for (let index = 0; index < items.length; index++) {
    if (signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError');
    const item = items[index];
    onProgress(`Preparing image ${index + 1} of ${items.length}…`);
    const image = await task(() => loadImage(item.url, signal));
    const quarterTurns = ((item.rotation || 0) / 90) % 2;
    const rotated = Boolean(Math.abs(quarterTurns));
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const outputWidth = rotated ? sourceHeight : sourceWidth;
    const outputHeight = rotated ? sourceWidth : sourceHeight;
    const renderScale = Math.min(1, Math.sqrt(settings.maxPixels / Math.max(1, outputWidth * outputHeight)));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(outputWidth * renderScale));
    canvas.height = Math.max(1, Math.round(outputHeight * renderScale));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Your browser could not prepare an image. Try fewer images.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((item.rotation || 0) * Math.PI / 180);
    const drawWidth = sourceWidth * renderScale;
    const drawHeight = sourceHeight * renderScale;
    context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    context.restore();

    const keepLossless = /image\/png/i.test(item.file.type) || /\.png$/i.test(item.file.name);
    const mimeType = keepLossless ? 'image/png' : 'image/jpeg';
    const blob = await task(() => canvasBlob(canvas, mimeType, settings.jpegQuality));
    const bytes = new Uint8Array(await task(() => blob.arrayBuffer()));
    const [pageWidth, pageHeight] = pageDimensions(canvas.width, canvas.height, pageSize, margin);
    const placement = drawSize(canvas.width, canvas.height, pageWidth, pageHeight, margin, fit);
    const orientation = pageWidth > pageHeight ? 'landscape' : 'portrait';
    if (!pdf) pdf = new jsPDF({ unit: 'pt', format: [pageWidth, pageHeight], orientation, compress: true, hotfixes: ['px_scaling'] });
    else pdf.addPage([pageWidth, pageHeight], orientation);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    pdf.addImage(bytes, keepLossless ? 'PNG' : 'JPEG', placement.x, placement.y, placement.width, placement.height, undefined, 'NONE');
    canvas.width = canvas.height = 0;
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  if (signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError');
  onProgress('Finishing your high-quality PDF…');
  const blob = pdf.output('blob');
  return { blob, pageCount: items.length };
}
