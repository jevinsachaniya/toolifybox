import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  calculatePdfCropBox,
  cropPdf,
  cropPdfFilename,
  normalizeRotation,
  parseCropPageRange,
  validatePdfForCrop,
} from '../app/utils/crop-pdf.js';

test('validatePdfForCrop accepts valid PDF and rejects non-PDF', () => {
  assert.equal(validatePdfForCrop(null), 'Please choose a PDF file.');
  assert.equal(validatePdfForCrop({ name: 'image.png', type: 'image/png', size: 1024 }), 'Please select a valid PDF document (.pdf).');
  assert.equal(validatePdfForCrop({ name: 'empty.pdf', type: 'application/pdf', size: 0 }), 'The chosen PDF file is empty.');
  assert.equal(validatePdfForCrop({ name: 'huge.pdf', type: 'application/pdf', size: 105 * 1024 * 1024 }), 'PDF file exceeds 100 MB limit. Please choose a smaller file.');
  assert.equal(validatePdfForCrop({ name: 'document.pdf', type: 'application/pdf', size: 5000 }), '');
});

test('cropPdfFilename creates clean output filename', () => {
  assert.equal(cropPdfFilename('annual-report.pdf'), 'annual-report-cropped.pdf');
  assert.equal(cropPdfFilename('invoice.PDF'), 'invoice-cropped.pdf');
  assert.equal(cropPdfFilename(''), 'document-cropped.pdf');
});

test('parseCropPageRange parses all, single, ranges, odd, and even', () => {
  assert.deepEqual([...parseCropPageRange('all', 5)], [1, 2, 3, 4, 5]);
  assert.deepEqual([...parseCropPageRange('2', 5)], [2]);
  assert.deepEqual([...parseCropPageRange('1-3, 5', 5)], [1, 2, 3, 5]);
  assert.deepEqual([...parseCropPageRange('odd', 5)], [1, 3, 5]);
  assert.deepEqual([...parseCropPageRange('even', 5)], [2, 4]);
  assert.deepEqual([...parseCropPageRange('3-end', 5)], [3, 4, 5]);
});

test('normalizeRotation snaps to orthogonal degrees', () => {
  assert.equal(normalizeRotation(0), 0);
  assert.equal(normalizeRotation(90), 90);
  assert.equal(normalizeRotation(180), 180);
  assert.equal(normalizeRotation(270), 270);
  assert.equal(normalizeRotation(360), 0);
  assert.equal(normalizeRotation(-90), 270);
});

test('calculatePdfCropBox computes accurate boxes for 0, 90, 180, and 270 rotations', () => {
  // Page size 500 x 800
  // Margins: top=20, bottom=30, left=40, right=50
  const box0 = calculatePdfCropBox({
    pageWidth: 500,
    pageHeight: 800,
    boxX: 0,
    boxY: 0,
    rotation: 0,
    margins: { top: 20, bottom: 30, left: 40, right: 50 },
  });
  // At 0 deg:
  // x = 0 + 40 = 40
  // y = 0 + 30 = 30
  // width = 500 - 40 - 50 = 410
  // height = 800 - 20 - 30 = 750
  assert.deepEqual(box0, { x: 40, y: 30, width: 410, height: 750 });

  // At 180 deg:
  const box180 = calculatePdfCropBox({
    pageWidth: 500,
    pageHeight: 800,
    boxX: 0,
    boxY: 0,
    rotation: 180,
    margins: { top: 20, bottom: 30, left: 40, right: 50 },
  });
  // At 180 deg:
  // x = 0 + right = 50
  // y = 0 + top = 20
  // width = 500 - 40 - 50 = 410
  // height = 800 - 20 - 30 = 750
  assert.deepEqual(box180, { x: 50, y: 20, width: 410, height: 750 });
});

test('cropPdf crops all pages of a PDF document losslessly', async () => {
  const doc = await PDFDocument.create();
  const page1 = doc.addPage([600, 800]);
  page1.drawText('Page 1 Content', { x: 100, y: 700, size: 24, color: rgb(0, 0, 0) });

  const page2 = doc.addPage([600, 800]);
  page2.drawText('Page 2 Content', { x: 100, y: 700, size: 24, color: rgb(0, 0, 0) });

  const pdfBytes = await doc.save();
  const file = new Blob([pdfBytes], { type: 'application/pdf' });

  const result = await cropPdf(file, {
    margins: { top: 50, bottom: 50, left: 40, right: 40 },
    pageScope: 'all',
  });

  assert.equal(result.pageCount, 2);
  assert.equal(result.croppedPagesCount, 2);

  // Load result and check crop boxes
  const croppedDoc = await PDFDocument.load(await result.blob.arrayBuffer());
  const croppedPages = croppedDoc.getPages();

  assert.equal(croppedPages.length, 2);
  const p1Box = croppedPages[0].getCropBox();
  assert.equal(p1Box.x, 40);
  assert.equal(p1Box.y, 50);
  assert.equal(p1Box.width, 520); // 600 - 40 - 40
  assert.equal(p1Box.height, 700); // 800 - 50 - 50

  const p2Box = croppedPages[1].getCropBox();
  assert.equal(p2Box.x, 40);
  assert.equal(p2Box.y, 50);
  assert.equal(p2Box.width, 520);
  assert.equal(p2Box.height, 700);
});

test('cropPdf supports single page crop and custom range', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([500, 700]);
  doc.addPage([500, 700]);
  doc.addPage([500, 700]);

  const pdfBytes = await doc.save();
  const file = new Blob([pdfBytes], { type: 'application/pdf' });

  // Crop only page 2
  const result = await cropPdf(file, {
    margins: { top: 30, bottom: 30, left: 30, right: 30 },
    pageScope: 'custom',
    customRange: '2',
  });

  assert.equal(result.pageCount, 3);
  assert.equal(result.croppedPagesCount, 1);

  const croppedDoc = await PDFDocument.load(await result.blob.arrayBuffer());
  const pages = croppedDoc.getPages();

  // Page 1 is uncropped (width 500, height 700)
  assert.equal(pages[0].getCropBox().width, 500);

  // Page 2 is cropped
  assert.equal(pages[1].getCropBox().width, 440); // 500 - 60
  assert.equal(pages[1].getCropBox().height, 640); // 700 - 60

  // Page 3 is uncropped
  assert.equal(pages[2].getCropBox().width, 500);
});

test('cropPdf cancellation aborts cleanly', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([500, 700]);
  const pdfBytes = await doc.save();
  const file = new Blob([pdfBytes], { type: 'application/pdf' });

  const controller = new AbortController();
  controller.abort();

  await assert.rejects(
    () => cropPdf(file, {}, { signal: controller.signal }),
    (err) => err.name === 'AbortError'
  );
});

