import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCollageLayout,
  calculateNormalizedCrop,
  collageOutputFilename,
  getAspectCropPreset,
  validateCollageImages,
  COLLAGE_LAYOUTS,
  ASPECT_RATIOS,
} from '../app/utils/image-collage.js';

test('validateCollageImages accepts valid images and rejects invalid/oversized', () => {
  const validFiles = [
    { name: 'photo1.jpg', type: 'image/jpeg', size: 1024 * 1024 },
    { name: 'photo2.png', type: 'image/png', size: 2 * 1024 * 1024 },
    { name: 'photo3.webp', type: 'image/webp', size: 500 * 1024 },
  ];

  const res = validateCollageImages(validFiles);
  assert.equal(res.valid, true);
  assert.equal(res.files.length, 3);

  // Rejects empty list
  assert.equal(validateCollageImages([]).valid, false);

  // Rejects invalid file format (e.g. PDF or text)
  const invalidType = [{ name: 'doc.pdf', type: 'application/pdf', size: 1024 }];
  assert.equal(validateCollageImages(invalidType).valid, false);

  // Rejects oversized file (> 25 MB)
  const oversized = [{ name: 'large.jpg', type: 'image/jpeg', size: 30 * 1024 * 1024 }];
  assert.equal(validateCollageImages(oversized).valid, false);

  // Rejects 0-byte file
  const zeroByte = [{ name: 'empty.png', type: 'image/png', size: 0 }];
  assert.equal(validateCollageImages(zeroByte).valid, false);

  // Rejects exceeding maximum count of 12 images
  const tooMany = Array.from({ length: 13 }, (_, i) => ({ name: `img${i}.jpg`, type: 'image/jpeg', size: 1024 }));
  assert.equal(validateCollageImages(tooMany).valid, false);
});

test('calculateCollageLayout: Side-by-Side (Left / Right positioning)', () => {
  const width = 1000;
  const height = 800;
  const padding = 20;
  const gap = 10;

  // 2 images: Left / Right
  const rects = calculateCollageLayout('side-by-side', 2, width, height, { padding, gap, splitRatio: 0.5 });
  assert.equal(rects.length, 2);

  const left = rects[0];
  const right = rects[1];

  // Left cell starts at padding
  assert.equal(left.x, padding);
  assert.equal(left.y, padding);
  assert.equal(left.height, height - 2 * padding);

  // Right cell starts after left cell + gap
  assert.equal(right.x, left.x + left.width + gap);
  assert.equal(right.y, padding);
  assert.equal(right.height, height - 2 * padding);

  // Total width matches canvas minus 2*padding
  assert.equal(left.width + right.width + gap, width - 2 * padding);
});

test('calculateCollageLayout: Stacked (Top / Bottom positioning)', () => {
  const width = 1000;
  const height = 800;
  const padding = 20;
  const gap = 10;

  // 2 images: Top / Bottom
  const rects = calculateCollageLayout('stacked', 2, width, height, { padding, gap, splitRatio: 0.5 });
  assert.equal(rects.length, 2);

  const top = rects[0];
  const bottom = rects[1];

  // Top cell starts at padding
  assert.equal(top.x, padding);
  assert.equal(top.y, padding);
  assert.equal(top.width, width - 2 * padding);

  // Bottom cell starts below top cell + gap
  assert.equal(bottom.x, padding);
  assert.equal(bottom.y, top.y + top.height + gap);
  assert.equal(bottom.width, width - 2 * padding);

  // Total height matches canvas minus 2*padding
  assert.equal(top.height + bottom.height + gap, height - 2 * padding);
});

test('calculateCollageLayout: Main Left + Stack Right', () => {
  const width = 1200;
  const height = 800;
  const padding = 16;
  const gap = 12;

  // 3 images: 1 large on left, 2 stacked on right
  const rects = calculateCollageLayout('main-left', 3, width, height, { padding, gap });
  assert.equal(rects.length, 3);

  const hero = rects[0];
  const rightTop = rects[1];
  const rightBottom = rects[2];

  // Hero occupies full available height on left
  assert.equal(hero.x, padding);
  assert.equal(hero.height, height - 2 * padding);

  // Right items are stacked vertically
  assert.equal(rightTop.x, hero.x + hero.width + gap);
  assert.equal(rightBottom.x, rightTop.x);
  assert.equal(rightBottom.y, rightTop.y + rightTop.height + gap);
});

test('calculateCollageLayout: 2x2 Grid', () => {
  const width = 1000;
  const height = 1000;
  const padding = 20;
  const gap = 10;

  const rects = calculateCollageLayout('grid-2x2', 4, width, height, { padding, gap });
  assert.equal(rects.length, 4);

  // 4 quadrants
  const [topLeft, topRight, bottomLeft, bottomRight] = rects;

  assert.equal(topLeft.x, padding);
  assert.equal(topLeft.y, padding);

  assert.equal(topRight.x, topLeft.x + topLeft.width + gap);
  assert.equal(topRight.y, padding);

  assert.equal(bottomLeft.x, padding);
  assert.equal(bottomLeft.y, topLeft.y + topLeft.height + gap);

  assert.equal(bottomRight.x, topRight.x);
  assert.equal(bottomRight.y, bottomLeft.y);
});

test('collageOutputFilename produces clean names with chosen format', () => {
  const jpgName = collageOutputFilename('jpg');
  assert.match(jpgName, /^toolifybox_collage_\d{8}_\d{4}\.jpg$/);

  const pngName = collageOutputFilename('png');
  assert.match(pngName, /^toolifybox_collage_\d{8}_\d{4}\.png$/);
});

test('calculateNormalizedCrop computes bounded 0..1 fractions', () => {
  const crop = calculateNormalizedCrop(100, 200, 800, 600, 1000, 1000);
  assert.equal(crop.x, 0.1);
  assert.equal(crop.y, 0.2);
  assert.equal(crop.width, 0.8);
  assert.equal(crop.height, 0.6);

  // Clamps out of bound coordinates
  const clamped = calculateNormalizedCrop(-50, 1200, 2000, 2000, 1000, 1000);
  assert.equal(clamped.x, 0);
  assert.equal(clamped.y, 1);
  assert.equal(clamped.width, 1);
});

test('getAspectCropPreset centers crop for wider or taller images', () => {
  // Landscape image (1600x900) cropped to 1:1 Square
  const squareCrop = getAspectCropPreset(1600, 900, 1);
  assert.equal(squareCrop.height, 1); // Full height preserved
  assert.ok(squareCrop.width < 1); // Sides cropped
  assert.ok(squareCrop.x > 0); // Centered horizontally
  assert.equal(squareCrop.y, 0);

  // Portrait image (900x1600) cropped to 16:9 Landscape
  const landscapeCrop = getAspectCropPreset(900, 1600, 16 / 9);
  assert.equal(landscapeCrop.width, 1); // Full width preserved
  assert.ok(landscapeCrop.height < 1); // Top and bottom cropped
  assert.ok(landscapeCrop.y > 0); // Centered vertically
  assert.equal(landscapeCrop.x, 0);
});


