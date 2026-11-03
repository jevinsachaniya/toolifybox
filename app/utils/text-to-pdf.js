import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const PAGE_SIZES = {
  a4: { name: 'A4', width: 595.28, height: 841.89, desc: '210 × 297 mm (Standard)' },
  letter: { name: 'US Letter', width: 612, height: 792, desc: '8.5 × 11 in (North America)' },
  legal: { name: 'US Legal', width: 612, height: 1008, desc: '8.5 × 14 in (Long Sheets)' },
  a5: { name: 'A5', width: 419.53, height: 595.28, desc: '148 × 210 mm (Compact Notebook)' },
  a3: { name: 'A3', width: 841.89, height: 1190.55, desc: '297 × 420 mm (Large Ledger)' },
};

export const PAGE_MARGINS = {
  normal: { name: 'Normal', value: 54, desc: '0.75 in (Balanced)' },
  narrow: { name: 'Narrow', value: 36, desc: '0.5 in (Max Content)' },
  wide: { name: 'Wide', value: 72, desc: '1.0 in (Spacious Margins)' },
};

export const FONT_FAMILIES = [
  { id: 'helvetica', name: 'Sans-Serif', family: 'Helvetica', desc: 'Modern & Clean' },
  { id: 'times', name: 'Serif', family: 'Times-Roman', desc: 'Classic & Formal' },
  { id: 'courier', name: 'Monospace', family: 'Courier', desc: 'Code & Typewriter' },
];

export const COLOR_THEMES = {
  classic: {
    id: 'classic',
    name: 'Standard Clean',
    bg: rgb(1, 1, 1),
    text: rgb(0.08, 0.1, 0.14),
    accent: rgb(0.15, 0.2, 0.3),
    muted: rgb(0.42, 0.48, 0.55),
    line: rgb(0.85, 0.88, 0.92),
  },
  executive: {
    id: 'executive',
    name: 'Executive Navy',
    bg: rgb(1, 1, 1),
    text: rgb(0.06, 0.09, 0.16),
    accent: rgb(0.1, 0.25, 0.55),
    muted: rgb(0.35, 0.42, 0.52),
    line: rgb(0.8, 0.85, 0.92),
  },
  sepia: {
    id: 'sepia',
    name: 'Warm Ivory / Book',
    bg: rgb(0.99, 0.98, 0.96), // #FDFBF5
    text: rgb(0.18, 0.15, 0.12),
    accent: rgb(0.55, 0.32, 0.15),
    muted: rgb(0.48, 0.44, 0.38),
    line: rgb(0.9, 0.86, 0.8),
  },
  dark: {
    id: 'dark',
    name: 'Dark Mode / Code',
    bg: rgb(0.06, 0.08, 0.12), // #0F141F
    text: rgb(0.94, 0.96, 0.98),
    accent: rgb(0.38, 0.65, 0.98),
    muted: rgb(0.6, 0.65, 0.72),
    line: rgb(0.18, 0.22, 0.3),
  },
};

/**
 * Split text into wrapped lines fitting within maxWidth for a given font and size
 */
export function wrapText(text, maxWidth, font, fontSize) {
  if (!text) return [];
  const rawParagraphs = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines = [];

  for (const para of rawParagraphs) {
    if (para.trim() === '') {
      lines.push({ text: '', isBlank: true });
      continue;
    }

    const words = para.split(/\s+/);
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word) continue;

      const candidate = currentLine ? `${currentLine} ${word}` : word;
      let width = 0;
      try {
        width = font.widthOfTextAtSize(candidate, fontSize);
      } catch {
        // Fallback for uncommon characters
        width = candidate.length * (fontSize * 0.55);
      }

      if (width <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push({ text: currentLine, isBlank: false });
          currentLine = word;
        } else {
          // Word itself is wider than maxWidth; slice it
          let subWord = '';
          for (const char of word) {
            const subCandidate = subWord + char;
            if (font.widthOfTextAtSize(subCandidate, fontSize) <= maxWidth) {
              subWord = subCandidate;
            } else {
              lines.push({ text: subWord, isBlank: false });
              subWord = char;
            }
          }
          currentLine = subWord;
        }
      }
    }

    if (currentLine) {
      lines.push({ text: currentLine, isBlank: false });
    }
  }

  return lines;
}

/**
 * Convert user plain text into paginated PDF Document
 */
export async function convertTextToPdf({
  text = '',
  title = '',
  subtitle = '',
  author = '',
  fontFamily = 'helvetica',
  fontSize = 12,
  lineSpacing = 1.5,
  textAlign = 'left',
  pageSize = 'a4',
  orientation = 'portrait',
  margin = 'normal',
  theme = 'classic',
  headerText = '',
  includePageNumbers = true,
  pageNumberFormat = 'page-of-total', // 'page-of-total' | 'simple' | 'dash'
  pageNumberPosition = 'bottom-center', // 'bottom-center' | 'bottom-right'
  filename = 'document.pdf',
  signal,
  onProgress = () => {},
} = {}) {
  const checkAbort = () => {
    if (signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError');
  };
  checkAbort();

  onProgress('Initializing PDF generation engine…');
  const doc = await PDFDocument.create();

  // Document metadata
  doc.setTitle(title.trim() || 'Text Document');
  doc.setCreator('We Make PDF Text to PDF Converter');
  doc.setProducer('We Make PDF (https://wemakepdf.com)');
  if (author.trim()) doc.setAuthor(author.trim());

  // Fonts
  let fontNormalName = StandardFonts.Helvetica;
  let fontBoldName = StandardFonts.HelveticaBold;
  let fontItalicName = StandardFonts.HelveticaOblique;

  if (fontFamily === 'times') {
    fontNormalName = StandardFonts.TimesRoman;
    fontBoldName = StandardFonts.TimesRomanBold;
    fontItalicName = StandardFonts.TimesRomanItalic;
  } else if (fontFamily === 'courier') {
    fontNormalName = StandardFonts.Courier;
    fontBoldName = StandardFonts.CourierBold;
    fontItalicName = StandardFonts.CourierOblique;
  }

  const font = await doc.embedFont(fontNormalName);
  const fontBold = await doc.embedFont(fontBoldName);
  const fontItalic = await doc.embedFont(fontItalicName);

  // Geometry
  const baseDim = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
  const isLandscape = orientation === 'landscape';
  const width = isLandscape ? Math.max(baseDim.width, baseDim.height) : Math.min(baseDim.width, baseDim.height);
  const height = isLandscape ? Math.min(baseDim.width, baseDim.height) : Math.max(baseDim.width, baseDim.height);

  const marginVal = (PAGE_MARGINS[margin] || PAGE_MARGINS.normal).value;
  const contentWidth = width - marginVal * 2;
  const colorTheme = COLOR_THEMES[theme] || COLOR_THEMES.classic;

  const lineHeightVal = fontSize * lineSpacing;
  const titleSize = Math.max(18, Math.min(26, fontSize * 1.8));
  const subtitleSize = Math.max(11, Math.min(15, fontSize * 1.15));

  // Process and wrap text
  onProgress('Formatting and paginating text…');
  const bodyLines = wrapText(text, contentWidth, font, fontSize);

  // We accumulate pages dynamically
  const pagesList = [];
  let currentPage = doc.addPage([width, height]);
  pagesList.push(currentPage);

  // Draw background if not plain white
  const drawPageBackground = (pg) => {
    if (theme !== 'classic') {
      pg.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: colorTheme.bg,
      });
    }
  };
  drawPageBackground(currentPage);

  let currentY = height - marginVal - (headerText ? 24 : 10);
  const bottomLimit = marginVal + (includePageNumbers ? 32 : 16);

  // Draw Title if provided
  if (title && title.trim()) {
    const titleLines = wrapText(title.trim(), contentWidth, fontBold, titleSize);
    for (const tLine of titleLines) {
      if (tLine.text) {
        let tx = marginVal;
        if (textAlign === 'center') {
          const tw = fontBold.widthOfTextAtSize(tLine.text, titleSize);
          tx = marginVal + (contentWidth - tw) / 2;
        } else if (textAlign === 'right') {
          const tw = fontBold.widthOfTextAtSize(tLine.text, titleSize);
          tx = marginVal + (contentWidth - tw);
        }

        currentPage.drawText(tLine.text, {
          x: tx,
          y: currentY,
          size: titleSize,
          font: fontBold,
          color: colorTheme.accent,
        });
      }
      currentY -= titleSize * 1.3;
    }
    currentY -= 6;
  }

  // Draw Subtitle / Author if provided
  if ((subtitle && subtitle.trim()) || (author && author.trim())) {
    const metaParts = [];
    if (subtitle.trim()) metaParts.push(subtitle.trim());
    if (author.trim()) metaParts.push(`By ${author.trim()}`);
    const metaStr = metaParts.join('  •  ');

    let sx = marginVal;
    if (textAlign === 'center') {
      const sw = fontItalic.widthOfTextAtSize(metaStr, subtitleSize);
      sx = marginVal + (contentWidth - sw) / 2;
    } else if (textAlign === 'right') {
      const sw = fontItalic.widthOfTextAtSize(metaStr, subtitleSize);
      sx = marginVal + (contentWidth - sw);
    }

    currentPage.drawText(metaStr, {
      x: sx,
      y: currentY,
      size: subtitleSize,
      font: fontItalic,
      color: colorTheme.muted,
    });
    currentY -= subtitleSize * 1.5 + 8;

    // Divider Line
    currentPage.drawLine({
      start: { x: marginVal, y: currentY },
      end: { x: width - marginVal, y: currentY },
      thickness: 0.75,
      color: colorTheme.line,
    });
    currentY -= 18;
  }

  // Draw Body Lines with Auto-Pagination
  for (let i = 0; i < bodyLines.length; i++) {
    checkAbort();
    const lineObj = bodyLines[i];

    // If blank paragraph separator
    if (lineObj.isBlank) {
      currentY -= lineHeightVal * 0.75;
      continue;
    }

    // Check if line overflows current page
    if (currentY < bottomLimit + lineHeightVal) {
      currentPage = doc.addPage([width, height]);
      drawPageBackground(currentPage);
      pagesList.push(currentPage);
      currentY = height - marginVal - (headerText ? 24 : 10);
    }

    // Calculate line X position based on alignment
    let lx = marginVal;
    if (textAlign === 'center') {
      try {
        const lw = font.widthOfTextAtSize(lineObj.text, fontSize);
        lx = marginVal + Math.max(0, (contentWidth - lw) / 2);
      } catch {
        lx = marginVal;
      }
    } else if (textAlign === 'right') {
      try {
        const lw = font.widthOfTextAtSize(lineObj.text, fontSize);
        lx = marginVal + Math.max(0, contentWidth - lw);
      } catch {
        lx = marginVal;
      }
    }

    // Check if line looks like a markdown heading (# Heading or ## Subheading)
    const h1Match = lineObj.text.match(/^#\s+(.+)$/);
    const h2Match = lineObj.text.match(/^##\s+(.+)$/);

    if (h1Match) {
      const hText = h1Match[1];
      const hSize = fontSize * 1.4;
      currentY -= 6;
      currentPage.drawText(hText, {
        x: lx,
        y: currentY,
        size: hSize,
        font: fontBold,
        color: colorTheme.accent,
      });
      currentY -= hSize * 1.35;
    } else if (h2Match) {
      const hText = h2Match[1];
      const hSize = fontSize * 1.2;
      currentY -= 4;
      currentPage.drawText(hText, {
        x: lx,
        y: currentY,
        size: hSize,
        font: fontBold,
        color: colorTheme.accent,
      });
      currentY -= hSize * 1.3;
    } else {
      currentPage.drawText(lineObj.text, {
        x: lx,
        y: currentY,
        size: fontSize,
        font,
        color: colorTheme.text,
      });
      currentY -= lineHeightVal;
    }
  }

  // Draw Headers & Footers across all created pages
  const totalPages = pagesList.length;
  for (let pIdx = 0; pIdx < totalPages; pIdx++) {
    checkAbort();
    const pg = pagesList[pIdx];
    const pageNum = pIdx + 1;

    // Running Header
    if (headerText && headerText.trim()) {
      pg.drawText(headerText.trim(), {
        x: marginVal,
        y: height - marginVal + 14,
        size: 8.5,
        font: fontItalic,
        color: colorTheme.muted,
      });

      pg.drawLine({
        start: { x: marginVal, y: height - marginVal + 8 },
        end: { x: width - marginVal, y: height - marginVal + 8 },
        thickness: 0.5,
        color: colorTheme.line,
      });
    }

    // Page Numbering
    if (includePageNumbers) {
      let pageNumText = `${pageNum}`;
      if (pageNumberFormat === 'page-of-total') {
        pageNumText = `Page ${pageNum} of ${totalPages}`;
      } else if (pageNumberFormat === 'dash') {
        pageNumText = `— ${pageNum} —`;
      } else if (pageNumberFormat === 'fraction') {
        pageNumText = `${pageNum} / ${totalPages}`;
      }

      const pSize = 8.5;
      let px = marginVal;

      try {
        const pw = font.widthOfTextAtSize(pageNumText, pSize);
        if (pageNumberPosition === 'bottom-center') {
          px = (width - pw) / 2;
        } else {
          // bottom-right
          px = width - marginVal - pw;
        }
      } catch {
        px = width / 2;
      }

      pg.drawText(pageNumText, {
        x: px,
        y: marginVal - 18,
        size: pSize,
        font,
        color: colorTheme.muted,
      });
    }
  }

  onProgress('Finalizing vector PDF file…');
  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const cleanFilename = (filename || 'text-document.pdf').replace(/\.pdf$/i, '') + '.pdf';

  return {
    blob,
    url,
    pageCount: totalPages,
    size: blob.size,
    filename: cleanFilename,
  };
}

/**
 * Sample documents for quick 1-click testing
 */
export const SAMPLE_TEXTS = [
  {
    title: 'Executive Project Brief & Strategy Proposal',
    subtitle: 'Quarterly Strategic Roadmap and Milestones',
    author: 'Operations Team',
    text: `# Executive Summary
This document outlines our core engineering and product initiatives designed to deliver scalable, client-first digital utilities. By executing document processing directly within modern browser sandboxes, our architecture eliminates cloud data risks, minimizes infrastructure costs, and guarantees user confidentiality.

## Strategic Objectives
1. Modernization of Core Converter Pipelines
Transition all document format parsers to WebAssembly and Web Workers to achieve sub-second execution benchmarks.

2. Zero-Trust Local Data Processing
Ensure 100% of user files, business contracts, and spreadsheets stay strictly within the user's device memory.

3. Cross-Platform Responsive Parity
Deliver fluid document composition, editing, and previewing capabilities uniformly across smartphones, tablets, and desktop workstations.

## Implementation Roadmap
• Phase 1: High-Performance Vector Typography
Implement advanced typesetting with automatic hyphenation, configurable line heights, and margin control.

• Phase 2: Dynamic Page Segmentation
Automatically compute layout dimensions, running headers, and page counters across multi-page export jobs.

• Phase 3: Instant Local Export
Render razor-sharp vector PDF artifacts ready for commercial print or digital distribution with zero server round-trips.`,
  },
  {
    title: 'Meeting Notes & Action Items',
    subtitle: 'Weekly Engineering Sync',
    author: 'Lead Architect',
    text: `# Engineering Sync Notes
Date: November 3, 2026
Location: Virtual Conference Room

## Attendees
• Product Lead (Chair)
• Frontend Engineering Team
• Core Platform Architecture Group

## Discussion Topics
1. Performance Optimization for Large Documents
We observed that documents exceeding 50 pages require streaming pagination rather than blocking canvas renders. The team implemented background workers to keep the main thread responsive during PDF generation.

2. Accessibility & Typography Standards
Ensured that generated PDFs conform to PDF/UA accessibility standards, including tagged reading order and high-contrast color themes.

## Immediate Action Items
- Complete client-side vector text wrapping benchmarks.
- Deploy the updated Text to PDF converter across all production clusters.
- Review user feedback on margin and font size customization.`,
  },
];

