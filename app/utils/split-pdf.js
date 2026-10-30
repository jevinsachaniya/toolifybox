export function normalizeSplitPoints(points, pageCount) {
  return [...new Set(Array.from(points || []).map(Number))]
    .filter(point => Number.isInteger(point) && point > 0 && point < pageCount)
    .sort((a, b) => a - b);
}

export function buildSplitRanges(pageCount, points) {
  if (!Number.isInteger(pageCount) || pageCount < 1) return [];
  const breaks = normalizeSplitPoints(points, pageCount);
  const ranges = [];
  let start = 1;
  for (const end of [...breaks, pageCount]) {
    ranges.push({ start, end, pageCount: end - start + 1 });
    start = end + 1;
  }
  return ranges;
}

function baseName(name) {
  return name.replace(/\.pdf$/i, '').trim() || 'document';
}

export function splitPartFilename(name, index, total, range) {
  const digits = Math.max(2, String(total).length);
  return `${baseName(name)}-part-${String(index + 1).padStart(digits, '0')}-pages-${range.start}-${range.end}.pdf`;
}

export function splitArchiveFilename(name) {
  return `${baseName(name)}-split-parts.zip`;
}

export async function splitPdfFile(file, points, { onProgress = () => {}, signal } = {}) {
  const { PDFDocument } = await import('pdf-lib');
  const sourceBytes = await file.arrayBuffer();
  if (signal?.aborted) throw new DOMException('Split cancelled.', 'AbortError');
  const source = await PDFDocument.load(sourceBytes, { ignoreEncryption: false, updateMetadata: false });
  const ranges = buildSplitRanges(source.getPageCount(), points);
  if (ranges.length < 2) throw new Error('Choose at least one split point before creating the PDF parts.');
  const outputs = [];

  for (let index = 0; index < ranges.length; index++) {
    if (signal?.aborted) throw new DOMException('Split cancelled.', 'AbortError');
    const range = ranges[index];
    onProgress(`Creating part ${index + 1} of ${ranges.length}: pages ${range.start}-${range.end}...`);
    const output = await PDFDocument.create();
    const indices = Array.from({ length: range.pageCount }, (_, offset) => range.start - 1 + offset);
    const pages = await output.copyPages(source, indices);
    for (const page of pages) output.addPage(page);
    output.setProducer('We Make PDF');
    output.setCreator('We Make PDF Split PDF');
    const bytes = await output.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 20 });
    outputs.push({
      blob: new Blob([bytes], { type: 'application/pdf' }),
      filename: splitPartFilename(file.name, index, ranges.length, range),
      range,
    });
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return outputs;
}
