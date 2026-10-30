import JSZip from 'jszip';

export const MAX_IMAGE_CONVERT_SIZE = 50 * 1024 * 1024; // 50 MB per image
export const MAX_IMAGE_CONVERT_COUNT = 30; // Up to 30 files batch

export const SUPPORTED_INPUT_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/x-ms-bmp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/svg+xml',
  'image/avif',
  'image/tiff',
];

export const IMAGE_CONVERT_FORMATS = {
  webp: {
    id: 'webp',
    label: 'WEBP',
    fullName: 'WebP Image',
    mimeType: 'image/webp',
    extension: 'webp',
    supportsQuality: true,
    supportsAlpha: true,
    description: 'Modern web format with superior compression and transparency.',
    badge: 'Popular',
  },
  png: {
    id: 'png',
    label: 'PNG',
    fullName: 'Portable Network Graphics',
    mimeType: 'image/png',
    extension: 'png',
    supportsQuality: false,
    supportsAlpha: true,
    description: 'Lossless quality with full transparency support. Ideal for graphics and logos.',
    badge: 'Lossless',
  },
  jpg: {
    id: 'jpg',
    label: 'JPG',
    fullName: 'JPEG Image',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    supportsQuality: true,
    supportsAlpha: false,
    description: 'Universal compatibility across all devices and software.',
    badge: 'Universal',
  },
  gif: {
    id: 'gif',
    label: 'GIF',
    fullName: 'Graphics Interchange Format',
    mimeType: 'image/gif',
    extension: 'gif',
    supportsQuality: false,
    supportsAlpha: true,
    description: 'Standard 8-bit palette format compatible with all web browsers.',
    badge: 'Standard',
  },
  bmp: {
    id: 'bmp',
    label: 'BMP',
    fullName: 'Windows Bitmap',
    mimeType: 'image/bmp',
    extension: 'bmp',
    supportsQuality: false,
    supportsAlpha: false,
    description: 'Uncompressed raw raster image format for Windows applications.',
    badge: 'Raw',
  },
  ico: {
    id: 'ico',
    label: 'ICO',
    fullName: 'Windows Icon',
    mimeType: 'image/x-icon',
    extension: 'ico',
    supportsQuality: false,
    supportsAlpha: true,
    description: 'Standard favicon format for website browsers and desktop icons.',
    badge: 'Favicon',
  },
  avif: {
    id: 'avif',
    label: 'AVIF',
    fullName: 'AV1 Image File',
    mimeType: 'image/avif',
    extension: 'avif',
    supportsQuality: true,
    supportsAlpha: true,
    description: 'Next-gen image format delivering high quality at smaller sizes.',
    badge: 'Next-Gen',
  },
};

export const QUICK_CONVERT_PRESETS = [
  { id: 'jpg-to-webp', from: 'jpg', to: 'webp', label: 'JPG to WebP', desc: 'Reduce file size up to 80%' },
  { id: 'png-to-webp', from: 'png', to: 'webp', label: 'PNG to WebP', desc: 'Keep transparency with smaller size' },
  { id: 'webp-to-png', from: 'webp', to: 'png', label: 'WebP to PNG', desc: 'Lossless high fidelity' },
  { id: 'jpg-to-png', from: 'jpg', to: 'png', label: 'JPG to PNG', desc: 'Uncompressed graphics' },
  { id: 'png-to-jpg', from: 'png', to: 'jpg', label: 'PNG to JPG', desc: 'Universal compatibility' },
  { id: 'any-to-ico', from: 'any', to: 'ico', label: 'Image to ICO', desc: 'Generate website favicon' },
];

/**
 * Detect image format from File object or filename
 */
export function detectImageFormat(file) {
  if (!file) return 'unknown';
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  if (type.includes('webp') || name.endsWith('.webp')) return 'webp';
  if (type.includes('png') || name.endsWith('.png')) return 'png';
  if (type.includes('jpeg') || type.includes('jpg') || name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'jpg';
  if (type.includes('gif') || name.endsWith('.gif')) return 'gif';
  if (type.includes('bmp') || name.endsWith('.bmp')) return 'bmp';
  if (type.includes('icon') || name.endsWith('.ico')) return 'ico';
  if (type.includes('svg') || name.endsWith('.svg')) return 'svg';
  if (type.includes('avif') || name.endsWith('.avif')) return 'avif';
  if (type.includes('tiff') || name.endsWith('.tiff') || name.endsWith('.tif')) return 'tiff';

  return 'unknown';
}

/**
 * Validates uploaded files
 */
export function validateImageConvertFiles(files) {
  const list = Array.from(files || []);
  if (!list.length) return 'Please select at least one image to convert.';
  if (list.length > MAX_IMAGE_CONVERT_COUNT) {
    return `You can convert up to ${MAX_IMAGE_CONVERT_COUNT} images at once. Please select fewer files.`;
  }

  for (const f of list) {
    if (!f.size) return `"${f.name}" is an empty file (0 bytes).`;
    if (f.size > MAX_IMAGE_CONVERT_SIZE) {
      return `"${f.name}" exceeds the 50 MB limit. Please choose a smaller file.`;
    }
    const fmt = detectImageFormat(f);
    if (fmt === 'unknown') {
      return `"${f.name}" is not a supported image format. Supported formats: JPG, PNG, WEBP, GIF, BMP, ICO, SVG, AVIF.`;
    }
  }

  return '';
}

/**
 * Generates an output filename with the new extension
 */
export function formatOutputFilename(originalName, targetFormat) {
  const base = (originalName || 'image').replace(/\.[^/.]+$/, '').trim() || 'image';
  const ext = IMAGE_CONVERT_FORMATS[targetFormat]?.extension || targetFormat.toLowerCase();
  return `${base}.${ext}`;
}

/**
 * Inspects image dimensions and creates a lightweight preview URL
 */
export async function inspectImageFile(file, { signal } = {}) {
  if (signal?.aborted) throw new DOMException('Operation aborted', 'AbortError');

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };

    if (signal) {
      signal.addEventListener('abort', () => {
        cleanup();
        URL.revokeObjectURL(url);
        reject(new DOMException('Operation aborted', 'AbortError'));
      }, { once: true });
    }

    img.onload = () => {
      cleanup();
      const dimensions = {
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0,
      };
      resolve({
        previewUrl: url,
        width: dimensions.width,
        height: dimensions.height,
        format: detectImageFormat(file),
        size: file.size,
      });
    };

    img.onerror = () => {
      cleanup();
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load preview for "${file.name}".`));
    };

    img.src = url;
  });
}

/**
 * Creates a Windows ICO format binary blob from a canvas.
 * Encodes a 32-bit RGBA BMP/PNG structure inside an ICO directory.
 */
export function createIcoBlob(sourceCanvas, targetSize = 64) {
  const size = Math.min(256, Math.max(16, targetSize || 64));
  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, size, size);
  }

  // Get RGBA pixel data
  const imageData = ctx ? ctx.getImageData(0, 0, size, size) : null;
  if (!imageData) {
    throw new Error('Unable to read canvas data for ICO conversion.');
  }

  const { width, height, data } = imageData;
  const bpp = 32;
  const imageSize = width * height * 4;
  const maskRowSize = Math.floor((width + 31) / 32) * 4;
  const maskSize = maskRowSize * height;
  const biSizeImage = imageSize + maskSize;
  const biSize = 40; // BITMAPINFOHEADER

  const headerSize = 6; // ICONDIR
  const entrySize = 16; // ICONDIRENTRY
  const imageOffset = headerSize + entrySize;
  const totalFileSize = imageOffset + biSize + biSizeImage;

  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);

  // ICONDIR header
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // Type (1 = ICO)
  view.setUint16(4, 1, true); // Image count (1)

  // ICONDIRENTRY
  view.setUint8(6, width >= 256 ? 0 : width); // Width
  view.setUint8(7, height >= 256 ? 0 : height); // Height
  view.setUint8(8, 0); // Color count
  view.setUint8(9, 0); // Reserved
  view.setUint16(10, 1, true); // Color planes
  view.setUint16(12, bpp, true); // Bits per pixel
  view.setUint32(14, biSize + biSizeImage, true); // Bytes in resource
  view.setUint32(18, imageOffset, true); // Offset to BITMAPINFOHEADER

  // BITMAPINFOHEADER (offset 22)
  let offset = imageOffset;
  view.setUint32(offset + 0, biSize, true); // Header size
  view.setInt32(offset + 4, width, true); // Width
  view.setInt32(offset + 8, height * 2, true); // Height x 2 for icon XOR + AND masks
  view.setUint16(offset + 12, 1, true); // Planes
  view.setUint16(offset + 14, bpp, true); // Bit count
  view.setUint32(offset + 16, 0, true); // Compression (BI_RGB = 0)
  view.setUint32(offset + 20, biSizeImage, true); // Image size
  view.setInt32(offset + 24, 0, true); // X pixels per meter
  view.setInt32(offset + 28, 0, true); // Y pixels per meter
  view.setUint32(offset + 32, 0, true); // Colors used
  view.setUint32(offset + 36, 0, true); // Important colors

  offset += biSize;

  // Pixel data (bottom-up BGRA)
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];
      const a = data[srcIdx + 3];

      view.setUint8(offset++, b); // Blue
      view.setUint8(offset++, g); // Green
      view.setUint8(offset++, r); // Red
      view.setUint8(offset++, a); // Alpha
    }
  }

  // 1-bit transparency mask (all 0s because alpha is in 32-bit channels)
  for (let i = 0; i < maskSize; i++) {
    view.setUint8(offset++, 0);
  }

  return new Blob([buffer], { type: 'image/x-icon' });
}

/**
 * Creates an uncompressed Windows 24-bit BMP Blob from a canvas
 */
export function createBmpBlob(sourceCanvas, backgroundColor = '#ffffff') {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  // Flatten with background color on a separate canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available.');

  ctx.fillStyle = backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(sourceCanvas, 0, 0);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // BMP rows are padded to multiple of 4 bytes
  const rowSize = Math.floor((width * 3 + 3) / 4) * 4;
  const pixelArraySize = rowSize * height;
  const fileHeaderSize = 14;
  const infoHeaderSize = 40;
  const totalFileSize = fileHeaderSize + infoHeaderSize + pixelArraySize;

  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);

  // BITMAPFILEHEADER
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4D); // 'M'
  view.setUint32(2, totalFileSize, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint32(10, fileHeaderSize + infoHeaderSize, true); // Offset to pixels

  // BITMAPINFOHEADER
  view.setUint32(14, infoHeaderSize, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // Positive for bottom-up
  view.setUint16(26, 1, true); // Planes
  view.setUint16(28, 24, true); // 24 bits per pixel (BGR)
  view.setUint32(30, 0, true); // BI_RGB (uncompressed)
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true); // 72 DPI
  view.setInt32(42, 2835, true); // 72 DPI
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  // Pixel array (bottom-up, BGR format)
  let offset = fileHeaderSize + infoHeaderSize;
  for (let y = height - 1; y >= 0; y--) {
    let rowOffset = offset;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      view.setUint8(rowOffset++, data[srcIdx + 2]); // Blue
      view.setUint8(rowOffset++, data[srcIdx + 1]); // Green
      view.setUint8(rowOffset++, data[srcIdx]);     // Red
    }
    // Pad row with 0s to multiple of 4 bytes
    while (rowOffset < offset + rowSize) {
      view.setUint8(rowOffset++, 0);
    }
    offset += rowSize;
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Converts a single image file to the designated target format
 */
export async function convertImageFile(file, options = {}) {
  const {
    targetFormat = 'webp',
    quality = 0.90,
    scale = 1.0,
    maxWidth = 0,
    maxHeight = 0,
    backgroundColor = '#ffffff',
    icoSize = 64,
    signal,
  } = options;

  if (signal?.aborted) throw new DOMException('Conversion cancelled', 'AbortError');

  // 1. Load image into an HTMLImageElement
  const objectUrl = URL.createObjectURL(file);
  let img;
  try {
    img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`Failed to load image "${file.name}".`));
      el.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  if (signal?.aborted) throw new DOMException('Conversion cancelled', 'AbortError');

  const origWidth = img.naturalWidth || img.width || 1;
  const origHeight = img.naturalHeight || img.height || 1;

  // 2. Calculate output dimensions
  let targetWidth = Math.round(origWidth * (scale || 1.0));
  let targetHeight = Math.round(origHeight * (scale || 1.0));

  if (maxWidth > 0 && targetWidth > maxWidth) {
    const ratio = maxWidth / targetWidth;
    targetWidth = maxWidth;
    targetHeight = Math.round(targetHeight * ratio);
  }

  if (maxHeight > 0 && targetHeight > maxHeight) {
    const ratio = maxHeight / targetHeight;
    targetHeight = maxHeight;
    targetWidth = Math.round(targetWidth * ratio);
  }

  targetWidth = Math.max(1, targetWidth);
  targetHeight = Math.max(1, targetHeight);

  // 3. Render on canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('HTML Canvas 2D is not supported on this browser.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const formatConfig = IMAGE_CONVERT_FORMATS[targetFormat] || IMAGE_CONVERT_FORMATS.webp;
  const isOpaque = !formatConfig.supportsAlpha;

  // If format doesn't support transparency (e.g. JPG, BMP), fill background
  if (isOpaque) {
    ctx.fillStyle = backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  if (signal?.aborted) throw new DOMException('Conversion cancelled', 'AbortError');

  // 4. Output encoding according to format
  let blob;
  const mimeType = formatConfig.mimeType;

  if (targetFormat === 'ico') {
    blob = createIcoBlob(canvas, icoSize || 64);
  } else if (targetFormat === 'bmp') {
    blob = createBmpBlob(canvas, backgroundColor);
  } else {
    // Standard canvas.toBlob for PNG, WEBP, JPG, AVIF, GIF
    const q = formatConfig.supportsQuality ? Math.min(1.0, Math.max(0.05, quality)) : undefined;
    blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else {
            // Fallback to PNG if browser doesn't natively support encoding format (e.g. AVIF on older browsers)
            canvas.toBlob(
              (fallbackBlob) => {
                if (fallbackBlob) resolve(fallbackBlob);
                else reject(new Error(`Failed to encode image to ${formatConfig.label}.`));
              },
              'image/png'
            );
          }
        },
        mimeType,
        q
      );
    });
  }

  if (signal?.aborted) throw new DOMException('Conversion cancelled', 'AbortError');

  const outputName = formatOutputFilename(file.name, targetFormat);
  const downloadUrl = URL.createObjectURL(blob);
  const sizeDiff = blob.size - file.size;
  const savingsPercent = file.size > 0 ? Math.round(((file.size - blob.size) / file.size) * 100) : 0;

  return {
    filename: outputName,
    blob,
    downloadUrl,
    size: blob.size,
    originalSize: file.size,
    savingsPercent,
    sizeDiff,
    width: targetWidth,
    height: targetHeight,
    format: targetFormat,
    originalFormat: detectImageFormat(file),
  };
}

/**
 * Packages multiple converted images into a single ZIP archive for one-click bulk download
 */
export async function packageConvertedImagesZip(results, zipFilename = 'converted-images.zip') {
  const zip = new JSZip();

  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    if (item?.blob && item?.filename) {
      zip.file(item.filename, item.blob);
    }
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return {
    blob: zipBlob,
    filename: zipFilename,
    downloadUrl: URL.createObjectURL(zipBlob),
    size: zipBlob.size,
    fileCount: results.length,
  };
}

