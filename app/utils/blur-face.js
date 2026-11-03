/**
 * Blur Face Utilities for Client-Side Face Detection and Privacy Censorship.
 * 100% In-Browser processing via Native FaceDetector API and local Pico cascade.
 */

export const BLUR_MODES = [
  { id: 'gaussian', label: 'Gaussian Blur', desc: 'Smooth, natural privacy blur' },
  { id: 'pixelate', label: 'Pixelate / Mosaic', desc: 'Classic digital censor pixels' },
  { id: 'censor-bar', label: 'Black Box', desc: 'Solid black redaction box' },
  { id: 'frosted', label: 'Frosted Glass', desc: 'Soft semi-transparent frosted blur' },
];

export const BLUR_SHAPES = [
  { id: 'ellipse', label: 'Oval / Face Shape' },
  { id: 'rect', label: 'Rectangle / Box' },
];

export const DEFAULT_BLUR_OPTIONS = {
  mode: 'gaussian',
  shape: 'ellipse',
  strength: 25,     // Gaussian blur radius in px (5 - 60)
  pixelSize: 14,    // Pixelate block size in px (4 - 40)
  feather: 15,      // Edge feathering softness (0 - 40)
  padding: 15,      // Bounding box padding percent (0 - 40)
  minScore: 4.0,    // Detection confidence threshold
  showOutlines: true, // Show edit box outlines in editor
};

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/gif',
  'image/avif',
];

/**
 * Validates the uploaded image file.
 */
export function validateBlurFaceFile(file) {
  if (!file) return 'Please select an image file to blur.';
  if (file.size === 0) return 'The selected file is empty (0 bytes).';
  if (file.size > 50 * 1024 * 1024) return 'Image size exceeds the 50 MB limit.';

  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.avif'];
  const hasValidExt = validExts.some(ext => name.endsWith(ext));

  if (!SUPPORTED_IMAGE_TYPES.includes(type) && !hasValidExt) {
    return 'Unsupported file format. Please upload a JPG, PNG, WebP, BMP, or GIF photo.';
  }

  return '';
}

/**
 * Pico Cascade Unpacker (Nenad Markuš, MIT License).
 * Unpacks the binary cascade parameters into an executable classifier function.
 */
export function picoUnpackCascade(bytes) {
  const dview = new DataView(new ArrayBuffer(4));
  let p = 8; // skip first 8 bytes

  dview.setUint8(0, bytes[p + 0]);
  dview.setUint8(1, bytes[p + 1]);
  dview.setUint8(2, bytes[p + 2]);
  dview.setUint8(3, bytes[p + 3]);
  const tdepth = dview.getInt32(0, true);
  p += 4;

  dview.setUint8(0, bytes[p + 0]);
  dview.setUint8(1, bytes[p + 1]);
  dview.setUint8(2, bytes[p + 2]);
  dview.setUint8(3, bytes[p + 3]);
  const ntrees = dview.getInt32(0, true);
  p += 4;

  const tcodesLs = [];
  const tpredsLs = [];
  const threshLs = [];
  const numNodesPerTree = Math.pow(2, tdepth);

  for (let t = 0; t < ntrees; ++t) {
    tcodesLs.push(0, 0, 0, 0);
    for (let k = p; k < p + 4 * numNodesPerTree - 4; k++) {
      tcodesLs.push(bytes[k]);
    }
    p += 4 * numNodesPerTree - 4;

    for (let i = 0; i < numNodesPerTree; ++i) {
      dview.setUint8(0, bytes[p + 0]);
      dview.setUint8(1, bytes[p + 1]);
      dview.setUint8(2, bytes[p + 2]);
      dview.setUint8(3, bytes[p + 3]);
      tpredsLs.push(dview.getFloat32(0, true));
      p += 4;
    }

    dview.setUint8(0, bytes[p + 0]);
    dview.setUint8(1, bytes[p + 1]);
    dview.setUint8(2, bytes[p + 2]);
    dview.setUint8(3, bytes[p + 3]);
    threshLs.push(dview.getFloat32(0, true));
    p += 4;
  }

  const tcodes = new Int8Array(tcodesLs);
  const tpreds = new Float32Array(tpredsLs);
  const thresh = new Float32Array(threshLs);

  return function classifyRegion(r, c, s, pixels, ldim) {
    r = 256 * r;
    c = 256 * c;
    let root = 0;
    let o = 0.0;
    const pow2tdepth = Math.pow(2, tdepth) >> 0;

    for (let i = 0; i < ntrees; ++i) {
      let idx = 1;
      for (let j = 0; j < tdepth; ++j) {
        const pixIdx1 = ((r + tcodes[root + 4 * idx + 0] * s) >> 8) * ldim + ((c + tcodes[root + 4 * idx + 1] * s) >> 8);
        const pixIdx2 = ((r + tcodes[root + 4 * idx + 2] * s) >> 8) * ldim + ((c + tcodes[root + 4 * idx + 3] * s) >> 8);
        idx = 2 * idx + (pixels[pixIdx1] <= pixels[pixIdx2] ? 1 : 0);
      }
      o += tpreds[pow2tdepth * i + idx - pow2tdepth];
      if (o <= thresh[i]) return -1;
      root += 4 * pow2tdepth;
    }
    return o - thresh[ntrees - 1];
  };
}

/**
 * Runs the multiscale cascade across an image.
 */
export function picoRunCascade(image, classifyRegion, params) {
  const { pixels, nrows, ncols, ldim } = image;
  const { shiftfactor, minsize, maxsize, scalefactor } = params;
  let scale = minsize;
  const detections = [];

  while (scale <= maxsize) {
    const step = Math.max(shiftfactor * scale, 1) >> 0;
    const offset = (scale / 2 + 1) >> 0;

    for (let r = offset; r <= nrows - offset; r += step) {
      for (let c = offset; c <= ncols - offset; c += step) {
        const q = classifyRegion(r, c, scale, pixels, ldim);
        if (q > 0.0) {
          detections.push([r, c, scale, q]);
        }
      }
    }
    scale *= scalefactor;
  }
  return detections;
}

/**
 * Clusters overlapping candidate boxes via Non-Maximum Suppression (IoU).
 */
export function picoClusterDetections(dets, iouThreshold = 0.2) {
  dets.sort((a, b) => b[3] - a[3]);

  function calculateIoU(det1, det2) {
    const r1 = det1[0], c1 = det1[1], s1 = det1[2];
    const r2 = det2[0], c2 = det2[1], s2 = det2[2];
    const overr = Math.max(0, Math.min(r1 + s1 / 2, r2 + s2 / 2) - Math.max(r1 - s1 / 2, r2 - s2 / 2));
    const overc = Math.max(0, Math.min(c1 + s1 / 2, c2 + s2 / 2) - Math.max(c1 - s1 / 2, c2 - s2 / 2));
    return (overr * overc) / (s1 * s1 + s2 * s2 - overr * overc);
  }

  const assignments = new Array(dets.length).fill(0);
  const clusters = [];

  for (let i = 0; i < dets.length; ++i) {
    if (assignments[i] === 0) {
      let r = 0.0, c = 0.0, s = 0.0, q = 0.0, n = 0;
      for (let j = i; j < dets.length; ++j) {
        if (calculateIoU(dets[i], dets[j]) > iouThreshold) {
          assignments[j] = 1;
          r += dets[j][0];
          c += dets[j][1];
          s += dets[j][2];
          q += dets[j][3];
          n++;
        }
      }
      clusters.push([r / n, c / n, s / n, q]);
    }
  }
  return clusters;
}

// Global cached cascade classifier function
let cachedCascadeClassifier = null;

/**
 * Loads the facefinder cascade model.
 */
export async function loadFacefinderCascade(modelPath = '/models/facefinder') {
  if (cachedCascadeClassifier) return cachedCascadeClassifier;

  const res = await fetch(modelPath);
  if (!res.ok) throw new Error(`Could not load facefinder cascade from ${modelPath} (status ${res.status})`);
  const buffer = await res.arrayBuffer();
  const bytes = new Int8Array(buffer);
  cachedCascadeClassifier = picoUnpackCascade(bytes);
  return cachedCascadeClassifier;
}

/**
 * Converts ImageData RGBA to grayscale for pico detector.
 */
export function rgbaToGrayscale(rgba, nrows, ncols) {
  const gray = new Uint8Array(nrows * ncols);
  for (let r = 0; r < nrows; ++r) {
    for (let c = 0; c < ncols; ++c) {
      const idx = r * 4 * ncols + 4 * c;
      gray[r * ncols + c] = (2 * rgba[idx] + 7 * rgba[idx + 1] + 1 * rgba[idx + 2]) / 10;
    }
  }
  return gray;
}

/**
 * Detects faces on a source canvas or image element.
 * Tries Native Shape Detection API first, falls back to local Pico cascade.
 */
export async function detectFacesInImage(source, options = {}) {
  const minScore = options.minScore ?? DEFAULT_BLUR_OPTIONS.minScore;
  const paddingPercent = options.padding ?? DEFAULT_BLUR_OPTIONS.padding;

  const imgWidth = source.naturalWidth || source.videoWidth || source.width;
  const imgHeight = source.naturalHeight || source.videoHeight || source.height;

  if (!imgWidth || !imgHeight) {
    return { faces: [], detector: 'none' };
  }

  // 1. Try Native Browser FaceDetector API (Chrome, Edge, Android)
  if (typeof window !== 'undefined' && 'FaceDetector' in window && !options.forcePico) {
    try {
      const detector = new window.FaceDetector({ fastMode: false, maxDetectedFaces: 100 });
      const rawDetections = await detector.detect(source);
      if (rawDetections && rawDetections.length > 0) {
        const faces = rawDetections.map((det, index) => {
          const { x, y, width, height } = det.boundingBox;
          // Apply padding
          const padX = width * (paddingPercent / 100);
          const padY = height * (paddingPercent / 100);
          const finalX = Math.max(0, x - padX);
          const finalY = Math.max(0, y - padY);
          const finalW = Math.min(imgWidth - finalX, width + padX * 2);
          const finalH = Math.min(imgHeight - finalY, height + padY * 2);

          return {
            id: `face-${index + 1}`,
            x: Math.round(finalX),
            y: Math.round(finalY),
            width: Math.round(finalW),
            height: Math.round(finalH),
            confidence: 99,
            enabled: true,
            custom: false,
          };
        });
        return { faces, detector: 'native' };
      }
    } catch {
      // Fall through to Pico
    }
  }

  // 2. Fallback to Pico Cascade
  try {
    const classifyRegion = await loadFacefinderCascade(options.modelPath || '/models/facefinder');

    // Create a working canvas downscaled to max 1000px for speed (<80ms)
    const maxDim = 1000;
    let workW = imgWidth;
    let workH = imgHeight;
    let scaleRatio = 1;

    if (workW > maxDim || workH > maxDim) {
      if (workW > workH) {
        scaleRatio = maxDim / workW;
        workW = maxDim;
        workH = Math.round(imgHeight * scaleRatio);
      } else {
        scaleRatio = maxDim / workH;
        workH = maxDim;
        workW = Math.round(imgWidth * scaleRatio);
      }
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = workW;
    offscreen.height = workH;
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0, workW, workH);

    const imgData = ctx.getImageData(0, 0, workW, workH);
    const grayPixels = rgbaToGrayscale(imgData.data, workH, workW);

    const picoImage = {
      pixels: grayPixels,
      nrows: workH,
      ncols: workW,
      ldim: workW,
    };

    const params = {
      shiftfactor: 0.1,
      minsize: Math.max(20, Math.round(24 * scaleRatio)),
      maxsize: Math.min(workW, workH),
      scalefactor: 1.15,
    };

    let dets = picoRunCascade(picoImage, classifyRegion, params);
    dets = picoClusterDetections(dets, 0.2);
    dets = dets.filter(d => d[3] >= minScore);

    const faces = dets.map((d, index) => {
      const r = d[0]; // center y
      const c = d[1]; // center x
      const s = d[2]; // diameter / scale
      const score = Math.round(Math.min(99, Math.max(50, d[3] * 8)));

      // Map back to original coordinate system
      const origC = c / scaleRatio;
      const origR = r / scaleRatio;
      const origS = s / scaleRatio;

      const rawX = origC - origS / 2;
      const rawY = origR - origS / 2;
      const rawW = origS;
      const rawH = origS;

      const padX = rawW * (paddingPercent / 100);
      const padY = rawH * (paddingPercent / 100);
      const finalX = Math.max(0, rawX - padX);
      const finalY = Math.max(0, rawY - padY);
      const finalW = Math.min(imgWidth - finalX, rawW + padX * 2);
      const finalH = Math.min(imgHeight - finalY, rawH + padY * 2);

      return {
        id: `face-${index + 1}`,
        x: Math.round(finalX),
        y: Math.round(finalY),
        width: Math.round(finalW),
        height: Math.round(finalH),
        confidence: score,
        enabled: true,
        custom: false,
      };
    });

    return { faces, detector: 'pico' };
  } catch (err) {
    console.warn('Face detection fallback error:', err);
    return { faces: [], detector: 'error', error: err.message };
  }
}

/**
 * Applies blur / censor effect on a canvas for all active face regions.
 */
export function renderBlurredImageToCanvas(destCanvas, sourceImage, faces = [], userOptions = {}) {
  const opts = { ...DEFAULT_BLUR_OPTIONS, ...userOptions };
  const w = sourceImage.naturalWidth || sourceImage.width;
  const h = sourceImage.naturalHeight || sourceImage.height;

  if (destCanvas.width !== w || destCanvas.height !== h) {
    destCanvas.width = w;
    destCanvas.height = h;
  }

  const ctx = destCanvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  // 1. Draw base original image
  ctx.drawImage(sourceImage, 0, 0, w, h);

  // Filter only active faces
  const activeFaces = faces.filter(f => f.enabled !== false);
  if (activeFaces.length === 0) return;

  // 2. Apply blur per face region
  for (const face of activeFaces) {
    applyRegionCensorship(ctx, destCanvas, sourceImage, face, opts);
  }
}

/**
 * Applies censorship to an individual face region.
 */
function applyRegionCensorship(mainCtx, fullCanvas, sourceImage, face, opts) {
  const { x, y, width: w, height: h } = face;
  if (w <= 0 || h <= 0) return;

  const shape = face.shape || opts.shape || 'ellipse';
  const mode = face.mode || opts.mode || 'gaussian';
  const strength = face.strength || opts.strength || 25;
  const pixelSize = face.pixelSize || opts.pixelSize || 14;
  const feather = opts.feather ?? 15;

  // Create isolated canvas for this region
  const regionCanvas = document.createElement('canvas');
  regionCanvas.width = w;
  regionCanvas.height = h;
  const regionCtx = regionCanvas.getContext('2d');

  if (mode === 'censor-bar') {
    // Solid pitch black / dark bar
    regionCtx.fillStyle = '#090d16';
    regionCtx.fillRect(0, 0, w, h);
  } else if (mode === 'pixelate') {
    // High-speed pixelate / mosaic
    const sampleFactor = Math.max(2, Math.min(60, pixelSize));
    const smallW = Math.max(1, Math.round(w / sampleFactor));
    const smallH = Math.max(1, Math.round(h / sampleFactor));

    const tempSmall = document.createElement('canvas');
    tempSmall.width = smallW;
    tempSmall.height = smallH;
    const tempCtx = tempSmall.getContext('2d');

    // Downsample
    tempCtx.drawImage(sourceImage, x, y, w, h, 0, 0, smallW, smallH);

    // Upsample without smoothing to get crisp mosaic pixels
    regionCtx.imageSmoothingEnabled = false;
    regionCtx.drawImage(tempSmall, 0, 0, smallW, smallH, 0, 0, w, h);
  } else if (mode === 'frosted') {
    // Frosted glass: strong blur + subtle white tint
    const blurRadius = Math.max(4, strength);
    const tempBlur = document.createElement('canvas');
    tempBlur.width = w;
    tempBlur.height = h;
    const tempCtx = tempBlur.getContext('2d');

    tempCtx.filter = `blur(${blurRadius}px)`;
    tempCtx.drawImage(sourceImage, x, y, w, h, 0, 0, w, h);

    regionCtx.drawImage(tempBlur, 0, 0);
    regionCtx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    regionCtx.fillRect(0, 0, w, h);
  } else {
    // Default: Gaussian Blur
    const blurRadius = Math.max(3, strength);
    const tempBlur = document.createElement('canvas');
    // Add margin around the region so the blur does not clip at the boundaries
    const margin = Math.round(blurRadius * 1.5);
    tempBlur.width = w + margin * 2;
    tempBlur.height = h + margin * 2;
    const tempCtx = tempBlur.getContext('2d');

    const srcX = Math.max(0, x - margin);
    const srcY = Math.max(0, y - margin);
    const srcW = Math.min(sourceImage.width - srcX, w + margin * 2);
    const srcH = Math.min(sourceImage.height - srcY, h + margin * 2);

    tempCtx.filter = `blur(${blurRadius}px)`;
    tempCtx.drawImage(sourceImage, srcX, srcY, srcW, srcH, srcX - (x - margin), srcY - (y - margin), srcW, srcH);

    // Draw central portion
    regionCtx.drawImage(tempBlur, margin, margin, w, h, 0, 0, w, h);
  }

  // 3. Apply Shape Masking (Ellipse or Rect with Feathering)
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  const maskCtx = maskCanvas.getContext('2d');

  if (shape === 'ellipse') {
    maskCtx.save();
    maskCtx.beginPath();
    maskCtx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    maskCtx.fillStyle = '#ffffff';
    maskCtx.fill();
    maskCtx.restore();

    if (feather > 0 && mode !== 'censor-bar') {
      // Soft radial gradient fade out
      maskCtx.globalCompositeOperation = 'destination-in';
      const grad = maskCtx.createRadialGradient(
        w / 2, h / 2, Math.max(1, (w / 2) * (1 - feather / 50)),
        w / 2, h / 2, w / 2
      );
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      maskCtx.fillStyle = grad;
      maskCtx.fillRect(0, 0, w, h);
    }
  } else {
    // Rectangle
    maskCtx.fillStyle = '#ffffff';
    maskCtx.fillRect(0, 0, w, h);

    if (feather > 0 && mode !== 'censor-bar') {
      maskCtx.filter = `blur(${Math.round(feather / 2)}px)`;
      maskCtx.fillRect(feather, feather, Math.max(1, w - feather * 2), Math.max(1, h - feather * 2));
    }
  }

  // Apply mask to region canvas
  regionCtx.globalCompositeOperation = 'destination-in';
  regionCtx.drawImage(maskCanvas, 0, 0);

  // 4. Composite final blurred region onto main canvas
  mainCtx.save();
  mainCtx.drawImage(regionCanvas, x, y);
  mainCtx.restore();
}

/**
 * Formats output filename with -blurred suffix.
 */
export function formatBlurOutputFilename(originalName = 'image.jpg', extension = 'jpg') {
  const lastDot = originalName.lastIndexOf('.');
  const baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
  const cleanExt = extension.replace(/^\./, '').toLowerCase();
  return `${baseName}-face-blurred.${cleanExt}`;
}

