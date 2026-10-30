<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  CircleAlert,
  Crop,
  Download,
  Eye,
  FileCheck,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Unlock,
  Upload,
  Wand2,
  X,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import { openPdfForImages } from '~/utils/pdf-images.js';
import {
  CROP_PRESETS,
  CROP_UNITS,
  cropPdf,
  cropPdfFilename,
  detectContentMargins,
  validatePdfForCrop,
} from '~/utils/crop-pdf.js';

// State
const file = shallowRef(null);
const busy = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const resultPdf = ref(null);
const input = ref(null);
const uploadButton = ref(null);
const totalPages = ref(1);
const currentPage = ref(1);

// Canvas preview state
const previewContainer = ref(null);
const previewCanvas = ref(null);
const previewImage = ref(null);
const isRenderingPreview = ref(false);
let pdfHandle = null;

// Page dimensions in PDF points
const pageWidthPt = ref(595.28);
const pageHeightPt = ref(841.89);

// Visual Margins in points (pt)
const marginTop = ref(36);
const marginBottom = ref(36);
const marginLeft = ref(36);
const marginRight = ref(36);
const lockAspect = ref(false);
const linkMargins = ref(false);

// Presets & Units
const selectedPreset = ref('custom');
const activeUnit = ref('mm'); // 'mm' | 'pt' | 'in' | 'percent'

// Page scope: 'all' | 'current' | 'custom'
const pageScope = ref('all');
const customRange = ref('');

// Dragging state for crop overlay
const isDraggingCrop = ref(false);
const activeHandle = ref(null); // 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
let startX = 0;
let startY = 0;
let startMargins = { top: 0, bottom: 0, left: 0, right: 0 };

let dropDepth = 0;
let active = true;

const stage = computed(() => (resultPdf.value ? 3 : file.value ? 2 : 1));

// Unit conversion helpers
const PT_TO_MM = 25.4 / 72;
const MM_TO_PT = 72 / 25.4;
const PT_TO_IN = 1 / 72;
const IN_TO_PT = 72;

function ptToCurrentUnit(valPt, dimensionPt = 1) {
  if (activeUnit.value === 'mm') return Math.round(valPt * PT_TO_MM * 10) / 10;
  if (activeUnit.value === 'in') return Math.round(valPt * PT_TO_IN * 100) / 100;
  if (activeUnit.value === 'percent') return Math.round((valPt / dimensionPt) * 1000) / 10;
  return Math.round(valPt);
}

function currentUnitToPt(valUnit, dimensionPt = 1) {
  const num = Math.max(0, parseFloat(valUnit) || 0);
  if (activeUnit.value === 'mm') return num * MM_TO_PT;
  if (activeUnit.value === 'in') return num * IN_TO_PT;
  if (activeUnit.value === 'percent') return (num / 100) * dimensionPt;
  return num;
}

// Visual dimensions computed
const croppedWidthPt = computed(() => Math.max(10, pageWidthPt.value - marginLeft.value - marginRight.value));
const croppedHeightPt = computed(() => Math.max(10, pageHeightPt.value - marginTop.value - marginBottom.value));

const originalWidthMm = computed(() => Math.round(pageWidthPt.value * PT_TO_MM));
const originalHeightMm = computed(() => Math.round(pageHeightPt.value * PT_TO_MM));
const croppedWidthMm = computed(() => Math.round(croppedWidthPt.value * PT_TO_MM));
const croppedHeightMm = computed(() => Math.round(croppedHeightPt.value * PT_TO_MM));

const areaReductionPercent = computed(() => {
  const origArea = pageWidthPt.value * pageHeightPt.value;
  const newArea = croppedWidthPt.value * croppedHeightPt.value;
  if (origArea <= 0) return 0;
  const reduction = Math.round(((origArea - newArea) / origArea) * 100);
  return Math.max(0, Math.min(99, reduction));
});

// Crop rect percentages relative to preview canvas (0..100%)
const cropBoxStyle = computed(() => {
  const w = pageWidthPt.value || 1;
  const h = pageHeightPt.value || 1;
  const leftPct = (marginLeft.value / w) * 100;
  const topPct = (marginTop.value / h) * 100;
  const rightPct = (marginRight.value / w) * 100;
  const bottomPct = (marginBottom.value / h) * 100;
  const widthPct = Math.max(0, 100 - leftPct - rightPct);
  const heightPct = Math.max(0, 100 - topPct - bottomPct);

  return {
    left: `${leftPct}%`,
    top: `${topPct}%`,
    width: `${widthPct}%`,
    height: `${heightPct}%`,
  };
});

onBeforeUnmount(() => {
  active = false;
  clearResult();
  closePdfHandle();
});

function closePdfHandle() {
  if (pdfHandle) {
    try {
      pdfHandle.close();
    } catch {}
    pdfHandle = null;
  }
}

function clearResult() {
  if (resultPdf.value?.url) {
    URL.revokeObjectURL(resultPdf.value.url);
  }
  resultPdf.value = null;
}

async function onFileSelected(e) {
  const selected = e.target?.files?.[0];
  if (!selected) return;
  await handleFile(selected);
}

async function handleFile(candidate) {
  const validationError = validatePdfForCrop(candidate);
  if (validationError) {
    error.value = validationError;
    return;
  }

  error.value = '';
  clearResult();
  closePdfHandle();
  busy.value = true;
  progress.value = 'Analyzing PDF pages…';

  try {
    const handle = await openPdfForImages(candidate, {
      onProgress: (msg) => {
        if (active) progress.value = msg;
      },
    });

    pdfHandle = handle;
    totalPages.value = handle.pageCount;
    currentPage.value = 1;
    file.value = candidate;

    // Default margins (10 mm standard trim)
    applyPreset('trim-10mm');

    await nextTick();
    await renderCurrentPagePreview();
  } catch (err) {
    console.error('PDF inspect error:', err);
    error.value = err.message || 'Could not load PDF document. Please choose a valid PDF.';
    file.value = null;
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

async function renderCurrentPagePreview() {
  if (!pdfHandle || !active) return;
  isRenderingPreview.value = true;

  try {
    const renderRes = await pdfHandle.renderPage(currentPage.value, {
      maxDimension: 900,
      format: 'png',
      quality: 0.95,
    });

    if (renderRes?.blob) {
      if (previewImage.value) {
        URL.revokeObjectURL(previewImage.value);
      }
      previewImage.value = URL.createObjectURL(renderRes.blob);
      pageWidthPt.value = renderRes.width || 595.28;
      pageHeightPt.value = renderRes.height || 841.89;
    }
  } catch (err) {
    console.warn('Preview render notice:', err);
  } finally {
    isRenderingPreview.value = false;
  }
}

async function goToPage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return;
  currentPage.value = page;
  await renderCurrentPagePreview();
}

// Preset application
function applyPreset(presetId) {
  selectedPreset.value = presetId;
  const p = CROP_PRESETS.find((x) => x.id === presetId);
  if (!p) return;

  if (p.marginsMm) {
    const pt = p.marginsMm * MM_TO_PT;
    setAllMargins(pt);
  } else if (p.marginsIn) {
    const pt = p.marginsIn * IN_TO_PT;
    setAllMargins(pt);
  } else if (presetId === 'auto-trim') {
    triggerAutoTrim();
  }
}

function setAllMargins(valPt) {
  marginTop.value = Math.round(valPt);
  marginBottom.value = Math.round(valPt);
  marginLeft.value = Math.round(valPt);
  marginRight.value = Math.round(valPt);
}

function resetCrop() {
  marginTop.value = 0;
  marginBottom.value = 0;
  marginLeft.value = 0;
  marginRight.value = 0;
  selectedPreset.value = 'custom';
}

async function triggerAutoTrim() {
  if (!previewImage.value) return;
  busy.value = true;
  progress.value = 'Auto-detecting content borders…';

  try {
    const img = new Image();
    img.src = previewImage.value;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const detected = detectContentMargins(canvas, pageWidthPt.value, pageHeightPt.value);
    marginTop.value = detected.top;
    marginBottom.value = detected.bottom;
    marginLeft.value = detected.left;
    marginRight.value = detected.right;
  } catch (err) {
    console.warn('Auto trim error:', err);
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

// Handle margin input changes
function onMarginChange(side, e) {
  selectedPreset.value = 'custom';
  const valPt = currentUnitToPt(e.target.value, side === 'left' || side === 'right' ? pageWidthPt.value : pageHeightPt.value);

  if (linkMargins.value) {
    setAllMargins(valPt);
    return;
  }

  if (side === 'top') marginTop.value = Math.min(pageHeightPt.value - marginBottom.value - 20, Math.max(0, valPt));
  if (side === 'bottom') marginBottom.value = Math.min(pageHeightPt.value - marginTop.value - 20, Math.max(0, valPt));
  if (side === 'left') marginLeft.value = Math.min(pageWidthPt.value - marginRight.value - 20, Math.max(0, valPt));
  if (side === 'right') marginRight.value = Math.min(pageWidthPt.value - marginLeft.value - 20, Math.max(0, valPt));
}

// Drag & Drop handlers for crop box
function startDrag(handle, event) {
  event.preventDefault();
  event.stopPropagation();

  isDraggingCrop.value = true;
  activeHandle.value = handle;
  selectedPreset.value = 'custom';

  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;

  startX = clientX;
  startY = clientY;
  startMargins = {
    top: marginTop.value,
    bottom: marginBottom.value,
    left: marginLeft.value,
    right: marginRight.value,
  };

  window.addEventListener('mousemove', onDragging);
  window.addEventListener('touchmove', onDragging, { passive: false });
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchend', stopDrag);
}

function onDragging(event) {
  if (!isDraggingCrop.value || !previewContainer.value) return;
  event.preventDefault();

  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;

  const rect = previewContainer.value.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const scaleX = pageWidthPt.value / rect.width;
  const scaleY = pageHeightPt.value / rect.height;

  const deltaXPt = (clientX - startX) * scaleX;
  const deltaYPt = (clientY - startY) * scaleY;

  const h = activeHandle.value;
  const w = pageWidthPt.value;
  const hPt = pageHeightPt.value;

  if (h === 'move') {
    // Reposition box without resizing
    const boxW = w - startMargins.left - startMargins.right;
    const boxH = hPt - startMargins.top - startMargins.bottom;

    let newLeft = startMargins.left + deltaXPt;
    let newTop = startMargins.top + deltaYPt;

    newLeft = Math.max(0, Math.min(w - boxW, newLeft));
    newTop = Math.max(0, Math.min(hPt - boxH, newTop));

    marginLeft.value = Math.round(newLeft);
    marginRight.value = Math.round(w - newLeft - boxW);
    marginTop.value = Math.round(newTop);
    marginBottom.value = Math.round(hPt - newTop - boxH);
    return;
  }

  // Handle resizing from individual sides and corners
  if (h.includes('w')) {
    const newLeft = Math.max(0, Math.min(w - startMargins.right - 20, startMargins.left + deltaXPt));
    marginLeft.value = Math.round(newLeft);
    if (linkMargins.value) setAllMargins(newLeft);
  }
  if (h.includes('e')) {
    const newRight = Math.max(0, Math.min(w - startMargins.left - 20, startMargins.right - deltaXPt));
    marginRight.value = Math.round(newRight);
    if (linkMargins.value) setAllMargins(newRight);
  }
  if (h.includes('n')) {
    const newTop = Math.max(0, Math.min(hPt - startMargins.bottom - 20, startMargins.top + deltaYPt));
    marginTop.value = Math.round(newTop);
    if (linkMargins.value) setAllMargins(newTop);
  }
  if (h.includes('s')) {
    const newBottom = Math.max(0, Math.min(hPt - startMargins.top - 20, startMargins.bottom - deltaYPt));
    marginBottom.value = Math.round(newBottom);
    if (linkMargins.value) setAllMargins(newBottom);
  }
}

function stopDrag() {
  isDraggingCrop.value = false;
  activeHandle.value = null;
  window.removeEventListener('mousemove', onDragging);
  window.removeEventListener('touchmove', onDragging);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchend', stopDrag);
}

// Drag & drop file upload handlers
function onDragEnter(e) {
  e.preventDefault();
  dropDepth++;
  dragging.value = true;
}

function onDragOver(e) {
  e.preventDefault();
}

function onDragLeave(e) {
  e.preventDefault();
  dropDepth = Math.max(0, dropDepth - 1);
  if (dropDepth === 0) dragging.value = false;
}

function onDrop(e) {
  e.preventDefault();
  dropDepth = 0;
  dragging.value = false;
  const dropped = e.dataTransfer?.files?.[0];
  if (dropped) handleFile(dropped);
}

// Main conversion trigger
async function handleCropPdf() {
  if (!file.value || busy.value) return;

  busy.value = true;
  error.value = '';
  progress.value = 'Cropping PDF pages…';

  try {
    const margins = {
      top: marginTop.value,
      bottom: marginBottom.value,
      left: marginLeft.value,
      right: marginRight.value,
    };

    const res = await cropPdf(
      file.value,
      {
        margins,
        pageScope: pageScope.value,
        currentPage: currentPage.value,
        customRange: customRange.value,
        syncMediaBox: true,
      },
      {
        onProgress: (msg) => {
          if (active) progress.value = msg;
        },
      }
    );

    const filename = cropPdfFilename(file.value.name);
    const url = URL.createObjectURL(res.blob);

    resultPdf.value = {
      blob: res.blob,
      url,
      filename,
      size: res.blob.size,
      originalSize: file.value.size,
      pageCount: res.pageCount,
      croppedPagesCount: res.croppedPagesCount,
      croppedWidthMm: croppedWidthMm.value,
      croppedHeightMm: croppedHeightMm.value,
    };
  } catch (err) {
    console.error('Crop PDF error:', err);
    error.value = err.message || 'An error occurred while cropping the PDF.';
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

function resetAll() {
  clearResult();
  closePdfHandle();
  file.value = null;
  error.value = '';
  progress.value = '';
  if (previewImage.value) {
    URL.revokeObjectURL(previewImage.value);
    previewImage.value = null;
  }
  if (input.value) input.value.value = '';
  resetCrop();
  nextTick(() => {
    uploadButton.value?.focus();
  });
}
</script>

<template>
  <div id="converter" class="converter crop-pdf-converter" :class="{ 'is-converting': busy }" aria-label="Crop PDF converter">
    <!-- Step Progress Header -->
    <ol class="step-track" aria-label="Crop PDF steps">
      <li :class="{ current: stage === 1, complete: stage > 1 }">
        <span><Check v-if="stage > 1" :size="12" /><template v-else>1</template></span>
        Upload PDF
      </li>
      <li :class="{ current: stage === 2, complete: stage > 2 }">
        <span><Check v-if="stage > 2" :size="12" /><template v-else>2</template></span>
        Set Crop Area
      </li>
      <li :class="{ current: stage === 3 }">
        <span>3</span>
        Download
      </li>
    </ol>

    <!-- Error Alert -->
    <div v-if="error" class="alert-box" role="alert">
      <CircleAlert :size="18" />
      <div>
        <strong>Cannot Crop Document</strong>
        <p>{{ error }}</p>
      </div>
      <button class="alert-close" type="button" aria-label="Dismiss alert" @click="error = ''">
        <X :size="16" />
      </button>
    </div>

    <!-- Hidden native file input -->
    <input
      ref="input"
      type="file"
      accept=".pdf,application/pdf"
      class="visually-hidden"
      tabindex="-1"
      @change="onFileSelected"
    />

    <!-- STAGE 1: UPLOAD DROPZONE -->
    <section
      v-if="stage === 1"
      class="drop-zone"
      :class="{ dragging }"
      role="region"
      aria-label="Upload PDF to crop"
      @dragenter="onDragEnter"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div class="crop-upload-art" aria-hidden="true">
        <Crop :size="34" />
        <span class="art-badge"><Sparkles :size="14" /></span>
      </div>

      <div class="drop-text">
        <h3>Drop your PDF document here</h3>
        <p>Or select a file from your device. 100% private in-browser cropping with zero server uploads.</p>
      </div>

      <button
        ref="uploadButton"
        type="button"
        class="primary-button choose-button"
        :disabled="busy"
        @click="input?.click()"
      >
        <Upload :size="18" />
        Choose PDF File
      </button>

      <div class="drop-features">
        <span><Check :size="14" /> Vector Lossless Quality</span>
        <span><Check :size="14" /> Interactive Visual Box</span>
        <span><Check :size="14" /> Up to 100 MB</span>
      </div>
    </section>

    <!-- STAGE 2: CROP STUDIO WORKSPACE -->
    <section v-else-if="stage === 2" class="crop-studio" aria-label="Crop PDF Studio">
      <!-- File Summary Strip -->
      <div class="file-summary-bar">
        <div class="file-info">
          <div class="file-icon"><Crop :size="20" /></div>
          <div>
            <strong>{{ file?.name }}</strong>
            <span>{{ formatSize(file?.size || 0) }} · {{ totalPages }} {{ totalPages === 1 ? 'page' : 'pages' }}</span>
          </div>
        </div>
        <button type="button" class="action-link" @click="resetAll">
          <RotateCcw :size="14" /> Choose Different File
        </button>
      </div>

      <!-- Main Studio Layout: Interactive Preview + Settings Sidebar -->
      <div class="studio-body-layout">
        <!-- Interactive Visual Crop Preview Column -->
        <div class="crop-preview-column">
          <!-- Page pagination toolbar -->
          <div v-if="totalPages > 1" class="preview-page-nav">
            <button
              type="button"
              class="nav-btn"
              :disabled="currentPage <= 1 || isRenderingPreview"
              aria-label="Previous page"
              @click="goToPage(currentPage - 1)"
            >
              <ArrowLeft :size="16" />
            </button>
            <span class="page-badge">Page {{ currentPage }} of {{ totalPages }}</span>
            <button
              type="button"
              class="nav-btn"
              :disabled="currentPage >= totalPages || isRenderingPreview"
              aria-label="Next page"
              @click="goToPage(currentPage + 1)"
            >
              <ArrowRight :size="16" />
            </button>
          </div>

          <!-- Canvas & Interactive Crop Frame Container -->
          <div class="crop-stage-wrapper">
            <div
              ref="previewContainer"
              class="crop-interactive-stage"
              :class="{ 'is-loading': isRenderingPreview }"
            >
              <!-- PDF Page Preview Image -->
              <img
                v-if="previewImage"
                :src="previewImage"
                alt="PDF Page Preview for Cropping"
                class="stage-pdf-image"
                draggable="false"
              />

              <!-- Darkened Dim Masks Outside Crop Area -->
              <div
                class="crop-mask-top"
                :style="{ height: cropBoxStyle.top }"
              />
              <div
                class="crop-mask-bottom"
                :style="{ top: `calc(${cropBoxStyle.top} + ${cropBoxStyle.height})`, height: `calc(100% - ${cropBoxStyle.top} - ${cropBoxStyle.height})` }"
              />
              <div
                class="crop-mask-left"
                :style="{ top: cropBoxStyle.top, height: cropBoxStyle.height, width: cropBoxStyle.left }"
              />
              <div
                class="crop-mask-right"
                :style="{ top: cropBoxStyle.top, height: cropBoxStyle.height, left: `calc(${cropBoxStyle.left} + ${cropBoxStyle.width})`, width: `calc(100% - ${cropBoxStyle.left} - ${cropBoxStyle.width})` }"
              />

              <!-- Active Draggable & Resizable Crop Box -->
              <div
                class="crop-active-box"
                :style="cropBoxStyle"
                @mousedown="startDrag('move', $event)"
                @touchstart="startDrag('move', $event)"
              >
                <!-- Crop Grid Lines (Rule of Thirds) -->
                <div class="crop-grid-line v1" />
                <div class="crop-grid-line v2" />
                <div class="crop-grid-line h1" />
                <div class="crop-grid-line h2" />

                <!-- Corner Handles -->
                <div class="crop-handle nw" @mousedown.stop="startDrag('nw', $event)" @touchstart.stop="startDrag('nw', $event)" />
                <div class="crop-handle ne" @mousedown.stop="startDrag('ne', $event)" @touchstart.stop="startDrag('ne', $event)" />
                <div class="crop-handle se" @mousedown.stop="startDrag('se', $event)" @touchstart.stop="startDrag('se', $event)" />
                <div class="crop-handle sw" @mousedown.stop="startDrag('sw', $event)" @touchstart.stop="startDrag('sw', $event)" />

                <!-- Side Handles -->
                <div class="crop-handle n" @mousedown.stop="startDrag('n', $event)" @touchstart.stop="startDrag('n', $event)" />
                <div class="crop-handle e" @mousedown.stop="startDrag('e', $event)" @touchstart.stop="startDrag('e', $event)" />
                <div class="crop-handle s" @mousedown.stop="startDrag('s', $event)" @touchstart.stop="startDrag('s', $event)" />
                <div class="crop-handle w" @mousedown.stop="startDrag('w', $event)" @touchstart.stop="startDrag('w', $event)" />

                <!-- Center Move Icon / Badge -->
                <div class="crop-center-badge">
                  <span>{{ croppedWidthMm }} × {{ croppedHeightMm }} mm</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Live Dimensions Info Bar -->
          <div class="dimensions-summary-bar">
            <div class="dim-stat">
              <span class="dim-label">Original Page</span>
              <strong>{{ originalWidthMm }} × {{ originalHeightMm }} mm</strong>
            </div>
            <div class="dim-arrow">&rarr;</div>
            <div class="dim-stat highlight">
              <span class="dim-label">Cropped Result</span>
              <strong>{{ croppedWidthMm }} × {{ croppedHeightMm }} mm</strong>
            </div>
            <div v-if="areaReductionPercent > 0" class="dim-stat-reduction">
              <span>-{{ areaReductionPercent }}% trimmed</span>
            </div>
          </div>
        </div>

        <!-- Settings & Custom Controls Sidebar -->
        <div class="crop-controls-sidebar">
          <!-- Preset Selector -->
          <div class="control-card">
            <div class="card-header">
              <div class="card-title">
                <Sliders :size="16" />
                <span>Crop Presets</span>
              </div>
            </div>

            <div class="presets-grid">
              <button
                v-for="p in CROP_PRESETS"
                :key="p.id"
                type="button"
                class="preset-btn"
                :class="{ active: selectedPreset === p.id }"
                @click="applyPreset(p.id)"
              >
                <span class="preset-name">{{ p.name }}</span>
                <small class="preset-desc">{{ p.desc }}</small>
              </button>
            </div>
          </div>

          <!-- Exact Margins Setup -->
          <div class="control-card">
            <div class="card-header">
              <div class="card-title">
                <Crop :size="16" />
                <span>Custom Margins</span>
              </div>
              <!-- Units Pill Selector -->
              <div class="unit-pills">
                <button
                  v-for="u in CROP_UNITS"
                  :key="u.id"
                  type="button"
                  class="unit-pill"
                  :class="{ active: activeUnit === u.id }"
                  @click="activeUnit = u.id"
                >
                  {{ u.id.toUpperCase() }}
                </button>
              </div>
            </div>

            <!-- 4 Margins Inputs Grid -->
            <div class="margins-stepper-grid">
              <div class="margin-input-col top">
                <label>Top Margin</label>
                <div class="input-wrap">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    :value="ptToCurrentUnit(marginTop, pageHeightPt)"
                    @input="onMarginChange('top', $event)"
                  />
                  <span class="unit-tag">{{ activeUnit }}</span>
                </div>
              </div>

              <div class="margin-input-row mid">
                <div class="margin-input-col">
                  <label>Left Margin</label>
                  <div class="input-wrap">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      :value="ptToCurrentUnit(marginLeft, pageWidthPt)"
                      @input="onMarginChange('left', $event)"
                    />
                    <span class="unit-tag">{{ activeUnit }}</span>
                  </div>
                </div>

                <div class="margin-link-toggle">
                  <button
                    type="button"
                    class="link-btn"
                    :class="{ active: linkMargins }"
                    :title="linkMargins ? 'Unlock sides' : 'Lock all 4 sides equal'"
                    @click="linkMargins = !linkMargins"
                  >
                    <Lock v-if="linkMargins" :size="15" />
                    <Unlock v-else :size="15" />
                  </button>
                </div>

                <div class="margin-input-col">
                  <label>Right Margin</label>
                  <div class="input-wrap">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      :value="ptToCurrentUnit(marginRight, pageWidthPt)"
                      @input="onMarginChange('right', $event)"
                    />
                    <span class="unit-tag">{{ activeUnit }}</span>
                  </div>
                </div>
              </div>

              <div class="margin-input-col bottom">
                <label>Bottom Margin</label>
                <div class="input-wrap">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    :value="ptToCurrentUnit(marginBottom, pageHeightPt)"
                    @input="onMarginChange('bottom', $event)"
                  />
                  <span class="unit-tag">{{ activeUnit }}</span>
                </div>
              </div>
            </div>

            <div class="margin-actions-row">
              <button type="button" class="btn-subtle" @click="resetCrop">
                <RotateCcw :size="13" /> Reset to Full Page
              </button>
              <button type="button" class="btn-subtle" @click="triggerAutoTrim">
                <Wand2 :size="13" /> Auto-Detect Borders
              </button>
            </div>
          </div>

          <!-- Page Scope Selector -->
          <div class="control-card">
            <div class="card-header">
              <div class="card-title">
                <Layers :size="16" />
                <span>Apply Crop To</span>
              </div>
            </div>

            <div class="scope-options">
              <label class="radio-card" :class="{ selected: pageScope === 'all' }">
                <input v-model="pageScope" type="radio" value="all" />
                <div>
                  <strong>All Pages</strong>
                  <small>Apply this crop box to all {{ totalPages }} pages</small>
                </div>
              </label>

              <label class="radio-card" :class="{ selected: pageScope === 'current' }">
                <input v-model="pageScope" type="radio" value="current" />
                <div>
                  <strong>Current Page Only</strong>
                  <small>Only crop page {{ currentPage }}</small>
                </div>
              </label>

              <label class="radio-card" :class="{ selected: pageScope === 'custom' }">
                <input v-model="pageScope" type="radio" value="custom" />
                <div>
                  <strong>Custom Page Range</strong>
                  <small>e.g. 1-3, 5, odd, even</small>
                </div>
              </label>
            </div>

            <div v-if="pageScope === 'custom'" class="custom-range-input-wrap">
              <label for="custom-range-field">Pages to Crop:</label>
              <input
                id="custom-range-field"
                v-model="customRange"
                type="text"
                placeholder="e.g. 1-5, 8, 11-14"
                class="input-custom-range"
              />
            </div>
          </div>

          <!-- Action Crop Button -->
          <div class="action-submit-card">
            <button
              type="button"
              class="primary-button crop-submit-btn"
              :disabled="busy"
              @click="handleCropPdf"
            >
              <Crop :size="19" />
              Crop &amp; Download PDF
            </button>
            <p class="privacy-note">
              Lossless vector cropping. Your files never leave your browser.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- STAGE 3: DOWNLOAD READY SCREEN -->
    <section v-else-if="stage === 3" class="result-state" aria-label="Cropped PDF ready">
      <div class="success-icon" aria-hidden="true">
        <CheckCheck :size="32" />
        <span class="success-ring" />
      </div>

      <span class="mini-label">CROPPING COMPLETE</span>
      <h2>Your cropped PDF is ready!</h2>
      <p>
        Cropped {{ resultPdf?.croppedPagesCount }} {{ resultPdf?.croppedPagesCount === 1 ? 'page' : 'pages' }} to
        {{ resultPdf?.croppedWidthMm }} × {{ resultPdf?.croppedHeightMm }} mm with 100% lossless clarity.
      </p>

      <div class="selected-file">
        <div class="file-icon"><Crop :size="24" /></div>
        <div class="file-details">
          <strong>{{ resultPdf?.filename }}</strong>
          <span>{{ formatSize(resultPdf?.size || 0) }} · PDF Document</span>
        </div>
        <span class="ready-dot" aria-hidden="true" />
      </div>

      <div class="result-actions">
        <a
          class="primary-button download-btn"
          :href="resultPdf?.url"
          :download="resultPdf?.filename"
        >
          <Download :size="18" />
          Download Cropped PDF
        </a>

        <button type="button" class="btn-secondary" @click="resetAll">
          <RotateCcw :size="16" />
          Crop Another Document
        </button>
      </div>
    </section>

    <!-- Progress Indicator Overlay -->
    <div v-if="busy && progress" class="progress-overlay" role="status">
      <div class="progress-box">
        <div class="spinner" aria-hidden="true" />
        <strong>Processing Document</strong>
        <p>{{ progress }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.crop-pdf-converter {
  position: relative;
  width: 100%;
}

/* Upload dropzone styling */
.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 56px 24px;
  border: 2px dashed rgba(225, 29, 72, 0.35);
  border-radius: 20px;
  background: rgba(225, 29, 72, 0.02);
  transition: all 0.25s ease;
  min-height: 380px;
}
.drop-zone.dragging {
  border-color: #e11d48;
  background: rgba(225, 29, 72, 0.08);
  transform: scale(1.008);
}
.crop-upload-art {
  position: relative;
  display: grid;
  place-items: center;
  width: 82px;
  height: 82px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(225, 29, 72, 0.2) 0%, rgba(217, 119, 6, 0.3) 100%);
  color: #e11d48;
  margin-bottom: 20px;
  box-shadow: 0 12px 30px rgba(225, 29, 72, 0.2);
}
.art-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e11d48;
  color: #ffffff;
}
.drop-text h3 {
  font-size: 20px;
  font-weight: 750;
  color: #ffffff;
  margin: 0 0 8px;
}
html[data-theme='light'] .drop-text h3 {
  color: #0f172a;
}
.drop-text p {
  font-size: 14px;
  color: #94a3b8;
  max-width: 480px;
  margin: 0 auto 24px;
}
.choose-button {
  min-width: 220px;
  font-size: 15px;
  font-weight: 650;
  padding: 13px 28px;
  background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(217, 119, 6, 0.35);
}
.choose-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #fb7185 0%, #be123c 100%);
  transform: translateY(-1px);
}
.drop-features {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 18px;
  margin-top: 32px;
  font-size: 12px;
  font-weight: 550;
  color: #94a3b8;
}
.drop-features span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* File summary bar */
.file-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
}
html[data-theme='light'] .file-summary-bar {
  background: #f8fafc;
  border-color: #e2e8f0;
}
.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.file-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(225, 29, 72, 0.15);
  color: #e11d48;
  flex-shrink: 0;
}
.file-info strong {
  display: block;
  font-size: 14px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
html[data-theme='light'] .file-info strong {
  color: #0f172a;
}
.file-info span {
  font-size: 12px;
  color: #94a3b8;
}
.action-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #e11d48;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: background 0.2s;
}
.action-link:hover {
  background: rgba(225, 29, 72, 0.1);
}

/* Studio Body Layout */
.studio-body-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
  gap: 24px;
  align-items: start;
}
@media (max-width: 900px) {
  .studio-body-layout {
    grid-template-columns: 1fr;
  }
}

/* Preview Column */
.crop-preview-column {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.preview-page-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
}
html[data-theme='light'] .preview-page-nav {
  background: #f1f5f9;
  border-color: #e2e8f0;
}
.nav-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  cursor: pointer;
}
html[data-theme='light'] .nav-btn {
  border-color: #cbd5e1;
  background: #ffffff;
  color: #0f172a;
}
.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-badge {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
}
html[data-theme='light'] .page-badge {
  color: #334155;
}

/* Crop stage wrapper & interactive canvas */
.crop-stage-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  min-height: 440px;
}
html[data-theme='light'] .crop-stage-wrapper {
  background: #e2e8f0;
  border-color: #cbd5e1;
}
.crop-interactive-stage {
  position: relative;
  display: inline-block;
  line-height: 0;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
  border-radius: 4px;
  user-select: none;
  touch-action: none;
  max-width: 100%;
}
.stage-pdf-image {
  display: block;
  max-width: 100%;
  max-height: 520px;
  width: auto;
  height: auto;
  border-radius: 4px;
  pointer-events: none;
}

/* Dim masks outside crop area */
.crop-mask-top,
.crop-mask-bottom,
.crop-mask-left,
.crop-mask-right {
  position: absolute;
  background: rgba(15, 23, 42, 0.65);
  pointer-events: none;
  backdrop-filter: blur(1.5px);
}
.crop-mask-top { top: 0; left: 0; width: 100%; }
.crop-mask-bottom { left: 0; width: 100%; }

/* Active Crop Box */
.crop-active-box {
  position: absolute;
  cursor: move;
  border: 2px dashed #e11d48;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), inset 0 0 16px rgba(225, 29, 72, 0.15);
  touch-action: none;
  box-sizing: border-box;
}

/* Rule of Thirds grid lines */
.crop-grid-line {
  position: absolute;
  pointer-events: none;
  opacity: 0.35;
}
.crop-grid-line.v1 { top: 0; bottom: 0; left: 33.33%; border-left: 1px dashed #ffffff; }
.crop-grid-line.v2 { top: 0; bottom: 0; left: 66.66%; border-left: 1px dashed #ffffff; }
.crop-grid-line.h1 { left: 0; right: 0; top: 33.33%; border-top: 1px dashed #ffffff; }
.crop-grid-line.h2 { left: 0; right: 0; top: 66.66%; border-top: 1px dashed #ffffff; }

/* Center dimensions badge */
.crop-center-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.crop-center-badge span {
  display: inline-block;
  padding: 4px 9px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.85);
  color: #fecdd3;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

/* Corner & Side Handles */
.crop-handle {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #e11d48;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  touch-action: none;
}
.crop-handle.nw { top: -7px; left: -7px; cursor: nwse-resize; }
.crop-handle.ne { top: -7px; right: -7px; cursor: nesw-resize; }
.crop-handle.se { bottom: -7px; right: -7px; cursor: nwse-resize; }
.crop-handle.sw { bottom: -7px; left: -7px; cursor: nesw-resize; }

.crop-handle.n { top: -7px; left: calc(50% - 7px); cursor: ns-resize; border-radius: 3px; width: 18px; }
.crop-handle.s { bottom: -7px; left: calc(50% - 7px); cursor: ns-resize; border-radius: 3px; width: 18px; }
.crop-handle.w { top: calc(50% - 7px); left: -7px; cursor: ew-resize; border-radius: 3px; height: 18px; }
.crop-handle.e { top: calc(50% - 7px); right: -7px; cursor: ew-resize; border-radius: 3px; height: 18px; }

/* Dimensions Summary Bar */
.dimensions-summary-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  font-size: 13px;
}
html[data-theme='light'] .dimensions-summary-bar {
  background: #ffffff;
  border-color: #e2e8f0;
}
.dim-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.dim-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 550;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.dim-stat strong {
  font-size: 14px;
  color: #cbd5e1;
}
html[data-theme='light'] .dim-stat strong {
  color: #1e293b;
}
.dim-stat.highlight strong {
  color: #e11d48;
}
.dim-arrow {
  color: #64748b;
  font-size: 16px;
}
.dim-stat-reduction span {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(225, 29, 72, 0.15);
  color: #e11d48;
  font-size: 11px;
  font-weight: 700;
}

/* Sidebar Control Cards */
.crop-controls-sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.control-card {
  padding: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
}
html[data-theme='light'] .control-card {
  background: #ffffff;
  border-color: #e2e8f0;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
}
html[data-theme='light'] .card-title {
  color: #0f172a;
}
.card-title svg {
  color: #e11d48;
}

/* Presets Grid */
.presets-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.2s;
}
html[data-theme='light'] .preset-btn {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #334155;
}
.preset-btn:hover {
  border-color: #e11d48;
  background: rgba(225, 29, 72, 0.06);
}
.preset-btn.active {
  border-color: #e11d48;
  background: rgba(225, 29, 72, 0.12);
  color: #ffffff;
  box-shadow: 0 0 0 1px #e11d48;
}
html[data-theme='light'] .preset-btn.active {
  color: #9f1239;
  background: #fff1f2;
}
.preset-name {
  font-size: 12.5px;
  font-weight: 650;
}
.preset-desc {
  font-size: 10.5px;
  color: #94a3b8;
  margin-top: 2px;
}

/* Units Pill Selector */
.unit-pills {
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
}
html[data-theme='light'] .unit-pills {
  background: #f1f5f9;
}
.unit-pill {
  padding: 4px 8px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.unit-pill.active {
  background: #e11d48;
  color: #ffffff;
}

/* Margins Stepper Grid */
.margins-stepper-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.margin-input-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.margin-input-col.top,
.margin-input-col.bottom {
  max-width: 180px;
  margin-inline: auto;
}
.margin-input-row.mid {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
}
.margin-input-row.mid .margin-input-col {
  flex: 1;
}
.margin-input-col label {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-align: center;
}
.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-wrap input {
  width: 100%;
  height: 38px;
  padding: 6px 36px 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.6);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}
html[data-theme='light'] .input-wrap input {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #0f172a;
}
.input-wrap input:focus {
  outline: none;
  border-color: #e11d48;
  box-shadow: 0 0 0 2px rgba(225, 29, 72, 0.2);
}
.unit-tag {
  position: absolute;
  right: 10px;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  pointer-events: none;
  text-transform: uppercase;
}
.margin-link-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 4px;
}
.link-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}
.link-btn.active {
  border-color: #e11d48;
  background: rgba(225, 29, 72, 0.15);
  color: #e11d48;
}

.margin-actions-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
html[data-theme='light'] .margin-actions-row {
  border-color: #e2e8f0;
}
.btn-subtle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
}
.btn-subtle:hover {
  color: #e11d48;
  background: rgba(225, 29, 72, 0.08);
}

/* Page Scope Radio Cards */
.scope-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.radio-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.2s;
}
html[data-theme='light'] .radio-card {
  background: #f8fafc;
  border-color: #e2e8f0;
}
.radio-card.selected {
  border-color: #e11d48;
  background: rgba(225, 29, 72, 0.08);
}
.radio-card input {
  accent-color: #e11d48;
}
.radio-card strong {
  display: block;
  font-size: 13px;
  color: #ffffff;
}
html[data-theme='light'] .radio-card strong {
  color: #0f172a;
}
.radio-card small {
  display: block;
  font-size: 11px;
  color: #94a3b8;
}
.custom-range-input-wrap {
  margin-top: 10px;
}
.custom-range-input-wrap label {
  display: block;
  font-size: 11.5px;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 4px;
}
.input-custom-range {
  width: 100%;
  height: 38px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.6);
  color: #ffffff;
  font-size: 13px;
}
html[data-theme='light'] .input-custom-range {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #0f172a;
}

/* Submit Card */
.action-submit-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.crop-submit-btn {
  width: 100%;
  justify-content: center;
  padding: 14px 24px;
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(217, 119, 6, 0.35);
}
.crop-submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #fb7185 0%, #be123c 100%);
  transform: translateY(-1px);
}
.privacy-note {
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
  margin: 0;
}

/* STAGE 3: RESULT STATE */
.result-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
}
.success-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  margin-bottom: 20px;
  box-shadow: 0 12px 30px rgba(16, 185, 129, 0.35);
}
.success-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid rgba(16, 185, 129, 0.3);
  animation: pulse-ring 2s infinite;
}
@keyframes pulse-ring {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 0.3; }
  100% { transform: scale(0.95); opacity: 0.8; }
}
.result-state h2 {
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 8px;
}
html[data-theme='light'] .result-state h2 {
  color: #0f172a;
}
.result-state p {
  font-size: 14px;
  color: #94a3b8;
  max-width: 520px;
  margin: 0 0 28px;
}
.selected-file {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 28px;
  width: min(440px, 100%);
}
html[data-theme='light'] .selected-file {
  background: #f8fafc;
  border-color: #e2e8f0;
}
.file-details {
  flex: 1;
  text-align: left;
  min-width: 0;
}
.file-details strong {
  display: block;
  font-size: 13.5px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
html[data-theme='light'] .file-details strong {
  color: #0f172a;
}
.file-details span {
  font-size: 12px;
  color: #94a3b8;
}
.ready-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}
.result-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(340px, 100%);
}
.download-btn {
  justify-content: center;
  padding: 14px 24px;
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
}
.download-btn:hover {
  background: linear-gradient(135deg, #34d399 0%, #059669 100%);
  transform: translateY(-1px);
}
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #cbd5e1;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
html[data-theme='light'] .btn-secondary {
  border-color: #cbd5e1;
  background: #ffffff;
  color: #334155;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

/* Progress Overlay */
.progress-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  border-radius: 20px;
  z-index: 50;
}
.progress-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 32px;
  background: #1e293b;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(225, 29, 72, 0.2);
  border-top-color: #e11d48;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 14px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.progress-box strong {
  font-size: 15px;
  color: #ffffff;
  margin-bottom: 4px;
}
.progress-box p {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

/* Alert Box */
.alert-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 20px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #fca5a5;
  font-size: 13px;
}
.alert-box strong {
  display: block;
  font-size: 13.5px;
  color: #f87171;
  margin-bottom: 2px;
}
.alert-box p {
  margin: 0;
  color: #fca5a5;
}
.alert-close {
  margin-left: auto;
  background: none;
  border: none;
  color: #f87171;
  cursor: pointer;
  padding: 2px;
}
</style>

