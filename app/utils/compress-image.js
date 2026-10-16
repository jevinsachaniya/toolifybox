const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const IMAGE_COMPRESSION_PRESETS = {
  high: {
    id: 'high',
    label: 'High quality',
    description: 'Keeps the original dimensions and image format.',
    detail: 'Best detail · gentle compression',
    scale: 1,
    quality: 0.94,
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    description: 'Keeps the full dimensions with efficient WebP compression.',
    detail: 'Clear detail · smaller file',
    scale: 1,
    quality: 0.82,
    mimeType: 'image/webp',
  },
  smallest: {
    id: 'smallest',
    label: 'Smallest file',
    description: 'Slightly reduces dimensions and applies stronger compression.',
    detail: 'Good quality · strongest reduction',
    scale: 0.82,
    quality: 0.62,
    mimeType: 'image/webp',
  },
  target: {
    id: 'target',
    label: 'Custom target size',
    description: 'Enter the approximate KB or MB size you need.',
    detail: 'Best quality that fits your target',
    mimeType: 'image/webp',
  },
};

function abortError() {
  return new DOMException('Image compression cancelled.', 'AbortError');
}

function imageType(file) {
  if (SUPPORTED_TYPES.has(file?.type)) return file.type;
  if (/\.jpe?g$/i.test(file?.name || '')) return 'image/jpeg';
  if (/\.png$/i.test(file?.name || '')) return 'image/png';
  if (/\.webp$/i.test(file?.name || '')) return 'image/webp';
  return '';
}

export function validateCompressImage(files) {
  const chosen = Array.from(files || []);
  if (chosen.length !== 1) return 'Choose one JPG, PNG or WebP image.';
  const file = chosen[0];
  if (!imageType(file)) return 'This format is not supported. Choose a JPG, PNG or WebP image.';
  if (!file.size) return 'This image is empty. Choose another file.';
  if (file.size > MAX_IMAGE_SIZE) return 'Choose an image smaller than 20 MB.';
  return '';
}

async function openImage(file, signal) {
  if (signal?.aborted) throw abortError();
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    if (signal?.aborted) {
      bitmap.close();
      throw abortError();
    }
    return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  }

  const url = URL.createObjectURL(file);
  try {
    const source = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('This image could not be opened. Try another file.'));
      image.src = url;
    });
    if (signal?.aborted) throw abortError();
    return { source, width: source.naturalWidth, height: source.naturalHeight, close: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) reject(new Error('Your browser could not create the compressed image.'));
      else resolve(blob);
    }, mimeType, quality);
  });
}

async function encodeImage(image, { scale, quality, mimeType }, signal) {
  if (signal?.aborted) throw abortError();
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: mimeType !== 'image/jpeg' });
  if (!context) throw new Error('Your browser could not prepare this image for compression.');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  if (mimeType === 'image/jpeg') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(image.source, 0, 0, width, height);
  const blob = await canvasBlob(canvas, mimeType, quality);
  canvas.width = 1;
  canvas.height = 1;
  if (signal?.aborted) throw abortError();
  return { blob, width, height, mimeType: blob.type || mimeType };
}

async function encodeForTarget(image, targetBytes, signal, onProgress) {
  const scales = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.32];
  let bestUnder;
  let smallest;
  let pass = 0;

  for (const scale of scales) {
    let low = 0.24;
    let high = 0.94;
    let fitAtScale;
    for (let attempt = 0; attempt < 6; attempt++) {
      if (signal?.aborted) throw abortError();
      pass++;
      const quality = (low + high) / 2;
      onProgress(`Testing image quality · pass ${pass}...`);
      const candidate = await encodeImage(image, { scale, quality, mimeType: 'image/webp' }, signal);
      if (!smallest || candidate.blob.size < smallest.blob.size) smallest = candidate;
      if (candidate.blob.size <= targetBytes) {
        fitAtScale = candidate;
        low = quality;
      } else {
        high = quality;
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (fitAtScale) {
      bestUnder = fitAtScale;
      break;
    }
  }
  return bestUnder || smallest;
}

function baseName(name) {
  return name.replace(/\.(?:jpe?g|png|webp)$/i, '').trim() || 'image';
}

export function compressedImageFilename(name, mimeType) {
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/jpeg' ? 'jpg' : 'webp';
  return `${baseName(name)}-compressed.${extension}`;
}

export async function inspectCompressImage(file, { signal } = {}) {
  const image = await openImage(file, signal);
  try {
    if (!image.width || !image.height) throw new Error('This image has invalid dimensions.');
    if (image.width * image.height > 60_000_000) throw new Error('This image is too large to process safely in a browser. Choose an image below 60 megapixels.');
    return { width: image.width, height: image.height, mimeType: imageType(file) };
  } finally {
    image.close();
  }
}

export async function compressImageFile(file, presetId, { targetBytes, signal, onProgress = () => {} } = {}) {
  const preset = IMAGE_COMPRESSION_PRESETS[presetId];
  if (!preset) throw new Error('Choose a valid compression quality.');
  if (presetId === 'target' && (!Number.isFinite(targetBytes) || targetBytes < 10 * 1024)) throw new Error('Enter a target size of at least 10 KB.');
  if (signal?.aborted) throw abortError();

  const image = await openImage(file, signal);
  try {
    if (!image.width || !image.height) throw new Error('This image has invalid dimensions.');
    if (image.width * image.height > 60_000_000) throw new Error('This image is too large to process safely in a browser. Choose an image below 60 megapixels.');

    let candidate;
    if (presetId === 'target' && file.size <= targetBytes) {
      candidate = { blob: file, width: image.width, height: image.height, mimeType: imageType(file) };
    } else if (presetId === 'target') {
      candidate = await encodeForTarget(image, targetBytes, signal, onProgress);
    } else {
      onProgress('Creating your compressed image...');
      candidate = await encodeImage(image, {
        scale: preset.scale,
        quality: preset.quality,
        mimeType: preset.mimeType || imageType(file),
      }, signal);
    }

    if (!candidate) throw new Error('A compressed image could not be created. Try a larger target size.');
    if (signal?.aborted) throw abortError();
    const changed = candidate.blob.size < file.size;
    const final = changed ? candidate : { blob: file, width: image.width, height: image.height, mimeType: imageType(file) };
    return {
      ...final,
      originalSize: file.size,
      outputSize: final.blob.size,
      originalWidth: image.width,
      originalHeight: image.height,
      reduction: changed ? Math.max(1, Math.round((1 - final.blob.size / file.size) * 100)) : 0,
      changed,
      targetBytes: presetId === 'target' ? targetBytes : undefined,
      metTarget: presetId === 'target' ? final.blob.size <= targetBytes : undefined,
    };
  } finally {
    image.close();
  }
}
