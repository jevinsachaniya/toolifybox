<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Check,
  CheckCheck,
  CircleAlert,
  Download,
  Eye,
  FileCheck,
  FileText,
  Hash,
  LoaderCircle,
  Palette,
  RefreshCw,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sliders,
  Type,
  Upload,
  X,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import {
  addPageNumbersToPdf,
  PAGE_NUMBER_COLORS,
  PAGE_NUMBER_FONTS,
  PAGE_NUMBER_FORMATS,
  PAGE_NUMBER_POSITIONS,
  pageNumberedPdfFilename,
  validatePdfForPageNumbers,
} from '~/utils/add-page-numbers.js';

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

// Page numbering settings
const position = ref('bottom-center'); // 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'
const format = ref('page-of-total'); // 'page-of-total' | 'simple' | 'slash' | 'dash' | 'brackets'
const font = ref('helvetica');
const fontSize = ref(11);
const fontColor = ref('#1e293b');
const margin = ref(36); // distance from edge in pt
const startFrom = ref(1);
const pageRange = ref('all'); // 'all' | 'skip-first' | 'custom'
const customRange = ref('');
const prefix = ref('');

// CustomSelect Options
const POSITION_OPTIONS = Object.entries(PAGE_NUMBER_POSITIONS).map(([val, info]) => ({
  value: val,
  label: info.label,
  sublabel: info.desc,
}));

const FORMAT_OPTIONS = Object.entries(PAGE_NUMBER_FORMATS).map(([val, info]) => ({
  value: val,
  label: info.label,
}));

const FONT_OPTIONS = Object.entries(PAGE_NUMBER_FONTS).map(([val, info]) => ({
  value: val,
  label: info.name,
}));

const FONT_SIZE_OPTIONS = [
  { value: 9, label: '9 pt — Small' },
  { value: 10, label: '10 pt — Compact' },
  { value: 11, label: '11 pt — Standard' },
  { value: 12, label: '12 pt — Regular' },
  { value: 14, label: '14 pt — Large' },
  { value: 16, label: '16 pt — Extra Large' },
];

const MARGIN_OPTIONS = [
  { value: 20, label: 'Tight — 20 pt from edge' },
  { value: 36, label: 'Standard — 36 pt from edge' },
  { value: 54, label: 'Spacious — 54 pt from edge' },
  { value: 72, label: 'Wide — 72 pt from edge' },
];

let dropDepth = 0;
let active = true;

const stage = computed(() => (resultPdf.value ? 3 : file.value ? 2 : 1));

// Sample preview text calculated dynamically
const previewNumberText = computed(() => {
  const formatFn = PAGE_NUMBER_FORMATS[format.value]?.format || PAGE_NUMBER_FORMATS['page-of-total'].format;
  const sampleNum = Number(startFrom.value) || 1;
  const sampleTotal = totalPages.value || 5;
  return formatFn(sampleNum, sampleTotal, prefix.value.trim());
});

function clearResult() {
  if (resultPdf.value?.url) URL.revokeObjectURL(resultPdf.value.url);
  resultPdf.value = null;
}

function resetAll() {
  file.value = null;
  totalPages.value = 1;
  error.value = '';
  progress.value = '';
  clearResult();
  if (input.value) input.value.value = '';
}

onBeforeUnmount(() => {
  active = false;
  clearResult();
});

async function onFileSelected(e) {
  const selected = e.target?.files?.[0];
  if (!selected) return;
  await handleFile(selected);
}

async function handleFile(candidate) {
  const validationError = validatePdfForPageNumbers(candidate);
  if (validationError) {
    error.value = validationError;
    return;
  }

  error.value = '';
  clearResult();
  busy.value = true;
  progress.value = 'Reading PDF information…';

  try {
    const { PDFDocument } = await import('pdf-lib');
    const arrayBuffer = await candidate.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    totalPages.value = pdfDoc.getPageCount();
    file.value = candidate;
  } catch (err) {
    console.error('PDF inspect error:', err);
    error.value = 'Could not read PDF. The file might be corrupted or password-protected.';
    file.value = null;
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

// Drag & drop handlers
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

async function processPdf() {
  if (!file.value || busy.value) return;
  busy.value = true;
  error.value = '';
  progress.value = 'Stamping page numbers…';

  try {
    const res = await addPageNumbersToPdf(file.value, {
      position: position.value,
      format: format.value,
      font: font.value,
      fontSize: fontSize.value,
      color: fontColor.value,
      margin: margin.value,
      startFrom: startFrom.value,
      pageRange: pageRange.value,
      customRange: customRange.value,
      prefix: prefix.value,
      onProgress: (p) => {
        progress.value = p;
      },
    });

    const outName = pageNumberedPdfFilename(file.value.name);
    const url = URL.createObjectURL(res.blob);

    resultPdf.value = {
      url,
      filename: outName,
      size: res.blob.size,
      pageCount: res.pageCount,
      modifiedCount: res.modifiedCount,
    };

    // Auto-trigger download
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = outName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  } catch (err) {
    console.error('Page numbering error:', err);
    error.value = err.message || 'Failed to add page numbers. Please check your options and try again.';
  } finally {
    busy.value = false;
    progress.value = '';
  }
}
</script>

<template>
  <section
    id="converter"
    class="converter add-page-numbers-converter"
    :class="{
      'is-busy': busy,
      'is-dragging': dragging,
      'has-file': Boolean(file),
      'has-result': Boolean(resultPdf),
    }"
    aria-label="Add page numbers to PDF"
    :aria-busy="busy"
  >
    <!-- Hidden native file input -->
    <input
      ref="input"
      type="file"
      accept=".pdf,application/pdf"
      class="sr-only"
      aria-hidden="true"
      @change="onFileSelected"
    />

    <!-- Header Section -->
    <div class="converter-heading">
      <div>
        <span class="mini-label">PDF NUMBERING &amp; PAGINATION</span>
        <h2>Add Page Numbers to PDF</h2>
      </div>
      <p>Insert clean, numbered pagination into your PDF documents. Choose exact positioning, custom formatting, starting page, and font styling with total privacy.</p>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="error-banner" role="alert">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
      <button type="button" class="error-dismiss" aria-label="Dismiss error" @click="error = ''">
        <X :size="14" />
      </button>
    </div>

    <!-- STEP 1: UPLOAD DROPZONE -->
    <div
      v-if="stage === 1"
      class="drop-zone"
      :class="{ active: dragging }"
      role="button"
      tabindex="0"
      aria-label="Upload PDF file"
      @click="input?.click()"
      @keydown.enter.space.prevent="input?.click()"
      @dragenter="onDragEnter"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div class="drop-zone-icon">
        <Upload :size="32" />
      </div>
      <h3>Choose PDF document</h3>
      <p>Drag &amp; drop your PDF here, or browse from your device</p>
      <button
        ref="uploadButton"
        type="button"
        class="primary-button choose-button"
        @click.stop="input?.click()"
      >
        <Upload :size="16" /> Select PDF File
      </button>
      <div class="file-requirements">
        <span>Supported: .pdf documents up to 50 MB</span>
      </div>
    </div>

    <!-- STEP 2: CONFIGURE & STAMP WORKSPACE -->
    <div v-else-if="stage === 2" class="numbering-workspace">
      <!-- File metadata bar -->
      <div class="loaded-file-bar">
        <div class="loaded-file-info">
          <FileText :size="20" class="file-icon" />
          <div>
            <strong>{{ file?.name }}</strong>
            <small>{{ totalPages }} {{ totalPages === 1 ? 'page' : 'pages' }} · {{ formatSize(file?.size || 0) }}</small>
          </div>
        </div>
        <button type="button" class="text-button change-file-btn" @click="resetAll">
          <RotateCcw :size="14" /> Choose Different File
        </button>
      </div>

      <div class="numbering-layout">
        <!-- LEFT: CONTROLS & OPTIONS -->
        <div class="numbering-settings">
          <!-- Position & Placement -->
          <div class="settings-group">
            <span class="group-title"><Sliders :size="15" /> Number Position</span>
            <div class="position-selector-grid">
              <button
                v-for="(info, key) in PAGE_NUMBER_POSITIONS"
                :key="key"
                type="button"
                class="position-btn"
                :class="{ active: position === key }"
                @click="position = key"
              >
                <span class="pos-dot" />
                <span class="pos-label">{{ info.label }}</span>
              </button>
            </div>
          </div>

          <!-- Format & Text Details -->
          <div class="settings-group">
            <span class="group-title"><Type :size="15" /> Number Format &amp; Prefix</span>
            <div class="input-row two-col">
              <div class="field-item">
                <label>Numbering Format</label>
                <CustomSelect
                  v-model="format"
                  :options="FORMAT_OPTIONS"
                  size="sm"
                />
              </div>
              <div class="field-item">
                <label for="start-from-input">Start Counting At</label>
                <input
                  id="start-from-input"
                  v-model.number="startFrom"
                  type="number"
                  min="0"
                  max="9999"
                  class="form-control"
                />
              </div>
            </div>

            <div class="input-row two-col">
              <div class="field-item">
                <label for="prefix-input">Optional Prefix Text</label>
                <input
                  id="prefix-input"
                  v-model="prefix"
                  type="text"
                  placeholder="e.g. Doc, Page, or Ref"
                  class="form-control"
                />
              </div>
              <div class="field-item">
                <label>Edge Margin Distance</label>
                <CustomSelect
                  v-model="margin"
                  :options="MARGIN_OPTIONS"
                  size="sm"
                />
              </div>
            </div>
          </div>

          <!-- Typography & Colors -->
          <div class="settings-group">
            <span class="group-title"><Palette :size="15" /> Typography &amp; Appearance</span>
            <div class="input-row two-col">
              <div class="field-item">
                <label>Font Family</label>
                <CustomSelect
                  v-model="font"
                  :options="FONT_OPTIONS"
                  size="sm"
                />
              </div>
              <div class="field-item">
                <label>Font Size</label>
                <CustomSelect
                  v-model="fontSize"
                  :options="FONT_SIZE_OPTIONS"
                  size="sm"
                />
              </div>
            </div>

            <div class="field-item mt-2">
              <label>Number Color</label>
              <div class="color-palette-wrap">
                <button
                  v-for="c in PAGE_NUMBER_COLORS"
                  :key="c.hex"
                  type="button"
                  class="color-chip-btn"
                  :class="{ active: fontColor === c.hex }"
                  :style="{ backgroundColor: c.hex }"
                  :aria-label="c.name"
                  @click="fontColor = c.hex"
                >
                  <Check v-if="fontColor === c.hex" :size="14" class="chip-check" />
                </button>
              </div>
            </div>
          </div>

          <!-- Page Scope Selector -->
          <div class="settings-group">
            <span class="group-title"><Hash :size="15" /> Apply To Pages</span>
            <div class="scope-options-row">
              <label class="scope-radio" :class="{ selected: pageRange === 'all' }">
                <input v-model="pageRange" type="radio" value="all" />
                <span>All Pages (1 to {{ totalPages }})</span>
              </label>
              <label class="scope-radio" :class="{ selected: pageRange === 'skip-first' }">
                <input v-model="pageRange" type="radio" value="skip-first" />
                <span>Skip Cover Page (Start from page 2)</span>
              </label>
              <label class="scope-radio" :class="{ selected: pageRange === 'custom' }">
                <input v-model="pageRange" type="radio" value="custom" />
                <span>Custom Page Range</span>
              </label>
            </div>

            <div v-if="pageRange === 'custom'" class="field-item mt-2">
              <label for="custom-range-input">Enter page numbers or ranges (e.g. 1-5, 8, 11-15)</label>
              <input
                id="custom-range-input"
                v-model="customRange"
                type="text"
                placeholder="e.g. 2-{{ totalPages }}"
                class="form-control"
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-footer">
            <button
              type="button"
              class="primary-button add-numbers-btn"
              :disabled="busy"
              @click="processPdf"
            >
              <template v-if="busy">
                <LoaderCircle class="spinning" :size="18" />
                <span>{{ progress || 'Numbering pages…' }}</span>
              </template>
              <template v-else>
                <Hash :size="18" />
                <span>Add Page Numbers &amp; Download</span>
              </template>
            </button>
            <button type="button" class="text-button reset-btn" :disabled="busy" @click="resetAll">
              Cancel
            </button>
          </div>
        </div>

        <!-- RIGHT: LIVE INTERACTIVE PREVIEW -->
        <div class="numbering-preview-col">
          <div class="preview-card">
            <div class="preview-card-header">
              <span class="preview-badge"><Eye :size="14" /> Live Placement Simulation</span>
              <small>{{ totalPages }} pages · {{ PAGE_NUMBER_POSITIONS[position]?.label }}</small>
            </div>

            <div class="sheet-preview-container">
              <!-- Visual PDF Sheet Simulator -->
              <div class="preview-pdf-page">
                <!-- Mock document header lines -->
                <div class="mock-line header-line" />
                <div class="mock-line title-line" />
                <div class="mock-line body-line full" />
                <div class="mock-line body-line medium" />
                <div class="mock-line body-line full" />
                <div class="mock-line body-line short" />

                <!-- Simulated Page Number Badge -->
                <div
                  class="simulated-page-number"
                  :class="position"
                  :style="{
                    color: fontColor,
                    fontSize: `${fontSize}px`,
                  }"
                >
                  {{ previewNumberText }}
                </div>
              </div>
            </div>

            <div class="preview-footer-assurance">
              <ShieldCheck :size="14" />
              <span>Numbers stamped locally with lossless vector quality. Zero uploads.</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- STEP 3: RESULT STATE -->
    <div v-else-if="stage === 3" class="result-banner">
      <div class="result-icon">
        <Check :size="24" />
      </div>
      <div class="result-content">
        <h3>Page Numbers Added Successfully!</h3>
        <p>{{ resultPdf?.filename }} · {{ resultPdf?.modifiedCount }} {{ resultPdf?.modifiedCount === 1 ? 'page' : 'pages' }} numbered · {{ formatSize(resultPdf?.size || 0) }}</p>
      </div>
      <div class="result-actions">
        <a :href="resultPdf?.url" :download="resultPdf?.filename" class="primary-button download-btn">
          <Download :size="16" /> Download Again
        </a>
        <button type="button" class="text-button" @click="resetAll">
          <RefreshCw :size="14" /> Number Another PDF
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.add-page-numbers-converter {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: var(--surface-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.06);
}

.converter-heading {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.converter-heading h2 {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-heading, #0f172a);
  margin: 0;
}

.converter-heading p {
  color: var(--text-muted, #64748b);
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 780px;
}

/* Drop Zone */
.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 260px;
  padding: 32px 20px;
  border: 2px dashed var(--border-color, #cbd5e1);
  border-radius: 16px;
  background: var(--card-bg, #f8fafc);
  cursor: pointer;
  transition: all 0.25s ease;
}

.drop-zone:hover,
.drop-zone.active {
  border-color: var(--accent-color, #e11d48);
  background: var(--accent-subtle, #fff1f2);
}

.drop-zone-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(225, 29, 72, 0.1);
  color: var(--accent-color, #e11d48);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.drop-zone h3 {
  margin: 0 0 4px;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-heading, #0f172a);
}

.drop-zone p {
  margin: 0 0 16px;
  font-size: 0.85rem;
  color: var(--text-muted, #64748b);
}

.choose-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 0.9rem;
  border-radius: 10px;
}

.file-requirements {
  margin-top: 14px;
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
}

/* Loaded File Bar */
.loaded-file-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--card-bg, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  flex-wrap: wrap;
  gap: 12px;
}

.loaded-file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  color: var(--accent-color, #e11d48);
}

.loaded-file-info strong {
  display: block;
  font-size: 0.9rem;
  color: var(--text-heading, #0f172a);
  word-break: break-all;
}

.loaded-file-info small {
  color: var(--text-muted, #64748b);
  font-size: 0.75rem;
}

.change-file-btn {
  font-size: 0.82rem;
  color: var(--text-muted, #64748b);
}

/* Numbering Layout */
.numbering-workspace {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.numbering-layout {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 28px;
  align-items: start;
}

@media (max-width: 960px) {
  .numbering-layout {
    grid-template-columns: 1fr;
  }
}

.numbering-settings {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 14px;
  background: var(--card-bg, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-heading, #334155);
}

/* Position Selector Grid */
.position-selector-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.position-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  background: var(--surface-bg, #ffffff);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-heading, #334155);
  cursor: pointer;
  transition: all 0.15s ease;
}

.position-btn:hover {
  border-color: var(--accent-color, #e11d48);
}

.position-btn.active {
  border-color: var(--accent-color, #e11d48);
  background: var(--accent-subtle, #fff1f2);
  color: var(--accent-color, #be123c);
  box-shadow: 0 0 0 2px rgba(225, 29, 72, 0.2);
}

.pos-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cbd5e1;
  flex-shrink: 0;
}

.position-btn.active .pos-dot {
  background: var(--accent-color, #e11d48);
}

/* Form Controls */
.input-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-row.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-item label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-heading, #334155);
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  font-size: 0.85rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--surface-bg, #ffffff);
  color: var(--text-heading, #0f172a);
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: var(--accent-color, #e11d48);
  box-shadow: 0 0 0 2px rgba(225, 29, 72, 0.2);
}

/* Color Palette */
.color-palette-wrap {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-chip-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.color-chip-btn:hover {
  transform: scale(1.1);
}

.color-chip-btn.active {
  border-color: #ffffff;
  box-shadow: 0 0 0 2px var(--accent-color, #e11d48);
}

.chip-check {
  color: #ffffff;
}

/* Scope radio options */
.scope-options-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scope-radio {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  background: var(--surface-bg, #ffffff);
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-heading, #334155);
  cursor: pointer;
  transition: all 0.15s ease;
}

.scope-radio:hover {
  border-color: var(--accent-color, #e11d48);
}

.scope-radio.selected {
  border-color: var(--accent-color, #e11d48);
  background: var(--accent-subtle, #fff1f2);
  color: var(--accent-color, #be123c);
}

.scope-radio input {
  accent-color: var(--accent-color, #e11d48);
}

/* Action Footer */
.action-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.add-numbers-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 13px 22px;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 12px;
}

.reset-btn {
  font-size: 0.88rem;
  color: var(--text-muted, #64748b);
}

/* RIGHT: PREVIEW STYLING */
.numbering-preview-col {
  display: flex;
  flex-direction: column;
}

.preview-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 16px;
  background: var(--card-bg, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
}

.preview-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-heading, #334155);
}

.preview-card-header small {
  font-size: 0.72rem;
  color: var(--text-muted, #64748b);
  background: var(--surface-bg, #ffffff);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-color, #e2e8f0);
}

.sheet-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px 0;
}

.preview-pdf-page {
  width: 100%;
  max-width: 280px;
  height: 380px;
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
  position: relative;
  padding: 24px 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mock-line {
  background: #e2e8f0;
  border-radius: 3px;
}

.mock-line.header-line {
  width: 60%;
  height: 8px;
  background: #cbd5e1;
  margin-bottom: 8px;
}

.mock-line.title-line {
  width: 85%;
  height: 12px;
  background: #94a3b8;
  margin-bottom: 12px;
}

.mock-line.body-line.full {
  width: 100%;
  height: 6px;
}

.mock-line.body-line.medium {
  width: 80%;
  height: 6px;
}

.mock-line.body-line.short {
  width: 45%;
  height: 6px;
}

/* Simulated Page Number Placement */
.simulated-page-number {
  position: absolute;
  font-family: inherit;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.simulated-page-number.bottom-center {
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
}

.simulated-page-number.bottom-right {
  bottom: 18px;
  right: 18px;
}

.simulated-page-number.bottom-left {
  bottom: 18px;
  left: 18px;
}

.simulated-page-number.top-center {
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
}

.simulated-page-number.top-right {
  top: 18px;
  right: 18px;
}

.simulated-page-number.top-left {
  top: 18px;
  left: 18px;
}

.preview-footer-assurance {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--text-muted, #64748b);
  text-align: center;
}

/* Result Banner */
.result-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 14px;
}

.result-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #10b981;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.result-content h3 {
  margin: 0 0 4px;
  font-size: 1.05rem;
  color: #065f46;
}

.result-content p {
  margin: 0;
  font-size: 0.82rem;
  color: #047857;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  font-size: 0.88rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Mobile Media Queries */
@media (max-width: 768px) {
  .add-page-numbers-converter {
    padding: 18px 12px;
    border-radius: 16px;
    gap: 16px;
  }

  .converter-heading h2 {
    font-size: 1.35rem;
  }

  .converter-heading p {
    font-size: 0.85rem;
    line-height: 1.45;
  }

  .position-selector-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .input-row.two-col {
    grid-template-columns: 1fr !important;
  }

  .action-footer {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }

  .add-numbers-btn {
    width: 100%;
    padding: 12px 18px;
  }

  .reset-btn {
    width: 100%;
    text-align: center;
  }

  .result-banner {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    gap: 12px;
    padding: 14px 12px;
  }

  .result-icon {
    margin-inline: auto;
  }

  .result-actions {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }

  .download-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Dark Theme Overrides */
html[data-theme='dark'] .add-page-numbers-converter {
  background: #0f172a;
  border-color: #1e293b;
}

html[data-theme='dark'] .converter-heading h2 {
  color: #f8fafc;
}

html[data-theme='dark'] .converter-heading p {
  color: #94a3b8;
}

html[data-theme='dark'] .drop-zone {
  background: #111827;
  border-color: #334155;
}

html[data-theme='dark'] .drop-zone:hover,
html[data-theme='dark'] .drop-zone.active {
  background: #1e1b4b;
  border-color: #e11d48;
}

html[data-theme='dark'] .drop-zone h3 {
  color: #f8fafc;
}

html[data-theme='dark'] .settings-group,
html[data-theme='dark'] .loaded-file-bar,
html[data-theme='dark'] .preview-card {
  background: #111827;
  border-color: #1e293b;
}

html[data-theme='dark'] .group-title,
html[data-theme='dark'] .field-item label,
html[data-theme='dark'] .preview-badge {
  color: #e2e8f0;
}

html[data-theme='dark'] .position-btn,
html[data-theme='dark'] .scope-radio,
html[data-theme='dark'] .form-control {
  background: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}

html[data-theme='dark'] .position-btn:hover,
html[data-theme='dark'] .scope-radio:hover {
  border-color: #fb7185;
}

html[data-theme='dark'] .position-btn.active,
html[data-theme='dark'] .scope-radio.selected {
  background: #4c0519;
  border-color: #fb7185;
  color: #fecdd3;
}

html[data-theme='dark'] .result-banner {
  background: #064e3b;
  border-color: #059669;
}

html[data-theme='dark'] .result-content h3 {
  color: #a7f3d0;
}

html[data-theme='dark'] .result-content p {
  color: #6ee7b7;
}
</style>

