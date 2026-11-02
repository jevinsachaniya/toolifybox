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
  convertCsvToJson,
  csvToJsonFilename,
  CSV_JSON_DELIMITERS,
  CSV_JSON_INDENT_OPTIONS,
  CSV_JSON_OUTPUT_MODES,
  SAMPLE_CSV_TEMPLATES,
  validateCsvInput,
} from '~/utils/csv-to-json.js';

// Input Mode: 'file' | 'text'
const inputMode = ref('file');

// Text Mode State
const rawCsvText = ref(SAMPLE_CSV_TEMPLATES[0].csv);
const selectedTemplateId = ref('ecommerce');
const editorLineCount = computed(() => {
  if (!rawCsvText.value) return 1;
  return rawCsvText.value.split('\n').length;
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
const delimiter = ref('auto');
const hasHeaders = ref(true);
const parseTypes = ref(true);
const unflattenNested = ref(true);
const outputFormat = ref('array');
const indent = ref(2);
const trimValues = ref(true);
const showAdvancedSettings = ref(false);
const outputFilename = ref('data.json');

// Output & Preview State
const busy = ref(false);
const result = ref(null);
const error = ref('');
const toastMessage = ref('');
let toastTimer = null;

// Output View: 'code' | 'table'
const outputViewMode = ref('code');
const searchQuery = ref('');
const currentPage = ref(1);
const rowsPerPage = ref(15);
const rowsPerPageOptions = [15, 25, 50, 100];
const copiedCode = ref(false);

const delimiterOptions = CSV_JSON_DELIMITERS.map(d => ({
  value: d.value,
  label: d.label,
}));

const outputModeOptions = CSV_JSON_OUTPUT_MODES.map(m => ({
  value: m.value,
  label: m.label,
}));

const indentOptions = CSV_JSON_INDENT_OPTIONS.map(i => ({
  value: i.value,
  label: i.label,
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
  const t = SAMPLE_CSV_TEMPLATES.find(item => item.id === templateId);
  if (t) {
    rawCsvText.value = t.csv;
    outputFilename.value = `${t.id}.json`;
    error.value = '';
    showToast(`Loaded ${t.title} template`);
  }
}

// Clear text
function clearText() {
  rawCsvText.value = '';
  result.value = null;
  error.value = '';
}

// Paste from clipboard
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      rawCsvText.value = text;
      showToast('Pasted CSV from clipboard');
    }
  } catch {
    showToast('Clipboard access denied');
  }
}

// File drop & selection handlers
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
    isDragging.value = false;
    dragDepth = 0;
  }
}

function onDrop(e) {
  e.preventDefault();
  isDragging.value = false;
  dragDepth = 0;

  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFile(files[0]);
  }
}

function onFileInputChange(e) {
  const files = e.target?.files;
  if (files && files.length > 0) {
    handleFile(files[0]);
  }
}

function triggerFilePicker() {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

function handleFile(file) {
  const name = file.name.toLowerCase();
  const validExts = ['.csv', '.tsv', '.txt'];
  const isValid = validExts.some(ext => name.endsWith(ext));

  if (!isValid && file.type && !file.type.includes('csv') && !file.type.includes('text')) {
    error.value = 'Please select a valid CSV, TSV, or plain text delimited file.';
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    error.value = 'File exceeds maximum limit of 50 MB for in-browser processing.';
    return;
  }

  uploadedFile.value = file;
  uploadedFileName.value = file.name;
  uploadedFileSize.value = file.size;
  outputFilename.value = csvToJsonFilename(file.name, outputFormat.value === 'ndjson');
  error.value = '';
  busy.value = true;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const text = event.target?.result;
      if (typeof text === 'string') {
        fileTextContent.value = text;
        rawCsvText.value = text;
        runConversion(text);
      }
    } catch (err) {
      error.value = err?.message || 'Failed to read uploaded file.';
      busy.value = false;
    }
  };
  reader.onerror = () => {
    error.value = 'Error reading file.';
    busy.value = false;
  };
  reader.readAsText(file);
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

// Execute CSV to JSON Conversion
function runConversion(contentToConvert) {
  const source = contentToConvert !== undefined
    ? contentToConvert
    : inputMode.value === 'file' && fileTextContent.value
      ? fileTextContent.value
      : rawCsvText.value;

  const valid = validateCsvInput(source);
  if (!valid.valid) {
    error.value = valid.error;
    result.value = null;
    return;
  }

  busy.value = true;
  error.value = '';

  // Use nextTick / setTimeout to yield to UI thread
  setTimeout(() => {
    try {
      const res = convertCsvToJson(source, {
        delimiter: delimiter.value,
        hasHeaders: hasHeaders.value,
        parseNumbersAndBooleans: parseTypes.value,
        unflattenNested: unflattenNested.value,
        outputFormat: outputFormat.value,
        indent: Number(indent.value),
        trimValues: trimValues.value,
      });

      result.value = res;
      currentPage.value = 1;
      outputFilename.value = csvToJsonFilename(
        uploadedFileName.value || 'data.csv',
        outputFormat.value === 'ndjson'
      );
      showToast(`Successfully converted ${res.rowsCount.toLocaleString()} rows (${res.durationMs}ms)`);
    } catch (err) {
      error.value = err?.message || 'Failed to convert CSV to JSON.';
      result.value = null;
    } finally {
      busy.value = false;
    }
  }, 10);
}

// Copy JSON Output to Clipboard
async function copyJsonOutput() {
  if (!result.value?.json) return;
  try {
    await navigator.clipboard.writeText(result.value.json);
    copiedCode.value = true;
    showToast('JSON copied to clipboard!');
    setTimeout(() => {
      copiedCode.value = false;
    }, 2400);
  } catch {
    showToast('Failed to copy to clipboard');
  }
}

// Download JSON / NDJSON File
function downloadJsonFile() {
  if (!result.value?.json) return;
  const isNdjson = outputFormat.value === 'ndjson';
  const mime = isNdjson ? 'application/x-ndjson;charset=utf-8;' : 'application/json;charset=utf-8;';
  const blob = new Blob([result.value.json], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = outputFilename.value || (isNdjson ? 'data.ndjson' : 'data.json');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`Downloaded ${a.download}`);
}

// Filtered Table Rows for Preview
const filteredPreviewRows = computed(() => {
  if (!result.value?.previewRows) return [];
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return result.value.previewRows;

  return result.value.previewRows.filter(row => {
    return Object.values(row).some(val => {
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(q);
    });
  });
});

const paginatedPreviewRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredPreviewRows.value.slice(start, start + rowsPerPage.value);
});

const totalPages = computed(() => {
  return Math.ceil(filteredPreviewRows.value.length / rowsPerPage.value) || 1;
});

// Auto-convert on initial load for preview
onMounted(() => {
  if (rawCsvText.value) {
    runConversion(rawCsvText.value);
  }
});

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<template>
  <div class="c2j-wrapper">
    <!-- Top Mode Switcher -->
    <div class="c2j-tabs-header">
      <div class="c2j-tabs-pills">
        <button
          type="button"
          class="c2j-tab-btn"
          :class="{ active: inputMode === 'file' }"
          @click="inputMode = 'file'"
        >
          <FileUp :size="15" />
          <span>Upload File</span>
        </button>
        <button
          type="button"
          class="c2j-tab-btn"
          :class="{ active: inputMode === 'text' }"
          @click="inputMode = 'text'"
        >
          <Code2 :size="15" />
          <span>Paste / Type CSV</span>
        </button>
      </div>

      <div v-if="uploadedFileName && inputMode === 'file'" class="c2j-file-badge">
        <FileSpreadsheet :size="14" />
        <span class="file-name">{{ uploadedFileName }}</span>
        <span class="file-size">({{ formatSize(uploadedFileSize) }})</span>
        <button type="button" class="remove-file-btn" title="Remove File" @click="removeUploadedFile">
          <X :size="13" />
        </button>
      </div>
    </div>

    <!-- Workspace Area -->
    <div class="c2j-workspace">
      <!-- File Mode: Dropzone -->
      <div
        v-if="inputMode === 'file' && !uploadedFile"
        class="c2j-dropzone"
        :class="{ dragging: isDragging }"
        @dragenter="onDragEnter"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @click="triggerFilePicker"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
          style="display: none;"
          @change="onFileInputChange"
        />

        <div class="c2j-dropzone-inner">
          <div class="c2j-upload-icon-circle">
            <UploadCloud :size="32" />
          </div>
          <h3 class="c2j-dropzone-title">Select or Drop CSV / TSV File</h3>
          <p class="c2j-dropzone-subtitle">Convert CSV, TSV, or TXT documents to clean JSON with 100% in-browser privacy.</p>

          <button type="button" class="c2j-primary-upload-btn" @click.stop="triggerFilePicker">
            <FileSpreadsheet :size="16" />
            <span>Choose CSV Document</span>
          </button>

          <div class="c2j-dropzone-hints">
            <span><ShieldCheck :size="13" /> Zero Server Uploads</span>
            <span>&bull;</span>
            <span>Up to 50 MB</span>
            <span>&bull;</span>
            <span>RFC 4180 Compliant</span>
          </div>
        </div>

        <!-- Sample Dataset Shortcuts -->
        <div class="c2j-sample-shortcuts" @click.stop>
          <span class="sample-label">Or try with sample data:</span>
          <div class="c2j-template-pills">
            <button
              v-for="tmpl in SAMPLE_CSV_TEMPLATES"
              :key="tmpl.id"
              type="button"
              class="c2j-sample-pill"
              @click="loadTemplate(tmpl.id); inputMode = 'text'; runConversion(tmpl.csv)"
            >
              {{ tmpl.title }}
            </button>
          </div>
        </div>
      </div>

      <!-- File Mode: Loaded Summary Card -->
      <div v-else-if="inputMode === 'file' && uploadedFile" class="c2j-loaded-file-card">
        <div class="loaded-file-info">
          <div class="file-icon-box">
            <FileSpreadsheet :size="28" />
          </div>
          <div class="file-meta">
            <h4>{{ uploadedFileName }}</h4>
            <div class="file-details">
              <span>{{ formatSize(uploadedFileSize) }}</span>
              <span>&bull;</span>
              <span>CSV Document</span>
              <span>&bull;</span>
              <span class="badge-ready">Loaded in memory</span>
            </div>
          </div>
        </div>

        <div class="loaded-file-actions">
          <button type="button" class="tool-btn secondary" @click="inputMode = 'text'">
            <Eye :size="14" />
            <span>Edit in Text Mode</span>
          </button>
          <button type="button" class="tool-btn danger" @click="removeUploadedFile">
            <Trash2 :size="14" />
            <span>Change File</span>
          </button>
        </div>
      </div>

      <!-- Text Mode: CSV Textarea Editor -->
      <div v-if="inputMode === 'text'" class="c2j-editor-card">
        <div class="c2j-editor-toolbar">
          <div class="editor-title-wrap">
            <Code2 :size="15" />
            <span>CSV Source Editor</span>
            <span class="editor-line-badge">{{ editorLineCount }} lines</span>
          </div>

          <div class="editor-actions">
            <!-- Template select -->
            <div class="template-selector">
              <label for="template-select" class="sr-only">Load Sample</label>
              <select
                id="template-select"
                v-model="selectedTemplateId"
                class="c2j-select-compact"
                @change="loadTemplate(selectedTemplateId); runConversion(rawCsvText)"
              >
                <option v-for="t in SAMPLE_CSV_TEMPLATES" :key="t.id" :value="t.id">
                  Sample: {{ t.title }}
                </option>
              </select>
            </div>

            <button type="button" class="c2j-btn-ghost" title="Paste from clipboard" @click="pasteFromClipboard">
              <Copy :size="13" />
              <span>Paste</span>
            </button>

            <button type="button" class="c2j-btn-ghost text-rose" title="Clear text" @click="clearText">
              <Trash2 :size="13" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <div class="c2j-editor-body">
          <div ref="lineNumbersRef" class="c2j-line-numbers" aria-hidden="true">
            <div v-for="n in editorLineCount" :key="n">{{ n }}</div>
          </div>
          <textarea
            v-model="rawCsvText"
            class="c2j-textarea"
            placeholder="Paste or type CSV rows here... e.g. name,age,city&#10;Alice,30,London&#10;Bob,25,Paris"
            spellcheck="false"
            @scroll="syncEditorScroll"
          />
        </div>
      </div>

      <!-- Conversion Settings Strip -->
      <div class="c2j-settings-panel">
        <div class="c2j-settings-header" @click="showAdvancedSettings = !showAdvancedSettings">
          <div class="settings-title">
            <Settings2 :size="16" />
            <span>Conversion Options &amp; Format</span>
          </div>
          <button type="button" class="c2j-btn-link">
            <span>{{ showAdvancedSettings ? 'Hide Options' : 'Customize Options' }}</span>
            <ChevronDown :size="14" :style="{ transform: showAdvancedSettings ? 'rotate(180deg)' : 'none' }" />
          </button>
        </div>

        <div class="c2j-settings-grid" :class="{ 'expanded': showAdvancedSettings }">
          <!-- Delimiter Select -->
          <div class="c2j-setting-field">
            <label class="c2j-setting-label">Delimiter</label>
            <CustomSelect
              v-model="delimiter"
              :options="delimiterOptions"
              class="c2j-custom-select"
            />
          </div>

          <!-- Output Format Select -->
          <div class="c2j-setting-field">
            <label class="c2j-setting-label">Output Structure</label>
            <CustomSelect
              v-model="outputFormat"
              :options="outputModeOptions"
              class="c2j-custom-select"
            />
          </div>

          <!-- Indentation / Minification -->
          <div class="c2j-setting-field">
            <label class="c2j-setting-label">Formatting</label>
            <CustomSelect
              v-model="indent"
              :options="indentOptions"
              class="c2j-custom-select"
            />
          </div>

          <!-- Toggles -->
          <div v-if="showAdvancedSettings" class="c2j-toggles-wrap">
            <label class="c2j-checkbox-label">
              <input v-model="hasHeaders" type="checkbox" />
              <span>First row contains headers</span>
            </label>

            <label class="c2j-checkbox-label">
              <input v-model="parseTypes" type="checkbox" />
              <span>Auto-detect Numbers &amp; Booleans</span>
            </label>

            <label class="c2j-checkbox-label">
              <input v-model="unflattenNested" type="checkbox" />
              <span>Unflatten dot keys (e.g. <code>user.name</code>)</span>
            </label>

            <label class="c2j-checkbox-label">
              <input v-model="trimValues" type="checkbox" />
              <span>Trim whitespace around cells</span>
            </label>
          </div>
        </div>

        <!-- Action Bar -->
        <div class="c2j-action-bar">
          <button
            type="button"
            class="c2j-convert-btn"
            :disabled="busy || (!rawCsvText && !fileTextContent)"
            @click="runConversion()"
          >
            <LoaderCircle v-if="busy" :size="18" class="spin" />
            <Sparkles v-else :size="18" />
            <span>{{ busy ? 'Converting...' : 'Convert CSV to JSON' }}</span>
          </button>
        </div>
      </div>

      <!-- Error Banner -->
      <div v-if="error" class="c2j-error-banner">
        <CircleAlert :size="18" />
        <div class="error-text">{{ error }}</div>
      </div>

      <!-- Results View -->
      <div v-if="result" class="c2j-output-card">
        <!-- Output Stats Bar -->
        <div class="c2j-output-header">
          <div class="c2j-stats-wrap">
            <div class="stat-pill">
              <span class="stat-num">{{ result.rowsCount.toLocaleString() }}</span>
              <span class="stat-lbl">Rows</span>
            </div>
            <div class="stat-pill">
              <span class="stat-num">{{ result.colsCount }}</span>
              <span class="stat-lbl">Columns</span>
            </div>
            <div class="stat-pill">
              <span class="stat-num">{{ formatSize(result.byteSize) }}</span>
              <span class="stat-lbl">JSON Size</span>
            </div>
            <div class="stat-pill">
              <span class="stat-num">{{ result.durationMs }}ms</span>
              <span class="stat-lbl">Speed</span>
            </div>
            <div class="stat-pill delim">
              <span class="stat-lbl">Delimiter:</span>
              <span class="stat-num">{{ result.detectedDelimiter === '\t' ? 'TAB' : result.detectedDelimiter }}</span>
            </div>
          </div>

          <!-- View Switcher -->
          <div class="c2j-output-tabs">
            <button
              type="button"
              class="out-tab-btn"
              :class="{ active: outputViewMode === 'code' }"
              @click="outputViewMode = 'code'"
            >
              <Code2 :size="14" />
              <span>JSON Code</span>
            </button>
            <button
              type="button"
              class="out-tab-btn"
              :class="{ active: outputViewMode === 'table' }"
              @click="outputViewMode = 'table'"
            >
              <Table :size="14" />
              <span>Table Preview</span>
            </button>
          </div>
        </div>

        <!-- Code View -->
        <div v-show="outputViewMode === 'code'" class="c2j-code-view">
          <div class="code-view-toolbar">
            <div class="code-title">
              <FileCode2 :size="14" />
              <span>{{ outputFormat === 'ndjson' ? 'NDJSON (JSON Lines)' : 'JSON Output' }}</span>
            </div>
            <button type="button" class="copy-btn" @click="copyJsonOutput">
              <Check v-if="copiedCode" :size="14" class="text-emerald" />
              <Copy v-else :size="14" />
              <span>{{ copiedCode ? 'Copied!' : 'Copy JSON' }}</span>
            </button>
          </div>
          <pre class="code-pre"><code>{{ result.json }}</code></pre>
        </div>

        <!-- Table View -->
        <div v-show="outputViewMode === 'table'" class="c2j-table-view">
          <div class="table-view-toolbar">
            <div class="table-search-wrap">
              <Search :size="14" />
              <input
                v-model="searchQuery"
                type="text"
                class="table-search-input"
                placeholder="Search rows..."
              />
            </div>
            <div class="table-rows-selector">
              <label>Rows per page:</label>
              <select v-model="rowsPerPage" class="rows-select" @change="currentPage = 1">
                <option v-for="opt in rowsPerPageOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
          </div>

          <div class="table-scroll-wrap">
            <table class="c2j-table">
              <thead>
                <tr>
                  <th class="col-num">#</th>
                  <th v-for="header in result.headers" :key="header">{{ header }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in paginatedPreviewRows" :key="idx">
                  <td class="col-num">{{ (currentPage - 1) * rowsPerPage + idx + 1 }}</td>
                  <td v-for="header in result.headers" :key="header">
                    <span v-if="row[header] === true" class="badge-bool true">true</span>
                    <span v-else-if="row[header] === false" class="badge-bool false">false</span>
                    <span v-else-if="row[header] === null" class="badge-null">null</span>
                    <span v-else-if="typeof row[header] === 'object'" class="badge-obj">{{ JSON.stringify(row[header]) }}</span>
                    <span v-else>{{ row[header] }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="c2j-pagination">
            <button
              type="button"
              class="page-nav-btn"
              :disabled="currentPage <= 1"
              @click="currentPage--"
            >
              Previous
            </button>
            <span class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
            <button
              type="button"
              class="page-nav-btn"
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            >
              Next
            </button>
          </div>
        </div>

        <!-- Download Action Strip -->
        <div class="c2j-download-strip">
          <div class="filename-input-group">
            <label for="out-filename">Output Filename:</label>
            <input
              id="out-filename"
              v-model="outputFilename"
              type="text"
              class="c2j-filename-input"
              placeholder="data.json"
            />
          </div>

          <div class="download-actions">
            <button type="button" class="c2j-download-btn" @click="downloadJsonFile">
              <Download :size="16" />
              <span>Download {{ outputFormat === 'ndjson' ? '.NDJSON' : '.JSON' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Transition name="fade">
      <div v-if="toastMessage" class="c2j-toast">
        <Check :size="15" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.c2j-wrapper {
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

html[data-theme='dark'] .c2j-wrapper {
  background: #111827;
  border-color: #273449;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.45);
  color: #f1f5f9;
}

/* Tabs Header */
.c2j-tabs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 12px;
}

html[data-theme='dark'] .c2j-tabs-header {
  background: #0b1220;
  border-color: #273449;
}

.c2j-tabs-pills {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #e2e8f0;
  padding: 4px;
  border-radius: 12px;
}

html[data-theme='dark'] .c2j-tabs-pills {
  background: #1e293b;
}

.c2j-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.c2j-tab-btn:hover {
  color: #0f172a;
}

html[data-theme='dark'] .c2j-tab-btn:hover {
  color: #f8fafc;
}

.c2j-tab-btn.active {
  background: #e11d48;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.25);
}

.c2j-file-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  font-size: 12px;
  color: #0f172a;
}

html[data-theme='dark'] .c2j-file-badge {
  background: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}

.c2j-file-badge .file-name {
  font-weight: 600;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.c2j-file-badge .file-size {
  color: #64748b;
}

.remove-file-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  display: grid;
  place-items: center;
  padding: 2px;
  border-radius: 4px;
}

.remove-file-btn:hover {
  color: #e11d48;
}

/* Workspace */
.c2j-workspace {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Dropzone */
.c2j-dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 44px 24px;
  background: #fafafa;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s ease;
}

html[data-theme='dark'] .c2j-dropzone {
  background: #0f172a;
  border-color: #334155;
}

.c2j-dropzone:hover,
.c2j-dropzone.dragging {
  border-color: #e11d48;
  background: #fff1f2;
}

html[data-theme='dark'] .c2j-dropzone:hover,
html[data-theme='dark'] .c2j-dropzone.dragging {
  background: rgba(225, 29, 72, 0.08);
}

.c2j-upload-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #fee2e2;
  color: #e11d48;
  display: grid;
  place-items: center;
  margin: 0 auto 16px;
}

html[data-theme='dark'] .c2j-upload-icon-circle {
  background: rgba(225, 29, 72, 0.2);
}

.c2j-dropzone-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 6px;
}

.c2j-dropzone-subtitle {
  font-size: 13.5px;
  color: #64748b;
  max-width: 480px;
  margin: 0 auto 20px;
}

.c2j-primary-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 24px;
  background: #e11d48;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25);
  transition: all 0.2s ease;
}

.c2j-primary-upload-btn:hover {
  background: #be123c;
  transform: translateY(-1px);
}

.c2j-dropzone-hints {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #94a3b8;
  margin-top: 18px;
}

.c2j-sample-shortcuts {
  margin-top: 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.sample-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.c2j-template-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.c2j-sample-pill {
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #0f172a;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

html[data-theme='dark'] .c2j-sample-pill {
  background: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}

.c2j-sample-pill:hover {
  border-color: #e11d48;
  color: #e11d48;
}

/* Loaded file summary card */
.c2j-loaded-file-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  flex-wrap: wrap;
  gap: 16px;
}

html[data-theme='dark'] .c2j-loaded-file-card {
  background: #0f172a;
  border-color: #334155;
}

.loaded-file-info {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  flex: 1;
}

.file-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.file-meta {
  min-width: 0;
  flex: 1;
}

.file-meta h4 {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}

.file-details {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  font-size: 12.5px;
  color: #64748b;
}

.file-details span {
  white-space: nowrap;
}

.badge-ready {
  color: #059669;
  font-weight: 600;
}

.loaded-file-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.tool-btn.secondary {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #0f172a;
}

html[data-theme='dark'] .tool-btn.secondary {
  background: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}

.tool-btn.danger {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #e11d48;
}

html[data-theme='dark'] .tool-btn.danger {
  background: rgba(225, 29, 72, 0.15);
  border-color: rgba(225, 29, 72, 0.3);
  color: #fda4af;
}

/* Editor Card */
.c2j-editor-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
}

html[data-theme='dark'] .c2j-editor-card {
  border-color: #273449;
  background: #0f172a;
}

.c2j-editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 10px;
}

html[data-theme='dark'] .c2j-editor-toolbar {
  background: #1e293b;
  border-color: #273449;
}

.editor-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.editor-line-badge {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #64748b;
}

html[data-theme='dark'] .editor-line-badge {
  background: #334155;
  color: #cbd5e1;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.c2j-select-compact {
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 12px;
  font-weight: 500;
}

html[data-theme='dark'] .c2j-select-compact {
  background: #0f172a;
  border-color: #334155;
  color: #f8fafc;
}

.c2j-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.c2j-btn-ghost:hover {
  background: #f1f5f9;
  color: #0f172a;
}

html[data-theme='dark'] .c2j-btn-ghost:hover {
  background: #334155;
  color: #f8fafc;
}

.c2j-btn-ghost.text-rose {
  color: #e11d48;
}

.c2j-editor-body {
  display: flex;
  height: 240px;
  overflow: hidden;
  position: relative;
}

.c2j-line-numbers {
  width: 44px;
  padding: 12px 6px;
  text-align: right;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 20px;
  color: #94a3b8;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  user-select: none;
  overflow: hidden;
}

html[data-theme='dark'] .c2j-line-numbers {
  background: #0b1220;
  border-color: #273449;
  color: #475569;
}

.c2j-textarea {
  flex: 1;
  padding: 12px 14px;
  border: none;
  background: transparent;
  color: #0f172a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  line-height: 20px;
  resize: none;
  outline: none;
  white-space: pre;
  overflow: auto;
}

html[data-theme='dark'] .c2j-textarea {
  color: #f1f5f9;
}

/* Settings Panel */
.c2j-settings-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px 20px;
  position: relative;
  overflow: visible;
}

html[data-theme='dark'] .c2j-settings-panel {
  background: #0f172a;
  border-color: #273449;
}

.c2j-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.settings-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
}

.c2j-btn-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #e11d48;
  background: transparent;
  border: none;
  cursor: pointer;
}

.c2j-settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  min-width: 0;
  width: 100%;
  overflow: visible;
}

html[data-theme='dark'] .c2j-settings-grid {
  border-color: #273449;
}

.c2j-setting-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
  overflow: visible;
}

.c2j-setting-field:has(.is-open),
.c2j-setting-field:focus-within {
  z-index: 100;
}

.c2j-custom-select {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

:deep(.c2j-custom-select.custom-select-wrapper),
:deep(.custom-select-wrapper) {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
}

:deep(.custom-select-wrapper.is-open) {
  z-index: 1000 !important;
}

:deep(.custom-select-trigger) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

:deep(.custom-select-trigger-content) {
  min-width: 0 !important;
  flex: 1 1 0% !important;
  overflow: hidden !important;
}

:deep(.custom-select-label) {
  min-width: 0 !important;
  flex: 1 1 0% !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

:deep(.custom-select-menu) {
  z-index: 1050 !important;
}

:deep(.custom-select-option) {
  padding: 0.6rem 0.75rem !important;
  font-size: 13px !important;
  min-height: 40px !important;
}

:deep(.option-label) {
  max-width: none !important;
  white-space: normal !important;
  word-break: break-word !important;
  line-height: 1.35 !important;
}

:deep(.option-sublabel) {
  max-width: none !important;
  font-size: 12px !important;
  white-space: normal !important;
}

.c2j-setting-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.c2j-toggles-wrap {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  padding-top: 10px;
}

.c2j-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
}

html[data-theme='dark'] .c2j-checkbox-label {
  color: #cbd5e1;
}

.c2j-checkbox-label input {
  accent-color: #e11d48;
  width: 16px;
  height: 16px;
}

.c2j-checkbox-label code {
  background: #e2e8f0;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 11px;
}

html[data-theme='dark'] .c2j-checkbox-label code {
  background: #1e293b;
}

.c2j-action-bar {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}

.c2j-convert-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 28px;
  border-radius: 10px;
  background: #e11d48;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(225, 29, 72, 0.3);
  transition: all 0.2s;
}

.c2j-convert-btn:hover:not(:disabled) {
  background: #be123c;
  transform: translateY(-1px);
}

.c2j-convert-btn:disabled {
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

/* Error Banner */
.c2j-error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #e11d48;
  font-size: 13.5px;
}

html[data-theme='dark'] .c2j-error-banner {
  background: rgba(225, 29, 72, 0.15);
  border-color: rgba(225, 29, 72, 0.3);
  color: #fda4af;
}

/* Output Card */
.c2j-output-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

html[data-theme='dark'] .c2j-output-card {
  background: #0f172a;
  border-color: #273449;
}

.c2j-output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 12px;
}

html[data-theme='dark'] .c2j-output-header {
  background: #1e293b;
  border-color: #273449;
}

.c2j-stats-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 12px;
}

html[data-theme='dark'] .stat-pill {
  background: #0f172a;
  border-color: #334155;
}

.stat-num {
  font-weight: 700;
  color: #e11d48;
}

.stat-lbl {
  color: #64748b;
}

.stat-pill.delim .stat-num {
  color: #059669;
}

.c2j-output-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #e2e8f0;
  padding: 3px;
  border-radius: 8px;
}

html[data-theme='dark'] .c2j-output-tabs {
  background: #0f172a;
}

.out-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.out-tab-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

html[data-theme='dark'] .out-tab-btn.active {
  background: #1e293b;
  color: #f8fafc;
}

/* Code View */
.c2j-code-view {
  display: flex;
  flex-direction: column;
}

.code-view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

html[data-theme='dark'] .code-view-toolbar {
  background: #0b1220;
  border-color: #273449;
}

.code-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
  transition: all 0.2s;
}

html[data-theme='dark'] .copy-btn {
  background: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}

.copy-btn:hover {
  border-color: #e11d48;
}

.text-emerald {
  color: #10b981;
}

.code-pre {
  margin: 0;
  padding: 16px 20px;
  max-height: 420px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  background: #ffffff;
  color: #0f172a;
}

html[data-theme='dark'] .code-pre {
  background: #0b1220;
  color: #e2e8f0;
}

/* Table View */
.c2j-table-view {
  display: flex;
  flex-direction: column;
}

.table-view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 12px;
}

html[data-theme='dark'] .table-view-toolbar {
  background: #1e293b;
  border-color: #273449;
}

.table-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 6px 12px;
  border-radius: 8px;
  width: 240px;
}

html[data-theme='dark'] .table-search-wrap {
  background: #0f172a;
  border-color: #334155;
}

.table-search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 12.5px;
  color: #0f172a;
  width: 100%;
}

html[data-theme='dark'] .table-search-input {
  color: #f8fafc;
}

.table-rows-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
}

.rows-select {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 12px;
}

html[data-theme='dark'] .rows-select {
  background: #0f172a;
  border-color: #334155;
  color: #f8fafc;
}

.table-scroll-wrap {
  max-height: 420px;
  overflow: auto;
}

.c2j-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.c2j-table th {
  position: sticky;
  top: 0;
  background: #f1f5f9;
  padding: 10px 14px;
  text-align: left;
  font-weight: 700;
  color: #334155;
  border-bottom: 2px solid #cbd5e1;
  white-space: nowrap;
}

html[data-theme='dark'] .c2j-table th {
  background: #0b1220;
  color: #cbd5e1;
  border-color: #334155;
}

.c2j-table td {
  padding: 8px 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #0f172a;
  white-space: nowrap;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
}

html[data-theme='dark'] .c2j-table td {
  border-color: #1e293b;
  color: #e2e8f0;
}

.c2j-table tr:hover td {
  background: #f8fafc;
}

html[data-theme='dark'] .c2j-table tr:hover td {
  background: #1e293b;
}

.col-num {
  width: 50px;
  color: #94a3b8 !important;
  font-family: monospace;
}

.badge-bool.true {
  color: #059669;
  font-weight: 600;
}

.badge-bool.false {
  color: #dc2626;
  font-weight: 600;
}

.badge-null {
  color: #94a3b8;
  font-style: italic;
}

.badge-obj {
  font-family: monospace;
  font-size: 11px;
  color: #d97706;
}

/* Pagination */
.c2j-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

html[data-theme='dark'] .c2j-pagination {
  background: #1e293b;
  border-color: #273449;
}

.page-nav-btn {
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

html[data-theme='dark'] .page-nav-btn {
  background: #0f172a;
  border-color: #334155;
  color: #f8fafc;
}

.page-nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-indicator {
  font-size: 12.5px;
  color: #64748b;
}

/* Download Strip */
.c2j-download-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 14px;
}

html[data-theme='dark'] .c2j-download-strip {
  background: #0b1220;
  border-color: #273449;
}

.filename-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filename-input-group label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.c2j-filename-input {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  width: 220px;
  outline: none;
}

html[data-theme='dark'] .c2j-filename-input {
  background: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}

.c2j-download-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 10px;
  background: #e11d48;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25);
  transition: all 0.2s;
}

.c2j-download-btn:hover {
  background: #be123c;
  transform: translateY(-1px);
}

/* Toast */
.c2j-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  background: #0f172a;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 768px) {
  .c2j-wrapper {
    border-radius: 14px;
  }

  .c2j-tabs-header {
    padding: 10px 12px;
    gap: 10px;
  }

  .c2j-tabs-pills {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }

  .c2j-tab-btn {
    justify-content: center;
    padding: 7px 8px;
    font-size: 12px;
  }

  .c2j-file-badge {
    width: 100%;
    justify-content: space-between;
    box-sizing: border-box;
  }

  .c2j-file-badge .file-name {
    max-width: 140px;
  }

  .c2j-workspace {
    padding: 14px 12px;
    gap: 14px;
  }

  /* Loaded file summary card on mobile */
  .c2j-loaded-file-card {
    padding: 14px 12px;
    gap: 12px;
  }

  .loaded-file-info {
    width: 100%;
    min-width: 0;
    gap: 12px;
  }

  .file-icon-box {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .file-meta {
    min-width: 0;
    flex: 1;
    overflow: hidden;
  }

  .file-meta h4 {
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 3px;
  }

  .file-details {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 6px;
    font-size: 11.5px;
  }

  .file-details span {
    white-space: nowrap;
  }

  .loaded-file-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 2px;
  }

  .tool-btn {
    width: 100%;
    justify-content: center;
    padding: 8px 10px;
    font-size: 12px;
    white-space: nowrap;
  }

  /* Settings panel on mobile */
  .c2j-settings-panel {
    padding: 12px 14px;
    border-radius: 12px;
    overflow: visible;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    position: relative;
  }

  .c2j-settings-header {
    gap: 8px;
  }

  .settings-title {
    font-size: 13px;
    gap: 6px;
  }

  .c2j-btn-link {
    font-size: 12px;
    gap: 4px;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .c2j-settings-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 12px;
    padding-top: 12px;
    min-width: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: visible;
  }

  .c2j-setting-field {
    min-width: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: visible;
    position: relative;
  }

  .c2j-setting-field:has(.is-open),
  .c2j-setting-field:focus-within {
    z-index: 100;
  }

  .c2j-toggles-wrap {
    grid-template-columns: 1fr;
    gap: 10px;
    padding-top: 8px;
  }

  .c2j-checkbox-label {
    font-size: 12px;
    align-items: flex-start;
    gap: 8px;
  }

  .c2j-checkbox-label input {
    margin-top: 2px;
    flex-shrink: 0;
  }

  .c2j-action-bar {
    margin-top: 14px;
    width: 100%;
  }

  .c2j-convert-btn {
    width: 100%;
    justify-content: center;
    padding: 12px 18px;
    font-size: 13.5px;
  }

  /* Dropzone on mobile */
  .c2j-dropzone {
    padding: 28px 14px;
    border-radius: 12px;
  }

  .c2j-upload-icon-circle {
    width: 52px;
    height: 52px;
    margin-bottom: 12px;
  }

  .c2j-dropzone-title {
    font-size: 16px;
  }

  .c2j-dropzone-subtitle {
    font-size: 12px;
    margin-bottom: 16px;
  }

  .c2j-primary-upload-btn {
    width: 100%;
    justify-content: center;
    padding: 10px 18px;
    font-size: 13px;
  }

  .c2j-dropzone-hints {
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px 8px;
    font-size: 11px;
    margin-top: 14px;
  }

  .c2j-sample-shortcuts {
    margin-top: 20px;
    width: 100%;
  }

  .c2j-template-pills {
    gap: 6px;
  }

  .c2j-sample-pill {
    padding: 4px 10px;
    font-size: 11px;
  }

  /* Editor on mobile */
  .c2j-editor-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 10px 12px;
  }

  .editor-actions {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .template-selector {
    flex: 1;
    min-width: 130px;
  }

  .c2j-select-compact {
    width: 100%;
  }

  .c2j-editor-body {
    height: 200px;
  }

  /* Output view on mobile */
  .c2j-output-header {
    padding: 12px;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .c2j-stats-wrap {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .stat-pill {
    font-size: 11px;
    padding: 3px 8px;
  }

  .c2j-output-tabs {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .out-tab-btn {
    justify-content: center;
    width: 100%;
    font-size: 12px;
  }

  .code-view-toolbar {
    padding: 8px 12px;
    gap: 8px;
  }

  .code-pre {
    padding: 12px;
    font-size: 11px;
    max-height: 320px;
  }

  .table-view-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 10px 12px;
  }

  .table-search-wrap {
    width: 100%;
    box-sizing: border-box;
  }

  .table-rows-selector {
    justify-content: flex-end;
  }

  /* Download strip on mobile */
  .c2j-download-strip {
    padding: 12px;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .filename-input-group {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    width: 100%;
  }

  .c2j-filename-input {
    width: 100%;
    box-sizing: border-box;
  }

  .download-actions {
    width: 100%;
  }

  .c2j-download-btn {
    width: 100%;
    justify-content: center;
    padding: 11px 16px;
    font-size: 13.5px;
  }
}
</style>

