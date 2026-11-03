import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateBlurFaceFile,
  formatBlurOutputFilename,
  picoUnpackCascade,
  picoRunCascade,
  picoClusterDetections,
  BLUR_MODES,
  BLUR_SHAPES,
  DEFAULT_BLUR_OPTIONS,
} from '../app/utils/blur-face.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('validateBlurFaceFile validates image file types, size and existence', () => {
  assert.equal(validateBlurFaceFile(null), 'Please select an image file to blur.');
  assert.equal(validateBlurFaceFile({ size: 0 }), 'The selected file is empty (0 bytes).');

  const oversized = { name: 'huge.jpg', size: 55 * 1024 * 1024, type: 'image/jpeg' };
  assert.ok(validateBlurFaceFile(oversized).includes('50 MB limit'));

  const textFile = { name: 'document.pdf', size: 1000, type: 'application/pdf' };
  assert.ok(validateBlurFaceFile(textFile).includes('Unsupported file format'));

  const validJpg = { name: 'portrait.jpg', size: 1024 * 500, type: 'image/jpeg' };
  assert.equal(validateBlurFaceFile(validJpg), '');

  const validPng = { name: 'avatar.png', size: 1024 * 300, type: 'image/png' };
  assert.equal(validateBlurFaceFile(validPng), '');

  const validWebp = { name: 'family.webp', size: 1024 * 200, type: 'image/webp' };
  assert.equal(validateBlurFaceFile(validWebp), '');
});

test('formatBlurOutputFilename produces clean filenames', () => {
  assert.equal(formatBlurOutputFilename('profile.jpg', 'jpg'), 'profile-face-blurred.jpg');
  assert.equal(formatBlurOutputFilename('team_photo.png', 'png'), 'team_photo-face-blurred.png');
  assert.equal(formatBlurOutputFilename('vacation', 'webp'), 'vacation-face-blurred.webp');
});

test('BLUR_MODES and BLUR_SHAPES contain required configurations', () => {
  assert.ok(BLUR_MODES.some(m => m.id === 'gaussian'));
  assert.ok(BLUR_MODES.some(m => m.id === 'pixelate'));
  assert.ok(BLUR_MODES.some(m => m.id === 'censor-bar'));
  assert.ok(BLUR_MODES.some(m => m.id === 'frosted'));

  assert.ok(BLUR_SHAPES.some(s => s.id === 'ellipse'));
  assert.ok(BLUR_SHAPES.some(s => s.id === 'rect'));
  assert.equal(typeof DEFAULT_BLUR_OPTIONS.strength, 'number');
});

test('pico cascade classifier unpacks and runs successfully from facefinder model', () => {
  const modelPath = path.resolve(__dirname, '../public/models/facefinder');
  assert.ok(fs.existsSync(modelPath), 'facefinder model binary must exist in public/models/');

  const buffer = fs.readFileSync(modelPath);
  const bytes = new Int8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  const classifyRegion = picoUnpackCascade(bytes);
  assert.equal(typeof classifyRegion, 'function', 'Unpacked cascade must return a classifyRegion function');

  // Test on synthetic grayscale image
  const w = 120;
  const h = 120;
  const pixels = new Uint8Array(w * h).fill(128);

  const picoImage = {
    pixels,
    nrows: h,
    ncols: w,
    ldim: w,
  };

  const params = {
    shiftfactor: 0.1,
    minsize: 30,
    maxsize: 100,
    scalefactor: 1.2,
  };

  const detections = picoRunCascade(picoImage, classifyRegion, params);
  assert.ok(Array.isArray(detections));

  const clustered = picoClusterDetections(detections, 0.2);
  assert.ok(Array.isArray(clustered));
});

