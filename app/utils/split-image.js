import JSZip from 'jszip';

export const MAX_SPLIT_IMAGE_SIZE = 50 * 1024 * 1024; // 50 MB

export const SPLIT_MODES = [
  { id: 'custom-lines', label: 'Hand Drag', sublabel: 'Drag on Photo', desc: 'Drag cut lines directly on the photo with your hand or mouse' },
  { id: 'grid', label: 'Grid', sublabel: 'Rows × Cols', desc: 'Split into equal rows and columns (e.g. 3×3 for Instagram 9-grid)' },
  { id: 'vertical', label: 'Carousel', sublabel: 'Vertical Columns', desc: 'Split vertically into seamless slides for Instagram & LinkedIn carousels' },
  { id: 'horizontal', label: 'Strips', sublabel: 'Horizontal Rows', desc: 'Split horizontally into equal banner or infographic strips' },
  { id: 'custom-size', label: 'Custom Size', sublabel: 'Fixed Pixel Tile', desc: 'Split by exact pixel width and height (e.g., 1080×1080 px)' },
];

export const GRID_PRESETS = [
  { id: 'insta-3x3', name: 'Instagram 3×3 (9-Grid)', rows: 3, cols: 3, mode: 'grid' },
  { id: 'insta-3x2', name: 'Instagram 3×2 (6-Grid)', rows: 2, cols: 3, mode: 'grid' },
  { id: 'insta-3x1', name: 'Instagram 3×1 (Panorama)', rows: 1, cols: 3, mode: 'grid' },
  { id: 'carousel-2', name: 'Carousel 2 Slides', rows: 1, cols: 2, mode: 'vertical' },
  { id: 'carousel-3', name: 'Carousel 3 Slides', rows: 1, cols: 3, mode: 'vertical' },
  { id: 'carousel-4', name: 'Carousel 4 Slides', rows: 1, cols: 4, mode: 'vertical' },
  { id: 'carousel-5', name: 'Carousel 5 Slides', rows: 1, cols: 5, mode: 'vertical' },
  { id: 'quad-2x2', name: '2×2 Equal Quad', rows: 2, cols: 2, mode: 'grid' },
  { id: 'matrix-4x4', name: '4×4 Matrix', rows: 4, cols: 4, mode: 'grid' },
  { id: 'strips-3', name: '3 Horizontal Strips', rows: 3, cols: 1, mode: 'horizontal' },
];

export const EXPORT_FORMATS = [
  { id: 'png', label: 'PNG (Lossless / Transparent)', ext: 'png', mime: 'image/png' },
  { id: 'jpg', label: 'JPG (Compressed / High-Res)', ext: 'jpg', mime: 'image/jpeg' },
  { id: 'webp', label: 'WebP (Compact Web Format)', ext: 'webp', mime: 'image/webp' },
];

/**
 * Validates an image file for splitting.
 * @param {File} file 
 * @returns {string|null} Error string or null if valid
 */
export function validateSplitImage(file) {
  if (!file) return 'Please select an image to split.';
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/avif'];
  const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif'];

  const hasValidType = validTypes.includes(type);
  const hasValidExt = validExts.some(ext => name.endsWith(ext));

  if (!hasValidType && !hasValidExt) {
    return 'Unsupported image format. Please upload a JPG, PNG, WebP, GIF, or BMP image.';
  }

  if (file.size <= 0) {
    return 'The chosen file is empty. Please select a valid image.';
  }

  if (file.size > MAX_SPLIT_IMAGE_SIZE) {
    return 'File size exceeds 50 MB. Please select a smaller image.';
  }

  return null;
}

/**
 * Calculates slice rectangles given image dimensions and split options.
 * @param {number} imgWidth 
 * @param {number} imgHeight 
 * @param {object} options 
 * @returns {Array<{ id: string, index: number, row: number, col: number, x: number, y: number, width: number, height: number, label: string }>}
 */
export function calculateSlices(imgWidth, imgHeight, options = {}) {
  const {
    mode = 'grid',
    rows = 2,
    cols = 2,
    tileWidth = 1080,
    tileHeight = 1080,
    customVLines = [],
    customHLines = [],
  } = options;

  const slices = [];
  if (!imgWidth || !imgHeight || imgWidth <= 0 || imgHeight <= 0) return slices;

  // Custom Cut Lines Mode (User-placed or percentage-based split lines)
  if (mode === 'custom-lines') {
    const rawV = Array.isArray(customVLines) ? customVLines : [];
    const rawH = Array.isArray(customHLines) ? customHLines : [];

    // Filter, clamp and sort lines strictly inside image bounds
    const vLines = [...new Set(rawV.map(x => Math.round(Number(x))).filter(x => x > 0 && x < imgWidth))].sort((a, b) => a - b);
    const hLines = [...new Set(rawH.map(y => Math.round(Number(y))).filter(y => y > 0 && y < imgHeight))].sort((a, b) => a - b);

    const xBounds = [0, ...vLines, imgWidth];
    const yBounds = [0, ...hLines, imgHeight];

    const cCount = xBounds.length - 1;
    const rCount = yBounds.length - 1;

    let index = 1;
    for (let r = 0; r < rCount; r++) {
      for (let c = 0; c < cCount; c++) {
        const x = xBounds[c];
        const y = yBounds[r];
        const w = xBounds[c + 1] - x;
        const h = yBounds[r + 1] - y;

        if (w > 0 && h > 0) {
          slices.push({
            id: `slice_${r}_${c}`,
            index,
            row: r + 1,
            col: c + 1,
            x,
            y,
            width: w,
            height: h,
            label: cCount > 1 && rCount > 1 ? `Tile ${index} (R${r + 1}, C${c + 1})` : `Tile ${index}`,
          });
          index++;
        }
      }
    }
    return slices;
  }

  // Custom Exact Dimensions Mode (e.g. 1080x1080 px)
  if (mode === 'custom-size') {
    const tW = Math.max(10, Math.floor(tileWidth || 1080));
    const tH = Math.max(10, Math.floor(tileHeight || 1080));
    const cCount = Math.ceil(imgWidth / tW);
    const rCount = Math.ceil(imgHeight / tH);

    let index = 1;
    for (let r = 0; r < rCount; r++) {
      for (let c = 0; c < cCount; c++) {
        const x = c * tW;
        const y = r * tH;
        const w = Math.min(tW, imgWidth - x);
        const h = Math.min(tH, imgHeight - y);

        if (w > 0 && h > 0) {
          slices.push({
            id: `slice_${r}_${c}`,
            index,
            row: r + 1,
            col: c + 1,
            x,
            y,
            width: w,
            height: h,
            label: `Tile ${index} (R${r + 1}:C${c + 1})`,
          });
          index++;
        }
      }
    }
    return slices;
  }

  // Standard Equal Grid / Vertical / Horizontal slicing
  let rCount = Math.max(1, Math.min(50, Math.floor(rows)));
  let cCount = Math.max(1, Math.min(50, Math.floor(cols)));

  if (mode === 'vertical') {
    rCount = 1;
    cCount = Math.max(2, Math.min(50, Math.floor(cols || 2)));
  } else if (mode === 'horizontal') {
    rCount = Math.max(2, Math.min(50, Math.floor(rows || 2)));
    cCount = 1;
  }

  const cellWidth = imgWidth / cCount;
  const cellHeight = imgHeight / rCount;

  let index = 1;
  for (let r = 0; r < rCount; r++) {
    for (let c = 0; c < cCount; c++) {
      const x = Math.round(c * cellWidth);
      const y = Math.round(r * cellHeight);
      const nextX = Math.round((c + 1) * cellWidth);
      const nextY = Math.round((r + 1) * cellHeight);

      const w = Math.min(nextX - x, imgWidth - x);
      const h = Math.min(nextY - y, imgHeight - y);

      slices.push({
        id: `slice_${r}_${c}`,
        index,
        row: r + 1,
        col: c + 1,
        x,
        y,
        width: w,
        height: h,
        label: cCount > 1 && rCount > 1 ? `Part ${index} (R${r + 1}, C${c + 1})` : `Part ${index}`,
      });
      index++;
    }
  }

  return slices;
}

/**
 * Splits an image into multiple slices and generates Blobs/URLs.
 * @param {HTMLImageElement|ImageBitmap} imgObj 
 * @param {Array} slicesList 
 * @param {object} options 
 * @returns {Promise<{ slices: Array, zipBlob: Blob, zipFilename: string, totalSize: number }>}
 */
export async function generateImageSlices(imgObj, slicesList, originalFilename = 'image.png', options = {}, onProgress = null) {
  const {
    format = 'png',
    quality = 0.92,
    namingConvention = 'sequential', // 'sequential' | 'coordinates'
  } = options;

  const baseName = (originalFilename || 'split_image').replace(/\.[a-zA-Z0-9]+$/, '').trim() || 'split_image';
  const formatConfig = EXPORT_FORMATS.find(f => f.id === format) || EXPORT_FORMATS[0];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: format === 'png' });

  const generatedSlices = [];
  const zip = new JSZip();
  let totalSize = 0;

  for (let i = 0; i < slicesList.length; i++) {
    const s = slicesList[i];
    if (onProgress) {
      onProgress(`Exporting tile ${i + 1} of ${slicesList.length}…`);
    }

    canvas.width = s.width;
    canvas.height = s.height;

    ctx.clearRect(0, 0, s.width, s.height);
    ctx.drawImage(
      imgObj,
      s.x, s.y, s.width, s.height,
      0, 0, s.width, s.height
    );

    const blob = await new Promise((resolve) => {
      canvas.toBlob(
        b => resolve(b),
        formatConfig.mime,
        format === 'png' ? undefined : quality
      );
    });

    const url = URL.createObjectURL(blob);
    totalSize += blob.size;

    let filename = '';
    if (namingConvention === 'coordinates') {
      filename = `${baseName}_r${s.row}_c${s.col}.${formatConfig.ext}`;
    } else {
      const padNum = String(s.index).padStart(String(slicesList.length).length > 1 ? 2 : 1, '0');
      filename = `${baseName}_tile_${padNum}.${formatConfig.ext}`;
    }

    // Add to ZIP
    zip.file(filename, blob);

    generatedSlices.push({
      ...s,
      blob,
      url,
      filename,
      size: blob.size,
      format: formatConfig.ext.toUpperCase(),
    });
  }

  if (onProgress) {
    onProgress('Packing into ZIP archive…');
  }

  // Generate full ZIP package
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipUrl = URL.createObjectURL(zipBlob);

  canvas.width = 0;
  canvas.height = 0;

  return {
    slices: generatedSlices,
    zipBlob,
    zipUrl,
    zipFilename: `${baseName}_all_slices.zip`,
    totalSize,
  };
}
