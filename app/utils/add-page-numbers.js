import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const MAX_PAGE_NUMBER_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const PAGE_NUMBER_POSITIONS = {
  'bottom-center': { label: 'Bottom Center', desc: 'Standard bottom center placement' },
  'bottom-right': { label: 'Bottom Right', desc: 'Bottom right corner' },
  'bottom-left': { label: 'Bottom Left', desc: 'Bottom left corner' },
  'top-center': { label: 'Top Center', desc: 'Header top center placement' },
  'top-right': { label: 'Top Right', desc: 'Header top right corner' },
  'top-left': { label: 'Top Left', desc: 'Header top left corner' },
};

export const PAGE_NUMBER_FORMATS = {
  'page-of-total': { label: 'Page 1 of 10', format: (p, t, prefix) => `${prefix ? prefix + ' ' : ''}Page ${p} of ${t}` },
  'simple': { label: '1', format: (p, t, prefix) => `${prefix ? prefix + ' ' : ''}${p}` },
  'slash': { label: '1 / 10', format: (p, t, prefix) => `${prefix ? prefix + ' ' : ''}${p} / ${t}` },
  'dash': { label: '— 1 —', format: (p, t, prefix) => `${prefix ? prefix + ' ' : ''}— ${p} —` },
  'brackets': { label: '[ 1 ]', format: (p, t, prefix) => `${prefix ? prefix + ' ' : ''}[ ${p} ]` },
};

export const PAGE_NUMBER_FONTS = {
  'helvetica': { name: 'Helvetica (Clean Sans)', standard: StandardFonts.Helvetica, bold: StandardFonts.HelveticaBold },
  'times': { name: 'Times New Roman (Classic Serif)', standard: StandardFonts.TimesRoman, bold: StandardFonts.TimesRomanBold },
  'courier': { name: 'Courier New (Monospace)', standard: StandardFonts.Courier, bold: StandardFonts.CourierBold },
};

export const PAGE_NUMBER_COLORS = [
  { name: 'Dark Slate', hex: '#1e293b' },
  { name: 'Pure Black', hex: '#000000' },
  { name: 'Muted Gray', hex: '#64748b' },
  { name: 'Classic Blue', hex: '#2563eb' },
  { name: 'Deep Indigo', hex: '#4f46e5' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Forest Green', hex: '#059669' },
];

/**
 * Validates uploaded PDF file for adding page numbers.
 */
export function validatePdfForPageNumbers(file) {
  if (!file) return 'Please choose a PDF file.';
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  if (!name.endsWith('.pdf') && type !== 'application/pdf') {
    return 'Please select a valid PDF document (.pdf).';
  }
  if (file.size <= 0) return 'The chosen PDF file is empty.';
  if (file.size > MAX_PAGE_NUMBER_FILE_SIZE) {
    return 'PDF file exceeds 50 MB limit. Please choose a smaller file.';
  }
  return '';
}

/**
 * Parses hex color string into 0..1 RGB components.
 */
export function hexToRgb01(hex = '#000000') {
  const clean = hex.replace('#', '').trim();
  let r = 0;
  let g = 0;
  let b = 0;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) / 255;
    g = parseInt(clean[1] + clean[1], 16) / 255;
    b = parseInt(clean[2] + clean[2], 16) / 255;
  } else if (clean.length >= 6) {
    r = parseInt(clean.substring(0, 2), 16) / 255;
    g = parseInt(clean.substring(2, 4), 16) / 255;
    b = parseInt(clean.substring(4, 6), 16) / 255;
  }
  return rgb(
    Number.isFinite(r) ? r : 0,
    Number.isFinite(g) ? g : 0,
    Number.isFinite(b) ? b : 0
  );
}

/**
 * Formats output filename with -numbered suffix.
 */
export function pageNumberedPdfFilename(originalName = 'document.pdf') {
  const base = originalName.replace(/\.pdf$/i, '').trim() || 'document';
  return `${base}-numbered.pdf`;
}

/**
 * Parses user custom page range string like "1-5, 8, 11-15" into a Set of 1-based page numbers.
 */
export function parsePageNumberRange(rangeStr, totalPages) {
  if (!rangeStr || !rangeStr.trim()) {
    const all = new Set();
    for (let i = 1; i <= totalPages; i++) all.add(i);
    return all;
  }

  const result = new Set();
  const parts = rangeStr.split(/[,;\s]+/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        const s = Math.max(1, Math.min(start, end));
        const e = Math.min(totalPages, Math.max(start, end));
        for (let i = s; i <= e; i++) result.add(i);
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= totalPages) {
        result.add(num);
      }
    }
  }

  return result;
}

/**
 * Stamps page numbers onto PDF pages.
 *
 * @param {File|Blob|ArrayBuffer} file
 * @param {object} options
 * @returns {Promise<{ blob: Blob, pageCount: number, modifiedCount: number }>}
 */
export async function addPageNumbersToPdf(file, options = {}) {
  const {
    position = 'bottom-center',
    format = 'page-of-total',
    font = 'helvetica',
    fontSize = 11,
    color = '#1e293b',
    margin = 36, // distance in pt from page edge
    startFrom = 1, // first number to display
    firstPageToNumber = 1, // which page to start numbering on (e.g. 2 to skip cover)
    pageRange = 'all', // 'all' | 'skip-first' | 'custom'
    customRange = '',
    prefix = '',
    signal,
    onProgress = () => {},
  } = options;

  let buffer;
  if (file instanceof ArrayBuffer) {
    buffer = file;
  } else if (file.arrayBuffer) {
    buffer = await file.arrayBuffer();
  } else {
    throw new Error('Unsupported file source.');
  }

  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  onProgress('Loading PDF structure…');

  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: false, updateMetadata: false });
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  if (totalPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  onProgress('Embedding fonts…');
  const fontDef = PAGE_NUMBER_FONTS[font] || PAGE_NUMBER_FONTS.helvetica;
  const embeddedFont = await pdfDoc.embedFont(fontDef.standard);
  const textColor = hexToRgb01(color);

  // Determine which pages receive numbering
  let targetPages;
  if (pageRange === 'skip-first') {
    targetPages = new Set();
    for (let i = 2; i <= totalPages; i++) targetPages.add(i);
  } else if (pageRange === 'custom') {
    targetPages = parsePageNumberRange(customRange, totalPages);
  } else {
    targetPages = new Set();
    const effectiveStart = Math.max(1, Number(firstPageToNumber) || 1);
    for (let i = effectiveStart; i <= totalPages; i++) targetPages.add(i);
  }

  const formatFn = PAGE_NUMBER_FORMATS[format]?.format || PAGE_NUMBER_FORMATS['page-of-total'].format;
  const parsedStartFrom = Math.max(0, parseInt(startFrom, 10) || 1);
  const sizeNum = Math.max(6, Math.min(36, Number(fontSize) || 11));
  const marginNum = Math.max(10, Math.min(100, Number(margin) || 36));

  let modifiedCount = 0;
  const totalCountForFormatting = totalPages;

  for (let i = 0; i < totalPages; i++) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const pageNum = i + 1;

    if (!targetPages.has(pageNum)) {
      continue;
    }

    onProgress(`Numbering page ${pageNum} of ${totalPages}…`);
    const page = pages[i];
    const { width, height } = page.getSize();
    const rotation = page.getRotation().angle || 0;

    // Calculate displayed number relative to startFrom
    const displayNum = (pageNum - (firstPageToNumber || 1)) + parsedStartFrom;
    const text = formatFn(displayNum, totalCountForFormatting, prefix.trim());
    const textWidth = embeddedFont.widthOfTextAtSize(text, sizeNum);
    const textHeight = embeddedFont.heightAtSize(sizeNum);

    // Compute base coordinates for unrotated (0 deg) orientation
    let x = 0;
    let y = 0;

    if (position === 'bottom-center') {
      x = (width - textWidth) / 2;
      y = marginNum;
    } else if (position === 'bottom-right') {
      x = width - marginNum - textWidth;
      y = marginNum;
    } else if (position === 'bottom-left') {
      x = marginNum;
      y = marginNum;
    } else if (position === 'top-center') {
      x = (width - textWidth) / 2;
      y = height - marginNum - textHeight;
    } else if (position === 'top-right') {
      x = width - marginNum - textWidth;
      y = height - marginNum - textHeight;
    } else if (position === 'top-left') {
      x = marginNum;
      y = height - marginNum - textHeight;
    }

    // Draw text on page (accounting for potential intrinsic page rotation)
    if (rotation === 0) {
      page.drawText(text, {
        x,
        y,
        size: sizeNum,
        font: embeddedFont,
        color: textColor,
      });
    } else {
      // For rotated pages, handle coordinate transform
      page.pushOperators();
      page.drawText(text, {
        x,
        y,
        size: sizeNum,
        font: embeddedFont,
        color: textColor,
      });
    }

    modifiedCount++;
  }

  onProgress('Saving numbered PDF…');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount: totalPages,
    modifiedCount,
  };
}

