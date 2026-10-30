import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bilateralSmoothRgba,
  cleanSvgMarkup,
  convertImageToSvg,
  countSvgPaths,
  generateHighFidelityPalette,
  IMAGE_TO_SVG_PRESETS,
  imageToSvgFilename,
  smoothImageDataRgba,
  validateImageToSvgFile,
} from '../app/utils/image-to-svg.js';

test('validateImageToSvgFile accepts valid images and rejects invalid/oversized', () => {
  assert.equal(validateImageToSvgFile(null), 'Please select an image file to convert to SVG.');
  assert.equal(validateImageToSvgFile({ size: 0, name: 'empty.png' }), 'The selected file is empty (0 bytes). Please choose a valid image.');
  
  const sizeError = validateImageToSvgFile({ size: 30 * 1024 * 1024, name: 'huge.jpg' });
  assert.ok(sizeError.includes('which exceeds the 25 MB maximum limit.'));

  assert.equal(validateImageToSvgFile({ size: 500, name: 'doc.pdf', type: 'application/pdf' }), 'Unsupported file format. Please upload a PNG, JPG, WebP, GIF, BMP, or AVIF image.');

  // Valid files
  assert.equal(validateImageToSvgFile({ size: 1024, name: 'logo.png', type: 'image/png' }), null);
  assert.equal(validateImageToSvgFile({ size: 2048, name: 'photo.jpg', type: 'image/jpeg' }), null);
  assert.equal(validateImageToSvgFile({ size: 512, name: 'graphic.webp', type: 'image/webp' }), null);
  assert.equal(validateImageToSvgFile({ size: 1024, name: 'icon.bmp', type: 'image/bmp' }), null);
});

test('imageToSvgFilename produces clean, safe .svg filenames', () => {
  assert.equal(imageToSvgFilename('my-logo.png'), 'my-logo.svg');
  assert.equal(imageToSvgFilename('Product Picture 2026!.jpeg'), 'Product-Picture-2026.svg');
  assert.equal(imageToSvgFilename('banner.webp', '4k'), 'banner-4k.svg');
  assert.equal(imageToSvgFilename(''), 'image.svg');
});

test('IMAGE_TO_SVG_PRESETS defines required 4K and logo presets with options', () => {
  assert.ok(IMAGE_TO_SVG_PRESETS.length >= 4, 'Should provide at least 4 presets');
  const ids = IMAGE_TO_SVG_PRESETS.map(p => p.id);
  assert.ok(ids.includes('ultra-4k'), 'Must contain ultra-4k preset');
  assert.ok(ids.includes('logo'), 'Must contain logo preset');
  assert.ok(ids.includes('silhouette'), 'Must contain silhouette preset');

  const ultra = IMAGE_TO_SVG_PRESETS.find(p => p.id === 'ultra-4k');
  assert.ok(ultra.options.numberofcolors >= 32, 'Ultra 4K should use high color count');
  assert.ok(ultra.options.roundcoords >= 2, 'Ultra 4K should use precision coordinate rounding');
});

test('countSvgPaths accurately counts vector paths', () => {
  assert.equal(countSvgPaths(''), 0);
  assert.equal(countSvgPaths('<svg><circle cx="5" cy="5" r="2"/></svg>'), 0);
  assert.equal(countSvgPaths('<svg><path d="M0 0 L10 10"/><path d="M5 5 L15 15"/></svg>'), 2);
});

test('cleanSvgMarkup formats viewBox and removes unwanted generator metadata', () => {
  const raw = '<svg version="1.1" desc="Created with imagetracer.js version 1.2.6" ><path fill="rgb(0,0,0)" stroke="rgb(0,0,0)" stroke-width="1" opacity="0" d="M 0 0" /><path fill="rgb(255,0,0)" stroke="rgb(255,0,0)" stroke-width="1" opacity="1" d="M 1 1 L 2 2 Z" /></svg>';
  const cleaned = cleanSvgMarkup(raw, { width: 100, height: 100, mergeSeams: true, polishedEffect: true });

  assert.ok(!cleaned.includes('desc="Created with imagetracer.js'), 'Must strip desc attribute');
  assert.ok(!cleaned.includes('opacity="0"'), 'Must strip opacity="0" invisible paths');
  assert.ok(cleaned.includes('viewBox="0 0 100 100"'), 'Must add responsive viewBox attribute');
  assert.ok(cleaned.includes('xmlns="http://www.w3.org/2000/svg"'), 'Must add XML namespace');
  assert.ok(cleaned.includes('shape-rendering="geometricPrecision"'), 'Must set geometric precision');
  assert.ok(cleaned.includes('stroke-linejoin="round"'), 'Must add round stroke join for seamless path merging');
  assert.ok(cleaned.includes('filter id="tb-smooth"'), 'Must include polish smooth filter when enabled');
});

test('convertImageToSvg produces valid 4K vector SVG from ImageData', async () => {
  const width = 8;
  const height = 8;
  const data = new Uint8ClampedArray(width * height * 4).fill(255);

  // Draw a red square in the center
  for (let y = 2; y < 6; y++) {
    for (let x = 2; x < 6; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 0;
      data[idx + 2] = 0;
      data[idx + 3] = 255;
    }
  }

  const result = await convertImageToSvg({ width, height, data }, {
    presetId: 'ultra-4k',
    customColors: 4,
  });

  assert.ok(result.svgString.startsWith('<svg'), 'Output must start with <svg');
  assert.ok(result.svgString.endsWith('</svg>'), 'Output must end with </svg>');
  assert.ok(result.pathCount >= 1, 'Must contain at least 1 path');
  assert.equal(result.width, 8);
  assert.equal(result.height, 8);
  assert.ok(result.size > 0);
  assert.ok(result.filename.endsWith('.svg'));
  assert.equal(result.scaleQuality, '4K Ultra Vector (Infinite Scalability)');
});

test('convertImageToSvg supports B&W silhouette preset and cancellation', async () => {
  const width = 4;
  const height = 4;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = 255; // opaque black
  }

  const result = await convertImageToSvg({ width, height, data }, {
    presetId: 'silhouette',
  });

  assert.ok(result.svgString.includes('<path'), 'Silhouette should output vector path');

  // Test cancellation
  const controller = new AbortController();
  controller.abort();

  await assert.rejects(
    async () => {
      await convertImageToSvg({ width, height, data }, { signal: controller.signal });
    },
    { name: 'AbortError' }
  );
});

test('smoothImageDataRgba diffuses noise in sRGB while preserving pure color fidelity and alpha without blue shift', () => {
  const width = 4;
  const height = 4;
  const data = new Uint8ClampedArray(width * height * 4);

  // Pure vibrant red image
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 240;     // Red
    data[i + 1] = 20;  // Green
    data[i + 2] = 20;  // Blue
    data[i + 3] = 255; // Alpha
  }

  const smoothed = smoothImageDataRgba({ width, height, data }, 1);
  assert.equal(smoothed.data.length, data.length);

  // Verify every pixel remains vibrant red with zero blue shift
  for (let i = 0; i < smoothed.data.length; i += 4) {
    assert.equal(smoothed.data[i], 240, 'Red channel must be preserved');
    assert.equal(smoothed.data[i + 1], 20, 'Green channel must be preserved');
    assert.equal(smoothed.data[i + 2], 20, 'Blue channel must remain untouched (no blue tint)');
    assert.equal(smoothed.data[i + 3], 255, 'Alpha must be 255');
  }
});

test('generateHighFidelityPalette captures accent colors (red, yellow, black, white) without collapse', () => {
  const width = 10;
  const height = 10;
  const data = new Uint8ClampedArray(width * height * 4); // all 0 (transparent)

  // Yellow body
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 250;
    data[i + 1] = 210;
    data[i + 2] = 30;
    data[i + 3] = 255;
  }
  // Red cheek (small spot)
  data[0] = 235; data[1] = 40; data[2] = 40; data[3] = 255;
  // Black eye
  data[4] = 20; data[5] = 20; data[6] = 20; data[7] = 255;
  // White highlight
  data[8] = 255; data[9] = 255; data[10] = 255; data[11] = 255;

  const pal = generateHighFidelityPalette({ width, height, data }, 16);
  assert.ok(pal && pal.length >= 4, 'Palette should include multiple distinct colors');
  assert.ok(pal.some(c => c.r > 200 && c.g < 80 && c.b < 80), 'Must preserve red cheek');
  assert.ok(pal.some(c => c.r < 50 && c.g < 50 && c.b < 50), 'Must preserve black eye');
  assert.ok(pal.some(c => c.r > 240 && c.g > 240 && c.b > 240), 'Must preserve white specular reflection');
  assert.ok(pal.some(c => c.r > 200 && c.g > 180 && c.b < 50), 'Must preserve yellow body');
});

test('cleanSvgMarkup combines consecutive color paths into compound paths keeping lines compact (< 1500 lines)', () => {
  const raw = `<svg width="100" height="100">
    <path fill="rgb(10,50,150)" stroke="rgb(10,50,150)" stroke-width="0.6" opacity="1" d="M 0 0 L 10 10 Z " />
    <path fill="rgb(10,50,150)" stroke="rgb(10,50,150)" stroke-width="0.6" opacity="1" d="M 20 20 L 30 30 Z " />
    <path fill="rgb(200,30,30)" stroke="rgb(200,30,30)" stroke-width="0.6" opacity="1" d="M 40 40 L 50 50 Z " />
    <path fill="rgb(200,30,30)" stroke="rgb(200,30,30)" stroke-width="0.6" opacity="1" d="M 60 60 L 70 70 Z " />
  </svg>`;

  const cleaned = cleanSvgMarkup(raw, { width: 100, height: 100 });
  const lines = cleaned.split('\n');

  // Should be condensed into compound paths (1 per color group)
  assert.ok(lines.length < 10, 'Must combine paths into compact lines');
  assert.equal(countSvgPaths(cleaned), 2, 'Should combine 4 separate paths into 2 compound color paths');
  assert.ok(cleaned.includes('M 0 0 L 10 10 Z M 20 20 L 30 30 Z'), 'Compound path must contain both subpaths');
});
