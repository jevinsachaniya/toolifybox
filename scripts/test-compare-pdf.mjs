import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import {
  comparePdfFilename,
  computePixelDiff,
  computeTextDiff,
  generateComparisonPdfReport,
  validateComparePdfFiles,
} from '../app/utils/compare-pdf.js';

test('validateComparePdfFiles validates file pair correctly', () => {
  assert.equal(validateComparePdfFiles(null, null), 'Please select both Original (Document A) and Revised (Document B) PDF files.');
  assert.equal(validateComparePdfFiles({ name: 'a.pdf', type: 'application/pdf', size: 100 }, null), 'Please choose the Revised PDF document (File B).');
  assert.equal(validateComparePdfFiles(null, { name: 'b.pdf', type: 'application/pdf', size: 100 }), 'Please choose the Original PDF document (File A).');
  assert.equal(validateComparePdfFiles({ name: 'a.png', type: 'image/png', size: 100 }, { name: 'b.pdf', type: 'application/pdf', size: 100 }), 'Document A is not a valid PDF file (.pdf).');
  assert.equal(validateComparePdfFiles({ name: 'a.pdf', type: 'application/pdf', size: 0 }, { name: 'b.pdf', type: 'application/pdf', size: 100 }), 'Document A is an empty file.');
  assert.equal(validateComparePdfFiles({ name: 'a.pdf', type: 'application/pdf', size: 100 }, { name: 'b.pdf', type: 'application/pdf', size: 105 * 1024 * 1024 }), 'Document B exceeds the 100 MB size limit.');
  assert.equal(validateComparePdfFiles({ name: 'a.pdf', type: 'application/pdf', size: 5000 }, { name: 'b.pdf', type: 'application/pdf', size: 5000 }), '');
});

test('comparePdfFilename formats clean output filename', () => {
  assert.equal(comparePdfFilename('v1-contract.pdf', 'v2-contract.pdf'), 'v1-contract-vs-v2-contract-comparison.pdf');
  assert.equal(comparePdfFilename('', ''), 'docA-vs-docB-comparison.pdf');
});

test('computePixelDiff detects identical, added, and removed pixels', () => {
  const width = 2;
  const height = 2;
  // Canvas A: 4 pixels: [White, Black, White, Black]
  const dataA = new Uint8ClampedArray([
    255, 255, 255, 255, // white
    0, 0, 0, 255,       // black
    255, 255, 255, 255, // white
    0, 0, 0, 255,       // black (removed in B)
  ]);
  // Canvas B: 4 pixels: [White, Black, Black, White]
  const dataB = new Uint8ClampedArray([
    255, 255, 255, 255, // white (identical)
    0, 0, 0, 255,       // black (identical)
    0, 0, 0, 255,       // black (added in B)
    255, 255, 255, 255, // white (removed from A)
  ]);

  const diff = computePixelDiff({ data: dataA }, { data: dataB }, width, height);

  assert.equal(diff.sameCount, 2);
  assert.equal(diff.addedCount, 1);
  assert.equal(diff.removedCount, 1);
  assert.equal(diff.diffPercent, 50); // 2 out of 4 pixels differed = 50%

  // Check color of added pixel (index 2: idx = 8) -> Green [16, 185, 129]
  assert.equal(diff.diffData[8], 16);
  assert.equal(diff.diffData[9], 185);
  assert.equal(diff.diffData[10], 129);

  // Check color of removed pixel (index 3: idx = 12) -> Red [239, 68, 68]
  assert.equal(diff.diffData[12], 239);
  assert.equal(diff.diffData[13], 68);
  assert.equal(diff.diffData[14], 68);
});

test('computeTextDiff detects identical, additions, and removals', () => {
  // Identical
  const same = computeTextDiff('Agreement between party A and B', 'Agreement between party A and B');
  assert.equal(same.hasChanges, false);
  assert.equal(same.addedWords, 0);
  assert.equal(same.removedWords, 0);

  // Additions
  const add = computeTextDiff('Hello world', 'Hello beautiful new world');
  assert.equal(add.hasChanges, true);
  assert.equal(add.addedWords, 2); // 'beautiful', 'new'
  assert.equal(add.removedWords, 0);

  // Removals
  const rem = computeTextDiff('Total amount is $500 today', 'Total amount is $500');
  assert.equal(rem.hasChanges, true);
  assert.equal(rem.removedWords, 1); // 'today'

  // Substitutions
  const sub = computeTextDiff('Signed on Monday', 'Signed on Friday');
  assert.equal(sub.hasChanges, true);
  assert.equal(sub.removedWords, 1);
  assert.equal(sub.addedWords, 1);
});

test('generateComparisonPdfReport produces valid multi-page PDF blob', async () => {
  // Create mock PNG image blob
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 200]);
  const pdfBytes = await doc.save();

  // Test report creation
  const reportBlob = await generateComparisonPdfReport([
    { pageNum: 1, width: 595, height: 842 },
    { pageNum: 2, width: 595, height: 842 },
  ], { titleA: 'V1.pdf', titleB: 'V2.pdf' });

  assert.ok(reportBlob instanceof Blob);
  assert.ok(reportBlob.size > 500);

  const loaded = await PDFDocument.load(await reportBlob.arrayBuffer());
  assert.equal(loaded.getPageCount(), 2);
  assert.equal(loaded.getTitle(), 'Comparison Report: V1.pdf vs V2.pdf');
});

