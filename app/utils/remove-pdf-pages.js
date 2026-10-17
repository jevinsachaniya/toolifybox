/**
 * Normalizes and parses user input strings like "1, 3-5, 8" into a sorted list of unique 1-based page numbers.
 * @param {string} input 
 * @param {number} totalPages 
 * @returns {number[]}
 */
export function parsePageInput(input, totalPages = Infinity) {
  if (!input || typeof input !== 'string') return [];
  const parts = input.split(/[,;\s]+/).map(p => p.trim()).filter(Boolean);
  const pages = new Set();

  for (const part of parts) {
    if (part.includes('-')) {
      const [rawStart, rawEnd] = part.split('-').map(s => Number.parseInt(s.trim(), 10));
      if (Number.isInteger(rawStart) && Number.isInteger(rawEnd)) {
        const start = Math.max(1, Math.min(rawStart, rawEnd));
        const end = Math.min(totalPages, Math.max(rawStart, rawEnd));
        for (let i = start; i <= end; i++) {
          pages.add(i);
        }
      }
    } else {
      const page = Number.parseInt(part, 10);
      if (Number.isInteger(page) && page >= 1 && page <= totalPages) {
        pages.add(page);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Formats a sorted list of page numbers into a compact human-readable range string like "1-3, 5, 8-10".
 * @param {number[]} pageNumbers 
 * @returns {string}
 */
export function formatPageList(pageNumbers) {
  if (!Array.isArray(pageNumbers) || !pageNumbers.length) return '';
  const sorted = [...new Set(pageNumbers.map(Number))].filter(n => Number.isInteger(n) && n > 0).sort((a, b) => a - b);
  if (!sorted.length) return '';

  const ranges = [];
  let rangeStart = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      ranges.push(rangeStart === prev ? `${rangeStart}` : `${rangeStart}-${prev}`);
      rangeStart = current;
      prev = current;
    }
  }
  ranges.push(rangeStart === prev ? `${rangeStart}` : `${rangeStart}-${prev}`);

  return ranges.join(', ');
}

/**
 * Removes specified pages from a PDF file completely within the browser.
 * @param {File|Blob} file 
 * @param {number[]} pagesToRemove 
 * @param {object} [options]
 * @returns {Promise<{ blob: Blob, keptCount: number, removedCount: number, totalPages: number }>}
 */
export async function removePagesFromPdf(file, pagesToRemove, { onProgress = () => {}, signal } = {}) {
  const { PDFDocument } = await import('pdf-lib');
  const sourceBytes = await file.arrayBuffer();

  if (signal?.aborted) throw new DOMException('Removal cancelled.', 'AbortError');
  onProgress('Inspecting PDF pages…');

  const source = await PDFDocument.load(sourceBytes, { ignoreEncryption: false, updateMetadata: false });
  const totalPages = source.getPageCount();

  if (totalPages < 2) {
    throw new Error('This PDF has only 1 page. A PDF must contain at least 2 pages to remove any.');
  }

  const removeSet = new Set(
    (pagesToRemove || [])
      .map(Number)
      .filter(n => Number.isInteger(n) && n >= 1 && n <= totalPages)
  );

  if (removeSet.size === 0) {
    throw new Error('Please select at least one page to delete.');
  }

  if (removeSet.size >= totalPages) {
    throw new Error('You cannot delete every page. Please keep at least one page in your PDF.');
  }

  const keptIndices = [];
  for (let i = 1; i <= totalPages; i++) {
    if (!removeSet.has(i)) {
      keptIndices.push(i - 1);
    }
  }

  if (signal?.aborted) throw new DOMException('Removal cancelled.', 'AbortError');
  onProgress(`Removing ${removeSet.size} page${removeSet.size > 1 ? 's' : ''} and rebuilding PDF…`);

  const output = await PDFDocument.create();
  const copiedPages = await output.copyPages(source, keptIndices);

  for (const page of copiedPages) {
    output.addPage(page);
  }

  output.setProducer('Toolifybox');
  output.setCreator('Toolifybox Remove PDF Pages');

  const bytes = await output.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 25 });
  const blob = new Blob([bytes], { type: 'application/pdf' });

  return {
    blob,
    keptCount: keptIndices.length,
    removedCount: removeSet.size,
    totalPages,
  };
}

