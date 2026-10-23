import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import {
  applyWatermarkToPdf,
  hexToRgb01,
  parseWatermarkPageRange,
  validatePdfForWatermark,
  validateWatermarkImageFile,
  watermarkedPdfFilename,
} from '../app/utils/watermark-pdf.js';
import { createTranslatedPdf } from '../app/utils/translate-pdf.js';

function makeMockPdfFile(bytes, name = 'sample.pdf') {
  return {
    name,
    size: bytes.length,
    type: 'application/pdf',
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}

test('validatePdfForWatermark validates files properly', () => {
  assert.match(validatePdfForWatermark([]), /choose a PDF/i);
  assert.match(validatePdfForWatermark([{ name: 'a.pdf' }, { name: 'b.pdf' }]), /single PDF/i);
  assert.match(validatePdfForWatermark([{ name: 'photo.jpg', type: 'image/jpeg', size: 1000 }]), /valid PDF/i);
  assert.match(validatePdfForWatermark([{ name: 'empty.pdf', type: 'application/pdf', size: 0 }]), /empty/i);
  assert.equal(validatePdfForWatermark([{ name: 'report.pdf', type: 'application/pdf', size: 5000 }]), '');
});

test('hexToRgb01 parses hex strings into normalized RGB', () => {
  const red = hexToRgb01('#ef4444');
  assert.ok(red.r > 0.9 && red.r <= 1);
  assert.ok(red.g > 0.2 && red.g < 0.3);
  assert.ok(red.b > 0.2 && red.b < 0.3);

  const black = hexToRgb01('#000000');
  assert.equal(black.r, 0);
  assert.equal(black.g, 0);
  assert.equal(black.b, 0);
});

test('parseWatermarkPageRange parses various range formats', () => {
  const total = 5;
  const allPages = parseWatermarkPageRange('all', total);
  assert.equal(allPages.size, 5);

  const firstPage = parseWatermarkPageRange('first', total);
  assert.equal(firstPage.size, 1);
  assert.ok(firstPage.has(0));

  const customRange = parseWatermarkPageRange('1, 3-4', total);
  assert.equal(customRange.size, 3);
  assert.ok(customRange.has(0)); // Page 1
  assert.ok(customRange.has(2)); // Page 3
  assert.ok(customRange.has(3)); // Page 4
  assert.ok(!customRange.has(1));
  assert.ok(!customRange.has(4));
});

test('watermarkedPdfFilename creates clean output filename', () => {
  assert.equal(watermarkedPdfFilename('agreement.pdf'), 'agreement_watermarked.pdf');
  assert.equal(watermarkedPdfFilename('Draft Report 2026.pdf'), 'Draft_Report_2026_watermarked.pdf');
});

test('applyWatermarkToPdf stamps text onto PDF pages', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([595, 842]);
  doc.addPage([595, 842]);
  const initialBytes = await doc.save();
  const mockFile = makeMockPdfFile(initialBytes);

  // Apply diagonal center watermark
  const blob = await applyWatermarkToPdf(mockFile, {
    text: 'CONFIDENTIAL',
    position: 'center-diagonal',
    rotation: 45,
    opacity: 0.3,
    color: '#ef4444',
    fontSize: 48,
    pageRange: 'all',
  });

  assert.ok(blob.size > initialBytes.length);

  // Verify resulting document is readable by pdf-lib and has 2 pages
  const resultBytes = new Uint8Array(await blob.arrayBuffer());
  const verifiedDoc = await PDFDocument.load(resultBytes);
  assert.equal(verifiedDoc.getPageCount(), 2);
});

test('applyWatermarkToPdf supports tiled repeat and margin placements', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([600, 800]);
  const initialBytes = await doc.save();

  // Tiled watermark
  const tiledBlob = await applyWatermarkToPdf(initialBytes, {
    text: 'DO NOT COPY',
    position: 'tiled',
    opacity: 0.2,
    color: '#64748b',
    fontSize: 24,
  });
  assert.ok(tiledBlob.size > 0);

  // Top margin watermark
  const topBlob = await applyWatermarkToPdf(initialBytes, {
    text: 'TOP SECRET',
    position: 'top',
    opacity: 0.5,
  });
  assert.ok(topBlob.size > 0);
});

test('createTranslatedPdf seamlessly applies watermark when enabled', async () => {
  const pages = [
    { pageNumber: 1, text: 'Hello World', translatedText: 'નમસ્તે દુનિયા', pageWidth: 595, pageHeight: 842 },
  ];

  const blob = await createTranslatedPdf(pages, {
    sourceLang: 'en',
    targetLang: 'gu',
    originalName: 'test.pdf',
    watermark: {
      enabled: true,
      text: 'TRANSLATED COPY',
      position: 'center-diagonal',
      opacity: 0.25,
      color: '#6366f1',
    },
  });

  assert.ok(blob.size > 0);
  const resultBytes = new Uint8Array(await blob.arrayBuffer());
  const doc = await PDFDocument.load(resultBytes);
  assert.equal(doc.getPageCount(), 1);
});

test('validateWatermarkImageFile validates image files properly', () => {
  assert.match(validateWatermarkImageFile(null), /select an image/i);
  assert.match(validateWatermarkImageFile({ name: 'file.txt', type: 'text/plain', size: 100 }), /valid image/i);
  assert.match(validateWatermarkImageFile({ name: 'logo.png', type: 'image/png', size: 0 }), /empty/i);
  assert.equal(validateWatermarkImageFile({ name: 'logo.png', type: 'image/png', size: 5000 }), '');
  assert.equal(validateWatermarkImageFile({ name: 'stamp.jpg', type: 'image/jpeg', size: 12000 }), '');
  assert.equal(validateWatermarkImageFile({ name: 'badge.webp', type: 'image/webp', size: 8000 }), '');
});

test('applyWatermarkToPdf embeds image watermark onto PDF pages', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([600, 800]);
  const initialBytes = await doc.save();

  // Valid 1x1 PNG bytes
  const pngBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );

  const imageBlob = await applyWatermarkToPdf(initialBytes, {
    type: 'image',
    imageBytes: new Uint8Array(pngBytes),
    imageType: 'image/png',
    imageScale: 0.4,
    position: 'center-diagonal',
    rotation: 45,
    opacity: 0.35,
  });

  assert.ok(imageBlob.size > initialBytes.length);
  const resultBytes = new Uint8Array(await imageBlob.arrayBuffer());
  const verifiedDoc = await PDFDocument.load(resultBytes);
  assert.equal(verifiedDoc.getPageCount(), 1);

  // Test tiled image watermark
  const tiledImageBlob = await applyWatermarkToPdf(initialBytes, {
    type: 'image',
    imageBytes: new Uint8Array(pngBytes),
    imageType: 'image/png',
    imageScale: 0.25,
    position: 'tiled',
    opacity: 0.2,
  });

  assert.ok(tiledImageBlob.size > initialBytes.length);
});

