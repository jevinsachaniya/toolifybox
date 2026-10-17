import { PDFDocument } from 'pdf-lib';
import { openPdfForImages } from './pdf-images.js';

/**
 * Flattens PDF documents in the browser.
 * 
 * In 'form' mode:
 * - Flattens AcroForms (fillable text fields, checkboxes, dropdowns, radio buttons)
 *   into fixed, non-editable vector page graphics without quality loss.
 * 
 * In 'raster' mode (Full Visual Flattening):
 * - Renders all pages and visual annotations to crisp flat images, fusing all
 *   layers and annotations permanently into the page canvas.
 * 
 * @param {File|Blob} file 
 * @param {object} [options]
 * @param {'form'|'raster'} [options.mode='form']
 * @param {(message: string) => void} [options.onProgress]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ blob: Blob, pageCount: number, fieldCount: number, mode: 'form'|'raster' }>}
 */
export async function flattenPdf(file, { mode = 'form', onProgress = () => {}, signal } = {}) {
  if (signal?.aborted) throw new DOMException('Flattening cancelled.', 'AbortError');
  
  const sourceBytes = await file.arrayBuffer();
  if (signal?.aborted) throw new DOMException('Flattening cancelled.', 'AbortError');

  if (mode === 'raster') {
    onProgress('Preparing visual flattening…');
    const handle = await openPdfForImages(file, { signal, onProgress });
    try {
      const pageCount = handle.pageCount;
      if (pageCount === 0) throw new Error('This PDF contains no pages to flatten.');

      const outputDoc = await PDFDocument.create();

      for (let number = 1; number <= pageCount; number++) {
        if (signal?.aborted) throw new DOMException('Flattening cancelled.', 'AbortError');
        onProgress(`Flattening page ${number} of ${pageCount}…`);

        const rendered = await handle.renderPage(number, {
          maxDimension: 1800,
          format: 'jpg',
          quality: 0.92,
        });

        const imageBytes = await rendered.blob.arrayBuffer();
        const embeddedJpg = await outputDoc.embedJpg(imageBytes);

        // Add page matching the original aspect ratio
        const page = outputDoc.addPage([rendered.width, rendered.height]);
        page.drawImage(embeddedJpg, {
          x: 0,
          y: 0,
          width: rendered.width,
          height: rendered.height,
        });

        URL.revokeObjectURL(rendered.url);
      }

      onProgress('Finalizing flattened document…');
      outputDoc.setProducer('Toolifybox');
      outputDoc.setCreator('Toolifybox Flatten PDF');

      const bytes = await outputDoc.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 25 });
      const blob = new Blob([bytes], { type: 'application/pdf' });

      return {
        blob,
        pageCount,
        fieldCount: 0,
        mode: 'raster',
      };
    } finally {
      await handle.close();
    }
  }

  // Standard Form Fields & Vector Flattening
  onProgress('Reading form elements and page structure…');
  const pdfDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: false, updateMetadata: false });
  const pageCount = pdfDoc.getPageCount();

  if (pageCount === 0) {
    throw new Error('This PDF contains no pages to flatten.');
  }

  let fieldCount = 0;
  try {
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    fieldCount = fields.length;
    if (fieldCount > 0) {
      onProgress(`Locking ${fieldCount} interactive form field${fieldCount > 1 ? 's' : ''}…`);
      form.flatten();
    }
  } catch (caught) {
    // If PDF has no AcroForm dictionary, getForm throws NoSuchFieldError or returns empty
    fieldCount = 0;
  }

  if (signal?.aborted) throw new DOMException('Flattening cancelled.', 'AbortError');
  onProgress('Saving flattened document…');

  pdfDoc.setProducer('Toolifybox');
  pdfDoc.setCreator('Toolifybox Flatten PDF');

  const bytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 25 });
  const blob = new Blob([bytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount,
    fieldCount,
    mode: 'form',
  };
}

