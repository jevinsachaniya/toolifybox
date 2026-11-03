<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import {
  Check,
  ChevronDown,
  CircleAlert,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileCheck,
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  RotateCcw,
  ScanFace,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  UserX,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import {
  BLUR_MODES,
  BLUR_SHAPES,
  DEFAULT_BLUR_OPTIONS,
  detectFacesInImage,
  formatBlurOutputFilename,
  renderBlurredImageToCanvas,
  validateBlurFaceFile,
} from '~/utils/blur-face.js';

// Base Image & File States
const file = shallowRef(null);
const fileInput = ref(null);
const isDragging = ref(false);
const imageObj = shallowRef(null);
const imageDimensions = ref({ width: 0, height: 0 });

// Detected & Manual Face Regions
// { id, x, y, width, height, confidence, enabled, custom }
const faces = ref([]);
const selectedFaceId = ref(null);
const isScanning = ref(false);
const scanDetectorUsed = ref('');
const showOutlines = ref(true);

// Blur Customization Settings
const blurMode = ref(DEFAULT_BLUR_OPTIONS.mode); // 'gaussian' | 'pixelate' | 'censor-bar' | 'frosted'
const blurShape = ref(DEFAULT_BLUR_OPTIONS.shape); // 'ellipse' | 'rect'
const blurStrength = ref(DEFAULT_BLUR_OPTIONS.strength); // 5 - 60
const pixelSize = ref(DEFAULT_BLUR_OPTIONS.pixelSize); // 4 - 40
const featherAmount = ref(DEFAULT_BLUR_OPTIONS.feather); // 0 - 35
const facePadding = ref(DEFAULT_BLUR_OPTIONS.padding); // 0 - 40

// Comparison & View State
const isHoldingOriginal = ref(false);
const previewCanvas = ref(null);
const workspaceContainer = ref(null);
const zoomLevel = ref(1);

// Export State
const exportFormat = ref('jpeg'); // 'jpeg' | 'png' | 'webp'
const exportQuality = ref(0.92); // 0.6 - 1.0
const outputFilename = ref('');
const isExporting = ref(false);
const copySuccess = ref(false);
const resultImage = shallowRef(null);

// Error & Feedback State
const error = ref('');
const notification = ref('');
let notifyTimer = null;

const stage = computed(() => {
  if (resultImage.value) return 3;
  if (file.value && imageObj.value) return 2;
  return 1;
});

const enabledFacesCount = computed(() => faces.value.filter(f => f.enabled).length);

function showNotice(msg) {
  notification.value = msg;
  if (notifyTimer) clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => {
    notification.value = '';
  }, 3500);
}

onMounted(() => {
  // Global drag events for the dropzone
});

onBeforeUnmount(() => {
  clearResult();
  if (notifyTimer) clearTimeout(notifyTimer);
});

function clearResult() {
  if (resultImage.value?.url) {
    URL.revokeObjectURL(resultImage.value.url);
  }
  resultImage.value = null;
}

function resetAll() {
  clearResult();
  file.value = null;
  imageObj.value = null;
  imageDimensions.value = { width: 0, height: 0 };
  faces.value = [];
  selectedFaceId.value = null;
  isScanning.value = false;
  error.value = '';
}

// -------------------------------------------------------------
// Image File Handling
// -------------------------------------------------------------
function handleFileSelect(files) {
  if (!files || files.length === 0) return;
  const selected = files[0];
  const validationError = validateBlurFaceFile(selected);
  if (validationError) {
    error.value = validationError;
    return;
  }
  error.value = '';
  loadSelectedFile(selected);
}

function loadSelectedFile(targetFile) {
  file.value = targetFile;
  outputFilename.value = formatBlurOutputFilename(targetFile.name, exportFormat.value);

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      imageObj.value = img;
      imageDimensions.value = { width: img.naturalWidth, height: img.naturalHeight };
      nextTick(() => {
        runAutoFaceDetection();
      });
    };
    img.onerror = () => {
      error.value = 'Failed to decode image. Please try another photo.';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(targetFile);
}

// Quick Sample Image for instant testing
function loadSampleImage() {
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 800;
  sampleCanvas.height = 600;
  const ctx = sampleCanvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 800, 600);
  grad.addColorStop(0, '#e0f2fe');
  grad.addColorStop(0.5, '#bae6fd');
  grad.addColorStop(1, '#7dd3fc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 600);

  // Subject 1 (Left)
  drawSamplePerson(ctx, 280, 260, '#f97316', '#fed7aa', 'Alice');
  // Subject 2 (Right)
  drawSamplePerson(ctx, 520, 270, '#3b82f6', '#bfdbfe', 'Bob');

  sampleCanvas.toBlob((blob) => {
    const sampleFile = new File([blob], 'team-portrait-sample.jpg', { type: 'image/jpeg' });
    loadSelectedFile(sampleFile);
  }, 'image/jpeg', 0.95);
}

function drawSamplePerson(ctx, cx, cy, shirtColor, skinColor, label) {
  // Shoulders
  ctx.fillStyle = shirtColor;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 180, 110, 100, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillStyle = skinColor;
  ctx.fillRect(cx - 24, cy + 70, 48, 50);

  // Head
  ctx.beginPath();
  ctx.ellipse(cx, cy, 65, 80, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 40, 68, 50, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(cx - 22, cy - 8, 6, 0, Math.PI * 2);
  ctx.arc(cx + 22, cy - 8, 6, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy + 25, 22, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  // Label tag
  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, cx, cy + 160);
}

// -------------------------------------------------------------
// Face Detection Runner
// -------------------------------------------------------------
async function runAutoFaceDetection() {
  if (!imageObj.value) return;
  isScanning.value = true;
  scanDetectorUsed.value = '';

  try {
    const result = await detectFacesInImage(imageObj.value, {
      padding: facePadding.value,
      modelPath: '/models/facefinder',
    });

    faces.value = result.faces || [];
    scanDetectorUsed.value = result.detector;

    if (faces.value.length === 0) {
      // If none detected automatically, provide a convenient default central blur box
      // so user isn't left empty-handed
      const w = imageDimensions.value.width;
      const h = imageDimensions.value.height;
      const boxSize = Math.round(Math.min(w, h) * 0.28);
      faces.value = [
        {
          id: 'face-manual-1',
          x: Math.round((w - boxSize) / 2),
          y: Math.round((h - boxSize) / 2.3),
          width: boxSize,
          height: boxSize,
          confidence: 100,
          enabled: true,
          custom: true,
        },
      ];
      showNotice('Face positioned manually. Drag or resize on canvas to adjust!');
    } else {
      showNotice(`Detected ${faces.value.length} face${faces.value.length > 1 ? 's' : ''}!`);
    }

    renderPreview();
  } catch (err) {
    console.error('Face detection failed:', err);
    error.value = 'Detection error: ' + err.message;
  } finally {
    isScanning.value = false;
  }
}

// Add Custom Blur Area manually
function addCustomBlurZone() {
  if (!imageDimensions.value.width) return;
  const w = imageDimensions.value.width;
  const h = imageDimensions.value.height;
  const size = Math.round(Math.min(w, h) * 0.25);

  const newFace = {
    id: `custom-blur-${Date.now()}`,
    x: Math.round((w - size) / 2 + (Math.random() * 40 - 20)),
    y: Math.round((h - size) / 2 + (Math.random() * 40 - 20)),
    width: size,
    height: size,
    confidence: 100,
    enabled: true,
    custom: true,
  };

  faces.value.push(newFace);
  selectedFaceId.value = newFace.id;
  renderPreview();
  showNotice('Added new blur area. Drag or resize to position.');
}

function removeFace(faceId) {
  faces.value = faces.value.filter(f => f.id !== faceId);
  if (selectedFaceId.value === faceId) {
    selectedFaceId.value = null;
  }
  renderPreview();
}

function toggleFace(face) {
  face.enabled = !face.enabled;
  renderPreview();
}

function setAllFaces(enable) {
  faces.value.forEach(f => { f.enabled = enable; });
  renderPreview();
}

// -------------------------------------------------------------
// Live Canvas Rendering
// -------------------------------------------------------------
function renderPreview() {
  if (!previewCanvas.value || !imageObj.value) return;

  const canvas = previewCanvas.value;
  const img = imageObj.value;

  if (isHoldingOriginal.value) {
    // Show pristine original
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return;
  }

  renderBlurredImageToCanvas(canvas, img, faces.value, {
    mode: blurMode.value,
    shape: blurShape.value,
    strength: blurStrength.value,
    pixelSize: pixelSize.value,
    feather: featherAmount.value,
    padding: facePadding.value,
  });
}

// Watchers for reactive live updates
watch(
  [blurMode, blurShape, blurStrength, pixelSize, featherAmount, isHoldingOriginal],
  () => {
    renderPreview();
  }
);

watch(exportFormat, (newFmt) => {
  if (file.value) {
    outputFilename.value = formatBlurOutputFilename(file.value.name, newFmt);
  }
});

// -------------------------------------------------------------
// Interactive Box Drag & Resize on Canvas
// -------------------------------------------------------------
let isInteracting = false;
let interactionType = null; // 'move' | 'resize'
let activeFace = null;
let startX = 0;
let startY = 0;
let initialFaceBounds = null;

function getCanvasCoordinates(e, overlayEl) {
  const rect = overlayEl.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  const relX = clientX - rect.left;
  const relY = clientY - rect.top;

  const scaleX = imageDimensions.value.width / rect.width;
  const scaleY = imageDimensions.value.height / rect.height;

  return {
    x: relX * scaleX,
    y: relY * scaleY,
  };
}

function startDragFace(e, face) {
  e.stopPropagation();
  isInteracting = true;
  interactionType = 'move';
  activeFace = face;
  selectedFaceId.value = face.id;

  const overlay = e.currentTarget.closest('.canvas-overlay-layer');
  const pos = getCanvasCoordinates(e, overlay);
  startX = pos.x;
  startY = pos.y;
  initialFaceBounds = { ...face };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('touchmove', onMouseMove, { passive: false });
  window.addEventListener('touchend', onMouseUp);
}

function startResizeFace(e, face) {
  e.stopPropagation();
  isInteracting = true;
  interactionType = 'resize';
  activeFace = face;
  selectedFaceId.value = face.id;

  const overlay = e.currentTarget.closest('.canvas-overlay-layer');
  const pos = getCanvasCoordinates(e, overlay);
  startX = pos.x;
  startY = pos.y;
  initialFaceBounds = { ...face };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('touchmove', onMouseMove, { passive: false });
  window.addEventListener('touchend', onMouseUp);
}

function onMouseMove(e) {
  if (!isInteracting || !activeFace || !initialFaceBounds) return;
  if (e.cancelable) e.preventDefault();

  const overlay = document.querySelector('.canvas-overlay-layer');
  if (!overlay) return;

  const pos = getCanvasCoordinates(e, overlay);
  const deltaX = pos.x - startX;
  const deltaY = pos.y - startY;

  const maxW = imageDimensions.value.width;
  const maxH = imageDimensions.value.height;

  if (interactionType === 'move') {
    activeFace.x = Math.max(0, Math.min(maxW - activeFace.width, Math.round(initialFaceBounds.x + deltaX)));
    activeFace.y = Math.max(0, Math.min(maxH - activeFace.height, Math.round(initialFaceBounds.y + deltaY)));
  } else if (interactionType === 'resize') {
    const newW = Math.max(30, Math.min(maxW - activeFace.x, Math.round(initialFaceBounds.width + deltaX)));
    const newH = Math.max(30, Math.min(maxH - activeFace.y, Math.round(initialFaceBounds.height + deltaY)));
    activeFace.width = newW;
    activeFace.height = newH;
  }

  renderPreview();
}

function onMouseUp() {
  isInteracting = false;
  interactionType = null;
  activeFace = null;
  initialFaceBounds = null;

  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('touchmove', onMouseMove);
  window.removeEventListener('touchend', onMouseUp);

  renderPreview();
}

// -------------------------------------------------------------
// High-Resolution Export & Download
// -------------------------------------------------------------
async function handleExport() {
  if (!imageObj.value || !file.value) return;

  isExporting.value = true;
  error.value = '';

  try {
    const exportCanvas = document.createElement('canvas');
    renderBlurredImageToCanvas(exportCanvas, imageObj.value, faces.value, {
      mode: blurMode.value,
      shape: blurShape.value,
      strength: blurStrength.value,
      pixelSize: pixelSize.value,
      feather: featherAmount.value,
      padding: facePadding.value,
    });

    let mime = 'image/jpeg';
    if (exportFormat.value === 'png') mime = 'image/png';
    else if (exportFormat.value === 'webp') mime = 'image/webp';

    const quality = exportFormat.value === 'png' ? undefined : exportQuality.value;

    const blob = await new Promise((resolve, reject) => {
      exportCanvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to encode final canvas image.'));
        },
        mime,
        quality
      );
    });

    const url = URL.createObjectURL(blob);
    const fname = outputFilename.value.trim() || formatBlurOutputFilename(file.value.name, exportFormat.value);

    resultImage.value = {
      blob,
      url,
      width: exportCanvas.width,
      height: exportCanvas.height,
      size: blob.size,
      filename: fname,
    };
  } catch (err) {
    console.error('Export error:', err);
    error.value = 'Failed to generate blurred image: ' + err.message;
  } finally {
    isExporting.value = false;
  }
}

// Copy to Clipboard
async function copyToClipboard() {
  if (!previewCanvas.value) return;
  try {
    previewCanvas.value.toBlob(async (blob) => {
      if (!blob) return;
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        copySuccess.value = true;
        showNotice('Blurred image copied to clipboard!');
        setTimeout(() => { copySuccess.value = false; }, 2500);
      } else {
        showNotice('Clipboard copy not supported on this browser.');
      }
    }, 'image/png');
  } catch (err) {
    console.warn('Copy error:', err);
    showNotice('Could not copy image automatically.');
  }
}
</script>

<template>
  <div class="blur-face-converter">
    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*,.jpg,.jpeg,.png,.webp,.bmp,.gif,.avif"
      class="visually-hidden"
      style="display: none;"
      @change="(e) => { if (e.target.files) handleFileSelect(e.target.files); e.target.value = ''; }"
    />

    <!-- ================= STAGE 3: RESULT VIEW ================= -->
    <div v-if="resultImage" class="result-state blur-result">
      <div
        class="file-chosen-icon"
        style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; width: 64px; height: 64px; border-radius: 20px; display: grid; place-items: center; margin: 0 auto 16px; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);"
      >
        <FileCheck :size="32" />
      </div>

      <h3>Face Blurring Complete!</h3>
      <p class="result-subtitle">
        Your censored, privacy-protected photo has been rendered in full native resolution.
      </p>

      <div class="blur-result-preview-wrap">
        <img :src="resultImage.url" :alt="resultImage.filename" class="blur-result-img" />
      </div>

      <div class="selected-file" style="margin: 18px 0;">
        <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
          <div
            style="background: linear-gradient(135deg, #0284c7, #2563eb); color: #fff; width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0;"
          >
            <ScanFace :size="22" />
          </div>
          <div style="min-width: 0; text-align: left; flex: 1;">
            <div style="font-weight: 700; font-size: 14px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
              {{ resultImage.filename }}
            </div>
            <div style="font-size: 12px; color: var(--muted, #64748b); margin-top: 2px;">
              {{ resultImage.width }} × {{ resultImage.height }} px &bull; {{ formatSize(resultImage.size) }}
            </div>
          </div>
        </div>
      </div>

      <div class="result-actions">
        <a class="primary-button" :href="resultImage.url" :download="resultImage.filename">
          <Download :size="18" /> Download Censored Photo
        </a>
        <button class="text-button" type="button" @click="resetAll">
          <RotateCcw :size="16" /> Blur Another Photo
        </button>
      </div>
    </div>

    <!-- ================= STAGE 2: WORKSPACE & CONTROLS ================= -->
    <div v-else-if="file && imageObj" class="blur-workspace">
      <!-- Top Info Bar -->
      <div class="organize-header-bar blur-top-info">
        <div class="organize-files-info">
          <div class="files-summary-pill">
            <ScanFace :size="16" />
            <span>
              <b>{{ file.name }}</b> &bull; {{ imageDimensions.width }} × {{ imageDimensions.height }} px ({{ formatSize(file.size) }})
            </span>
          </div>

          <div v-if="isScanning" class="detection-status-pill scanning">
            <LoaderCircle :size="13" class="spin-icon" />
            <span>AI Face Scanning...</span>
          </div>
          <div v-else class="detection-status-pill success">
            <Check :size="13" />
            <span>{{ faces.length }} Face{{ faces.length === 1 ? '' : 's' }} Detected</span>
          </div>
        </div>

        <div class="organize-top-actions">
          <button
            type="button"
            class="tool-action-btn secondary"
            title="Scan faces again"
            :disabled="isScanning"
            @click="runAutoFaceDetection"
          >
            <Wand2 :size="14" />
            <span>Re-Scan</span>
          </button>
          <button
            type="button"
            class="tool-action-btn secondary"
            title="Change image"
            @click="fileInput?.click()"
          >
            <Upload :size="14" />
            <span>Change</span>
          </button>
          <button
            type="button"
            class="tool-action-btn icon-only clear-btn"
            title="Reset"
            @click="resetAll"
          >
            <X :size="15" />
          </button>
        </div>
      </div>

      <!-- Main Layout: Preview Canvas on Left, Controls on Right -->
      <div class="blur-main-grid">
        <!-- Live Interactive Preview Canvas Card -->
        <div class="blur-preview-card">
          <div class="preview-card-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="preview-title">
                <Eye :size="14" /> Live Interactive Preview
              </span>
              <button
                type="button"
                class="outline-toggle-btn"
                :class="{ active: showOutlines }"
                title="Toggle face region outlines"
                @click="showOutlines = !showOutlines"
              >
                {{ showOutlines ? 'Hide Boxes' : 'Show Boxes' }}
              </button>
            </div>

            <!-- Compare Hold Button -->
            <button
              type="button"
              class="compare-hold-btn"
              :class="{ active: isHoldingOriginal }"
              @mousedown="isHoldingOriginal = true"
              @mouseup="isHoldingOriginal = false"
              @mouseleave="isHoldingOriginal = false"
              @touchstart="isHoldingOriginal = true"
              @touchend="isHoldingOriginal = false"
              title="Press and hold to see original image"
            >
              <EyeOff v-if="!isHoldingOriginal" :size="13" />
              <Eye v-else :size="13" />
              <span>{{ isHoldingOriginal ? 'Viewing Original' : 'Hold to Compare' }}</span>
            </button>
          </div>

          <!-- Canvas Workspace with Overlays -->
          <div ref="workspaceContainer" class="blur-canvas-wrap">
            <div class="canvas-viewport" :style="{ aspectRatio: `${imageDimensions.width} / ${imageDimensions.height}` }">
              <canvas ref="previewCanvas" class="blur-main-canvas" />

              <!-- Interactive Face Overlays (Shown when outlines are enabled) -->
              <div v-if="showOutlines && !isHoldingOriginal" class="canvas-overlay-layer">
                <div
                  v-for="(face, idx) in faces"
                  :key="face.id"
                  class="face-bounding-box"
                  :class="{
                    'is-disabled': !face.enabled,
                    'is-selected': selectedFaceId === face.id,
                    'is-circle': blurShape === 'ellipse',
                  }"
                  :style="{
                    left: `${(face.x / imageDimensions.width) * 100}%`,
                    top: `${(face.y / imageDimensions.height) * 100}%`,
                    width: `${(face.width / imageDimensions.width) * 100}%`,
                    height: `${(face.height / imageDimensions.height) * 100}%`,
                  }"
                  @mousedown="(e) => startDragFace(e, face)"
                  @touchstart="(e) => startDragFace(e, face)"
                >
                  <!-- Face Tag Badge -->
                  <div class="face-tag" @mousedown.stop @touchstart.stop>
                    <span class="face-label">
                      {{ face.custom ? `Blur Area ${idx + 1}` : `Face ${idx + 1}` }}
                    </span>
                    <button
                      type="button"
                      class="tag-toggle-btn"
                      :title="face.enabled ? 'Unblur this face' : 'Blur this face'"
                      @click="toggleFace(face)"
                    >
                      <UserCheck v-if="face.enabled" :size="11" />
                      <UserX v-else :size="11" />
                    </button>
                    <button
                      type="button"
                      class="tag-delete-btn"
                      title="Delete this blur area"
                      @click="removeFace(face.id)"
                    >
                      &times;
                    </button>
                  </div>

                  <!-- Resize Handle in Bottom Right -->
                  <div
                    class="face-resize-handle"
                    title="Drag to resize blur area"
                    @mousedown="(e) => startResizeFace(e, face)"
                    @touchstart="(e) => startResizeFace(e, face)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Canvas Helpers -->
          <div class="preview-card-footer">
            <div class="hint-text">
              <Sparkles :size="12" />
              <span>Click &amp; drag boxes to reposition. Drag corner handle to resize.</span>
            </div>
            <button type="button" class="add-zone-pill-btn" @click="addCustomBlurZone">
              <Plus :size="13" /> Add Blur Area
            </button>
          </div>
        </div>

        <!-- Controls Sidebar -->
        <div class="blur-controls-card">
          <!-- Section 1: Blur Style -->
          <div class="control-section">
            <label class="section-label">
              <Sliders :size="14" /> Censor Style
            </label>
            <div class="blur-modes-grid">
              <button
                v-for="mode in BLUR_MODES"
                :key="mode.id"
                type="button"
                class="blur-mode-btn"
                :class="{ active: blurMode === mode.id }"
                @click="blurMode = mode.id"
              >
                <div class="mode-name">{{ mode.label }}</div>
                <div class="mode-desc">{{ mode.desc }}</div>
              </button>
            </div>
          </div>

          <!-- Section 2: Blur Shape -->
          <div class="control-section">
            <label class="section-label">Blur Shape</label>
            <div class="shape-tabs-grid">
              <button
                v-for="shape in BLUR_SHAPES"
                :key="shape.id"
                type="button"
                class="shape-tab-btn"
                :class="{ active: blurShape === shape.id }"
                @click="blurShape = shape.id"
              >
                {{ shape.label }}
              </button>
            </div>
          </div>

          <!-- Section 3: Fine-Tuning Sliders -->
          <div class="control-section">
            <label class="section-label">Effect Intensity</label>

            <!-- Gaussian / Frosted Blur Strength -->
            <div v-if="blurMode === 'gaussian' || blurMode === 'frosted'" class="slider-row">
              <div class="slider-header">
                <span>Blur Strength</span>
                <span class="slider-val">{{ blurStrength }}px</span>
              </div>
              <input
                v-model.number="blurStrength"
                type="range"
                min="5"
                max="60"
                step="1"
                class="tool-slider"
              />
            </div>

            <!-- Pixelate Block Size -->
            <div v-if="blurMode === 'pixelate'" class="slider-row">
              <div class="slider-header">
                <span>Pixel Block Size</span>
                <span class="slider-val">{{ pixelSize }}px</span>
              </div>
              <input
                v-model.number="pixelSize"
                type="range"
                min="4"
                max="40"
                step="2"
                class="tool-slider"
              />
            </div>

            <!-- Edge Softness / Feathering -->
            <div v-if="blurMode !== 'censor-bar'" class="slider-row">
              <div class="slider-header">
                <span>Edge Feathering</span>
                <span class="slider-val">{{ featherAmount }}%</span>
              </div>
              <input
                v-model.number="featherAmount"
                type="range"
                min="0"
                max="35"
                step="1"
                class="tool-slider"
              />
            </div>
          </div>

          <!-- Section 4: Detected Faces Checklist -->
          <div class="control-section">
            <div class="faces-header">
              <label class="section-label" style="margin-bottom: 0;">
                <ScanFace :size="14" /> Faces on Image ({{ faces.length }})
              </label>
              <div class="faces-bulk-actions">
                <button type="button" class="bulk-text-btn" @click="setAllFaces(true)">
                  Blur All
                </button>
                <span>&bull;</span>
                <button type="button" class="bulk-text-btn" @click="setAllFaces(false)">
                  Unblur All
                </button>
              </div>
            </div>

            <div class="faces-list-scroll">
              <div
                v-for="(face, idx) in faces"
                :key="face.id"
                class="face-item-row"
                :class="{ disabled: !face.enabled, selected: selectedFaceId === face.id }"
                @click="selectedFaceId = face.id"
              >
                <label class="face-check-label" @click.stop>
                  <input
                    type="checkbox"
                    :checked="face.enabled"
                    @change="toggleFace(face)"
                  />
                  <span class="face-item-title">
                    {{ face.custom ? `Custom Zone #${idx + 1}` : `Face #${idx + 1}` }}
                  </span>
                </label>

                <div class="face-item-right">
                  <span v-if="face.confidence && !face.custom" class="confidence-badge">
                    {{ face.confidence }}% AI
                  </span>
                  <button
                    type="button"
                    class="face-item-del-btn"
                    title="Remove blur area"
                    @click.stop="removeFace(face.id)"
                  >
                    <Trash2 :size="13" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 5: Export Settings -->
          <div class="control-section export-section">
            <label class="section-label">Export Format</label>
            <div class="format-chips">
              <button
                v-for="fmt in ['jpeg', 'png', 'webp']"
                :key="fmt"
                type="button"
                class="format-chip-btn"
                :class="{ active: exportFormat === fmt }"
                @click="exportFormat = fmt"
              >
                {{ fmt.toUpperCase() }}
              </button>
            </div>

            <!-- Quality Slider for JPG / WebP -->
            <div v-if="exportFormat !== 'png'" class="slider-row" style="margin-top: 12px;">
              <div class="slider-header">
                <span>Export Quality</span>
                <span class="slider-val">{{ Math.round(exportQuality * 100) }}%</span>
              </div>
              <input
                v-model.number="exportQuality"
                type="range"
                min="0.6"
                max="1"
                step="0.05"
                class="tool-slider"
              />
            </div>

            <!-- Action Buttons -->
            <div class="export-actions-grid">
              <button
                type="button"
                class="primary-button export-btn"
                :disabled="isExporting"
                @click="handleExport"
              >
                <LoaderCircle v-if="isExporting" :size="16" class="spin-icon" />
                <Download v-else :size="16" />
                <span>{{ isExporting ? 'Encoding Image...' : 'Save & Download' }}</span>
              </button>

              <button
                type="button"
                class="tool-action-btn secondary copy-btn"
                :disabled="isExporting"
                title="Copy to clipboard"
                @click="copyToClipboard"
              >
                <Check v-if="copySuccess" :size="15" style="color: #10b981;" />
                <Copy v-else :size="15" />
                <span>{{ copySuccess ? 'Copied!' : 'Copy' }}</span>
              </button>
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
      <div class="upload-icon-circle">
        <ScanFace :size="38" />
      </div>

      <h2>Select an image to blur faces</h2>
      <p class="upload-subtitle">
        Drop any photo here, or browse files from your computer or smartphone.
      </p>

      <button type="button" class="primary-button select-btn" @click.stop="fileInput?.click()">
        <Upload :size="18" /> Choose Image
      </button>

      <div class="supported-formats-pill">
        <span>JPG</span> &bull; <span>PNG</span> &bull; <span>WebP</span> &bull; <span>BMP</span> &bull; <span>GIF</span> (Max 50 MB)
      </div>

      <!-- Sample Image Trigger -->
      <div class="sample-trigger-row" @click.stop>
        <span>Want to test quickly?</span>
        <button type="button" class="sample-link-btn" @click="loadSampleImage">
          <Sparkles :size="13" /> Try with a sample photo
        </button>
      </div>
    </div>

    <!-- Notification Toast -->
    <transition name="fade">
      <div v-if="notification" class="blur-toast-notice">
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
.blur-face-converter {
  position: relative;
  width: 100%;
}

/* Dropzone Styles */
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
  border-color: #0284c7;
  background: #f0f9ff;
  transform: translateY(-2px);
}

.upload-icon-circle {
  width: 76px;
  height: 76px;
  border-radius: 22px;
  background: linear-gradient(135deg, #0284c7, #2563eb);
  color: #ffffff;
  display: grid;
  place-items: center;
  margin-bottom: 20px;
  box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.4);
}

.upload-dropzone h2 {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-color, #0f172a);
  margin: 0 0 8px;
}

.upload-subtitle {
  font-size: 15px;
  color: var(--muted, #64748b);
  margin: 0 0 24px;
  max-width: 440px;
}

.select-btn {
  padding: 13px 28px;
  font-size: 15px;
  font-weight: 700;
  border-radius: 14px;
  background: linear-gradient(135deg, #0284c7, #2563eb);
  color: #fff;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 8px 20px -4px rgba(2, 132, 199, 0.35);
  transition: all 0.2s ease;
}

.select-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px -4px rgba(2, 132, 199, 0.45);
}

.supported-formats-pill {
  margin-top: 20px;
  font-size: 13px;
  color: var(--muted, #94a3b8);
  font-weight: 500;
}

.sample-trigger-row {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted, #64748b);
}

.sample-link-btn {
  background: none;
  border: none;
  color: #0284c7;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.sample-link-btn:hover {
  background: rgba(2, 132, 199, 0.1);
  text-decoration: underline;
}

/* Workspace Layout */
.blur-workspace {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.blur-top-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
}

.detection-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  margin-left: 10px;
}

.detection-status-pill.scanning {
  background: #fef3c7;
  color: #d97706;
}

.detection-status-pill.success {
  background: #ecfdf5;
  color: #059669;
}

.blur-main-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  align-items: start;
}

@media (max-width: 960px) {
  .blur-main-grid {
    grid-template-columns: 1fr;
  }
}

/* Preview Card */
.blur-preview-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.04);
}

.preview-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: var(--bg-soft, #f8fafc);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.preview-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-color, #1e293b);
}

.outline-toggle-btn {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid var(--border-color, #cbd5e1);
  background: #fff;
  color: var(--muted, #64748b);
  cursor: pointer;
}

.outline-toggle-btn.active {
  background: #0284c7;
  color: #fff;
  border-color: #0284c7;
}

.compare-hold-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
}

.compare-hold-btn:hover,
.compare-hold-btn.active {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
}

.blur-canvas-wrap {
  position: relative;
  width: 100%;
  padding: 16px;
  background: #090d16;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.canvas-viewport {
  position: relative;
  max-width: 100%;
  max-height: 520px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  overflow: hidden;
}

.blur-main-canvas {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.canvas-overlay-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Face Bounding Box */
.face-bounding-box {
  position: absolute;
  pointer-events: auto;
  border: 2px dashed #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  cursor: move;
  transition: border-color 0.15s ease;
  user-select: none;
}

.face-bounding-box.is-circle {
  border-radius: 50%;
}

.face-bounding-box.is-selected {
  border-color: #f59e0b;
  border-style: solid;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.35);
}

.face-bounding-box.is-disabled {
  border-color: rgba(148, 163, 184, 0.6);
  background: transparent;
  opacity: 0.5;
}

.face-tag {
  position: absolute;
  top: -26px;
  left: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(15, 23, 42, 0.9);
  color: #ffffff;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  pointer-events: auto;
  backdrop-filter: blur(4px);
}

.tag-toggle-btn,
.tag-delete-btn {
  background: none;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  padding: 1px 3px;
  border-radius: 4px;
  display: grid;
  place-items: center;
}

.tag-toggle-btn:hover {
  color: #38bdf8;
}

.tag-delete-btn:hover {
  color: #f43f5e;
}

.face-resize-handle {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 14px;
  height: 14px;
  background: #38bdf8;
  border: 2px solid #ffffff;
  border-radius: 4px;
  cursor: nwse-resize;
  pointer-events: auto;
}

.face-bounding-box.is-selected .face-resize-handle {
  background: #f59e0b;
}

.preview-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: var(--bg-soft, #f8fafc);
  border-top: 1px solid var(--border-color, #e2e8f0);
}

.hint-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted, #64748b);
}

.add-zone-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 10px;
  background: #f0f9ff;
  color: #0284c7;
  border: 1px solid #bae6fd;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-zone-pill-btn:hover {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

/* Controls Sidebar */
.blur-controls-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 20px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.04);
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-color, #f1f5f9);
}

.control-section:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.section-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
  color: var(--text-color, #1e293b);
}

.blur-modes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.blur-mode-btn {
  padding: 9px 10px;
  border-radius: 12px;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--card-bg, #ffffff);
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.blur-mode-btn:hover {
  border-color: #0284c7;
}

.blur-mode-btn.active {
  border-color: #0284c7;
  background: #f0f9ff;
  box-shadow: 0 0 0 1px #0284c7;
}

.mode-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-color, #0f172a);
}

.mode-desc {
  font-size: 10px;
  color: var(--muted, #64748b);
  margin-top: 2px;
  line-height: 1.25;
}

.shape-tabs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.shape-tab-btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--card-bg, #ffffff);
  font-size: 12px;
  font-weight: 700;
  color: var(--text-color, #334155);
  cursor: pointer;
  transition: all 0.15s ease;
}

.shape-tab-btn.active {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
}

.slider-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color, #334155);
}

.slider-val {
  color: #0284c7;
  font-weight: 700;
}

.tool-slider {
  width: 100%;
  accent-color: #0284c7;
  cursor: pointer;
}

/* Faces Checklist */
.faces-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.faces-bulk-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--muted, #94a3b8);
}

.bulk-text-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 11px;
  font-weight: 700;
  color: #0284c7;
  cursor: pointer;
}

.bulk-text-btn:hover {
  text-decoration: underline;
}

.faces-list-scroll {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 140px;
  overflow-y: auto;
  padding-right: 4px;
}

.face-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--bg-soft, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  cursor: pointer;
  transition: all 0.15s ease;
}

.face-item-row:hover {
  border-color: #0284c7;
}

.face-item-row.selected {
  border-color: #f59e0b;
  background: #fffbeb;
}

.face-item-row.disabled {
  opacity: 0.55;
}

.face-check-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color, #0f172a);
  cursor: pointer;
}

.face-item-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.confidence-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  background: #dbeafe;
  color: #1e40af;
}

.face-item-del-btn {
  background: none;
  border: none;
  color: var(--muted, #94a3b8);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: grid;
  place-items: center;
}

.face-item-del-btn:hover {
  color: #f43f5e;
}

/* Export Section */
.format-chips {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.format-chip-btn {
  padding: 7px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--card-bg, #ffffff);
  font-size: 11px;
  font-weight: 800;
  color: var(--text-color, #334155);
  cursor: pointer;
  transition: all 0.15s ease;
}

.format-chip-btn.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.export-actions-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  margin-top: 14px;
}

.export-btn {
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 12px;
  background: linear-gradient(135deg, #0284c7, #2563eb);
  color: #fff;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
  transition: all 0.2s ease;
}

.export-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(2, 132, 199, 0.45);
}

.copy-btn {
  padding: 12px 14px;
  border-radius: 12px;
}

/* Result View */
.blur-result {
  text-align: center;
  padding: 36px 20px;
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 24px;
  box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.05);
}

.blur-result-preview-wrap {
  max-width: 520px;
  margin: 20px auto;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 35px -5px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color, #e2e8f0);
}

.blur-result-img {
  display: block;
  width: 100%;
  height: auto;
}

.blur-toast-notice {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #0f172a;
  color: #ffffff;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  z-index: 999;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 13px;
  margin-top: 14px;
}

.banner-close-btn {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 18px;
  line-height: 1;
  color: #b91c1c;
  cursor: pointer;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

