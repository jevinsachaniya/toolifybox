<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Clipboard,
  Code2,
  Copy,
  Download,
  Eye,
  FileArchive,
  FileCode2,
  FileImage,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Laptop,
  Maximize2,
  Moon,
  Palette,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Wand2,
  X,
  Zap,
} from '@lucide/vue';
import {
  BG_PRESETS,
  FAVICON_SIZES,
  generateFaviconPackage,
  generateHtmlSnippet,
  generateManifestSnippet,
  generateSampleFaviconLogo,
  SHAPE_OPTIONS,
} from '~/utils/image-to-favicon.js';
import { formatSize } from '~/utils/document.js';

// State
const file = ref(null);
const fileInput = ref(null);
const isDragging = ref(false);
const imageSrc = ref('');
const imageElement = ref(null);
const imageMeta = ref({ width: 0, height: 0, size: 0, name: '' });

// Customization Controls
const selectedShape = ref('rounded'); // 'square' | 'rounded' | 'circle'
const selectedBg = ref('transparent'); // 'transparent', '#ffffff', '#0f172a', '#000000', or custom
const customBgColor = ref('#6366f1');
const paddingPercent = ref(10); // 0% - 35%
const fitMode = ref('contain'); // 'contain' | 'cover'
const appName = ref('My Awesome Site');

// Preview State
const activePreviewTab = ref('browser'); // 'browser' | 'mobile' | 'google' | 'grid'
const browserTheme = ref('light'); // 'light' | 'dark'

// Generation Results
const isProcessing = ref(false);
const progressMessage = ref('');
const faviconPackage = ref(null);

// UI Feedback
const toastMessage = ref('');
let toastTimer = null;
const copiedType = ref('');
let copiedTimer = null;

const showToast = (msg) => {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3200);
};

const copyToClipboard = (text, type) => {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(text).then(() => {
    copiedType.value = type;
    showToast(`Copied ${type} to clipboard!`);
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copiedType.value = '';
    }, 2500);
  });
};

// Effective Background Color
const effectiveBg = computed(() => {
  if (selectedBg.value === 'custom') {
    return customBgColor.value;
  }
  return selectedBg.value;
});

// Process image whenever settings change
const recomputeFavicons = async () => {
  if (!imageElement.value) return;
  isProcessing.value = true;
  try {
    const pkg = await generateFaviconPackage(
      imageElement.value,
      {
        shape: selectedShape.value,
        backgroundColor: effectiveBg.value,
        padding: paddingPercent.value,
        fit: fitMode.value,
        appName: appName.value || 'My Website',
      },
      (msg) => {
        progressMessage.value = msg;
      }
    );
    faviconPackage.value = pkg;
  } catch (err) {
    console.error('Error rendering favicons:', err);
    showToast('Failed to generate favicons. Please try a different image.');
  } finally {
    isProcessing.value = false;
  }
};

// Watchers for reactive live updates
watch(
  [selectedShape, selectedBg, customBgColor, paddingPercent, fitMode, appName],
  () => {
    if (imageElement.value) {
      recomputeFavicons();
    }
  }
);

// File loading
const handleFile = (uploadedFile) => {
  if (!uploadedFile) return;
  if (!uploadedFile.type.startsWith('image/')) {
    showToast('Please upload an image file (PNG, JPG, SVG, WebP, etc.).');
    return;
  }

  file.value = uploadedFile;
  imageMeta.value = {
    name: uploadedFile.name,
    size: uploadedFile.size,
    width: 0,
    height: 0,
  };

  const reader = new FileReader();
  reader.onload = (e) => {
    const src = e.target.result;
    imageSrc.value = src;
    const img = new Image();
    img.onload = () => {
      imageMeta.value.width = img.naturalWidth || img.width;
      imageMeta.value.height = img.naturalHeight || img.height;
      imageElement.value = img;
      recomputeFavicons();
    };
    img.src = src;
  };
  reader.readAsDataURL(uploadedFile);
};

// Load Sample Logo
const loadSampleLogo = () => {
  const sampleUrl = generateSampleFaviconLogo();
  if (!sampleUrl) return;

  imageMeta.value = {
    name: 'sample-modern-logo.png',
    size: 24500,
    width: 512,
    height: 512,
  };
  imageSrc.value = sampleUrl;

  const img = new Image();
  img.onload = () => {
    imageElement.value = img;
    recomputeFavicons();
    showToast('Loaded sample 3D geometric logo!');
  };
  img.src = sampleUrl;
};

// Drag and drop handlers
const onDragOver = (e) => {
  e.preventDefault();
  isDragging.value = true;
};

const onDragLeave = () => {
  isDragging.value = false;
};

const onDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0]);
  }
};

const onFileInputChange = (e) => {
  if (e.target.files && e.target.files[0]) {
    handleFile(e.target.files[0]);
  }
};

// Paste from clipboard
const onPasteEvent = (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const blob = items[i].getAsFile();
      if (blob) {
        handleFile(blob);
        showToast('Image pasted from clipboard!');
        break;
      }
    }
  }
};

onMounted(() => {
  window.addEventListener('paste', onPasteEvent);
});

onBeforeUnmount(() => {
  window.removeEventListener('paste', onPasteEvent);
  if (toastTimer) clearTimeout(toastTimer);
  if (copiedTimer) clearTimeout(copiedTimer);
  if (faviconPackage.value) {
    if (faviconPackage.value.icoUrl) URL.revokeObjectURL(faviconPackage.value.icoUrl);
    if (faviconPackage.value.zipUrl) URL.revokeObjectURL(faviconPackage.value.zipUrl);
  }
});

// Reset
const resetTool = () => {
  file.value = null;
  imageSrc.value = '';
  imageElement.value = null;
  faviconPackage.value = null;
  if (fileInput.value) fileInput.value.value = '';
};

// Single download trigger
const downloadFile = (url, filename) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`Downloading ${filename}...`);
};

// Find high-res preview icon (e.g. 180, 256 or 512px)
const preview32 = computed(() => {
  if (!faviconPackage.value) return '';
  const item = faviconPackage.value.icons.find((i) => i.size === 32);
  return item ? item.dataUrl : '';
});

const preview180 = computed(() => {
  if (!faviconPackage.value) return '';
  const item = faviconPackage.value.icons.find((i) => i.size === 180);
  return item ? item.dataUrl : '';
});

const preview256 = computed(() => {
  if (!faviconPackage.value) return '';
  const item = faviconPackage.value.icons.find((i) => i.size === 256);
  return item ? item.dataUrl : '';
});

const preview512 = computed(() => {
  if (!faviconPackage.value) return '';
  const item = faviconPackage.value.icons.find((i) => i.size === 512);
  return item ? item.dataUrl : '';
});
</script>

<template>
  <div class="favicon-tool-wrapper">
    <!-- Hidden input for file picker -->
    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/bmp,image/gif"
      class="hidden-file-input"
      @change="onFileInputChange"
    />

    <!-- ================= 1. Upload Dropzone (When no image is loaded) ================= -->
    <div
      v-if="!imageElement"
      class="favicon-dropzone"
      :class="{ 'is-dragging': isDragging }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="fileInput && fileInput.click()"
    >
      <div class="dropzone-glow" />
      <div class="dropzone-content">
        <div class="dropzone-icon-ring">
          <Upload :size="32" class="upload-icon" />
        </div>
        <h3 class="dropzone-title">Upload your Logo, Icon, or Image</h3>
        <p class="dropzone-subtitle">
          Drag &amp; drop anywhere, paste from clipboard (<kbd>Ctrl+V</kbd>), or click to browse.
        </p>

        <div class="dropzone-badges">
          <span class="fmt-pill">PNG</span>
          <span class="fmt-pill">JPG</span>
          <span class="fmt-pill">SVG Vector</span>
          <span class="fmt-pill">WebP</span>
          <span class="fmt-pill">GIF</span>
        </div>

        <div class="dropzone-actions" @click.stop>
          <button
            type="button"
            class="btn-browse"
            @click="fileInput && fileInput.click()"
          >
            <Upload :size="16" />
            <span>Select Image File</span>
          </button>

          <span class="actions-divider">or</span>

          <button
            type="button"
            class="btn-sample"
            @click="loadSampleLogo"
          >
            <Sparkles :size="16" />
            <span>Try Sample 3D Logo</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ================= 2. Workspace View (When image is loaded) ================= -->
    <div v-else class="favicon-workspace">
      <!-- Workspace Top Bar -->
      <div class="workspace-top-bar">
        <div class="image-meta-info">
          <img :src="imageSrc" alt="Source logo" class="meta-thumb" />
          <div class="meta-texts">
            <span class="meta-name">{{ imageMeta.name || 'Custom Image' }}</span>
            <span class="meta-sub">
              {{ imageMeta.width }}×{{ imageMeta.height }} px • {{ formatSize(imageMeta.size) }} • 100% Client-Side
            </span>
          </div>
        </div>

        <div class="top-bar-actions">
          <button
            type="button"
            class="btn-top-action"
            @click="fileInput && fileInput.click()"
          >
            <RefreshCw :size="14" />
            <span>Change Image</span>
          </button>
          <button
            type="button"
            class="btn-top-action danger"
            @click="resetTool"
          >
            <Trash2 :size="14" />
            <span>Remove</span>
          </button>
        </div>
      </div>

      <!-- Main Layout: Controls Left, Live Previews Right -->
      <div class="workspace-grid">
        <!-- LEFT: Customization Controls Panel -->
        <aside class="controls-panel">
          <div class="panel-header">
            <Sliders :size="16" />
            <h4>Favicon Settings</h4>
          </div>

          <!-- Website / App Name Input -->
          <div class="control-group">
            <label class="control-label" for="app-name-input">
              <span>Website / App Name</span>
              <span class="label-hint">For manifest &amp; title</span>
            </label>
            <div class="text-input-wrap">
              <Globe :size="16" class="input-icon" />
              <input
                id="app-name-input"
                v-model="appName"
                type="text"
                placeholder="My Awesome Website"
                class="app-name-field"
                maxlength="50"
              />
            </div>
          </div>

          <!-- Shape Selector -->
          <div class="control-group">
            <label class="control-label">
              <span>Favicon Shape</span>
              <span class="label-hint">Icon silhouette</span>
            </label>
            <div class="shape-buttons-grid">
              <button
                v-for="opt in SHAPE_OPTIONS"
                :key="opt.id"
                type="button"
                class="shape-btn"
                :class="{ active: selectedShape === opt.id }"
                @click="selectedShape = opt.id"
              >
                <div class="shape-demo-icon" :class="opt.id" />
                <span class="shape-btn-text">{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <!-- Background Color Presets -->
          <div class="control-group">
            <div class="control-label-row">
              <label class="control-label">
                <span>Background Color</span>
              </label>
              <span class="badge-bg-val">{{ effectiveBg }}</span>
            </div>
            <div class="bg-swatches-grid">
              <button
                v-for="preset in BG_PRESETS"
                :key="preset.id"
                type="button"
                class="swatch-btn"
                :class="{ active: selectedBg === preset.id }"
                :title="preset.label"
                @click="selectedBg = preset.id"
              >
                <span
                  class="swatch-circle"
                  :class="preset.id"
                  :style="preset.id === 'custom' ? { backgroundColor: customBgColor } : (preset.value !== 'transparent' ? { backgroundColor: preset.value } : {})"
                />
                <span class="swatch-name">{{ preset.label }}</span>
              </button>
            </div>

            <!-- Custom Color Picker Row -->
            <div v-if="selectedBg === 'custom'" class="custom-color-row">
              <input
                v-model="customBgColor"
                type="color"
                class="color-picker-input"
              />
              <input
                v-model="customBgColor"
                type="text"
                class="color-hex-field"
                maxlength="7"
              />
            </div>
          </div>

          <!-- Padding / Safe Margin Slider -->
          <div class="control-group">
            <div class="control-label-row">
              <label class="control-label">
                <span>Safe Margin / Padding</span>
                <span class="label-hint">Keeps icon inside border</span>
              </label>
              <span class="slider-val-badge">{{ paddingPercent }}%</span>
            </div>
            <input
              v-model.number="paddingPercent"
              type="range"
              min="0"
              max="35"
              step="1"
              class="range-slider"
            />
            <div class="range-labels">
              <span>0% (Edge-to-edge)</span>
              <span>35% (Comfortable)</span>
            </div>
          </div>

          <!-- Fit Mode Toggle -->
          <div class="control-group">
            <label class="control-label">
              <span>Scaling Fit Mode</span>
            </label>
            <div class="fit-toggle-group">
              <button
                type="button"
                class="fit-btn"
                :class="{ active: fitMode === 'contain' }"
                @click="fitMode = 'contain'"
              >
                <strong>Contain</strong>
                <span>Preserve entire logo</span>
              </button>
              <button
                type="button"
                class="fit-btn"
                :class="{ active: fitMode === 'cover' }"
                @click="fitMode = 'cover'"
              >
                <strong>Cover</strong>
                <span>Crop center to fill</span>
              </button>
            </div>
          </div>
        </aside>

        <!-- RIGHT: Live Previews & Resolution Grid -->
        <main class="preview-panel">
          <!-- Preview Tabs Header -->
          <div class="preview-tabs-header">
            <div class="preview-tabs-list">
              <button
                type="button"
                class="preview-tab-btn"
                :class="{ active: activePreviewTab === 'browser' }"
                @click="activePreviewTab = 'browser'"
              >
                <Laptop :size="15" />
                <span>Browser Tab</span>
              </button>
              <button
                type="button"
                class="preview-tab-btn"
                :class="{ active: activePreviewTab === 'mobile' }"
                @click="activePreviewTab = 'mobile'"
              >
                <Smartphone :size="15" />
                <span>Mobile Home Screen</span>
              </button>
              <button
                type="button"
                class="preview-tab-btn"
                :class="{ active: activePreviewTab === 'google' }"
                @click="activePreviewTab = 'google'"
              >
                <Search :size="15" />
                <span>Google Search</span>
              </button>
              <button
                type="button"
                class="preview-tab-btn"
                :class="{ active: activePreviewTab === 'grid' }"
                @click="activePreviewTab = 'grid'"
              >
                <Layers :size="15" />
                <span>All Resolutions ({{ FAVICON_SIZES.length }})</span>
              </button>
            </div>

            <!-- Light/Dark toggle for browser tab simulation -->
            <div v-if="activePreviewTab === 'browser'" class="theme-switch-wrap">
              <button
                type="button"
                class="theme-toggle-mini"
                :class="{ active: browserTheme === 'light' }"
                title="Light Browser Theme"
                @click="browserTheme = 'light'"
              >
                <Sun :size="13" />
              </button>
              <button
                type="button"
                class="theme-toggle-mini"
                :class="{ active: browserTheme === 'dark' }"
                title="Dark Browser Theme"
                @click="browserTheme = 'dark'"
              >
                <Moon :size="13" />
              </button>
            </div>
          </div>

          <!-- PREVIEW 1: Realistic Browser Tab Mockup -->
          <div
            v-if="activePreviewTab === 'browser'"
            class="mockup-container browser-mockup"
            :class="browserTheme"
          >
            <div class="browser-window">
              <div class="browser-header">
                <!-- Window traffic lights -->
                <div class="traffic-lights">
                  <span class="dot red" />
                  <span class="dot yellow" />
                  <span class="dot green" />
                </div>

                <!-- Tabs Bar -->
                <div class="browser-tabs-strip">
                  <div class="active-tab">
                    <img
                      v-if="preview180 || preview32"
                      :src="preview180 || preview32"
                      alt="Favicon preview"
                      class="tab-favicon"
                    />
                    <span class="tab-title">{{ appName || 'My Website' }}</span>
                    <span class="tab-close">✕</span>
                  </div>
                  <div class="inactive-tab">
                    <span class="inactive-tab-title">Documentation</span>
                  </div>
                </div>
              </div>

              <!-- Browser Address Bar -->
              <div class="browser-address-bar">
                <div class="address-input">
                  <span class="ssl-lock">🔒</span>
                  <span class="url-text">https://<strong class="domain">myawesomesite.com</strong>/</span>
                </div>
              </div>

              <!-- Browser Canvas Body -->
              <div class="browser-viewport">
                <div class="viewport-hero">
                  <img
                    v-if="preview180"
                    :src="preview180"
                    alt="App Logo"
                    class="viewport-brand-logo"
                  />
                  <h3>{{ appName || 'My Website' }}</h3>
                  <p>Your favicon is looking sharp across desktop browser tabs and address bars.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- PREVIEW 2: Mobile Home Screen Mockup -->
          <div
            v-else-if="activePreviewTab === 'mobile'"
            class="mockup-container mobile-mockup"
          >
            <div class="phone-frame">
              <div class="phone-notch">
                <div class="notch-speaker" />
                <div class="notch-camera" />
              </div>

              <div class="phone-status-bar">
                <span class="phone-time">9:41</span>
                <span class="phone-signals">5G • 100%</span>
              </div>

              <div class="phone-screen-content">
                <div class="apps-grid">
                  <!-- App 1: Messages -->
                  <div class="app-item dummy">
                    <div class="dummy-icon green">💬</div>
                    <span class="app-label">Messages</span>
                  </div>

                  <!-- App 2: Photos -->
                  <div class="app-item dummy">
                    <div class="dummy-icon flower">🌸</div>
                    <span class="app-label">Photos</span>
                  </div>

                  <!-- App 3: USER's GENERATED FAVICON ICON -->
                  <div class="app-item active-user-app">
                    <div class="app-icon-wrap">
                      <img
                        v-if="preview180"
                        :src="preview180"
                        alt="Home Screen Icon"
                        class="apple-touch-img"
                      />
                    </div>
                    <span class="app-label user-title">{{ appName || 'My Web' }}</span>
                  </div>

                  <!-- App 4: Settings -->
                  <div class="app-item dummy">
                    <div class="dummy-icon gray">⚙️</div>
                    <span class="app-label">Settings</span>
                  </div>
                </div>
              </div>

              <div class="phone-home-indicator" />
            </div>
          </div>

          <!-- PREVIEW 3: Google Search Result Mockup -->
          <div
            v-else-if="activePreviewTab === 'google'"
            class="mockup-container google-mockup"
          >
            <div class="google-result-card">
              <div class="google-header-line">
                <div class="google-favicon-circle">
                  <img
                    v-if="preview180 || preview32"
                    :src="preview180 || preview32"
                    alt="Favicon"
                    class="google-fav-img"
                  />
                </div>
                <div class="google-site-info">
                  <span class="google-site-name">{{ appName || 'My Website' }}</span>
                  <span class="google-site-url">https://example.com › official-site</span>
                </div>
                <span class="google-dots-menu">⋮</span>
              </div>

              <h4 class="google-title">
                {{ appName || 'My Website' }} — Official Home &amp; Web Platform
              </h4>

              <p class="google-snippet">
                Discover modern web experiences, tools, and guides. Built with standard high-definition favicons, Apple touch bookmarks, and web app manifests.
              </p>
            </div>
          </div>

          <!-- PREVIEW 4: All Resolutions Grid -->
          <div
            v-else-if="activePreviewTab === 'grid'"
            class="mockup-container grid-mockup"
          >
            <div class="res-cards-matrix">
              <div
                v-for="item in (faviconPackage?.icons || FAVICON_SIZES)"
                :key="item.id"
                class="res-card"
              >
                <div class="res-card-top">
                  <span class="res-size-pill">{{ item.label }}</span>
                  <span class="res-role-pill">{{ item.role }}</span>
                </div>

                <div class="res-preview-box">
                  <img
                    v-if="item.dataUrl"
                    :src="item.dataUrl"
                    :alt="item.name"
                    class="res-img"
                    :style="{
                      maxWidth: Math.min(item.size, 80) + 'px',
                      maxHeight: Math.min(item.size, 80) + 'px',
                    }"
                  />
                  <div v-else class="res-placeholder" />
                </div>

                <div class="res-card-details">
                  <strong class="res-filename">{{ item.name }}</strong>
                  <span class="res-desc">{{ item.desc }}</span>
                </div>

                <button
                  v-if="item.dataUrl"
                  type="button"
                  class="btn-res-download"
                  @click="downloadFile(item.dataUrl, item.name)"
                >
                  <Download :size="13" />
                  <span>PNG</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Primary Downloads Banner -->
          <div class="download-action-bar">
            <button
              v-if="faviconPackage?.zipUrl"
              type="button"
              class="btn-primary-zip"
              @click="downloadFile(faviconPackage.zipUrl, 'favicons.zip')"
            >
              <FileArchive :size="18" />
              <div class="btn-text-col">
                <span class="btn-main-text">Download Favicon Package (ZIP)</span>
                <span class="btn-sub-text">Includes HD favicon.ico, all PNG sizes, manifest &amp; HTML ({{ formatSize(faviconPackage.zipSizeBytes) }})</span>
              </div>
            </button>

            <button
              v-if="faviconPackage?.icoUrl"
              type="button"
              class="btn-secondary-ico"
              @click="downloadFile(faviconPackage.icoUrl, 'favicon.ico')"
            >
              <FileImage :size="16" />
              <span>Download favicon.ico (HD)</span>
            </button>

            <button
              v-if="preview512 || preview256"
              type="button"
              class="btn-secondary-ico"
              @click="downloadFile(preview512 || preview256, 'favicon-hd.png')"
            >
              <Download :size="16" />
              <span>Download HD PNG</span>
            </button>
          </div>
        </main>
      </div>

      <!-- ================= 3. Ready-to-Use HTML & Manifest Code ================= -->
      <section v-if="faviconPackage" class="code-snippets-section">
        <div class="code-tabs-wrapper">
          <!-- Code 1: HTML Head Snippet -->
          <div class="code-card">
            <div class="code-card-header">
              <div class="code-card-title">
                <Code2 :size="16" />
                <strong>1. Copy HTML &lt;head&gt; Code</strong>
              </div>
              <button
                type="button"
                class="btn-copy-code"
                @click="copyToClipboard(faviconPackage.htmlSnippet, 'HTML Head Code')"
              >
                <Check v-if="copiedType === 'HTML Head Code'" :size="14" />
                <Copy v-else :size="14" />
                <span>{{ copiedType === 'HTML Head Code' ? 'Copied!' : 'Copy HTML' }}</span>
              </button>
            </div>
            <pre class="code-block"><code>{{ faviconPackage.htmlSnippet }}</code></pre>
            <p class="code-caption">
              Paste these tags into the <code>&lt;head&gt;</code> section of your HTML pages.
            </p>
          </div>

          <!-- Code 2: site.webmanifest -->
          <div class="code-card">
            <div class="code-card-header">
              <div class="code-card-title">
                <FileCode2 :size="16" />
                <strong>2. site.webmanifest (PWA)</strong>
              </div>
              <button
                type="button"
                class="btn-copy-code"
                @click="copyToClipboard(faviconPackage.manifestSnippet, 'site.webmanifest')"
              >
                <Check v-if="copiedType === 'site.webmanifest'" :size="14" />
                <Copy v-else :size="14" />
                <span>{{ copiedType === 'site.webmanifest' ? 'Copied!' : 'Copy JSON' }}</span>
              </button>
            </div>
            <pre class="code-block"><code>{{ faviconPackage.manifestSnippet }}</code></pre>
            <p class="code-caption">
              Save as <code>site.webmanifest</code> in your website root folder for Android and PWA install support.
            </p>
          </div>
        </div>
      </section>
    </div>

    <!-- Toast Notification -->
    <transition name="toast-fade">
      <div v-if="toastMessage" class="favicon-toast">
        <CheckCircle2 :size="16" />
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.favicon-tool-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hidden-file-input {
  display: none;
}

/* ================= 1. Dropzone ================= */
.favicon-dropzone {
  position: relative;
  border: 2px dashed #cbd5e1;
  border-radius: 24px;
  background: var(--card-bg, #ffffff);
  padding: 56px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
}

.favicon-dropzone:hover,
.favicon-dropzone.is-dragging {
  border-color: #6366f1;
  background: #f8faff;
  transform: translateY(-2px);
  box-shadow: 0 16px 36px -12px rgba(99, 102, 241, 0.2);
}

.dropzone-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.dropzone-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  max-width: 540px;
  margin: 0 auto;
}

.dropzone-icon-ring {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%);
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.15);
}

.dropzone-title {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.dropzone-subtitle {
  font-size: 14px;
  color: var(--muted, #64748b);
  margin: 0;
  line-height: 1.5;
}

.dropzone-subtitle kbd {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  font-family: inherit;
  color: #334155;
}

.dropzone-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}

.fmt-pill {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  background: #f1f5f9;
  padding: 3px 9px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.dropzone-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-browse {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  padding: 10px 22px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.35);
  transition: all 0.2s ease;
}

.btn-browse:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.45);
}

.actions-divider {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 600;
}

.btn-sample {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  color: #4f46e5;
  font-size: 14px;
  font-weight: 700;
  padding: 9px 20px;
  border-radius: 12px;
  border: 1px solid #c7d2fe;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-sample:hover {
  background: #eef2ff;
  border-color: #a5b4fc;
}

/* ================= 2. Workspace Layout ================= */
.favicon-workspace {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.workspace-top-bar {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
}

.image-meta-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.meta-thumb {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: contain;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 3px;
}

.meta-texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-name {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}

.meta-sub {
  font-size: 12px;
  color: var(--muted, #64748b);
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-top-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-size: 12.5px;
  font-weight: 700;
  padding: 7px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-top-action:hover {
  background: #f1f5f9;
}

.btn-top-action.danger:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

/* Grid Layout */
.workspace-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 960px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

/* Controls Panel */
.controls-panel {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 20px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 12px;
}

.panel-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.label-hint {
  font-size: 11px;
  font-weight: 500;
  color: var(--muted, #64748b);
}

.control-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge-bg-val,
.slider-val-badge {
  font-size: 11px;
  font-weight: 700;
  background: #f1f5f9;
  color: #475569;
  padding: 2px 8px;
  border-radius: 6px;
  font-family: monospace;
}

.text-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  pointer-events: none;
}

.app-name-field {
  width: 100%;
  padding: 9px 12px 9px 36px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  outline: none;
  transition: all 0.15s ease;
}

.app-name-field:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

/* Shape Buttons */
.shape-buttons-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.shape-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.shape-btn:hover {
  background: #f1f5f9;
}

.shape-btn.active {
  background: #eef2ff;
  border-color: #6366f1;
  color: #4f46e5;
}

.shape-demo-icon {
  width: 22px;
  height: 22px;
  background: #cbd5e1;
}

.shape-btn.active .shape-demo-icon {
  background: #6366f1;
}

.shape-demo-icon.square {
  border-radius: 2px;
}

.shape-demo-icon.rounded {
  border-radius: 6px;
}

.shape-demo-icon.circle {
  border-radius: 50%;
}

.shape-btn-text {
  font-size: 11px;
  font-weight: 700;
}

/* BG Swatches */
.bg-swatches-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.swatch-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 11.5px;
  font-weight: 600;
  color: #334155;
}

.swatch-btn:hover {
  background: #f1f5f9;
}

.swatch-btn.active {
  background: #eef2ff;
  border-color: #6366f1;
  color: #4f46e5;
  font-weight: 700;
}

.swatch-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.swatch-circle.transparent {
  background: repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 50% / 8px 8px;
}

.custom-color-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.color-picker-input {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
  background: transparent;
}

.color-hex-field {
  flex: 1;
  padding: 7px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 12.5px;
  font-family: monospace;
  font-weight: 700;
  color: #0f172a;
}

/* Range Slider */
.range-slider {
  width: 100%;
  accent-color: #6366f1;
  cursor: pointer;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  color: #94a3b8;
}

/* Fit Mode */
.fit-toggle-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.fit-btn {
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.fit-btn strong {
  font-size: 12px;
  color: #1e293b;
}

.fit-btn span {
  font-size: 10.5px;
  color: var(--muted, #64748b);
}

.fit-btn.active {
  background: #eef2ff;
  border-color: #6366f1;
}

.fit-btn.active strong {
  color: #4f46e5;
}

/* ================= Preview Panel Right ================= */
.preview-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-tabs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.preview-tabs-list {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 12px;
  gap: 4px;
  flex-wrap: wrap;
}

.preview-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preview-tab-btn:hover {
  color: #0f172a;
}

.preview-tab-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.theme-switch-wrap {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 8px;
  gap: 2px;
}

.theme-toggle-mini {
  padding: 5px 8px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle-mini.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

/* Mockup Container */
.mockup-container {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  min-height: 380px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ================= 1. Browser Tab Mockup ================= */
.browser-mockup {
  width: 100%;
  padding: 16px;
}

.browser-window {
  width: 100%;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.25s ease;
}

/* Light Browser */
.browser-mockup.light .browser-header {
  background: #e2e8f0;
}
.browser-mockup.light .active-tab {
  background: #ffffff;
  color: #0f172a;
}
.browser-mockup.light .inactive-tab {
  color: #64748b;
}
.browser-mockup.light .browser-address-bar {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}
.browser-mockup.light .address-input {
  background: #f1f5f9;
  color: #334155;
}
.browser-mockup.light .browser-viewport {
  background: #f8fafc;
  color: #0f172a;
}

/* Dark Browser */
.browser-mockup.dark .browser-header {
  background: #1e293b;
}
.browser-mockup.dark .active-tab {
  background: #0f172a;
  color: #f8fafc;
}
.browser-mockup.dark .inactive-tab {
  color: #94a3b8;
}
.browser-mockup.dark .browser-address-bar {
  background: #0f172a;
  border-bottom: 1px solid #334155;
}
.browser-mockup.dark .address-input {
  background: #1e293b;
  color: #e2e8f0;
}
.browser-mockup.dark .browser-viewport {
  background: #0b1120;
  color: #f8fafc;
}

.browser-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 14px 0;
}

.traffic-lights {
  display: flex;
  gap: 6px;
  padding-bottom: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #10b981; }

.browser-tabs-strip {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  flex: 1;
}

.active-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px 10px 0 0;
  font-size: 12.5px;
  font-weight: 700;
  max-width: 200px;
}

.tab-favicon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}

.tab-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-close {
  font-size: 11px;
  opacity: 0.6;
  margin-left: auto;
  cursor: pointer;
}

.inactive-tab {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  opacity: 0.7;
}

.browser-address-bar {
  padding: 8px 14px;
}

.address-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
}

.ssl-lock {
  font-size: 12px;
}

.domain {
  font-weight: 800;
}

.browser-viewport {
  padding: 56px 20px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewport-hero {
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.viewport-brand-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
  margin-bottom: 6px;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.15));
}

.viewport-hero h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
}

.viewport-hero p {
  margin: 0;
  font-size: 13px;
  color: var(--muted, #64748b);
  line-height: 1.4;
}

/* ================= 2. Mobile Mockup ================= */
.phone-frame {
  width: 240px;
  height: 440px;
  background: #0f172a;
  border: 10px solid #1e293b;
  border-radius: 40px;
  box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.35);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.phone-notch {
  width: 100px;
  height: 18px;
  background: #1e293b;
  border-radius: 0 0 12px 12px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  z-index: 5;
}

.notch-speaker {
  width: 32px;
  height: 3px;
  background: #334155;
  border-radius: 2px;
}

.notch-camera {
  width: 6px;
  height: 6px;
  background: #0284c7;
  border-radius: 50%;
}

.phone-status-bar {
  display: flex;
  justify-content: space-between;
  padding: 4px 16px;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
}

.phone-screen-content {
  flex: 1;
  background: linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
  padding: 30px 14px;
}

.apps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  text-align: center;
}

.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.dummy-icon {
  width: 44px;
  height: 44px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.dummy-icon.green { background: #22c55e; }
.dummy-icon.flower { background: #f43f5e; }
.dummy-icon.gray { background: #64748b; }

.app-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 11px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.apple-touch-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.app-label {
  font-size: 9px;
  color: #ffffff;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50px;
}

.app-label.user-title {
  color: #fde047;
  font-weight: 800;
}

.phone-home-indicator {
  width: 80px;
  height: 4px;
  background: #ffffff;
  border-radius: 3px;
  margin: 8px auto;
  opacity: 0.6;
}

/* ================= 3. Google Search Mockup ================= */
.google-result-card {
  width: 100%;
  max-width: 560px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.google-header-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.google-favicon-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.google-fav-img {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.google-site-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
}

.google-site-name {
  font-size: 12px;
  font-weight: 700;
  color: #202124;
}

.google-site-url {
  font-size: 11px;
  color: #4d5156;
}

.google-dots-menu {
  color: #70757a;
  font-size: 14px;
}

.google-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a0dab;
  line-height: 1.3;
  cursor: pointer;
}

.google-title:hover {
  text-decoration: underline;
}

.google-snippet {
  margin: 0;
  font-size: 13px;
  color: #4d5156;
  line-height: 1.5;
}

/* ================= 4. All Resolutions Grid ================= */
.grid-mockup {
  width: 100%;
  padding: 16px;
}

.res-cards-matrix {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
  width: 100%;
}

.res-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  transition: all 0.15s ease;
}

.res-card:hover {
  background: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}

.res-card-top {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.res-size-pill {
  font-size: 10.5px;
  font-weight: 800;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 2px 6px;
  border-radius: 4px;
  color: #0f172a;
}

.res-role-pill {
  font-size: 9.5px;
  font-weight: 700;
  color: #6366f1;
}

.res-preview-box {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 50% / 8px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.res-img {
  object-fit: contain;
}

.res-placeholder {
  width: 32px;
  height: 32px;
  background: #e2e8f0;
  border-radius: 4px;
}

.res-card-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 34px;
}

.res-filename {
  font-size: 11px;
  font-weight: 800;
  color: #0f172a;
  word-break: break-all;
}

.res-desc {
  font-size: 9.5px;
  color: var(--muted, #64748b);
  line-height: 1.3;
}

.btn-res-download {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 8px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: #334155;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-res-download:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

/* ================= Download Action Bar ================= */
.download-action-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.btn-primary-zip {
  flex: 1;
  min-width: 260px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
  transition: all 0.2s ease;
  text-align: left;
}

.btn-primary-zip:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(99, 102, 241, 0.45);
}

.btn-text-col {
  display: flex;
  flex-direction: column;
}

.btn-main-text {
  font-size: 14px;
  font-weight: 800;
}

.btn-sub-text {
  font-size: 11px;
  opacity: 0.9;
  font-weight: 500;
}

.btn-secondary-ico {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0f172a;
  padding: 13px 20px;
  border-radius: 14px;
  font-size: 13.5px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-secondary-ico:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

/* ================= 3. Code Snippets ================= */
.code-snippets-section {
  margin-top: 8px;
}

.code-tabs-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 860px) {
  .code-tabs-wrapper {
    grid-template-columns: 1fr;
  }
}

.code-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 18px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
}

.code-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.code-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: #0f172a;
}

.btn-copy-code {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-copy-code:hover {
  background: #e2e8f0;
}

.code-block {
  margin: 0;
  background: #0f172a;
  color: #38bdf8;
  border-radius: 10px;
  padding: 14px;
  font-size: 12px;
  line-height: 1.5;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  overflow-x: auto;
  max-height: 200px;
}

.code-caption {
  margin: 0;
  font-size: 11.5px;
  color: var(--muted, #64748b);
  line-height: 1.4;
}

.code-caption code {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 1px 4px;
  color: #4f46e5;
  font-weight: 700;
}

/* Toast */
.favicon-toast {
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
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 100;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.25s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 15px);
}

/* ================= Mobile Responsive Adjustments ================= */
@media (max-width: 768px) {
  .favicon-tool-wrapper {
    max-width: 100%;
    overflow-x: hidden;
  }

  .favicon-dropzone {
    padding: 36px 16px;
    border-radius: 18px;
  }

  .dropzone-title {
    font-size: 18px;
  }

  .dropzone-subtitle {
    font-size: 13px;
  }

  .dropzone-actions {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }

  .btn-browse,
  .btn-sample {
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
  }

  .actions-divider {
    display: none;
  }

  .favicon-workspace {
    max-width: 100%;
    overflow-x: hidden;
  }

  .workspace-top-bar {
    padding: 12px 14px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .image-meta-info {
    width: 100%;
    min-width: 0;
  }

  .meta-texts {
    min-width: 0;
    overflow: hidden;
  }

  .meta-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  .top-bar-actions {
    width: 100%;
    display: flex;
    gap: 8px;
  }

  .btn-top-action {
    flex: 1;
    justify-content: center;
  }

  .controls-panel {
    padding: 16px;
    border-radius: 16px;
  }

  .preview-panel {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
  }

  .preview-tabs-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .preview-tabs-list {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    box-sizing: border-box;
  }

  .preview-tabs-list::-webkit-scrollbar {
    display: none;
  }

  .preview-tab-btn {
    flex-shrink: 0;
    padding: 6px 12px;
    font-size: 12px;
    white-space: nowrap;
  }

  .theme-switch-wrap {
    align-self: flex-end;
  }

  .mockup-container {
    padding: 14px 10px;
    border-radius: 16px;
    min-height: auto;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }

  .browser-mockup {
    padding: 0;
  }

  .browser-header {
    gap: 8px;
    padding: 8px 10px 0;
  }

  .active-tab {
    padding: 6px 10px;
    max-width: 140px;
    font-size: 11.5px;
  }

  .tab-title {
    max-width: 80px;
  }

  .inactive-tab {
    display: none;
  }

  .browser-address-bar {
    padding: 6px 10px;
  }

  .address-input {
    padding: 4px 10px;
    font-size: 11px;
    min-width: 0;
    overflow: hidden;
  }

  .url-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .browser-viewport {
    padding: 32px 14px;
  }

  .viewport-brand-logo {
    width: 56px;
    height: 56px;
  }

  .viewport-hero h3 {
    font-size: 18px;
  }

  .viewport-hero p {
    font-size: 12px;
  }

  .google-result-card {
    padding: 14px 12px;
    border-radius: 12px;
  }

  .google-title {
    font-size: 15px;
  }

  .google-snippet {
    font-size: 12px;
  }

  .google-site-url {
    word-break: break-all;
    font-size: 10.5px;
  }

  .res-cards-matrix {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .res-card {
    padding: 10px 8px;
  }

  .res-preview-box {
    width: 64px;
    height: 64px;
  }

  .download-action-bar {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }

  .btn-primary-zip {
    width: 100%;
    min-width: 0;
    padding: 12px 14px;
    box-sizing: border-box;
  }

  .btn-main-text {
    font-size: 13px;
  }

  .btn-sub-text {
    font-size: 10px;
  }

  .btn-secondary-ico {
    width: 100%;
    justify-content: center;
    padding: 11px 14px;
    font-size: 13px;
    box-sizing: border-box;
  }

  .code-tabs-wrapper {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .code-card {
    padding: 14px;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    box-sizing: border-box;
  }

  .code-block {
    font-size: 11px;
    padding: 10px;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    box-sizing: border-box;
  }

  .favicon-toast {
    width: 90%;
    max-width: 320px;
    text-align: center;
    padding: 8px 16px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .phone-frame {
    width: 210px;
    height: 380px;
    border-width: 7px;
    border-radius: 30px;
  }

  .phone-screen-content {
    padding: 20px 8px;
  }

  .apps-grid {
    gap: 8px;
  }

  .dummy-icon,
  .app-icon-wrap {
    width: 38px;
    height: 38px;
    border-radius: 9px;
  }

  .dummy-icon {
    font-size: 17px;
  }

  .app-label {
    font-size: 8px;
    max-width: 40px;
  }

  .res-cards-matrix {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}
</style>

