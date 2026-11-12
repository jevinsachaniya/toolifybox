/**
 * Passport Photo Maker Engine
 * High-precision biometric sizing, background removal & replacement,
 * photo enhancements, and print sheet tiling with PDF export.
 */

// DPI standards
export const DEFAULT_DPI = 300;

// Conversion helpers
export function mmToPixels(mm, dpi = DEFAULT_DPI) {
  return Math.round((mm / 25.4) * dpi);
}

export function inchesToPixels(inches, dpi = DEFAULT_DPI) {
  return Math.round(inches * dpi);
}

export function pixelsToMm(px, dpi = DEFAULT_DPI) {
  return Number(((px / dpi) * 25.4).toFixed(1));
}

export function pixelsToInches(px, dpi = DEFAULT_DPI) {
  return Number((px / dpi).toFixed(2));
}

/**
 * Standard International Passport & Visa Presets
 */
export const PASSPORT_PRESETS = [
  {
    id: 'us_passport',
    name: 'United States',
    label: 'US Passport & Visa',
    country: 'United States',
    flag: '🇺🇸',
    widthMm: 50.8, // 2 inches
    heightMm: 50.8,
    widthInches: 2,
    heightInches: 2,
    widthPx: 600,
    heightPx: 600,
    aspectRatio: 1,
    defaultBg: '#ffffff',
    allowedBgs: ['#ffffff', '#f8fafc'],
    headRatioMin: 0.50, // 1 to 1 3/8 inches = 50% to 69%
    headRatioMax: 0.69,
    description: '2 × 2 inches (51 × 51 mm), white background, head between 1 and 1 3/8 inches.',
  },
  {
    id: 'in_passport',
    name: 'India Passport',
    label: 'India Passport & OCI',
    country: 'India',
    flag: '🇮🇳',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    aspectRatio: 35 / 45,
    defaultBg: '#ffffff',
    allowedBgs: ['#ffffff', '#f3f4f6', '#dbeafe'],
    headRatioMin: 0.70,
    headRatioMax: 0.80,
    description: '35 × 45 mm (3.5 × 4.5 cm), white/off-white background, face covering 70-80%.',
  },
  {
    id: 'in_pan',
    name: 'India PAN Card',
    label: 'India PAN / Driving License',
    country: 'India',
    flag: '🇮🇳',
    widthMm: 25,
    heightMm: 35,
    widthPx: 295,
    heightPx: 413,
    aspectRatio: 25 / 35,
    defaultBg: '#ffffff',
    allowedBgs: ['#ffffff'],
    headRatioMin: 0.70,
    headRatioMax: 0.80,
    description: '25 × 35 mm, clear white background for PAN cards and government IDs.',
  },
  {
    id: 'in_visa_us',
    name: 'India Visa (2x2")',
    label: 'India Visa & Overseas 2×2"',
    country: 'India',
    flag: '🇮🇳',
    widthMm: 50.8,
    heightMm: 50.8,
    widthInches: 2,
    heightInches: 2,
    widthPx: 600,
    heightPx: 600,
    aspectRatio: 1,
    defaultBg: '#ffffff',
    allowedBgs: ['#ffffff'],
    headRatioMin: 0.60,
    headRatioMax: 0.75,
    description: '51 × 51 mm (2 × 2 inches) square size for Indian visa online applications.',
  },
  {
    id: 'uk_passport',
    name: 'United Kingdom',
    label: 'UK Passport & Driving License',
    country: 'United Kingdom',
    flag: '🇬🇧',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    aspectRatio: 35 / 45,
    defaultBg: '#f3f4f6', // Light grey / cream
    allowedBgs: ['#f3f4f6', '#ffffff', '#e5e7eb'],
    headRatioMin: 0.64, // 29mm to 34mm = 64% - 75%
    headRatioMax: 0.75,
    description: '35 × 45 mm, plain light grey or cream background, head 29 to 34 mm.',
  },
  {
    id: 'schengen_visa',
    name: 'Schengen / Europe',
    label: 'Schengen Visa (EU 27 Countries)',
    country: 'European Union',
    flag: '🇪🇺',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    aspectRatio: 35 / 45,
    defaultBg: '#f3f4f6',
    allowedBgs: ['#f3f4f6', '#ffffff', '#e2e8f0'],
    headRatioMin: 0.70, // 32mm to 36mm = 70% - 80%
    headRatioMax: 0.80,
    description: '35 × 45 mm for Germany, France, Italy, Spain, etc. Face takes 70–80% of height.',
  },
  {
    id: 'ca_passport',
    name: 'Canada',
    label: 'Canada Passport & Visa',
    country: 'Canada',
    flag: '🇨🇦',
    widthMm: 50,
    heightMm: 70,
    widthPx: 591,
    heightPx: 827,
    aspectRatio: 50 / 70,
    defaultBg: '#ffffff',
    allowedBgs: ['#ffffff', '#f8fafc'],
    headRatioMin: 0.44, // 31mm to 36mm = 44% - 51%
    headRatioMax: 0.52,
    description: '50 × 70 mm (2 × 2.75 in), white background, head height between 31 and 36 mm.',
  },
  {
    id: 'au_passport',
    name: 'Australia / NZ',
    label: 'Australia & New Zealand Passport',
    country: 'Australia',
    flag: '🇦🇺',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    aspectRatio: 35 / 45,
    defaultBg: '#ffffff',
    allowedBgs: ['#ffffff', '#f3f4f6'],
    headRatioMin: 0.71, // 32mm to 36mm
    headRatioMax: 0.80,
    description: '35 × 45 mm, clean white or light grey background, head height 32 to 36 mm.',
  },
  {
    id: 'cn_passport',
    name: 'China',
    label: 'China Passport & Visa',
    country: 'China',
    flag: '🇨🇳',
    widthMm: 33,
    heightMm: 48,
    widthPx: 390,
    heightPx: 567,
    aspectRatio: 33 / 48,
    defaultBg: '#ffffff',
    allowedBgs: ['#ffffff', '#93c5fd'],
    headRatioMin: 0.58, // 28mm to 33mm
    headRatioMax: 0.69,
    description: '33 × 48 mm, pure white background (or light blue for specific visas).',
  },
  {
    id: 'jp_passport',
    name: 'Japan',
    label: 'Japan Passport & Visa',
    country: 'Japan',
    flag: '🇯🇵',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    aspectRatio: 35 / 45,
    defaultBg: '#ffffff',
    allowedBgs: ['#ffffff', '#f8fafc'],
    headRatioMin: 0.70,
    headRatioMax: 0.80,
    description: '35 × 45 mm, solid white plain background, facial features clearly centered.',
  },
  {
    id: 'sg_passport',
    name: 'Singapore',
    label: 'Singapore Passport & NRIC',
    country: 'Singapore',
    flag: '🇸🇬',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    aspectRatio: 35 / 45,
    defaultBg: '#ffffff',
    allowedBgs: ['#ffffff'],
    headRatioMin: 0.70,
    headRatioMax: 0.80,
    description: '35 × 45 mm, plain white background, crown to chin between 25 and 35 mm.',
  },
  {
    id: 'my_passport',
    name: 'Malaysia',
    label: 'Malaysia Passport',
    country: 'Malaysia',
    flag: '🇲🇾',
    widthMm: 35,
    heightMm: 50,
    widthPx: 413,
    heightPx: 591,
    aspectRatio: 35 / 50,
    defaultBg: '#ffffff',
    allowedBgs: ['#ffffff', '#3b82f6'],
    headRatioMin: 0.60,
    headRatioMax: 0.70,
    description: '35 × 50 mm, plain white background (or royal blue for certain ID cards).',
  },
  {
    id: 'ae_visa',
    name: 'UAE / Dubai',
    label: 'UAE & Dubai Visa / Emirates ID',
    country: 'United Arab Emirates',
    flag: '🇦🇪',
    widthMm: 40,
    heightMm: 60,
    widthPx: 472,
    heightPx: 709,
    aspectRatio: 40 / 60,
    defaultBg: '#ffffff',
    allowedBgs: ['#ffffff', '#f8fafc'],
    headRatioMin: 0.70,
    headRatioMax: 0.80,
    description: '40 × 60 mm (or 43 × 55 mm), pure white background for Emirates ID & Visas.',
  },
  {
    id: 'custom',
    name: 'Custom Size',
    label: 'Custom Dimensions (mm / in)',
    country: 'Custom',
    flag: '⚙️',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    aspectRatio: 35 / 45,
    defaultBg: '#ffffff',
    allowedBgs: ['#ffffff', '#f3f4f6', '#dbeafe', '#3b82f6', '#dc2626'],
    headRatioMin: 0.65,
    headRatioMax: 0.80,
    description: 'Enter custom width and height in millimeters, inches, or pixels.',
  },
];

/**
 * Standard Passport Background Color Presets
 */
export const PASSPORT_BG_PRESETS = [
  { id: 'white', label: 'Pure White', hex: '#ffffff', border: '#e2e8f0', standard: 'US, India, UK, Schengen, Global' },
  { id: 'light-grey', label: 'Light Grey', hex: '#f3f4f6', border: '#cbd5e1', standard: 'UK, Schengen, Europe' },
  { id: 'off-white', label: 'Off-White', hex: '#f8fafc', border: '#cbd5e1', standard: 'Neutral studio look' },
  { id: 'light-blue', label: 'Light Blue', hex: '#dbeafe', border: '#93c5fd', standard: 'Oman, Malaysia, Visas' },
  { id: 'royal-blue', label: 'Royal Blue', hex: '#2563eb', border: '#1d4ed8', standard: 'Malaysia IC, Kuwait' },
  { id: 'red', label: 'Official Red', hex: '#dc2626', border: '#b91c1c', standard: 'Indonesia, Specific visas' },
  { id: 'transparent', label: 'Transparent', hex: 'transparent', border: '#cbd5e1', standard: 'Cutout PNG without fill' },
];

/**
 * Standard Print Paper Sizes
 */
export const PRINT_SHEET_SIZES = [
  {
    id: 'single',
    name: 'Single Photo',
    label: 'Single Photo (Digital Copy)',
    widthMm: 0,
    heightMm: 0,
    widthInches: 0,
    heightInches: 0,
    description: 'Standard single passport photo for online visa applications & portals.',
  },
  {
    id: '4x6',
    name: '4 × 6 inches',
    label: '4 × 6" Photo Paper (10 × 15 cm)',
    widthMm: 101.6,
    heightMm: 152.4,
    widthInches: 4,
    heightInches: 6,
    widthPx: 1200,
    heightPx: 1800,
    description: 'Most common pharmacy & photo lab print size (Costco, Walmart, Boots).',
  },
  {
    id: '5x7',
    name: '5 × 7 inches',
    label: '5 × 7" Photo Paper (13 × 18 cm)',
    widthMm: 127.0,
    heightMm: 177.8,
    widthInches: 5,
    heightInches: 7,
    widthPx: 1500,
    heightPx: 2100,
    description: 'Medium portrait photo sheet fitting up to 12 passport photos.',
  },
  {
    id: 'a4',
    name: 'A4 Paper',
    label: 'A4 Sheet (210 × 297 mm)',
    widthMm: 210,
    heightMm: 297,
    widthInches: 8.27,
    heightInches: 11.69,
    widthPx: 2480,
    heightPx: 3508,
    description: 'Standard home or office paper size fitting up to 30+ passport photos.',
  },
];

/**
 * Validate input image file
 */
export function validatePassportPhotoFile(file) {
  if (!file) return 'Please select an image file to make a passport photo.';
  if (file.size === 0) return 'The selected file is empty (0 bytes).';
  if (file.size > 50 * 1024 * 1024) {
    return 'File size exceeds the 50 MB limit. Please select a smaller photo.';
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/avif', 'image/tiff'];
  const name = (file.name || '').toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.avif', '.tiff'];
  const hasValidExt = validExtensions.some(ext => name.endsWith(ext));

  if (file.type && !validTypes.includes(file.type) && !hasValidExt) {
    return 'Unsupported file format. Please upload a JPG, PNG, or WebP photo.';
  }

  return '';
}

/**
 * Clean output filename formatter
 */
export function formatPassportOutputFilename(originalName = 'photo', presetId = 'passport', ext = 'jpg', isSheet = false) {
  const base = (originalName || 'photo')
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-');
  const cleanBase = base.slice(0, 32) || 'passport';
  return isSheet
    ? `${cleanBase}-passport-print-sheet.${ext}`
    : `${cleanBase}-${presetId}.${ext}`;
}

/**
 * Calculate multi-photo grid layout for a given sheet and photo size
 */
export function calculateSheetGrid({
  sheetWidthPx,
  sheetHeightPx,
  photoWidthPx,
  photoHeightPx,
  marginPx = 20,
  spacingPx = 16,
}) {
  // Try normal orientation
  let availW = Math.max(photoWidthPx, sheetWidthPx - marginPx * 2);
  let availH = Math.max(photoHeightPx, sheetHeightPx - marginPx * 2);

  const colsA = Math.max(1, Math.floor((availW + spacingPx) / (photoWidthPx + spacingPx)));
  const rowsA = Math.max(1, Math.floor((availH + spacingPx) / (photoHeightPx + spacingPx)));
  const countA = colsA * rowsA;

  // Try rotated sheet orientation (if landscape fits more)
  const colsB = Math.max(1, Math.floor((sheetHeightPx - marginPx * 2 + spacingPx) / (photoWidthPx + spacingPx)));
  const rowsB = Math.max(1, Math.floor((sheetWidthPx - marginPx * 2 + spacingPx) / (photoHeightPx + spacingPx)));
  const countB = colsB * rowsB;

  let cols = colsA;
  let rows = rowsA;
  let actualSheetW = sheetWidthPx;
  let actualSheetH = sheetHeightPx;

  if (countB > countA) {
    cols = colsB;
    rows = rowsB;
    actualSheetW = sheetHeightPx;
    actualSheetH = sheetWidthPx;
  }

  const totalGridW = cols * photoWidthPx + (cols - 1) * spacingPx;
  const totalGridH = rows * photoHeightPx + (rows - 1) * spacingPx;
  const startX = Math.max(0, Math.round((actualSheetW - totalGridW) / 2));
  const startY = Math.max(0, Math.round((actualSheetH - totalGridH) / 2));

  const photoPositions = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * (photoWidthPx + spacingPx);
      const y = startY + r * (photoHeightPx + spacingPx);
      photoPositions.push({ x, y, width: photoWidthPx, height: photoHeightPx, col: c, row: r });
    }
  }

  return {
    cols,
    rows,
    totalPhotos: photoPositions.length,
    sheetWidth: actualSheetW,
    sheetHeight: actualSheetH,
    spacing: spacingPx,
    positions: photoPositions,
  };
}

/**
 * Expand foreground mask to prevent or recover over-cut hair, ears, and clothing
 * @param {HTMLCanvasElement} cutoutCanvas
 * @param {HTMLImageElement|HTMLCanvasElement} originalImageOrCanvas
 * @param {number} [expandRadius=2] Radius in pixels to dilate foreground (1-8)
 * @returns {HTMLCanvasElement}
 */
export function expandForegroundMask(cutoutCanvas, originalImageOrCanvas, expandRadius = 2) {
  if (typeof document === 'undefined' || !cutoutCanvas || !originalImageOrCanvas) return cutoutCanvas;
  const radius = Math.min(8, Math.max(0, Math.round(expandRadius)));
  if (radius <= 0) return cutoutCanvas;

  const w = cutoutCanvas.width;
  const h = cutoutCanvas.height;

  const cutCtx = cutoutCanvas.getContext('2d');
  const cutImgData = cutCtx.getImageData(0, 0, w, h);
  const cutPixels = cutImgData.data;

  // Extract original un-cut pixels
  const origCanvas = document.createElement('canvas');
  origCanvas.width = w;
  origCanvas.height = h;
  const origCtx = origCanvas.getContext('2d');
  origCtx.drawImage(originalImageOrCanvas, 0, 0, w, h);
  const origPixels = origCtx.getImageData(0, 0, w, h).data;

  const total = w * h;
  const isForeground = new Uint8Array(total);

  for (let i = 0; i < total; i++) {
    if (cutPixels[i * 4 + 3] > 64) {
      isForeground[i] = 1;
    }
  }

  // Find transparent pixels adjacent to foreground within radius
  const r2 = radius * radius;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (isForeground[idx] === 0) {
        let foundFg = false;
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy > r2) continue;
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            if (isForeground[ny * w + nx] === 1) {
              foundFg = true;
              break;
            }
          }
          if (foundFg) break;
        }

        if (foundFg) {
          const offset = idx * 4;
          cutPixels[offset] = origPixels[offset];
          cutPixels[offset + 1] = origPixels[offset + 1];
          cutPixels[offset + 2] = origPixels[offset + 2];
          cutPixels[offset + 3] = origPixels[offset + 3] || 255;
        }
      }
    }
  }

  cutCtx.putImageData(cutImgData, 0, 0);
  return cutoutCanvas;
}

/**
 * Apply Photo Filters (Brightness, Contrast, Saturation, Exposure)
 */
export function buildFilterCss({ brightness = 0, contrast = 0, saturation = 0, exposure = 0 }) {
  const b = 1 + (brightness + exposure) / 100;
  const c = 1 + contrast / 100;
  const s = 1 + saturation / 100;
  return `brightness(${b.toFixed(3)}) contrast(${c.toFixed(3)}) saturate(${s.toFixed(3)})`;
}

/**
 * Render single passport photo to an HTML Canvas
 */
export function renderPassportCanvas({
  sourceCanvasOrImage,
  targetWidthPx = 600,
  targetHeightPx = 600,
  bgColor = '#ffffff',
  scale = 1.0,
  offsetX = 0, // In pixels
  offsetY = 0,
  rotationDeg = 0,
  flipHorizontal = false,
  adjustments = { brightness: 0, contrast: 0, saturation: 0, exposure: 0 },
  addBorder = false,
  borderColor = '#cbd5e1',
  borderWidth = 1,
}) {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = targetWidthPx;
  canvas.height = targetHeightPx;
  const ctx = canvas.getContext('2d');

  // 1. Fill Background
  if (bgColor && bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);
  } else {
    ctx.clearRect(0, 0, targetWidthPx, targetHeightPx);
  }

  // 2. Render Transformed & Filtered Image
  if (sourceCanvasOrImage) {
    ctx.save();

    // Clip to passport canvas bounds
    ctx.beginPath();
    ctx.rect(0, 0, targetWidthPx, targetHeightPx);
    ctx.clip();

    // Setup photo filters
    const filterStr = buildFilterCss(adjustments);
    if (filterStr && ctx.filter !== undefined) {
      ctx.filter = filterStr;
    }

    // Transform anchor to center of canvas
    ctx.translate(targetWidthPx / 2 + offsetX, targetHeightPx / 2 + offsetY);

    // Apply rotation
    if (rotationDeg !== 0) {
      ctx.rotate((rotationDeg * Math.PI) / 180);
    }

    // Apply flip horizontal
    if (flipHorizontal) {
      ctx.scale(-1, 1);
    }

    // Compute scaled draw dimensions
    const srcW = sourceCanvasOrImage.width || sourceCanvasOrImage.naturalWidth || targetWidthPx;
    const srcH = sourceCanvasOrImage.height || sourceCanvasOrImage.naturalHeight || targetHeightPx;

    // Base fill scale (contain or cover baseline)
    const baseScale = Math.max(targetWidthPx / srcW, targetHeightPx / srcH);
    const finalScale = baseScale * scale;

    const drawW = srcW * finalScale;
    const drawH = srcH * finalScale;

    ctx.drawImage(sourceCanvasOrImage, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  // 3. Optional Hairline Border for scissors cutting
  if (addBorder) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, targetWidthPx - borderWidth, targetHeightPx - borderWidth);
  }

  return canvas;
}

/**
 * Render Complete Printable Sheet Canvas (e.g. 4x6" with multiple passport photos)
 */
export function renderPrintSheetCanvas({
  passportCanvas,
  sheetConfig,
  marginMm = 3,
  spacingMm = 2,
  addCutMarks = true,
  addBorder = true,
  borderColor = '#d1d5db',
  dpi = DEFAULT_DPI,
}) {
  if (typeof document === 'undefined' || !passportCanvas) return null;

  const sheetWidthPx = mmToPixels(sheetConfig.widthMm, dpi);
  const sheetHeightPx = mmToPixels(sheetConfig.heightMm, dpi);
  const marginPx = mmToPixels(marginMm, dpi);
  const spacingPx = mmToPixels(spacingMm, dpi);

  const grid = calculateSheetGrid({
    sheetWidthPx,
    sheetHeightPx,
    photoWidthPx: passportCanvas.width,
    photoHeightPx: passportCanvas.height,
    marginPx,
    spacingPx,
  });

  const canvas = document.createElement('canvas');
  canvas.width = grid.sheetWidth;
  canvas.height = grid.sheetHeight;
  const ctx = canvas.getContext('2d');

  // Sheet background is pure print white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render each passport photo
  for (const pos of grid.positions) {
    ctx.drawImage(passportCanvas, pos.x, pos.y, pos.width, pos.height);

    // Subtle cutting border around each photo
    if (addBorder) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);
    }
  }

  // Draw Scissor Cutting Guides / Crop Marks around photos
  if (addCutMarks && grid.positions.length > 0) {
    const markLength = Math.round(15 * (dpi / 300));
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;

    for (const pos of grid.positions) {
      const { x, y, width, height } = pos;

      // Top-Left corner marks
      ctx.beginPath();
      ctx.moveTo(x - markLength, y);
      ctx.lineTo(x, y);
      ctx.moveTo(x, y - markLength);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Top-Right corner marks
      ctx.beginPath();
      ctx.moveTo(x + width + markLength, y);
      ctx.lineTo(x + width, y);
      ctx.moveTo(x + width, y - markLength);
      ctx.lineTo(x + width, y);
      ctx.stroke();

      // Bottom-Left corner marks
      ctx.beginPath();
      ctx.moveTo(x - markLength, y + height);
      ctx.lineTo(x, y + height);
      ctx.moveTo(x, y + height + markLength);
      ctx.lineTo(x, y + height);
      ctx.stroke();

      // Bottom-Right corner marks
      ctx.beginPath();
      ctx.moveTo(x + width + markLength, y + height);
      ctx.lineTo(x + width, y + height);
      ctx.moveTo(x + width, y + height + markLength);
      ctx.lineTo(x + width, y + height);
      ctx.stroke();
    }
  }

  return {
    canvas,
    grid,
  };
}

/**
 * Generate PDF for Print Sheet using jsPDF
 */
export async function exportSheetToPdf(sheetCanvas, sheetConfig) {
  const { jsPDF } = await import('jspdf');

  const isLandscape = sheetCanvas.width > sheetCanvas.height;
  const orientation = isLandscape ? 'landscape' : 'portrait';

  // Format dimensions in millimeters
  const docWidth = isLandscape
    ? Math.max(sheetConfig.widthMm, sheetConfig.heightMm)
    : Math.min(sheetConfig.widthMm, sheetConfig.heightMm);
  const docHeight = isLandscape
    ? Math.min(sheetConfig.widthMm, sheetConfig.heightMm)
    : Math.max(sheetConfig.widthMm, sheetConfig.heightMm);

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [docWidth, docHeight],
    compress: true,
  });

  const imgData = sheetCanvas.toDataURL('image/jpeg', 0.98);
  pdf.addImage(imgData, 'JPEG', 0, 0, docWidth, docHeight, undefined, 'FAST');

  return pdf.output('blob');
}

/**
 * Canvas to Blob Promise
 */
export function canvasToBlob(canvas, mimeType = 'image/jpeg', quality = 0.95) {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), mimeType, quality);
  });
}

/**
 * Generate a high quality sample professional portrait
 * Allows instant 1-click test without requiring user upload
 */
export function createSamplePassportPortrait() {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 750;
  const ctx = canvas.getContext('2d');

  // Background - realistic indoor office wall with soft lighting gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 600, 750);
  bgGrad.addColorStop(0, '#e2e8f0');
  bgGrad.addColorStop(0.5, '#cbd5e1');
  bgGrad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 600, 750);

  // Soft studio vignette shadow
  const vignette = ctx.createRadialGradient(300, 320, 150, 300, 320, 420);
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
  vignette.addColorStop(1, 'rgba(30, 41, 59, 0.35)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 600, 750);

  // Suit / Shoulders
  ctx.save();
  ctx.fillStyle = '#1e293b'; // Navy formal suit jacket
  ctx.beginPath();
  ctx.ellipse(300, 720, 260, 190, 0, 0, Math.PI * 2);
  ctx.fill();

  // White formal dress shirt collar
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(250, 520);
  ctx.lineTo(300, 610);
  ctx.lineTo(350, 520);
  ctx.lineTo(300, 550);
  ctx.closePath();
  ctx.fill();

  // Silk Burgundy Tie
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.moveTo(290, 570);
  ctx.lineTo(310, 570);
  ctx.lineTo(318, 750);
  ctx.lineTo(282, 750);
  ctx.closePath();
  ctx.fill();

  // Lapels
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(230, 530);
  ctx.lineTo(285, 680);
  ctx.moveTo(370, 530);
  ctx.lineTo(315, 680);
  ctx.stroke();

  // Neck
  ctx.fillStyle = '#e5a882';
  ctx.beginPath();
  ctx.rect(265, 430, 70, 110);
  ctx.fill();

  // Face Oval
  ctx.fillStyle = '#f8b88b';
  ctx.beginPath();
  ctx.ellipse(300, 350, 110, 145, 0, 0, Math.PI * 2);
  ctx.fill();

  // Jawline shade
  ctx.fillStyle = 'rgba(180, 83, 9, 0.15)';
  ctx.beginPath();
  ctx.arc(300, 420, 65, 0, Math.PI);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#292524';
  ctx.beginPath();
  ctx.ellipse(300, 260, 118, 90, 0, 0, Math.PI, true);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#f8b88b';
  ctx.beginPath();
  ctx.ellipse(186, 350, 15, 28, 0, 0, Math.PI * 2);
  ctx.ellipse(414, 350, 15, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(235, 310);
  ctx.quadraticCurveTo(260, 300, 280, 310);
  ctx.moveTo(320, 310);
  ctx.quadraticCurveTo(340, 300, 365, 310);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(258, 330, 18, 10, 0, 0, Math.PI * 2);
  ctx.ellipse(342, 330, 18, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Irises
  ctx.fillStyle = '#3b2512';
  ctx.beginPath();
  ctx.arc(258, 330, 7, 0, Math.PI * 2);
  ctx.arc(342, 330, 7, 0, Math.PI * 2);
  ctx.fill();

  // Eye highlights
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(256, 328, 2.5, 0, Math.PI * 2);
  ctx.arc(340, 328, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.strokeStyle = '#c2794c';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(300, 325);
  ctx.lineTo(296, 375);
  ctx.lineTo(306, 375);
  ctx.stroke();

  // Neutral mouth (passport compliance: closed, relaxed)
  ctx.strokeStyle = '#9f3a3a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(278, 415);
  ctx.lineTo(322, 415);
  ctx.stroke();

  ctx.restore();
  return canvas;
}
