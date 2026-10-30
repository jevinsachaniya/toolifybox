<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import {
  Check,
  CheckCheck,
  CircleAlert,
  Download,
  Eye,
  FileCheck,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Stamp,
  Type,
  Upload,
  X,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import {
  applyWatermarkToPdf,
  drawWatermarkOnCanvas,
  loadWatermarkImage,
  validatePdfForWatermark,
  validateWatermarkImageFile,
  WATERMARK_COLORS,
  WATERMARK_POSITIONS,
  WATERMARK_PRESETS,
  watermarkedPdfFilename,
} from '~/utils/watermark-pdf.js';

// State
const file = shallowRef(null);
const busy = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const resultPdf = ref(null);
const input = ref(null);
const uploadButton = ref(null);
const previewCanvas = ref(null);

// Watermark mode: 'text' | 'image'
const watermarkType = ref('text');

// Text watermark settings
const watermarkText = ref('CONFIDENTIAL');
const watermarkColor = ref('#ef4444');
const watermarkFontSize = ref(48);
const watermarkOpacity = ref(25); // 0 - 100
const watermarkPosition = ref('center-diagonal');
const watermarkRotation = ref(45);
const watermarkPages = ref('all'); // 'all' | 'first' | 'custom'
const watermarkCustomPages = ref('');

// Image watermark settings
const watermarkImage = shallowRef(null); // { bytes, type, width, height, imageElement, name, size }
const watermarkImageScale = ref(35); // 10 to 90 (% of page)
const imageInput = ref(null);
const imageLoading = ref(false);
const imageError = ref('');
const imageDragging = ref(false);

// Preview rendering state
const previewLoading = ref(false);
const previewError = ref('');
const basePageImage = shallowRef(null); // Offscreen canvas or ImageBitmap of page 1
const basePageDimensions = ref({ width: 595, height: 842 });
const totalPdfPages = ref(1);

let dropDepth = 0;
let active = true;
let pdfDocInstance = null;

const stage = computed(() => (resultPdf.value ? 3 : file.value ? 2 : 1));

function clearResult() {
  if (resultPdf.value?.url) URL.revokeObjectURL(resultPdf.value.url);
  resultPdf.value = null;
}

onBeforeUnmount(() => {
  active = false;
  clearResult();
  pdfDocInstance = null;
});

function resetAll({ focus = true } = {}) {
  clearResult();
  file.value = null;
  busy.value = false;
  error.value = '';
  progress.value = '';
  previewLoading.value = false;
  previewError.value = '';
  basePageImage.value = null;
  totalPdfPages.value = 1;
  pdfDocInstance = null;
  watermarkType.value = 'text';
  watermarkText.value = 'CONFIDENTIAL';
  watermarkColor.value = '#ef4444';
  watermarkFontSize.value = 48;
  watermarkOpacity.value = 25;
  watermarkPosition.value = 'center-diagonal';
  watermarkRotation.value = 45;
  watermarkPages.value = 'all';
  watermarkCustomPages.value = '';
  watermarkImage.value = null;
  watermarkImageScale.value = 35;
  imageLoading.value = false;
  imageError.value = '';
  if (input.value) input.value.value = '';
  if (imageInput.value) imageInput.value.value = '';
  if (focus && active) uploadButton.value?.focus();
}

async function onImageChosen(event) {
  const files = event.target?.files;
  if (!files?.length) return;
  await processImageFile(files[0]);
  event.target.value = '';
}

async function processImageFile(imageFile) {
  imageLoading.value = true;
  imageError.value = '';
  try {
    const loaded = await loadWatermarkImage(imageFile);
    watermarkImage.value = loaded;
    await nextTick();
    renderLivePreview();
  } catch (err) {
    imageError.value = err.message || 'Could not load watermark image.';
  } finally {
    imageLoading.value = false;
  }
}

function removeWatermarkImage() {
  watermarkImage.value = null;
  imageError.value = '';
  if (imageInput.value) imageInput.value.value = '';
  renderLivePreview();
}

// Drag & drop handlers
function dragEnter() {
  if (!busy.value) {
    dropDepth++;
    dragging.value = true;
  }
}

function dragOver(event) {
  event.dataTransfer.dropEffect = busy.value ? 'none' : 'copy';
}

function dragLeave() {
  dropDepth = Math.max(0, dropDepth - 1);
  if (!dropDepth) dragging.value = false;
}

function drop(event) {
  dropDepth = 0;
  dragging.value = false;
  select(event.dataTransfer.files);
}

function chooseFile(event) {
  select(event.target.files);
  event.target.value = '';
}

async function select(files) {
  if (busy.value || !files?.length) return;
  const chosen = Array.from(files);
  const message = validatePdfForWatermark(chosen);
  resetAll({ focus: false });
  error.value = message;
  if (!message && chosen[0]) {
    file.value = chosen[0];
    await loadPdfPreview(chosen[0]);
  }
}

// Load Page 1 for live preview
async function loadPdfPreview(pdfFile) {
  previewLoading.value = true;
  previewError.value = '';
  try {
    const [pdfjs, { default: workerUrl }] = await Promise.all([
      import('pdfjs-dist/build/pdf.mjs'),
      import('pdfjs-dist/build/pdf.worker.mjs?url'),
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

    const data = new Uint8Array(await pdfFile.arrayBuffer());
    const loadingTask = pdfjs.getDocument({
      data,
      isEvalSupported: false,
      stopAtErrors: true,
      verbosity: 0,
    });

    const pdf = await loadingTask.promise;
    if (!active) return;
    pdfDocInstance = pdf;
    totalPdfPages.value = pdf.numPages;

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const offscreen = document.createElement('canvas');
    offscreen.width = Math.ceil(viewport.width);
    offscreen.height = Math.ceil(viewport.height);
    const ctx = offscreen.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      background: '#ffffff',
    }).promise;

    if (!active) return;
    basePageImage.value = offscreen;
    basePageDimensions.value = { width: offscreen.width, height: offscreen.height };

    await nextTick();
    renderLivePreview();
  } catch (err) {
    console.warn('PDF preview render error:', err);
    previewError.value = 'Could not render page preview, but watermarking will still apply.';
  } finally {
    if (active) previewLoading.value = false;
  }
}

// Redraw watermark on top of base PDF page
function renderLivePreview() {
  if (!previewCanvas.value || !basePageImage.value) return;
  const canvas = previewCanvas.value;
  const ctx = canvas.getContext('2d');
  const base = basePageImage.value;

  canvas.width = base.width;
  canvas.height = base.height;

  // Draw original PDF page
  ctx.drawImage(base, 0, 0);

  // Draw live watermark
  const options = {
    type: watermarkType.value,
    text: watermarkText.value || 'CONFIDENTIAL',
    color: watermarkColor.value,
    fontSize: watermarkFontSize.value,
    opacity: watermarkOpacity.value / 100,
    position: watermarkPosition.value,
    rotation: watermarkRotation.value,
    imageElement: watermarkImage.value?.imageElement,
    imageScale: watermarkImageScale.value / 100,
  };

  drawWatermarkOnCanvas(ctx, canvas.width, canvas.height, options);
}

// Watch settings and update preview
watch(
  [
    watermarkType,
    watermarkText,
    watermarkColor,
    watermarkFontSize,
    watermarkOpacity,
    watermarkPosition,
    watermarkRotation,
    watermarkImage,
    watermarkImageScale,
  ],
  () => {
    renderLivePreview();
  }
);

function setPreset(preset) {
  watermarkText.value = preset;
}

function setPosition(pos) {
  watermarkPosition.value = pos.id;
  watermarkRotation.value = pos.angle;
}

function triggerDownload(url, filename) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

async function executeWatermark() {
  if (!file.value || busy.value) return;

  if (watermarkType.value === 'image' && !watermarkImage.value) {
    error.value = 'Please select or upload an image to use as a watermark.';
    return;
  }

  if (watermarkType.value === 'text' && !watermarkText.value.trim()) {
    error.value = 'Please enter text for your watermark.';
    return;
  }

  busy.value = true;
  error.value = '';
  progress.value = 'Preparing watermark…';

  try {
    let pageRange = watermarkPages.value;
    if (watermarkPages.value === 'custom') {
      pageRange = watermarkCustomPages.value.trim() || 'all';
    }

    const options = {
      type: watermarkType.value,
      text: watermarkText.value || 'CONFIDENTIAL',
      fontSize: Number(watermarkFontSize.value) || 48,
      opacity: (Number(watermarkOpacity.value) || 25) / 100,
      position: watermarkPosition.value,
      rotation: Number(watermarkRotation.value) || 0,
      color: watermarkColor.value,
      pageRange,
      imageBytes: watermarkImage.value?.bytes,
      imageType: watermarkImage.value?.type,
      imageScale: watermarkImageScale.value / 100,
    };

    const watermarkedBlob = await applyWatermarkToPdf(file.value, options, {
      onProgress: (msg) => {
        if (active) progress.value = msg;
      },
    });

    if (active) {
      const url = URL.createObjectURL(watermarkedBlob);
      const filename = watermarkedPdfFilename(file.value.name);
      resultPdf.value = {
        url,
        filename,
        size: watermarkedBlob.size,
      };
      triggerDownload(url, filename);
    }
  } catch (err) {
    if (active) {
      console.error(err);
      error.value = err.message || 'We could not watermark this PDF. Please check the document and try again.';
    }
  } finally {
    if (active) {
      busy.value = false;
      progress.value = '';
    }
  }
}
</script>

<template>
  <section
    id="converter"
    class="converter watermark-pdf-converter"
    :class="{ 'is-converting': busy, 'has-file': file }"
    aria-label="Watermark PDF converter"
    :aria-busy="busy"
  >
    <div class="converter-heading">
      <div>
        <span class="mini-label">PDF BRANDING &amp; SECURITY</span>
        <h2>Watermark PDF</h2>
      </div>
      <p>Add custom text stamps, confidentiality marks, or repeating watermark grids to your PDF pages in seconds.</p>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner" role="alert">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
      <button type="button" class="error-dismiss" aria-label="Dismiss error" @click="error = ''">
        <X :size="14" />
      </button>
    </div>

    <!-- STAGE 1: File Upload Dropzone -->
    <div
      v-if="stage === 1"
      class="dropzone-area"
      :class="{ 'is-dragging': dragging }"
      @dragenter.prevent="dragEnter"
      @dragover.prevent="dragOver"
      @dragleave.prevent="dragLeave"
      @drop.prevent="drop"
    >
      <input
        ref="input"
        type="file"
        accept=".pdf,application/pdf"
        class="sr-only"
        aria-label="Select PDF file"
        @change="chooseFile"
      />

      <div class="dropzone-body">
        <div class="dropzone-icon-ring">
          <Stamp :size="32" class="text-sky-500" />
        </div>
        <div class="dropzone-copy">
          <p class="dropzone-title">Drop your PDF file here</p>
          <p class="dropzone-subtitle">or click to browse from your device</p>
        </div>
        <button
          ref="uploadButton"
          type="button"
          class="primary-button dropzone-button"
          @click="input?.click()"
        >
          <Upload :size="16" />
          <span>Choose PDF File</span>
        </button>
        <span class="dropzone-hint">Supports PDF documents up to 50 MB. 100% private in-browser execution.</span>
      </div>
    </div>

    <!-- STAGE 2: Watermark Options & Live Preview -->
    <div v-else-if="stage === 2" class="watermark-workspace">
      <!-- File Summary Bar -->
      <div class="selected-file-bar">
        <div class="selected-file-info">
          <div class="file-icon-badge">
            <FileText :size="20" />
          </div>
          <div class="file-details">
            <b class="file-name" :title="file?.name">{{ file?.name }}</b>
            <span class="file-meta">
              {{ formatSize(file?.size || 0) }} · {{ totalPdfPages }} {{ totalPdfPages === 1 ? 'page' : 'pages' }}
            </span>
          </div>
        </div>
        <button
          type="button"
          class="ghost-button btn-reset"
          :disabled="busy"
          @click="resetAll"
        >
          <RotateCcw :size="14" />
          <span>Change PDF</span>
        </button>
      </div>

      <!-- Main Columns: Settings & Preview -->
      <div class="watermark-editor-grid">
        <!-- Left: Settings Panel -->
        <div class="watermark-settings-panel">
          <!-- Type Mode Selector: Text Stamp vs Image / Logo -->
          <div class="watermark-type-selector">
            <button
              type="button"
              class="type-tab-btn"
              :class="{ active: watermarkType === 'text' }"
              :disabled="busy"
              @click="watermarkType = 'text'"
            >
              <Type :size="16" />
              <span>Text Stamp</span>
            </button>
            <button
              type="button"
              class="type-tab-btn"
              :class="{ active: watermarkType === 'image' }"
              :disabled="busy"
              @click="watermarkType = 'image'"
            >
              <ImageIcon :size="16" />
              <span>Image / Logo</span>
            </button>
          </div>

          <!-- Mode 1: Text Watermark Settings -->
          <template v-if="watermarkType === 'text'">
            <div class="settings-section">
              <label class="settings-label" for="watermark-text-input">
                <Type :size="15" />
                <span>Watermark Text</span>
              </label>
              <input
                id="watermark-text-input"
                v-model="watermarkText"
                type="text"
                maxlength="80"
                placeholder="e.g. CONFIDENTIAL, DRAFT, SAMPLE"
                class="text-input"
                :disabled="busy"
              />

              <!-- Presets -->
              <div class="presets-row">
                <span class="presets-label">Presets:</span>
                <div class="presets-tags">
                  <button
                    v-for="preset in WATERMARK_PRESETS"
                    :key="preset"
                    type="button"
                    class="preset-chip"
                    :class="{ active: watermarkText === preset }"
                    :disabled="busy"
                    @click="setPreset(preset)"
                  >
                    {{ preset }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Color & Opacity (Text) -->
            <div class="settings-section">
              <div class="flex-label-row">
                <label class="settings-label">Color &amp; Opacity</label>
                <span class="value-badge">{{ watermarkOpacity }}%</span>
              </div>

              <div class="color-swatches-row">
                <button
                  v-for="color in WATERMARK_COLORS"
                  :key="color.hex"
                  type="button"
                  class="swatch-btn"
                  :class="{ active: watermarkColor.toLowerCase() === color.hex.toLowerCase() }"
                  :style="{ backgroundColor: color.hex }"
                  :title="color.name"
                  :disabled="busy"
                  @click="watermarkColor = color.hex"
                />
                <div class="custom-color-picker" title="Pick custom color">
                  <input
                    v-model="watermarkColor"
                    type="color"
                    class="color-input"
                    :disabled="busy"
                  />
                </div>
              </div>

              <div class="slider-control mt-3">
                <div class="slider-header">
                  <span>Transparency / Opacity</span>
                  <b>{{ watermarkOpacity }}%</b>
                </div>
                <input
                  v-model.number="watermarkOpacity"
                  type="range"
                  min="5"
                  max="95"
                  step="5"
                  class="range-slider"
                  :disabled="busy"
                />
              </div>
            </div>

            <!-- Size & Rotation (Text) -->
            <div class="settings-section">
              <div class="sliders-dual-row">
                <div class="slider-control">
                  <div class="slider-header">
                    <span>Font Size</span>
                    <b>{{ watermarkFontSize }}px</b>
                  </div>
                  <input
                    v-model.number="watermarkFontSize"
                    type="range"
                    min="16"
                    max="100"
                    step="2"
                    class="range-slider"
                    :disabled="busy"
                  />
                </div>

                <div class="slider-control">
                  <div class="slider-header">
                    <span>Angle</span>
                    <b>{{ watermarkRotation }}°</b>
                  </div>
                  <input
                    v-model.number="watermarkRotation"
                    type="range"
                    min="-90"
                    max="90"
                    step="5"
                    class="range-slider"
                    :disabled="busy"
                  />
                </div>
              </div>
            </div>
          </template>

          <!-- Mode 2: Image Watermark Settings -->
          <template v-else>
            <div class="settings-section">
              <label class="settings-label">
                <ImageIcon :size="15" />
                <span>Watermark Image / Logo</span>
              </label>

              <!-- Hidden file input for image -->
              <input
                ref="imageInput"
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.svg,.bmp,image/*"
                class="sr-only"
                aria-label="Upload watermark image"
                @change="onImageChosen"
              />

              <!-- Selected Image Card -->
              <div v-if="watermarkImage" class="watermark-image-card">
                <div class="image-thumb-wrap">
                  <img
                    :src="watermarkImage.imageElement?.src"
                    :alt="watermarkImage.name"
                    class="image-thumb-preview"
                  />
                </div>
                <div class="image-details-wrap">
                  <strong class="image-name" :title="watermarkImage.name">{{ watermarkImage.name }}</strong>
                  <span class="image-meta">
                    {{ watermarkImage.width }} × {{ watermarkImage.height }} px · {{ formatSize(watermarkImage.size) }}
                  </span>
                </div>
                <button
                  type="button"
                  class="image-action-btn"
                  title="Change image"
                  :disabled="busy"
                  @click="imageInput?.click()"
                >
                  <RotateCcw :size="14" />
                </button>
                <button
                  type="button"
                  class="image-action-btn remove"
                  title="Remove image"
                  :disabled="busy"
                  @click="removeWatermarkImage"
                >
                  <X :size="14" />
                </button>
              </div>

              <!-- Empty Image Picker Drop Card -->
              <div
                v-else
                class="watermark-image-picker"
                :class="{ 'is-dragging': imageDragging }"
                @click="imageInput?.click()"
                @dragenter.prevent="imageDragging = true"
                @dragover.prevent="imageDragging = true"
                @dragleave.prevent="imageDragging = false"
                @drop.prevent="imageDragging = false; if ($event.dataTransfer?.files?.length) processImageFile($event.dataTransfer.files[0])"
              >
                <div class="picker-icon-circle">
                  <Upload :size="18" />
                </div>
                <div class="picker-texts">
                  <strong>Click or Drop Image Here</strong>
                  <span>PNG (transparent recommended), JPG, WebP up to 15 MB</span>
                </div>
              </div>

              <div v-if="imageError" class="image-error-text" role="alert">
                <CircleAlert :size="14" />
                <span>{{ imageError }}</span>
              </div>
            </div>

            <!-- Image Size & Opacity -->
            <div class="settings-section">
              <div class="slider-control">
                <div class="slider-header">
                  <span>Image Scale / Size</span>
                  <b>{{ watermarkImageScale }}% of page</b>
                </div>
                <input
                  v-model.number="watermarkImageScale"
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  class="range-slider"
                  :disabled="busy"
                />
              </div>

              <div class="slider-control mt-3">
                <div class="slider-header">
                  <span>Transparency / Opacity</span>
                  <b>{{ watermarkOpacity }}%</b>
                </div>
                <input
                  v-model.number="watermarkOpacity"
                  type="range"
                  min="5"
                  max="95"
                  step="5"
                  class="range-slider"
                  :disabled="busy"
                />
              </div>

              <div class="slider-control mt-3">
                <div class="slider-header">
                  <span>Rotation Angle</span>
                  <b>{{ watermarkRotation }}°</b>
                </div>
                <input
                  v-model.number="watermarkRotation"
                  type="range"
                  min="-90"
                  max="90"
                  step="5"
                  class="range-slider"
                  :disabled="busy"
                />
              </div>
            </div>
          </template>

          <!-- Placement & Style (Common to both) -->
          <div class="settings-section">
            <label class="settings-label">
              <Stamp :size="15" />
              <span>Placement &amp; Style</span>
            </label>
            <div class="positions-grid">
              <button
                v-for="pos in WATERMARK_POSITIONS"
                :key="pos.id"
                type="button"
                class="position-card"
                :class="{ active: watermarkPosition === pos.id }"
                :disabled="busy"
                @click="setPosition(pos)"
              >
                <span>{{ pos.label }}</span>
              </button>
            </div>
          </div>

          <!-- Target Pages -->
          <div class="settings-section">
            <label class="settings-label">Apply to Pages</label>
            <div class="page-options-row">
              <label class="radio-option">
                <input
                  v-model="watermarkPages"
                  type="radio"
                  value="all"
                  name="pageSelection"
                  :disabled="busy"
                />
                <span>All Pages ({{ totalPdfPages }})</span>
              </label>
              <label class="radio-option">
                <input
                  v-model="watermarkPages"
                  type="radio"
                  value="first"
                  name="pageSelection"
                  :disabled="busy"
                />
                <span>First Page Only</span>
              </label>
              <label class="radio-option">
                <input
                  v-model="watermarkPages"
                  type="radio"
                  value="custom"
                  name="pageSelection"
                  :disabled="busy"
                />
                <span>Custom Range</span>
              </label>
            </div>

            <input
              v-if="watermarkPages === 'custom'"
              v-model="watermarkCustomPages"
              type="text"
              placeholder="e.g. 1-3, 5"
              class="text-input mt-2"
              :disabled="busy"
            />
          </div>

          <!-- Apply Action Button -->
          <div class="action-footer">
            <button
              type="button"
              class="primary-button apply-btn"
              :disabled="busy || (watermarkType === 'text' && !watermarkText.trim()) || (watermarkType === 'image' && !watermarkImage)"
              @click="executeWatermark"
            >
              <LoaderCircle v-if="busy" :size="18" class="animate-spin" />
              <Download v-else :size="18" />
              <span>{{ busy ? (progress || 'Applying Watermark…') : 'Download Watermarked PDF' }}</span>
            </button>
          </div>
        </div>

        <!-- Right: Live Canvas Preview -->
        <div class="watermark-preview-panel">
          <div class="preview-header">
            <div class="preview-title">
              <Eye :size="15" />
              <span>Page 1 Live Preview</span>
            </div>
            <span class="preview-hint">Updates automatically as you type</span>
          </div>

          <div class="preview-stage-wrap">
            <div v-if="previewLoading" class="preview-loading-overlay">
              <LoaderCircle :size="30" class="animate-spin text-sky-500" />
              <span>Loading PDF page preview…</span>
            </div>
            <div v-else-if="previewError" class="preview-error-note">
              {{ previewError }}
            </div>
            <canvas ref="previewCanvas" class="preview-canvas" />
          </div>
        </div>
      </div>
    </div>

    <!-- STAGE 3: Completed State -->
    <div v-else-if="stage === 3" class="result-card">
      <div class="result-icon-ring">
        <Check :size="32" class="text-emerald-500" />
      </div>
      <div class="result-details">
        <h3>PDF Watermarked Successfully!</h3>
        <p class="result-filename">{{ resultPdf?.filename }}</p>
        <span class="result-size">{{ formatSize(resultPdf?.size || 0) }} · Ready for download</span>
      </div>
      <div class="result-actions">
        <button
          type="button"
          class="primary-button"
          @click="triggerDownload(resultPdf?.url, resultPdf?.filename)"
        >
          <Download :size="16" />
          <span>Download Again</span>
        </button>
        <button
          type="button"
          class="ghost-button"
          @click="resetAll"
        >
          <RotateCcw :size="16" />
          <span>Watermark Another PDF</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.watermark-pdf-converter {
  position: relative;
  border-radius: var(--radius-xl, 1.25rem);
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  padding: 1.75rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
}

.converter-heading {
  margin-bottom: 1.5rem;
}

.converter-heading h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-heading, #0f172a);
  margin-top: 0.25rem;
}

.converter-heading p {
  color: var(--text-muted, #64748b);
  font-size: 0.925rem;
  margin-top: 0.35rem;
}

.mini-label {
  display: inline-block;
  font-size: 0.725rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #e11d48;
  text-transform: uppercase;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}

.error-dismiss {
  margin-left: auto;
  color: #b91c1c;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.2rem;
}

/* Dropzone */
.dropzone-area {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px dashed var(--border-color, #cbd5e1);
  border-radius: 1rem;
  padding: 3rem 1.5rem;
  background: var(--surface-bg, #f8fafc);
  transition: all 0.2s ease;
  cursor: pointer;
}

.dropzone-area.is-dragging {
  border-color: #e11d48;
  background: #f0f9ff;
}

.dropzone-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.dropzone-icon-ring {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #fff1f2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.dropzone-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-heading, #0f172a);
}

.dropzone-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted, #64748b);
  margin-top: 0.2rem;
}

.dropzone-button {
  margin-top: 1.25rem;
  padding: 0.65rem 1.5rem;
  background: #e11d48;
  color: #ffffff;
  border-radius: 0.625rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.dropzone-button:hover {
  background: #be123c;
}

.dropzone-hint {
  font-size: 0.775rem;
  color: var(--text-muted, #94a3b8);
  margin-top: 1rem;
}

/* Selected File Bar */
.selected-file-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.1rem;
  background: var(--surface-bg, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 0.75rem;
  margin-bottom: 1.25rem;
}

.selected-file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow: hidden;
}

.file-icon-badge {
  width: 38px;
  height: 38px;
  border-radius: 0.5rem;
  background: #fff1f2;
  color: #e11d48;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-details {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-name {
  font-size: 0.925rem;
  color: var(--text-heading, #0f172a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 0.775rem;
  color: var(--text-muted, #64748b);
}

.btn-reset {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.825rem;
  color: var(--text-muted, #64748b);
  border: 1px solid var(--border-color, #cbd5e1);
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  background: transparent;
  cursor: pointer;
}

.btn-reset:hover {
  color: var(--text-heading, #0f172a);
  background: var(--hover-bg, #f1f5f9);
}

/* Grid Layout */
.watermark-editor-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .watermark-editor-grid {
    grid-template-columns: 1fr;
  }
}

/* Type Tab Selector: Text Stamp vs Image / Logo */
.watermark-type-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  background: var(--surface-bg, #f1f5f9);
  padding: 4px;
  border-radius: 0.65rem;
  border: 1px solid var(--border-color, #e2e8f0);
}

.type-tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  color: var(--text-muted, #64748b);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.type-tab-btn:hover:not(:disabled) {
  color: var(--text-heading, #0f172a);
}

.type-tab-btn.active {
  background: var(--card-bg, #ffffff);
  color: #e11d48;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Image Watermark Upload & Selected Card */
.watermark-image-picker {
  border: 2px dashed var(--border-color, #cbd5e1);
  border-radius: 0.75rem;
  padding: 1.25rem 1rem;
  background: var(--surface-bg, #f8fafc);
  display: flex;
  align-items: center;
  gap: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.watermark-image-picker:hover,
.watermark-image-picker.is-dragging {
  border-color: #e11d48;
  background: #f0f9ff;
}

.picker-icon-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #fff1f2;
  color: #e11d48;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.picker-texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.picker-texts strong {
  font-size: 0.875rem;
  color: var(--text-heading, #0f172a);
}

.picker-texts span {
  font-size: 0.75rem;
  color: var(--text-muted, #64748b);
}

/* Selected Image Card */
.watermark-image-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  background: var(--surface-bg, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
}

.image-thumb-wrap {
  width: 44px;
  height: 44px;
  border-radius: 0.5rem;
  background: repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 12px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--border-color, #cbd5e1);
  flex-shrink: 0;
}

.image-thumb-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-details-wrap {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.image-name {
  font-size: 0.85rem;
  color: var(--text-heading, #0f172a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-meta {
  font-size: 0.75rem;
  color: var(--text-muted, #64748b);
}

.image-action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.45rem;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--card-bg, #ffffff);
  color: var(--text-muted, #64748b);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.image-action-btn:hover {
  border-color: #e11d48;
  color: #e11d48;
}

.image-action-btn.remove:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}

.image-error-text {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #ef4444;
  font-size: 0.775rem;
  margin-top: 0.4rem;
}

/* Settings Panel */
.watermark-settings-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #f1f5f9);
}

.settings-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-heading, #0f172a);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.text-input {
  width: 100%;
  padding: 0.6rem 0.85rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--input-bg, #ffffff);
  color: var(--text-heading, #0f172a);
  font-size: 0.95rem;
}

.text-input:focus {
  outline: none;
  border-color: #e11d48;
  box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.15);
}

.presets-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
}

.presets-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted, #94a3b8);
}

.presets-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.preset-chip {
  font-size: 0.725rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 0.375rem;
  background: var(--surface-bg, #f1f5f9);
  color: var(--text-heading, #334155);
  border: 1px solid var(--border-color, #e2e8f0);
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-chip:hover {
  background: #fff1f2;
  color: #e11d48;
  border-color: #fecdd3;
}

.preset-chip.active {
  background: #e11d48;
  color: #ffffff;
  border-color: #e11d48;
}

/* Positions Grid */
.positions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
}

.position-card {
  padding: 0.5rem 0.4rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--surface-bg, #ffffff);
  color: var(--text-heading, #334155);
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.position-card:hover {
  border-color: #fda4af;
  background: #f0f9ff;
}

.position-card.active {
  border-color: #e11d48;
  background: #fff1f2;
  color: #be123c;
  font-weight: 600;
}

/* Swatches & Colors */
.flex-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.value-badge {
  font-size: 0.75rem;
  font-weight: 600;
  background: #fff1f2;
  color: #e11d48;
  padding: 0.1rem 0.45rem;
  border-radius: 0.375rem;
}

.color-swatches-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.swatch-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1px #cbd5e1;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.swatch-btn:hover {
  transform: scale(1.1);
}

.swatch-btn.active {
  box-shadow: 0 0 0 2px #e11d48;
  transform: scale(1.15);
}

.custom-color-picker {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  position: relative;
}

.color-input {
  position: absolute;
  top: -10px;
  left: -10px;
  width: 50px;
  height: 50px;
  cursor: pointer;
}

/* Sliders */
.slider-control {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.775rem;
  color: var(--text-muted, #64748b);
}

.range-slider {
  width: 100%;
  accent-color: #e11d48;
  cursor: pointer;
}

.sliders-dual-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Page Options */
.page-options-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.825rem;
  color: var(--text-heading, #334155);
}

.radio-option {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
}

/* Apply Button */
.action-footer {
  margin-top: 0.5rem;
}

.apply-btn {
  width: 100%;
  padding: 0.85rem 1.25rem;
  background: #e11d48;
  color: #ffffff;
  border-radius: 0.625rem;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background 0.15s ease;
  border: none;
}

.apply-btn:hover:not(:disabled) {
  background: #be123c;
}

.apply-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Right: Preview Panel */
.watermark-preview-panel {
  display: flex;
  flex-direction: column;
  background: var(--surface-bg, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 0.875rem;
  padding: 1rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.preview-title {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--text-heading, #0f172a);
}

.preview-hint {
  font-size: 0.725rem;
  color: var(--text-muted, #94a3b8);
}

.preview-stage-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #525659;
  border-radius: 0.5rem;
  padding: 1rem;
  min-height: 420px;
  overflow: hidden;
}

.preview-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #ffffff;
  font-size: 0.875rem;
  z-index: 5;
}

.preview-error-note {
  color: #fca5a5;
  font-size: 0.825rem;
  text-align: center;
}

.preview-canvas {
  max-width: 100%;
  max-height: 480px;
  height: auto;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.35);
  border-radius: 2px;
  background: #ffffff;
}

/* Stage 3 Result Card */
.result-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1.5rem;
}

.result-icon-ring {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: #d1fae5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.result-details h3 {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-heading, #0f172a);
}

.result-filename {
  font-size: 0.95rem;
  color: var(--text-muted, #475569);
  margin-top: 0.35rem;
}

.result-size {
  display: inline-block;
  font-size: 0.825rem;
  color: var(--text-muted, #94a3b8);
  margin-top: 0.2rem;
}

.result-actions {
  display: flex;
  gap: 0.85rem;
  margin-top: 1.75rem;
}

.result-actions .primary-button {
  padding: 0.7rem 1.5rem;
  background: #e11d48;
  color: #ffffff;
  border-radius: 0.5rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  cursor: pointer;
}

.result-actions .primary-button:hover {
  background: #be123c;
}

.result-actions .ghost-button {
  padding: 0.7rem 1.25rem;
  border: 1px solid var(--border-color, #cbd5e1);
  background: transparent;
  color: var(--text-heading, #334155);
  border-radius: 0.5rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.result-actions .ghost-button:hover {
  background: var(--hover-bg, #f1f5f9);
}

/* Dark mode adjustments */
:global([data-theme="dark"]) .watermark-pdf-converter {
  --card-bg: #1e293b;
  --surface-bg: #0f172a;
  --border-color: #334155;
  --text-heading: #f8fafc;
  --text-muted: #94a3b8;
  --input-bg: #0f172a;
  --hover-bg: #334155;
}

:global([data-theme="dark"]) .dropzone-icon-ring,
:global([data-theme="dark"]) .file-icon-badge {
  background: #082f49;
  color: #fb7185;
}

:global([data-theme="dark"]) .position-card.active {
  background: #082f49;
  color: #fb7185;
  border-color: #e11d48;
}

:global([data-theme="dark"]) .preset-chip {
  background: #334155;
  color: #f1f5f9;
  border-color: #475569;
}

:global([data-theme="dark"]) .preset-chip:hover {
  background: #082f49;
  color: #fb7185;
  border-color: #e11d48;
}

:global([data-theme="dark"]) .value-badge {
  background: #082f49;
  color: #fb7185;
}

:global([data-theme="dark"]) .result-icon-ring {
  background: #064e3b;
}

:global([data-theme="dark"]) .watermark-type-selector {
  background: #0b1220;
  border-color: #1e293b;
}

:global([data-theme="dark"]) .type-tab-btn.active {
  background: #1e293b;
  color: #fb7185;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

:global([data-theme="dark"]) .watermark-image-picker {
  background: #0b1220;
  border-color: #334155;
}

:global([data-theme="dark"]) .watermark-image-picker:hover,
:global([data-theme="dark"]) .watermark-image-picker.is-dragging {
  background: #0f172a;
  border-color: #fb7185;
}

:global([data-theme="dark"]) .picker-icon-circle {
  background: #4c0519;
  color: #fb7185;
}

:global([data-theme="dark"]) .watermark-image-card {
  background: #0b1220;
  border-color: #334155;
}

:global([data-theme="dark"]) .image-thumb-wrap {
  background: repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 12px 12px;
  border-color: #334155;
}

:global([data-theme="dark"]) .image-action-btn {
  background: #111827;
  border-color: #334155;
  color: #94a3b8;
}

:global([data-theme="dark"]) .image-action-btn:hover {
  border-color: #fb7185;
  color: #fb7185;
}

:global([data-theme="dark"]) .image-action-btn.remove:hover {
  border-color: #f87171;
  color: #f87171;
  background: #450a0a;
}
</style>

