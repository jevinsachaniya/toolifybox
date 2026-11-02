<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  Clock,
  Code2,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileCode2,
  FileImage,
  FileText,
  FileUp,
  Filter,
  Image as ImageIcon,
  Layers,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Palette,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  UploadCloud,
  X,
  Zap,
} from '@lucide/vue';
import CustomSelect from '~/components/CustomSelect.vue';
import { formatSize } from '~/utils/document.js';
import {
  convertHtmlToImage,
  htmlToImageFilename,
  HTML_IMAGE_BG_OPTIONS,
  HTML_IMAGE_FORMATS,
  HTML_IMAGE_SCALES,
  HTML_IMAGE_TEMPLATES,
  HTML_IMAGE_VIEWPORTS,
  validateHtmlInput,
} from '~/utils/html-to-image.js';

// Input Mode: 'file' | 'text'
const inputMode = ref('file');

// Text Mode State
const activeTab = ref('html'); // 'html' | 'css'
const rawHtmlText = ref(HTML_IMAGE_TEMPLATES[0].html);
const rawCssText = ref(HTML_IMAGE_TEMPLATES[0].css);
const selectedTemplateId = ref('social-card');
const showLivePreview = ref(false);

const htmlLineNumbersRef = ref(null);
const cssLineNumbersRef = ref(null);

const htmlLineCount = computed(() => {
  if (!rawHtmlText.value) return 1;
  return rawHtmlText.value.split('\n').length;
});

const cssLineCount = computed(() => {
  if (!rawCssText.value) return 1;
  return rawCssText.value.split('\n').length;
});

// File Mode State
const uploadedFile = ref(null);
const uploadedFileName = ref('');
const uploadedFileSize = ref(0);
const fileHtmlContent = ref('');
const isDragging = ref(false);
const fileInputRef = ref(null);
let dragDepth = 0;

// Conversion Settings
const selectedFormat = ref('png');
const selectedScale = ref('2');
const selectedViewport = ref('auto');
const selectedBg = ref('transparent');
const customBgColor = ref('#ffffff');
const imageQuality = ref(95);
const outputFilename = ref('rendered-image.png');

// Output & Preview State
const busy = ref(false);
const progressMessage = ref('');
const result = ref(null);
const error = ref('');
const toastMessage = ref('');
let toastTimer = null;
const copiedImage = ref(false);
const isZoomed = ref(false);

let abortController = null;

// Select Options
const formatOptions = HTML_IMAGE_FORMATS.map(f => ({
  value: f.id,
  label: f.label,
}));

const scaleOptions = HTML_IMAGE_SCALES.map(s => ({
  value: s.id,
  label: s.label,
}));

const viewportOptions = HTML_IMAGE_VIEWPORTS.map(v => ({
  value: v.id,
  label: v.label,
}));

const bgOptions = HTML_IMAGE_BG_OPTIONS.map(b => ({
  value: b.id,
  label: b.label,
}));

function showToast(msg) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3200);
}

function syncHtmlScroll(e) {
  if (htmlLineNumbersRef.value && e?.target) {
    htmlLineNumbersRef.value.scrollTop = e.target.scrollTop;
  }
}

function syncCssScroll(e) {
  if (cssLineNumbersRef.value && e?.target) {
    cssLineNumbersRef.value.scrollTop = e.target.scrollTop;
  }
}

function loadTemplate(tplId) {
  const tpl = HTML_IMAGE_TEMPLATES.find(t => t.id === tplId);
  if (!tpl) return;
  selectedTemplateId.value = tpl.id;
  rawHtmlText.value = tpl.html;
  rawCssText.value = tpl.css;
  if (tpl.format) selectedFormat.value = tpl.format;
  if (tpl.viewport) selectedViewport.value = tpl.viewport;
  outputFilename.value = htmlToImageFilename(tpl.name || 'rendered-image', selectedFormat.value);
  error.value = '';
  showToast(`Loaded "${tpl.name}" template`);
}

function clearCode() {
  rawHtmlText.value = '';
  rawCssText.value = '';
  result.value = null;
  error.value = '';
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (!text || !text.trim()) {
      showToast('Clipboard is empty or contains no text');
      return;
    }
    if (activeTab.value === 'css') {
      rawCssText.value = text;
      showToast('Pasted CSS from clipboard');
    } else {
      rawHtmlText.value = text;
      showToast('Pasted HTML from clipboard');
    }
    result.value = null;
    error.value = '';
  } catch (err) {
    showToast('Could not read clipboard. Please paste manually (Ctrl+V / Cmd+V).');
  }
}

function handleFileSelect(e) {
  const files = e?.target?.files || e?.dataTransfer?.files;
  if (!files || files.length === 0) return;
  const file = files[0];
  processSelectedFile(file);
}

async function processSelectedFile(file) {
  if (!file) return;
  uploadedFile.value = file;
  uploadedFileName.value = file.name;
  uploadedFileSize.value = file.size;

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  outputFilename.value = htmlToImageFilename(baseName, selectedFormat.value);

  try {
    const content = await file.text();
    fileHtmlContent.value = content;
    result.value = null;
    error.value = '';
    showToast(`Loaded ${file.name}`);
  } catch {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result || '';
      fileHtmlContent.value = content;
      result.value = null;
      error.value = '';
      showToast(`Loaded ${file.name}`);
    };
    reader.onerror = () => {
      error.value = 'Failed to read HTML file.';
    };
    reader.readAsText(file);
  }
}

function switchToTextModeWithFile() {
  if (fileHtmlContent.value) {
    rawHtmlText.value = fileHtmlContent.value;
    rawCssText.value = '';
  }
  inputMode.value = 'text';
}

function triggerFilePicker() {
  fileInputRef.value?.click();
}

function clearFile() {
  uploadedFile.value = null;
  uploadedFileName.value = '';
  uploadedFileSize.value = 0;
  fileHtmlContent.value = '';
  result.value = null;
  error.value = '';
  if (fileInputRef.value) fileInputRef.value.value = '';
}

// Drag & Drop handlers
function onDragEnter(e) {
  e.preventDefault();
  dragDepth++;
  isDragging.value = true;
}

function onDragOver(e) {
  e.preventDefault();
}

function onDragLeave(e) {
  e.preventDefault();
  dragDepth--;
  if (dragDepth <= 0) {
    dragDepth = 0;
    isDragging.value = false;
  }
}

function onFileDrop(e) {
  e.preventDefault();
  dragDepth = 0;
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    processSelectedFile(files[0]);
  }
}

// Watch format to update filename extension
watch(selectedFormat, (newFmt) => {
  const base = outputFilename.value.replace(/\.[^/.]+$/, '');
  outputFilename.value = `${base}.${newFmt === 'jpeg' ? 'jpg' : newFmt}`;
  // Adjust background if switching to JPG and currently transparent
  if (newFmt === 'jpg' && selectedBg.value === 'transparent') {
    selectedBg.value = 'white';
  }
});

// Run conversion
async function performConversion() {
  error.value = '';
  let htmlToProcess = inputMode.value === 'file' ? fileHtmlContent.value : rawHtmlText.value;
  let cssToProcess = inputMode.value === 'file' ? '' : rawCssText.value;

  // Auto-recovery: if active mode is empty, check alternative mode or uploaded file
  if (!htmlToProcess || !htmlToProcess.trim()) {
    if (fileHtmlContent.value && fileHtmlContent.value.trim()) {
      htmlToProcess = fileHtmlContent.value;
    } else if (rawHtmlText.value && rawHtmlText.value.trim()) {
      htmlToProcess = rawHtmlText.value;
      cssToProcess = rawCssText.value || '';
    } else if (uploadedFile.value) {
      try {
        htmlToProcess = await uploadedFile.value.text();
        fileHtmlContent.value = htmlToProcess;
      } catch (err) {
        console.error('Failed reading file text:', err);
      }
    }
  }

  const validation = validateHtmlInput(htmlToProcess);
  if (!validation.valid) {
    error.value = validation.error;
    return;
  }

  busy.value = true;
  progressMessage.value = 'Preparing render engine...';
  abortController = new AbortController();

  try {
    const scale = parseInt(selectedScale.value, 10) || 2;
    const vpOption = HTML_IMAGE_VIEWPORTS.find(v => v.id === selectedViewport.value);
    const viewportWidth = vpOption?.width || 0;

    let bg = null;
    if (selectedBg.value === 'white') bg = '#ffffff';
    else if (selectedBg.value === 'dark') bg = '#0f172a';
    else if (selectedBg.value === 'custom') bg = customBgColor.value;
    else bg = 'transparent';

    const qualityVal = selectedFormat.value === 'png' ? undefined : (imageQuality.value / 100);

    const converted = await convertHtmlToImage(htmlToProcess, cssToProcess, {
      format: selectedFormat.value,
      scale,
      viewportWidth,
      backgroundColor: bg,
      quality: qualityVal,
      filename: outputFilename.value,
      signal: abortController.signal,
      onProgress: (msg) => {
        progressMessage.value = msg;
      },
    });

    result.value = converted;
    outputFilename.value = converted.filename;
    showToast(`Rendered ${converted.width} × ${converted.height}px ${converted.format.toUpperCase()} image successfully!`);
  } catch (err) {
    if (err.name === 'AbortError') {
      showToast('Conversion cancelled');
    } else {
      console.error('HTML to Image error:', err);
      error.value = err.message || 'An unexpected error occurred while converting HTML to image.';
    }
  } finally {
    busy.value = false;
    abortController = null;
    progressMessage.value = '';
  }
}

function cancelConversion() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  busy.value = false;
}

function downloadImage() {
  if (!result.value?.blob) return;
  const link = document.createElement('a');
  link.href = result.value.dataUrl || URL.createObjectURL(result.value.blob);
  link.download = outputFilename.value || result.value.filename || 'rendered-image.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Download started!');
}

async function copyImageToClipboard() {
  if (!result.value?.blob) return;
  try {
    // PNG is widely supported by browser clipboard API
    let blobToCopy = result.value.blob;
    if (result.value.format !== 'png') {
      // If not PNG, convert to PNG for clipboard
      const img = new Image();
      img.src = result.value.dataUrl;
      await new Promise(r => { img.onload = r; });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      blobToCopy = await new Promise(res => c.toBlob(res, 'image/png'));
    }

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blobToCopy }),
    ]);
    copiedImage.value = true;
    showToast('Image copied to clipboard!');
    setTimeout(() => {
      copiedImage.value = false;
    }, 2500);
  } catch (err) {
    console.error('Copy to clipboard failed:', err);
    showToast('Could not copy image to clipboard in this browser.');
  }
}

function resetAll() {
  result.value = null;
  error.value = '';
  if (inputMode.value === 'file') {
    clearFile();
  }
}

onBeforeUnmount(() => {
  if (abortController) {
    abortController.abort();
  }
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<template>
  <div class="h2i-converter-root">
    <!-- Toast Notification -->
    <transition name="toast-fade">
      <div v-if="toastMessage" class="h2i-toast" role="alert">
        <Sparkles class="toast-icon" />
        <span>{{ toastMessage }}</span>
      </div>
    </transition>

    <!-- Header Mode Switcher -->
    <div class="h2i-mode-nav-wrap">
      <div class="h2i-mode-nav" role="tablist" aria-label="Input Mode Switcher">
        <button
          type="button"
          role="tab"
          :aria-selected="inputMode === 'file'"
          class="h2i-mode-tab"
          :class="{ 'is-active': inputMode === 'file' }"
          @click="inputMode = 'file'"
        >
          <FileUp class="tab-icon" />
          <span>Upload File</span>
          <span class="mode-badge">HTML / HTM</span>
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="inputMode === 'text'"
          class="h2i-mode-tab"
          :class="{ 'is-active': inputMode === 'text' }"
          @click="inputMode = 'text'"
        >
          <Code2 class="tab-icon" />
          <span>Enter Code</span>
          <span class="mode-badge">Editor & Templates</span>
        </button>
      </div>
    </div>

    <!-- MAIN CONVERTER CARD -->
    <div class="h2i-card">
      <!-- ================= 1) UPLOAD FILE MODE ================= -->
      <div v-if="inputMode === 'file'" class="h2i-section file-mode-section">
        <!-- Dropzone when no file selected -->
        <div
          v-if="!uploadedFile"
          class="h2i-dropzone"
          :class="{ 'is-dragging': isDragging }"
          @dragenter="onDragEnter"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onFileDrop"
          @click="triggerFilePicker"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept=".html,.htm,.xhtml,.txt,text/html"
            class="h2i-hidden-input"
            @change="handleFileSelect"
          />
          <div class="h2i-dropzone-inner">
            <div class="h2i-icon-orbit">
              <div class="orbit-circle outer"></div>
              <div class="orbit-circle inner"></div>
              <div class="orbit-icon-core">
                <FileCode2 class="core-icon" />
              </div>
            </div>
            <h3 class="h2i-dropzone-title">Drop your HTML file here</h3>
            <p class="h2i-dropzone-sub">
              Drag &amp; drop an <strong>.html</strong> or <strong>.htm</strong> file, or browse from your computer
            </p>
            <div class="h2i-dropzone-actions">
              <button type="button" class="h2i-primary-upload-btn" @click.stop="triggerFilePicker">
                <UploadCloud class="btn-icon" />
                <span>Select HTML File</span>
              </button>
            </div>
            <div class="h2i-dropzone-hints">
              <span class="hint-item"><ShieldCheck class="hint-icon" /> 100% In-Browser Privacy</span>
              <span class="hint-dot">&bull;</span>
              <span class="hint-item"><Zap class="hint-icon" /> Instant Zero-Lag Rendering</span>
              <span class="hint-dot">&bull;</span>
              <span class="hint-item"><FileImage class="hint-icon" /> Crisp 2x/3x Retina Export</span>
            </div>
          </div>
        </div>

        <!-- File Summary Card when file is loaded -->
        <div v-else class="h2i-file-summary-card">
          <div class="file-summary-left">
            <div class="file-icon-badge">
              <FileCode2 class="file-icon" />
            </div>
            <div class="file-meta">
              <div class="file-name" :title="uploadedFileName">{{ uploadedFileName }}</div>
              <div class="file-details">
                <span class="detail-pill">{{ formatSize(uploadedFileSize) }}</span>
                <span class="detail-dot">&bull;</span>
                <span class="detail-tag">HTML Document</span>
                <span class="detail-dot">&bull;</span>
                <span class="detail-status"><Check class="status-icon" /> Loaded in memory</span>
              </div>
            </div>
          </div>
          <div class="file-summary-actions">
            <button
              type="button"
              class="h2i-btn-outline"
              title="Open and edit this HTML in the source code editor"
              @click="switchToTextModeWithFile"
            >
              <Eye class="btn-icon" />
              <span>Edit in Code Mode</span>
            </button>
            <button
              type="button"
              class="h2i-btn-danger-outline"
              title="Remove this file and pick another"
              @click="clearFile"
            >
              <Trash2 class="btn-icon" />
              <span>Change File</span>
            </button>
          </div>
        </div>

        <!-- Sample Shortcut Pills -->
        <div class="h2i-sample-shortcuts">
          <span class="sample-label">Or try a sample template:</span>
          <div class="h2i-template-pills">
            <button
              v-for="tpl in HTML_IMAGE_TEMPLATES"
              :key="tpl.id"
              type="button"
              class="h2i-sample-pill"
              @click="loadTemplate(tpl.id); inputMode = 'text'"
            >
              <Sparkles class="pill-spark" />
              <span>{{ tpl.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================= 2) ENTER CODE MODE ================= -->
      <div v-else class="h2i-section text-mode-section">
        <!-- Editor Header & Toolbar -->
        <div class="h2i-editor-toolbar">
          <div class="editor-tabs">
            <button
              type="button"
              class="editor-tab-btn"
              :class="{ 'is-active': activeTab === 'html' }"
              @click="activeTab = 'html'"
            >
              <Code2 class="tab-sub-icon" />
              <span>HTML Source</span>
              <span class="badge-sub">{{ htmlLineCount }} lines</span>
            </button>
            <button
              type="button"
              class="editor-tab-btn"
              :class="{ 'is-active': activeTab === 'css' }"
              @click="activeTab = 'css'"
            >
              <Palette class="tab-sub-icon" />
              <span>Custom CSS</span>
              <span class="badge-sub">{{ rawCssText ? cssLineCount + ' lines' : 'Optional' }}</span>
            </button>
          </div>

          <div class="editor-actions">
            <div class="template-selector">
              <label for="h2i-tpl-select" class="sr-only">Templates</label>
              <select
                id="h2i-tpl-select"
                v-model="selectedTemplateId"
                class="h2i-select-compact"
                @change="loadTemplate(selectedTemplateId)"
              >
                <option v-for="t in HTML_IMAGE_TEMPLATES" :key="t.id" :value="t.id">
                  Template: {{ t.name }}
                </option>
              </select>
            </div>
            <button
              type="button"
              class="h2i-icon-btn"
              title="Paste text from clipboard"
              @click="pasteFromClipboard"
            >
              <Copy class="btn-icon" />
              <span class="btn-text">Paste</span>
            </button>
            <button
              type="button"
              class="h2i-icon-btn is-danger"
              title="Clear editor code"
              @click="clearCode"
            >
              <Trash2 class="btn-icon" />
              <span class="btn-text">Clear</span>
            </button>
          </div>
        </div>

        <!-- HTML Code Editor -->
        <div v-show="activeTab === 'html'" class="h2i-editor-wrap">
          <div class="h2i-editor-body">
            <div ref="htmlLineNumbersRef" class="editor-line-numbers" aria-hidden="true">
              <span v-for="n in Math.max(htmlLineCount, 12)" :key="n">{{ n }}</span>
            </div>
            <textarea
              v-model="rawHtmlText"
              class="editor-textarea"
              placeholder="Paste or write your HTML markup here... (e.g. <div class='card'>Hello World</div>)"
              spellcheck="false"
              wrap="off"
              @scroll="syncHtmlScroll"
            ></textarea>
          </div>
        </div>

        <!-- CSS Code Editor -->
        <div v-show="activeTab === 'css'" class="h2i-editor-wrap">
          <div class="h2i-editor-body">
            <div ref="cssLineNumbersRef" class="editor-line-numbers" aria-hidden="true">
              <span v-for="n in Math.max(cssLineCount, 12)" :key="n">{{ n }}</span>
            </div>
            <textarea
              v-model="rawCssText"
              class="editor-textarea"
              placeholder="/* Optional CSS styling for your HTML element */&#10;.card { padding: 30px; background: #6366f1; color: white; border-radius: 16px; }"
              spellcheck="false"
              wrap="off"
              @scroll="syncCssScroll"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- ================= SETTINGS PANEL ================= -->
      <div class="h2i-settings-panel">
        <div class="h2i-settings-header">
          <div class="settings-title-wrap">
            <Sliders class="settings-title-icon" />
            <span class="settings-title">Render &amp; Export Options</span>
          </div>
        </div>

        <div class="h2i-settings-grid">
          <!-- 1. Format -->
          <div class="h2i-setting-field">
            <label class="setting-label">Output Format</label>
            <CustomSelect
              v-model="selectedFormat"
              :options="formatOptions"
              placeholder="Select format"
            />
            <span class="setting-hint">
              {{ selectedFormat === 'png' ? 'PNG: Lossless clarity & transparent alpha' : selectedFormat === 'webp' ? 'WebP: Modern, ultra-compressed web image' : 'JPG: Standard high-speed photo compression' }}
            </span>
          </div>

          <!-- 2. Scale / Resolution -->
          <div class="h2i-setting-field">
            <label class="setting-label">Resolution Scale</label>
            <CustomSelect
              v-model="selectedScale"
              :options="scaleOptions"
              placeholder="Select scale"
            />
            <span class="setting-hint">
              {{ selectedScale === '2' ? '2x Retina: Ultra-sharp display for screens & social' : selectedScale === '3' ? '3x Print: Maximum 300 DPI high-definition' : '1x Standard: Exact 1:1 screen pixel ratio' }}
            </span>
          </div>

          <!-- 3. Viewport Width -->
          <div class="h2i-setting-field">
            <label class="setting-label">Viewport Canvas Width</label>
            <CustomSelect
              v-model="selectedViewport"
              :options="viewportOptions"
              placeholder="Select width"
            />
            <span class="setting-hint">Target simulation container width</span>
          </div>

          <!-- 4. Background Color -->
          <div class="h2i-setting-field">
            <label class="setting-label">Background Color</label>
            <div class="bg-picker-row">
              <CustomSelect
                v-model="selectedBg"
                :options="bgOptions"
                placeholder="Background"
              />
              <div v-if="selectedBg === 'custom'" class="color-swatch-wrap">
                <input
                  v-model="customBgColor"
                  type="color"
                  class="color-input-swatch"
                  title="Pick custom hex color"
                />
                <input
                  v-model="customBgColor"
                  type="text"
                  class="color-hex-text"
                  placeholder="#ffffff"
                  maxlength="7"
                />
              </div>
            </div>
            <span class="setting-hint">
              {{ selectedFormat === 'jpg' ? 'JPG does not support transparency (defaults to white)' : 'Transparent allows overlaying over any background' }}
            </span>
          </div>
        </div>

        <!-- Quality slider for JPG / WebP -->
        <div v-if="selectedFormat !== 'png'" class="quality-slider-row">
          <div class="quality-label-wrap">
            <span class="setting-label">Compression Quality: <strong>{{ imageQuality }}%</strong></span>
            <span class="quality-tag">{{ imageQuality >= 90 ? 'High Quality' : imageQuality >= 75 ? 'Balanced' : 'Small Size' }}</span>
          </div>
          <input
            v-model.number="imageQuality"
            type="range"
            min="40"
            max="100"
            step="1"
            class="h2i-slider"
          />
        </div>
      </div>

      <!-- ================= CONVERSION TRIGGER BAR ================= -->
      <div class="h2i-action-bar">
        <div class="action-bar-left">
          <div class="privacy-note">
            <ShieldCheck class="privacy-icon" />
            <span>Zero Server Uploads &bull; Processed 100% locally in browser</span>
          </div>
        </div>

        <div class="action-bar-right">
          <button
            v-if="busy"
            type="button"
            class="h2i-btn-cancel"
            @click="cancelConversion"
          >
            <RotateCcw class="btn-icon" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            class="h2i-btn-primary-convert"
            :disabled="busy"
            @click="performConversion"
          >
            <LoaderCircle v-if="busy" class="btn-icon spinner" />
            <Sparkles v-else class="btn-icon" />
            <span>
              {{ busy ? (progressMessage || 'Rendering Image...') : `Convert to ${selectedFormat.toUpperCase()} Image` }}
            </span>
          </button>
        </div>
      </div>

      <!-- ================= ERROR BANNER ================= -->
      <div v-if="error" class="h2i-error-banner" role="alert">
        <CircleAlert class="error-icon" />
        <div class="error-content">
          <div class="error-title">Rendering Notice</div>
          <div class="error-msg">{{ error }}</div>
        </div>
        <button type="button" class="error-close" @click="error = ''">
          <X class="close-icon" />
        </button>
      </div>

      <!-- ================= OUTPUT & PREVIEW SECTION ================= -->
      <div v-if="result" class="h2i-output-card">
        <!-- Output Header with stats -->
        <div class="h2i-output-header">
          <div class="output-title-group">
            <div class="output-icon-badge">
              <Check class="badge-icon" />
            </div>
            <div>
              <h3 class="output-title">Rendered Image Ready</h3>
              <p class="output-subtitle">High-fidelity pixel-perfect capture</p>
            </div>
          </div>

          <div class="h2i-stats-wrap">
            <span class="stat-pill">
              <strong>Dimensions:</strong> {{ result.width }} &times; {{ result.height }} px
            </span>
            <span class="stat-pill">
              <strong>Format:</strong> {{ result.format.toUpperCase() }}
            </span>
            <span class="stat-pill">
              <strong>File Size:</strong> {{ formatSize(result.size) }}
            </span>
            <span class="stat-pill is-accent">
              <strong>Scale:</strong> {{ selectedScale }}x Retina
            </span>
          </div>
        </div>

        <!-- Rendered Image Canvas Preview Container -->
        <div class="h2i-preview-container" :class="{ 'is-transparent-bg': selectedBg === 'transparent' && selectedFormat !== 'jpg' }">
          <div class="preview-toolbar">
            <span class="preview-mode-tag">
              <Eye class="tag-icon" /> Live Render Preview
            </span>
            <button
              type="button"
              class="preview-zoom-btn"
              :title="isZoomed ? 'Fit to screen' : 'Zoom 100% actual pixels'"
              @click="isZoomed = !isZoomed"
            >
              <Minimize2 v-if="isZoomed" class="zoom-icon" />
              <Maximize2 v-else class="zoom-icon" />
              <span>{{ isZoomed ? 'Fit Screen' : 'Full Zoom' }}</span>
            </button>
          </div>

          <div class="preview-viewport" :class="{ 'is-zoomed': isZoomed }">
            <img
              :src="result.dataUrl"
              :alt="outputFilename"
              class="preview-image"
              :class="{ 'is-actual-size': isZoomed }"
            />
          </div>
        </div>

        <!-- Download & Copy Action Strip -->
        <div class="h2i-download-strip">
          <div class="filename-input-group">
            <label for="h2i-out-filename" class="filename-label">Output Filename:</label>
            <input
              id="h2i-out-filename"
              v-model="outputFilename"
              type="text"
              class="h2i-filename-input"
              placeholder="rendered-image.png"
            />
          </div>

          <div class="download-actions">
            <button
              type="button"
              class="h2i-btn-clipboard"
              :class="{ 'is-copied': copiedImage }"
              title="Copy image to system clipboard"
              @click="copyImageToClipboard"
            >
              <Check v-if="copiedImage" class="btn-icon" />
              <Copy v-else class="btn-icon" />
              <span>{{ copiedImage ? 'Copied to Clipboard!' : 'Copy to Clipboard' }}</span>
            </button>

            <button
              type="button"
              class="h2i-download-btn"
              @click="downloadImage"
            >
              <Download class="btn-icon" />
              <span>Download {{ selectedFormat.toUpperCase() }} ({{ formatSize(result.size) }})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.h2i-converter-root {
  width: 100%;
  max-width: 1060px;
  margin: 0 auto;
  position: relative;
}

/* Toast */
.h2i-toast {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #0f172a;
  color: #f8fafc;
  padding: 12px 20px;
  border-radius: 999px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  font-size: 13.5px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.toast-icon {
  width: 18px;
  height: 18px;
  color: #38bdf8;
  animation: pulse 2s infinite ease-in-out;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

/* Mode Switcher */
.h2i-mode-nav-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.h2i-mode-nav {
  display: inline-flex;
  padding: 5px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
}

.h2i-mode-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.h2i-mode-tab:hover {
  color: #0f172a;
}

.h2i-mode-tab.is-active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
}

.tab-icon {
  width: 17px;
  height: 17px;
  color: #e11d48;
}

.mode-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
}

.h2i-mode-tab.is-active .mode-badge {
  background: #fff1f2;
  color: #e11d48;
}

/* Main Card */
.h2i-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  box-shadow: 0 12px 35px -8px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(0, 0, 0, 0.02);
  overflow: visible;
}

.h2i-section {
  padding: 28px;
}

/* Dropzone */
.h2i-dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 20px;
  padding: 44px 24px;
  background: #f8fafc;
  cursor: pointer;
  text-align: center;
  transition: all 0.22s ease-in-out;
}

.h2i-dropzone:hover,
.h2i-dropzone.is-dragging {
  border-color: #e11d48;
  background: #fff1f2;
  transform: translateY(-1px);
}

.h2i-hidden-input {
  display: none;
}

.h2i-icon-orbit {
  position: relative;
  width: 72px;
  height: 72px;
  margin: 0 auto 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orbit-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(225, 29, 72, 0.25);
}

.orbit-circle.outer {
  width: 72px;
  height: 72px;
  animation: spinSlow 14s linear infinite;
}

.orbit-circle.inner {
  width: 52px;
  height: 52px;
  border-style: dashed;
  animation: spinRev 10s linear infinite;
}

@keyframes spinSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes spinRev {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

.orbit-icon-core {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #e11d48, #f43f5e);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(225, 29, 72, 0.35);
}

.core-icon {
  width: 22px;
  height: 22px;
}

.h2i-dropzone-title {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px;
}

.h2i-dropzone-sub {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 20px;
}

.h2i-primary-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #e11d48, #be123c);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(225, 29, 72, 0.3);
  transition: all 0.2s ease;
}

.h2i-primary-upload-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(225, 29, 72, 0.4);
}

.h2i-dropzone-hints {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 22px;
  font-size: 12px;
  color: #64748b;
}

.hint-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.hint-icon {
  width: 14px;
  height: 14px;
  color: #10b981;
}

.hint-dot {
  color: #cbd5e1;
}

/* File Summary Card */
.h2i-file-summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  gap: 16px;
}

.file-summary-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.file-icon-badge {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: #ecfdf5;
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid #a7f3d0;
}

.file-icon {
  width: 24px;
  height: 24px;
}

.file-meta {
  min-width: 0;
}

.file-name {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
  flex-wrap: wrap;
}

.detail-pill {
  font-weight: 700;
  color: #334155;
}

.detail-dot {
  color: #cbd5e1;
}

.detail-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #059669;
  font-weight: 600;
}

.status-icon {
  width: 13px;
  height: 13px;
}

.file-summary-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.h2i-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 12.5px;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.h2i-btn-outline:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

.h2i-btn-danger-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #ffffff;
  border: 1px solid #fecdd3;
  color: #e11d48;
  font-size: 12.5px;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.h2i-btn-danger-outline:hover {
  background: #fff1f2;
  border-color: #fda4af;
}

/* Sample shortcuts */
.h2i-sample-shortcuts {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.sample-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #64748b;
}

.h2i-template-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.h2i-sample-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.h2i-sample-pill:hover {
  background: #fff1f2;
  border-color: #fda4af;
  color: #e11d48;
  transform: translateY(-1px);
}

.pill-spark {
  width: 12px;
  height: 12px;
  color: #e11d48;
}

/* Code Editor */
.h2i-editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: #0f172a;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  gap: 12px;
}

.editor-tabs {
  display: flex;
  gap: 6px;
}

.editor-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.editor-tab-btn:hover {
  color: #ffffff;
}

.editor-tab-btn.is-active {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.tab-sub-icon {
  width: 14px;
  height: 14px;
}

.badge-sub {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #cbd5e1;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.template-selector select {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #f8fafc;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  outline: none;
}

.template-selector select option {
  background: #0f172a;
  color: #f8fafc;
}

.h2i-icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.h2i-icon-btn:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.h2i-icon-btn.is-danger:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: #ef4444;
  color: #fca5a5;
}

.h2i-editor-wrap {
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  overflow: hidden;
  border: 1px solid #0f172a;
  border-top: none;
}

.h2i-editor-body {
  display: flex;
  height: 280px;
  background: #090d16;
}

.editor-line-numbers {
  padding: 14px 10px;
  background: #0b1120;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  color: #475569;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 12px;
  line-height: 20px;
  text-align: right;
  user-select: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 38px;
}

.editor-textarea {
  flex: 1;
  padding: 14px 16px;
  background: transparent;
  color: #f8fafc;
  border: none;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 12.5px;
  line-height: 20px;
  outline: none;
  resize: none;
  white-space: pre;
  tab-size: 2;
  overflow: auto;
}

/* Settings Panel */
.h2i-settings-panel {
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 24px 28px;
  overflow: visible;
}

.h2i-settings-header {
  margin-bottom: 16px;
}

.settings-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
}

.settings-title-icon {
  width: 17px;
  height: 17px;
  color: #e11d48;
}

.settings-title {
  font-size: 14.5px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.h2i-settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  overflow: visible;
}

.h2i-setting-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  overflow: visible;
  position: relative;
}

.setting-label {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.setting-hint {
  font-size: 11px;
  color: #64748b;
  line-height: 1.35;
}

.bg-picker-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-swatch-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 3px 6px;
}

.color-input-swatch {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
}

.color-hex-text {
  width: 65px;
  border: none;
  font-size: 12px;
  font-family: monospace;
  color: #0f172a;
  outline: none;
}

.quality-slider-row {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #cbd5e1;
}

.quality-label-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.quality-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0284c7;
}

.h2i-slider {
  width: 100%;
  accent-color: #e11d48;
  cursor: pointer;
}

/* Action Bar */
.h2i-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  gap: 16px;
}

.privacy-note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: #059669;
  font-weight: 600;
}

.privacy-icon {
  width: 15px;
  height: 15px;
}

.action-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.h2i-btn-cancel {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 18px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.h2i-btn-cancel:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.h2i-btn-primary-convert {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 26px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #e11d48, #be123c);
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(225, 29, 72, 0.35);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.h2i-btn-primary-convert:hover:not(:disabled) {
  transform: translateY(-1.5px);
  box-shadow: 0 8px 24px rgba(225, 29, 72, 0.45);
}

.h2i-btn-primary-convert:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.spinner {
  animation: spinSlow 1s linear infinite;
}

/* Error Banner */
.h2i-error-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 0 28px 24px;
  padding: 14px 18px;
  border-radius: 14px;
  background: #fef2f2;
  border: 1px solid #fecdd3;
  color: #991b1b;
}

.error-icon {
  width: 20px;
  height: 20px;
  color: #dc2626;
  flex-shrink: 0;
  margin-top: 1px;
}

.error-content {
  flex: 1;
}

.error-title {
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 2px;
}

.error-msg {
  font-size: 12.5px;
  line-height: 1.4;
  color: #b91c1c;
}

.error-close {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #991b1b;
  padding: 2px;
}

/* Output Card */
.h2i-output-card {
  margin: 0;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
}

.h2i-output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  border-bottom: 1px solid #f1f5f9;
  gap: 16px;
  flex-wrap: wrap;
}

.output-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.output-icon-badge {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #ecfdf5;
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
}

.output-title {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.output-subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.h2i-stats-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-pill {
  font-size: 12px;
  padding: 5px 11px;
  background: #f1f5f9;
  color: #334155;
  border-radius: 8px;
  font-weight: 500;
}

.stat-pill strong {
  font-weight: 700;
  color: #0f172a;
}

.stat-pill.is-accent {
  background: #fff1f2;
  color: #be123c;
}

/* Preview Area */
.h2i-preview-container {
  padding: 20px 28px;
  background: #0f172a;
  position: relative;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.preview-mode-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tag-icon {
  width: 13px;
  height: 13px;
}

.preview-zoom-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 6px;
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preview-zoom-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.zoom-icon {
  width: 12px;
  height: 12px;
}

.preview-viewport {
  max-height: 480px;
  overflow: auto;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.preview-viewport.is-zoomed {
  align-items: flex-start;
  justify-content: flex-start;
}

.h2i-preview-container.is-transparent-bg .preview-viewport {
  background-image: linear-gradient(45deg, #1e293b 25%, transparent 25%),
                    linear-gradient(-45deg, #1e293b 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #1e293b 75%),
                    linear-gradient(-45deg, transparent 75%, #1e293b 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.preview-image {
  max-width: 100%;
  max-height: 440px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
  transition: max-width 0.2s ease, max-height 0.2s ease;
}

.preview-image.is-actual-size {
  max-width: none;
  max-height: none;
}

/* Download Strip */
.h2i-download-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  background: #ffffff;
  border-top: 1px solid #f1f5f9;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.filename-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 240px;
}

.filename-label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  white-space: nowrap;
}

.h2i-filename-input {
  flex: 1;
  min-width: 140px;
  padding: 9px 14px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 13.5px;
  color: #0f172a;
  outline: none;
  transition: all 0.15s ease;
  height: 40px;
  box-sizing: border-box;
}

.h2i-filename-input:focus {
  border-color: #e11d48;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.12);
}

.download-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.h2i-btn-clipboard {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  height: 42px;
  box-sizing: border-box;
}

.h2i-btn-clipboard:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.h2i-btn-clipboard.is-copied {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #059669;
}

.h2i-download-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #e11d48, #be123c);
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(225, 29, 72, 0.3);
  transition: all 0.2s ease;
  height: 42px;
  box-sizing: border-box;
  white-space: nowrap;
}

.h2i-download-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(225, 29, 72, 0.4);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  /* Mode switcher on mobile */
  .h2i-mode-nav-wrap {
    width: 100%;
    margin-bottom: 14px;
  }

  .h2i-mode-nav {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    padding: 4px;
    box-sizing: border-box;
    border-radius: 14px;
  }

  .h2i-mode-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 6px;
    font-size: 13px;
    font-weight: 700;
    gap: 6px;
    white-space: nowrap;
    border-radius: 10px;
  }

  .h2i-mode-tab .tab-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
  }

  .h2i-mode-tab .mode-badge {
    display: none; /* Hide secondary badge on mobile to keep label single-line and spacious */
  }

  /* Code editor toolbar on mobile */
  .h2i-editor-toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 10px 12px;
    gap: 10px;
  }

  .editor-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    gap: 6px;
    background: rgba(255, 255, 255, 0.06);
    padding: 3px;
    border-radius: 10px;
    box-sizing: border-box;
  }

  .editor-tab-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 7px 6px;
    font-size: 12px;
    gap: 5px;
    white-space: nowrap;
  }

  .editor-tab-btn .tab-sub-icon {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
  }

  .editor-tab-btn .badge-sub {
    font-size: 10.5px;
    padding: 1px 5px;
  }

  .editor-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
  }

  .template-selector {
    flex: 1;
    min-width: 0;
  }

  .template-selector select,
  .h2i-select-compact {
    width: 100%;
    box-sizing: border-box;
    font-size: 12px;
    padding: 7px 10px;
    text-overflow: ellipsis;
  }

  .h2i-icon-btn {
    padding: 7px 10px;
    font-size: 12px;
    flex-shrink: 0;
  }

  .h2i-editor-body {
    height: 220px;
  }

  /* Dropzone on mobile */
  .h2i-section {
    padding: 18px 16px;
  }

  .h2i-dropzone {
    padding: 30px 16px;
  }

  .h2i-dropzone-title {
    font-size: 17px;
  }

  .h2i-dropzone-sub {
    font-size: 12.5px;
    margin-bottom: 16px;
  }

  .h2i-primary-upload-btn {
    width: 100%;
    justify-content: center;
    padding: 11px 18px;
    font-size: 13.5px;
  }

  .h2i-dropzone-hints {
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px 8px;
    font-size: 11px;
    margin-top: 16px;
  }

  .h2i-sample-shortcuts {
    margin-top: 20px;
    width: 100%;
  }

  .h2i-template-pills {
    gap: 6px;
  }

  .h2i-sample-pill {
    padding: 4px 10px;
    font-size: 11px;
  }

  .h2i-file-summary-card {
    flex-direction: column;
    align-items: stretch;
    padding: 14px;
  }

  .file-summary-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .h2i-btn-outline,
  .h2i-btn-danger-outline {
    justify-content: center;
  }

  /* Settings panel on mobile */
  .h2i-settings-panel {
    padding: 18px 16px;
  }

  .h2i-settings-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  /* Action bar on mobile */
  .h2i-action-bar {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .action-bar-right {
    width: 100%;
    flex-direction: column;
  }

  .h2i-btn-cancel,
  .h2i-btn-primary-convert {
    width: 100%;
    justify-content: center;
  }

  /* Output view on mobile */
  .h2i-output-header {
    padding: 14px 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .h2i-stats-wrap {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .stat-pill {
    font-size: 11px;
    padding: 3px 8px;
  }

  .h2i-preview-container {
    padding: 14px 16px;
  }

  .preview-viewport {
    max-height: 320px;
    padding: 10px;
  }

  /* Download strip on mobile */
  .h2i-download-strip {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .filename-input-group {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    min-width: 0;
  }

  .h2i-filename-input {
    width: 100%;
    height: 38px;
    box-sizing: border-box;
  }

  .download-actions {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }

  .h2i-btn-clipboard,
  .h2i-download-btn {
    width: 100%;
    justify-content: center;
    height: 42px;
  }
}
</style>

