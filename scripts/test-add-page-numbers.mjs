import assert from 'node:assert/strict';
import test from 'node:test';
import { PDFDocument } from 'pdf-lib';
import {
  addPageNumbersToPdf,
  parsePdfColor,
  PAGE_NUMBER_FORMATS,
  PAGE_NUMBER_POSITIONS,
  pageNumberedPdfFilename,
  parsePageNumberRange,
  validatePdfForPageNumbers,
} from '../app/utils/add-page-numbers.js';

test('validatePdfForPageNumbers accepts valid PDF and rejects non-PDF', () => {
  const validFile = new File([new Uint8Array(500)], 'sample.pdf', { type: 'application/pdf' });
  assert.equal(validatePdfForPageNumbers(validFile), '');

  const textFile = new File(['hello'], 'document.txt', { type: 'text/plain' });
  assert.ok(validatePdfForPageNumbers(textFile).includes('valid PDF document'));

  const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' });
  assert.ok(validatePdfForPageNumbers(emptyFile).includes('empty'));
});

test('parsePdfColor accurately parses hex strings into pdf-lib colors', () => {
  const red = parsePdfColor('#ff0000');
  assert.equal(red.red, 1);
  assert.equal(red.green, 0);
  assert.equal(red.blue, 0);

  const black = parsePdfColor('#000000');
  assert.equal(black.red, 0);
  assert.equal(black.green, 0);
  assert.equal(black.blue, 0);
});

test('pageNumberedPdfFilename formats clean output name', () => {
  assert.equal(pageNumberedPdfFilename('Invoice.pdf'), 'Invoice-numbered.pdf');
  assert.equal(pageNumberedPdfFilename('My Document.PDF'), 'My Document-numbered.pdf');
});

test('parsePageNumberRange parses ranges and individual pages', () => {
  const range1 = parsePageNumberRange('1-3, 5, 8-10', 10);
  assert.deepEqual(Array.from(range1).sort((a, b) => a - b), [1, 2, 3, 5, 8, 9, 10]);

  const all = parsePageNumberRange('', 5);
  assert.equal(all.size, 5);
});

test('PAGE_NUMBER_FORMATS properly formats text strings', () => {
  assert.equal(PAGE_NUMBER_FORMATS['page-of-total'].format(1, 5, ''), 'Page 1 of 5');
  assert.equal(PAGE_NUMBER_FORMATS['simple'].format(3, 5, ''), '3');
  assert.equal(PAGE_NUMBER_FORMATS['slash'].format(2, 5, ''), '2 / 5');
  assert.equal(PAGE_NUMBER_FORMATS['dash'].format(4, 5, ''), '— 4 —');
  assert.equal(PAGE_NUMBER_FORMATS['brackets'].format(5, 5, 'Doc'), 'Doc [ 5 ]');
});

test('addPageNumbersToPdf adds numbers and returns valid PDF blob', async () => {
  // Create a minimal 3-page test PDF
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([595, 842]);
  pdfDoc.addPage([595, 842]);
  pdfDoc.addPage([595, 842]);
  const pdfBytes = await pdfDoc.save();

  const mockFile = {
    arrayBuffer: async () => pdfBytes.buffer,
    size: pdfBytes.length,
    name: 'test.pdf',
  };

  const result = await addPageNumbersToPdf(mockFile, {
    position: 'bottom-center',
    format: 'page-of-total',
    fontSize: 10,
    color: '#000000',
    margin: 30,
  });

  assert.ok(result.blob);
  assert.equal(result.pageCount, 3);
  assert.equal(result.modifiedCount, 3);

  // Validate the produced PDF can be loaded back
  const loaded = await PDFDocument.load(await result.blob.arrayBuffer());
  assert.equal(loaded.getPageCount(), 3);
});

test('addPageNumbersToPdf supports skipping cover page', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([595, 842]);
  pdfDoc.addPage([595, 842]);
  pdfDoc.addPage([595, 842]);
  const pdfBytes = await pdfDoc.save();

  const mockFile = {
    arrayBuffer: async () => pdfBytes.buffer,
    size: pdfBytes.length,
    name: 'test.pdf',
  };

  const result = await addPageNumbersToPdf(mockFile, {
    pageRange: 'skip-first',
    position: 'bottom-right',
    format: 'simple',
  });

  assert.equal(result.modifiedCount, 2);
});

