import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectImageFormat,
  validateImageConvertFiles,
  formatOutputFilename,
  IMAGE_CONVERT_FORMATS,
  QUICK_CONVERT_PRESETS,
  packageConvertedImagesZip,
} from '../app/utils/convert-image.js';

test('detectImageFormat correctly detects format from file types and extensions', () => {
  assert.equal(detectImageFormat({ type: 'image/jpeg', name: 'photo.jpg' }), 'jpg');
  assert.equal(detectImageFormat({ type: 'image/png', name: 'logo.png' }), 'png');
  assert.equal(detectImageFormat({ type: 'image/webp', name: 'banner.webp' }), 'webp');
  assert.equal(detectImageFormat({ type: 'image/gif', name: 'anim.gif' }), 'gif');
  assert.equal(detectImageFormat({ type: 'image/bmp', name: 'graphic.bmp' }), 'bmp');
  assert.equal(detectImageFormat({ type: 'image/x-icon', name: 'favicon.ico' }), 'ico');
  assert.equal(detectImageFormat({ type: 'image/svg+xml', name: 'vector.svg' }), 'svg');
  assert.equal(detectImageFormat({ type: 'image/avif', name: 'next.avif' }), 'avif');
  assert.equal(detectImageFormat({ type: 'application/octet-stream', name: 'test.WEBP' }), 'webp');
  assert.equal(detectImageFormat({ type: 'application/pdf', name: 'doc.pdf' }), 'unknown');
  assert.equal(detectImageFormat(null), 'unknown');
});

test('validateImageConvertFiles validates file list count, size and types', () => {
  assert.equal(validateImageConvertFiles([]), 'Please select at least one image to convert.');
  assert.equal(validateImageConvertFiles(null), 'Please select at least one image to convert.');

  // Empty file
  const emptyFile = { name: 'empty.png', size: 0, type: 'image/png' };
  assert.ok(validateImageConvertFiles([emptyFile]).includes('empty file'));

  // Oversized file (> 50 MB)
  const hugeFile = { name: 'huge.jpg', size: 55 * 1024 * 1024, type: 'image/jpeg' };
  assert.ok(validateImageConvertFiles([hugeFile]).includes('exceeds the 50 MB limit'));

  // Unsupported format
  const textFile = { name: 'notes.txt', size: 1024, type: 'text/plain' };
  assert.ok(validateImageConvertFiles([textFile]).includes('not a supported image format'));

  // Valid files
  const validJpg = { name: 'photo.jpg', size: 50000, type: 'image/jpeg' };
  const validPng = { name: 'icon.png', size: 20000, type: 'image/png' };
  assert.equal(validateImageConvertFiles([validJpg, validPng]), '');
});

test('formatOutputFilename converts extensions safely', () => {
  assert.equal(formatOutputFilename('my-photo.jpg', 'webp'), 'my-photo.webp');
  assert.equal(formatOutputFilename('logo.png', 'jpg'), 'logo.jpg');
  assert.equal(formatOutputFilename('graphic.WEBP', 'png'), 'graphic.png');
  assert.equal(formatOutputFilename('icon', 'ico'), 'icon.ico');
  assert.equal(formatOutputFilename('dots.in.name.jpg', 'avif'), 'dots.in.name.avif');
});

test('IMAGE_CONVERT_FORMATS defines full format set with required metadata', () => {
  const formats = ['webp', 'png', 'jpg', 'gif', 'bmp', 'ico', 'avif'];
  for (const fmt of formats) {
    const config = IMAGE_CONVERT_FORMATS[fmt];
    assert.ok(config, `Missing format config for ${fmt}`);
    assert.ok(config.label && config.extension && config.mimeType);
    assert.equal(typeof config.supportsAlpha, 'boolean');
    assert.equal(typeof config.supportsQuality, 'boolean');
  }

  // Alpha assertions
  assert.equal(IMAGE_CONVERT_FORMATS.png.supportsAlpha, true);
  assert.equal(IMAGE_CONVERT_FORMATS.webp.supportsAlpha, true);
  assert.equal(IMAGE_CONVERT_FORMATS.jpg.supportsAlpha, false);
  assert.equal(IMAGE_CONVERT_FORMATS.bmp.supportsAlpha, false);
});

test('QUICK_CONVERT_PRESETS contains popular conversion pairs', () => {
  assert.ok(QUICK_CONVERT_PRESETS.length >= 5);
  const ids = QUICK_CONVERT_PRESETS.map(p => p.id);
  assert.ok(ids.includes('jpg-to-webp'));
  assert.ok(ids.includes('png-to-webp'));
  assert.ok(ids.includes('webp-to-png'));
  assert.ok(ids.includes('jpg-to-png'));
  assert.ok(ids.includes('png-to-jpg'));
});

test('packageConvertedImagesZip packages multiple files into a valid ZIP blob', async () => {
  // Mock mock blobs in node test environment
  const mockBlob1 = new Blob(['sample-image-data-1'], { type: 'image/webp' });
  const mockBlob2 = new Blob(['sample-image-data-2'], { type: 'image/png' });

  // Polyfill URL.createObjectURL in node if needed
  if (!globalThis.URL.createObjectURL) {
    globalThis.URL.createObjectURL = () => 'blob:mock-zip-url';
  }

  const results = [
    { filename: 'photo-1.webp', blob: mockBlob1 },
    { filename: 'photo-2.png', blob: mockBlob2 },
  ];

  const zipResult = await packageConvertedImagesZip(results, 'my-converted-images.zip');
  assert.ok(zipResult);
  assert.equal(zipResult.filename, 'my-converted-images.zip');
  assert.equal(zipResult.fileCount, 2);
  assert.ok(zipResult.size > 0);
  assert.ok(zipResult.blob);
});

