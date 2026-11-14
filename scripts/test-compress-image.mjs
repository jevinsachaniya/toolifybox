import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IMAGE_COMPRESSION_PRESETS,
  compressedImageFilename,
  validateCompressImage,
} from '../app/utils/compress-image.js';

test('compressedImageFilename preserves input file extensions accurately', () => {
  // JPG preservation
  assert.equal(compressedImageFilename('photo.jpg', 'image/jpeg'), 'photo-compressed.jpg');
  assert.equal(compressedImageFilename('photo.jpeg', 'image/jpeg'), 'photo-compressed.jpeg');
  assert.equal(compressedImageFilename('CAMERA_01.JPG', 'image/jpeg'), 'CAMERA_01-compressed.jpg');
  assert.equal(compressedImageFilename('snapshot.JPEG', 'image/jpeg'), 'snapshot-compressed.jpeg');

  // PNG preservation
  assert.equal(compressedImageFilename('logo.png', 'image/png'), 'logo-compressed.png');
  assert.equal(compressedImageFilename('icon.PNG', 'image/png'), 'icon-compressed.png');

  // WebP preservation
  assert.equal(compressedImageFilename('banner.webp', 'image/webp'), 'banner-compressed.webp');
  assert.equal(compressedImageFilename('header.WEBP', 'image/webp'), 'header-compressed.webp');

  // Dots in filename
  assert.equal(compressedImageFilename('my.vacation.photo.jpg', 'image/jpeg'), 'my.vacation.photo-compressed.jpg');
});

test('IMAGE_COMPRESSION_PRESETS do not hardcode WebP and preserve original formats', () => {
  // None of the presets should force WebP
  assert.equal(IMAGE_COMPRESSION_PRESETS.high.mimeType, undefined);
  assert.equal(IMAGE_COMPRESSION_PRESETS.balanced.mimeType, undefined);
  assert.equal(IMAGE_COMPRESSION_PRESETS.smallest.mimeType, undefined);
  assert.equal(IMAGE_COMPRESSION_PRESETS.target.mimeType, undefined);

  // High quality preset
  assert.equal(IMAGE_COMPRESSION_PRESETS.high.scale, 1);
  assert.equal(IMAGE_COMPRESSION_PRESETS.high.quality, 0.94);

  // Balanced preset
  assert.equal(IMAGE_COMPRESSION_PRESETS.balanced.scale, 1);
  assert.equal(IMAGE_COMPRESSION_PRESETS.balanced.quality, 0.82);

  // Smallest file preset
  assert.equal(IMAGE_COMPRESSION_PRESETS.smallest.scale, 0.82);
  assert.equal(IMAGE_COMPRESSION_PRESETS.smallest.quality, 0.62);

  // Target preset exists
  assert.ok(IMAGE_COMPRESSION_PRESETS.target);
  assert.equal(IMAGE_COMPRESSION_PRESETS.target.id, 'target');
});

test('validateCompressImage validates file selection and constraints', () => {
  // Empty or invalid inputs
  assert.equal(validateCompressImage([]), 'Choose one JPG, PNG or WebP image.');
  assert.equal(validateCompressImage(null), 'Choose one JPG, PNG or WebP image.');
  assert.equal(validateCompressImage([{}, {}]), 'Choose one JPG, PNG or WebP image.');

  // Unsupported formats
  assert.equal(
    validateCompressImage([{ name: 'doc.pdf', type: 'application/pdf', size: 1000 }]),
    'This format is not supported. Choose a JPG, PNG or WebP image.'
  );

  // Empty file
  assert.equal(
    validateCompressImage([{ name: 'empty.jpg', type: 'image/jpeg', size: 0 }]),
    'This image is empty. Choose another file.'
  );

  // Oversized file (> 20 MB)
  assert.equal(
    validateCompressImage([{ name: 'huge.jpg', type: 'image/jpeg', size: 25 * 1024 * 1024 }]),
    'Choose an image smaller than 20 MB.'
  );

  // Valid files
  assert.equal(validateCompressImage([{ name: 'valid.jpg', type: 'image/jpeg', size: 500000 }]), '');
  assert.equal(validateCompressImage([{ name: 'valid.png', type: 'image/png', size: 500000 }]), '');
  assert.equal(validateCompressImage([{ name: 'valid.webp', type: 'image/webp', size: 500000 }]), '');
});
