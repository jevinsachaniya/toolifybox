import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { flattenedPdfFilename } from '../app/utils/document.js';
import { flattenPdf } from '../app/utils/flatten-pdf.js';

function makeMockFile(bytes, name = 'form-sample.pdf', type = 'application/pdf') {
  return {
    name,
    size: bytes.length,
    type,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}

test('flattenedPdfFilename outputs correct suffix', () => {
  assert.equal(flattenedPdfFilename('tax_form.pdf'), 'tax_form-flattened.pdf');
  assert.equal(flattenedPdfFilename('APPLICATION.PDF'), 'APPLICATION-flattened.pdf');
});

test('flattenPdf locks form fields and returns valid PDF', async () => {
  // Create sample PDF with interactive text field
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 700]);
  const form = doc.getForm();
  const field = form.createTextField('applicant_name');
  field.setText('Alex Rivera');
  field.addToPage(page, { x: 50, y: 600, width: 250, height: 35 });

  const initialBytes = await doc.save();
  const mockFile = makeMockFile(initialBytes);

  const result = await flattenPdf(mockFile, { mode: 'form' });
  assert.equal(result.pageCount, 1);
  assert.equal(result.fieldCount, 1);
  assert.equal(result.mode, 'form');
  assert.ok(result.blob.size > 0);

  // Verify the flattened PDF has 0 form fields remaining
  const resultBytes = new Uint8Array(await result.blob.arrayBuffer());
  const verifiedDoc = await PDFDocument.load(resultBytes);
  const verifiedFields = verifiedDoc.getForm().getFields();
  assert.equal(verifiedFields.length, 0, 'Flattened PDF must not have editable form fields');
});

test('flattenPdf works gracefully on PDFs without form fields', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([400, 600]);
  const initialBytes = await doc.save();
  const mockFile = makeMockFile(initialBytes, 'plain.pdf');

  const result = await flattenPdf(mockFile, { mode: 'form' });
  assert.equal(result.pageCount, 1);
  assert.equal(result.fieldCount, 0);
  assert.ok(result.blob.size > 0);
});

