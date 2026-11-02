/**
 * Watermark Image Utilities
 * 100% Client-side image watermarking using HTML5 Canvas
 */

export const WATERMARK_PRESETS = [
  'CONFIDENTIAL',
  '© COPYRIGHT',
  'SAMPLE',
  'DO NOT COPY',
  'DRAFT',
  'PROPRIETARY',
  'PROOF ONLY',
];

export const WATERMARK_COLORS = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Black', hex: '#0f172a' },
  { name: 'Rose Red', hex: '#e11d48' },
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Slate', hex: '#475569' },
];

export const WATERMARK_FONTS = [
  { label: 'Sans-Serif (Modern)', value: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' },
  { label: 'Impact (Bold Stamp)', value: 'Impact, Haettenschweiler, sans-serif' },
  { label: 'Arial (Clean)', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Times New Roman (Formal)', value: 'Times New Roman, Times, serif' },
  { label: 'Georgia (Editorial)', value: 'Georgia, serif' },
  { label: 'Courier (Monospace)', value: 'Courier New, Courier, monospace' },
];

export const NINE_POSITIONS = [
  { id: 'top-left', label: 'Top Left', symbol: '↖' },
  { id: 'top-center', label: 'Top Center', symbol: '↑' },
  { id: 'top-right', label: 'Top Right', symbol: '↗' },
  { id: 'middle-left', label: 'Middle Left', symbol: '←' },
  { id: 'center', label: 'Center', symbol: '•' },
  { id: 'middle-right', label: 'Middle Right', symbol: '→' },
  { id: 'bottom-left', label: 'Bottom Left', symbol: '↙' },
  { id: 'bottom-center', label: 'Bottom Center', symbol: '↓' },
  { id: 'bottom-right', label: 'Bottom Right', symbol: '↘' },
];

/**
 * Validate image file
 */
export function validateImageFile(file, maxBytes = 50 * 1024 * 1024) {
  if (!file) return { valid: false, error: 'No file selected.' };
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Selected file is not an image (JPG, PNG, WebP, SVG, BMP supported).' };
  }
  if (file.size > maxBytes) {
    return { valid: false, error: `Image file exceeds maximum allowed size (${Math.round(maxBytes / (1024 * 1024))} MB).` };
  }
  return { valid: true };
}

/**
 * Load an Image element from a File or Blob
 */
export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ img, url, width: img.naturalWidth, height: img.naturalHeight, name: file.name, size: file.size });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image.'));
    };
    img.src = url;
  });
}

/**
 * Draw watermark (text or logo) onto an existing CanvasRenderingContext2D
 */
export function drawWatermark(ctx, width, height, options) {
  const {
    type = 'text', // 'text' | 'image'
    text = 'CONFIDENTIAL',
    fontFamily = 'Plus Jakarta Sans, Inter, sans-serif',
    fontSize = 48,
    isBold = true,
    isItalic = false,
    color = '#ffffff',
    shadow = true,
    logoImage = null,
    logoScale = 25, // % of image width
    opacity = 40, // 0 - 100
    rotation = 0, // degrees
    placement = '9-point', // '9-point' | 'tiled'
    position = 'center', // 9-point id
    margin = 30, // px distance from edges
    tileSpacing = 80,
  } = options;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity / 100));

  if (type === 'image' && logoImage) {
    // Logo watermark
    const targetLogoWidth = Math.max(20, (width * (logoScale / 100)));
    const logoRatio = logoImage.naturalHeight / (logoImage.naturalWidth || 1);
    const targetLogoHeight = targetLogoWidth * logoRatio;

    if (placement === 'tiled') {
      const stepX = targetLogoWidth + tileSpacing;
      const stepY = targetLogoHeight + tileSpacing;
      const rad = (rotation * Math.PI) / 180;

      // Cover extra area for rotation
      const diag = Math.sqrt(width * width + height * height);
      ctx.translate(width / 2, height / 2);
      ctx.rotate(rad);
      ctx.translate(-diag, -diag);

      for (let y = 0; y < diag * 2; y += stepY) {
        for (let x = 0; x < diag * 2; x += stepX) {
          ctx.drawImage(logoImage, x, y, targetLogoWidth, targetLogoHeight);
        }
      }
    } else {
      // 9-point placement
      const coords = get9PointCoordinates(width, height, targetLogoWidth, targetLogoHeight, position, margin);
      ctx.translate(coords.centerX, coords.centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(logoImage, -targetLogoWidth / 2, -targetLogoHeight / 2, targetLogoWidth, targetLogoHeight);
    }
  } else if (type === 'text' && text.trim()) {
    // Text watermark
    const fontStyle = `${isItalic ? 'italic ' : ''}${isBold ? '700 ' : '400 '}${fontSize}px ${fontFamily}`;
    ctx.font = fontStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;

    if (shadow) {
      ctx.shadowColor = color.toLowerCase() === '#ffffff' ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.75)';
      ctx.shadowBlur = Math.max(2, fontSize * 0.12);
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }

    if (placement === 'tiled') {
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = fontSize * 1.2;
      const stepX = Math.max(80, textWidth + tileSpacing);
      const stepY = Math.max(60, textHeight + tileSpacing);
      const rad = (rotation * Math.PI) / 180;

      const diag = Math.sqrt(width * width + height * height);
      ctx.translate(width / 2, height / 2);
      ctx.rotate(rad);
      ctx.translate(-diag, -diag);

      for (let y = 0; y < diag * 2; y += stepY) {
        const rowOffset = (Math.floor(y / stepY) % 2) * (stepX / 2);
        for (let x = -rowOffset; x < diag * 2; x += stepX) {
          ctx.fillText(text, x, y);
        }
      }
    } else {
      // 9-point placement
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = fontSize;
      const coords = get9PointCoordinates(width, height, textWidth, textHeight, position, margin);

      ctx.translate(coords.centerX, coords.centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(text, 0, 0);
    }
  }

  ctx.restore();
}

/**
 * Calculate Center X and Center Y for 9-point placement
 */
function get9PointCoordinates(containerW, containerH, itemW, itemH, positionId, margin) {
  let cx = containerW / 2;
  let cy = containerH / 2;

  const halfW = itemW / 2;
  const halfH = itemH / 2;

  switch (positionId) {
    case 'top-left':
      cx = margin + halfW;
      cy = margin + halfH;
      break;
    case 'top-center':
      cx = containerW / 2;
      cy = margin + halfH;
      break;
    case 'top-right':
      cx = containerW - margin - halfW;
      cy = margin + halfH;
      break;
    case 'middle-left':
      cx = margin + halfW;
      cy = containerH / 2;
      break;
    case 'center':
      cx = containerW / 2;
      cy = containerH / 2;
      break;
    case 'middle-right':
      cx = containerW - margin - halfW;
      cy = containerH / 2;
      break;
    case 'bottom-left':
      cx = margin + halfW;
      cy = containerH - margin - halfH;
      break;
    case 'bottom-center':
      cx = containerW / 2;
      cy = containerH - margin - halfH;
      break;
    case 'bottom-right':
      cx = containerW - margin - halfW;
      cy = containerH - margin - halfH;
      break;
  }

  return { centerX: cx, centerY: cy };
}

/**
 * Generate watermarked image file at full resolution
 */
export async function applyWatermarkToImage(sourceImg, options) {
  const width = sourceImg.naturalWidth || sourceImg.width;
  const height = sourceImg.naturalHeight || sourceImg.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Draw original image
  ctx.drawImage(sourceImg, 0, 0, width, height);

  // Apply watermark
  drawWatermark(ctx, width, height, options);

  const format = options.format || 'image/png';
  const quality = typeof options.quality === 'number' ? options.quality : 0.92;

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to encode watermarked image'));
      },
      format,
      quality
    );
  });

  const url = URL.createObjectURL(blob);
  return {
    blob,
    url,
    width,
    height,
    size: blob.size,
  };
}

/**
 * Generate output filename
 */
export function watermarkedImageFilename(originalName, format = 'png') {
  const base = originalName.replace(/\.[^/.]+$/, '').trim() || 'image';
  const ext = format === 'jpeg' || format === 'jpg' || format === 'image/jpeg' ? 'jpg'
            : format === 'webp' || format === 'image/webp' ? 'webp'
            : 'png';
  return `${base}-watermarked.${ext}`;
}

