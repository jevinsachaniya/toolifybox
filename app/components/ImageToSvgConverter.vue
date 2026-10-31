<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import {
  Check,
  ChevronDown,
  CircleAlert,
  Code2,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileImage,
  ImageIcon,
  Layers,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Palette,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Split,
  Trash2,
  Upload,
  Wand2,
  X,
  Zap,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import {
  convertImageToSvg,
  IMAGE_TO_SVG_PRESETS,
  imageToSvgFilename,
  inspectSvgImageFile,
  renderSvgTo4kPngBlob,
  validateImageToSvgFile,
} from '~/utils/image-to-svg.js';

// State
const selectedFile = ref(null);
const imageMeta = ref(null);
const currentPreset = ref('ultra-4k');
const customColorCount = ref(64);
const removeBackground = ref(false);
const curveSmoothing = ref('smooth'); // crisp, smooth, ultra-smooth
const mergeSeams = ref(true); // Seam-bleed overlap to eliminate line borders
const polishedEffect = ref(false); // Off by default for 100% clean, crisp 4K vector output with zero filter/color distortion
const noiseFilter = ref(2); // 2px noise filter eliminates single-pixel jitter while preserving fine lines and details
const showAdvancedSettings = ref(false);

// Conversion state
const busy = ref(false);
const progressPercent = ref(0);
const progressMessage = ref('');
const error = ref('');
const toastMessage = ref('');
const conversionResult = ref(null);

// UI controls
const isDragging = ref(false);
const activeTab = ref('preview'); // 'preview' | 'split' | 'code'
const showCheckerboard = ref(true);
const previewZoom = ref(100); // 50, 75, 100, 150, 200
const isCopied = ref(false);
const fileInputRef = ref(null);

let abortController = null;
let toastTimer = null;
let copiedTimer = null;
let dropDepth = 0;

// Presets
const presets = IMAGE_TO_SVG_PRESETS;

// Line count of generated SVG code
const svgLineCount = computed(() => {
  if (!conversionResult.value?.svgString) return 0;
  return conversionResult.value.svgString.split('\n').length;
});

function showToast(msg) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3200);
}

// Preset selection
function selectPreset(preset) {
  currentPreset.value = preset.id;
  if (preset.options.numberofcolors) {
    customColorCount.value = preset.options.numberofcolors;
  }
}

// File Selection & Drag-and-Drop
function onDragEnter(e) {
  e.preventDefault();
  dropDepth++;
  isDragging.value = true;
}

function onDragLeave(e) {
  e.preventDefault();
  dropDepth--;
  if (dropDepth <= 0) {
    dropDepth = 0;
    isDragging.value = false;
  }
}

function onDragOver(e) {
  e.preventDefault();
}

function onDrop(e) {
  e.preventDefault();
  dropDepth = 0;
  isDragging.value = false;
  if (e.dataTransfer?.files?.length) {
    handleFileSelected(e.dataTransfer.files[0]);
  }
}

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
    fileInputRef.value.click();
  }
}

function onFileInputChange(e) {
  if (e.target?.files?.length) {
    handleFileSelected(e.target.files[0]);
    e.target.value = '';
  }
}

async function handleFileSelected(file) {
  const validation = validateImageToSvgFile(file);
  if (validation) {
    error.value = validation;
    return;
  }

  error.value = '';
  selectedFile.value = file;
  conversionResult.value = null;

  try {
    imageMeta.value = await inspectSvgImageFile(file);
  } catch (err) {
    error.value = err.message || 'Failed to inspect image file.';
    clearFile();
  }
}

function clearFile() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  if (imageMeta.value?.previewUrl) {
    URL.revokeObjectURL(imageMeta.value.previewUrl);
  }
  if (conversionResult.value?.dataUrl) {
    URL.revokeObjectURL(conversionResult.value.dataUrl);
  }

  selectedFile.value = null;
  imageMeta.value = null;
  conversionResult.value = null;
  busy.value = false;
  error.value = '';
  progressPercent.value = 0;
}

// Start Vector Conversion
async function startVectorization() {
  if (!selectedFile.value || busy.value) return;

  busy.value = true;
  error.value = '';
  progressPercent.value = 15;
  progressMessage.value = 'Analyzing image pixels & color quantization...';
  abortController = new AbortController();

  try {
    // Map curve smoothing setting to sRGB-safe pre-diffusion to eliminate stair-step rings
    let ltres = 0.1;
    let qtres = 0.1;
    let smoothRadius = 1;
    if (curveSmoothing.value === 'crisp') {
      ltres = 0.2;
      qtres = 0.2;
      smoothRadius = 0;
    } else if (curveSmoothing.value === 'smooth') {
      ltres = 0.1;
      qtres = 0.1;
      smoothRadius = 1;
    } else if (curveSmoothing.value === 'ultra-smooth') {
      ltres = 0.05;
      qtres = 0.05;
      smoothRadius = 2;
    }

    progressPercent.value = 45;
    progressMessage.value = 'Tracing smooth Bézier paths & merging boundaries...';

    // Small delay to let browser paint progress UI
    await new Promise(r => setTimeout(r, 40));

    const result = await convertImageToSvg(selectedFile.value, {
      presetId: currentPreset.value,
      customColors: customColorCount.value,
      ltres,
      qtres,
      pathomit: noiseFilter.value,
      strokewidth: 0.6,
      smoothRadius,
      removeBackground: removeBackground.value,
      mergeSeams: mergeSeams.value,
      polishedEffect: polishedEffect.value,
      signal: abortController.signal,
    });

    progressPercent.value = 90;
    progressMessage.value = 'Optimizing responsive SVG markup...';
    await new Promise(r => setTimeout(r, 30));

    conversionResult.value = result;
    progressPercent.value = 100;
    progressMessage.value = 'Done!';
    showToast('4K Scalable Vector SVG Generated Successfully!');
  } catch (err) {
    if (err.name !== 'AbortError') {
      error.value = err.message || 'An error occurred while converting the image to SVG.';
    }
  } finally {
    busy.value = false;
  }
}

// Copy SVG Code
async function copySvgCode() {
  if (!conversionResult.value?.svgString) return;
  try {
    await navigator.clipboard.writeText(conversionResult.value.svgString);
    isCopied.value = true;
    showToast('SVG Code copied to clipboard! Paste directly into HTML, React, Vue or Tailwind.');
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      isCopied.value = false;
    }, 2800);
  } catch {
    showToast('Could not access clipboard. Please manually select and copy the code.');
  }
}

// Download .svg file
function downloadSvg() {
  if (!conversionResult.value?.dataUrl) return;
  const link = document.createElement('a');
  link.href = conversionResult.value.dataUrl;
  link.download = conversionResult.value.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Downloaded ${conversionResult.value.filename}`);
}

// Download as 4K PNG raster (3840px)
async function download4kPng() {
  if (!conversionResult.value) return;
  try {
    const pngBlob = await renderSvgTo4kPngBlob(
      conversionResult.value.svgString,
      conversionResult.value.width,
      conversionResult.value.height,
      3840
    );
    const url = URL.createObjectURL(pngBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = conversionResult.value.filename.replace(/\.svg$/i, '-4k.png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded 3840px Ultra 4K PNG!');
  } catch (err) {
    showToast(err.message || 'Could not export 4K PNG.');
  }
}

onBeforeUnmount(() => {
  if (abortController) abortController.abort();
  if (toastTimer) clearTimeout(toastTimer);
  if (copiedTimer) clearTimeout(copiedTimer);
  if (imageMeta.value?.previewUrl) URL.revokeObjectURL(imageMeta.value.previewUrl);
  if (conversionResult.value?.dataUrl) URL.revokeObjectURL(conversionResult.value.dataUrl);
});
</script>

<template>
  <div id="converter" class="converter-card image-to-svg-converter">
    <!-- Dropzone View (when no file selected) -->
    <div
      v-if="!selectedFile"
      class="svg-dropzone"
      :class="{ 'is-dragging': isDragging }"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @dragover="onDragOver"
      @drop="onDrop"
      @click="triggerFileInput"
      tabindex="0"
      role="button"
      aria-label="Upload image to convert to SVG"
    >
      <div class="dropzone-inner">
        <div class="dropzone-icon-glow">
          <Sparkles class="icon-sparkle" :size="32" />
        </div>
        <h2 class="dropzone-title">Upload Image to Convert to SVG</h2>
        <p class="dropzone-desc">
          Transform PNG, JPG, WebP, GIF, or BMP into infinitely scalable, ultra-crisp 4K vector SVG code for web & design.
        </p>

        <div class="dropzone-meta-pill">
          <Zap :size="13" />
          <span>100% In-Browser Privacy • Scalable to 4K & Retina • Zero Server Upload</span>
        </div>

        <button type="button" class="dropzone-browse-btn" @click.stop="triggerFileInput">
          <Upload :size="16" />
          <span>Choose Image File</span>
        </button>

        <span class="dropzone-formats">Supported: PNG, JPG, JPEG, WebP, GIF, BMP, AVIF (Up to 25 MB)</span>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif"
        class="hidden-file-input"
        @change="onFileInputChange"
      />
    </div>

    <!-- Active Conversion & Settings Workspace -->
    <div v-else class="svg-workspace">
      <!-- File Information Strip -->
      <div class="file-strip">
        <div class="file-strip-left">
          <img
            v-if="imageMeta?.previewUrl"
            :src="imageMeta.previewUrl"
            :alt="imageMeta.name"
            class="file-thumb"
          />
          <div v-else class="file-thumb-fallback">
            <ImageIcon :size="20" />
          </div>

          <div class="file-info">
            <div class="file-title-row">
              <span class="file-name" :title="imageMeta?.name">{{ imageMeta?.name }}</span>
              <span class="infinite-badge"><Sparkles :size="11" /> 4K Scalable Vector</span>
            </div>
            <div class="file-sub-meta">
              <span>{{ imageMeta?.width }} × {{ imageMeta?.height }} px</span>
              <span class="meta-dot">•</span>
              <span>Ratio: {{ imageMeta?.aspectRatio }}</span>
              <span class="meta-dot">•</span>
              <span>{{ imageMeta?.formattedSize }}</span>
            </div>
          </div>
        </div>

        <div class="file-strip-right">
          <button
            type="button"
            class="strip-btn-change"
            title="Change image"
            @click="triggerFileInput"
            :disabled="busy"
          >
            <RefreshCw :size="14" />
            <span>Change</span>
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif"
            class="hidden-file-input"
            @change="onFileInputChange"
          />

          <button
            type="button"
            class="strip-btn-remove"
            title="Remove image"
            @click="clearFile"
            :disabled="busy"
          >
            <Trash2 :size="14" />
            <span>Remove</span>
          </button>
        </div>
      </div>

      <!-- Preset Styles Grid -->
      <div class="presets-section">
        <div class="section-heading">
          <label class="section-label">
            <Wand2 :size="14" /> Select Vector Style Preset
          </label>
          <span class="section-sub">Choose how your image contours and colors are mathematically vectorized</span>
        </div>

        <div class="preset-cards-grid">
          <button
            v-for="preset in presets"
            :key="preset.id"
            type="button"
            class="preset-card"
            :class="{ active: currentPreset === preset.id }"
            @click="selectPreset(preset)"
            :disabled="busy"
          >
            <div class="preset-card-top">
              <span class="preset-label">{{ preset.label }}</span>
              <span class="preset-badge">{{ preset.badge }}</span>
            </div>
            <p class="preset-desc">{{ preset.desc }}</p>
          </button>
        </div>
      </div>

      <!-- Advanced Custom Options Collapsible -->
      <div class="advanced-section">
        <button
          type="button"
          class="advanced-toggle-btn"
          @click="showAdvancedSettings = !showAdvancedSettings"
        >
          <div class="toggle-left">
            <Sliders :size="14" />
            <span>Fine-Tune Vector Precision & Colors</span>
          </div>
          <ChevronDown class="toggle-arrow" :class="{ 'is-open': showAdvancedSettings }" :size="16" />
        </button>

        <Transition name="expand">
          <div v-if="showAdvancedSettings" class="advanced-panel">
            <div class="settings-grid">
              <!-- Color Count -->
              <div class="setting-item">
                <div class="setting-header">
                  <label for="color-count-range">Color Quantization: <strong>{{ customColorCount }} Colors</strong></label>
                  <span class="setting-hint">Higher = greater fidelity; Lower = flatter vector art</span>
                </div>
                <div class="slider-wrapper">
                  <input
                    id="color-count-range"
                    type="range"
                    min="2"
                    max="128"
                    step="2"
                    v-model.number="customColorCount"
                    :disabled="busy"
                  />
                  <div class="slider-ticks">
                    <span @click="customColorCount = 2">2 (B&W)</span>
                    <span @click="customColorCount = 24">24 (Icon)</span>
                    <span @click="customColorCount = 96">96 (Ultra 4K)</span>
                    <span @click="customColorCount = 128">128 (Max)</span>
                  </div>
                </div>
              </div>

              <!-- Curve Smoothing & Gradient Blurring -->
              <div class="setting-item">
                <div class="setting-header">
                  <label>Bézier Curve Smoothing &amp; Blending</label>
                  <span class="setting-hint">Controls gradient blurring and eliminates stair-step contour lines</span>
                </div>
                <div class="segmented-control">
                  <button
                    type="button"
                    :class="{ active: curveSmoothing === 'crisp' }"
                    @click="curveSmoothing = 'crisp'"
                    :disabled="busy"
                  >
                    Crisp (Subtle Blur)
                  </button>
                  <button
                    type="button"
                    :class="{ active: curveSmoothing === 'smooth' }"
                    @click="curveSmoothing = 'smooth'"
                    :disabled="busy"
                  >
                    Smooth (Merged Curves)
                  </button>
                  <button
                    type="button"
                    :class="{ active: curveSmoothing === 'ultra-smooth' }"
                    @click="curveSmoothing = 'ultra-smooth'"
                    :disabled="busy"
                  >
                    Ultra Fluid (Max Blending)
                  </button>
                </div>
              </div>

              <!-- Noise Filtering (Path Omit) -->
              <div class="setting-item">
                <div class="setting-header">
                  <label for="noise-filter-range">Noise Filter (Path Omit): <strong>{{ noiseFilter }} px</strong></label>
                  <span class="setting-hint">Discards micro speckles and stray border artifacts</span>
                </div>
                <input
                  id="noise-filter-range"
                  type="range"
                  min="0"
                  max="8"
                  step="1"
                  v-model.number="noiseFilter"
                  :disabled="busy"
                />
              </div>

              <!-- Line Merging & Polish Options -->
              <div class="setting-item">
                <div class="setting-header">
                  <label>Line &amp; Seam Polish Effects</label>
                  <span class="setting-hint">Merges adjacent shapes and eliminates visible separation lines</span>
                </div>
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      v-model="mergeSeams"
                      :disabled="busy"
                    />
                    <span>Merge path seams (Eliminates gaps &amp; border lines between colors)</span>
                  </label>
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      v-model="polishedEffect"
                      :disabled="busy"
                    />
                    <span>Soft gradient polish filter (Smooths color transitions &amp; stepping rings)</span>
                  </label>
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      v-model="removeBackground"
                      :disabled="busy"
                    />
                    <span>Remove solid background (Transparent SVG)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Action Footer -->
      <div class="converter-actions-bar">
        <button
          type="button"
          class="secondary-button"
          :disabled="busy"
          @click="clearFile"
        >
          <RotateCcw :size="15" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          class="primary-button"
          :disabled="busy"
          @click="startVectorization"
        >
          <LoaderCircle v-if="busy" class="spin" :size="18" />
          <Sparkles v-else :size="18" />
          <span>{{ busy ? 'Vectorizing to 4K SVG...' : 'Convert to 4K Vector SVG' }}</span>
        </button>
      </div>

      <!-- Progress Banner -->
      <div v-if="busy" class="progress-container">
        <div class="progress-bar-track">
          <div class="progress-bar-fill" :style="{ width: `${progressPercent}%` }" />
        </div>
        <div class="progress-status">
          <span class="progress-msg">{{ progressMessage }}</span>
          <span class="progress-val">{{ progressPercent }}%</span>
        </div>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
      <button type="button" class="close-err-btn" @click="error = ''"><X :size="14" /></button>
    </div>

    <!-- Vector Results Workspace -->
    <div v-if="conversionResult" class="results-container">
      <!-- Result Stats Header -->
      <div class="results-header-card">
        <div class="results-meta-left">
          <div class="success-icon"><Check :size="20" /></div>
          <div>
            <h3 class="results-title">4K Scalable Vector SVG Ready</h3>
            <p class="results-desc">
              <span>{{ conversionResult.pathCount }} Vector Paths</span>
              <span class="meta-dot">•</span>
              <span>Output Size: {{ conversionResult.formattedSize }}</span>
              <span class="meta-dot">•</span>
              <span class="tag-4k">100% Crisp at 4K & Retina</span>
            </p>
          </div>
        </div>

        <div class="results-actions-right">
          <!-- Copy SVG Code -->
          <button
            type="button"
            class="copy-code-btn"
            :class="{ copied: isCopied }"
            @click="copySvgCode"
            title="Copy raw <svg> markup to clipboard"
          >
            <Check v-if="isCopied" :size="15" />
            <Copy v-else :size="15" />
            <span>{{ isCopied ? 'Copied SVG Code!' : 'Copy SVG Code' }}</span>
          </button>

          <!-- Download SVG -->
          <button
            type="button"
            class="download-svg-btn"
            @click="downloadSvg"
            title="Download .svg file"
          >
            <Download :size="16" />
            <span>Download SVG</span>
          </button>

          <!-- Download 4K PNG -->
          <button
            type="button"
            class="download-png-btn"
            @click="download4kPng"
            title="Export vector rendered as 3840px 4K PNG"
          >
            <FileImage :size="15" />
            <span>Export 4K PNG</span>
          </button>
        </div>
      </div>

      <!-- Workspace View Tabs -->
      <div class="tabs-bar">
        <div class="tabs-list">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'preview' }"
            @click="activeTab = 'preview'"
          >
            <Eye :size="14" />
            <span>Vector Preview</span>
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'split' }"
            @click="activeTab = 'split'"
          >
            <Split :size="14" />
            <span>Before / After Split</span>
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'code' }"
            @click="activeTab = 'code'"
          >
            <Code2 :size="14" />
            <span>SVG Source Code ({{ svgLineCount }} Lines)</span>
          </button>
        </div>

        <!-- Zoom / Checkerboard Controls for Preview -->
        <div v-if="activeTab !== 'code'" class="preview-tools">
          <button
            type="button"
            class="tool-btn"
            :class="{ active: showCheckerboard }"
            @click="showCheckerboard = !showCheckerboard"
            title="Toggle transparency grid backdrop"
          >
            <Palette :size="13" />
            <span>Checkerboard</span>
          </button>

          <div class="zoom-pill">
            <button type="button" @click="previewZoom = Math.max(50, previewZoom - 25)">-</button>
            <span>{{ previewZoom }}%</span>
            <button type="button" @click="previewZoom = Math.min(250, previewZoom + 25)">+</button>
          </div>
        </div>
      </div>

      <!-- Tab Content 1: Live Interactive Vector Preview -->
      <div
        v-if="activeTab === 'preview'"
        class="preview-stage"
        :class="{ checkerboard: showCheckerboard }"
      >
        <div
          class="svg-canvas-wrapper"
          :style="{ transform: `scale(${previewZoom / 100})` }"
          v-html="conversionResult.svgString"
        />
      </div>

      <!-- Tab Content 2: Side-by-Side Split View -->
      <div v-else-if="activeTab === 'split'" class="split-stage">
        <div class="split-pane">
          <div class="pane-label">Original Raster (Pixelated at 4K)</div>
          <div class="pane-view raster-pane">
            <img :src="imageMeta.previewUrl" :alt="imageMeta.name" />
          </div>
        </div>

        <div class="split-pane">
          <div class="pane-label">Vector SVG (Infinitely Crisp 4K)</div>
          <div class="pane-view vector-pane" :class="{ checkerboard: showCheckerboard }">
            <div class="split-svg-wrapper" v-html="conversionResult.svgString" />
          </div>
        </div>
      </div>

      <!-- Tab Content 3: SVG Source Code Viewer -->
      <div v-else-if="activeTab === 'code'" class="code-stage">
        <div class="code-header">
          <div class="code-header-left">
            <FileCode2 :size="14" />
            <span>Clean, Sanitized & Responsive &lt;svg&gt; Code</span>
          </div>
          <button type="button" class="mini-copy-btn" @click="copySvgCode">
            <Check v-if="isCopied" :size="13" />
            <Copy v-else :size="13" />
            <span>{{ isCopied ? 'Copied' : 'Copy Code' }}</span>
          </button>
        </div>
        <pre class="code-block"><code>{{ conversionResult.svgString }}</code></pre>
      </div>
    </div>

    <!-- Floating Toast Notification -->
    <Transition name="fade">
      <div v-if="toastMessage" class="converter-toast">
        <Check :size="14" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.image-to-svg-converter {
  position: relative;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: var(--radius-lg, 16px);
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
html[data-theme='dark'] .image-to-svg-converter {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
}

/* Dropzone View */
.svg-dropzone {
  border: 2px dashed var(--border, #cbd5e1);
  border-radius: 14px;
  padding: 48px 20px;
  text-align: center;
  background: var(--surface-muted, #f8fafc);
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}
.svg-dropzone:hover,
.svg-dropzone.is-dragging {
  border-color: var(--accent, #e11d48);
  background: rgba(225, 29, 72, 0.04);
}
html[data-theme='dark'] .svg-dropzone {
  background: #0f172a;
  border-color: #334155;
}
html[data-theme='dark'] .svg-dropzone:hover,
html[data-theme='dark'] .svg-dropzone.is-dragging {
  border-color: #fb7185;
  background: rgba(225, 29, 72, 0.05);
}
.dropzone-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 580px;
  margin: 0 auto;
}
.dropzone-icon-glow {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(225, 29, 72, 0.15), rgba(244, 63, 94, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b5cf6;
}
html[data-theme='dark'] .dropzone-icon-glow {
  background: linear-gradient(135deg, rgba(225, 29, 72, 0.3), rgba(244, 63, 94, 0.3));
  color: #a78bfa;
}
.dropzone-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text, #1e293b);
  margin: 0;
}
html[data-theme='dark'] .dropzone-title {
  color: #f1f5f9;
}
.dropzone-desc {
  font-size: 14px;
  color: var(--text-muted, #64748b);
  margin: 0;
  line-height: 1.5;
}
html[data-theme='dark'] .dropzone-desc {
  color: #94a3b8;
}
.dropzone-meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
}
html[data-theme='dark'] .dropzone-meta-pill {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}
.dropzone-browse-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  background: var(--accent, #e11d48);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius-md, 8px);
  border: none;
  cursor: pointer;
  margin-top: 6px;
  transition: transform 0.15s ease, background 0.15s ease;
}
.dropzone-browse-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
}
.dropzone-formats {
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
}
.hidden-file-input {
  display: none;
}

/* File Strip */
.file-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  background: var(--surface-muted, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  flex-wrap: wrap;
}
html[data-theme='dark'] .file-strip {
  background: #0f172a;
  border-color: #334155;
}
.file-strip-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}
.file-thumb {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--border, #cbd5e1);
  background: #ffffff;
  flex-shrink: 0;
}
html[data-theme='dark'] .file-thumb {
  border-color: #334155;
  background: #1e293b;
}
.file-thumb-fallback {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  flex-shrink: 0;
}
.file-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.file-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.file-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text, #1e293b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;
}
html[data-theme='dark'] .file-name {
  color: #f1f5f9;
}
.infinite-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: rgba(225, 29, 72, 0.12);
  color: #7c3aed;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}
html[data-theme='dark'] .infinite-badge {
  background: rgba(167, 139, 250, 0.2);
  color: #c4b5fd;
}
.file-sub-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted, #64748b);
  flex-wrap: wrap;
}
html[data-theme='dark'] .file-sub-meta {
  color: #94a3b8;
}
.meta-dot {
  opacity: 0.5;
}
.file-strip-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.strip-btn-change,
.strip-btn-remove {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid var(--border, #cbd5e1);
  background: var(--surface, #ffffff);
  color: var(--text, #334155);
  cursor: pointer;
  transition: all 0.15s ease;
}
html[data-theme='dark'] .strip-btn-change,
html[data-theme='dark'] .strip-btn-remove {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}
.strip-btn-remove:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}
html[data-theme='dark'] .strip-btn-remove:hover {
  background: #450a0a;
  border-color: #7f1d1d;
  color: #f87171;
}

/* Presets Section */
.presets-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-heading {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.section-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text, #1e293b);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
html[data-theme='dark'] .section-label {
  color: #f1f5f9;
}
.section-sub {
  font-size: 12px;
  color: var(--text-muted, #64748b);
}
html[data-theme='dark'] .section-sub {
  color: #94a3b8;
}
.preset-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}
.preset-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  background: var(--surface-muted, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s ease;
}
.preset-card:hover {
  border-color: var(--accent, #e11d48);
  background: #ffffff;
}
.preset-card.active {
  border-color: #8b5cf6;
  background: rgba(225, 29, 72, 0.05);
  box-shadow: 0 0 0 1.5px #8b5cf6;
}
html[data-theme='dark'] .preset-card {
  background: #0f172a;
  border-color: #334155;
}
html[data-theme='dark'] .preset-card:hover {
  background: #1e293b;
  border-color: #fb7185;
}
html[data-theme='dark'] .preset-card.active {
  border-color: #a78bfa;
  background: rgba(225, 29, 72, 0.15);
  box-shadow: 0 0 0 1.5px #a78bfa;
}
.preset-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.preset-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text, #1e293b);
}
html[data-theme='dark'] .preset-label {
  color: #f1f5f9;
}
.preset-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  background: #e2e8f0;
  color: #475569;
  text-transform: uppercase;
}
.preset-card.active .preset-badge {
  background: #8b5cf6;
  color: #ffffff;
}
html[data-theme='dark'] .preset-badge {
  background: #334155;
  color: #cbd5e1;
}
html[data-theme='dark'] .preset-card.active .preset-badge {
  background: #a78bfa;
  color: #0f172a;
}
.preset-desc {
  font-size: 11px;
  color: var(--text-muted, #64748b);
  margin: 0;
  line-height: 1.4;
}
html[data-theme='dark'] .preset-desc {
  color: #94a3b8;
}

/* Advanced Fine-Tuning Section */
.advanced-section {
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 10px;
  background: var(--surface, #ffffff);
  overflow: hidden;
}
html[data-theme='dark'] .advanced-section {
  background: #0f172a;
  border-color: #334155;
}
.advanced-toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--text, #1e293b);
}
html[data-theme='dark'] .advanced-toggle-btn {
  color: #cbd5e1;
}
.toggle-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toggle-arrow {
  transition: transform 0.2s ease;
}
.toggle-arrow.is-open {
  transform: rotate(180deg);
}
.advanced-panel {
  padding: 16px;
  border-top: 1px solid var(--border, #e2e8f0);
}
html[data-theme='dark'] .advanced-panel {
  border-top-color: #334155;
}
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}
.setting-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.setting-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.setting-header label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text, #1e293b);
}
html[data-theme='dark'] .setting-header label {
  color: #f1f5f9;
}
.setting-hint {
  font-size: 11px;
  color: var(--text-muted, #64748b);
}
html[data-theme='dark'] .setting-hint {
  color: #94a3b8;
}
.slider-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
input[type='range'] {
  width: 100%;
  accent-color: #e11d48;
  cursor: pointer;
}
.slider-ticks {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-muted, #94a3b8);
}
.slider-ticks span {
  cursor: pointer;
}
.slider-ticks span:hover {
  color: #8b5cf6;
}
.segmented-control {
  display: flex;
  border-radius: 8px;
  border: 1px solid var(--border, #cbd5e1);
  overflow: hidden;
  background: var(--surface-muted, #f1f5f9);
}
html[data-theme='dark'] .segmented-control {
  background: #1e293b;
  border-color: #334155;
}
.segmented-control button {
  flex: 1;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
  background: transparent;
  border: none;
  color: var(--text, #475569);
  cursor: pointer;
  transition: all 0.15s ease;
}
html[data-theme='dark'] .segmented-control button {
  color: #cbd5e1;
}
.segmented-control button.active {
  background: #8b5cf6;
  color: #ffffff;
}
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}
.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text, #334155);
  cursor: pointer;
}
html[data-theme='dark'] .checkbox-label {
  color: #cbd5e1;
}

/* Actions Bar */
.converter-actions-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border, #e2e8f0);
}
html[data-theme='dark'] .converter-actions-bar {
  border-top-color: #334155;
}
.secondary-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--border, #cbd5e1);
  background: var(--surface, #ffffff);
  color: var(--text, #334155);
  cursor: pointer;
  transition: all 0.15s ease;
}
html[data-theme='dark'] .secondary-button {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}
.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 24px;
  font-size: 14px;
  font-weight: 700;
  border-radius: var(--radius-md, 8px);
  border: none;
  background: var(--primary-gradient);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.3);
  transition: all 0.15s ease;
}
.primary-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(225, 29, 72, 0.4);
  filter: brightness(1.06);
}
.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Progress Container */
.progress-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  background: var(--surface-muted, #f8fafc);
  border-radius: 8px;
  border: 1px solid var(--border, #e2e8f0);
}
html[data-theme='dark'] .progress-container {
  background: #0f172a;
  border-color: #334155;
}
.progress-bar-track {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}
html[data-theme='dark'] .progress-bar-track {
  background: #334155;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #e11d48);
  border-radius: 3px;
  transition: width 0.25s ease;
}
.progress-status {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted, #64748b);
}
html[data-theme='dark'] .progress-status {
  color: #94a3b8;
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  border-radius: 8px;
  font-size: 13px;
}
html[data-theme='dark'] .error-banner {
  background: #450a0a;
  border-color: #7f1d1d;
  color: #fca5a5;
}
.close-err-btn {
  margin-left: auto;
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
}

/* Results Container */
.results-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}
.results-header-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(16, 185, 129, 0.06);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 12px;
  flex-wrap: wrap;
}
html[data-theme='dark'] .results-header-card {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.3);
}
.results-meta-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.success-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #10b981;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.results-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text, #1e293b);
  margin: 0;
}
html[data-theme='dark'] .results-title {
  color: #f1f5f9;
}
.results-desc {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted, #64748b);
  margin: 2px 0 0;
  flex-wrap: wrap;
}
html[data-theme='dark'] .results-desc {
  color: #94a3b8;
}
.tag-4k {
  background: #8b5cf6;
  color: #ffffff;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}
.results-actions-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.copy-code-btn,
.download-svg-btn,
.download-png-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.copy-code-btn {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #cbd5e1);
  color: var(--text, #1e293b);
}
.copy-code-btn.copied {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
}
html[data-theme='dark'] .copy-code-btn {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}
.download-svg-btn {
  background: #10b981;
  border: none;
  color: #ffffff;
}
.download-svg-btn:hover {
  filter: brightness(1.08);
}
.download-png-btn {
  background: rgba(225, 29, 72, 0.12);
  border: 1px solid rgba(225, 29, 72, 0.3);
  color: #7c3aed;
}
html[data-theme='dark'] .download-png-btn {
  background: rgba(167, 139, 250, 0.2);
  border-color: rgba(167, 139, 250, 0.4);
  color: #c4b5fd;
}

/* Tabs Bar */
.tabs-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--border, #e2e8f0);
  padding-bottom: 6px;
  flex-wrap: wrap;
}
html[data-theme='dark'] .tabs-bar {
  border-bottom-color: #334155;
}
.tabs-list {
  display: flex;
  gap: 6px;
}
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  transition: all 0.15s ease;
}
html[data-theme='dark'] .tab-btn {
  color: #94a3b8;
}
.tab-btn.active {
  background: var(--surface-muted, #f1f5f9);
  color: var(--text, #e11d48);
}
html[data-theme='dark'] .tab-btn.active {
  background: #334155;
  color: #fb7185;
}
.preview-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid var(--border, #cbd5e1);
  background: var(--surface, #ffffff);
  color: var(--text, #475569);
  cursor: pointer;
}
.tool-btn.active {
  background: rgba(225, 29, 72, 0.1);
  border-color: var(--accent, #e11d48);
  color: var(--accent, #e11d48);
}
html[data-theme='dark'] .tool-btn {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}
.zoom-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  border: 1px solid var(--border, #cbd5e1);
  overflow: hidden;
  background: var(--surface, #ffffff);
  font-size: 11px;
  font-weight: 600;
}
html[data-theme='dark'] .zoom-pill {
  background: #1e293b;
  border-color: #334155;
}
.zoom-pill button {
  padding: 4px 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text, #334155);
}
html[data-theme='dark'] .zoom-pill button {
  color: #cbd5e1;
}
.zoom-pill span {
  padding: 0 6px;
  color: var(--text-muted, #64748b);
}

/* Stage: Preview Canvas */
.preview-stage {
  min-height: 380px;
  max-height: 540px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  overflow: auto;
  padding: 24px;
  background: var(--surface-muted, #f8fafc);
  position: relative;
}
html[data-theme='dark'] .preview-stage {
  background: #0f172a;
  border-color: #334155;
}
.preview-stage.checkerboard,
.vector-pane.checkerboard {
  background-image: linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
    linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}
html[data-theme='dark'] .preview-stage.checkerboard,
html[data-theme='dark'] .vector-pane.checkerboard {
  background-image: linear-gradient(45deg, #1e293b 25%, transparent 25%),
    linear-gradient(-45deg, #1e293b 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #1e293b 75%),
    linear-gradient(-45deg, transparent 75%, #1e293b 75%);
  background-color: #0b1120;
}
.svg-canvas-wrapper {
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}
.svg-canvas-wrapper :deep(svg) {
  max-width: 100%;
  max-height: 480px;
  display: block;
}

/* Stage: Split Side-by-Side */
.split-stage {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
.split-pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pane-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text, #1e293b);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
html[data-theme='dark'] .pane-label {
  color: #f1f5f9;
}
.pane-view {
  min-height: 320px;
  max-height: 400px;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 16px;
  background: var(--surface-muted, #f8fafc);
}
html[data-theme='dark'] .pane-view {
  background: #0f172a;
  border-color: #334155;
}
.raster-pane img {
  max-width: 100%;
  max-height: 360px;
  object-fit: contain;
}
.split-svg-wrapper :deep(svg) {
  max-width: 100%;
  max-height: 360px;
  display: block;
}

/* Stage: SVG Code Viewer */
.code-stage {
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
}
.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #1e293b;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 600;
}
.code-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.mini-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  border: 1px solid #475569;
  background: #0f172a;
  color: #f1f5f9;
  cursor: pointer;
}
.mini-copy-btn:hover {
  background: #334155;
}
.code-block {
  margin: 0;
  padding: 16px;
  max-height: 440px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #fb7185;
  background: #0f172a;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Toast */
.converter-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #0f172a;
  color: #ffffff;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  z-index: 9999;
}
html[data-theme='dark'] .converter-toast {
  background: #fb7185;
  color: #0f172a;
}

/* Transitions */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .image-to-svg-converter {
    padding: 16px;
    gap: 16px;
  }
  .svg-dropzone {
    padding: 32px 14px;
  }
  .file-strip {
    flex-direction: column;
    align-items: flex-start;
  }
  .file-strip-right {
    width: 100%;
    justify-content: flex-end;
  }
  .results-header-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .results-actions-right {
    width: 100%;
  }
  .copy-code-btn,
  .download-svg-btn,
  .download-png-btn {
    flex: 1;
    justify-content: center;
  }
  .tabs-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  .preview-stage {
    min-height: 280px;
    padding: 12px;
  }
}
</style>

