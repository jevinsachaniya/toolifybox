/**
 * Utility for organizing, reordering, rotating, deleting, and duplicating PDF pages in-browser.
 */
import { PDFDocument, degrees } from 'pdf-lib';
import { normalizeAngle } from './rotate-pdf.js';

/**
 * Generates a clean output filename for organized PDF.
 * @param {string} originalName 
 * @returns {string}
 */
export function organizedPdfFilename(originalName) {
  if (!originalName) return 'organized.pdf';
  const clean = originalName.replace(/\.[^/.]+$/, '').trim();
  return `${clean || 'document'}-organized.pdf`;
}

/**
 * Organizes and compiles the pages into a single new PDF document.
 * @param {Array<{ sourceFile: File|Blob, originalPageNumber: number, rotation: number, isBlank?: boolean }>} pageItems
 * @param {object} [options]
 * @returns {Promise<{ blob: Blob, pageCount: number, size: number }>}
 */
export async function organizePdfDocument(pageItems, { onProgress = () => {}, signal } = {}) {
  if (!Array.isArray(pageItems) || pageItems.length === 0) {
    throw new Error('At least one page is required to create your organized PDF.');
  }

  onProgress('Initializing PDF engine…');
  const newDoc = await PDFDocument.create();

  // Cache parsed source documents by File object to prevent repeated arrayBuffer / parse calls
  const docCache = new Map();

  const total = pageItems.length;
  for (let i = 0; i < total; i++) {
    if (signal?.aborted) throw new DOMException('Operation cancelled.', 'AbortError');
    const item = pageItems[i];
    onProgress(`Processing page ${i + 1} of ${total}…`);

    if (item.isBlank) {
      // Standard portrait A4 dimensions: 595.28 x 841.89 points
      const blankPage = newDoc.addPage([595.28, 841.89]);
      if (item.rotation) {
        blankPage.setRotation(degrees(normalizeAngle(item.rotation)));
      }
      continue;
    }

    let sourceDoc = docCache.get(item.sourceFile);
    if (!sourceDoc) {
      const buffer = await item.sourceFile.arrayBuffer();
      sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: false, updateMetadata: false });
      docCache.set(item.sourceFile, sourceDoc);
    }

    const pageIdx = (item.originalPageNumber || 1) - 1;
    const [copiedPage] = await newDoc.copyPages(sourceDoc, [pageIdx]);
    const currentAngle = copiedPage.getRotation().angle || 0;
    const finalAngle = normalizeAngle(currentAngle + (item.rotation || 0));
    copiedPage.setRotation(degrees(finalAngle));
    newDoc.addPage(copiedPage);
  }

  onProgress('Saving organized PDF…');
  newDoc.setProducer('We Make PDF');
  newDoc.setCreator('We Make PDF Organize PDF');

  const pdfBytes = await newDoc.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 25 });
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount: total,
    size: blob.size,
  };
}

