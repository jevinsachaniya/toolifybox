import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, degrees } from 'pdf-lib';
import { rotatedPdfFilename } from '../app/utils/document.js';
import { normalizeAngle, rotatePdfFile } from '../app/utils/rotate-pdf.js';

function makeMockFile(bytes, name = 'document.pdf', type = 'application/pdf') {
  return {
    name,
    size: bytes.length,
    type,
    async arrayBuffer() {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    },
  };
}

test('normalizeAngle snaps and bounds properly', () => {
  assert.equal(normalizeAngle(0), 0);
  assert.equal(normalizeAngle(90), 90);
  assert.equal(normalizeAngle(180), 180);
  assert.equal(normalizeAngle(270), 270);
  assert.equal(normalizeAngle(360), 0);
  assert.equal(normalizeAngle(-90), 270);
  assert.equal(normalizeAngle(-180), 180);
  assert.equal(normalizeAngle(450), 90);
  assert.equal(normalizeAngle(88), 90);
  assert.equal(normalizeAngle(NaN), 0);
});

test('rotatedPdfFilename outputs correct suffix', () => {
  assert.equal(rotatedPdfFilename('scan.pdf'), 'scan-rotated.pdf');
  assert.equal(rotatedPdfFilename('DOCUMENT.PDF'), 'DOCUMENT-rotated.pdf');
});

test('rotatePdfFile rotates all pages or individual pages', async () => {
  // Create a 3-page PDF
  const doc = await PDFDocument.create();
  for (let i = 1; i <= 3; i++) {
    const page = doc.addPage([200, 300]);
    page.drawText(`Page ${i}`, { x: 50, y: 150 });
  }
  const rawBytes = await doc.save();
  const file = makeMockFile(rawBytes, 'sample.pdf');

  // Test 1: Rotate entire document by 90 degrees
  const res1 = await rotatePdfFile(file, 90);
  assert.ok(res1.blob instanceof Blob);
  assert.equal(res1.pageCount, 3);
  assert.equal(res1.changedCount, 3);

  const doc1 = await PDFDocument.load(await res1.blob.arrayBuffer());
  for (const page of doc1.getPages()) {
    assert.equal(page.getRotation().angle, 90);
  }

  // Test 2: Rotate only page 2 by 180 degrees
  const res2 = await rotatePdfFile(file, { 2: 180 });
  assert.equal(res2.changedCount, 1);

  const doc2 = await PDFDocument.load(await res2.blob.arrayBuffer());
  const pages2 = doc2.getPages();
  assert.equal(pages2[0].getRotation().angle, 0);
  assert.equal(pages2[1].getRotation().angle, 180);
  assert.equal(pages2[2].getRotation().angle, 0);
});

