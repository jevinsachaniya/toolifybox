<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  CircleAlert,
  Clipboard,
  Copy,
  Download,
  Eraser,
  Eye,
  FileImage,
  Image as ImageIcon,
  Layers,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Paintbrush,
  Pipette,
  Redo,
  RefreshCw,
  RotateCcw,
  Scissors,
  ShieldCheck,
  Sliders,
  Sparkles,
  Undo,
  UploadCloud,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from '@lucide/vue';
import {
  autoDetectBackgroundColor,
  blobToImage,
  canvasToBlob,
  copyImageToClipboard,
  renderCompositeCanvas,
  removeBackgroundAI,
  removeBackgroundColorKey,
  samplePixelColor,
} from '~/utils/remove-background';

// State
const file = ref(null);
const fileUrl = ref('');
const originalImage = ref(null);
const originalWidth = ref(0);
const originalHeight = ref(0);
const originalCanvas = ref(null);

// Cutout / Processing State
const cutoutCanvas = ref(null);
const history = ref([]);
const historyIndex = ref(-1);
const isProcessing = ref(false);
const progressMessage = ref('');
const progressPercent = ref(0);
const errorMessage = ref('');
const toastMessage = ref('');
let toastTimer = null;

// Modes: 'ai' | 'color' | 'brush'
const activeMode = ref('ai');
const viewMode = ref('cutout'); // 'cutout' (default) | 'split' | 'original'
const splitPosition = ref(50); // percentage 0 - 100
const isDraggingSplit = ref(false);

// Color Key Parameters
const targetColor = ref('#ffffff');
const colorTolerance = ref(35);
const colorMode = ref('flood'); // 'flood' | 'global'
const colorFeather = ref(2);
const isPickingColor = ref(false);

// Brush Parameters
const brushMode = ref('erase'); // 'erase' | 'restore'
const brushSize = ref(25);
const brushHardness = ref(80);
const isPainting = ref(false);

// Background Replacement
const bgType = ref('transparent'); // 'transparent' | 'color' | 'blur' | 'image'
const bgColor = ref('#ffffff');
const bgBlurRadius = ref(16);
const customBgImage = ref(null);

// Export
const exportFormat = ref('png'); // 'png' | 'webp' | 'jpg'
const outputFilename = ref('');
const zoomLevel = ref(1);

// Canvas DOM references
const viewportRef = ref(null);
const displayCanvasRef = ref(null);

const colorPresets = [
  '#ffffff',
  '#000000',
  '#f1f5f9',
  '#e2e8f0',
  '#e11d48',
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
];

const formattedDimensions = computed(() => {
  if (!originalWidth.value || !originalHeight.value) return '';
  return `${originalWidth.value} × ${originalHeight.value} px`;
});

function showToast(msg) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
}

function handleFileSelect(e) {
  const selected = e.target.files?.[0];
  if (selected) loadFile(selected);
}

function handleDrop(e) {
  e.preventDefault();
  const dropped = e.dataTransfer?.files?.[0];
  if (dropped) loadFile(dropped);
}

async function loadFile(f) {
  if (!f.type.startsWith('image/')) {
    errorMessage.value = 'Please select a valid image file (PNG, JPG, WebP, etc.).';
    return;
  }

  errorMessage.value = '';
  file.value = f;
  fileUrl.value = URL.createObjectURL(f);
  outputFilename.value = f.name.replace(/\.[^.]+$/, '') + '-cutout';

  try {
    const img = await blobToImage(f);
    originalImage.value = img;
    originalWidth.value = img.naturalWidth || img.width;
    originalHeight.value = img.naturalHeight || img.height;

    // Create original offscreen canvas
    const origCanv = document.createElement('canvas');
    origCanv.width = originalWidth.value;
    origCanv.height = originalHeight.value;
    const origCtx = origCanv.getContext('2d');
    origCtx.drawImage(img, 0, 0);
    originalCanvas.value = origCanv;

    // Initialize cutout canvas with instant smart edge-aware background cutout
    const cutCanv = document.createElement('canvas');
    cutCanv.width = originalWidth.value;
    cutCanv.height = originalHeight.value;

    const detectedBg = autoDetectBackgroundColor(origCanv);
    targetColor.value = detectedBg.hex;

    const instantCutout = removeBackgroundColorKey(origCanv, {
      targetColor: detectedBg.hex,
      mode: 'flood',
      tolerance: 35,
      feather: 2,
    });
    const cutCtx = cutCanv.getContext('2d');
    cutCtx.putImageData(instantCutout, 0, 0);
    cutoutCanvas.value = cutCanv;

    history.value = [];
    historyIndex.value = -1;
    saveHistoryState();

    nextTick(() => {
      renderViewport();
      // Auto run deep neural segmentation to further refine fine details
      triggerAiRemoval();
    });
  } catch (err) {
    errorMessage.value = 'Failed to read image file: ' + err.message;
  }
}

function saveHistoryState() {
  if (!cutoutCanvas.value) return;
  const ctx = cutoutCanvas.value.getContext('2d');
  const snapshot = ctx.getImageData(0, 0, cutoutCanvas.value.width, cutoutCanvas.value.height);

  // If undo-ed and now doing new action, prune forward history
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }

  // Keep max 15 snapshots
  if (history.value.length >= 15) {
    history.value.shift();
  } else {
    historyIndex.value++;
  }
  history.value.push(snapshot);
}

function handleUndo() {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    const snapshot = history.value[historyIndex.value];
    const ctx = cutoutCanvas.value.getContext('2d');
    ctx.putImageData(snapshot, 0, 0);
    renderViewport();
    showToast('Undo action');
  }
}

function handleRedo() {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++;
    const snapshot = history.value[historyIndex.value];
    const ctx = cutoutCanvas.value.getContext('2d');
    ctx.putImageData(snapshot, 0, 0);
    renderViewport();
    showToast('Redo action');
  }
}

async function triggerAiRemoval() {
  if (!file.value || isProcessing.value) return;
  isProcessing.value = true;
  progressPercent.value = 5;
  progressMessage.value = 'Preparing neural engine...';
  errorMessage.value = '';

  try {
    const resultBlob = await removeBackgroundAI(file.value, (data) => {
      progressMessage.value = data.message;
      progressPercent.value = data.percent;
    });

    const cutoutImg = await blobToImage(resultBlob);
    const ctx = cutoutCanvas.value.getContext('2d');
    ctx.clearRect(0, 0, cutoutCanvas.value.width, cutoutCanvas.value.height);
    ctx.drawImage(cutoutImg, 0, 0, cutoutCanvas.value.width, cutoutCanvas.value.height);

    saveHistoryState();
    renderViewport();
    showToast('Background successfully removed!');
  } catch (err) {
    errorMessage.value = '';
    showToast('Cutout ready via Instant Smart Detection');
  } finally {
    isProcessing.value = false;
  }
}

function applyColorKey() {
  if (!originalCanvas.value || isProcessing.value) return;
  isProcessing.value = true;
  progressMessage.value = 'Processing color cutout...';

  setTimeout(() => {
    try {
      const resultImageData = removeBackgroundColorKey(originalCanvas.value, {
        targetColor: targetColor.value,
        tolerance: colorTolerance.value,
        mode: colorMode.value,
        feather: colorFeather.value,
      });

      const ctx = cutoutCanvas.value.getContext('2d');
      ctx.clearRect(0, 0, cutoutCanvas.value.width, cutoutCanvas.value.height);
      ctx.putImageData(resultImageData, 0, 0);

      saveHistoryState();
      renderViewport();
      showToast('Color key applied!');
    } catch (err) {
      errorMessage.value = 'Failed to apply color key: ' + err.message;
    } finally {
      isProcessing.value = false;
    }
  }, 20);
}

function handleCustomBgUpload(e) {
  const f = e.target.files?.[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    customBgImage.value = img;
    bgType.value = 'image';
    renderViewport();
  };
  img.src = url;
}

// Interactive Viewport Rendering
function renderViewport() {
  if (!displayCanvasRef.value || !cutoutCanvas.value || !originalCanvas.value) return;
  const canvas = displayCanvasRef.value;
  const ctx = canvas.getContext('2d');

  const w = cutoutCanvas.value.width;
  const h = cutoutCanvas.value.height;
  canvas.width = w;
  canvas.height = h;

  // Composite staged background
  const composite = renderCompositeCanvas({
    cutoutCanvas: cutoutCanvas.value,
    originalCanvas: originalCanvas.value,
    bgType: bgType.value,
    bgColor: bgColor.value,
    bgBlurRadius: bgBlurRadius.value,
    bgImage: customBgImage.value,
  });

  if (viewMode.value === 'original') {
    ctx.drawImage(originalCanvas.value, 0, 0);
  } else if (viewMode.value === 'cutout') {
    ctx.drawImage(composite, 0, 0);
  } else if (viewMode.value === 'split') {
    // Draw composite background & cutout on right
    ctx.drawImage(composite, 0, 0);

    // Draw original image on left side clipped by splitPosition
    const splitX = (splitPosition.value / 100) * w;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, h);
    ctx.clip();
    ctx.drawImage(originalCanvas.value, 0, 0);
    ctx.restore();

    // Draw vertical divider line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, Math.round(w / 350));
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, h);
    ctx.stroke();
  }
}

// Mouse / Touch handlers for Split Dragging, Eyedropper, and Brush
function getCanvasCoordinates(e) {
  if (!displayCanvasRef.value) return { x: 0, y: 0 };
  const rect = displayCanvasRef.value.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const scaleX = displayCanvasRef.value.width / rect.width;
  const scaleY = displayCanvasRef.value.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
    rawX: clientX - rect.left,
    rawY: clientY - rect.top,
    rectWidth: rect.width,
  };
}

function handleCanvasMouseDown(e) {
  if (isPickingColor.value && originalCanvas.value) {
    const { x, y } = getCanvasCoordinates(e);
    const sampled = samplePixelColor(originalCanvas.value, x, y);
    targetColor.value = sampled.hex;
    isPickingColor.value = false;
    showToast(`Sampled color: ${sampled.hex}`);
    applyColorKey();
    return;
  }

  if (activeMode.value === 'brush') {
    isPainting.value = true;
    paintBrushAt(e);
    return;
  }

  if (viewMode.value === 'split') {
    isDraggingSplit.value = true;
    updateSplitFromEvent(e);
  }
}

function handleCanvasMouseMove(e) {
  if (isPainting.value && activeMode.value === 'brush') {
    paintBrushAt(e);
    return;
  }

  if (isDraggingSplit.value && viewMode.value === 'split') {
    updateSplitFromEvent(e);
  }
}

function handleCanvasMouseUp() {
  if (isPainting.value) {
    isPainting.value = false;
    saveHistoryState();
  }
  isDraggingSplit.value = false;
}

function updateSplitFromEvent(e) {
  if (!displayCanvasRef.value) return;
  const rect = displayCanvasRef.value.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  splitPosition.value = Math.round(pct);
  renderViewport();
}

function paintBrushAt(e) {
  if (!cutoutCanvas.value || !originalCanvas.value) return;
  const { x, y } = getCanvasCoordinates(e);
  const ctx = cutoutCanvas.value.getContext('2d');

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, brushSize.value, 0, Math.PI * 2);

  if (brushMode.value === 'erase') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${brushHardness.value / 100})`;
    ctx.fill();
  } else {
    // Restore original pixels
    ctx.clip();
    ctx.drawImage(originalCanvas.value, 0, 0);
  }
  ctx.restore();

  renderViewport();
}

// Download & Clipboard
async function handleDownload() {
  if (!cutoutCanvas.value) return;
  const composite = renderCompositeCanvas({
    cutoutCanvas: cutoutCanvas.value,
    originalCanvas: originalCanvas.value,
    bgType: bgType.value,
    bgColor: bgColor.value,
    bgBlurRadius: bgBlurRadius.value,
    bgImage: customBgImage.value,
  });

  const mimeType = exportFormat.value === 'jpg' ? 'image/jpeg' : (exportFormat.value === 'webp' ? 'image/webp' : 'image/png');
  const blob = await canvasToBlob(composite, mimeType, 0.95);
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${outputFilename.value || 'cutout'}.${exportFormat.value}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Image downloaded successfully!');
}

async function handleCopy() {
  if (!cutoutCanvas.value) return;
  const composite = renderCompositeCanvas({
    cutoutCanvas: cutoutCanvas.value,
    originalCanvas: originalCanvas.value,
    bgType: bgType.value,
    bgColor: bgColor.value,
    bgBlurRadius: bgBlurRadius.value,
    bgImage: customBgImage.value,
  });

  const blob = await canvasToBlob(composite, 'image/png');
  if (!blob) return;

  try {
    await copyImageToClipboard(blob);
    showToast('Cutout copied to clipboard! (PNG)');
  } catch (err) {
    showToast(err.message || 'Copy failed. Try downloading instead.');
  }
}

function resetAll() {
  file.value = null;
  fileUrl.value = '';
  originalImage.value = null;
  cutoutCanvas.value = null;
  history.value = [];
  historyIndex.value = -1;
  errorMessage.value = '';
}

watch([bgType, bgColor, bgBlurRadius, viewMode], () => {
  renderViewport();
});

onMounted(() => {
  const pasteHandler = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) loadFile(blob);
          break;
        }
      }
    }
  };
  window.addEventListener('paste', pasteHandler);
  window.addEventListener('mouseup', handleCanvasMouseUp);
  window.addEventListener('touchend', handleCanvasMouseUp);

  onBeforeUnmount(() => {
    window.removeEventListener('paste', pasteHandler);
    window.removeEventListener('mouseup', handleCanvasMouseUp);
    window.removeEventListener('touchend', handleCanvasMouseUp);
    if (toastTimer) clearTimeout(toastTimer);
  });
});
</script>

<template>
  <div class="remove-bg-container">
    <!-- Initial Upload Dropzone -->
    <div
      v-if="!file"
      class="upload-dropzone-card"
      @dragover.prevent
      @dragenter.prevent
      @drop="handleDrop"
    >
      <div class="upload-icon-circle">
        <Sparkles class="sparkle-icon" :size="32" />
      </div>
      <h3 class="upload-title">Remove Image Background Instantly</h3>
      <p class="upload-subtitle">
        100% automatic, client-side AI background remover. Supports PNG, JPG, WebP, and photos up to 35 MB.
      </p>

      <div class="upload-actions">
        <label class="choose-file-btn">
          <UploadCloud :size="18" />
          <span>Select Image</span>
          <input
            type="file"
            accept="image/*"
            class="hidden-file-input"
            @change="handleFileSelect"
          />
        </label>
        <span class="or-paste-text">or press <code>Ctrl+V</code> to paste from clipboard</span>
      </div>

      <div class="privacy-pill">
        <ShieldCheck :size="15" />
        <span>Processed locally on your device. Zero cloud uploads.</span>
      </div>
    </div>

    <!-- Active Studio View -->
    <div v-else class="remove-bg-studio">
      <!-- Studio Header / Toolbar -->
      <div class="studio-header-bar">
        <div class="left-tools">
          <div class="mode-segmented-pill">
            <button
              type="button"
              class="seg-btn"
              :class="{ active: activeMode === 'ai' }"
              @click="activeMode = 'ai'"
            >
              <Wand2 :size="14" />
              <span>AI Auto</span>
            </button>
            <button
              type="button"
              class="seg-btn"
              :class="{ active: activeMode === 'color' }"
              @click="activeMode = 'color'"
            >
              <Pipette :size="14" />
              <span>Color Key</span>
            </button>
            <button
              type="button"
              class="seg-btn"
              :class="{ active: activeMode === 'brush' }"
              @click="activeMode = 'brush'"
            >
              <Paintbrush :size="14" />
              <span>Refine Brush</span>
            </button>
          </div>

          <!-- Undo / Redo -->
          <div class="history-btn-group">
            <button
              type="button"
              class="icon-action-btn"
              title="Undo"
              :disabled="historyIndex <= 0"
              @click="handleUndo"
            >
              <Undo :size="15" />
            </button>
            <button
              type="button"
              class="icon-action-btn"
              title="Redo"
              :disabled="historyIndex >= history.length - 1"
              @click="handleRedo"
            >
              <Redo :size="15" />
            </button>
          </div>
        </div>

        <!-- View Mode Switcher -->
        <div class="right-views">
          <div class="view-segmented-pill">
            <button
              type="button"
              class="seg-view-btn"
              :class="{ active: viewMode === 'split' }"
              title="Before / After Split Comparison"
              @click="viewMode = 'split'"
            >
              <ArrowLeftRight :size="14" />
              <span>Split View</span>
            </button>
            <button
              type="button"
              class="seg-view-btn"
              :class="{ active: viewMode === 'cutout' }"
              title="Cutout View"
              @click="viewMode = 'cutout'"
            >
              <Scissors :size="14" />
              <span>Cutout</span>
            </button>
            <button
              type="button"
              class="seg-view-btn"
              :class="{ active: viewMode === 'original' }"
              title="Original Image"
              @click="viewMode = 'original'"
            >
              <Eye :size="14" />
              <span>Original</span>
            </button>
          </div>

          <button type="button" class="reset-link-btn" @click="resetAll">
            <X :size="15" />
            <span>New Image</span>
          </button>
        </div>
      </div>

      <!-- Studio Body Split Layout -->
      <div class="studio-workspace-grid">
        <!-- Main Canvas Viewport Area -->
        <div ref="viewportRef" class="canvas-viewport-card">
          <!-- Checkerboard container -->
          <div
            class="viewport-canvas-wrapper"
            :class="{ 'is-eyedropper': isPickingColor, 'is-brush': activeMode === 'brush' }"
          >
            <canvas
              ref="displayCanvasRef"
              class="display-canvas"
              @mousedown="handleCanvasMouseDown"
              @mousemove="handleCanvasMouseMove"
              @touchstart.passive="handleCanvasMouseDown"
              @touchmove.passive="handleCanvasMouseMove"
            />

            <!-- Split slider helper instruction -->
            <div v-if="viewMode === 'split'" class="split-slider-tip">
              <span>← Drag slider to compare before / after →</span>
            </div>
          </div>

          <!-- Bottom Dimensions / Zoom bar -->
          <div class="viewport-status-bar">
            <span class="file-dim-pill">{{ formattedDimensions }}</span>
            <div class="zoom-pill">
              <span>100%</span>
            </div>
          </div>
        </div>

        <!-- Controls Sidebar -->
        <div class="studio-sidebar-controls">
          <!-- Active Mode Options Card -->
          <div class="control-box">
            <!-- Mode 1: AI Auto Cutout -->
            <div v-if="activeMode === 'ai'" class="mode-panel">
              <h4 class="panel-heading">
                <Wand2 :size="16" />
                <span>AI Background Removal</span>
              </h4>
              <p class="panel-desc">
                Uses in-browser deep neural network segmentation to isolate people, products, animals, and objects.
              </p>

              <button
                type="button"
                class="primary-action-btn"
                :disabled="isProcessing"
                @click="triggerAiRemoval"
              >
                <LoaderCircle v-if="isProcessing" class="spin-icon" :size="16" />
                <Sparkles v-else :size="16" />
                <span>{{ isProcessing ? 'Segmenting Image...' : 'Re-Run AI Removal' }}</span>
              </button>

              <div v-if="isProcessing" class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: `${progressPercent}%` }" />
                </div>
                <span class="progress-label">{{ progressMessage }}</span>
              </div>
            </div>

            <!-- Mode 2: Color / Chroma Key -->
            <div v-else-if="activeMode === 'color'" class="mode-panel">
              <h4 class="panel-heading">
                <Pipette :size="16" />
                <span>Instant Color &amp; Chroma Key</span>
              </h4>
              <p class="panel-desc">
                Instant 0ms cutout for white/solid backgrounds, signatures, and logos.
              </p>

              <div class="control-field">
                <label class="field-title">Key Color</label>
                <div class="color-picker-row">
                  <input v-model="targetColor" type="color" class="color-swatch-input" />
                  <input v-model="targetColor" type="text" class="color-hex-text" maxlength="7" />
                  <button
                    type="button"
                    class="eyedropper-btn"
                    :class="{ active: isPickingColor }"
                    @click="isPickingColor = !isPickingColor"
                  >
                    <Pipette :size="14" />
                    <span>{{ isPickingColor ? 'Click Image...' : 'Sample' }}</span>
                  </button>
                </div>
              </div>

              <div class="control-field">
                <div class="field-title-split">
                  <span>Color Tolerance</span>
                  <b>{{ colorTolerance }}%</b>
                </div>
                <input
                  v-model.number="colorTolerance"
                  type="range"
                  min="5"
                  max="90"
                  class="range-slider"
                  @change="applyColorKey"
                />
              </div>

              <div class="control-field">
                <div class="field-title-split">
                  <span>Edge Feathering</span>
                  <b>{{ colorFeather }} px</b>
                </div>
                <input
                  v-model.number="colorFeather"
                  type="range"
                  min="0"
                  max="6"
                  class="range-slider"
                  @change="applyColorKey"
                />
              </div>

              <div class="control-field">
                <label class="field-title">Detection Method</label>
                <div class="radio-toggle-group">
                  <button
                    type="button"
                    class="radio-btn"
                    :class="{ active: colorMode === 'flood' }"
                    @click="colorMode = 'flood'; applyColorKey()"
                  >
                    Outer Edges (Flood Fill)
                  </button>
                  <button
                    type="button"
                    class="radio-btn"
                    :class="{ active: colorMode === 'global' }"
                    @click="colorMode = 'global'; applyColorKey()"
                  >
                    All Matching Pixels
                  </button>
                </div>
              </div>

              <button type="button" class="apply-color-btn" @click="applyColorKey">
                Apply Color Cutout
              </button>
            </div>

            <!-- Mode 3: Refine Brush -->
            <div v-else class="mode-panel">
              <h4 class="panel-heading">
                <Paintbrush :size="16" />
                <span>Refine Brush</span>
              </h4>
              <p class="panel-desc">
                Paint directly on the preview to erase stray pixels or restore original details.
              </p>

              <div class="control-field">
                <label class="field-title">Brush Tool</label>
                <div class="radio-toggle-group">
                  <button
                    type="button"
                    class="radio-btn"
                    :class="{ active: brushMode === 'erase' }"
                    @click="brushMode = 'erase'"
                  >
                    <Eraser :size="14" />
                    <span>Erase</span>
                  </button>
                  <button
                    type="button"
                    class="radio-btn"
                    :class="{ active: brushMode === 'restore' }"
                    @click="brushMode = 'restore'"
                  >
                    <RotateCcw :size="14" />
                    <span>Restore</span>
                  </button>
                </div>
              </div>

              <div class="control-field">
                <div class="field-title-split">
                  <span>Brush Radius</span>
                  <b>{{ brushSize }} px</b>
                </div>
                <input
                  v-model.number="brushSize"
                  type="range"
                  min="5"
                  max="80"
                  class="range-slider"
                />
              </div>

              <div class="control-field">
                <div class="field-title-split">
                  <span>Hardness</span>
                  <b>{{ brushHardness }}%</b>
                </div>
                <input
                  v-model.number="brushHardness"
                  type="range"
                  min="10"
                  max="100"
                  class="range-slider"
                />
              </div>
            </div>
          </div>

          <!-- Background Staging Card -->
          <div class="control-box">
            <h4 class="panel-heading">
              <Layers :size="16" />
              <span>Background Staging</span>
            </h4>

            <div class="bg-type-selector">
              <button
                type="button"
                class="bg-type-btn"
                :class="{ active: bgType === 'transparent' }"
                @click="bgType = 'transparent'"
              >
                <span>Transparent</span>
              </button>
              <button
                type="button"
                class="bg-type-btn"
                :class="{ active: bgType === 'color' }"
                @click="bgType = 'color'"
              >
                <span>Color</span>
              </button>
              <button
                type="button"
                class="bg-type-btn"
                :class="{ active: bgType === 'blur' }"
                @click="bgType = 'blur'"
              >
                <span>Blur</span>
              </button>
            </div>

            <!-- Solid Color Swatches -->
            <div v-if="bgType === 'color'" class="bg-color-picker-stage">
              <div class="swatches-grid">
                <button
                  v-for="c in colorPresets"
                  :key="c"
                  type="button"
                  class="swatch-circle"
                  :style="{ backgroundColor: c }"
                  :class="{ active: bgColor.toLowerCase() === c.toLowerCase() }"
                  @click="bgColor = c"
                />
              </div>
              <div class="custom-color-input-row">
                <input v-model="bgColor" type="color" class="color-swatch-input" />
                <input v-model="bgColor" type="text" class="color-hex-text" maxlength="7" />
              </div>
            </div>

            <!-- Background Blur Slider -->
            <div v-else-if="bgType === 'blur'" class="control-field">
              <div class="field-title-split">
                <span>Blur Radius</span>
                <b>{{ bgBlurRadius }} px</b>
              </div>
              <input
                v-model.number="bgBlurRadius"
                type="range"
                min="4"
                max="32"
                class="range-slider"
              />
            </div>
          </div>

          <!-- Export & Download Card -->
          <div class="control-box export-box">
            <h4 class="panel-heading">
              <Download :size="16" />
              <span>Export Cutout</span>
            </h4>

            <div class="format-toggle-row">
              <label class="field-title">Format</label>
              <div class="format-pills">
                <button
                  type="button"
                  class="fmt-btn"
                  :class="{ active: exportFormat === 'png' }"
                  @click="exportFormat = 'png'"
                >
                  PNG
                </button>
                <button
                  type="button"
                  class="fmt-btn"
                  :class="{ active: exportFormat === 'webp' }"
                  @click="exportFormat = 'webp'"
                >
                  WebP
                </button>
                <button
                  type="button"
                  class="fmt-btn"
                  :class="{ active: exportFormat === 'jpg' }"
                  @click="exportFormat = 'jpg'"
                >
                  JPG
                </button>
              </div>
            </div>

            <div class="action-buttons-stack">
              <button type="button" class="copy-clipboard-btn" @click="handleCopy">
                <Copy :size="16" />
                <span>Copy to Clipboard</span>
              </button>

              <button type="button" class="download-main-btn" @click="handleDownload">
                <Download :size="16" />
                <span>Download Cutout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Toast Notification -->
    <Transition name="fade">
      <div v-if="toastMessage" class="toast-pill">
        <Check :size="15" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.remove-bg-container {
  width: 100%;
  margin: 0 auto;
}

/* Dropzone Card */
.upload-dropzone-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 64px 32px;
  background: var(--surface, #ffffff);
  border: 2px dashed var(--border, #e2e8f0);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}
html[data-theme='dark'] .upload-dropzone-card {
  background: #0f172a;
  border-color: #334155;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}
.upload-dropzone-card:hover {
  border-color: #e11d48;
  transform: translateY(-2px);
}
.upload-icon-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #fff1f2;
  color: #e11d48;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
html[data-theme='dark'] .upload-icon-circle {
  background: rgba(225, 29, 72, 0.15);
}
.upload-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--text, #0f172a);
  margin-bottom: 8px;
}
html[data-theme='dark'] .upload-title {
  color: #f8fafc;
}
.upload-subtitle {
  font-size: 14px;
  color: var(--text-muted, #64748b);
  max-width: 500px;
  line-height: 1.6;
  margin-bottom: 28px;
}
html[data-theme='dark'] .upload-subtitle {
  color: #94a3b8;
}
.upload-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.choose-file-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #e11d48;
  color: #ffffff;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(225, 29, 72, 0.35);
  transition: all 0.15s ease;
}
.choose-file-btn:hover {
  background: #be123c;
  transform: translateY(-1px);
}
.hidden-file-input {
  display: none;
}
.or-paste-text {
  font-size: 13px;
  color: var(--text-muted, #64748b);
}
.or-paste-text code {
  background: var(--surface-muted, #f1f5f9);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}
html[data-theme='dark'] .or-paste-text code {
  background: #1e293b;
  color: #cbd5e1;
}
.privacy-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 36px;
  padding: 6px 14px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #9f1239;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
html[data-theme='dark'] .privacy-pill {
  background: rgba(225, 29, 72, 0.1);
  border-color: #881337;
  color: #fecdd3;
}

/* Studio Layout */
.remove-bg-studio {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.studio-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 18px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
}
html[data-theme='dark'] .studio-header-bar {
  background: #0f172a;
  border-color: #334155;
}
.left-tools, .right-views {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mode-segmented-pill, .view-segmented-pill {
  display: inline-flex;
  padding: 3px;
  background: var(--surface-muted, #f1f5f9);
  border-radius: 10px;
  gap: 2px;
}
html[data-theme='dark'] .mode-segmented-pill,
html[data-theme='dark'] .view-segmented-pill {
  background: #1e293b;
}
.seg-btn, .seg-view-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: none;
  background: transparent;
  color: var(--text-muted, #64748b);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
html[data-theme='dark'] .seg-btn,
html[data-theme='dark'] .seg-view-btn {
  color: #94a3b8;
}
.seg-btn.active, .seg-view-btn.active {
  background: #e11d48;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(225, 29, 72, 0.25);
}
.history-btn-group {
  display: inline-flex;
  gap: 4px;
}
.icon-action-btn {
  padding: 8px;
  border: 1px solid var(--border, #e2e8f0);
  background: var(--surface);
  color: var(--text-muted, #64748b);
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
html[data-theme='dark'] .icon-action-btn {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}
.icon-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.reset-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--border, #e2e8f0);
  background: transparent;
  color: #e11d48;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
}
html[data-theme='dark'] .reset-link-btn {
  border-color: #334155;
}

/* Studio Workspace Grid */
.studio-workspace-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 18px;
  align-items: start;
}
@media (max-width: 960px) {
  .studio-workspace-grid {
    grid-template-columns: 1fr;
  }
}

/* Canvas Viewport */
.canvas-viewport-card {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
html[data-theme='dark'] .canvas-viewport-card {
  background: #0f172a;
  border-color: #334155;
}
.viewport-canvas-wrapper {
  position: relative;
  width: 100%;
  min-height: 440px;
  max-height: 650px;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Transparency Checkerboard */
  background-color: #f8fafc;
  background-image: 
    linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
    linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
}
html[data-theme='dark'] .viewport-canvas-wrapper {
  background-color: #1e293b;
  background-image: 
    linear-gradient(45deg, #0f172a 25%, transparent 25%),
    linear-gradient(-45deg, #0f172a 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #0f172a 75%),
    linear-gradient(-45deg, transparent 75%, #0f172a 75%);
}
.viewport-canvas-wrapper.is-eyedropper {
  cursor: crosshair;
}
.viewport-canvas-wrapper.is-brush {
  cursor: crosshair;
}
.display-canvas {
  max-width: 100%;
  max-height: 620px;
  object-fit: contain;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}
.split-slider-tip {
  position: absolute;
  bottom: 12px;
  background: rgba(15, 23, 42, 0.75);
  color: #f8fafc;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(4px);
  pointer-events: none;
}
.viewport-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted, #64748b);
  padding-inline: 4px;
}
.file-dim-pill, .zoom-pill {
  font-weight: 600;
}

/* Sidebar Controls */
.studio-sidebar-controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.control-box {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
html[data-theme='dark'] .control-box {
  background: #0f172a;
  border-color: #334155;
}
.panel-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 750;
  color: var(--text, #0f172a);
}
html[data-theme='dark'] .panel-heading {
  color: #f8fafc;
}
.panel-desc {
  font-size: 12.5px;
  color: var(--text-muted, #64748b);
  line-height: 1.5;
  margin-top: -6px;
}
html[data-theme='dark'] .panel-desc {
  color: #94a3b8;
}
.primary-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  background: #e11d48;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25);
  transition: all 0.15s ease;
}
.primary-action-btn:hover:not(:disabled) {
  background: #be123c;
  transform: translateY(-1px);
}
.primary-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}
.progress-bar {
  height: 6px;
  background: var(--surface-muted, #f1f5f9);
  border-radius: 4px;
  overflow: hidden;
}
html[data-theme='dark'] .progress-bar {
  background: #1e293b;
}
.progress-fill {
  height: 100%;
  background: #e11d48;
  transition: width 0.3s ease;
}
.progress-label {
  font-size: 11.5px;
  color: #e11d48;
  font-weight: 600;
  text-align: center;
}

/* Fields & Sliders */
.control-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-title {
  font-size: 12px;
  font-weight: 650;
  color: var(--text, #0f172a);
}
html[data-theme='dark'] .field-title {
  color: #f1f5f9;
}
.field-title-split {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 650;
  color: var(--text, #0f172a);
}
html[data-theme='dark'] .field-title-split {
  color: #f1f5f9;
}
.range-slider {
  accent-color: #e11d48;
  width: 100%;
  cursor: pointer;
}
.color-picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.color-swatch-input {
  width: 38px;
  height: 38px;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
  background: transparent;
}
.color-hex-text {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  font-family: monospace;
  background: var(--surface);
  color: var(--text);
}
html[data-theme='dark'] .color-hex-text {
  background: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}
.eyedropper-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--border, #e2e8f0);
  background: var(--surface-muted, #f1f5f9);
  color: var(--text);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
html[data-theme='dark'] .eyedropper-btn {
  background: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}
.eyedropper-btn.active {
  background: #e11d48;
  color: #ffffff;
  border-color: #e11d48;
}
.radio-toggle-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.radio-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border, #e2e8f0);
  background: var(--surface);
  color: var(--text-muted);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
html[data-theme='dark'] .radio-btn {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}
.radio-btn.active {
  border-color: #e11d48;
  color: #e11d48;
  background: #fff1f2;
}
html[data-theme='dark'] .radio-btn.active {
  background: rgba(225, 29, 72, 0.15);
  color: #fecdd3;
  border-color: #e11d48;
}
.apply-color-btn {
  padding: 10px;
  background: #e11d48;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

/* Background Staging */
.bg-type-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.bg-type-btn {
  padding: 8px 6px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border, #e2e8f0);
  background: var(--surface);
  color: var(--text-muted);
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
}
html[data-theme='dark'] .bg-type-btn {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}
.bg-type-btn.active {
  background: #e11d48;
  color: #ffffff;
  border-color: #e11d48;
}
.swatches-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 4px;
}
.swatch-circle {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
.swatch-circle.active {
  border-color: #e11d48;
  transform: scale(1.08);
}
.custom-color-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

/* Export Card */
.format-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.format-pills {
  display: inline-flex;
  gap: 4px;
}
.fmt-btn {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid var(--border, #e2e8f0);
  background: var(--surface);
  color: var(--text-muted);
  border-radius: 6px;
  cursor: pointer;
}
html[data-theme='dark'] .fmt-btn {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}
.fmt-btn.active {
  background: #e11d48;
  color: #ffffff;
  border-color: #e11d48;
}
.action-buttons-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.copy-clipboard-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px;
  border: 1px solid var(--border, #e2e8f0);
  background: var(--surface-muted, #f8fafc);
  color: var(--text);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
html[data-theme='dark'] .copy-clipboard-btn {
  background: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}
.copy-clipboard-btn:hover {
  border-color: #e11d48;
  color: #e11d48;
}
.download-main-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px;
  background: #e11d48;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 750;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25);
  transition: all 0.15s ease;
}
.download-main-btn:hover {
  background: #be123c;
  transform: translateY(-1px);
}

/* Floating Toast */
.toast-pill {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 9999;
}
html[data-theme='dark'] .toast-pill {
  background: #e11d48;
  color: #ffffff;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>

