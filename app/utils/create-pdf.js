import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const PAGE_SIZES = {
  a4: { name: 'A4', width: 595.28, height: 841.89, desc: '210 × 297 mm (Standard)' },
  letter: { name: 'US Letter', width: 612, height: 792, desc: '8.5 × 11 in (North America)' },
  legal: { name: 'US Legal', width: 612, height: 1008, desc: '8.5 × 14 in (Legal Documents)' },
  a3: { name: 'A3', width: 841.89, height: 1190.55, desc: '297 × 420 mm (Large Sheets)' },
  a5: { name: 'A5', width: 419.53, height: 595.28, desc: '148 × 210 mm (Notebook / Booklet)' },
};

export const PAGE_MARGINS = {
  normal: { name: 'Normal', value: 54, desc: '0.75 in (Balanced)' },
  narrow: { name: 'Narrow', value: 36, desc: '0.5 in (More Space)' },
  wide: { name: 'Wide', value: 72, desc: '1.0 in (Spacious)' },
  none: { name: 'None', value: 18, desc: 'Full Bleed' },
};

export const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Page',
    category: 'basic',
    desc: 'Clean, unlined white canvas for drawing, drafting, or clean documents.',
    badge: 'Clean',
  },
  {
    id: 'lined-college',
    name: 'College Ruled Lined',
    category: 'lined',
    desc: 'Classic notebook paper with 7.1 mm line spacing and a left margin line.',
    badge: '7.1 mm',
  },
  {
    id: 'lined-wide',
    name: 'Wide Ruled Lined',
    category: 'lined',
    desc: 'Spacious 8.7 mm lined paper ideal for handwriting, notes, and study guides.',
    badge: '8.7 mm',
  },
  {
    id: 'grid-5mm',
    name: '5mm Graph Grid',
    category: 'grid',
    desc: 'Precision math and engineering grid with 5 mm coordinate squares.',
    badge: '5 mm Grid',
  },
  {
    id: 'grid-dot',
    name: '5mm Dot Grid',
    category: 'grid',
    desc: 'Subtle 5 mm dotted matrix for bullet journaling, UI sketches, and planning.',
    badge: 'Dot Matrix',
  },
  {
    id: 'checklist',
    name: 'To-Do & Checklist',
    category: 'planner',
    desc: 'Organized task list with checkboxes, item lines, and date/priority fields.',
    badge: 'Planner',
  },
  {
    id: 'cornell',
    name: 'Cornell Notes Sheet',
    category: 'planner',
    desc: 'Structured study sheet with cue column, ruled notes, and summary block.',
    badge: 'Study Tool',
  },
  {
    id: 'music',
    name: 'Music Staff Sheet',
    category: 'creative',
    desc: 'Standard 5-line musical staves for music composition and notation.',
    badge: 'Music Staff',
  },
];

export const COLOR_THEMES = {
  classic: {
    name: 'Classic Blue & Red',
    line: rgb(0.72, 0.81, 0.92),
    margin: rgb(0.92, 0.45, 0.45),
    text: rgb(0.12, 0.16, 0.22),
    accent: rgb(0.18, 0.44, 0.88),
  },
  slate: {
    name: 'Modern Slate',
    line: rgb(0.82, 0.86, 0.90),
    margin: rgb(0.65, 0.72, 0.80),
    text: rgb(0.15, 0.20, 0.26),
    accent: rgb(0.30, 0.40, 0.52),
  },
  emerald: {
    name: 'Emerald Green',
    line: rgb(0.78, 0.88, 0.82),
    margin: rgb(0.35, 0.72, 0.52),
    text: rgb(0.10, 0.22, 0.16),
    accent: rgb(0.16, 0.65, 0.42),
  },
  warm: {
    name: 'Warm Sepia',
    line: rgb(0.88, 0.83, 0.76),
    margin: rgb(0.82, 0.55, 0.40),
    text: rgb(0.24, 0.18, 0.14),
    accent: rgb(0.70, 0.42, 0.25),
  },
};

/**
 * Creates a clean output filename for the created PDF.
 */
export function createdPdfFilename(title = '', template = 'document') {
  const cleanTitle = (title || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  if (cleanTitle) {
    return `${cleanTitle}.pdf`;
  }
  const cleanTemplate = (template || 'document').toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  return `${cleanTemplate}-created.pdf`;
}

/**
 * Sanitizes text to fit within standard PDF WinAnsi encoding without crashing.
 */
export function sanitizeWinAnsi(text) {
  if (!text) return '';
  return String(text)
    .replace(/[—–]/g, '-')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[•★▪▫]/g, '*')
    .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, ' ');
}

/**
 * Helper to split text into lines that fit within a maximum width.
 */
export function wrapText(text, maxWidth, font, fontSize) {
  if (!text) return [];
  const lines = [];
  const clean = sanitizeWinAnsi(text);
  const paragraphs = clean.split(/\r?\n/);

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }
    const words = paragraph.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      let testWidth = 0;
      try {
        testWidth = font.widthOfTextAtSize(testLine, fontSize);
      } catch {
        // Fallback character measurement
        testWidth = testLine.length * (fontSize * 0.55);
      }

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
  }
  return lines;
}

/**
 * Draws running headers, page numbers, and optional document title.
 */
function drawHeaderFooter(page, {
  pageNumber,
  totalPages,
  width,
  height,
  margin,
  headerText,
  includePageNumbers,
  pageNumberFormat,
  pageNumberPosition,
  font,
  theme,
}) {
  const topY = height - Math.max(margin, 36) + 16;
  const bottomY = Math.max(margin - 24, 20);

  // Top Running Header
  if (headerText && headerText.trim()) {
    const text = sanitizeWinAnsi(headerText.trim());
    let textWidth = 0;
    try {
      textWidth = font.widthOfTextAtSize(text, 9);
    } catch {
      textWidth = text.length * 5;
    }
    page.drawText(text, {
      x: width - margin - textWidth,
      y: topY,
      size: 9,
      font,
      color: theme.accent || rgb(0.4, 0.4, 0.4),
    });
    // Thin divider line under header
    page.drawLine({
      start: { x: margin, y: topY - 8 },
      end: { x: width - margin, y: topY - 8 },
      thickness: 0.5,
      color: theme.line,
    });
  }

  // Bottom Page Numbering
  if (includePageNumbers) {
    let pageLabel = `${pageNumber}`;
    if (pageNumberFormat === 'page-of-total') {
      pageLabel = `Page ${pageNumber} of ${totalPages}`;
    } else if (pageNumberFormat === 'dash') {
      pageLabel = `— ${pageNumber} —`;
    } else if (pageNumberFormat === 'fraction') {
      pageLabel = `${pageNumber} / ${totalPages}`;
    }

    let numWidth = 0;
    try {
      numWidth = font.widthOfTextAtSize(pageLabel, 9);
    } catch {
      numWidth = pageLabel.length * 5;
    }

    const xPos = pageNumberPosition === 'bottom-right'
      ? width - margin - numWidth
      : (width - numWidth) / 2;

    page.drawText(pageLabel, {
      x: xPos,
      y: bottomY,
      size: 9,
      font,
      color: rgb(0.45, 0.50, 0.58),
    });
  }
}

/**
 * Draws template sheet content (ruled lines, math grid, dot matrix, checklist, Cornell, etc.)
 */
function drawTemplateContent(page, template, { width, height, margin, theme, font, fontBold }) {
  const contentWidth = width - margin * 2;
  const topY = height - margin - 20;
  const bottomY = margin + 14;

  if (template === 'blank') {
    // Pure blank canvas - no pattern lines needed
    return;
  }

  if (template === 'lined-college' || template === 'lined-wide') {
    // 7.1 mm (20.12 pt) for college, 8.7 mm (24.66 pt) for wide rule
    const lineSpacing = template === 'lined-college' ? 20.12 : 24.66;
    const marginLineX = margin + 36; // Red vertical margin line

    // Vertical margin line
    page.drawLine({
      start: { x: marginLineX, y: bottomY },
      end: { x: marginLineX, y: topY + 10 },
      thickness: 1,
      color: theme.margin,
    });

    // Horizontal ruled lines
    for (let y = topY; y >= bottomY; y -= lineSpacing) {
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 0.55,
        color: theme.line,
      });
    }
  } else if (template === 'grid-5mm') {
    // 5 mm = 14.17 pt
    const gridSize = 14.17;
    // Vertical grid lines
    for (let x = margin; x <= width - margin; x += gridSize) {
      page.drawLine({
        start: { x, y: bottomY },
        end: { x, y: topY },
        thickness: 0.4,
        color: theme.line,
      });
    }
    // Horizontal grid lines
    for (let y = topY; y >= bottomY; y -= gridSize) {
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 0.4,
        color: theme.line,
      });
    }
  } else if (template === 'grid-dot') {
    // 5 mm dot matrix
    const dotSpacing = 14.17;
    for (let x = margin; x <= width - margin; x += dotSpacing) {
      for (let y = topY; y >= bottomY; y -= dotSpacing) {
        page.drawCircle({
          x,
          y,
          size: 0.75,
          color: theme.margin || rgb(0.6, 0.65, 0.72),
        });
      }
    }
  } else if (template === 'checklist') {
    const rowHeight = 26;
    const boxSize = 13;

    // Header date / title line
    page.drawText('DATE: ____________________', {
      x: width - margin - 150,
      y: topY + 6,
      size: 9,
      font,
      color: rgb(0.4, 0.45, 0.52),
    });

    for (let y = topY - 14; y >= bottomY; y -= rowHeight) {
      // Checkbox square
      page.drawRectangle({
        x: margin,
        y: y - 1,
        width: boxSize,
        height: boxSize,
        borderWidth: 1,
        borderColor: theme.accent || rgb(0.5, 0.55, 0.65),
      });

      // Priority indicator dot
      page.drawCircle({
        x: margin + boxSize + 10,
        y: y + 5,
        size: 2,
        color: rgb(0.75, 0.80, 0.88),
      });

      // Task underline
      page.drawLine({
        start: { x: margin + boxSize + 22, y },
        end: { x: width - margin, y },
        thickness: 0.5,
        color: theme.line,
      });
    }
  } else if (template === 'cornell') {
    const headerHeight = 44;
    const summaryHeight = 100;
    const cueWidth = 140;
    const lineSpacing = 20;

    // Header topic box
    page.drawRectangle({
      x: margin,
      y: topY - headerHeight,
      width: contentWidth,
      height: headerHeight,
      borderWidth: 1,
      borderColor: theme.accent,
    });
    page.drawText('TOPIC / COURSE: ________________________________', {
      x: margin + 10,
      y: topY - 24,
      size: 9,
      font: fontBold || font,
      color: theme.text,
    });
    page.drawText('DATE: _________________', {
      x: width - margin - 120,
      y: topY - 24,
      size: 9,
      font,
      color: theme.text,
    });

    // Cue Column boundary (left vertical line)
    const notesTopY = topY - headerHeight - 12;
    const notesBottomY = bottomY + summaryHeight + 12;

    page.drawLine({
      start: { x: margin + cueWidth, y: notesBottomY },
      end: { x: margin + cueWidth, y: notesTopY },
      thickness: 1.2,
      color: theme.accent,
    });

    page.drawText('QUESTIONS / CUES', {
      x: margin + 8,
      y: notesTopY - 10,
      size: 8,
      font: fontBold || font,
      color: theme.accent,
    });

    page.drawText('NOTES & DETAILS', {
      x: margin + cueWidth + 14,
      y: notesTopY - 10,
      size: 8,
      font: fontBold || font,
      color: theme.accent,
    });

    // Ruled lines in the notes section
    for (let y = notesTopY - 24; y >= notesBottomY; y -= lineSpacing) {
      page.drawLine({
        start: { x: margin + cueWidth, y },
        end: { x: width - margin, y },
        thickness: 0.45,
        color: theme.line,
      });
    }

    // Summary box at bottom
    page.drawRectangle({
      x: margin,
      y: bottomY,
      width: contentWidth,
      height: summaryHeight,
      borderWidth: 1,
      borderColor: theme.accent,
    });
    page.drawText('SUMMARY & KEY TAKEAWAYS', {
      x: margin + 10,
      y: bottomY + summaryHeight - 16,
      size: 8.5,
      font: fontBold || font,
      color: theme.accent,
    });
    for (let y = bottomY + summaryHeight - 34; y >= bottomY + 14; y -= lineSpacing) {
      page.drawLine({
        start: { x: margin + 10, y },
        end: { x: width - margin - 10, y },
        thickness: 0.45,
        color: theme.line,
      });
    }
  } else if (template === 'music') {
    // 5-line musical staves
    const staveLineGap = 6;
    const staveHeight = staveLineGap * 4;
    const staveSpacing = 36;

    for (let y = topY - 10; y >= bottomY + staveHeight; y -= (staveHeight + staveSpacing)) {
      // Draw 5 staff lines
      for (let i = 0; i < 5; i++) {
        const lineY = y - (i * staveLineGap);
        page.drawLine({
          start: { x: margin, y: lineY },
          end: { x: width - margin, y: lineY },
          thickness: 0.6,
          color: theme.text,
        });
      }
      // Start and end bar lines
      page.drawLine({
        start: { x: margin, y },
        end: { x: margin, y: y - staveHeight },
        thickness: 1.2,
        color: theme.text,
      });
      page.drawLine({
        start: { x: width - margin, y },
        end: { x: width - margin, y: y - staveHeight },
        thickness: 1.2,
        color: theme.text,
      });
    }
  }
}

/**
 * Creates a brand-new PDF document from templates or text.
 *
 * @param {object} options
 * @param {'template'|'text'} [options.mode='template']
 * @param {string} [options.template='lined-college']
 * @param {'a4'|'letter'|'legal'|'a3'|'a5'} [options.pageSize='a4']
 * @param {'portrait'|'landscape'} [options.orientation='portrait']
 * @param {number} [options.pageCount=1]
 * @param {'normal'|'narrow'|'wide'|'none'} [options.margin='normal']
 * @param {'classic'|'slate'|'emerald'|'warm'} [options.theme='classic']
 * @param {string} [options.headerText='']
 * @param {boolean} [options.includePageNumbers=true]
 * @param {'page-of-total'|'simple'|'dash'|'fraction'} [options.pageNumberFormat='page-of-total']
 * @param {'bottom-center'|'bottom-right'} [options.pageNumberPosition='bottom-center']
 * @param {string} [options.title='']
 * @param {string} [options.subtitle='']
 * @param {string} [options.author='']
 * @param {string} [options.bodyText='']
 * @param {'helvetica'|'times'|'courier'} [options.fontFamily='helvetica']
 * @param {number} [options.fontSize=12]
 * @param {number} [options.lineSpacing=1.5]
 * @param {AbortSignal} [options.signal]
 * @param {(message: string) => void} [options.onProgress]
 * @returns {Promise<{ blob: Blob, pageCount: number, filename: string, size: number, url: string }>}
 */
export async function createPdf({
  mode = 'template',
  template = 'lined-college',
  pageSize = 'a4',
  orientation = 'portrait',
  pageCount = 1,
  margin = 'normal',
  theme = 'classic',
  headerText = '',
  includePageNumbers = true,
  pageNumberFormat = 'page-of-total',
  pageNumberPosition = 'bottom-center',
  title = '',
  subtitle = '',
  author = '',
  bodyText = '',
  fontFamily = 'helvetica',
  fontSize = 12,
  lineSpacing = 1.4,
  signal,
  onProgress = () => {},
} = {}) {
  const check = () => {
    if (signal?.aborted) throw new DOMException('PDF creation cancelled.', 'AbortError');
  };
  check();

  onProgress('Initializing PDF creation engine…');
  const doc = await PDFDocument.create();

  // Set document metadata
  doc.setTitle(title || (template ? `${template} PDF` : 'Created Document'));
  doc.setCreator('We Make PDF Create PDF Tool');
  doc.setProducer('We Make PDF (https://wemakepdf.com)');
  if (author) doc.setAuthor(author);

  // Embed standard typography fonts
  let fontStandard = StandardFonts.Helvetica;
  let fontStandardBold = StandardFonts.HelveticaBold;
  let fontStandardOblique = StandardFonts.HelveticaOblique;

  if (fontFamily === 'times') {
    fontStandard = StandardFonts.TimesRoman;
    fontStandardBold = StandardFonts.TimesRomanBold;
    fontStandardOblique = StandardFonts.TimesRomanItalic;
  } else if (fontFamily === 'courier') {
    fontStandard = StandardFonts.Courier;
    fontStandardBold = StandardFonts.CourierBold;
    fontStandardOblique = StandardFonts.CourierOblique;
  }

  const font = await doc.embedFont(fontStandard);
  const fontBold = await doc.embedFont(fontStandardBold);
  const fontItalic = await doc.embedFont(fontStandardOblique);

  // Compute page dimensions
  const baseDim = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
  const isLandscape = orientation === 'landscape';
  const width = isLandscape ? Math.max(baseDim.width, baseDim.height) : Math.min(baseDim.width, baseDim.height);
  const height = isLandscape ? Math.min(baseDim.width, baseDim.height) : Math.max(baseDim.width, baseDim.height);

  const marginVal = (PAGE_MARGINS[margin] || PAGE_MARGINS.normal).value;
  const colorTheme = COLOR_THEMES[theme] || COLOR_THEMES.classic;

  if (mode === 'template') {
    const totalPages = Math.max(1, Math.min(50, Math.floor(pageCount) || 1));
    for (let i = 1; i <= totalPages; i++) {
      check();
      onProgress(`Generating sheet page ${i} of ${totalPages}…`);
      const page = doc.addPage([width, height]);

      // Draw vector sheet template
      drawTemplateContent(page, template, {
        width,
        height,
        margin: marginVal,
        theme: colorTheme,
        font,
        fontBold,
      });

      // Draw header & page numbers
      drawHeaderFooter(page, {
        pageNumber: i,
        totalPages,
        width,
        height,
        margin: marginVal,
        headerText,
        includePageNumbers,
        pageNumberFormat,
        pageNumberPosition,
        font,
        theme: colorTheme,
      });
    }
  } else {
    // Mode: Text & Document Composer
    onProgress('Typesetting text content…');
    const contentWidth = width - marginVal * 2;
    const bodyLines = wrapText(bodyText, contentWidth, font, fontSize);

    const titleSize = Math.max(18, Math.min(28, fontSize * 1.8));
    const subtitleSize = Math.max(11, Math.min(16, fontSize * 1.15));
    const lineHeightVal = fontSize * lineSpacing;

    let currentPage = doc.addPage([width, height]);
    let currentY = height - marginVal - 10;
    const pages = [currentPage];

    // Document Title
    if (title && title.trim()) {
      const titleLines = wrapText(title.trim(), contentWidth, fontBold, titleSize);
      for (const tLine of titleLines) {
        currentPage.drawText(tLine, {
          x: marginVal,
          y: currentY,
          size: titleSize,
          font: fontBold,
          color: colorTheme.accent || colorTheme.text,
        });
        currentY -= (titleSize * 1.25);
      }
      currentY -= 6;
    }

    // Subtitle / Author Metadata
    if ((subtitle && subtitle.trim()) || (author && author.trim())) {
      const metaText = [subtitle.trim(), author.trim() ? `By ${author.trim()}` : ''].filter(Boolean).join(' · ');
      currentPage.drawText(metaText, {
        x: marginVal,
        y: currentY,
        size: subtitleSize,
        font: fontItalic,
        color: rgb(0.38, 0.44, 0.52),
      });
      currentY -= (subtitleSize * 1.5 + 8);

      // Accent separator line
      currentPage.drawLine({
        start: { x: marginVal, y: currentY },
        end: { x: width - marginVal, y: currentY },
        thickness: 0.8,
        color: colorTheme.accent || colorTheme.line,
      });
      currentY -= 16;
    }

    // Body Paragraphs
    for (const line of bodyLines) {
      if (currentY < marginVal + lineHeightVal + 24) {
        check();
        currentPage = doc.addPage([width, height]);
        pages.push(currentPage);
        currentY = height - marginVal - 14;
      }

      if (line) {
        currentPage.drawText(line, {
          x: marginVal,
          y: currentY,
          size: fontSize,
          font,
          color: colorTheme.text,
        });
      }
      currentY -= lineHeightVal;
    }

    // Stamp Header and Page Numbering on all created text pages
    const totalPages = pages.length;
    for (let pIdx = 0; pIdx < totalPages; pIdx++) {
      drawHeaderFooter(pages[pIdx], {
        pageNumber: pIdx + 1,
        totalPages,
        width,
        height,
        margin: marginVal,
        headerText,
        includePageNumbers,
        pageNumberFormat,
        pageNumberPosition,
        font,
        theme: colorTheme,
      });
    }
  }

  check();
  onProgress('Compiling your PDF file…');
  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const filename = createdPdfFilename(title, mode === 'template' ? template : 'document');
  const url = URL.createObjectURL(blob);

  return {
    blob,
    pageCount: doc.getPageCount(),
    filename,
    size: blob.size,
    url,
  };
}
