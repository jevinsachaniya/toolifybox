/**
 * Image Collage Maker Utility for Toolifybox
 * High-performance, 100% in-browser Canvas-based photo collage composition.
 */

export const COLLAGE_LAYOUTS = [
  { id: 'side-by-side', name: 'Left & Right', desc: 'Side-by-side split', minImages: 2, maxImages: 2 },
  { id: 'stacked', name: 'Top & Bottom', desc: 'Stacked split', minImages: 2, maxImages: 2 },
  { id: 'main-left', name: 'Main Left', desc: 'Hero on left, stack on right', minImages: 3, maxImages: 5 },
  { id: 'main-right', name: 'Main Right', desc: 'Hero on right, stack on left', minImages: 3, maxImages: 5 },
  { id: 'main-top', name: 'Main Top', desc: 'Hero on top, row on bottom', minImages: 3, maxImages: 5 },
  { id: 'main-bottom', name: 'Main Bottom', desc: 'Row on top, hero on bottom', minImages: 3, maxImages: 5 },
  { id: 'grid-2x2', name: '2 × 2 Grid', desc: 'Equal 4 quadrants', minImages: 4, maxImages: 4 },
  { id: 'three-col', name: '3 Columns', desc: 'Three vertical strips', minImages: 3, maxImages: 3 },
  { id: 'three-row', name: '3 Rows', desc: 'Three horizontal strips', minImages: 3, maxImages: 3 },
  { id: 'auto-grid', name: 'Auto Grid', desc: 'Smart balanced grid', minImages: 2, maxImages: 12 },
];

export const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square', width: 2000, height: 2000, desc: 'Instagram / Avatar' },
  { id: '4:5', label: '4:5 Portrait', width: 1600, height: 2000, desc: 'Instagram Post' },
  { id: '16:9', label: '16:9 Landscape', width: 2400, height: 1350, desc: 'Desktop / YouTube' },
  { id: '9:16', label: '9:16 Story', width: 1350, height: 2400, desc: 'Reels / Stories / TikTok' },
  { id: '4:3', label: '4:3 Classic', width: 2000, height: 1500, desc: 'Classic Photo' },
  { id: '3:2', label: '3:2 35mm', width: 2100, height: 1400, desc: 'Standard Camera' },
];

export const COLLAGE_PRESET_COLORS = [
  { label: 'Pure White', value: '#ffffff' },
  { label: 'Deep Black', value: '#000000' },
  { label: 'Slate Dark', value: '#0f172a' },
  { label: 'Warm Cream', value: '#fef3c7' },
  { label: 'Soft Gray', value: '#f1f5f9' },
  { label: 'Transparent', value: 'transparent' },
];

export const MAX_COLLAGE_IMAGES = 12;
export const MAX_COLLAGE_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

/**
 * Validates a list of uploaded images for collage building.
 */
export function validateCollageImages(fileList, existingCount = 0) {
  if (!fileList || !fileList.length) {
    return { valid: false, message: 'Please select at least one image file.' };
  }

  const files = Array.from(fileList);
  const totalCount = existingCount + files.length;

  if (totalCount > MAX_COLLAGE_IMAGES) {
    return {
      valid: false,
      message: `You can add up to ${MAX_COLLAGE_IMAGES} photos to a single collage (currently ${totalCount}).`,
    };
  }

  const validTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/avif', 'image/gif', 'image/bmp'
  ];
  const validExtensions = /\.(jpe?g|png|webp|avif|gif|bmp)$/i;

  for (const f of files) {
    const isImage = (f.type && validTypes.includes(f.type.toLowerCase())) || validExtensions.test(f.name);
    if (!isImage) {
      return {
        valid: false,
        message: `"${f.name}" is not a supported image format. Please use JPG, PNG, WebP, GIF, or BMP.`,
      };
    }
    if (f.size > MAX_COLLAGE_FILE_SIZE) {
      return {
        valid: false,
        message: `"${f.name}" exceeds the 25 MB size limit.`,
      };
    }
    if (f.size === 0) {
      return {
        valid: false,
        message: `"${f.name}" is empty (0 bytes).`,
      };
    }
  }

  return { valid: true, files };
}

/**
 * Calculates rectangle layout slots for images inside a canvas.
 * Coordinates are normalized to canvasWidth and canvasHeight.
 */
export function calculateCollageLayout(layoutId, count, canvasWidth, canvasHeight, options = {}) {
  const gap = Math.max(0, Number(options.gap ?? 12));
  const padding = Math.max(0, Number(options.padding ?? 16));
  const splitRatio = Math.min(0.8, Math.max(0.2, Number(options.splitRatio ?? 0.5)));

  const availW = Math.max(10, canvasWidth - 2 * padding);
  const availH = Math.max(10, canvasHeight - 2 * padding);

  const rects = [];

  if (count <= 1) {
    return [{ x: padding, y: padding, width: availW, height: availH }];
  }

  switch (layoutId) {
    case 'side-by-side': {
      // 2 columns (Left / Right)
      const w1 = Math.round((availW - gap) * splitRatio);
      const w2 = availW - gap - w1;
      rects.push(
        { x: padding, y: padding, width: w1, height: availH },
        { x: padding + w1 + gap, y: padding, width: w2, height: availH }
      );
      break;
    }

    case 'stacked': {
      // 2 rows (Top / Bottom)
      const h1 = Math.round((availH - gap) * splitRatio);
      const h2 = availH - gap - h1;
      rects.push(
        { x: padding, y: padding, width: availW, height: h1 },
        { x: padding, y: padding + h1 + gap, width: availW, height: h2 }
      );
      break;
    }

    case 'main-left': {
      // 1 hero on left, N-1 stacked vertically on right
      const leftW = Math.round((availW - gap) * (options.heroRatio ?? 0.58));
      const rightW = availW - gap - leftW;
      rects.push({ x: padding, y: padding, width: leftW, height: availH });

      const rightCount = count - 1;
      const rightTotalGaps = (rightCount - 1) * gap;
      const rightH = Math.floor((availH - rightTotalGaps) / rightCount);

      let curY = padding;
      for (let i = 0; i < rightCount; i++) {
        const isLast = i === rightCount - 1;
        const cellH = isLast ? (padding + availH - curY) : rightH;
        rects.push({
          x: padding + leftW + gap,
          y: curY,
          width: rightW,
          height: Math.max(10, cellH),
        });
        curY += cellH + gap;
      }
      break;
    }

    case 'main-right': {
      // N-1 stacked vertically on left, 1 hero on right
      const rightW = Math.round((availW - gap) * (options.heroRatio ?? 0.58));
      const leftW = availW - gap - rightW;

      const leftCount = count - 1;
      const leftTotalGaps = (leftCount - 1) * gap;
      const leftH = Math.floor((availH - leftTotalGaps) / leftCount);

      let curY = padding;
      for (let i = 0; i < leftCount; i++) {
        const isLast = i === leftCount - 1;
        const cellH = isLast ? (padding + availH - curY) : leftH;
        rects.push({
          x: padding,
          y: curY,
          width: leftW,
          height: Math.max(10, cellH),
        });
        curY += cellH + gap;
      }

      rects.push({
        x: padding + leftW + gap,
        y: padding,
        width: rightW,
        height: availH,
      });
      break;
    }

    case 'main-top': {
      // 1 hero banner on top, N-1 side-by-side on bottom
      const topH = Math.round((availH - gap) * (options.heroRatio ?? 0.58));
      const bottomH = availH - gap - topH;
      rects.push({ x: padding, y: padding, width: availW, height: topH });

      const botCount = count - 1;
      const botTotalGaps = (botCount - 1) * gap;
      const botW = Math.floor((availW - botTotalGaps) / botCount);

      let curX = padding;
      for (let i = 0; i < botCount; i++) {
        const isLast = i === botCount - 1;
        const cellW = isLast ? (padding + availW - curX) : botW;
        rects.push({
          x: curX,
          y: padding + topH + gap,
          width: Math.max(10, cellW),
          height: bottomH,
        });
        curX += cellW + gap;
      }
      break;
    }

    case 'main-bottom': {
      // N-1 side-by-side on top, 1 hero banner on bottom
      const botH = Math.round((availH - gap) * (options.heroRatio ?? 0.58));
      const topH = availH - gap - botH;

      const topCount = count - 1;
      const topTotalGaps = (topCount - 1) * gap;
      const topW = Math.floor((availW - topTotalGaps) / topCount);

      let curX = padding;
      for (let i = 0; i < topCount; i++) {
        const isLast = i === topCount - 1;
        const cellW = isLast ? (padding + availW - curX) : topW;
        rects.push({
          x: curX,
          y: padding,
          width: Math.max(10, cellW),
          height: topH,
        });
        curX += cellW + gap;
      }

      rects.push({
        x: padding,
        y: padding + topH + gap,
        width: availW,
        height: botH,
      });
      break;
    }

    case 'three-col': {
      // 3 vertical columns
      const totalGaps = 2 * gap;
      const cellW = Math.floor((availW - totalGaps) / 3);
      let curX = padding;
      for (let i = 0; i < 3; i++) {
        const isLast = i === 2;
        const width = isLast ? (padding + availW - curX) : cellW;
        rects.push({ x: curX, y: padding, width, height: availH });
        curX += width + gap;
      }
      break;
    }

    case 'three-row': {
      // 3 horizontal rows
      const totalGaps = 2 * gap;
      const cellH = Math.floor((availH - totalGaps) / 3);
      let curY = padding;
      for (let i = 0; i < 3; i++) {
        const isLast = i === 2;
        const height = isLast ? (padding + availH - curY) : cellH;
        rects.push({ x: padding, y: curY, width: availW, height });
        curY += height + gap;
      }
      break;
    }

    case 'grid-2x2': {
      const halfW = Math.floor((availW - gap) / 2);
      const halfH = Math.floor((availH - gap) / 2);
      const w2 = availW - gap - halfW;
      const h2 = availH - gap - halfH;

      rects.push(
        { x: padding, y: padding, width: halfW, height: halfH },
        { x: padding + halfW + gap, y: padding, width: w2, height: halfH },
        { x: padding, y: padding + halfH + gap, width: halfW, height: h2 },
        { x: padding + halfW + gap, y: padding + halfH + gap, width: w2, height: h2 }
      );
      break;
    }

    case 'auto-grid':
    default: {
      // Determine optimal columns & rows
      let cols = 1;
      let rows = 1;

      if (count === 2) {
        cols = 2; rows = 1;
      } else if (count === 3) {
        cols = 3; rows = 1;
      } else if (count === 4) {
        cols = 2; rows = 2;
      } else if (count <= 6) {
        cols = 3; rows = 2;
      } else if (count <= 8) {
        cols = 4; rows = 2;
      } else if (count === 9) {
        cols = 3; rows = 3;
      } else {
        cols = 4; rows = Math.ceil(count / 4);
      }

      const totalGapW = (cols - 1) * gap;
      const totalGapH = (rows - 1) * gap;
      const cellW = Math.floor((availW - totalGapW) / cols);
      const cellH = Math.floor((availH - totalGapH) / rows);

      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = padding + col * (cellW + gap);
        const y = padding + row * (cellH + gap);

        const isLastCol = col === cols - 1;
        const isLastRow = row === rows - 1;

        const w = isLastCol ? (padding + availW - x) : cellW;
        const h = isLastRow ? (padding + availH - y) : cellH;

        rects.push({
          x,
          y,
          width: Math.max(10, w),
          height: Math.max(10, h),
        });
      }
      break;
    }
  }

  return rects.slice(0, count);
}

/**
 * Renders an image inside a bounding cell on a 2D canvas context.
 * Supports:
 * - Cover (crop to fill) vs Contain (fit entire image)
 * - Corner radius clipping
 * - Rotation (0, 90, 180, 270 degrees)
 * - Flip horizontal/vertical
 */
export function drawImageInCell(ctx, img, rect, options = {}) {
  const { x, y, width, height } = rect;
  if (!img || width <= 0 || height <= 0) return;

  const radius = Math.max(0, Math.min(Number(options.radius ?? 0), width / 2, height / 2));
  const fitMode = options.fitMode || 'cover';
  const rotation = (options.rotation || 0) % 360;
  const flipH = Boolean(options.flipH);
  const flipV = Boolean(options.flipV);

  ctx.save();

  // Apply rounded corner clipping
  ctx.beginPath();
  if (radius > 0 && typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else if (radius > 0) {
    // Manual fallback for older browser canvas contexts
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
  } else {
    ctx.rect(x, y, width, height);
  }
  ctx.closePath();
  ctx.clip();

  // Draw cell background if provided
  if (options.cellBackground && options.cellBackground !== 'transparent') {
    ctx.fillStyle = options.cellBackground;
    ctx.fillRect(x, y, width, height);
  }

  // Handle Rotation / Orientation transforms
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  ctx.translate(centerX, centerY);

  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }
  if (flipH || flipV) {
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  }

  // For 90 or 270 deg rotations, target dimensions swap
  const isRotatedQuarter = rotation === 90 || rotation === 270;
  const targetW = isRotatedQuarter ? height : width;
  const targetH = isRotatedQuarter ? width : height;

  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;

  // Handle image crop coordinates if provided
  let sx = 0;
  let sy = 0;
  let sWidth = naturalW;
  let sHeight = naturalH;

  if (options.crop && typeof options.crop === 'object') {
    const c = options.crop;
    const nx = Math.max(0, Math.min(1, Number(c.x || 0)));
    const ny = Math.max(0, Math.min(1, Number(c.y || 0)));
    const nw = Math.max(0.01, Math.min(1 - nx, Number(c.width || 1)));
    const nh = Math.max(0.01, Math.min(1 - ny, Number(c.height || 1)));

    sx = Math.round(nx * naturalW);
    sy = Math.round(ny * naturalH);
    sWidth = Math.max(1, Math.round(nw * naturalW));
    sHeight = Math.max(1, Math.round(nh * naturalH));
  }

  const srcW = sWidth;
  const srcH = sHeight;

  let drawW = targetW;
  let drawH = targetH;
  let offsetX = -targetW / 2;
  let offsetY = -targetH / 2;

  const imgRatio = srcW / srcH;
  const targetRatio = targetW / targetH;

  if (fitMode === 'cover') {
    if (imgRatio > targetRatio) {
      // Image is wider than target
      drawH = targetH;
      drawW = targetH * imgRatio;
      offsetX = -drawW / 2;
      offsetY = -targetH / 2;
    } else {
      // Image is taller than target
      drawW = targetW;
      drawH = targetW / imgRatio;
      offsetX = -targetW / 2;
      offsetY = -drawH / 2;
    }
  } else {
    // 'contain'
    if (imgRatio > targetRatio) {
      drawW = targetW;
      drawH = targetW / imgRatio;
      offsetX = -targetW / 2;
      offsetY = -drawH / 2;
    } else {
      drawH = targetH;
      drawW = targetH * imgRatio;
      offsetX = -drawW / 2;
      offsetY = -targetH / 2;
    }
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sWidth, sHeight, offsetX, offsetY, drawW, drawH);

  ctx.restore();
}

/**
 * Calculates a normalized crop box { x, y, width, height } where values are 0..1 fractions.
 */
export function calculateNormalizedCrop(x, y, width, height, imageWidth, imageHeight) {
  if (!imageWidth || !imageHeight || imageWidth <= 0 || imageHeight <= 0) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }
  const normX = Math.max(0, Math.min(1, x / imageWidth));
  const normY = Math.max(0, Math.min(1, y / imageHeight));
  const normW = Math.max(0.01, Math.min(1 - normX, width / imageWidth));
  const normH = Math.max(0.01, Math.min(1 - normY, height / imageHeight));
  return {
    x: Number(normX.toFixed(4)),
    y: Number(normY.toFixed(4)),
    width: Number(normW.toFixed(4)),
    height: Number(normH.toFixed(4)),
  };
}

/**
 * Computes a centered crop preset for an image given a target aspect ratio.
 */
export function getAspectCropPreset(naturalWidth, naturalHeight, targetAspectRatio) {
  if (!naturalWidth || !naturalHeight || !targetAspectRatio || targetAspectRatio <= 0) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }

  const imageRatio = naturalWidth / naturalHeight;
  if (imageRatio > targetAspectRatio) {
    // Image is wider than target: crop horizontal sides
    const targetW = naturalHeight * targetAspectRatio;
    const cropX = (naturalWidth - targetW) / 2;
    return calculateNormalizedCrop(cropX, 0, targetW, naturalHeight, naturalWidth, naturalHeight);
  } else {
    // Image is taller than target: crop vertical top/bottom
    const targetH = naturalWidth / targetAspectRatio;
    const cropY = (naturalHeight - targetH) / 2;
    return calculateNormalizedCrop(0, cropY, naturalWidth, targetH, naturalWidth, naturalHeight);
  }
}

/**
 * Generates an output filename for the collage image.
 */
export function collageOutputFilename(format = 'jpg') {
  const ext = format.toLowerCase() === 'png' ? 'png' : 'jpg';
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `wemakepdf_collage_${timestamp}.${ext}`;
}

