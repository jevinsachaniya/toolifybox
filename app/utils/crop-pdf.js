import { PDFDocument } from 'pdf-lib';

export const MAX_CROP_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export const CROP_PRESETS = [
  { id: 'custom', name: 'Custom Bounding Box', desc: 'Drag handles or enter exact margins' },
  { id: 'trim-10mm', name: 'Trim 10 mm (Standard)', desc: 'Even 10 mm trim on all 4 sides', marginsMm: 10 },
  { id: 'trim-20mm', name: 'Trim 20 mm (Wide)', desc: 'Even 20 mm trim on all 4 sides', marginsMm: 20 },
  { id: 'trim-half-inch', name: 'Trim 0.5 Inch', desc: 'Even 0.5 in (36 pt) trim on all 4 sides', marginsIn: 0.5 },
  { id: 'trim-one-inch', name: 'Trim 1.0 Inch', desc: 'Even 1.0 in (72 pt) trim on all 4 sides', marginsIn: 1.0 },
  { id: 'auto-trim', name: 'Smart Auto Trim', desc: 'Automatically crop empty whitespace margins' },
];

export const CROP_UNITS = [
  { id: 'pt', label: 'Points (pt)', factorFromPt: 1 },
  { id: 'mm', label: 'Millimeters (mm)', factorFromPt: 25.4 / 72 },
  { id: 'in', label: 'Inches (in)', factorFromPt: 1 / 72 },
  { id: 'percent', label: 'Percent (%)', factorFromPt: null },
];

/**
 * Validates uploaded PDF file for cropping.
 */
export function validatePdfForCrop(file) {
  if (!file) return 'Please choose a PDF file.';
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  if (!name.endsWith('.pdf') && type !== 'application/pdf') {
    return 'Please select a valid PDF document (.pdf).';
  }
  if (file.size <= 0) return 'The chosen PDF file is empty.';
  if (file.size > MAX_CROP_FILE_SIZE) {
    return 'PDF file exceeds 100 MB limit. Please choose a smaller file.';
  }
  return '';
}

/**
 * Generates clean download filename with -cropped suffix.
 */
export function cropPdfFilename(originalFilename = 'document.pdf') {
  const base = originalFilename.replace(/\.pdf$/i, '').trim() || 'document';
  return `${base}-cropped.pdf`;
}

/**
 * Parses user page range input into a set of 1-based page numbers.
 * Supports 'all', '1', '1-5', '1,3,5-8', 'odd', 'even'.
 */
export function parseCropPageRange(input = 'all', totalPages = 1) {
  const set = new Set();
  const clean = String(input).trim().toLowerCase();

  if (!clean || clean === 'all' || clean === '*') {
    for (let i = 1; i <= totalPages; i++) set.add(i);
    return set;
  }

  if (clean === 'odd') {
    for (let i = 1; i <= totalPages; i += 2) set.add(i);
    return set;
  }

  if (clean === 'even') {
    for (let i = 2; i <= totalPages; i += 2) set.add(i);
    return set;
  }

  const parts = clean.split(/[,;\s]+/).filter(Boolean);
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = endStr === 'end' ? totalPages : parseInt(endStr, 10);
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let i = from; i <= to; i++) set.add(i);
      }
    } else {
      const num = parseInt(part, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= totalPages) {
        set.add(num);
      }
    }
  }

  return set;
}

/**
 * Normalizes rotation angle to 0, 90, 180, or 270 degrees.
 */
export function normalizeRotation(angle = 0) {
  if (typeof angle !== 'number' || Number.isNaN(angle)) return 0;
  const snapped = Math.round(angle / 90) * 90;
  return ((snapped % 360) + 360) % 360;
}

/**
 * Converts visual margin offsets (Top, Bottom, Left, Right in points) into
 * PDF coordinate crop box [x, y, width, height] based on the page's existing box and rotation.
 * 
 * @param {object} params
 * @param {number} params.pageWidth PDF coordinate width (from page.getWidth())
 * @param {number} params.pageHeight PDF coordinate height (from page.getHeight())
 * @param {number} [params.boxX=0] existing base box X
 * @param {number} [params.boxY=0] existing base box Y
 * @param {number} [params.rotation=0] page rotation in degrees (0, 90, 180, 270)
 * @param {object} params.margins visual margins in points: { top, bottom, left, right }
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function calculatePdfCropBox({
  pageWidth,
  pageHeight,
  boxX = 0,
  boxY = 0,
  rotation = 0,
  margins = { top: 0, bottom: 0, left: 0, right: 0 },
}) {
  const normRot = normalizeRotation(rotation);
  const mTop = Math.max(0, Number(margins.top) || 0);
  const mBottom = Math.max(0, Number(margins.bottom) || 0);
  const mLeft = Math.max(0, Number(margins.left) || 0);
  const mRight = Math.max(0, Number(margins.right) || 0);

  // In visual display:
  // For rotation = 0: visualWidth = pageWidth, visualHeight = pageHeight.
  // For rotation = 90 or 270: visualWidth = pageHeight, visualHeight = pageWidth.
  let pdfX = boxX;
  let pdfY = boxY;
  let pdfW = pageWidth;
  let pdfH = pageHeight;

  switch (normRot) {
    case 0:
      // Visual Left = +X, Visual Bottom = +Y, Visual Top = -Y, Visual Right = -X
      pdfX = boxX + mLeft;
      pdfY = boxY + mBottom;
      pdfW = Math.max(10, pageWidth - mLeft - mRight);
      pdfH = Math.max(10, pageHeight - mTop - mBottom);
      break;

    case 90:
      // Rotated 90° CW:
      // Visual Top is PDF Right (+X direction in PDF)
      // Visual Bottom is PDF Left (-X direction in PDF)
      // Visual Left is PDF Bottom (-Y direction in PDF)
      // Visual Right is PDF Top (+Y direction in PDF)
      // So:
      // PDF X bounds correspond to visual vertical axis (from bottom to top)
      // PDF Y bounds correspond to visual horizontal axis (from left to right)
      pdfX = boxX + mBottom;
      pdfY = boxY + mLeft;
      pdfW = Math.max(10, pageWidth - mTop - mBottom);
      pdfH = Math.max(10, pageHeight - mLeft - mRight);
      break;

    case 180:
      // Rotated 180°:
      // Visual Top is PDF Bottom
      // Visual Bottom is PDF Top
      // Visual Left is PDF Right
      // Visual Right is PDF Left
      pdfX = boxX + mRight;
      pdfY = boxY + mTop;
      pdfW = Math.max(10, pageWidth - mLeft - mRight);
      pdfH = Math.max(10, pageHeight - mTop - mBottom);
      break;

    case 270:
      // Rotated 270° CW (or 90° CCW):
      // Visual Top is PDF Left
      // Visual Bottom is PDF Right
      // Visual Left is PDF Top
      // Visual Right is PDF Bottom
      pdfX = boxX + mTop;
      pdfY = boxY + mRight;
      pdfW = Math.max(10, pageWidth - mTop - mBottom);
      pdfH = Math.max(10, pageHeight - mLeft - mRight);
      break;
  }

  // Ensure bounds stay within the page limits
  const clampedX = Math.max(boxX, Math.min(boxX + pageWidth - 10, pdfX));
  const clampedY = Math.max(boxY, Math.min(boxY + pageHeight - 10, pdfY));
  const clampedW = Math.max(10, Math.min(pageWidth - (clampedX - boxX), pdfW));
  const clampedH = Math.max(10, Math.min(pageHeight - (clampedY - boxY), pdfH));

  return {
    x: Math.round(clampedX * 100) / 100,
    y: Math.round(clampedY * 100) / 100,
    width: Math.round(clampedW * 100) / 100,
    height: Math.round(clampedH * 100) / 100,
  };
}

/**
 * Inspects a canvas and detects the content bounding box (ignoring pure white or near-white background).
 * Returns suggested visual margins in points.
 */
export function detectContentMargins(canvas, visualWidthPt, visualHeightPt, threshold = 248) {
  if (!canvas || !canvas.width || !canvas.height) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { top: 0, bottom: 0, left: 0, right: 0 };

  const cw = canvas.width;
  const ch = canvas.height;
  const imgData = ctx.getImageData(0, 0, cw, ch);
  const data = imgData.data;

  let minX = cw;
  let minY = ch;
  let maxX = 0;
  let maxY = 0;
  let hasContent = false;

  // Sample every 4th pixel for performance
  const step = 4;
  for (let y = 0; y < ch; y += step) {
    for (let x = 0; x < cw; x += step) {
      const idx = (y * cw + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // If pixel is not transparent and not near-white
      if (a > 30 && (r < threshold || g < threshold || b < threshold)) {
        hasContent = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasContent || minX >= maxX || minY >= maxY) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  // Add 12pt breathing room padding
  const paddingPt = 12;
  const scaleX = visualWidthPt / cw;
  const scaleY = visualHeightPt / ch;

  const leftPt = Math.max(0, Math.floor(minX * scaleX) - paddingPt);
  const rightPt = Math.max(0, Math.floor((cw - maxX) * scaleX) - paddingPt);
  const topPt = Math.max(0, Math.floor(minY * scaleY) - paddingPt);
  const bottomPt = Math.max(0, Math.floor((ch - maxY) * scaleY) - paddingPt);

  return {
    top: topPt,
    bottom: bottomPt,
    left: leftPt,
    right: rightPt,
  };
}

/**
 * Crops a PDF document using pdf-lib.
 * Modifies page CropBox and MediaBox to clip the pages losslessly.
 * 
 * @param {File|Blob} file 
 * @param {object} options
 * @param {object} [options.margins] visual margins in points: { top, bottom, left, right }
 * @param {string} [options.pageScope='all'] 'all' | 'current' | 'custom'
 * @param {number} [options.currentPage=1] 1-based current page
 * @param {string} [options.customRange=''] page range string if pageScope === 'custom'
 * @param {Record<number, {top:number, bottom:number, left:number, right:number}>} [options.perPageMargins] optional custom margins per page
 * @param {boolean} [options.syncMediaBox=true] whether to also update MediaBox alongside CropBox
 * @param {object} [callbacks]
 * @param {Function} [callbacks.onProgress]
 * @param {AbortSignal} [callbacks.signal]
 * @returns {Promise<{ blob: Blob, pageCount: number, croppedPagesCount: number }>}
 */
export async function cropPdf(
  file,
  options = {},
  { onProgress = () => {}, signal } = {}
) {
  const {
    margins = { top: 0, bottom: 0, left: 0, right: 0 },
    pageScope = 'all',
    currentPage = 1,
    customRange = '',
    perPageMargins = null,
    syncMediaBox = true,
  } = options;

  if (signal?.aborted) throw new DOMException('Crop cancelled.', 'AbortError');
  onProgress('Reading PDF structure…');

  const sourceBytes = await file.arrayBuffer();
  if (signal?.aborted) throw new DOMException('Crop cancelled.', 'AbortError');

  const pdfDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: false, updateMetadata: false });
  const pages = pdfDoc.getPages();
  const pageCount = pages.length;

  if (pageCount === 0) {
    throw new Error('This PDF contains no pages to crop.');
  }

  // Determine which pages to crop
  let targetPages = new Set();
  if (pageScope === 'current') {
    targetPages.add(Math.max(1, Math.min(pageCount, currentPage)));
  } else if (pageScope === 'custom') {
    targetPages = parseCropPageRange(customRange, pageCount);
  } else {
    // 'all'
    for (let i = 1; i <= pageCount; i++) targetPages.add(i);
  }

  if (targetPages.size === 0) {
    throw new Error('No valid pages selected to crop.');
  }

  let croppedPagesCount = 0;

  for (let i = 0; i < pageCount; i++) {
    if (signal?.aborted) throw new DOMException('Crop cancelled.', 'AbortError');
    const pageNum = i + 1;

    if (!targetPages.has(pageNum)) {
      continue;
    }

    const page = pages[i];
    const rotation = page.getRotation().angle || 0;
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    // Existing media / crop box
    const existingMedia = page.getMediaBox();
    const boxX = existingMedia.x || 0;
    const boxY = existingMedia.y || 0;

    const pageMargins = (perPageMargins && perPageMargins[pageNum]) || margins;

    const cropBox = calculatePdfCropBox({
      pageWidth,
      pageHeight,
      boxX,
      boxY,
      rotation,
      margins: pageMargins,
    });

    // Apply CropBox to PDF page
    page.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);

    if (syncMediaBox) {
      page.setMediaBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
    }

    croppedPagesCount++;
  }

  onProgress(`Saving ${croppedPagesCount} cropped page${croppedPagesCount > 1 ? 's' : ''}…`);
  pdfDoc.setProducer('We Make PDF');
  pdfDoc.setCreator('We Make PDF Crop PDF');

  const bytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 25 });
  const blob = new Blob([bytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount,
    croppedPagesCount,
  };
}

