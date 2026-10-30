/**
 * Normalizes an angle in degrees to a valid PDF standard orthogonal rotation (0, 90, 180, or 270).
 * @param {number} angle 
 * @returns {number} 0, 90, 180, or 270
 */
export function normalizeAngle(angle) {
  if (typeof angle !== 'number' || Number.isNaN(angle)) return 0;
  const snapped = Math.round(angle / 90) * 90;
  return ((snapped % 360) + 360) % 360;
}

/**
 * Rotates pages of a PDF document directly inside the browser.
 * @param {File|Blob} file 
 * @param {number|number[]|Record<number, number>} pageDeltas - angle delta (relative) or map of 1-based page number to relative delta in degrees
 * @param {object} [options]
 * @returns {Promise<{ blob: Blob, pageCount: number, changedCount: number }>}
 */
export async function rotatePdfFile(file, pageDeltas, { onProgress = () => {}, signal } = {}) {
  const { PDFDocument, degrees } = await import('pdf-lib');
  const sourceBytes = await file.arrayBuffer();

  if (signal?.aborted) throw new DOMException('Rotation cancelled.', 'AbortError');
  onProgress('Reading PDF structure…');

  const pdfDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: false, updateMetadata: false });
  const pages = pdfDoc.getPages();
  const pageCount = pages.length;

  if (pageCount === 0) {
    throw new Error('This PDF contains no pages to rotate.');
  }

  let changedCount = 0;

  for (let i = 0; i < pageCount; i++) {
    if (signal?.aborted) throw new DOMException('Rotation cancelled.', 'AbortError');
    const pageNum = i + 1;
    let delta = 0;

    if (typeof pageDeltas === 'number') {
      delta = pageDeltas;
    } else if (Array.isArray(pageDeltas)) {
      delta = pageDeltas[i] || 0;
    } else if (pageDeltas && typeof pageDeltas === 'object') {
      delta = pageDeltas[pageNum] ?? pageDeltas[String(pageNum)] ?? 0;
    }

    if (delta !== 0) {
      const page = pages[i];
      const existingAngle = page.getRotation().angle || 0;
      const finalAngle = normalizeAngle(existingAngle + delta);

      if (finalAngle !== existingAngle) {
        page.setRotation(degrees(finalAngle));
        changedCount++;
      }
    }
  }

  onProgress(`Saving ${pageCount} rotated page${pageCount > 1 ? 's' : ''}…`);
  pdfDoc.setProducer('We Make PDF');
  pdfDoc.setCreator('We Make PDF Rotate PDF');

  const bytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 25 });
  const blob = new Blob([bytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount,
    changedCount,
  };
}

