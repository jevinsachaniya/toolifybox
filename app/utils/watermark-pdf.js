import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const MAX_WATERMARK_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

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
      const scale = options.imageScale || 0.4;
      imgDims = {
        width: embeddedImage.width * scale,
        height: embeddedImage.height * scale,
      };
    } catch (err) {
      console.warn('Could not embed watermark image, falling back to text:', err);
    }
  }

  const pagesArray = pdfDoc.getPages();

  for (let i = 0; i < totalPages; i++) {
    if (!targetPages.has(i)) continue;
    onProgress(`Applying watermark to page ${i + 1} of ${totalPages}…`, i + 1, totalPages);

    const page = pagesArray[i];
    const { width: pWidth, height: pHeight } = page.getSize();

    if (embeddedImage && imgDims) {
      // Image Watermark
      const imgW = Math.min(imgDims.width, pWidth * 0.85);
      const imgH = imgW * (imgDims.height / imgDims.width);
      let posX = (pWidth - imgW) / 2;
      let posY = (pHeight - imgH) / 2;

      if (position === 'top') posY = pHeight - imgH - 30;
      else if (position === 'bottom') posY = 30;
      else if (position === 'top-left') { posX = 30; posY = pHeight - imgH - 30; }
      else if (position === 'top-right') { posX = pWidth - imgW - 30; posY = pHeight - imgH - 30; }
      else if (position === 'bottom-left') { posX = 30; posY = 30; }
      else if (position === 'bottom-right') { posX = pWidth - imgW - 30; posY = 30; }

      page.drawImage(embeddedImage, {
        x: posX,
        y: posY,
        width: imgW,
        height: imgH,
        opacity,
        rotate: degrees(rotationDeg),
      });
    } else if (text) {
      // Text Watermark
      const textWidth = font.widthOfTextAtSize(text, fontSize);
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

            page.drawText(text, {
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

        page.drawText(text, {
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
 */
export function drawWatermarkOnCanvas(ctx, cWidth, cHeight, options = {}) {
  const text = (options.text || 'CONFIDENTIAL').trim();
  const fontSize = options.fontSize || 42;
  const opacity = Number.isFinite(options.opacity) ? options.opacity : 0.25;
  const position = options.position || 'center-diagonal';
  const rotationDeg = Number.isFinite(options.rotation) ? options.rotation : (position === 'center-diagonal' ? 45 : 0);
  const color = hexToRgb01(options.color || '#ef4444');

  if (!text) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color.css;
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const rad = (-rotationDeg * Math.PI) / 180; // Canvas y is flipped relative to PDF

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
        ctx.font = `bold ${Math.max(12, Math.round(fontSize * 0.65))}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
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

