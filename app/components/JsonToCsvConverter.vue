<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  Archive,
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  Clock,
  Code2,
  Copy,
  Download,
  Eye,
  FileArchive,
  FileCode2,
  FileSpreadsheet,
  FileText,
  FileUp,
  Filter,
  Layers,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sliders,
  Sparkles,
  Table,
  Trash2,
  Upload,
  UploadCloud,
  X,
  Zap,
} from '@lucide/vue';
import CustomSelect from '~/components/CustomSelect.vue';
import { formatSize } from '~/utils/document.js';
import {
  convertJsonToCsv,
  EXCEL_MAX_ROWS,
  JSON_CSV_DELIMITERS,
  JSON_CSV_QUOTE_MODES,
  JSON_CSV_SPLIT_OPTIONS,
  jsonToCsvFilename,
  packageCsvPartsZip,
  SAMPLE_JSON_TEMPLATES,
  validateJsonInput,
} from '~/utils/json-to-csv.js';

// Input Mode: 'file' | 'text'
const inputMode = ref('file');

// Text Mode State
const rawJsonText = ref(SAMPLE_JSON_TEMPLATES[0].json);
const selectedTemplateId = ref('ecommerce');
const editorLineCount = computed(() => {
  if (!rawJsonText.value) return 1;
  return rawJsonText.value.split('\n').length;
});
const lineNumbersRef = ref(null);

// File Mode State
const uploadedFile = ref(null);
const uploadedFileName = ref('');
const uploadedFileSize = ref(0);
const fileTextContent = ref('');
const isDragging = ref(false);
const fileInputRef = ref(null);
let dragDepth = 0;

// Conversion Settings
const delimiter = ref(',');
const quoteMode = ref('auto');
const flattenNested = ref(true);
const includeHeaders = ref(true);
const excelBom = ref(true);
const splitMode = ref('auto');
const showAdvancedSettings = ref(false);
const outputFilename = ref('data.csv');

// Output & Preview State
const busy = ref(false);
const result = ref(null);
const error = ref('');
const toastMessage = ref('');
let toastTimer = null;

// Output View: 'table' | 'code'
const outputViewMode = ref('table');
const searchQuery = ref('');
const currentPage = ref(1);
const rowsPerPage = ref(15);
const rowsPerPageOptions = [15, 25, 50, 100, 250, 500];
const copiedCode = ref(false);

// Delimiter Select Options for CustomSelect
const delimiterOptions = JSON_CSV_DELIMITERS.map(d => ({
  value: d.value,
  label: d.label,
}));

const quoteModeOptions = JSON_CSV_QUOTE_MODES.map(q => ({
  value: q.value,
  label: q.label,
}));

const splitModeOptions = JSON_CSV_SPLIT_OPTIONS.map(s => ({
  value: s.value,
  label: s.label,
}));

function showToast(msg) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3200);
}

function syncEditorScroll(e) {
  if (lineNumbersRef.value && e?.target) {
    lineNumbersRef.value.scrollTop = e.target.scrollTop;
  }
}

// Template loader
function loadTemplate(templateId) {
  const t = SAMPLE_JSON_TEMPLATES.find(item => item.id === templateId);
  if (t) {
    rawJsonText.value = t.json;
    outputFilename.value = `${t.id}.csv`;
    error.value = '';
    showToast(`Loaded ${t.title} template`);
  }
}

// Prettify / Format JSON
function formatJson() {
  if (!rawJsonText.value.trim()) return;
  try {
    const parsed = JSON.parse(rawJsonText.value.trim());
    rawJsonText.value = JSON.stringify(parsed, null, 2);
    error.value = '';
    showToast('Formatted JSON with 2-space indentation');
  } catch (err) {
    error.value = `Cannot format invalid JSON: ${err.message}`;
  }
}

// Minify JSON
function minifyJson() {
  if (!rawJsonText.value.trim()) return;
  try {
    const parsed = JSON.parse(rawJsonText.value.trim());
    rawJsonText.value = JSON.stringify(parsed);
    error.value = '';
    showToast('Minified JSON string');
  } catch (err) {
    error.value = `Cannot minify invalid JSON: ${err.message}`;
  }
}

// Clear Editor
function clearEditor() {
  rawJsonText.value = '';
  result.value = null;
  error.value = '';
}

// File Drag & Drop
function onDragEnter(e) {
  e.preventDefault();
  dragDepth++;
  isDragging.value = true;
}

function onDragLeave(e) {
  e.preventDefault();
  dragDepth--;
  if (dragDepth <= 0) {
    dragDepth = 0;
    isDragging.value = false;
  }
}

function onDragOver(e) {
  e.preventDefault();
}

function onDrop(e) {
  e.preventDefault();
  dragDepth = 0;
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFileSelected(files[0]);
  }
}

function onFileInputChange(e) {
  const files = e.target?.files;
  if (files && files.length > 0) {
    handleFileSelected(files[0]);
  }
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

async function handleFileSelected(file) {
  error.value = '';
  try {
    validateJsonInput(file);
    uploadedFile.value = file;
    uploadedFileName.value = file.name;
    uploadedFileSize.value = file.size;
    outputFilename.value = jsonToCsvFilename(file.name);

    const text = await file.text();
    fileTextContent.value = text;
    showToast(`Loaded "${file.name}" (${formatSize(file.size)})`);

    // Auto-run conversion for instant speed experience
    executeConversion();
  } catch (err) {
    error.value = err.message;
  }
}

function removeUploadedFile() {
  uploadedFile.value = null;
  uploadedFileName.value = '';
  uploadedFileSize.value = 0;
  fileTextContent.value = '';
  result.value = null;
  error.value = '';
  if (fileInputRef.value) fileInputRef.value.value = '';
}

// Execute Fast Conversion
function executeConversion() {
  error.value = '';
  busy.value = true;

  try {
    const content = inputMode.value === 'file' ? fileTextContent.value : rawJsonText.value;

    if (!content || !content.trim()) {
      if (inputMode.value === 'file') {
        throw new Error('Please select or drop a JSON file first.');
      } else {
        throw new Error('JSON editor is empty. Please enter or paste your JSON code.');
      }
    }

    const conversionResult = convertJsonToCsv(content, {
      delimiter: delimiter.value,
      quoteMode: quoteMode.value,
      flatten: flattenNested.value,
      includeHeaders: includeHeaders.value,
      excelBom: excelBom.value,
      splitMode: splitMode.value,
      baseFilename: outputFilename.value,
    });

    result.value = conversionResult;
    currentPage.value = 1;
    if (conversionResult.isSplit) {
      showToast(`Converted ${conversionResult.rowsCount.toLocaleString()} rows into ${conversionResult.parts.length} Excel parts!`);
    } else {
      showToast(`Converted ${conversionResult.rowsCount.toLocaleString()} rows in ${conversionResult.durationMs}ms!`);
    }
  } catch (err) {
    error.value = err.message;
    result.value = null;
  } finally {
    busy.value = false;
  }
}

// Download All Split Parts as ZIP
async function downloadAllPartsZip() {
  if (!result.value?.parts || !result.value.parts.length) return;
  try {
    busy.value = true;
    showToast('Creating ZIP archive of CSV parts...');
    const baseName = (outputFilename.value || 'data.csv').replace(/\.csv$/i, '');
    const zipName = `${baseName}_excel_parts.zip`;
    const blob = await packageCsvPartsZip(result.value.parts, zipName);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${zipName} (${result.value.parts.length} files)`);
  } catch (err) {
    error.value = `Failed to generate ZIP archive: ${err.message}`;
  } finally {
    busy.value = false;
  }
}

// Download Individual CSV Part
function downloadPartCsv(part) {
  if (!part?.csv) return;
  try {
    const blob = new Blob([part.csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = part.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${part.filename}`);
  } catch (err) {
    error.value = `Download failed: ${err.message}`;
  }
}

// Download CSV
function downloadCsv() {
  if (!result.value?.csv) return;
  try {
    const blob = new Blob([result.value.csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFilename.value || 'data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${outputFilename.value || 'data.csv'}`);
  } catch (err) {
    error.value = `Download failed: ${err.message}`;
  }
}

// Copy CSV to Clipboard
async function copyCsvToClipboard() {
  if (!result.value?.csv) return;
  try {
    // Strip BOM for clipboard copy so plain text pastes cleanly
    const textToCopy = result.value.csv.startsWith('\uFEFF')
      ? result.value.csv.slice(1)
      : result.value.csv;

    await navigator.clipboard.writeText(textToCopy);
    copiedCode.value = true;
    showToast('CSV code copied to clipboard!');
    setTimeout(() => {
      copiedCode.value = false;
    }, 2500);
  } catch (err) {
    error.value = `Clipboard copy failed: ${err.message}`;
  }
}

// Filtered and Paginated Table Rows
const filteredTableRows = computed(() => {
  if (!result.value?.previewRows) return [];
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return result.value.previewRows;

  return result.value.previewRows.filter(row => {
    return Object.values(row).some(val => {
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(query);
    });
  });
});

const totalPages = computed(() => {
  const count = filteredTableRows.value.length;
  return Math.max(1, Math.ceil(count / rowsPerPage.value));
});

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredTableRows.value.slice(start, start + rowsPerPage.value);
});

watch(inputMode, () => {
  error.value = '';
});

onMounted(() => {
  // Page starts in clean idle state waiting for user file or text input
});

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<template>
  <div id="converter" class="j2c-wrapper">
    <!-- Top Mode Switcher Bar -->
    <div class="j2c-tabs-header">
      <div class="j2c-tabs-pills" role="tablist" aria-label="Input Mode">
        <button
          type="button"
          class="j2c-tab-btn"
          :class="{ active: inputMode === 'file' }"
          role="tab"
          :aria-selected="inputMode === 'file'"
          @click="inputMode = 'file'"
        >
          <UploadCloud :size="17" />
          <span>Option 1: Upload File</span>
          <span v-if="uploadedFile" class="j2c-file-badge">1 File</span>
        </button>

        <button
          type="button"
          class="j2c-tab-btn"
          :class="{ active: inputMode === 'text' }"
          role="tab"
          :aria-selected="inputMode === 'text'"
          @click="inputMode = 'text'"
        >
          <Code2 :size="17" />
          <span>Option 2: Enter Direct Text</span>
        </button>
      </div>

      <div class="j2c-speed-pill">
        <Zap :size="14" class="zap-icon" />
        <span>Instant In-Browser Conversion</span>
      </div>
    </div>

    <!-- Main Converter Workspace -->
    <div class="j2c-workspace">
      <!-- INPUT SECTION (Left / Top) -->
      <section class="j2c-input-card">
        <!-- MODE 1: FILE UPLOAD -->
        <div v-if="inputMode === 'file'" class="j2c-file-pane">
          <input
            ref="fileInputRef"
            type="file"
            accept=".json,.ndjson,.jsonl,.txt"
            class="sr-only"
            aria-label="Upload JSON file"
            @change="onFileInputChange"
          />

          <!-- Drag and Drop Dropzone -->
          <div
            v-if="!uploadedFile"
            class="j2c-dropzone"
            :class="{ 'is-dragging': isDragging }"
            @dragenter="onDragEnter"
            @dragleave="onDragLeave"
            @dragover="onDragOver"
            @drop="onDrop"
            @click="triggerFileInput"
            tabindex="0"
            role="button"
            aria-label="Upload JSON file to convert to CSV"
            @keydown.enter.prevent="triggerFileInput"
            @keydown.space.prevent="triggerFileInput"
          >
            <div class="dropzone-inner">
              <div class="dropzone-icon-glow">
                <FileSpreadsheet class="icon-sheet" :size="32" />
              </div>
              <h2 class="dropzone-title">Upload JSON File to Convert to CSV</h2>
              <p class="dropzone-desc">
                Transform JSON, NDJSON, or JSONL into structured, publication-quality CSV spreadsheets in milliseconds.
              </p>

              <div class="dropzone-meta-pill">
                <Zap :size="13" />
                <span>100% In-Browser Privacy • Nested Object Flattening • Zero Server Upload</span>
              </div>

              <button type="button" class="dropzone-browse-btn" @click.stop="triggerFileInput">
                <Upload :size="16" />
                <span>Choose JSON File</span>
              </button>

              <span class="dropzone-formats">Supported: .json, .ndjson, .jsonl, .txt (Up to 30 MB)</span>
            </div>
          </div>

          <!-- Uploaded File Card -->
          <div v-else class="j2c-file-loaded">
            <div class="j2c-file-loaded-icon">
              <FileSpreadsheet :size="30" />
            </div>
            <div class="j2c-file-loaded-info">
              <div class="file-name" :title="uploadedFileName">{{ uploadedFileName }}</div>
              <div class="file-meta">
                <span>{{ formatSize(uploadedFileSize) }}</span>
                <span class="dot">•</span>
                <span class="security-chip"><ShieldCheck :size="13" /> 100% Local Device</span>
              </div>
            </div>
            <div class="j2c-file-loaded-actions">
              <button
                type="button"
                class="btn-icon danger"
                title="Remove file"
                aria-label="Remove file"
                @click="removeUploadedFile"
              >
                <Trash2 :size="16" />
              </button>
              <button
                type="button"
                class="btn-action-sm"
                @click="triggerFileInput"
              >
                <RefreshCw :size="14" /> Change File
              </button>
            </div>
          </div>
        </div>

        <!-- MODE 2: DIRECT TEXT EDITOR -->
        <div v-else class="j2c-text-pane">
          <!-- Text Toolbar -->
          <div class="j2c-editor-toolbar">
            <div class="template-selector">
              <label for="template-select" class="sr-only">Starter Sample</label>
              <span class="tool-label">Sample Data:</span>
              <div class="template-pills">
                <button
                  v-for="tpl in SAMPLE_JSON_TEMPLATES"
                  :key="tpl.id"
                  type="button"
                  class="tpl-btn"
                  :class="{ active: selectedTemplateId === tpl.id }"
                  @click="selectedTemplateId = tpl.id; loadTemplate(tpl.id)"
                >
                  {{ tpl.title }}
                </button>
              </div>
            </div>

            <div class="editor-actions">
              <button
                type="button"
                class="btn-tool"
                title="Format JSON with indentation"
                @click="formatJson"
              >
                <Sparkles :size="14" /> Prettify
              </button>
              <button
                type="button"
                class="btn-tool"
                title="Minify JSON"
                @click="minifyJson"
              >
                <Layers :size="14" /> Minify
              </button>
              <button
                type="button"
                class="btn-tool"
                title="Clear code"
                @click="clearEditor"
              >
                <Trash2 :size="14" /> Clear
              </button>
            </div>
          </div>

          <!-- Code Input Box with Line Numbers -->
          <div class="j2c-editor-box">
            <div ref="lineNumbersRef" class="editor-lines" aria-hidden="true">
              <div v-for="n in editorLineCount" :key="n" class="line-num">{{ n }}</div>
            </div>
            <textarea
              v-model="rawJsonText"
              class="editor-textarea"
              placeholder="Paste or write your JSON here... e.g. [{ &quot;id&quot;: 1, &quot;name&quot;: &quot;Alice&quot; }]"
              spellcheck="false"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              @scroll="syncEditorScroll"
            />
          </div>
        </div>

        <!-- CONVERSION SETTINGS ACCORDION -->
        <div class="j2c-settings-bar">
          <div class="settings-primary-grid">
            <!-- Delimiter -->
            <div class="setting-item">
              <label class="setting-label">Delimiter</label>
              <CustomSelect
                v-model="delimiter"
                :options="delimiterOptions"
                class="select-sm"
              />
            </div>

            <!-- Flatten Nested Objects -->
            <div class="setting-item checkbox-item">
              <label class="j2c-checkbox-control" title="Converts nested objects like user.address.city into flat columns">
                <input v-model="flattenNested" type="checkbox" class="sr-only" />
                <span class="j2c-checkbox-box" :class="{ 'is-checked': flattenNested }">
                  <Check v-if="flattenNested" :size="12" :stroke-width="3.5" class="j2c-check-icon" />
                </span>
                <span class="j2c-checkbox-text">Flatten Nested Keys (<code>a.b</code>)</span>
              </label>
            </div>

            <!-- Include Header Row -->
            <div class="setting-item checkbox-item">
              <label class="j2c-checkbox-control">
                <input v-model="includeHeaders" type="checkbox" class="sr-only" />
                <span class="j2c-checkbox-box" :class="{ 'is-checked': includeHeaders }">
                  <Check v-if="includeHeaders" :size="12" :stroke-width="3.5" class="j2c-check-icon" />
                </span>
                <span class="j2c-checkbox-text">Include Header Row</span>
              </label>
            </div>

            <!-- Advanced Settings Toggle -->
            <button
              type="button"
              class="btn-advanced-toggle"
              @click="showAdvancedSettings = !showAdvancedSettings"
            >
              <Settings2 :size="14" />
              <span>Options</span>
              <ChevronDown :size="14" :class="{ open: showAdvancedSettings }" />
            </button>
          </div>

          <!-- Advanced Collapsible Drawer -->
          <div v-if="showAdvancedSettings" class="settings-advanced-drawer">
            <div class="advanced-grid">
              <!-- Quote Mode -->
              <div class="setting-item">
                <label class="setting-label">Quotes Style</label>
                <CustomSelect
                  v-model="quoteMode"
                  :options="quoteModeOptions"
                  class="select-sm"
                />
              </div>

              <!-- Excel UTF-8 BOM -->
              <div class="setting-item checkbox-item">
                <label class="j2c-checkbox-control" title="Adds UTF-8 Byte Order Mark so Microsoft Excel opens non-English characters cleanly">
                  <input v-model="excelBom" type="checkbox" class="sr-only" />
                  <span class="j2c-checkbox-box" :class="{ 'is-checked': excelBom }">
                    <Check v-if="excelBom" :size="12" :stroke-width="3.5" class="j2c-check-icon" />
                  </span>
                  <span class="j2c-checkbox-text">Excel UTF-8 BOM (Fix Encoding)</span>
                </label>
              </div>

              <!-- Output Filename -->
              <div class="setting-item">
                <label class="setting-label">Output Filename</label>
                <input
                  v-model="outputFilename"
                  type="text"
                  class="input-sm"
                  placeholder="data.csv"
                />
              </div>

              <!-- Excel Row Limit Splitting -->
              <div class="setting-item">
                <label class="setting-label" title="Excel caps rows at 1,048,576. Auto-split ensures large datasets open without errors.">
                  Excel Splitting
                </label>
                <CustomSelect
                  v-model="splitMode"
                  :options="splitModeOptions"
                  class="select-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Primary Action Button -->
        <div class="j2c-actions-bar">
          <button
            type="button"
            class="btn-convert-primary"
            :disabled="busy"
            @click="executeConversion"
          >
            <LoaderCircle v-if="busy" :size="18" class="spin" />
            <Zap v-else :size="18" />
            <span>{{ busy ? 'Converting...' : 'Convert to CSV' }}</span>
          </button>
        </div>

        <!-- Error Alert -->
        <div v-if="error" class="j2c-alert error">
          <CircleAlert :size="18" />
          <div class="alert-content">
            <strong>Conversion Failed</strong>
            <p>{{ error }}</p>
          </div>
          <button type="button" class="alert-close" aria-label="Dismiss error" @click="error = ''">
            <X :size="16" />
          </button>
        </div>
      </section>

      <!-- RESULTS SECTION (Right / Bottom) -->
      <section v-if="result" class="j2c-output-card">
        <!-- Results Header & Metrics -->
        <div class="j2c-output-header">
          <div class="output-stats">
            <div class="stat-badge">
              <Table :size="14" />
              <span><strong>{{ result.rowsCount.toLocaleString() }}</strong> Rows</span>
            </div>
            <div class="stat-badge">
              <Layers :size="14" />
              <span><strong>{{ result.colsCount }}</strong> Columns</span>
            </div>
            <div class="stat-badge speed">
              <Clock :size="14" />
              <span>⚡ {{ result.durationMs }}ms</span>
            </div>
            <div class="stat-badge size">
              <span>{{ formatSize(result.byteSize) }}</span>
            </div>
          </div>

          <!-- View Tabs (Table vs CSV Code) -->
          <div class="view-mode-tabs">
            <button
              type="button"
              class="view-btn"
              :class="{ active: outputViewMode === 'table' }"
              @click="outputViewMode = 'table'"
            >
              <Table :size="15" /> Table View
            </button>
            <button
              type="button"
              class="view-btn"
              :class="{ active: outputViewMode === 'code' }"
              @click="outputViewMode = 'code'"
            >
              <Code2 :size="15" /> CSV Text
            </button>
          </div>
        </div>

        <!-- DOWNLOAD & COPY ACTION BAR -->
        <div class="j2c-download-strip">
          <div class="filename-preview">
            <FileSpreadsheet :size="16" />
            <span class="name">{{ outputFilename || 'data.csv' }}</span>
          </div>

          <div class="download-actions">
            <button
              type="button"
              class="btn-copy"
              :class="{ copied: copiedCode }"
              @click="copyCsvToClipboard"
            >
              <Check v-if="copiedCode" :size="16" />
              <Copy v-else :size="16" />
              <span>{{ copiedCode ? 'Copied!' : 'Copy CSV' }}</span>
            </button>

            <!-- Download All as ZIP (shown when split into parts) -->
            <button
              v-if="result.isSplit"
              type="button"
              class="btn-download-zip"
              :disabled="busy"
              @click="downloadAllPartsZip"
              title="Download all split CSV files as a single ZIP archive"
            >
              <Archive :size="16" />
              <span>Download ZIP ({{ result.parts.length }} Files)</span>
            </button>

            <button
              type="button"
              class="btn-download-primary"
              @click="downloadCsv"
              :title="result.isSplit ? 'Download single merged master CSV' : 'Download CSV file'"
            >
              <Download :size="16" />
              <span>{{ result.isSplit ? 'Download Full CSV' : 'Download CSV' }}</span>
            </button>
          </div>
        </div>

        <!-- EXCEL ROW LIMIT SPLIT BANNER -->
        <div v-if="result.isSplit" class="excel-split-card">
          <div class="split-card-header">
            <div class="split-icon-badge">
              <FileSpreadsheet :size="24" />
            </div>
            <div class="split-header-text">
              <h4>Dataset Split into {{ result.parts.length }} Files for Excel Compatibility</h4>
              <p>
                Microsoft Excel supports a maximum of <strong>1,048,576 rows</strong> per sheet. Because your dataset has <strong>{{ result.rowsCount.toLocaleString() }} total rows</strong>, We Make PDF split your data into <strong>{{ result.parts.length }} clean CSV files</strong> with headers intact so each file opens smoothly in Excel.
              </p>
            </div>
            <button
              type="button"
              class="btn-zip-pill"
              :disabled="busy"
              @click="downloadAllPartsZip"
            >
              <Archive :size="15" />
              <span>Download All as ZIP</span>
            </button>
          </div>

          <div class="split-parts-grid">
            <div
              v-for="part in result.parts"
              :key="part.partNumber"
              class="split-part-card"
            >
              <div class="part-card-left">
                <span class="part-number-pill">Part {{ part.partNumber }}</span>
                <div class="part-meta-block">
                  <span class="part-filename">{{ part.filename }}</span>
                  <span class="part-sub">Rows {{ part.startRowIndex.toLocaleString() }} – {{ part.endRowIndex.toLocaleString() }} ({{ part.rowsCount.toLocaleString() }} rows) • {{ formatSize(part.byteSize) }}</span>
                </div>
              </div>
              <button
                type="button"
                class="btn-part-download"
                @click="downloadPartCsv(part)"
              >
                <Download :size="14" />
                <span>Download Part {{ part.partNumber }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- PREVIEW CONTENT -->
        <!-- 1. TABLE PREVIEW -->
        <div v-if="outputViewMode === 'table'" class="table-preview-pane">
          <!-- Table Search & Filter Bar -->
          <div class="table-controls-bar">
            <div class="search-input-wrap">
              <Search :size="14" class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search across columns and values..."
                class="table-search-input"
              />
              <button
                v-if="searchQuery"
                type="button"
                class="search-clear"
                @click="searchQuery = ''"
              >
                <X :size="13" />
              </button>
            </div>

            <div class="table-rows-info">
              <span>Showing {{ filteredTableRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1 }}–{{ Math.min(currentPage * rowsPerPage, filteredTableRows.length) }} of {{ filteredTableRows.length.toLocaleString() }} records</span>
              <span v-if="filteredTableRows.length !== result.rowsCount" class="filter-count">
                (filtered from {{ result.rowsCount.toLocaleString() }} total)
              </span>
              <label class="rows-select-label">
                <span>Per page:</span>
                <select v-model.number="rowsPerPage" class="rows-select-input">
                  <option v-for="n in rowsPerPageOptions" :key="n" :value="n">{{ n }}</option>
                </select>
              </label>
            </div>
          </div>

          <!-- Data Grid -->
          <div class="table-scroll-container">
            <table class="j2c-table">
              <thead>
                <tr>
                  <th class="th-index">#</th>
                  <th
                    v-for="col in result.headers"
                    :key="col"
                    class="th-col"
                  >
                    {{ col }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in paginatedRows"
                  :key="idx"
                  class="tr-data"
                >
                  <td class="td-index">
                    {{ (currentPage - 1) * rowsPerPage + idx + 1 }}
                  </td>
                  <td
                    v-for="col in result.headers"
                    :key="col"
                    class="td-val"
                  >
                    <span :title="String(row[col] ?? '')">
                      {{ row[col] === null || row[col] === undefined ? '' : row[col] }}
                    </span>
                  </td>
                </tr>
                <tr v-if="paginatedRows.length === 0">
                  <td :colspan="result.headers.length + 1" class="td-empty">
                    No matching records found for "{{ searchQuery }}".
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div v-if="totalPages > 1" class="table-pagination">
            <span class="pagination-info">Page {{ currentPage }} of {{ totalPages }}</span>
            <div class="pagination-btns">
              <button
                type="button"
                class="btn-page"
                :disabled="currentPage <= 1"
                @click="currentPage--"
              >
                Prev
              </button>
              <button
                type="button"
                class="btn-page"
                :disabled="currentPage >= totalPages"
                @click="currentPage++"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <!-- 2. RAW CSV CODE PREVIEW -->
        <div v-else class="code-preview-pane">
          <textarea
            :value="result.csv"
            class="csv-code-view"
            readonly
            spellcheck="false"
          />
        </div>
      </section>
    </div>

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="toastMessage" class="j2c-toast" role="status">
        <Check :size="16" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.j2c-wrapper {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 16px 40px -12px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  color: #0f172a;
}

html[data-theme='dark'] .j2c-wrapper {
  background: #111827;
  border-color: #273449;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.45);
  color: #f1f5f9;
}

/* TABS HEADER */
.j2c-tabs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

html[data-theme='dark'] .j2c-tabs-header {
  background: #0b1220;
  border-color: #273449;
}

.j2c-tabs-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #e2e8f0;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
}

html[data-theme='dark'] .j2c-tabs-pills {
  background: #111827;
  border-color: #334155;
}

.j2c-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 9px;
  border: 1px solid transparent;
  background: transparent;
  color: #475569;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 40px;
}

.j2c-tab-btn:hover {
  color: #0f172a;
  background: rgba(255, 255, 255, 0.6);
}

.j2c-tab-btn.active {
  background: #2563eb !important;
  color: #ffffff !important;
  border-color: #2563eb !important;
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.35);
}

.j2c-tab-btn.active:hover {
  background: #1d4ed8 !important;
  color: #ffffff !important;
}

html[data-theme='dark'] .j2c-tab-btn {
  color: #94a3b8;
}

html[data-theme='dark'] .j2c-tab-btn:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.06);
}

html[data-theme='dark'] .j2c-tab-btn.active {
  background: #3b82f6 !important;
  color: #ffffff !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.4);
}

.j2c-file-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.28);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 700;
}

.j2c-speed-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
  font-size: 0.8rem;
  font-weight: 600;
}

html[data-theme='dark'] .j2c-speed-pill {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.3);
}

.zap-icon {
  color: #10b981;
}

/* WORKSPACE */
.j2c-workspace {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
}

/* INPUT CARD */
.j2c-input-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* DROPZONE */
.j2c-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: center;
  outline: none;
}

.j2c-dropzone:hover,
.j2c-dropzone.is-dragging {
  border-color: #2563eb;
  background: #eff6ff;
  transform: translateY(-1px);
}

html[data-theme='dark'] .j2c-dropzone {
  background: #0b1220;
  border-color: #334155;
}

html[data-theme='dark'] .j2c-dropzone:hover,
html[data-theme='dark'] .j2c-dropzone.is-dragging {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.06);
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
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(16, 185, 129, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  margin-bottom: 4px;
}

html[data-theme='dark'] .dropzone-icon-glow {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(16, 185, 129, 0.25));
  color: #60a5fa;
}

.dropzone-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text, #0f172a);
  margin: 0;
  line-height: 1.3;
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
  background: #2563eb;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  margin-top: 6px;
  transition: transform 0.15s ease, background 0.15s ease;
}

.dropzone-browse-btn:hover {
  transform: translateY(-1px);
  background: #1d4ed8;
}

html[data-theme='dark'] .dropzone-browse-btn {
  background: #3b82f6;
}

html[data-theme='dark'] .dropzone-browse-btn:hover {
  background: #2563eb;
}

.dropzone-formats {
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
  margin-top: 4px;
}

/* FILE LOADED CARD */
.j2c-file-loaded {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

html[data-theme='dark'] .j2c-file-loaded {
  background: #0b1220;
  border-color: #334155;
}

.j2c-file-loaded-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.j2c-file-loaded-info {
  flex: 1;
  min-width: 200px;
}

.file-name {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.98rem;
  word-break: break-all;
}

html[data-theme='dark'] .file-name {
  color: #f8fafc;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 2px;
}

html[data-theme='dark'] .file-meta {
  color: #94a3b8;
}

.security-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #059669;
  font-weight: 600;
}

.j2c-file-loaded-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

html[data-theme='dark'] .btn-icon {
  background: #111827;
  border-color: #334155;
  color: #94a3b8;
}

.btn-action-sm {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #1e293b;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action-sm:hover {
  border-color: #2563eb;
  color: #2563eb;
}

html[data-theme='dark'] .btn-action-sm {
  background: #111827;
  border-color: #475569;
  color: #f1f5f9;
}

/* TEXT EDITOR PANE */
.j2c-text-pane {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
}

html[data-theme='dark'] .j2c-text-pane {
  background: #0b1220;
  border-color: #334155;
}

.j2c-editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

html[data-theme='dark'] .j2c-editor-toolbar {
  background: #111827;
  border-color: #334155;
}

.template-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tool-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

html[data-theme='dark'] .tool-label {
  color: #94a3b8;
}

.template-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tpl-btn {
  padding: 5px 11px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tpl-btn:hover {
  color: #0f172a;
  border-color: #94a3b8;
}

.tpl-btn.active {
  background: #2563eb !important;
  color: #ffffff !important;
  border-color: #2563eb !important;
}

html[data-theme='dark'] .tpl-btn {
  background: #111827;
  border-color: #475569;
  color: #cbd5e1;
}

html[data-theme='dark'] .tpl-btn:hover {
  color: #f8fafc;
  border-color: #64748b;
}

html[data-theme='dark'] .tpl-btn.active {
  background: #3b82f6 !important;
  color: #ffffff !important;
  border-color: #3b82f6 !important;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-tool {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-tool:hover {
  color: #2563eb;
  border-color: #2563eb;
}

html[data-theme='dark'] .btn-tool {
  background: #111827;
  border-color: #475569;
  color: #cbd5e1;
}

html[data-theme='dark'] .btn-tool:hover {
  color: #38bdf8;
  border-color: #38bdf8;
}

.j2c-editor-box {
  display: flex;
  position: relative;
  min-height: 240px;
  max-height: 400px;
  background: #ffffff;
  overflow: hidden;
}

html[data-theme='dark'] .j2c-editor-box {
  background: #0b1220;
}

.editor-lines {
  width: 44px;
  flex-shrink: 0;
  padding: 12px 6px;
  background: #f1f5f9;
  border-right: 1px solid #e2e8f0;
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  line-height: 1.5;
  text-align: right;
  overflow: hidden;
  user-select: none;
}

html[data-theme='dark'] .editor-lines {
  background: #070b14;
  border-color: #334155;
  color: #64748b;
}

.editor-textarea {
  flex: 1;
  padding: 12px 14px;
  border: none;
  background: transparent;
  color: #0f172a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.84rem;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  white-space: pre;
  overflow: auto;
  min-height: 240px;
}

html[data-theme='dark'] .editor-textarea {
  color: #f8fafc;
}

/* SETTINGS BAR */
.j2c-settings-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

html[data-theme='dark'] .j2c-settings-bar {
  background: #0b1220;
  border-color: #334155;
}

.settings-primary-grid {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setting-item.checkbox-item {
  flex-direction: row;
  align-items: center;
  margin-top: 2px;
}

.setting-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

html[data-theme='dark'] .setting-label {
  color: #94a3b8;
}

.select-sm {
  min-width: 150px;
}

/* BULLETPROOF CHECKBOXES */
.j2c-checkbox-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.j2c-checkbox-box {
  width: 19px;
  height: 19px;
  border-radius: 5px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.j2c-checkbox-control:hover .j2c-checkbox-box {
  border-color: #2563eb;
}

.j2c-checkbox-box.is-checked {
  background: #2563eb !important;
  border-color: #2563eb !important;
}

.j2c-check-icon {
  color: #ffffff !important;
}

.j2c-checkbox-text {
  font-size: 0.86rem;
  font-weight: 550;
  color: #0f172a;
}

.j2c-checkbox-text code {
  padding: 1px 5px;
  border-radius: 4px;
  background: #e2e8f0;
  color: #1e293b;
  font-size: 0.8rem;
}

html[data-theme='dark'] .j2c-checkbox-box {
  background: #111827;
  border-color: #475569;
}

html[data-theme='dark'] .j2c-checkbox-control:hover .j2c-checkbox-box {
  border-color: #38bdf8;
}

html[data-theme='dark'] .j2c-checkbox-box.is-checked {
  background: #3b82f6 !important;
  border-color: #3b82f6 !important;
}

html[data-theme='dark'] .j2c-checkbox-text {
  color: #f1f5f9;
}

html[data-theme='dark'] .j2c-checkbox-text code {
  background: #334155;
  color: #93c5fd;
}

.btn-advanced-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-left: auto;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-advanced-toggle:hover {
  color: #0f172a;
  border-color: #94a3b8;
}

.btn-advanced-toggle svg.open {
  transform: rotate(180deg);
}

html[data-theme='dark'] .btn-advanced-toggle {
  background: #111827;
  border-color: #475569;
  color: #cbd5e1;
}

html[data-theme='dark'] .btn-advanced-toggle:hover {
  color: #f8fafc;
  border-color: #64748b;
}

.settings-advanced-drawer {
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

html[data-theme='dark'] .settings-advanced-drawer {
  border-color: #334155;
}

.advanced-grid {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.input-sm {
  height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.85rem;
  outline: none;
  min-width: 160px;
}

.input-sm:focus {
  border-color: #2563eb;
}

html[data-theme='dark'] .input-sm {
  background: #111827;
  border-color: #475569;
  color: #f8fafc;
}

html[data-theme='dark'] .input-sm:focus {
  border-color: #38bdf8;
}

/* ACTIONS BAR */
.j2c-actions-bar {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-convert-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  max-width: 320px;
  min-height: 48px;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 20px -4px rgba(16, 185, 129, 0.4);
  transition: all 0.25s ease;
}

.btn-convert-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px -4px rgba(16, 185, 129, 0.5);
}

.btn-convert-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ALERTS */
.j2c-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.88rem;
}

.j2c-alert.error {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
}

.alert-content strong {
  display: block;
  margin-bottom: 2px;
}

.alert-content p {
  margin: 0;
  font-size: 0.84rem;
  color: #0f172a;
}

html[data-theme='dark'] .alert-content p {
  color: #f8fafc;
}

.alert-close {
  margin-left: auto;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  padding: 2px;
}

/* OUTPUT CARD */
.j2c-output-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-top: 1px solid #e2e8f0;
  padding-top: 24px;
}

html[data-theme='dark'] .j2c-output-card {
  border-color: #273449;
}

.j2c-output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.output-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 0.82rem;
  color: #64748b;
}

.stat-badge strong {
  color: #0f172a;
}

html[data-theme='dark'] .stat-badge {
  background: #0b1220;
  border-color: #334155;
  color: #94a3b8;
}

html[data-theme='dark'] .stat-badge strong {
  color: #f8fafc;
}

.stat-badge.speed {
  background: #ecfdf5;
  color: #047857;
  font-weight: 600;
  border-color: #a7f3d0;
}

html[data-theme='dark'] .stat-badge.speed {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.3);
}

.stat-badge.size {
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.view-mode-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

html[data-theme='dark'] .view-mode-tabs {
  background: #0b1220;
  border-color: #334155;
}

.view-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

html[data-theme='dark'] .view-btn {
  color: #94a3b8;
}

html[data-theme='dark'] .view-btn.active {
  background: #1e293b;
  color: #f8fafc;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}

/* DOWNLOAD STRIP */
.j2c-download-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 18px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

html[data-theme='dark'] .j2c-download-strip {
  background: #0b1220;
  border-color: #334155;
}

.filename-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #0f172a;
  font-size: 0.9rem;
}

html[data-theme='dark'] .filename-preview {
  color: #f8fafc;
}

.download-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-copy:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.btn-copy.copied {
  background: rgba(16, 185, 129, 0.12);
  border-color: #10b981;
  color: #059669;
}

html[data-theme='dark'] .btn-copy {
  background: #111827;
  border-color: #475569;
  color: #f8fafc;
}

html[data-theme='dark'] .btn-copy:hover {
  border-color: #38bdf8;
  color: #38bdf8;
}

.btn-download-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
  transition: all 0.2s ease;
}

.btn-download-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.45);
}

.btn-download-zip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #3b82f6;
  background: #2563eb;
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
  transition: all 0.2s ease;
}

.btn-download-zip:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #1d4ed8;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.45);
}

.btn-download-zip:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* EXCEL SPLIT CARD */
.excel-split-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(16, 185, 129, 0.05));
  border: 1px solid rgba(37, 99, 235, 0.2);
  margin-block: 4px;
}

html[data-theme='dark'] .excel-split-card {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(16, 185, 129, 0.08));
  border-color: rgba(59, 130, 246, 0.3);
}

.split-card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
}

.split-icon-badge {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
  flex-shrink: 0;
}

html[data-theme='dark'] .split-icon-badge {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.split-header-text {
  flex: 1;
  min-width: 240px;
}

.split-header-text h4 {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

html[data-theme='dark'] .split-header-text h4 {
  color: #f8fafc;
}

.split-header-text p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: #475569;
}

html[data-theme='dark'] .split-header-text p {
  color: #94a3b8;
}

.btn-zip-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  border: none;
  background: #2563eb;
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-zip-pill:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #1d4ed8;
}

.split-parts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
  margin-top: 4px;
}

.split-part-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

html[data-theme='dark'] .split-part-card {
  background: #0f172a;
  border-color: #334155;
  box-shadow: none;
}

.part-card-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.part-number-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

html[data-theme='dark'] .part-number-pill {
  background: rgba(37, 99, 235, 0.2);
  color: #93c5fd;
}

.part-meta-block {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.part-filename {
  font-size: 0.84rem;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

html[data-theme='dark'] .part-filename {
  color: #f8fafc;
}

.part-sub {
  font-size: 0.72rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

html[data-theme='dark'] .part-sub {
  color: #94a3b8;
}

.btn-part-download {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-part-download:hover {
  border-color: #2563eb;
  background: #eff6ff;
  color: #2563eb;
}

html[data-theme='dark'] .btn-part-download {
  background: #1e293b;
  border-color: #475569;
  color: #f1f5f9;
}

html[data-theme='dark'] .btn-part-download:hover {
  background: rgba(37, 99, 235, 0.2);
  border-color: #3b82f6;
  color: #93c5fd;
}

/* TABLE VIEW PANE */
.table-preview-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}

html[data-theme='dark'] .table-preview-pane {
  background: #0b1220;
  border-color: #334155;
}

.table-controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

html[data-theme='dark'] .table-controls-bar {
  background: #111827;
  border-color: #334155;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 10px;
  width: 100%;
  max-width: 320px;
}

html[data-theme='dark'] .search-input-wrap {
  background: #0b1220;
  border-color: #475569;
}

.search-icon {
  color: #64748b;
}

html[data-theme='dark'] .search-icon {
  color: #94a3b8;
}

.table-search-input {
  border: none;
  background: transparent;
  color: #0f172a;
  font-size: 0.82rem;
  height: 32px;
  width: 100%;
  outline: none;
}

html[data-theme='dark'] .table-search-input {
  color: #f8fafc;
}

.search-clear {
  border: none;
  background: none;
  color: #64748b;
  cursor: pointer;
  padding: 0;
}

.table-rows-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.8rem;
  color: #64748b;
  flex-wrap: wrap;
}

html[data-theme='dark'] .table-rows-info {
  color: #94a3b8;
}

.filter-count {
  color: #2563eb;
  font-weight: 600;
}

html[data-theme='dark'] .filter-count {
  color: #60a5fa;
}

.rows-select-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #64748b;
}

html[data-theme='dark'] .rows-select-label {
  color: #94a3b8;
}

.rows-select-input {
  height: 28px;
  padding: 0 6px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.78rem;
  outline: none;
  cursor: pointer;
}

html[data-theme='dark'] .rows-select-input {
  background: #0f172a;
  border-color: #475569;
  color: #f8fafc;
}

.table-scroll-container {
  max-height: 380px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.j2c-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
  text-align: left;
}

.j2c-table th {
  position: sticky;
  top: 0;
  background: #f1f5f9;
  padding: 10px 14px;
  font-weight: 700;
  color: #0f172a;
  border-bottom: 1px solid #cbd5e1;
  white-space: nowrap;
  z-index: 2;
}

html[data-theme='dark'] .j2c-table th {
  background: #111827;
  color: #f8fafc;
  border-color: #334155;
}

.th-index {
  width: 44px;
  text-align: center;
  color: #64748b;
}

html[data-theme='dark'] .th-index {
  color: #94a3b8;
}

.j2c-table td {
  padding: 9px 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

html[data-theme='dark'] .j2c-table td {
  color: #cbd5e1;
  border-color: #1f293d;
}

.td-index {
  text-align: center;
  color: #64748b;
  font-size: 0.76rem;
  background: #f8fafc;
}

html[data-theme='dark'] .td-index {
  background: #0e1526;
  color: #94a3b8;
}

.tr-data:hover td {
  background: #f8fafc;
}

html[data-theme='dark'] .tr-data:hover td {
  background: #162032;
}

.td-empty {
  text-align: center;
  padding: 32px;
  color: #64748b;
}

html[data-theme='dark'] .td-empty {
  color: #94a3b8;
}

.table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

html[data-theme='dark'] .table-pagination {
  background: #111827;
  border-color: #334155;
}

.pagination-info {
  font-size: 0.8rem;
  color: #64748b;
}

html[data-theme='dark'] .pagination-info {
  color: #94a3b8;
}

.pagination-btns {
  display: flex;
  gap: 6px;
}

.btn-page {
  padding: 4px 11px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

html[data-theme='dark'] .btn-page {
  background: #0b1220;
  border-color: #475569;
  color: #f8fafc;
}

/* CODE VIEW PANE */
.code-preview-pane {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}

html[data-theme='dark'] .code-preview-pane {
  background: #070b14;
  border-color: #334155;
}

.csv-code-view {
  width: 100%;
  height: 320px;
  padding: 14px;
  border: none;
  background: transparent;
  color: #0f172a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82rem;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  white-space: pre;
  overflow: auto;
}

html[data-theme='dark'] .csv-code-view {
  color: #f8fafc;
}

/* TOAST */
.j2c-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  background: #0f172a;
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 600;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 9999;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* RESPONSIVE DESIGN FOR MOBILE */
@media (max-width: 768px) {
  .j2c-tabs-header {
    flex-direction: column;
    align-items: stretch;
  }

  .j2c-tabs-pills {
    width: 100%;
    display: flex;
  }

  .j2c-tab-btn {
    flex: 1;
    justify-content: center;
    font-size: 0.82rem;
    padding: 8px 10px;
  }

  .j2c-workspace {
    padding: 16px;
    gap: 16px;
  }

  .j2c-dropzone {
    padding: 32px 16px;
  }

  .j2c-editor-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .editor-actions {
    justify-content: flex-end;
  }

  .settings-primary-grid {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-advanced-toggle {
    margin-left: 0;
    justify-content: center;
  }

  .j2c-output-header {
    flex-direction: column;
    align-items: stretch;
  }

  .view-mode-tabs {
    width: 100%;
  }

  .view-btn {
    flex: 1;
    justify-content: center;
  }

  .j2c-download-strip {
    flex-direction: column;
    align-items: stretch;
  }

  .download-actions {
    width: 100%;
  }

  .btn-copy,
  .btn-download-primary {
    flex: 1;
    justify-content: center;
  }

  .btn-convert-primary {
    max-width: 100%;
  }
}
</style>

