<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  CircleAlert,
  Download,
  FileArchive,
  FileCheck,
  FolderArchive,
  Image as ImageIcon,
  Layers,
  LoaderCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  X,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import {
  convertImageFile,
  detectImageFormat,
  IMAGE_CONVERT_FORMATS,
  inspectImageFile,
  packageConvertedImagesZip,
  validateImageConvertFiles,
} from '~/utils/convert-image.js';

// State
const queuedFiles = ref([]); // Array of { id, file, name, originalFormat, size, formattedSize, width, height, previewUrl, targetFormat }
const results = ref([]); // Array of converted items
const zipResult = ref(null);

// Global Conversion Settings
const globalTargetFormat = ref('webp');
const quality = ref(85); // 10 to 100
const scale = ref(1.0); // 1.0, 0.75, 0.5, 0.25
const backgroundColor = ref('#ffffff');
const icoSize = ref(64);
const showAdvancedSettings = ref(false);

// UI & Processing State
const isDragging = ref(false);
const busy = ref(false);
const progressPercent = ref(0);
const progressMessage = ref('');
const error = ref('');
const toastMessage = ref('');
const fileInputRef = ref(null);

let abortController = null;
let toastTimer = null;
let dropDepth = 0;

// Format Options
const formatList = Object.values(IMAGE_CONVERT_FORMATS);

// Statistics
const totalOriginalSize = computed(() => {
  return queuedFiles.value.reduce((acc, item) => acc + (item.size || 0), 0);
});

const totalConvertedSize = computed(() => {
  return results.value.reduce((acc, item) => acc + (item.size || 0), 0);
});

const totalSavingsPercent = computed(() => {
  if (!totalOriginalSize.value || !totalConvertedSize.value) return 0;
  return Math.round(((totalOriginalSize.value - totalConvertedSize.value) / totalOriginalSize.value) * 100);
});

function showToast(msg) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3200);
}

// Drag & Drop Handlers
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
    handleFilesSelected(e.dataTransfer.files);
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
    handleFilesSelected(e.target.files);
    e.target.value = '';
  }
}

// Handle adding selected files
async function handleFilesSelected(fileList) {
  const chosen = Array.from(fileList);
  const validation = validateImageConvertFiles([...queuedFiles.value.map(q => q.file), ...chosen]);
  if (validation) {
    error.value = validation;
    return;
  }

  error.value = '';
  results.value = [];
  zipResult.value = null;

  for (const f of chosen) {
    // Avoid duplicate names in same batch
    const id = `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    try {
      const info = await inspectImageFile(f);
      queuedFiles.value.push({
        id,
        file: f,
        name: f.name,
        originalFormat: info.format,
        size: f.size,
        formattedSize: formatSize(f.size),
        width: info.width,
        height: info.height,
        previewUrl: info.previewUrl,
        targetFormat: globalTargetFormat.value,
      });
    } catch {
      // Fallback if inspection fails
      queuedFiles.value.push({
        id,
        file: f,
        name: f.name,
        originalFormat: detectImageFormat(f),
        size: f.size,
        formattedSize: formatSize(f.size),
        width: 0,
        height: 0,
        previewUrl: '',
        targetFormat: globalTargetFormat.value,
      });
    }
  }

  showToast(`Added ${chosen.length} image${chosen.length > 1 ? 's' : ''}`);
}

function removeQueuedFile(id) {
  const index = queuedFiles.value.findIndex(item => item.id === id);
  if (index !== -1) {
    const item = queuedFiles.value[index];
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    queuedFiles.value.splice(index, 1);
  }
}

function clearAll() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  queuedFiles.value.forEach(item => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
  results.value.forEach(item => {
    if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
  });
  if (zipResult.value?.downloadUrl) {
    URL.revokeObjectURL(zipResult.value.downloadUrl);
  }

  queuedFiles.value = [];
  results.value = [];
  zipResult.value = null;
  busy.value = false;
  error.value = '';
  progressPercent.value = 0;
  progressMessage.value = '';
}

// Convert All Images
async function startConversion() {
  if (!queuedFiles.value.length || busy.value) return;

  busy.value = true;
  error.value = '';
  results.value = [];
  zipResult.value = null;
  progressPercent.value = 0;
  progressMessage.value = 'Preparing images...';

  abortController = new AbortController();
  const convertedItems = [];
  const total = queuedFiles.value.length;

  try {
    for (let i = 0; i < total; i++) {
      if (abortController.signal.aborted) break;

      const item = queuedFiles.value[i];
      const targetFmt = item.targetFormat || globalTargetFormat.value;
      progressMessage.value = `Converting ${i + 1} of ${total}: ${item.name} ➔ ${targetFmt.toUpperCase()}...`;
      progressPercent.value = Math.round(((i) / total) * 100);

      const converted = await convertImageFile(item.file, {
        targetFormat: targetFmt,
        quality: quality.value / 100,
        scale: scale.value,
        backgroundColor: backgroundColor.value,
        icoSize: icoSize.value,
        signal: abortController.signal,
      });

      convertedItems.push({
        ...converted,
        id: item.id,
        originalName: item.name,
        formattedOriginalSize: item.formattedSize,
        formattedNewSize: formatSize(converted.size),
        previewUrl: item.previewUrl,
      });

      progressPercent.value = Math.round(((i + 1) / total) * 100);
    }

    results.value = convertedItems;

    // Automatically package ZIP if multiple files
    if (convertedItems.length > 1) {
      progressMessage.value = 'Creating ZIP bundle...';
      const zip = await packageConvertedImagesZip(convertedItems, 'wemakepdf-converted-images.zip');
      zipResult.value = zip;
    }

    showToast(`Successfully converted ${convertedItems.length} image${convertedItems.length > 1 ? 's' : ''}!`);
  } catch (err) {
    if (err?.name !== 'AbortError') {
      error.value = err?.message || 'An error occurred during image conversion.';
    }
  } finally {
    busy.value = false;
    abortController = null;
    progressPercent.value = 100;
  }
}

// Download individual file
function downloadItem(item) {
  if (!item?.downloadUrl) return;
  const link = document.createElement('a');
  link.href = item.downloadUrl;
  link.download = item.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Download all as ZIP
function downloadZip() {
  if (!zipResult.value?.downloadUrl) return;
  const link = document.createElement('a');
  link.href = zipResult.value.downloadUrl;
  link.download = zipResult.value.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Watch global target format changes to sync queued files
function setGlobalTarget(fmt) {
  globalTargetFormat.value = fmt;
  queuedFiles.value.forEach(item => {
    item.targetFormat = fmt;
  });
}

onBeforeUnmount(() => {
  if (abortController) abortController.abort();
  if (toastTimer) clearTimeout(toastTimer);
  queuedFiles.value.forEach(item => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
  results.value.forEach(item => {
    if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
  });
  if (zipResult.value?.downloadUrl) {
    URL.revokeObjectURL(zipResult.value.downloadUrl);
  }
});
</script>

<template>
  <div id="converter" class="converter-card convert-image-converter">
    <!-- Drop Zone (shown when empty or for adding more) -->
    <div
      v-if="!queuedFiles.length"
      class="convert-dropzone"
      :class="{ 'is-dragging': isDragging }"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @dragover="onDragOver"
      @drop="onDrop"
      @click="triggerFileInput"
      tabindex="0"
      role="button"
      aria-label="Upload images to convert"
      @keydown.enter.prevent="triggerFileInput"
      @keydown.space.prevent="triggerFileInput"
    >
      <input
        ref="fileInputRef"
        type="file"
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.ico,.svg,.avif"
        class="hidden-file-input"
        @change="onFileInputChange"
      />

      <div class="dropzone-icon-circle">
        <Upload :size="28" />
      </div>

      <div class="dropzone-text">
        <h3>Choose or Drop Images Here</h3>
        <p>Convert JPG, PNG, WebP, GIF, BMP, ICO, and AVIF with 100% private in-browser processing</p>
      </div>

      <div class="format-badges-row">
        <span class="fmt-badge">JPG</span>
        <span class="fmt-badge">PNG</span>
        <span class="fmt-badge">WEBP</span>
        <span class="fmt-badge">GIF</span>
        <span class="fmt-badge">BMP</span>
        <span class="fmt-badge">ICO</span>
        <span class="fmt-badge">AVIF</span>
        <span class="fmt-badge">SVG</span>
      </div>

      <button type="button" class="browse-files-btn">
        <Upload :size="16" /> Browse Images
      </button>
    </div>

    <!-- Active Workspace (when files are queued) -->
    <div v-else class="convert-workspace">
      <!-- Target Format Selector Bar -->
      <div class="target-format-bar">
        <div class="target-format-header">
          <span class="bar-title"><ArrowLeftRight :size="15" /> Convert All Images To:</span>
          <button
            type="button"
            class="toggle-advanced-btn"
            :class="{ active: showAdvancedSettings }"
            @click="showAdvancedSettings = !showAdvancedSettings"
          >
            <Sliders :size="13" />
            <span>{{ showAdvancedSettings ? 'Hide Options' : 'Quality &amp; Size Options' }}</span>
          </button>
        </div>

        <div class="format-chips-grid">
          <button
            v-for="fmt in formatList"
            :key="fmt.id"
            type="button"
            class="format-chip-btn"
            :class="{ active: globalTargetFormat === fmt.id }"
            @click="setGlobalTarget(fmt.id)"
          >
            <span class="fmt-name">{{ fmt.label }}</span>
            <span class="fmt-tag">{{ fmt.badge }}</span>
          </button>
        </div>

        <!-- Advanced Options Drawer -->
        <Transition name="expand">
          <div v-if="showAdvancedSettings" class="advanced-settings-panel">
            <div class="settings-grid">
              <!-- Quality slider (for lossy formats) -->
              <div class="setting-item" v-if="IMAGE_CONVERT_FORMATS[globalTargetFormat]?.supportsQuality">
                <div class="setting-header">
                  <label for="quality-range">Output Quality</label>
                  <span class="setting-val">{{ quality }}%</span>
                </div>
                <input
                  id="quality-range"
                  v-model.number="quality"
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  class="range-slider"
                />
                <span class="setting-hint">Higher quality results in larger file size.</span>
              </div>

              <!-- Dimension Scaling -->
              <div class="setting-item">
                <div class="setting-header">
                  <label>Resize Dimensions</label>
                </div>
                <div class="scale-buttons-row">
                  <button
                    type="button"
                    class="scale-btn"
                    :class="{ active: scale === 1.0 }"
                    @click="scale = 1.0"
                  >
                    100% (Original)
                  </button>
                  <button
                    type="button"
                    class="scale-btn"
                    :class="{ active: scale === 0.75 }"
                    @click="scale = 0.75"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    class="scale-btn"
                    :class="{ active: scale === 0.5 }"
                    @click="scale = 0.5"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    class="scale-btn"
                    :class="{ active: scale === 0.25 }"
                    @click="scale = 0.25"
                  >
                    25%
                  </button>
                </div>
              </div>

              <!-- Background Color for Opaque Formats -->
              <div class="setting-item" v-if="!IMAGE_CONVERT_FORMATS[globalTargetFormat]?.supportsAlpha">
                <div class="setting-header">
                  <label>Background Color (for transparent PNG/WebP)</label>
                </div>
                <div class="color-options-row">
                  <button
                    type="button"
                    class="color-pick-btn"
                    :class="{ active: backgroundColor === '#ffffff' }"
                    @click="backgroundColor = '#ffffff'"
                  >
                    <span class="color-swatch white" /> White
                  </button>
                  <button
                    type="button"
                    class="color-pick-btn"
                    :class="{ active: backgroundColor === '#000000' }"
                    @click="backgroundColor = '#000000'"
                  >
                    <span class="color-swatch black" /> Black
                  </button>
                </div>
              </div>

              <!-- Favicon Size (for ICO) -->
              <div class="setting-item" v-if="globalTargetFormat === 'ico'">
                <div class="setting-header">
                  <label>Favicon Icon Size</label>
                </div>
                <div class="scale-buttons-row">
                  <button
                    type="button"
                    class="scale-btn"
                    :class="{ active: icoSize === 32 }"
                    @click="icoSize = 32"
                  >
                    32 × 32
                  </button>
                  <button
                    type="button"
                    class="scale-btn"
                    :class="{ active: icoSize === 64 }"
                    @click="icoSize = 64"
                  >
                    64 × 64 (Recommended)
                  </button>
                  <button
                    type="button"
                    class="scale-btn"
                    :class="{ active: icoSize === 128 }"
                    @click="icoSize = 128"
                  >
                    128 × 128
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- File Queue Header -->
      <div class="queue-toolbar">
        <div class="queue-stats">
          <span class="queue-count">{{ queuedFiles.length }} Image{{ queuedFiles.length > 1 ? 's' : '' }}</span>
          <span class="dot">•</span>
          <span class="queue-size">{{ formatSize(totalOriginalSize) }} total</span>
        </div>

        <div class="queue-actions">
          <button
            type="button"
            class="mini-action-btn"
            title="Add more images"
            @click="triggerFileInput"
            :disabled="busy"
          >
            <Plus :size="13" />
            <span>Add More</span>
          </button>
          <input
            ref="fileInputRef"
            type="file"
            multiple
            accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.ico,.svg,.avif"
            class="hidden-file-input"
            @change="onFileInputChange"
          />

          <button
            type="button"
            class="mini-action-btn danger"
            title="Clear all images"
            @click="clearAll"
            :disabled="busy"
          >
            <Trash2 :size="13" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <!-- File Queue List -->
      <div class="queue-list">
        <div
          v-for="item in queuedFiles"
          :key="item.id"
          class="queue-item"
        >
          <!-- Thumbnail -->
          <div class="item-thumb-box">
            <img
              v-if="item.previewUrl"
              :src="item.previewUrl"
              :alt="item.name"
              class="thumb-img"
            />
            <div v-else class="thumb-placeholder">
              <ImageIcon :size="20" />
            </div>
          </div>

          <!-- Info -->
          <div class="item-info">
            <h4 class="item-filename" :title="item.name">{{ item.name }}</h4>
            <div class="item-meta">
              <span class="meta-tag">{{ item.originalFormat.toUpperCase() }}</span>
              <span>{{ item.formattedSize }}</span>
              <span v-if="item.width &amp;&amp; item.height">•</span>
              <span v-if="item.width &amp;&amp; item.height">{{ item.width }} × {{ item.height }}</span>
            </div>
          </div>

          <!-- Format Target Picker -->
          <div class="item-format-selector">
            <ArrowRight :size="14" class="arrow-icon" />
            <select
              v-model="item.targetFormat"
              class="format-select"
              :disabled="busy"
              aria-label="Target format for this image"
            >
              <option
                v-for="fmt in formatList"
                :key="fmt.id"
                :value="fmt.id"
              >
                {{ fmt.label }} ({{ fmt.extension }})
              </option>
            </select>
          </div>

          <!-- Remove Item Button -->
          <button
            type="button"
            class="remove-item-btn"
            title="Remove image from queue"
            :disabled="busy"
            @click="removeQueuedFile(item.id)"
          >
            <X :size="15" />
          </button>
        </div>
      </div>

      <!-- Conversion Progress Bar (when busy) -->
      <div v-if="busy" class="progress-section">
        <div class="progress-header">
          <span class="progress-label">
            <LoaderCircle class="spin" :size="14" />
            <span>{{ progressMessage }}</span>
          </span>
          <span class="progress-pct">{{ progressPercent }}%</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" :style="{ width: `${progressPercent}%` }" />
        </div>
      </div>

      <!-- Action Footer -->
      <div class="converter-actions-bar">
        <button
          type="button"
          class="secondary-button"
          :disabled="busy"
          @click="clearAll"
        >
          <RotateCcw :size="15" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          class="primary-button"
          :disabled="busy || !queuedFiles.length"
          @click="startConversion"
        >
          <LoaderCircle v-if="busy" class="spin" :size="18" />
          <Sparkles v-else :size="18" />
          <span>{{ busy ? 'Converting Images...' : `Convert ${queuedFiles.length} Image${queuedFiles.length > 1 ? 's' : ''}` }}</span>
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
      <button type="button" class="close-err-btn" @click="error = ''"><X :size="14" /></button>
    </div>

    <!-- Results Section (when conversion completes) -->
    <div v-if="results.length" class="results-section">
      <!-- Summary Bar -->
      <div class="results-summary-card">
        <div class="summary-left">
          <div class="summary-icon"><Check :size="20" /></div>
          <div class="summary-details">
            <h3>{{ results.length }} Image{{ results.length > 1 ? 's' : '' }} Converted Successfully</h3>
            <p>
              <span>{{ formatSize(totalOriginalSize) }} ➔ {{ formatSize(totalConvertedSize) }}</span>
              <span v-if="totalSavingsPercent > 0" class="savings-tag">
                {{ totalSavingsPercent }}% smaller (Saved {{ formatSize(totalOriginalSize - totalConvertedSize) }})
              </span>
            </p>
          </div>
        </div>

        <div class="summary-right">
          <button
            v-if="results.length > 1"
            type="button"
            class="download-all-zip-btn"
            @click="downloadZip"
          >
            <FolderArchive :size="16" />
            <span>Download All as ZIP</span>
          </button>
        </div>
      </div>

      <!-- Converted Results List -->
      <div class="results-grid">
        <div
          v-for="item in results"
          :key="item.id"
          class="result-item-card"
        >
          <div class="result-thumb-box">
            <img
              v-if="item.previewUrl"
              :src="item.previewUrl"
              :alt="item.filename"
              class="result-thumb-img"
            />
          </div>

          <div class="result-info">
            <h4 class="result-name" :title="item.filename">{{ item.filename }}</h4>
            <div class="result-meta">
              <span class="fmt-badge-success">{{ item.format.toUpperCase() }}</span>
              <span>{{ item.formattedNewSize }}</span>
              <span v-if="item.savingsPercent > 0" class="savings-pill">
                -{{ item.savingsPercent }}%
              </span>
              <span v-else-if="item.savingsPercent < 0" class="growth-pill">
                +{{ Math.abs(item.savingsPercent) }}%
              </span>
              <span>•</span>
              <span>{{ item.width }} × {{ item.height }}</span>
            </div>
          </div>

          <button
            type="button"
            class="download-single-btn"
            @click="downloadItem(item)"
            title="Download this converted image"
          >
            <Download :size="15" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Toast -->
    <Transition name="fade">
      <div v-if="toastMessage" class="converter-toast">
        <Check :size="14" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.convert-image-converter {
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
html[data-theme='dark'] .convert-image-converter {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
}

/* Drop Zone */
.convert-dropzone {
  border: 2px dashed var(--border, #cbd5e1);
  border-radius: 14px;
  padding: 44px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  background: var(--surface-muted, #f8fafc);
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}
.convert-dropzone:hover,
.convert-dropzone.is-dragging {
  border-color: var(--accent, #e11d48);
  background: rgba(225, 29, 72, 0.04);
}
html[data-theme='dark'] .convert-dropzone {
  background: #0f172a;
  border-color: #334155;
}
html[data-theme='dark'] .convert-dropzone:hover,
html[data-theme='dark'] .convert-dropzone.is-dragging {
  border-color: #fb7185;
  background: rgba(225, 29, 72, 0.05);
}
.hidden-file-input {
  display: none;
}
.dropzone-icon-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(225, 29, 72, 0.1);
  color: var(--accent, #e11d48);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}
html[data-theme='dark'] .dropzone-icon-circle {
  background: rgba(225, 29, 72, 0.12);
  color: #fb7185;
}
.dropzone-text h3 {
  font-size: 17px;
  font-weight: 700;
  color: var(--text, #0f172a);
  margin-bottom: 6px;
}
html[data-theme='dark'] .dropzone-text h3 {
  color: #f1f5f9;
}
.dropzone-text p {
  font-size: 13px;
  color: var(--text-muted, #64748b);
  max-width: 480px;
  margin-bottom: 16px;
}
html[data-theme='dark'] .dropzone-text p {
  color: #94a3b8;
}
.format-badges-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 20px;
}
.fmt-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  background: #e2e8f0;
  color: #475569;
  border-radius: 6px;
}
html[data-theme='dark'] .fmt-badge {
  background: #1e293b;
  color: #94a3b8;
}
.browse-files-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 22px;
  font-size: 13px;
  font-weight: 700;
  background: var(--accent, #e11d48);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.25);
  transition: transform 0.15s ease;
}
.browse-files-btn:hover {
  transform: translateY(-1px);
}

/* Workspace Grid */
.convert-workspace {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  box-sizing: border-box;
}

/* Target Format Bar */
.target-format-bar {
  background: var(--surface-muted, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}
html[data-theme='dark'] .target-format-bar {
  background: #0f172a;
  border-color: #334155;
}
.target-format-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.bar-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text, #0f172a);
}
html[data-theme='dark'] .bar-title {
  color: #f1f5f9;
}
.toggle-advanced-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-muted, #64748b);
  background: transparent;
  border: 1px solid var(--border, #cbd5e1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.toggle-advanced-btn:hover {
  background: #e2e8f0;
}
.toggle-advanced-btn.active {
  background: var(--surface);
  color: var(--accent, #e11d48);
  border-color: var(--accent, #e11d48);
}
html[data-theme='dark'] .toggle-advanced-btn {
  border-color: #334155;
  color: #94a3b8;
}
html[data-theme='dark'] .toggle-advanced-btn:hover {
  background: #1e293b;
}
html[data-theme='dark'] .toggle-advanced-btn.active {
  background: #1e293b;
  color: #fb7185;
  border-color: #fb7185;
}

.format-chips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 8px;
}
.format-chip-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px;
  background: var(--surface, #ffffff);
  border: 1.5px solid var(--border, #e2e8f0);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.format-chip-btn:hover {
  border-color: #94a3b8;
}
.format-chip-btn.active {
  border-color: var(--accent, #e11d48);
  background: rgba(225, 29, 72, 0.06);
  box-shadow: 0 0 0 1px var(--accent, #e11d48);
}
html[data-theme='dark'] .format-chip-btn {
  background: #1e293b;
  border-color: #334155;
}
html[data-theme='dark'] .format-chip-btn:hover {
  border-color: #475569;
}
html[data-theme='dark'] .format-chip-btn.active {
  border-color: #fb7185;
  background: rgba(225, 29, 72, 0.12);
  box-shadow: 0 0 0 1px #fb7185;
}
.fmt-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text, #0f172a);
}
html[data-theme='dark'] .fmt-name {
  color: #f1f5f9;
}
.fmt-tag {
  font-size: 9.5px;
  font-weight: 600;
  color: var(--text-muted, #64748b);
  text-transform: uppercase;
}
html[data-theme='dark'] .fmt-tag {
  color: #94a3b8;
}

/* Advanced Settings Drawer */
.advanced-settings-panel {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border, #e2e8f0);
}
html[data-theme='dark'] .advanced-settings-panel {
  border-color: #334155;
}
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.setting-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted, #64748b);
}
html[data-theme='dark'] .setting-header {
  color: #94a3b8;
}
.setting-val {
  font-weight: 700;
  color: var(--accent, #e11d48);
}
html[data-theme='dark'] .setting-val {
  color: #fb7185;
}
.range-slider {
  width: 100%;
  accent-color: var(--accent, #e11d48);
  cursor: pointer;
}
.setting-hint {
  font-size: 11px;
  color: var(--text-muted, #64748b);
}
.scale-buttons-row,
.color-options-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.scale-btn,
.color-pick-btn {
  flex: 1;
  padding: 6px 10px;
  font-size: 11.5px;
  font-weight: 600;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text);
  white-space: nowrap;
}
.scale-btn.active,
.color-pick-btn.active {
  background: var(--accent, #e11d48);
  color: #ffffff;
  border-color: var(--accent, #e11d48);
}
html[data-theme='dark'] .scale-btn,
html[data-theme='dark'] .color-pick-btn {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}
html[data-theme='dark'] .scale-btn.active,
html[data-theme='dark'] .color-pick-btn.active {
  background: #e11d48;
  border-color: #f43f5e;
  color: #ffffff;
}
.color-swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.2);
}
.color-swatch.white { background: #ffffff; }
.color-swatch.black { background: #000000; }

/* Queue Toolbar */
.queue-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
  flex-wrap: wrap;
  gap: 8px;
}
.queue-stats {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted, #64748b);
  display: flex;
  align-items: center;
  gap: 6px;
}
html[data-theme='dark'] .queue-stats {
  color: #94a3b8;
}
.queue-count {
  color: var(--text, #0f172a);
  font-weight: 700;
}
html[data-theme='dark'] .queue-count {
  color: #f1f5f9;
}
.queue-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mini-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  font-size: 11.5px;
  font-weight: 600;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text);
}
.mini-action-btn:hover {
  background: var(--surface-muted);
}
.mini-action-btn.danger {
  color: #ef4444;
  border-color: #fecaca;
}
.mini-action-btn.danger:hover {
  background: #fef2f2;
}
html[data-theme='dark'] .mini-action-btn {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}
html[data-theme='dark'] .mini-action-btn:hover {
  background: #1e293b;
}
html[data-theme='dark'] .mini-action-btn.danger {
  color: #f87171;
  border-color: #7f1d1d;
}
html[data-theme='dark'] .mini-action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.12);
}

/* Queue List */
.queue-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 4px;
}
.queue-list::-webkit-scrollbar {
  width: 6px;
}
.queue-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
html[data-theme='dark'] .queue-list::-webkit-scrollbar-thumb {
  background: #475569;
}
.queue-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 10px;
  box-sizing: border-box;
  width: 100%;
}
html[data-theme='dark'] .queue-item {
  background: #0f172a;
  border-color: #334155;
}
.item-thumb-box {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  overflow: hidden;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
html[data-theme='dark'] .item-thumb-box {
  background: #1e293b;
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-info {
  flex: 1;
  min-width: 0;
}
.item-filename {
  font-size: 13px;
  font-weight: 600;
  color: var(--text, #0f172a);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
html[data-theme='dark'] .item-filename {
  color: #f1f5f9;
}
.item-meta {
  font-size: 11.5px;
  color: var(--text-muted, #64748b);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
html[data-theme='dark'] .item-meta {
  color: #94a3b8;
}
.meta-tag {
  font-weight: 700;
  padding: 1px 5px;
  background: #e2e8f0;
  border-radius: 4px;
  font-size: 10px;
}
html[data-theme='dark'] .meta-tag {
  background: #1e293b;
  color: #cbd5e1;
}
.item-format-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.arrow-icon {
  color: var(--text-muted, #94a3b8);
}
.format-select {
  padding: 5px 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border, #cbd5e1);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
}
html[data-theme='dark'] .format-select {
  background: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}
.remove-item-btn {
  background: transparent;
  border: none;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: color 0.15s;
}
.remove-item-btn:hover {
  color: #ef4444;
}

/* Progress Section */
.progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 10px;
}
html[data-theme='dark'] .progress-section {
  background: rgba(225, 29, 72, 0.15);
  border-color: #9f1239;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12.5px;
  font-weight: 600;
  color: #be123c;
}
html[data-theme='dark'] .progress-header {
  color: #fecdd3;
}
.progress-label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.progress-bar-track {
  width: 100%;
  height: 6px;
  background: #ffe4e6;
  border-radius: 4px;
  overflow: hidden;
}
html[data-theme='dark'] .progress-bar-track {
  background: #4c0519;
}
.progress-bar-fill {
  height: 100%;
  background: #e11d48;
  border-radius: 4px;
  transition: width 0.2s ease;
}

/* Actions Bar */
.converter-actions-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border, #e2e8f0);
}
html[data-theme='dark'] .converter-actions-bar {
  border-color: #334155;
}
.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  background: var(--accent, #e11d48);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.25);
  transition: all 0.15s ease;
}
.primary-button:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
}
.primary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.secondary-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 11px 18px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
}
.secondary-button:hover:not(:disabled) {
  background: var(--surface-hover, #f8fafc);
}
html[data-theme='dark'] .secondary-button {
  background: #0f172a;
  border-color: #334155;
  color: #e2e8f0;
}
html[data-theme='dark'] .secondary-button:hover:not(:disabled) {
  background: #1e293b;
  color: #ffffff;
}

/* Results Section */
.results-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 10px;
}
.results-summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  flex-wrap: wrap;
  gap: 12px;
}
html[data-theme='dark'] .results-summary-card {
  background: rgba(6, 78, 59, 0.25);
  border-color: #065f46;
}
.summary-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.summary-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #16a34a;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.summary-details h3 {
  font-size: 14.5px;
  font-weight: 700;
  color: #14532d;
  margin-bottom: 2px;
}
html[data-theme='dark'] .summary-details h3 {
  color: #86efac;
}
.summary-details p {
  font-size: 12px;
  color: #166534;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
html[data-theme='dark'] .summary-details p {
  color: #4ade80;
}
.savings-tag {
  background: #dcfce7;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 700;
}
html[data-theme='dark'] .savings-tag {
  background: #064e3b;
  color: #a7f3d0;
}
.download-all-zip-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 700;
  background: #16a34a;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.25);
  transition: all 0.15s ease;
}
.download-all-zip-btn:hover {
  background: #15803d;
  transform: translateY(-1px);
}

.results-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.result-item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 10px;
  box-sizing: border-box;
}
html[data-theme='dark'] .result-item-card {
  background: #0f172a;
  border-color: #334155;
}
.result-thumb-box {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  overflow: hidden;
  background: #e2e8f0;
  flex-shrink: 0;
}
html[data-theme='dark'] .result-thumb-box {
  background: #1e293b;
}
.result-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.result-info {
  flex: 1;
  min-width: 0;
}
.result-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text, #0f172a);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
html[data-theme='dark'] .result-name {
  color: #f1f5f9;
}
.result-meta {
  font-size: 11.5px;
  color: var(--text-muted, #64748b);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
html[data-theme='dark'] .result-meta {
  color: #94a3b8;
}
.fmt-badge-success {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  background: #dcfce7;
  color: #15803d;
  border-radius: 4px;
}
html[data-theme='dark'] .fmt-badge-success {
  background: #064e3b;
  color: #86efac;
}
.savings-pill {
  font-size: 10.5px;
  font-weight: 700;
  padding: 1px 6px;
  background: #dcfce7;
  color: #15803d;
  border-radius: 10px;
}
html[data-theme='dark'] .savings-pill {
  background: #064e3b;
  color: #86efac;
}
.growth-pill {
  font-size: 10.5px;
  font-weight: 700;
  padding: 1px 6px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 10px;
}
html[data-theme='dark'] .growth-pill {
  background: #1e293b;
  color: #94a3b8;
}
.download-single-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 700;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}
.download-single-btn:hover {
  background: var(--accent, #e11d48);
  color: #ffffff;
  border-color: var(--accent, #e11d48);
}
html[data-theme='dark'] .download-single-btn {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}
html[data-theme='dark'] .download-single-btn:hover {
  background: #e11d48;
  border-color: #e11d48;
  color: #ffffff;
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  box-sizing: border-box;
  word-break: break-word;
}
html[data-theme='dark'] .error-banner {
  background: rgba(127, 29, 29, 0.25);
  border-color: #991b1b;
  color: #fca5a5;
}
.close-err-btn {
  margin-left: auto;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
}

/* Toast */
.converter-toast {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0f172a;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 50;
  max-width: 90%;
  box-sizing: border-box;
}
html[data-theme='dark'] .converter-toast {
  background: #1e293b;
  color: #f8fafc;
  border: 1px solid #334155;
}
.spin {
  animation: rotate 1s linear infinite;
}
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 640px) {
  .convert-image-converter {
    padding: 16px 12px;
    border-radius: 14px;
    gap: 16px;
  }
  .convert-dropzone {
    padding: 32px 14px;
  }
  .format-chips-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .settings-grid {
    grid-template-columns: 1fr;
  }
  .converter-actions-bar {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 10px;
  }
  .primary-button,
  .secondary-button {
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
    padding: 12px 16px;
  }
  .results-summary-card {
    flex-direction: column;
    align-items: stretch;
  }
  .download-all-zip-btn {
    width: 100%;
    justify-content: center;
  }
  .result-item-card {
    flex-wrap: wrap;
    gap: 10px;
  }
  .result-info {
    flex: 1 1 calc(100% - 60px);
  }
  .download-single-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>

