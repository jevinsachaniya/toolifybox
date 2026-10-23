import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const MAX_WATERMARK_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
export const MAX_WATERMARK_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB

/**
 * Validates an uploaded watermark image file (PNG, JPG, WebP, SVG).
 */
export function validateWatermarkImageFile(file) {
  if (!file) return 'Please select an image file for the watermark.';
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  const validExts = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.bmp'];
  const hasValidExt = validExts.some(ext => name.endsWith(ext));
  const hasValidType = type.startsWith('image/');

  if (!hasValidExt && !hasValidType) {
    return 'Please select a valid image file (PNG, JPG, or WebP). Transparent PNGs work best.';
  }

  if (file.size <= 0) {
    return 'The selected image file is empty.';
  }

  if (file.size > MAX_WATERMARK_IMAGE_SIZE) {
    return 'Watermark image file exceeds the 15 MB limit. Please select a smaller image.';
  }

  return '';
}

/**
 * Loads and processes an image file into PNG bytes and an HTMLImageElement for live preview & PDF embedding.
 */
export async function loadWatermarkImage(file) {
  const validationError = validateWatermarkImageFile(file);
  if (validationError) throw new Error(validationError);

  if (typeof document === 'undefined') {
    const arrayBuffer = await file.arrayBuffer();
    return {
      bytes: new Uint8Array(arrayBuffer),
      type: file.type || 'image/png',
      name: file.name,
      size: file.size,
    };
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, img.naturalWidth || img.width || 100);
        canvas.height = Math.max(1, img.naturalHeight || img.height || 100);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(async (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            return reject(new Error('Failed to process image watermark.'));
          }
          const arrayBuffer = await blob.arrayBuffer();
          resolve({
            bytes: new Uint8Array(arrayBuffer),
            type: 'image/png',
            width: canvas.width,
            height: canvas.height,
            imageElement: img,
            name: file.name,
            size: file.size,
          });
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image. Please select a valid PNG, JPG, or WebP image.'));
    };
    img.src = url;
  });
}

export const WATERMARK_PRESETS = [
  'CONFIDENTIAL',
  'DRAFT',
  'SAMPLE',
  'DO NOT COPY',
  'ORIGINAL',
  'APPROVED',
  'PRIVATE',
];

export const WATERMARK_COLORS = [
  { name: 'Red', hex: '#ef4444', r: 239, g: 68, b: 68 },
  { name: 'Slate', hex: '#64748b', r: 100, g: 116, b: 139 },
  { name: 'Blue', hex: '#2563eb', r: 37, g: 99, b: 235 },
  { name: 'Emerald', hex: '#059669', r: 5, g: 150, b: 105 },
  { name: 'Amber', hex: '#d97706', r: 217, g: 119, b: 6 },
  { name: 'Black', hex: '#0f172a', r: 15, g: 23, b: 42 },
];

export const WATERMARK_POSITIONS = [
  { id: 'center-diagonal', label: 'Center (Diagonal 45°)', angle: 45 },
  { id: 'center', label: 'Center (Horizontal)', angle: 0 },
  { id: 'tiled', label: 'Repeating Grid (Tiled)', angle: 35 },
  { id: 'top', label: 'Top Margin', angle: 0 },
  { id: 'bottom', label: 'Bottom Margin', angle: 0 },
  { id: 'top-left', label: 'Top Left', angle: 0 },
  { id: 'top-right', label: 'Top Right', angle: 0 },
  { id: 'bottom-left', label: 'Bottom Left', angle: 0 },
  { id: 'bottom-right', label: 'Bottom Right', angle: 0 },
];

/**
 * Validates selected file for PDF watermarking.
 */
export function validatePdfForWatermark(files) {
  if (!files || !files.length) return 'Please choose a PDF file to watermark.';
  if (files.length > 1) return 'Please choose a single PDF file at a time.';

  const file = files[0];
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();

  if (!name.endsWith('.pdf') && type !== 'application/pdf') {
    return 'Please select a valid PDF document (.pdf).';
  }

  if (file.size <= 0) {
    return 'The selected PDF file is empty (0 bytes).';
  }

  if (file.size > MAX_WATERMARK_FILE_SIZE) {
    return `The PDF file is too large. Maximum supported file size is 50 MB.`;
  }

  return '';
}

/**
 * Parses hex color string into 0..1 RGB components.
 */
export function hexToRgb01(hex) {
  const clean = (hex || '#ef4444').replace('#', '');
  let r = 239, g = 68, b = 68;
  if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16) || 0;
    g = parseInt(clean.substring(2, 4), 16) || 0;
    b = parseInt(clean.substring(4, 6), 16) || 0;
  } else if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) || 0;
    g = parseInt(clean[1] + clean[1], 16) || 0;
    b = parseInt(clean[2] + clean[2], 16) || 0;
  }
  return {
    r: r / 255,
    g: g / 255,
    b: b / 255,
    css: `rgb(${r}, ${g}, ${b})`,
  };
}

/**
 * Parses user-specified page selection into a set of 0-based page indices.
 * Supports: 'all', 'first', or custom string e.g. "1-3, 5, 8".
 */
export function parseWatermarkPageRange(rangeStr, totalPages) {
  const pages = new Set();
  if (totalPages <= 0) return pages;

  if (!rangeStr || rangeStr === 'all') {
    for (let i = 0; i < totalPages; i++) pages.add(i);
    return pages;
  }

  if (rangeStr === 'first') {
    pages.add(0);
    return pages;
  }

  const parts = String(rangeStr).split(/[,;]/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = Math.max(1, parseInt(startStr, 10) || 1);
      const end = Math.min(totalPages, parseInt(endStr, 10) || totalPages);
      for (let p = start; p <= end; p++) {
        pages.add(p - 1);
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (Number.isFinite(p) && p >= 1 && p <= totalPages) {
        pages.add(p - 1);
      }
    }
  }

  if (pages.size === 0) {
    for (let i = 0; i < totalPages; i++) pages.add(i);
  }

  return pages;
}

/**
 * Generates an output filename for the watermarked PDF.
 */
export function watermarkedPdfFilename(originalName) {
  const base = (originalName || 'document')
    .replace(/\.pdf$/i, '')
    .replace(/[^\w.-]/g, '_');
  return `${base}_watermarked.pdf`;
}

/**
 * Applies a text or image watermark to selected pages of a PDF document using pdf-lib.
 */
export async function applyWatermarkToPdf(pdfData, options = {}, { onProgress = () => {} } = {}) {
  const bytes = pdfData instanceof Uint8Array ? pdfData : new Uint8Array(await pdfData.arrayBuffer());
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  const totalPages = pdfDoc.getPageCount();
  if (totalPages === 0) throw new Error('PDF document contains no pages.');

  const type = options.type || 'text'; // 'text' | 'image'
  const text = (options.text || 'CONFIDENTIAL').trim();
  const fontSize = Number.isFinite(options.fontSize) ? Math.max(8, options.fontSize) : 48;
  const opacity = Number.isFinite(options.opacity) ? Math.min(1, Math.max(0.05, options.opacity)) : 0.25;
  const position = options.position || 'center-diagonal';
  const rotationDeg = Number.isFinite(options.rotation) ? options.rotation : (position === 'center-diagonal' ? 45 : 0);
  const color = hexToRgb01(options.color || '#ef4444');
  const targetPages = parseWatermarkPageRange(options.pageRange || 'all', totalPages);

  // Prepare font or image
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let embeddedImage = null;
  let imgDims = null;

  if (type === 'image' && options.imageBytes) {
    try {
      const imgData = options.imageBytes;
      const isPng = options.imageType === 'image/png' || (imgData[0] === 0x89 && imgData[1] === 0x50);
      embeddedImage = isPng ? await pdfDoc.embedPng(imgData) : await pdfDoc.embedJpg(imgData);
      imgDims = {
        width: embeddedImage.width,
        height: embeddedImage.height,
        isCustomImage: true,
      };
    } catch (err) {
      console.warn('Could not embed watermark image, falling back to text:', err);
    }
  }

  // Check if text can be directly encoded with standard PDF Helvetica font (WinAnsi)
  let textIsEncodable = true;
  if (text) {
    try {
      font.widthOfTextAtSize(text, 12);
    } catch {
      textIsEncodable = false;
    }
  }

  // If text contains non-WinAnsi characters (e.g. Hindi, Gujarati, Unicode), render via canvas PNG in browser
  if (text && !textIsEncodable && !embeddedImage && typeof document !== 'undefined') {
    try {
      const offscreen = document.createElement('canvas');
      const oCtx = offscreen.getContext('2d');
      const renderScale = 2;
      const renderFontSize = Math.max(16, fontSize * renderScale);
      const fontStr = `bold ${renderFontSize}px "Nirmala UI", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      oCtx.font = fontStr;
      const metrics = oCtx.measureText(text);
      const tw = Math.ceil(metrics.width);
      const th = Math.ceil(renderFontSize * 1.35);
      offscreen.width = Math.max(1, tw + 24);
      offscreen.height = Math.max(1, th + 24);

      oCtx.clearRect(0, 0, offscreen.width, offscreen.height);
      oCtx.font = fontStr;
      oCtx.fillStyle = color.css || `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
      oCtx.textAlign = 'center';
      oCtx.textBaseline = 'middle';
      oCtx.fillText(text, offscreen.width / 2, offscreen.height / 2);

      const blob = await new Promise(r => offscreen.toBlob(r, 'image/png'));
      if (blob) {
        const pngBytes = new Uint8Array(await blob.arrayBuffer());
        embeddedImage = await pdfDoc.embedPng(pngBytes);
        imgDims = {
          width: offscreen.width / renderScale,
          height: offscreen.height / renderScale,
        };
      }
    } catch (renderErr) {
      console.warn('Could not render Unicode watermark via canvas, fallback to sanitized text:', renderErr);
    }
  }

  // Safe fallback text if running in non-browser environment without canvas
  const safeText = textIsEncodable ? text : text.replace(/[^\x00-\xFF]/g, '?');

  const pagesArray = pdfDoc.getPages();

  for (let i = 0; i < totalPages; i++) {
    if (!targetPages.has(i)) continue;
    onProgress(`Applying watermark to page ${i + 1} of ${totalPages}…`, i + 1, totalPages);

    const page = pagesArray[i];
    const { width: pWidth, height: pHeight } = page.getSize();

    if (embeddedImage && imgDims) {
      // Image Watermark (or rendered Unicode text)
      let imgW, imgH;
      if (imgDims.isCustomImage) {
        const scale = Number.isFinite(options.imageScale) ? Math.min(0.95, Math.max(0.05, options.imageScale)) : 0.35;
        const maxW = pWidth * scale;
        const maxH = pHeight * scale;
        const aspect = imgDims.width / imgDims.height;
        if (aspect >= 1) {
          imgW = maxW;
          imgH = maxW / aspect;
          if (imgH > maxH) {
            imgH = maxH;
            imgW = maxH * aspect;
          }
        } else {
          imgH = maxH;
          imgW = maxH * aspect;
          if (imgW > maxW) {
            imgW = maxW;
            imgH = maxW / aspect;
          }
        }
      } else {
        imgW = Math.min(imgDims.width, pWidth * 0.9);
        imgH = imgW * (imgDims.height / imgDims.width);
      }

      if (position === 'tiled') {
        const cols = 3;
        const rows = 3;
        const colStep = pWidth / cols;
        const rowStep = pHeight / rows;
        const tileW = Math.min(imgW, colStep * 0.8);
        const tileH = tileW * (imgDims.height / imgDims.width);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const centerX = colStep * c + colStep / 2;
            const centerY = rowStep * r + rowStep / 2;
            const rad = (rotationDeg * Math.PI) / 180;
            const drawX = centerX - (tileW / 2) * Math.cos(rad) + (tileH / 2) * Math.sin(rad);
            const drawY = centerY - (tileW / 2) * Math.sin(rad) - (tileH / 2) * Math.cos(rad);

            page.drawImage(embeddedImage, {
              x: drawX,
              y: drawY,
              width: tileW,
              height: tileH,
              opacity: opacity * 0.8,
              rotate: degrees(rotationDeg),
            });
          }
        }
      } else {
        let posX = (pWidth - imgW) / 2;
        let posY = (pHeight - imgH) / 2;

        if (position === 'top') {
          posY = pHeight - imgH - 30;
        } else if (position === 'bottom') {
          posY = 30;
        } else if (position === 'top-left') {
          posX = 30;
          posY = pHeight - imgH - 30;
        } else if (position === 'top-right') {
          posX = pWidth - imgW - 30;
          posY = pHeight - imgH - 30;
        } else if (position === 'bottom-left') {
          posX = 30;
          posY = 30;
        } else if (position === 'bottom-right') {
          posX = pWidth - imgW - 30;
          posY = 30;
        }

        if (['top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(position)) {
          page.drawImage(embeddedImage, {
            x: posX,
            y: posY,
            width: imgW,
            height: imgH,
            opacity,
            rotate: degrees(rotationDeg),
          });
        } else {
          // Center & diagonal placement with pivot at center of image
          const centerX = pWidth / 2;
          const centerY = pHeight / 2;
          const rad = (rotationDeg * Math.PI) / 180;
          const drawX = centerX - (imgW / 2) * Math.cos(rad) + (imgH / 2) * Math.sin(rad);
          const drawY = centerY - (imgW / 2) * Math.sin(rad) - (imgH / 2) * Math.cos(rad);

          page.drawImage(embeddedImage, {
            x: drawX,
            y: drawY,
            width: imgW,
            height: imgH,
            opacity,
            rotate: degrees(rotationDeg),
          });
        }
      }
    } else if (safeText) {
      // Vector Text Watermark
      const textWidth = font.widthOfTextAtSize(safeText, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      if (position === 'tiled') {
        // Repeated Grid Across Page (3x3 grid)
        const cols = 3;
        const rows = 3;
        const colStep = pWidth / cols;
        const rowStep = pHeight / rows;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const centerX = colStep * c + colStep / 2;
            const centerY = rowStep * r + rowStep / 2;
            const rad = (rotationDeg * Math.PI) / 180;
            const drawX = centerX - (textWidth / 2) * Math.cos(rad) + (textHeight / 2) * Math.sin(rad);
            const drawY = centerY - (textWidth / 2) * Math.sin(rad) - (textHeight / 2) * Math.cos(rad);

            page.drawText(safeText, {
              x: drawX,
              y: drawY,
              size: Math.max(12, fontSize * 0.65),
              font,
              color: rgb(color.r, color.g, color.b),
              opacity: opacity * 0.8,
              rotate: degrees(rotationDeg),
            });
          }
        }
      } else {
        // Single text watermark positioned according to user choice
        let centerX = pWidth / 2;
        let centerY = pHeight / 2;

        if (position === 'top') {
          centerY = pHeight - 45;
        } else if (position === 'bottom') {
          centerY = 45;
        } else if (position === 'top-left') {
          centerX = 40 + textWidth / 2;
          centerY = pHeight - 45;
        } else if (position === 'top-right') {
          centerX = pWidth - 40 - textWidth / 2;
          centerY = pHeight - 45;
        } else if (position === 'bottom-left') {
          centerX = 40 + textWidth / 2;
          centerY = 45;
        } else if (position === 'bottom-right') {
          centerX = pWidth - 40 - textWidth / 2;
          centerY = 45;
        }

        const rad = (rotationDeg * Math.PI) / 180;
        const drawX = centerX - (textWidth / 2) * Math.cos(rad) + (textHeight / 2) * Math.sin(rad);
        const drawY = centerY - (textWidth / 2) * Math.sin(rad) - (textHeight / 2) * Math.cos(rad);

        page.drawText(safeText, {
          x: drawX,
          y: drawY,
          size: fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity,
          rotate: degrees(rotationDeg),
        });
      }
    }
  }

  const savedBytes = await pdfDoc.save();
  return new Blob([savedBytes], { type: 'application/pdf' });
}

/**
 * Draws the watermark overlay in real time on an HTML5 canvas for live interactive preview.
 * Accepts either (canvas, options) or (ctx, cWidth, cHeight, options).
 */
export function drawWatermarkOnCanvas(ctxOrCanvas, widthOrOptions, height, maybeOptions = {}) {
  let ctx, cWidth, cHeight, options;
  if (ctxOrCanvas && typeof ctxOrCanvas.getContext === 'function') {
    ctx = ctxOrCanvas.getContext('2d');
    cWidth = ctxOrCanvas.width;
    cHeight = ctxOrCanvas.height;
    options = widthOrOptions || {};
  } else {
    ctx = ctxOrCanvas;
    cWidth = widthOrOptions;
    cHeight = height;
    options = maybeOptions || {};
  }

  if (!ctx || !cWidth || !cHeight) return;

  const type = options.type || 'text';
  const opacity = Number.isFinite(options.opacity) ? options.opacity : 0.25;
  const position = options.position || 'center-diagonal';
  const rotationDeg = Number.isFinite(options.rotation) ? options.rotation : (position === 'center-diagonal' ? 45 : 0);
  const rad = (-rotationDeg * Math.PI) / 180; // Canvas y is flipped relative to PDF

  // Case 1: Image Watermark
  if (type === 'image' && options.imageElement) {
    const imgEl = options.imageElement;
    const iW = Math.max(1, imgEl.naturalWidth || imgEl.width || 100);
    const iH = Math.max(1, imgEl.naturalHeight || imgEl.height || 100);
    const aspect = iW / iH;

    const scale = Number.isFinite(options.imageScale) ? Math.min(0.95, Math.max(0.05, options.imageScale)) : 0.35;
    const maxW = cWidth * scale;
    const maxH = cHeight * scale;
    let imgW, imgH;
    if (aspect >= 1) {
      imgW = maxW;
      imgH = maxW / aspect;
      if (imgH > maxH) {
        imgH = maxH;
        imgW = maxH * aspect;
      }
    } else {
      imgH = maxH;
      imgW = maxH * aspect;
      if (imgW > maxW) {
        imgW = maxW;
        imgH = maxW / aspect;
      }
    }

    ctx.save();
    ctx.globalAlpha = opacity;

    if (position === 'tiled') {
      const cols = 3;
      const rows = 3;
      const colStep = cWidth / cols;
      const rowStep = cHeight / rows;
      const tileW = Math.min(imgW, colStep * 0.75);
      const tileH = tileW / aspect;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = colStep * c + colStep / 2;
          const cy = rowStep * r + rowStep / 2;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rad);
          ctx.drawImage(imgEl, -tileW / 2, -tileH / 2, tileW, tileH);
          ctx.restore();
        }
      }
    } else {
      let cx = cWidth / 2;
      let cy = cHeight / 2;

      if (position === 'top') {
        cy = imgH / 2 + 30;
      } else if (position === 'bottom') {
        cy = cHeight - imgH / 2 - 30;
      } else if (position === 'top-left') {
        cx = imgW / 2 + 30;
        cy = imgH / 2 + 30;
      } else if (position === 'top-right') {
        cx = cWidth - imgW / 2 - 30;
        cy = imgH / 2 + 30;
      } else if (position === 'bottom-left') {
        cx = imgW / 2 + 30;
        cy = cHeight - imgH / 2 - 30;
      } else if (position === 'bottom-right') {
        cx = cWidth - imgW / 2 - 30;
        cy = cHeight - imgH / 2 - 30;
      }

      ctx.translate(cx, cy);
      ctx.rotate(rad);
      ctx.drawImage(imgEl, -imgW / 2, -imgH / 2, imgW, imgH);
    }

    ctx.restore();
    return;
  }

  // Case 2: Text Watermark
  const text = (options.text || 'CONFIDENTIAL').trim();
  const fontSize = options.fontSize || 42;
  const color = hexToRgb01(options.color || '#ef4444');

  if (!text) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color.css;
  ctx.font = `bold ${fontSize}px "Nirmala UI", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (position === 'tiled') {
    const cols = 3;
    const rows = 3;
    const colStep = cWidth / cols;
    const rowStep = cHeight / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = colStep * c + colStep / 2;
        const cy = rowStep * r + rowStep / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rad);
        ctx.font = `bold ${Math.max(12, Math.round(fontSize * 0.65))}px "Nirmala UI", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }
    }
  } else {
    let cx = cWidth / 2;
    let cy = cHeight / 2;

    if (position === 'top') {
      cy = 45;
    } else if (position === 'bottom') {
      cy = cHeight - 45;
    } else if (position === 'top-left') {
      ctx.textAlign = 'left';
      cx = 35;
      cy = 45;
    } else if (position === 'top-right') {
      ctx.textAlign = 'right';
      cx = cWidth - 35;
      cy = 45;
    } else if (position === 'bottom-left') {
      ctx.textAlign = 'left';
      cx = 35;
      cy = cHeight - 45;
    } else if (position === 'bottom-right') {
      ctx.textAlign = 'right';
      cx = cWidth - 35;
      cy = cHeight - 45;
    }

    ctx.translate(cx, cy);
    ctx.rotate(rad);
    ctx.fillText(text, 0, 0);
  }

  ctx.restore();
}

