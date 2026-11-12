import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DPI,
  mmToPixels,
  inchesToPixels,
  pixelsToMm,
  pixelsToInches,
  PASSPORT_PRESETS,
  PASSPORT_BG_PRESETS,
  PRINT_SHEET_SIZES,
  validatePassportPhotoFile,
  formatPassportOutputFilename,
  calculateSheetGrid,
  buildFilterCss,
  expandForegroundMask,
} from '../app/utils/passport-photo.js';

test('validatePassportPhotoFile validates image files correctly', () => {
  assert.equal(validatePassportPhotoFile(null), 'Please select an image file to make a passport photo.');
  assert.equal(validatePassportPhotoFile({ size: 0 }), 'The selected file is empty (0 bytes).');

  const oversized = { name: 'huge.jpg', size: 55 * 1024 * 1024, type: 'image/jpeg' };
  assert.ok(validatePassportPhotoFile(oversized).includes('50 MB limit'));

  const textFile = { name: 'document.txt', size: 1000, type: 'text/plain' };
  assert.ok(validatePassportPhotoFile(textFile).includes('Unsupported file format'));

  const validJpg = { name: 'portrait.jpg', size: 1024 * 500, type: 'image/jpeg' };
  assert.equal(validatePassportPhotoFile(validJpg), '');

  const validPng = { name: 'avatar.png', size: 1024 * 300, type: 'image/png' };
  assert.equal(validatePassportPhotoFile(validPng), '');
});

test('dimension conversions compute accurate pixels at 300 DPI', () => {
  // 1 inch = 25.4 mm = 300 px @ 300 DPI
  assert.equal(inchesToPixels(1, 300), 300);
  assert.equal(inchesToPixels(2, 300), 600);
  assert.equal(mmToPixels(25.4, 300), 300);
  assert.equal(mmToPixels(50.8, 300), 600);
  assert.equal(mmToPixels(35, 300), 413);
  assert.equal(mmToPixels(45, 300), 531);

  assert.equal(pixelsToInches(600, 300), 2);
  assert.equal(pixelsToMm(300, 300), 25.4);
});

test('PASSPORT_PRESETS includes critical national passport dimensions', () => {
  const us = PASSPORT_PRESETS.find(p => p.id === 'us_passport');
  assert.ok(us, 'US Passport preset must exist');
  assert.equal(us.widthPx, 600);
  assert.equal(us.heightPx, 600);

  const india = PASSPORT_PRESETS.find(p => p.id === 'in_passport');
  assert.ok(india, 'India Passport preset must exist');
  assert.equal(india.widthMm, 35);
  assert.equal(india.heightMm, 45);

  const uk = PASSPORT_PRESETS.find(p => p.id === 'uk_passport');
  assert.ok(uk, 'UK Passport preset must exist');

  const schengen = PASSPORT_PRESETS.find(p => p.id === 'schengen_visa');
  assert.ok(schengen, 'Schengen Visa preset must exist');
});

test('formatPassportOutputFilename produces clean filenames for single and sheet exports', () => {
  assert.equal(formatPassportOutputFilename('profile.jpg', 'us_passport', 'jpg', false), 'profile-us_passport.jpg');
  assert.equal(formatPassportOutputFilename('My Portrait Photo.png', 'in_passport', 'png', false), 'my-portrait-photo-in_passport.png');
  assert.equal(formatPassportOutputFilename('selfie.webp', 'us_passport', 'jpg', true), 'selfie-passport-print-sheet.jpg');
});

test('calculateSheetGrid tiles photos cleanly on 4x6 photo sheet', () => {
  // 4x6 sheet @ 300 DPI is 1200x1800
  // 35x45mm photos are 413x531 px
  const result = calculateSheetGrid({
    sheetWidthPx: 1200,
    sheetHeightPx: 1800,
    photoWidthPx: 413,
    photoHeightPx: 531,
    marginPx: 20,
    spacingPx: 16,
  });

  assert.ok(result.totalPhotos >= 6, '4x6 sheet should tile at least 6 35x45mm photos');
  assert.ok(result.positions.length === result.totalPhotos);
  assert.ok(result.positions[0].x >= 0);
  assert.ok(result.positions[0].y >= 0);
});

test('buildFilterCss correctly builds CSS filter strings', () => {
  assert.equal(buildFilterCss({ brightness: 0, contrast: 0, saturation: 0, exposure: 0 }), 'brightness(1.000) contrast(1.000) saturate(1.000)');
  assert.equal(buildFilterCss({ brightness: 10, contrast: 5, saturation: -10, exposure: 0 }), 'brightness(1.100) contrast(1.050) saturate(0.900)');
});

test('expandForegroundMask handles null and empty inputs safely', () => {
  assert.equal(expandForegroundMask(null, null, 2), null);
});
