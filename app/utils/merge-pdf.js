import { MAX_DOCUMENT_SIZE } from './document.js';

export const MAX_MERGE_FILES = 10;
export const MAX_MERGE_TOTAL_SIZE = 100 * 1024 * 1024;
export const MAX_MERGE_PAGES = 200;

export function validateMergeFiles(files, existing = []) {
  const chosen = Array.from(files || []);
  if (!chosen.length) return 'Choose at least one PDF file.';
  if (existing.length + chosen.length > MAX_MERGE_FILES) return `You can merge up to ${MAX_MERGE_FILES} PDFs at a time.`;
  for (const file of chosen) {
    if (!/\.pdf$/i.test(file.name)) return `${file.name} is not a PDF document.`;
    if (!file.size) return `${file.name} is empty. Choose another file.`;
    if (file.size > MAX_DOCUMENT_SIZE) return `${file.name} is larger than 20 MB.`;
  }
  const total = [...existing, ...chosen].reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_MERGE_TOTAL_SIZE) return 'The selected PDFs are larger than 100 MB in total.';
  return '';
}

export function mergedPdfFilename(files) {
  const base = files[0]?.name?.replace(/\.pdf$/i, '').trim() || 'documents';
  return `${base}-merged.pdf`;
}

export async function mergePdfFiles(files, { onProgress = () => {}, signal } = {}) {
  const { PDFDocument } = await import('pdf-lib');
  const output = await PDFDocument.create();
  let totalPages = 0;

  for (let index = 0; index < files.length; index++) {
    if (signal?.aborted) throw new DOMException('Merge cancelled.', 'AbortError');
    onProgress(`Copying ${files[index].name} (${index + 1} of ${files.length})...`);
    const bytes = await files[index].arrayBuffer();
    if (signal?.aborted) throw new DOMException('Merge cancelled.', 'AbortError');
    const source = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
    const indices = source.getPageIndices();
    totalPages += indices.length;
    if (totalPages > MAX_MERGE_PAGES) throw new Error(`The combined PDF is longer than ${MAX_MERGE_PAGES} pages.`);
    const pages = await output.copyPages(source, indices);
    for (const page of pages) output.addPage(page);
  }

  if (!totalPages) throw new Error('The selected PDFs do not contain any pages.');
  output.setProducer('Toolifybox');
  output.setCreator('Toolifybox Merge PDF');
  onProgress('Finishing your merged PDF...');
  const bytes = await output.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 20 });
  return { blob: new Blob([bytes], { type: 'application/pdf' }), pageCount: totalPages };
}
