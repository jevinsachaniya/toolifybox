<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import {
  Check,
  CircleAlert,
  Download,
  Eye,
  FileCheck,
  Grid3x3,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  LoaderCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Stamp,
  Type,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import {
  applyWatermarkToImage,
  drawWatermark,
  loadImageFromFile,
  NINE_POSITIONS,
  validateImageFile,
  WATERMARK_COLORS,
  WATERMARK_FONTS,
  WATERMARK_PRESETS,
  watermarkedImageFilename,
} from '~/utils/watermark-image.js';

// Base Image State
const file = shallowRef(null);
const fileInput = ref(null);
const isDragging = ref(false);
const imageObj = shallowRef(null);
const imageDimensions = ref({ width: 0, height: 0 });

// Watermark Mode: 'text' | 'image'
const watermarkType = ref('text');

// Text Watermark Settings
const watermarkText = ref('CONFIDENTIAL');
const selectedFont = ref(WATERMARK_FONTS[0].value);
const fontSize = ref(52);
const isBold = ref(true);
const isItalic = ref(false);
const textColor = ref('#ffffff');
const hasShadow = ref(true);

// Image / Logo Watermark Settings
const logoFile = shallowRef(null);
const logoInput = ref(null);
const logoObj = shallowRef(null);
const logoScale = ref(25); // % of image width
const isLogoDragging = ref(false);

// Common Layout & Transform Settings
const opacity = ref(45); // 0 - 100
const rotation = ref(-25); // -180 to 180 degrees
const placement = ref('9-point'); // '9-point' | 'tiled'
const position = ref('center'); // 9-point position id
const margin = ref(30); // px from edges
const tileSpacing = ref(70);

// Export Settings
const exportFormat = ref('png'); // 'original' | 'png' | 'jpeg' | 'webp'
const exportQuality = ref(0.92);
const outputFilename = ref('');

// UI & Processing States
const previewCanvas = ref(null);
const busy = ref(false);
const progress = ref('');
const error = ref('');
const zoomFit = ref(true);

// Result State
const resultImage = shallowRef(null); // { blob, url, width, height, size, filename }
let active = true;

const stage = computed(() => {
  if (resultImage.value) return 3;
  if (file.value && imageObj.value) return 2;
  return 1;
});

onMounted(() => {
  active = true;
});

onBeforeUnmount(() => {
  active = false;
  clearResult();
  if (logoObj.value?.url) URL.revokeObjectURL(logoObj.value.url);
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
  logoFile.value = null;
  logoObj.value = null;
  busy.value = false;
  error.value = '';
  progress.value = '';
}

// Handle File Selection
async function handleFileSelect(files) {
  if (!files || !files.length) return;
  const selected = files[0];
  const validation = validateImageFile(selected);
  if (!validation.valid) {
    error.value = validation.error;
    return;
  }

  error.value = '';
  busy.value = true;
  progress.value = 'Loading image…';

  try {
    const loaded = await loadImageFromFile(selected);
    if (!active) return;
    file.value = selected;
    imageObj.value = loaded.img;
    imageDimensions.value = { width: loaded.width, height: loaded.height };

    // Auto-scale font size proportionally to image resolution
    const minDim = Math.min(loaded.width, loaded.height);
    fontSize.value = Math.max(24, Math.min(180, Math.round(minDim * 0.07)));
    margin.value = Math.max(16, Math.round(minDim * 0.04));

    outputFilename.value = watermarkedImageFilename(selected.name, exportFormat.value);
    await nextTick();
    updatePreview();
  } catch (err) {
    error.value = err.message || 'Failed to open image file.';
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

// Handle Logo Upload
async function handleLogoSelect(files) {
  if (!files || !files.length) return;
  const selected = files[0];
  const validation = validateImageFile(selected, 20 * 1024 * 1024);
  if (!validation.valid) {
    error.value = validation.error;
    return;
  }

  try {
    const loaded = await loadImageFromFile(selected);
    logoFile.value = selected;
    logoObj.value = loaded;
    watermarkType.value = 'image';
    updatePreview();
  } catch (err) {
    error.value = 'Failed to load logo image.';
  }
}

function removeLogo() {
  if (logoObj.value?.url) URL.revokeObjectURL(logoObj.value.url);
  logoFile.value = null;
  logoObj.value = null;
  updatePreview();
}

// Render Real-time Preview onto Canvas
function updatePreview() {
  if (!imageObj.value || !previewCanvas.value) return;

  const canvas = previewCanvas.value;
  const img = imageObj.value;
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear & Draw base image
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  // Draw Watermark
  drawWatermark(ctx, w, h, {
    type: watermarkType.value,
    text: watermarkText.value,
    fontFamily: selectedFont.value,
    fontSize: fontSize.value,
    isBold: isBold.value,
    isItalic: isItalic.value,
    color: textColor.value,
    shadow: hasShadow.value,
    logoImage: logoObj.value?.img || null,
    logoScale: logoScale.value,
    opacity: opacity.value,
    rotation: rotation.value,
    placement: placement.value,
    position: position.value,
    margin: margin.value,
    tileSpacing: tileSpacing.value,
  });
}

// Watch controls to update live canvas
watch(
  [
    watermarkType,
    watermarkText,
    selectedFont,
    fontSize,
    isBold,
    isItalic,
    textColor,
    hasShadow,
    logoScale,
    opacity,
    rotation,
    placement,
    position,
    margin,
    tileSpacing,
  ],
  () => {
    updatePreview();
  }
);

watch(exportFormat, (newFmt) => {
  if (file.value) {
    outputFilename.value = watermarkedImageFilename(file.value.name, newFmt);
  }
});

// Compile & Export Full-Resolution Watermarked Image
async function handleExport() {
  if (!imageObj.value || !file.value) return;

  busy.value = true;
  progress.value = 'Applying watermark & encoding image…';
  error.value = '';

  try {
    let mime = 'image/png';
    if (exportFormat.value === 'jpeg' || exportFormat.value === 'jpg') {
      mime = 'image/jpeg';
    } else if (exportFormat.value === 'webp') {
      mime = 'image/webp';
    } else if (exportFormat.value === 'original') {
      mime = file.value.type || 'image/png';
    }

    const res = await applyWatermarkToImage(imageObj.value, {
      type: watermarkType.value,
      text: watermarkText.value,
      fontFamily: selectedFont.value,
      fontSize: fontSize.value,
      isBold: isBold.value,
      isItalic: isItalic.value,
      color: textColor.value,
      shadow: hasShadow.value,
      logoImage: logoObj.value?.img || null,
      logoScale: logoScale.value,
      opacity: opacity.value,
      rotation: rotation.value,
      placement: placement.value,
      position: position.value,
      margin: margin.value,
      tileSpacing: tileSpacing.value,
      format: mime,
      quality: exportQuality.value,
    });

    const finalName = outputFilename.value.trim() || watermarkedImageFilename(file.value.name, exportFormat.value);

    resultImage.value = {
      ...res,
      filename: finalName,
      originalSize: file.value.size,
    };
  } catch (err) {
    error.value = err.message || 'Error processing watermark.';
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

// Quick Preset Watermark Click
function applyPreset(preset) {
  watermarkType.value = 'text';
  watermarkText.value = preset;
  updatePreview();
}

// Drag & Drop Handlers
function onDragOver(e) {
  e.preventDefault();
  isDragging.value = true;
}
function onDragLeave(e) {
  e.preventDefault();
  isDragging.value = false;
}
function onDrop(e) {
  e.preventDefault();
  isDragging.value = false;
  if (e.dataTransfer?.files) handleFileSelect(e.dataTransfer.files);
}
</script>

<template>
  <div class="converter watermark-image-converter" :data-stage="stage">
    <!-- Hidden File Pickers -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*,.jpg,.jpeg,.png,.webp,.svg,.bmp,.gif,.avif"
      class="visually-hidden"
      style="display: none;"
      @change="(e) => { if (e.target.files) handleFileSelect(e.target.files); e.target.value = ''; }"
    />
    <input
      ref="logoInput"
      type="file"
      accept="image/*,.png,.svg,.jpg,.jpeg,.webp"
      class="visually-hidden"
      style="display: none;"
      @change="(e) => { if (e.target.files) handleLogoSelect(e.target.files); e.target.value = ''; }"
    />

    <!-- ================= STAGE 3: RESULT VIEW ================= -->
    <div v-if="resultImage" class="result-state watermark-result">
      <div
        class="file-chosen-icon"
        style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; width: 60px; height: 60px; border-radius: 18px; display: grid; place-items: center; margin: 0 auto 16px;"
      >
        <FileCheck :size="30" />
      </div>

      <h3>Image Watermarked Successfully!</h3>
      <p class="result-subtitle">Your protected, stamped image is ready to download with full original quality.</p>

      <div class="watermark-result-preview-wrap">
        <img :src="resultImage.url" :alt="resultImage.filename" class="watermark-result-img" />
      </div>

      <div class="selected-file" style="margin: 18px 0;">
        <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
          <div
            style="background: linear-gradient(135deg, #f43f5e, #e11d48); color: #fff; width: 44px; height: 44px; border-radius: 10px; display: grid; place-items: center; flex-shrink: 0;"
          >
            <ImageIcon :size="20" />
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
          <Download :size="18" /> Download Watermarked Image
        </a>
        <button class="text-button" type="button" @click="resetAll">
          <RotateCcw :size="16" /> Watermark Another Image
        </button>
      </div>
    </div>

    <!-- ================= STAGE 2: WORKSPACE & CONTROLS ================= -->
    <div v-else-if="file && imageObj" class="watermark-workspace">
      <!-- Top Info Bar -->
      <div class="organize-header-bar watermark-top-info">
        <div class="organize-files-info">
          <div class="files-summary-pill">
            <ImageIcon :size="16" />
            <span>
              <b>{{ file.name }}</b> &bull; {{ imageDimensions.width }} × {{ imageDimensions.height }} px ({{ formatSize(file.size) }})
            </span>
          </div>
        </div>

        <div class="organize-top-actions">
          <button
            type="button"
            class="tool-action-btn secondary"
            title="Change image"
            :disabled="busy"
            @click="fileInput?.click()"
          >
            <Upload :size="14" />
            <span>Change Image</span>
          </button>
          <button
            type="button"
            class="tool-action-btn icon-only clear-btn"
            title="Reset"
            :disabled="busy"
            @click="resetAll"
          >
            <X :size="15" />
          </button>
        </div>
      </div>

      <!-- Main Layout: Preview Canvas on Left, Controls on Right -->
      <div class="watermark-main-grid">
        <!-- Live Preview Canvas Box -->
        <div class="watermark-preview-card">
          <div class="preview-card-header">
            <span class="preview-title">
              <Eye :size="14" /> Live Interactive Preview
            </span>
            <div class="preview-meta-badge">
              {{ imageDimensions.width }} × {{ imageDimensions.height }} px
            </div>
          </div>

          <div class="watermark-canvas-scroll">
            <canvas ref="previewCanvas" class="watermark-canvas-element" />
          </div>

          <div class="preview-tip-footer">
            <Sparkles :size="13" /> 100% Client-side sandbox. Your photo never leaves your browser memory.
          </div>
        </div>

        <!-- Controls Sidebar -->
        <div class="watermark-controls-card">
          <!-- Watermark Type Tabs -->
          <div class="watermark-type-tabs">
            <button
              type="button"
              class="wm-tab-btn"
              :class="{ active: watermarkType === 'text' }"
              @click="watermarkType = 'text'"
            >
              <Type :size="15" /> Text Watermark
            </button>
            <button
              type="button"
              class="wm-tab-btn"
              :class="{ active: watermarkType === 'image' }"
              @click="watermarkType = 'image'"
            >
              <Stamp :size="15" /> Logo / Image Stamp
            </button>
          </div>

          <!-- ================= TAB 1: TEXT WATERMARK ================= -->
          <div v-if="watermarkType === 'text'" class="wm-controls-section">
            <!-- Preset Quick Chips -->
            <div class="control-row">
              <label class="control-label">Quick Presets:</label>
              <div class="presets-wrap">
                <button
                  v-for="preset in WATERMARK_PRESETS"
                  :key="preset"
                  type="button"
                  class="preset-chip"
                  :class="{ active: watermarkText === preset }"
                  @click="applyPreset(preset)"
                >
                  {{ preset }}
                </button>
              </div>
            </div>

            <!-- Custom Text Input -->
            <div class="control-row">
              <label for="wm-text-input" class="control-label">Watermark Text:</label>
              <input
                id="wm-text-input"
                v-model="watermarkText"
                type="text"
                class="wm-text-input"
                placeholder="Enter watermark text or brand name…"
              />
            </div>

            <!-- Font & Typography Controls -->
            <div class="control-row-grid-2">
              <div class="control-group">
                <label for="wm-font-select" class="control-label">Font Family:</label>
                <select id="wm-font-select" v-model="selectedFont" class="wm-select-input">
                  <option v-for="f in WATERMARK_FONTS" :key="f.value" :value="f.value">
                    {{ f.label }}
                  </option>
                </select>
              </div>

              <div class="control-group">
                <label class="control-label">Style &amp; Shadow:</label>
                <div class="toggle-buttons-row">
                  <button
                    type="button"
                    class="style-toggle-btn"
                    :class="{ active: isBold }"
                    title="Bold"
                    @click="isBold = !isBold"
                  >
                    <b>B</b>
                  </button>
                  <button
                    type="button"
                    class="style-toggle-btn"
                    :class="{ active: isItalic }"
                    title="Italic"
                    @click="isItalic = !isItalic"
                  >
                    <i>I</i>
                  </button>
                  <button
                    type="button"
                    class="style-toggle-btn shadow-toggle"
                    :class="{ active: hasShadow }"
                    title="Text Outline / Drop Shadow"
                    @click="hasShadow = !hasShadow"
                  >
                    Shadow
                  </button>
                </div>
              </div>
            </div>

            <!-- Font Size & Color -->
            <div class="control-row-grid-2">
              <div class="control-group">
                <div class="slider-label-wrap">
                  <label for="wm-font-size" class="control-label">Font Size:</label>
                  <span class="slider-val">{{ fontSize }} px</span>
                </div>
                <input
                  id="wm-font-size"
                  v-model.number="fontSize"
                  type="range"
                  min="16"
                  max="180"
                  class="wm-range-slider"
                />
              </div>

              <div class="control-group">
                <label class="control-label">Color:</label>
                <div class="color-picker-wrap">
                  <div class="color-swatches">
                    <button
                      v-for="c in WATERMARK_COLORS"
                      :key="c.hex"
                      type="button"
                      class="color-circle"
                      :style="{ background: c.hex }"
                      :class="{ active: textColor.toLowerCase() === c.hex.toLowerCase() }"
                      :title="c.name"
                      @click="textColor = c.hex"
                    />
                  </div>
                  <input v-model="textColor" type="color" class="custom-color-input" title="Custom color picker" />
                </div>
              </div>
            </div>
          </div>

          <!-- ================= TAB 2: LOGO / IMAGE WATERMARK ================= -->
          <div v-else class="wm-controls-section">
            <div v-if="!logoObj" class="logo-upload-dropzone" @click="logoInput?.click()">
              <div class="logo-upload-icon">
                <Upload :size="24" />
              </div>
              <h4>Upload Logo or Stamp Image</h4>
              <p>PNG with transparency, SVG, JPG, or WebP.</p>
              <button type="button" class="tool-action-btn secondary" style="margin-top: 8px;">
                Choose Logo File
              </button>
            </div>

            <div v-else class="logo-selected-card">
              <div class="logo-thumb-preview">
                <img :src="logoObj.url" alt="Watermark logo" />
              </div>
              <div class="logo-info">
                <div class="logo-filename">{{ logoFile?.name }}</div>
                <div class="logo-meta">{{ logoObj.width }} × {{ logoObj.height }} px &bull; {{ formatSize(logoFile?.size) }}</div>
              </div>
              <div class="logo-actions">
                <button type="button" class="pill-chip-btn" @click="logoInput?.click()">Change</button>
                <button type="button" class="pill-chip-btn danger" @click="removeLogo">Remove</button>
              </div>
            </div>

            <!-- Logo Size Scale -->
            <div v-if="logoObj" class="control-row" style="margin-top: 14px;">
              <div class="slider-label-wrap">
                <label for="wm-logo-scale" class="control-label">Logo Scale (% of image):</label>
                <span class="slider-val">{{ logoScale }}%</span>
              </div>
              <input
                id="wm-logo-scale"
                v-model.number="logoScale"
                type="range"
                min="5"
                max="80"
                class="wm-range-slider"
              />
            </div>
          </div>

          <div class="controls-divider" />

          <!-- ================= POSITION & LAYOUT SETTINGS ================= -->
          <div class="wm-controls-section">
            <!-- Placement Mode: 9-Point vs Tiled -->
            <div class="control-row">
              <label class="control-label">Placement Mode:</label>
              <div class="mode-toggle-group">
                <button
                  type="button"
                  class="mode-btn"
                  :class="{ active: placement === '9-point' }"
                  @click="placement = '9-point'"
                >
                  <Grid3x3 :size="14" /> 9-Point Position
                </button>
                <button
                  type="button"
                  class="mode-btn"
                  :class="{ active: placement === 'tiled' }"
                  @click="placement = 'tiled'"
                >
                  <LayoutGrid :size="14" /> Tiled Diagonal Grid
                </button>
              </div>
            </div>

            <!-- 9-Point Position Selector -->
            <div v-if="placement === '9-point'" class="control-row-grid-2">
              <div class="control-group">
                <label class="control-label">Grid Anchor:</label>
                <div class="nine-position-grid">
                  <button
                    v-for="pos in NINE_POSITIONS"
                    :key="pos.id"
                    type="button"
                    class="nine-pos-btn"
                    :class="{ active: position === pos.id }"
                    :title="pos.label"
                    @click="position = pos.id"
                  >
                    {{ pos.symbol }}
                  </button>
                </div>
              </div>

              <div class="control-group">
                <div class="slider-label-wrap">
                  <label for="wm-margin-slider" class="control-label">Edge Margin:</label>
                  <span class="slider-val">{{ margin }} px</span>
                </div>
                <input
                  id="wm-margin-slider"
                  v-model.number="margin"
                  type="range"
                  min="0"
                  max="150"
                  class="wm-range-slider"
                />
              </div>
            </div>

            <!-- Tiled Grid Spacing -->
            <div v-else class="control-row">
              <div class="slider-label-wrap">
                <label for="wm-tile-spacing" class="control-label">Tile Repeat Spacing:</label>
                <span class="slider-val">{{ tileSpacing }} px</span>
              </div>
              <input
                id="wm-tile-spacing"
                v-model.number="tileSpacing"
                type="range"
                min="30"
                max="200"
                class="wm-range-slider"
              />
            </div>

            <!-- Opacity & Rotation Sliders -->
            <div class="control-row-grid-2">
              <div class="control-group">
                <div class="slider-label-wrap">
                  <label for="wm-opacity-slider" class="control-label">Opacity:</label>
                  <span class="slider-val">{{ opacity }}%</span>
                </div>
                <input
                  id="wm-opacity-slider"
                  v-model.number="opacity"
                  type="range"
                  min="5"
                  max="100"
                  class="wm-range-slider"
                />
              </div>

              <div class="control-group">
                <div class="slider-label-wrap">
                  <label for="wm-rotation-slider" class="control-label">Rotation Angle:</label>
                  <span class="slider-val">{{ rotation }}°</span>
                </div>
                <input
                  id="wm-rotation-slider"
                  v-model.number="rotation"
                  type="range"
                  min="-180"
                  max="180"
                  class="wm-range-slider"
                />
                <div class="quick-angle-row">
                  <button type="button" class="quick-angle-btn" @click="rotation = 0">0°</button>
                  <button type="button" class="quick-angle-btn" @click="rotation = -30">-30°</button>
                  <button type="button" class="quick-angle-btn" @click="rotation = -45">-45°</button>
                  <button type="button" class="quick-angle-btn" @click="rotation = 45">+45°</button>
                  <button type="button" class="quick-angle-btn" @click="rotation = 90">90°</button>
                </div>
              </div>
            </div>
          </div>

          <div class="controls-divider" />

          <!-- ================= EXPORT SETTINGS ================= -->
          <div class="wm-controls-section">
            <div class="control-row-grid-2">
              <div class="control-group">
                <label for="wm-export-format" class="control-label">Format:</label>
                <select id="wm-export-format" v-model="exportFormat" class="wm-select-input">
                  <option value="png">PNG (Lossless &amp; Sharp)</option>
                  <option value="jpeg">JPG (Compressed)</option>
                  <option value="webp">WebP (Modern Compact)</option>
                  <option value="original">Original Format</option>
                </select>
              </div>

              <div v-if="exportFormat === 'jpeg' || exportFormat === 'webp'" class="control-group">
                <div class="slider-label-wrap">
                  <label for="wm-export-quality" class="control-label">Quality:</label>
                  <span class="slider-val">{{ Math.round(exportQuality * 100) }}%</span>
                </div>
                <input
                  id="wm-export-quality"
                  v-model.number="exportQuality"
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.02"
                  class="wm-range-slider"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Controls & Download Action Bar -->
      <div class="organize-bottom-bar">
        <div class="output-filename-group">
          <label for="output-filename-wm">Output Filename:</label>
          <input
            id="output-filename-wm"
            v-model="outputFilename"
            type="text"
            placeholder="watermarked.png"
            :disabled="busy"
          />
        </div>

        <div class="organize-action-buttons">
          <button
            type="button"
            class="organize-cancel-btn"
            :disabled="busy"
            title="Cancel and choose another image"
            @click="resetAll"
          >
            <RotateCcw :size="15" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            class="primary-button organize-save-btn"
            :disabled="busy"
            @click="handleExport"
          >
            <LoaderCircle v-if="busy" class="spin" :size="18" />
            <Download v-else :size="18" />
            <span>{{ busy ? 'Applying Watermark…' : 'Apply Watermark & Download' }}</span>
          </button>
        </div>
      </div>

      <div v-if="busy" class="progress-pill" style="margin-top: 14px;">
        <LoaderCircle class="spin" :size="14" />
        <span>{{ progress || 'Processing image…' }}</span>
      </div>

      <div v-if="error" class="error-banner" style="margin-top: 14px;">
        <CircleAlert :size="18" />
        <span>{{ error }}</span>
        <button type="button" class="close-err-btn" @click="error = ''">
          <X :size="14" />
        </button>
      </div>
    </div>

    <!-- ================= STAGE 1: UPLOAD DROPZONE ================= -->
    <div
      v-else
      class="drop-zone"
      :class="{ dragging: isDragging, active: isDragging }"
      tabindex="0"
      role="button"
      @click="fileInput?.click()"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @keydown.enter="fileInput?.click()"
      @keydown.space.prevent="fileInput?.click()"
    >
      <div
        class="drop-zone-icon"
        style="background: linear-gradient(135deg, #f43f5e, #e11d48); color: #fff; width: 64px; height: 64px; border-radius: 18px; display: grid; place-items: center; margin: 0 auto 16px;"
      >
        <Stamp :size="30" />
      </div>

      <h3>Select or drop image to watermark</h3>
      <p>Stamp confidential text, copyright marks, or custom logos on any JPG, PNG, or WebP photo.</p>

      <button type="button" class="choose-button" :disabled="busy" @click.stop="fileInput?.click()">
        Choose Image
      </button>

      <p class="dropzone-privacy-note">
        100% private in-browser tool. Your photos are never uploaded to any cloud server.
      </p>

      <div v-if="busy" class="progress-pill" style="margin-top: 16px;">
        <LoaderCircle class="spin" :size="14" />
        <span>{{ progress || 'Loading image…' }}</span>
      </div>

      <div v-if="error" class="error-banner" style="margin-top: 16px;" @click.stop>
        <CircleAlert :size="18" />
        <span>{{ error }}</span>
        <button type="button" class="close-err-btn" @click="error = ''">
          <X :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

