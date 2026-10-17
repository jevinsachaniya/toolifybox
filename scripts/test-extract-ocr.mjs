import test from 'node:test';
import assert from 'node:assert/strict';
import { countWords, formatPdfTextContent, validateOcrFile, createOcrDocx } from '../app/utils/extract-ocr.js';
import { ocrTextFilename } from '../app/utils/document.js';

test('validateOcrFile accepts valid PDF and images', () => {
  const validPdf = [{ name: 'scan.pdf', type: 'application/pdf', size: 1024 }];
  const validJpg = [{ name: 'receipt.jpg', type: 'image/jpeg', size: 2048 }];
  const validPng = [{ name: 'screenshot.png', type: 'image/png', size: 4096 }];
  const validWebp = [{ name: 'document.webp', type: 'image/webp', size: 8192 }];

  assert.equal(validateOcrFile(validPdf), null);
  assert.equal(validateOcrFile(validJpg), null);
  assert.equal(validateOcrFile(validPng), null);
  assert.equal(validateOcrFile(validWebp), null);
});

test('validateOcrFile rejects invalid, empty, or oversized files', () => {
  assert.ok(validateOcrFile([]));
  assert.ok(validateOcrFile([{ name: 'test.exe', type: 'application/octet-stream', size: 500 }]));
  assert.ok(validateOcrFile([{ name: 'empty.pdf', type: 'application/pdf', size: 0 }]));
  assert.ok(validateOcrFile([{ name: 'huge.pdf', type: 'application/pdf', size: 35 * 1024 * 1024 }]));
  assert.ok(validateOcrFile([
    { name: '1.pdf', type: 'application/pdf', size: 100 },
    { name: '2.pdf', type: 'application/pdf', size: 100 },
  ]));
});

test('countWords accurately counts English and Devanagari words', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('   '), 0);
  assert.equal(countWords('Hello world from Toolifybox!'), 4);
  assert.equal(countWords('यह एक हिंदी वाक्य है।'), 5);
  assert.equal(countWords('Invoice #1042: Total $500.00'), 5);
});

test('ocrTextFilename generates clean filenames for txt and docx', () => {
  assert.equal(ocrTextFilename('scanned_receipt.pdf', 'txt'), 'scanned_receipt-extracted.txt');
  assert.equal(ocrTextFilename('DOCUMENT.JPG', 'docx'), 'DOCUMENT-extracted.docx');
  assert.equal(ocrTextFilename('sample.png'), 'sample-extracted.txt');
});

test('formatPdfTextContent handles line breaks and paragraph spacing', () => {
  const content = {
    items: [
      { str: 'First Line', transform: [10, 0, 0, 10, 50, 700] },
      { str: '', hasEOL: true },
      { str: 'Second Line', transform: [10, 0, 0, 10, 50, 680] },
    ],
  };
  const text = formatPdfTextContent(content);
  assert.ok(text.includes('First Line'));
  assert.ok(text.includes('Second Line'));
});

test('createOcrDocx returns valid Word document blob', async () => {
  const blob = await createOcrDocx('Test extracted text content\nSecond paragraph for testing.', { title: 'Test Document' });
  assert.ok(blob);
  assert.ok(blob.size > 1000);
  assert.equal(blob.type, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
});
