import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { removedPagesPdfFilename } from '../app/utils/document.js';
import { parsePageInput, formatPageList, removePagesFromPdf } from '../app/utils/remove-pdf-pages.js';

function makeMockFile(bytes, name = 'multipage.pdf', type = 'application/pdf') {
  return {
    name,
    size: bytes.length,
    type,
    async arrayBuffer() {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    },
  };
}

test('parsePageInput parses numbers and ranges properly', () => {
  assert.deepEqual(parsePageInput('1, 3-5, 8', 10), [1, 3, 4, 5, 8]);
  assert.deepEqual(parsePageInput('2 4 6', 10), [2, 4, 6]);
  assert.deepEqual(parsePageInput('1-3; 5', 5), [1, 2, 3, 5]);
  // bounds checks
  assert.deepEqual(parsePageInput('0, 2, 15', 5), [2]);
  assert.deepEqual(parsePageInput('4-2', 10), [2, 3, 4]);
  assert.deepEqual(parsePageInput('', 10), []);
});

test('formatPageList formats numbers into clean ranges', () => {
  assert.equal(formatPageList([1, 2, 3, 5, 8, 9, 10]), '1-3, 5, 8-10');
  assert.equal(formatPageList([2]), '2');
  assert.equal(formatPageList([]), '');
});

test('removedPagesPdfFilename formats correct output name', () => {
  assert.equal(removedPagesPdfFilename('report.pdf'), 'report-pages-removed.pdf');
  assert.equal(removedPagesPdfFilename('CONTRACT.PDF'), 'CONTRACT-pages-removed.pdf');
});

test('removePagesFromPdf deletes selected pages and returns valid PDF', async () => {
  // Create a 4-page PDF document
  const doc = await PDFDocument.create();
  for (let i = 1; i <= 4; i++) {
    const page = doc.addPage([300, 300]);
    page.drawText(`Page ${i}`, { x: 50, y: 150 });
  }
  const rawBytes = await doc.save();
  const file = makeMockFile(rawBytes, 'sample-4pages.pdf');

  // Remove pages 2 and 3 -> should keep pages 1 and 4
  const result = await removePagesFromPdf(file, [2, 3]);
  assert.ok(result.blob instanceof Blob);
  assert.equal(result.keptCount, 2);
  assert.equal(result.removedCount, 2);

  // Inspect generated PDF to confirm it now has exactly 2 pages
  const generatedBytes = await result.blob.arrayBuffer();
  const verifiedDoc = await PDFDocument.load(generatedBytes);
  assert.equal(verifiedDoc.getPageCount(), 2);

  // Test error when attempting to remove all pages
  await assert.rejects(
    () => removePagesFromPdf(file, [1, 2, 3, 4]),
    /You cannot delete every page/
  );

  // Test error when no pages selected
  await assert.rejects(
    () => removePagesFromPdf(file, []),
    /Please select at least one page/
  );
});

