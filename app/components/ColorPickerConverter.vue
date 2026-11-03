<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import {
  Check,
  CircleAlert,
  Copy,
  Download,
  Eye,
  FileCheck,
  Hash,
  Image as ImageIcon,
  Layers,
  Maximize2,
  Minimize2,
  Move,
  Palette,
  Pipette,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import {
  COLOR_DATABASE,
  extractDominantColors,
  generateSampleArtwork,
  generateShadesAndTints,
  getColorName,
  getContrastRatio,
  getContrastTextColor,
  rgbToCmyk,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
} from '~/utils/color-namer.js';

// Base State
const file = shallowRef(null);
const fileInput = ref(null);
const isDragging = ref(false);
const imageObj = shallowRef(null);
const imageDimensions = ref({ width: 0, height: 0 });

// Canvas & Workspace
const workspaceContainer = ref(null);
const mainCanvas = ref(null);
const loupeCanvas = ref(null);
const offscreenCanvas = shallowRef(null);
const offscreenCtx = shallowRef(null);

// Zoom & Pan
const zoomLevel = ref(1); // 1 = fit
const panOffset = ref({ x: 0, y: 0 });
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });

// Hover Loupe State
const isHoveringImage = ref(false);
const pointerPos = ref({ x: 0, y: 0, clientX: 0, clientY: 0 });
const hoveredPixel = ref({
  r: 0,
  g: 0,
  b: 0,
  hex: '#000000',
  name: 'Black',
  imageX: 0,
  imageY: 0,
});

// Selected Color State
const selectedColor = ref({
  r: 59,
  g: 130,
  b: 246,
  hex: '#3B82F6',
  name: 'Dodger Blue',
  isExact: true,
  distance: 0,
  hsl: { h: 217, s: 91, l: 60, str: 'hsl(217, 91%, 60%)' },
  hsv: { h: 217, s: 76, v: 96, str: 'hsv(217, 76%, 96%)' },
  cmyk: { c: 76, m: 47, y: 0, k: 4, str: 'cmyk(76%, 47%, 0%, 4%)' },
  imageX: null,
  imageY: null,
});

// Extracted & Picked Palettes
const dominantPalette = ref([]);
const pickedHistory = ref([]);
const isExtractingPalette = ref(false);

// UI Notifications
const notification = ref('');
const error = ref('');
const copiedFormat = ref('');
let noticeTimer = null;
let copiedTimer = null;

// Native EyeDropper Support Detection
const supportsNativeEyeDropper = ref(false);

onMounted(() => {
  if (typeof window !== 'undefined') {
    supportsNativeEyeDropper.value = 'EyeDropper' in window;
    window.addEventListener('paste', handleWindowPaste);
    window.addEventListener('keydown', handleGlobalKeydown);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('paste', handleWindowPaste);
    window.removeEventListener('keydown', handleGlobalKeydown);
  }
  if (noticeTimer) clearTimeout(noticeTimer);
  if (copiedTimer) clearTimeout(copiedTimer);
});

// Tonal Shades & Tints for selected color
const shadesAndTints = computed(() => {
  if (!selectedColor.value) return [];
  return generateShadesAndTints(
    selectedColor.value.r,
    selectedColor.value.g,
    selectedColor.value.b
  );
});

// Contrast analysis for selected color
const contrastInfo = computed(() => {
  if (!selectedColor.value) return { whiteRatio: 1, blackRatio: 1, bestText: '#FFFFFF' };
  const r = selectedColor.value.r;
  const g = selectedColor.value.g;
  const b = selectedColor.value.b;
  const whiteRatio = getContrastRatio({ r, g, b }, { r: 255, g: 255, b: 255 });
  const blackRatio = getContrastRatio({ r, g, b }, { r: 0, g: 0, b: 0 });
  const bestText = getContrastTextColor(r, g, b);
  return {
    whiteRatio: Number(whiteRatio.toFixed(1)),
    blackRatio: Number(blackRatio.toFixed(1)),
    bestText,
  };
});

function showNotice(msg) {
  notification.value = msg;
  if (noticeTimer) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notification.value = '';
  }, 3200);
}

// -------------------------------------------------------------
// Image Loader & Handlers
// -------------------------------------------------------------
function handleFileSelect(files) {
  const f = files[0];
  if (!f) return;
  if (!f.type.startsWith('image/') && !/\.(jpe?g|png|webp|bmp|gif|svg)$/i.test(f.name)) {
    error.value = 'Please select a valid image file (JPG, PNG, WebP, BMP, GIF, SVG).';
    return;
  }
  if (f.size > 50 * 1024 * 1024) {
    error.value = 'File size exceeds maximum allowed 50 MB limit.';
    return;
  }

  error.value = '';
  file.value = f;

  const reader = new FileReader();
  reader.onload = (e) => {
    loadImageFromSrc(e.target.result, f.name);
  };
  reader.onerror = () => {
    error.value = 'Could not read image file.';
  };
  reader.readAsDataURL(f);
}

function handleWindowPaste(e) {
  if (!e.clipboardData?.items) return;
  for (const item of e.clipboardData.items) {
    if (item.type.indexOf('image') !== -1) {
      const pastedFile = item.getAsFile();
      if (pastedFile) {
        handleFileSelect([pastedFile]);
        showNotice('Image loaded from clipboard!');
        break;
      }
    }
  }
}

function handleGlobalKeydown(e) {
  if (e.key === 'c' && (e.metaKey || e.ctrlKey) && !window.getSelection().toString()) {
    // Quick copy active hex
    copyCode(selectedColor.value.hex, 'HEX');
  }
}

function loadSampleImage() {
  error.value = '';
  const sampleCanvas = generateSampleArtwork();
  if (!sampleCanvas) return;

  const dataUrl = sampleCanvas.toDataURL('image/png');
  file.value = {
    name: 'sunset-lagoon-sample.png',
    size: Math.round(dataUrl.length * 0.75),
    type: 'image/png',
  };
  loadImageFromSrc(dataUrl, 'sunset-lagoon-sample.png');
  showNotice('Sample photo loaded! Click or hover over the balloons and sunset to pick colors.');
}

function loadImageFromSrc(src, filename) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    imageObj.value = img;
    imageDimensions.value = { width: img.naturalWidth, height: img.naturalHeight };
    zoomLevel.value = 1;
    panOffset.value = { x: 0, y: 0 };

    // Setup offscreen canvas for fast pixel data lookups
    const off = document.createElement('canvas');
    off.width = img.naturalWidth;
    off.height = img.naturalHeight;
    const ctx = off.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    offscreenCanvas.value = off;
    offscreenCtx.value = ctx;

    // Auto extract dominant palette
    isExtractingPalette.value = true;
    setTimeout(() => {
      dominantPalette.value = extractDominantColors(img, 8);
      isExtractingPalette.value = false;

      // Select center or first dominant color
      if (dominantPalette.value.length > 0) {
        selectDirectColor(dominantPalette.value[0].r, dominantPalette.value[0].g, dominantPalette.value[0].b);
      }
    }, 40);

    nextTick(() => {
      renderMainCanvas();
    });
  };
  img.onerror = () => {
    error.value = 'Failed to decode image. Please try another image file.';
  };
  img.src = src;
}

// -------------------------------------------------------------
// Canvas Rendering & Display
// -------------------------------------------------------------
function renderMainCanvas() {
  if (!mainCanvas.value || !imageObj.value) return;
  const canvas = mainCanvas.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = imageDimensions.value.width;
  const h = imageDimensions.value.height;

  canvas.width = w;
  canvas.height = h;

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(imageObj.value, 0, 0, w, h);

  // If a pin is selected, draw a stylish reticle marker on the canvas
  if (selectedColor.value && selectedColor.value.imageX !== null && selectedColor.value.imageY !== null) {
    const px = selectedColor.value.imageX;
    const py = selectedColor.value.imageY;

    ctx.save();
    // Outer white ring
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Inner dark ring
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Center fill dot in the selected color
    ctx.fillStyle = selectedColor.value.hex;
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Subtle crosshairs
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px - 14, py);
    ctx.lineTo(px - 11, py);
    ctx.moveTo(px + 11, py);
    ctx.lineTo(px + 14, py);
    ctx.moveTo(px, py - 14);
    ctx.lineTo(px, py - 11);
    ctx.moveTo(px, py + 11);
    ctx.lineTo(px, py + 14);
    ctx.stroke();

    ctx.restore();
  }
}

// -------------------------------------------------------------
// Pixel Sampling & Magnifier Loupe
// -------------------------------------------------------------
function getCanvasCoordsFromEvent(e) {
  if (!mainCanvas.value) return null;
  const rect = mainCanvas.value.getBoundingClientRect();

  let clientX = e.clientX;
  let clientY = e.clientY;

  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }

  const scaleX = imageDimensions.value.width / rect.width;
  const scaleY = imageDimensions.value.height / rect.height;

  const canvasX = Math.floor((clientX - rect.left) * scaleX);
  const canvasY = Math.floor((clientY - rect.top) * scaleY);

  const clampedX = Math.max(0, Math.min(imageDimensions.value.width - 1, canvasX));
  const clampedY = Math.max(0, Math.min(imageDimensions.value.height - 1, canvasY));

  return {
    imageX: clampedX,
    imageY: clampedY,
    clientX,
    clientY,
    relX: clientX - rect.left,
    relY: clientY - rect.top,
  };
}

function handlePointerMove(e) {
  if (!offscreenCtx.value || isPanning.value) return;

  const coords = getCanvasCoordsFromEvent(e);
  if (!coords) return;

  isHoveringImage.value = true;
  pointerPos.value = coords;

  // Extract 1 pixel
  const p = offscreenCtx.value.getImageData(coords.imageX, coords.imageY, 1, 1).data;
  const r = p[0];
  const g = p[1];
  const b = p[2];
  const hex = rgbToHex(r, g, b);
  const nameInfo = getColorName(r, g, b);

  hoveredPixel.value = {
    r,
    g,
    b,
    hex,
    name: nameInfo.name,
    imageX: coords.imageX,
    imageY: coords.imageY,
  };

  renderMagnifierLoupe(coords.imageX, coords.imageY);
}

function handlePointerLeave() {
  isHoveringImage.value = false;
}

function renderMagnifierLoupe(cx, cy) {
  if (!loupeCanvas.value || !offscreenCanvas.value) return;
  const canvas = loupeCanvas.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = 110;
  canvas.width = size;
  canvas.height = size;

  // Disable smoothing for crisp retro pixel grid
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);

  // Sample a 9x9 pixel area around cx, cy
  const sampleRadius = 4; // 4 + 1 + 4 = 9x9 grid
  const sx = cx - sampleRadius;
  const sy = cy - sampleRadius;
  const sWidth = 9;
  const sHeight = 9;

  // Circular clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.clip();

  // Background checkboard for transparency
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, size, size);

  // Draw scaled pixel patch
  ctx.drawImage(offscreenCanvas.value, sx, sy, sWidth, sHeight, 0, 0, size, size);

  // Draw pixel grid lines
  const cellSize = size / 9;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1;

  for (let i = 1; i < 9; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, size);
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(size, i * cellSize);
    ctx.stroke();
  }

  // Highlight center targeted pixel (at index 4, 4)
  const centerLeft = 4 * cellSize;
  const centerTop = 4 * cellSize;

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerLeft, centerTop, cellSize, cellSize);

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1;
  ctx.strokeRect(centerLeft - 1, centerTop - 1, cellSize + 2, cellSize + 2);

  ctx.restore();
}

// -------------------------------------------------------------
// Color Selection & Registration
// -------------------------------------------------------------
function handleCanvasClick(e) {
  if (isPanning.value) return;

  const coords = getCanvasCoordsFromEvent(e);
  if (!coords || !offscreenCtx.value) return;

  const p = offscreenCtx.value.getImageData(coords.imageX, coords.imageY, 1, 1).data;
  applySelectedColor(p[0], p[1], p[2], coords.imageX, coords.imageY);
}

function applySelectedColor(r, g, b, imgX = null, imgY = null) {
  const hex = rgbToHex(r, g, b);
  const nameInfo = getColorName(r, g, b);
  const hsl = rgbToHsl(r, g, b);
  const hsv = rgbToHsv(r, g, b);
  const cmyk = rgbToCmyk(r, g, b);

  selectedColor.value = {
    r,
    g,
    b,
    hex,
    name: nameInfo.name,
    isExact: nameInfo.isExact,
    distance: nameInfo.distance,
    hsl,
    hsv,
    cmyk,
    imageX: imgX,
    imageY: imgY,
  };

  // Add to picked history (avoid duplicates at the top)
  const filtered = pickedHistory.value.filter((item) => item.hex !== hex);
  pickedHistory.value = [
    {
      hex,
      r,
      g,
      b,
      name: nameInfo.name,
      time: Date.now(),
    },
    ...filtered,
  ].slice(0, 24);

  renderMainCanvas();
}

function selectDirectColor(r, g, b) {
  applySelectedColor(r, g, b, null, null);
}

// Native Eyedropper API
async function openNativeEyeDropper() {
  if (typeof window === 'undefined' || !('EyeDropper' in window)) return;
  try {
    const eyeDropper = new window.EyeDropper();
    const result = await eyeDropper.open();
    if (result && result.sRGBHex) {
      const hex = result.sRGBHex;
      const clean = hex.replace('#', '');
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      applySelectedColor(r, g, b, null, null);
      showNotice(`Picked ${hex} from screen!`);
    }
  } catch (err) {
    // User cancelled or aborted
    console.warn('EyeDropper closed:', err);
  }
}

// -------------------------------------------------------------
// Copy & Export Utilities
// -------------------------------------------------------------
async function copyCode(text, formatLabel) {
  try {
    await navigator.clipboard.writeText(text);
    copiedFormat.value = formatLabel;
    showNotice(`Copied ${formatLabel}: ${text}`);
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copiedFormat.value = '';
    }, 2200);
  } catch {
    showNotice(`Failed to copy to clipboard.`);
  }
}

function copyAllPickedHex() {
  if (pickedHistory.value.length === 0) return;
  const list = pickedHistory.value.map((c) => c.hex).join(', ');
  copyCode(list, 'All Palette HEX');
}

function exportPaletteCss() {
  if (pickedHistory.value.length === 0) return;
  const lines = [
    ':root {',
    ...pickedHistory.value.map(
      (c, idx) => `  --color-${idx + 1}: ${c.hex}; /* ${c.name} */`
    ),
    '}',
  ].join('\n');
  copyCode(lines, 'CSS Variables');
}

function exportPaletteJson() {
  if (pickedHistory.value.length === 0) return;
  const data = pickedHistory.value.map((c) => ({
    name: c.name,
    hex: c.hex,
    rgb: `rgb(${c.r}, ${c.g}, ${c.b})`,
    hsl: rgbToHsl(c.r, c.g, c.b).str,
  }));
  copyCode(JSON.stringify(data, null, 2), 'JSON Palette');
}

function clearPickedPalette() {
  pickedHistory.value = [];
  showNotice('Palette history cleared.');
}

function removePaletteItem(hex) {
  pickedHistory.value = pickedHistory.value.filter((c) => c.hex !== hex);
}

// Reset tool
function resetAll() {
  file.value = null;
  imageObj.value = null;
  imageDimensions.value = { width: 0, height: 0 };
  offscreenCanvas.value = null;
  offscreenCtx.value = null;
  pickedHistory.value = [];
  dominantPalette.value = [];
  zoomLevel.value = 1;
  panOffset.value = { x: 0, y: 0 };
  error.value = '';
}

// Loupe CSS positioning relative to viewport
const loupeStyle = computed(() => {
  if (!workspaceContainer.value) return {};
  const { relX, relY } = pointerPos.value;

  // Offset 20px right and 70px above cursor
  let left = relX + 24;
  let top = relY - 140;

  // Boundary check
  if (left > 320) left = relX - 140;
  if (top < 10) top = relY + 30;

  return {
    left: `${left}px`,
    top: `${top}px`,
  };
});
</script>

<template>
  <div class="color-picker-converter">
    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*,.jpg,.jpeg,.png,.webp,.bmp,.gif,.svg"
      class="visually-hidden"
      style="display: none;"
      @change="(e) => { if (e.target.files) handleFileSelect(e.target.files); e.target.value = ''; }"
    />

    <!-- ================= WORKSPACE VIEW (Active Image) ================= -->
    <div v-if="file && imageObj" class="picker-workspace">
      <!-- Top Info & Toolbar -->
      <div class="organize-header-bar picker-top-info">
        <div class="organize-files-info">
          <div class="files-summary-pill">
            <Pipette :size="16" />
            <span>
              <b>{{ file.name }}</b> &bull; {{ imageDimensions.width }} × {{ imageDimensions.height }} px ({{ formatSize(file.size) }})
            </span>
          </div>

          <div v-if="selectedColor" class="active-color-mini-pill">
            <span class="color-dot" :style="{ backgroundColor: selectedColor.hex }" />
            <span><b>{{ selectedColor.name }}</b> ({{ selectedColor.hex }})</span>
          </div>
        </div>

        <div class="organize-top-actions">
          <!-- Native EyeDropper (if supported) -->
          <button
            v-if="supportsNativeEyeDropper"
            type="button"
            class="tool-action-btn primary-subtle"
            title="Pick any color directly from your desktop screen"
            @click="openNativeEyeDropper"
          >
            <Pipette :size="14" />
            <span>Pick from Screen</span>
          </button>

          <button
            type="button"
            class="tool-action-btn secondary"
            title="Upload a different image"
            @click="fileInput?.click()"
          >
            <Upload :size="14" />
            <span>Change Image</span>
          </button>

          <button
            type="button"
            class="tool-action-btn icon-only clear-btn"
            title="Reset and start over"
            @click="resetAll"
          >
            <X :size="15" />
          </button>
        </div>
      </div>

      <!-- Main Layout: Canvas on Left, Color Inspector on Right -->
      <div class="picker-main-grid">
        <!-- Interactive Image Canvas Card -->
        <div class="picker-canvas-card">
          <div class="canvas-toolbar">
            <div class="toolbar-left">
              <span class="toolbar-title">
                <Pipette :size="14" /> Click anywhere on image to pick color
              </span>
            </div>

            <div class="toolbar-zoom-group">
              <button
                type="button"
                class="zoom-btn"
                title="Zoom Out"
                :disabled="zoomLevel <= 0.6"
                @click="zoomLevel = Math.max(0.6, Number((zoomLevel - 0.2).toFixed(1)))"
              >
                <ZoomOut :size="13" />
              </button>
              <span class="zoom-level-text">{{ Math.round(zoomLevel * 100) }}%</span>
              <button
                type="button"
                class="zoom-btn"
                title="Zoom In"
                :disabled="zoomLevel >= 3"
                @click="zoomLevel = Math.min(3, Number((zoomLevel + 0.2).toFixed(1)))"
              >
                <ZoomIn :size="13" />
              </button>
              <button
                type="button"
                class="zoom-reset-btn"
                title="Fit to view"
                @click="zoomLevel = 1"
              >
                Fit
              </button>
            </div>
          </div>

          <!-- Canvas Viewport with Precision Magnifier Loupe -->
          <div
            ref="workspaceContainer"
            class="picker-canvas-viewport"
            @mousemove="handlePointerMove"
            @mouseleave="handlePointerLeave"
            @touchmove.passive="handlePointerMove"
            @touchend="handlePointerLeave"
            @click="handleCanvasClick"
          >
            <div
              class="canvas-transform-layer"
              :style="{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
              }"
            >
              <canvas ref="mainCanvas" class="picker-main-canvas" />
            </div>

            <!-- Floating Magnifier Loupe -->
            <transition name="pop-fade">
              <div
                v-if="isHoveringImage"
                class="magnifier-loupe-card"
                :style="loupeStyle"
              >
                <div class="loupe-lens-wrap">
                  <canvas ref="loupeCanvas" class="loupe-canvas" />
                  <div class="loupe-ring" aria-hidden="true" />
                </div>
                <div class="loupe-info-pill">
                  <span class="loupe-swatch" :style="{ backgroundColor: hoveredPixel.hex }" />
                  <span class="loupe-hex">{{ hoveredPixel.hex }}</span>
                  <span class="loupe-name">{{ hoveredPixel.name }}</span>
                </div>
              </div>
            </transition>
          </div>

          <div class="canvas-bottom-hint">
            <Sparkles :size="13" />
            <span>Hover to activate the <b>Magnifier Loupe</b> lens &bull; Click to lock &amp; inspect color</span>
          </div>
        </div>

        <!-- Right Side: Color Inspector & Palettes -->
        <div class="picker-inspector-sidebar">
          <!-- Active Color Hero Card -->
          <div class="active-color-card">
            <div
              class="color-hero-swatch"
              :style="{ backgroundColor: selectedColor.hex, color: contrastInfo.bestText }"
            >
              <div class="hero-swatch-badge">
                <span v-if="selectedColor.isExact" class="exact-badge">Exact Match</span>
                <span v-else class="approx-badge">Closest Match</span>
              </div>
              <div class="hero-swatch-content">
                <h3 class="hero-color-name">{{ selectedColor.name }}</h3>
                <span class="hero-color-hex">{{ selectedColor.hex }}</span>
              </div>
              <button
                type="button"
                class="hero-copy-btn"
                :style="{ backgroundColor: contrastInfo.bestText, color: selectedColor.hex }"
                @click="copyCode(selectedColor.hex, 'HEX')"
              >
                <Check v-if="copiedFormat === 'HEX'" :size="14" />
                <Copy v-else :size="14" />
                <span>{{ copiedFormat === 'HEX' ? 'Copied!' : 'Copy HEX' }}</span>
              </button>
            </div>

            <!-- Color Format Codes Rows -->
            <div class="color-codes-list">
              <!-- HEX -->
              <div class="color-code-row">
                <span class="code-label">HEX</span>
                <span class="code-value">{{ selectedColor.hex }}</span>
                <button
                  type="button"
                  class="code-copy-btn"
                  title="Copy HEX"
                  @click="copyCode(selectedColor.hex, 'HEX')"
                >
                  <Check v-if="copiedFormat === 'HEX'" :size="12" />
                  <Copy v-else :size="12" />
                </button>
              </div>

              <!-- RGB -->
              <div class="color-code-row">
                <span class="code-label">RGB</span>
                <span class="code-value">rgb({{ selectedColor.r }}, {{ selectedColor.g }}, {{ selectedColor.b }})</span>
                <button
                  type="button"
                  class="code-copy-btn"
                  title="Copy RGB"
                  @click="copyCode(`rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`, 'RGB')"
                >
                  <Check v-if="copiedFormat === 'RGB'" :size="12" />
                  <Copy v-else :size="12" />
                </button>
              </div>

              <!-- HSL -->
              <div class="color-code-row">
                <span class="code-label">HSL</span>
                <span class="code-value">{{ selectedColor.hsl.str }}</span>
                <button
                  type="button"
                  class="code-copy-btn"
                  title="Copy HSL"
                  @click="copyCode(selectedColor.hsl.str, 'HSL')"
                >
                  <Check v-if="copiedFormat === 'HSL'" :size="12" />
                  <Copy v-else :size="12" />
                </button>
              </div>

              <!-- HSV -->
              <div class="color-code-row">
                <span class="code-label">HSV</span>
                <span class="code-value">{{ selectedColor.hsv.str }}</span>
                <button
                  type="button"
                  class="code-copy-btn"
                  title="Copy HSV"
                  @click="copyCode(selectedColor.hsv.str, 'HSV')"
                >
                  <Check v-if="copiedFormat === 'HSV'" :size="12" />
                  <Copy v-else :size="12" />
                </button>
              </div>

              <!-- CMYK -->
              <div class="color-code-row">
                <span class="code-label">CMYK</span>
                <span class="code-value">{{ selectedColor.cmyk.str }}</span>
                <button
                  type="button"
                  class="code-copy-btn"
                  title="Copy CMYK"
                  @click="copyCode(selectedColor.cmyk.str, 'CMYK')"
                >
                  <Check v-if="copiedFormat === 'CMYK'" :size="12" />
                  <Copy v-else :size="12" />
                </button>
              </div>
            </div>

            <!-- Tonal Spectrum (Shades & Tints) -->
            <div class="tones-section">
              <label class="section-label">Tints &amp; Shades</label>
              <div class="tones-strip">
                <button
                  v-for="(t, idx) in shadesAndTints"
                  :key="idx"
                  type="button"
                  class="tone-swatch"
                  :class="{ active: t.hex === selectedColor.hex }"
                  :style="{ backgroundColor: t.hex }"
                  :title="`${t.label} (${t.hex})`"
                  @click="selectDirectColor(t.r, t.g, t.b)"
                />
              </div>
            </div>

            <!-- WCAG Contrast Ratio Details -->
            <div class="contrast-badge-row">
              <div class="contrast-item">
                <span class="contrast-title">on White text</span>
                <span class="contrast-val" :class="{ pass: contrastInfo.whiteRatio >= 4.5 }">
                  {{ contrastInfo.whiteRatio }}:1
                  <b v-if="contrastInfo.whiteRatio >= 4.5">PASS</b>
                </span>
              </div>
              <div class="contrast-item">
                <span class="contrast-title">on Dark text</span>
                <span class="contrast-val" :class="{ pass: contrastInfo.blackRatio >= 4.5 }">
                  {{ contrastInfo.blackRatio }}:1
                  <b v-if="contrastInfo.blackRatio >= 4.5">PASS</b>
                </span>
              </div>
            </div>
          </div>

          <!-- Section: Extracted Dominant Colors from Image -->
          <div class="dominant-palette-card">
            <div class="palette-header">
              <span class="palette-title">
                <Palette :size="14" /> Dominant Colors in Image
              </span>
              <span v-if="isExtractingPalette" class="palette-loading">Extracting...</span>
            </div>

            <div v-if="dominantPalette.length > 0" class="dominant-grid">
              <button
                v-for="(c, idx) in dominantPalette"
                :key="idx"
                type="button"
                class="dominant-item-btn"
                :class="{ active: selectedColor.hex === c.hex }"
                @click="selectDirectColor(c.r, c.g, c.b)"
              >
                <span class="dominant-swatch" :style="{ backgroundColor: c.hex }" />
                <div class="dominant-labels">
                  <span class="dominant-hex">{{ c.hex }}</span>
                  <span class="dominant-name">{{ c.name }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Section: Saved Picked Colors History -->
          <div v-if="pickedHistory.length > 0" class="picked-palette-card">
            <div class="palette-header">
              <span class="palette-title">
                <Layers :size="14" /> Picked Palette ({{ pickedHistory.length }})
              </span>
              <div class="palette-actions">
                <button
                  type="button"
                  class="action-mini-btn"
                  title="Copy All Hex"
                  @click="copyAllPickedHex"
                >
                  Copy All
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  class="action-mini-btn"
                  title="Export CSS Variables"
                  @click="exportPaletteCss"
                >
                  CSS
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  class="action-mini-btn"
                  title="Export JSON"
                  @click="exportPaletteJson"
                >
                  JSON
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  class="action-mini-btn danger"
                  title="Clear history"
                  @click="clearPickedPalette"
                >
                  Clear
                </button>
              </div>
            </div>

            <div class="picked-swatches-grid">
              <div
                v-for="item in pickedHistory"
                :key="item.hex"
                class="picked-chip"
                :class="{ active: selectedColor.hex === item.hex }"
                @click="selectDirectColor(item.r, item.g, item.b)"
              >
                <span class="picked-chip-swatch" :style="{ backgroundColor: item.hex }" />
                <span class="picked-chip-hex">{{ item.hex }}</span>
                <button
                  type="button"
                  class="picked-del-btn"
                  title="Remove color"
                  @click.stop="removePaletteItem(item.hex)"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= STAGE 1: UPLOAD DROPZONE ================= -->
    <div
      v-else
      class="upload-dropzone"
      :class="{ dragging: isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="(e) => { isDragging = false; if (e.dataTransfer?.files) handleFileSelect(e.dataTransfer.files); }"
      @click="fileInput?.click()"
    >
      <div class="upload-icon-circle color-picker-circle">
        <Pipette :size="38" />
      </div>

      <h2>Select an image to pick colors</h2>
      <p class="upload-subtitle">
        Drop any photo, graphic, or logo here, paste from clipboard (Ctrl+V), or browse from your device.
      </p>

      <button type="button" class="primary-button select-btn" @click.stop="fileInput?.click()">
        <Upload :size="18" /> Choose Image
      </button>

      <div class="supported-formats-pill">
        <span>JPG</span> &bull; <span>PNG</span> &bull; <span>WebP</span> &bull; <span>SVG</span> &bull; <span>BMP</span> &bull; <span>GIF</span> (Max 50 MB)
      </div>

      <!-- Sample Image Trigger -->
      <div class="sample-trigger-row" @click.stop>
        <span>Want to test right now?</span>
        <button type="button" class="sample-link-btn" @click="loadSampleImage">
          <Sparkles :size="13" /> Try with our colorful sample photo
        </button>
      </div>
    </div>

    <!-- Toast Notification -->
    <transition name="fade">
      <div v-if="notification" class="picker-toast-notice">
        {{ notification }}
      </div>
    </transition>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">
      <CircleAlert :size="16" />
      <span>{{ error }}</span>
      <button type="button" class="banner-close-btn" @click="error = ''">&times;</button>
    </div>
  </div>
</template>

<style scoped>
.color-picker-converter {
  position: relative;
  width: 100%;
}

/* Upload Dropzone */
.upload-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 24px;
  background: var(--card-bg, #ffffff);
  border: 2px dashed var(--border-color, #e2e8f0);
  border-radius: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
}

.upload-dropzone:hover,
.upload-dropzone.dragging {
  border-color: #6366f1;
  background: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 12px 30px -4px rgba(99, 102, 241, 0.15);
}

.upload-icon-circle.color-picker-circle {
  width: 76px;
  height: 76px;
  border-radius: 24px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: #ffffff;
  display: grid;
  place-items: center;
  margin-bottom: 20px;
  box-shadow: 0 10px 25px -4px rgba(99, 102, 241, 0.35);
}

.upload-dropzone h2 {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-color, #0f172a);
  margin: 0 0 8px;
}

.upload-subtitle {
  font-size: 14px;
  color: var(--muted, #64748b);
  max-width: 520px;
  margin: 0 0 24px;
  line-height: 1.5;
}

.select-btn {
  margin-bottom: 20px;
  padding: 13px 32px;
  font-size: 15px;
  font-weight: 700;
}

.supported-formats-pill {
  font-size: 12px;
  color: var(--muted, #64748b);
  padding: 6px 14px;
  background: var(--chip-bg, #f1f5f9);
  border-radius: 20px;
  margin-bottom: 16px;
}

.sample-trigger-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted, #64748b);
  margin-top: 4px;
}

.sample-link-btn {
  background: none;
  border: none;
  color: #6366f1;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.sample-link-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  text-decoration: underline;
}

/* Workspace Layout */
.picker-workspace {
  background: var(--card-bg, #ffffff);
  border-radius: 24px;
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: 0 8px 30px -4px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.picker-top-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: var(--toolbar-bg, #f8fafc);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  gap: 12px;
  flex-wrap: wrap;
}

.organize-files-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.files-summary-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-color, #0f172a);
}

.active-color-mini-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px;
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
  font-size: 12px;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.organize-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.tool-action-btn.primary-subtle {
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
}

.tool-action-btn.primary-subtle:hover {
  background: #6366f1;
  color: #ffffff;
}

.tool-action-btn.secondary {
  background: var(--card-bg, #ffffff);
  border-color: var(--border-color, #cbd5e1);
  color: var(--text-color, #334155);
}

.tool-action-btn.secondary:hover {
  background: #f1f5f9;
}

.tool-action-btn.icon-only.clear-btn {
  padding: 7px;
  background: #f1f5f9;
  color: #64748b;
}

.tool-action-btn.icon-only.clear-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* Main Grid */
.picker-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 1fr);
  gap: 0;
  min-height: 580px;
}

@media (max-width: 980px) {
  .picker-main-grid {
    grid-template-columns: 1fr;
  }
}

/* Canvas Column */
.picker-canvas-card {
  display: flex;
  flex-direction: column;
  background: var(--preview-bg, #0b1120);
  border-right: 1px solid var(--border-color, #e2e8f0);
  position: relative;
  overflow: hidden;
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 12px;
  z-index: 5;
}

.toolbar-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #cbd5e1;
}

.toolbar-zoom-group {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 8px;
}

.zoom-btn {
  background: none;
  border: none;
  color: #ffffff;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.zoom-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.zoom-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.zoom-level-text {
  font-size: 11px;
  font-weight: 700;
  min-width: 36px;
  text-align: center;
}

.zoom-reset-btn {
  background: none;
  border: none;
  color: #93c5fd;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  padding: 2px 6px;
}

.zoom-reset-btn:hover {
  text-decoration: underline;
}

.picker-canvas-viewport {
  position: relative;
  flex: 1;
  display: grid;
  place-items: center;
  padding: 20px;
  overflow: auto;
  cursor: crosshair;
  user-select: none;
}

.canvas-transform-layer {
  transition: transform 0.15s ease-out;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-main-canvas {
  max-width: 100%;
  max-height: 520px;
  width: auto;
  height: auto;
  display: block;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

.canvas-bottom-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(15, 23, 42, 0.85);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
}

/* Floating Magnifier Loupe */
.magnifier-loupe-card {
  position: absolute;
  pointer-events: none;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: drop-shadow(0 14px 25px rgba(0, 0, 0, 0.45));
}

.loupe-lens-wrap {
  position: relative;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.3);
}

.loupe-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.loupe-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 4px solid #ffffff;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.4);
}

.loupe-info-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  color: #ffffff;
  margin-top: 6px;
  font-size: 11px;
  white-space: nowrap;
}

.loupe-swatch {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid #ffffff;
}

.loupe-hex {
  font-weight: 800;
  font-family: monospace;
}

.loupe-name {
  color: #94a3b8;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Inspector Sidebar */
.picker-inspector-sidebar {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: var(--card-bg, #ffffff);
  overflow-y: auto;
  max-height: 680px;
}

/* Active Color Card */
.active-color-card {
  background: #f8fafc;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 20px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.color-hero-swatch {
  position: relative;
  padding: 24px 20px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 140px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1), 0 8px 20px -4px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.hero-swatch-badge {
  display: flex;
  justify-content: flex-end;
}

.exact-badge,
.approx-badge {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  color: #ffffff;
}

.hero-swatch-content {
  margin: 12px 0;
}

.hero-color-name {
  font-size: 22px;
  font-weight: 900;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.hero-color-hex {
  font-size: 15px;
  font-family: monospace;
  font-weight: 700;
  opacity: 0.9;
  display: block;
  margin-top: 4px;
}

.hero-copy-btn {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 800;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease;
}

.hero-copy-btn:hover {
  transform: scale(1.04);
}

/* Color Codes Rows */
.color-codes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-code-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  font-size: 13px;
}

.code-label {
  font-weight: 800;
  color: var(--muted, #64748b);
  width: 46px;
  font-size: 11px;
}

.code-value {
  font-family: monospace;
  font-weight: 700;
  color: var(--text-color, #0f172a);
  flex: 1;
  text-align: left;
}

.code-copy-btn {
  background: #f1f5f9;
  border: none;
  color: #475569;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.15s ease;
}

.code-copy-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* Tones Section */
.tones-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 12px;
  font-weight: 800;
  color: var(--muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}

.tones-strip {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.tone-swatch {
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.tone-swatch:hover {
  transform: scale(1.12);
  z-index: 2;
}

.tone-swatch.active {
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #6366f1;
}

/* Contrast Badges */
.contrast-badge-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.contrast-item {
  padding: 8px 10px;
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contrast-title {
  font-size: 11px;
  color: var(--muted, #64748b);
}

.contrast-val {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-color, #0f172a);
  display: flex;
  align-items: center;
  gap: 6px;
}

.contrast-val b {
  font-size: 10px;
  background: #dcfce7;
  color: #15803d;
  padding: 1px 5px;
  border-radius: 4px;
}

/* Dominant Colors Card */
.dominant-palette-card,
.picked-palette-card {
  background: #f8fafc;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 20px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.palette-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.palette-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
  color: var(--text-color, #0f172a);
}

.palette-loading {
  font-size: 11px;
  color: #6366f1;
  font-weight: 700;
}

.dominant-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.dominant-item-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.dominant-item-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.dominant-item-btn.active {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.dominant-swatch {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.dominant-labels {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dominant-hex {
  font-size: 12px;
  font-weight: 800;
  font-family: monospace;
  color: var(--text-color, #0f172a);
}

.dominant-name {
  font-size: 10px;
  color: var(--muted, #64748b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Picked Palette Card */
.palette-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.action-mini-btn {
  background: none;
  border: none;
  color: #6366f1;
  font-weight: 700;
  cursor: pointer;
  padding: 2px 4px;
}

.action-mini-btn:hover {
  text-decoration: underline;
}

.action-mini-btn.danger {
  color: #ef4444;
}

.picked-swatches-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.picked-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.15s ease;
}

.picked-chip:hover {
  border-color: #94a3b8;
}

.picked-chip.active {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
}

.picked-chip-swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.picked-chip-hex {
  font-family: monospace;
  font-weight: 700;
  color: var(--text-color, #0f172a);
}

.picked-del-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
}

.picked-del-btn:hover {
  color: #ef4444;
}

/* Toast Notice */
.picker-toast-notice {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: #ffffff;
  padding: 10px 22px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
  z-index: 100;
}

.error-banner {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
}

.banner-close-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #991b1b;
  font-size: 18px;
  cursor: pointer;
}

/* Animations */
.pop-fade-enter-active,
.pop-fade-leave-active {
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.pop-fade-enter-from,
.pop-fade-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

