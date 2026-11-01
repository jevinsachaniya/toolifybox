/**
 * Client-Side In-Browser Background Removal Engine
 * Features:
 *  1. Neural AI Model (via @imgly/background-removal WASM/ONNX)
 *  2. Corner-Aware Auto Background Color Detection
 *  3. High-Precision Color & Chroma Key / Flood Fill (0ms instant, offline)
 *  4. Interactive Brush (Erase / Restore)
 *  5. Staging & Background Replacement (Transparent, Solid Color, Blur, Custom Image)
 */

let imglyRemoveBackground = null;

/**
 * Run AI Neural Background Removal
 * @param {HTMLImageElement|Blob|File|ImageData|string} imageSource
 * @param {Function} [onProgress] Callback with { stage, progress, percent, message }
 * @returns {Promise<Blob>} Transparent PNG Blob
 */
export async function removeBackgroundAI(imageSource, onProgress = null) {
  if (typeof window === 'undefined') {
    throw new Error('AI background removal runs only in the browser.');
  }

  try {
    if (!imglyRemoveBackground) {
      if (onProgress) onProgress({ stage: 'loading_model', progress: 0.1, percent: 10, message: 'Initializing neural engine...' });
      const imported = await import('@imgly/background-removal');
      imglyRemoveBackground = imported.removeBackground || imported.default || (typeof imported === 'function' ? imported : null);
      if (!imglyRemoveBackground) {
        throw new Error('Could not find removeBackground function in @imgly/background-removal');
      }
    }

    const config = {
      model: 'isnet_quint8', // Quantized model for fast in-browser inference
      progress: (key, current, total) => {
        if (!onProgress) return;
        const totalNum = total || 1;
        const ratio = Math.min(1, Math.max(0, current / totalNum));
        const percent = Math.round(ratio * 100);
        let msg = 'Segmenting foreground...';
        if (key.includes('download') || key.includes('fetch')) {
          msg = `Downloading AI model (${percent}%)...`;
        } else if (key.includes('compute') || key.includes('inference')) {
          msg = `Refining subject edges (${percent}%)...`;
        }
        onProgress({ stage: key, progress: ratio, percent, message: msg });
      },
      debug: false,
    };

    if (onProgress) onProgress({ stage: 'processing', progress: 0.25, percent: 25, message: 'Detecting subject boundaries...' });

    const resultBlob = await imglyRemoveBackground(imageSource, config);
    if (onProgress) onProgress({ stage: 'completed', progress: 1.0, percent: 100, message: 'Background removed successfully!' });
    return resultBlob;
  } catch (err) {
    console.error('AI Background Removal error:', err);
    throw new Error(err.message || 'AI background removal could not complete.');
  }
}

/**
 * Automatically detect dominant background color from the border pixels of a canvas
 * @param {HTMLCanvasElement} canvas
 * @returns {{ r: number, g: number, b: number, hex: string }}
 */
export function autoDetectBackgroundColor(canvas) {
  if (!canvas) return { r: 255, g: 255, b: 255, hex: '#ffffff' };
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  const samplePoints = [
    [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
    [Math.floor(w / 2), 0], [Math.floor(w / 2), h - 1],
    [0, Math.floor(h / 2)], [w - 1, Math.floor(h / 2)],
    [Math.floor(w / 4), 0], [Math.floor(3 * w / 4), 0],
    [0, Math.floor(h / 4)], [0, Math.floor(3 * h / 4)],
  ];

  const colors = samplePoints.map(([x, y]) => {
    const px = Math.max(0, Math.min(w - 1, x));
    const py = Math.max(0, Math.min(h - 1, y));
    const p = ctx.getImageData(px, py, 1, 1).data;
    return { r: p[0], g: p[1], b: p[2] };
  });

  const avgR = Math.round(colors.reduce((sum, c) => sum + c.r, 0) / colors.length);
  const avgG = Math.round(colors.reduce((sum, c) => sum + c.g, 0) / colors.length);
  const avgB = Math.round(colors.reduce((sum, c) => sum + c.b, 0) / colors.length);

  return {
    r: avgR,
    g: avgG,
    b: avgB,
    hex: rgbToHex(avgR, avgG, avgB),
  };
}

/**
 * Remove background using Color / Chroma Key or Corner-Aware Flood Fill
 * @param {HTMLCanvasElement|ImageData} source
 * @param {Object} options
 * @param {string|{r:number, g:number, b:number}} [options.targetColor] Target background color
 * @param {number} [options.tolerance=35] Color difference tolerance (0 - 100)
 * @param {string} [options.mode='flood'] 'flood' (border-connected) or 'global' (all matching pixels)
 * @param {number} [options.feather=1] Edge feathering radius in px (0 - 8)
 * @returns {ImageData}
 */
export function removeBackgroundColorKey(source, options = {}) {
  const {
    targetColor = { r: 255, g: 255, b: 255 },
    tolerance = 35,
    mode = 'flood',
    feather = 1,
  } = options;

  let width, height, data;

  if (source instanceof ImageData) {
    width = source.width;
    height = source.height;
    data = new Uint8ClampedArray(source.data);
  } else {
    const ctx = source.getContext('2d');
    const imgData = ctx.getImageData(0, 0, source.width, source.height);
    width = imgData.width;
    height = imgData.height;
    data = new Uint8ClampedArray(imgData.data);
  }

  // Parse target color
  let tr = 255, tg = 255, tb = 255;
  if (typeof targetColor === 'string') {
    const rgb = hexToRgb(targetColor);
    if (rgb) {
      tr = rgb.r;
      tg = rgb.g;
      tb = rgb.b;
    }
  } else if (targetColor && typeof targetColor.r === 'number') {
    tr = targetColor.r;
    tg = targetColor.g;
    tb = targetColor.b;
  }

  const maxDistance = 441.67;
  const threshold = (tolerance / 100) * maxDistance;

  const totalPixels = width * height;
  const mask = new Uint8Array(totalPixels);

  const colorDistance = (r, g, b) => {
    const dr = r - tr;
    const dg = g - tg;
    const db = b - tb;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  if (mode === 'flood') {
    const queue = new Int32Array(totalPixels);
    let head = 0;
    let tail = 0;

    const enqueue = (idx) => {
      if (mask[idx] === 0) {
        const offset = idx * 4;
        const dist = colorDistance(data[offset], data[offset + 1], data[offset + 2]);
        if (dist <= threshold) {
          mask[idx] = 1;
          queue[tail++] = idx;
        }
      }
    };

    for (let x = 0; x < width; x++) {
      enqueue(x);
      enqueue((height - 1) * width + x);
    }
    for (let y = 0; y < height; y++) {
      enqueue(y * width);
      enqueue(y * width + (width - 1));
    }

    while (head < tail) {
      const curr = queue[head++];
      const cx = curr % width;
      const cy = Math.floor(curr / width);

      if (cx > 0) enqueue(curr - 1);
      if (cx < width - 1) enqueue(curr + 1);
      if (cy > 0) enqueue(curr - width);
      if (cy < height - 1) enqueue(curr + width);
    }
  } else {
    for (let i = 0; i < totalPixels; i++) {
      const offset = i * 4;
      const dist = colorDistance(data[offset], data[offset + 1], data[offset + 2]);
      if (dist <= threshold) {
        mask[i] = 1;
      }
    }
  }

  if (feather > 0) {
    const radius = Math.min(8, Math.max(1, Math.round(feather)));
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const offset = idx * 4;
        if (mask[idx] === 1) {
          data[offset + 3] = 0;
        } else {
          let transparentNeighbors = 0;
          let count = 0;
          for (let dy = -radius; dy <= radius; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= height) continue;
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= width) continue;
              count++;
              if (mask[ny * width + nx] === 1) {
                transparentNeighbors++;
              }
            }
          }
          if (transparentNeighbors > 0) {
            const alphaFactor = 1 - (transparentNeighbors / count);
            data[offset + 3] = Math.round(data[offset + 3] * alphaFactor);
          }
        }
      }
    }
  } else {
    for (let i = 0; i < totalPixels; i++) {
      if (mask[i] === 1) {
        data[i * 4 + 3] = 0;
      }
    }
  }

  return new ImageData(data, width, height);
}

/**
 * Sample RGB color from a canvas coordinate
 */
export function samplePixelColor(canvas, x, y) {
  const ctx = canvas.getContext('2d');
  const cx = Math.max(0, Math.min(canvas.width - 1, Math.round(x)));
  const cy = Math.max(0, Math.min(canvas.height - 1, Math.round(y)));
  const pixel = ctx.getImageData(cx, cy, 1, 1).data;
  return {
    r: pixel[0],
    g: pixel[1],
    b: pixel[2],
    a: pixel[3],
    hex: rgbToHex(pixel[0], pixel[1], pixel[2]),
  };
}

/**
 * Render Final Composite Canvas with chosen background
 */
export function renderCompositeCanvas({
  cutoutCanvas,
  originalCanvas = null,
  bgType = 'transparent',
  bgColor = '#ffffff',
  bgBlurRadius = 16,
  bgImage = null,
}) {
  if (typeof document === 'undefined') return null;
  const output = document.createElement('canvas');
  output.width = cutoutCanvas.width;
  output.height = cutoutCanvas.height;
  const ctx = output.getContext('2d');

  if (bgType === 'color') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, output.width, output.height);
  } else if (bgType === 'blur' && originalCanvas) {
    ctx.save();
    ctx.filter = `blur(${bgBlurRadius}px)`;
    const bleed = bgBlurRadius * 2;
    ctx.drawImage(originalCanvas, -bleed, -bleed, output.width + bleed * 2, output.height + bleed * 2);
    ctx.restore();
  } else if (bgType === 'image' && bgImage) {
    const scale = Math.max(output.width / bgImage.width, output.height / bgImage.height);
    const sw = bgImage.width * scale;
    const sh = bgImage.height * scale;
    const sx = (output.width - sw) / 2;
    const sy = (output.height - sh) / 2;
    ctx.drawImage(bgImage, sx, sy, sw, sh);
  }

  ctx.drawImage(cutoutCanvas, 0, 0);
  return output;
}

/**
 * Convert Canvas to Blob
 */
export function canvasToBlob(canvas, format = 'image/png', quality = 0.95) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), format, quality);
  });
}

/**
 * Copy Blob Image to Clipboard
 */
export async function copyImageToClipboard(blob) {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('Clipboard image copying is not supported on this browser.');
  }
  let pngBlob = blob;
  if (blob.type !== 'image/png') {
    const img = await blobToImage(blob);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    pngBlob = await canvasToBlob(canvas, 'image/png');
  }
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': pngBlob }),
  ]);
  return true;
}

/**
 * Load Blob as HTMLImageElement
 */
export function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image from blob.'));
    };
    img.src = url;
  });
}

function hexToRgb(hex) {
  const sanitized = hex.replace('#', '').trim();
  if (sanitized.length === 3) {
    return {
      r: parseInt(sanitized[0] + sanitized[0], 16),
      g: parseInt(sanitized[1] + sanitized[1], 16),
      b: parseInt(sanitized[2] + sanitized[2], 16),
    };
  }
  if (sanitized.length === 6) {
    return {
      r: parseInt(sanitized.substring(0, 2), 16),
      g: parseInt(sanitized.substring(2, 4), 16),
      b: parseInt(sanitized.substring(4, 6), 16),
    };
  }
  return null;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}
