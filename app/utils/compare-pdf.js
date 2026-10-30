import { PDFDocument } from 'pdf-lib';

export const MAX_COMPARE_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

/**
 * Validates a pair of PDF documents for comparison.
 */
export function validateComparePdfFiles(fileA, fileB) {
  if (!fileA && !fileB) return 'Please select both Original (Document A) and Revised (Document B) PDF files.';
  if (!fileA) return 'Please choose the Original PDF document (File A).';
  if (!fileB) return 'Please choose the Revised PDF document (File B).';

  for (const [file, label] of [[fileA, 'Document A'], [fileB, 'Document B']]) {
    const name = (file.name || '').toLowerCase();
    const type = (file.type || '').toLowerCase();
    if (!name.endsWith('.pdf') && type !== 'application/pdf') {
      return `${label} is not a valid PDF file (.pdf).`;
    }
    if (file.size <= 0) return `${label} is an empty file.`;
    if (file.size > MAX_COMPARE_FILE_SIZE) {
      return `${label} exceeds the 100 MB size limit.`;
    }
  }

  return '';
}

/**
 * Generates clean comparison output filename.
 */
export function comparePdfFilename(nameA = 'document1.pdf', nameB = 'document2.pdf') {
  const baseA = nameA.replace(/\.pdf$/i, '').trim() || 'docA';
  const baseB = nameB.replace(/\.pdf$/i, '').trim() || 'docB';
  return `${baseA}-vs-${baseB}-comparison.pdf`;
}

/**
 * Compares two image data sets pixel-by-pixel.
 * Highlights:
 * - Content only in Image A: Crimson Red (Deleted)
 * - Content only in Image B: Emerald Green (Added)
 * - Content in both: Muted grayscale
 * - Background in both: Pure white
 * 
 * @param {ImageData} imgDataA 
 * @param {ImageData} imgDataB 
 * @param {number} width 
 * @param {number} height 
 * @param {number} [tolerance=25] color distance tolerance
 * @returns {{ diffData: Uint8ClampedArray, diffPercent: number, addedCount: number, removedCount: number, sameCount: number }}
 */
export function computePixelDiff(imgDataA, imgDataB, width, height, tolerance = 25) {
  const totalPixels = width * height;
  const out = new Uint8ClampedArray(totalPixels * 4);

  const dataA = imgDataA?.data;
  const dataB = imgDataB?.data;

  let addedCount = 0;
  let removedCount = 0;
  let sameCount = 0;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;

    const aR = dataA ? dataA[idx] : 255;
    const aG = dataA ? dataA[idx + 1] : 255;
    const aB = dataA ? dataA[idx + 2] : 255;
    const aA = dataA ? dataA[idx + 3] : 0;

    const bR = dataB ? dataB[idx] : 255;
    const bG = dataB ? dataB[idx + 1] : 255;
    const bB = dataB ? dataB[idx + 2] : 255;
    const bA = dataB ? dataB[idx + 3] : 0;

    // Treat transparent pixels as white
    const rA = aA < 10 ? 255 : aR;
    const gA = aA < 10 ? 255 : aG;
    const bA_col = aA < 10 ? 255 : aB;

    const rB = bA < 10 ? 255 : bR;
    const gB = bA < 10 ? 255 : bG;
    const bB_col = bA < 10 ? 255 : bB;

    const isWhiteA = rA > 248 && gA > 248 && bA_col > 248;
    const isWhiteB = rB > 248 && gB > 248 && bB_col > 248;

    const dist = Math.abs(rA - rB) + Math.abs(gA - gB) + Math.abs(bA_col - bB_col);

    if (dist <= tolerance) {
      sameCount++;
      if (isWhiteA && isWhiteB) {
        // Both white background
        out[idx] = 255;
        out[idx + 1] = 255;
        out[idx + 2] = 255;
        out[idx + 3] = 255;
      } else {
        // Both have matching text/graphics: render as readable muted slate gray
        const gray = Math.round(0.299 * rA + 0.587 * gA + 0.114 * bA_col);
        out[idx] = Math.max(140, gray);
        out[idx + 1] = Math.max(140, gray);
        out[idx + 2] = Math.max(150, gray + 10);
        out[idx + 3] = 255;
      }
    } else if (!isWhiteA && isWhiteB) {
      // Exists in A but missing in B -> REMOVED / DELETED (Crimson Red)
      removedCount++;
      out[idx] = 239; // Red
      out[idx + 1] = 68;
      out[idx + 2] = 68;
      out[idx + 3] = 255;
    } else if (isWhiteA && !isWhiteB) {
      // Missing in A but exists in B -> ADDED / NEW (Emerald Green)
      addedCount++;
      out[idx] = 16; // Green
      out[idx + 1] = 185;
      out[idx + 2] = 129;
      out[idx + 3] = 255;
    } else {
      // Changed pixel color/content: tint according to B with amber highlight
      addedCount++;
      out[idx] = 245; // Amber
      out[idx + 1] = 158;
      out[idx + 2] = 11;
      out[idx + 3] = 255;
    }
  }

  const diffPixels = addedCount + removedCount;
  const nonBlankPixels = totalPixels - sameCount + diffPixels;
  const diffPercent = totalPixels > 0 ? Math.round((diffPixels / totalPixels) * 1000) / 10 : 0;

  return {
    diffData: out,
    diffPercent,
    addedCount,
    removedCount,
    sameCount,
  };
}

/**
 * Computes a simple word/line level diff between two strings.
 * Returns tokens with status: 'unchanged' | 'added' | 'removed'.
 */
export function computeTextDiff(textA = '', textB = '') {
  const wordsA = textA.split(/(\s+)/).filter(Boolean);
  const wordsB = textB.split(/(\s+)/).filter(Boolean);

  const diffs = [];
  let i = 0;
  let j = 0;

  while (i < wordsA.length && j < wordsB.length) {
    if (wordsA[i] === wordsB[j]) {
      diffs.push({ type: 'unchanged', text: wordsA[i] });
      i++;
      j++;
    } else {
      // Look ahead up to 10 tokens to find a resync match
      let matchA = -1;
      let matchB = -1;
      for (let look = 1; look <= 8; look++) {
        if (i + look < wordsA.length && wordsA[i + look] === wordsB[j]) {
          matchA = i + look;
          break;
        }
        if (j + look < wordsB.length && wordsA[i] === wordsB[j + look]) {
          matchB = j + look;
          break;
        }
      }

      if (matchB !== -1) {
        // Words added in B
        while (j < matchB) {
          diffs.push({ type: 'added', text: wordsB[j] });
          j++;
        }
      } else if (matchA !== -1) {
        // Words removed from A
        while (i < matchA) {
          diffs.push({ type: 'removed', text: wordsA[i] });
          i++;
        }
      } else {
        // Replacement: removed from A, added in B
        diffs.push({ type: 'removed', text: wordsA[i] });
        diffs.push({ type: 'added', text: wordsB[j] });
        i++;
        j++;
      }
    }
  }

  // Tail items
  while (i < wordsA.length) {
    diffs.push({ type: 'removed', text: wordsA[i] });
    i++;
  }
  while (j < wordsB.length) {
    diffs.push({ type: 'added', text: wordsB[j] });
    j++;
  }

  const addedWords = diffs.filter(d => d.type === 'added' && d.text.trim()).length;
  const removedWords = diffs.filter(d => d.type === 'removed' && d.text.trim()).length;

  return {
    diffs,
    addedWords,
    removedWords,
    hasChanges: addedWords > 0 || removedWords > 0,
  };
}

/**
 * Generates a downloadable Visual Diff PDF report using pdf-lib.
 * Stamping each diff page image onto a PDF.
 * 
 * @param {Array<{ pageNum: number, diffImageBlob: Blob, width: number, height: number, diffPercent: number }>} diffPages 
 * @param {object} [options]
 * @returns {Promise<Blob>}
 */
export async function generateComparisonPdfReport(diffPages = [], options = {}) {
  const { titleA = 'Original Document', titleB = 'Revised Document' } = options;
  const pdfDoc = await PDFDocument.create();

  pdfDoc.setTitle(`Comparison Report: ${titleA} vs ${titleB}`);
  pdfDoc.setProducer('We Make PDF');
  pdfDoc.setCreator('We Make PDF Compare PDF');

  for (const page of diffPages) {
    const pageWidth = page.width || 595.28;
    const pageHeight = page.height || 841.89;

    const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);

    if (page.diffImageBlob) {
      const imgBuffer = new Uint8Array(await page.diffImageBlob.arrayBuffer());
      const embeddedImage = await pdfDoc.embedPng(imgBuffer);
      pdfPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });
    }
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

