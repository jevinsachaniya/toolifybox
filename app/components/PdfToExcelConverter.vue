<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import {
  ArrowRight,
  Check,
  CheckCheck,
  CircleAlert,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TableProperties,
  Trash2,
  Upload,
  X,
  Zap,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import {
  extractPdfTableData,
  generatePdfCsvData,
  generatePdfExcelWorkbook,
  generatePdfTsvData,
  SAMPLE_PDF_TABLE_DATA,
  validatePdfToExcelFile,
} from '~/utils/pdf-to-excel.js';

// State
const pdfFile = ref(null);
const fileInput = ref(null);

const busy = ref(false);
const progress = ref('');
const error = ref('');
const toastMessage = ref('');
const isDragging = ref(false);

// Options
const extractionMode = ref('smart_table'); // 'smart_table' | 'grid' | 'line_by_line'
const mergePages = ref(true);
const detectHeaders = ref(true);
const outputFilename = ref('pdf-table-data');

// Extracted Data State
const extractedSheets = ref([]);
const activeSheetIdx = ref(0);
const searchQuery = ref('');
const previewRowLimit = ref(25);

let toastTimer = null;
let abortController = null;

const stage = computed(() => {
  if (extractedSheets.value.length > 0) return 3;
  if (pdfFile.value) return 2;
  return 1;
});

const currentSheet = computed(() => {
  if (!extractedSheets.value.length) return null;
  const idx = Math.min(activeSheetIdx.value, extractedSheets.value.length - 1);
  return extractedSheets.value[idx] || extractedSheets.value[0];
});

const displayedRows = computed(() => {
  if (!currentSheet.value?.rows?.length) return { header: [], data: [], total: 0, filtered: 0 };
  const allRows = currentSheet.value.rows;
  const header = allRows[0] || [];
  const dataRows = allRows.slice(1);

  const q = searchQuery.value.trim().toLowerCase();
  let filtered = dataRows;
  if (q) {
    filtered = dataRows.filter(row =>
      row.some(cell => String(cell ?? '').toLowerCase().includes(q))
    );
  }

  return {
    header,
    data: filtered.slice(0, previewRowLimit.value),
    total: dataRows.length,
    filtered: filtered.length,
  };
});

function showToast(msg) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
}

function handleDragOver(e) {
  e.preventDefault();
  isDragging.value = true;
}

function handleDragLeave(e) {
  e.preventDefault();
  isDragging.value = false;
}

function handleDrop(e) {
  e.preventDefault();
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    processSelectedFile(files[0]);
  }
}

function handleFileInputChange(e) {
  const files = e.target.files;
  if (files && files.length > 0) {
    processSelectedFile(files[0]);
  }
  if (fileInput.value) fileInput.value.value = '';
}

async function processSelectedFile(file) {
  error.value = '';
  const validationError = validatePdfToExcelFile(file);
  if (validationError) {
    error.value = validationError;
    return;
  }

  pdfFile.value = file;
  const baseName = (file.name || 'document').replace(/\.pdf$/i, '');
  outputFilename.value = `${baseName}-converted`;

  await runExtraction();
}

async function runExtraction() {
  if (!pdfFile.value) return;

  error.value = '';
  busy.value = true;
  progress.value = 'Preparing PDF parser…';

  abortController = new AbortController();

  try {
    const result = await extractPdfTableData(pdfFile.value, {
      signal: abortController.signal,
      mode: extractionMode.value,
      mergePages: mergePages.value,
      detectHeaders: detectHeaders.value,
      onProgress: (msg) => {
        progress.value = msg;
      },
    });

    if (!result.sheets || !result.sheets.length || !result.sheets.some(s => s.rows?.length > 0)) {
      throw new Error('No readable text or tables found in this PDF. It may be a scanned image-only PDF.');
    }

    extractedSheets.value = result.sheets;
    activeSheetIdx.value = 0;
    showToast('Tables successfully extracted!');
  } catch (err) {
    if (err.name === 'AbortError') {
      showToast('Extraction cancelled.');
    } else {
      error.value = err.message || 'Failed to extract tables from this PDF document.';
    }
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

function loadSampleData() {
  error.value = '';
  pdfFile.value = {
    name: 'Sample_Invoice_Statement.pdf',
    size: 245 * 1024,
  };
  outputFilename.value = 'Sample_Invoice_Statement';

  extractedSheets.value = [
    {
      name: 'Invoice Summary',
      rows: SAMPLE_PDF_TABLE_DATA.map(r => [...r]),
      rowCount: SAMPLE_PDF_TABLE_DATA.length,
      colCount: SAMPLE_PDF_TABLE_DATA[0].length,
      headers: [...SAMPLE_PDF_TABLE_DATA[0]],
    },
  ];
  activeSheetIdx.value = 0;
  showToast('Loaded sample financial PDF data!');
}

function updateCell(rIdx, cIdx, event) {
  if (!currentSheet.value) return;
  // +1 because rIdx is from displayed dataRows (sliced from row 1)
  const actualRowIdx = rIdx + 1;
  if (currentSheet.value.rows[actualRowIdx]) {
    currentSheet.value.rows[actualRowIdx][cIdx] = event.target.innerText.trim();
  }
}

function updateHeaderCell(cIdx, event) {
  if (!currentSheet.value || !currentSheet.value.rows[0]) return;
  currentSheet.value.rows[0][cIdx] = event.target.innerText.trim();
}

function addRow() {
  if (!currentSheet.value) return;
  const colCount = currentSheet.value.rows[0]?.length || 4;
  const newRow = new Array(colCount).fill('');
  currentSheet.value.rows.push(newRow);
  currentSheet.value.rowCount = currentSheet.value.rows.length;
  showToast('Added new empty row');
}

function deleteRow(rIdx) {
  if (!currentSheet.value) return;
  const actualRowIdx = rIdx + 1;
  currentSheet.value.rows.splice(actualRowIdx, 1);
  currentSheet.value.rowCount = currentSheet.value.rows.length;
  showToast('Row removed');
}

async function downloadExcel() {
  if (!extractedSheets.value.length) return;
  busy.value = true;
  progress.value = 'Generating Microsoft Excel (.xlsx) workbook…';

  try {
    const blob = await generatePdfExcelWorkbook(extractedSheets.value, {
      filename: `${outputFilename.value}.xlsx`,
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${outputFilename.value || 'pdf-data'}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Excel workbook downloaded!');
  } catch (err) {
    error.value = 'Failed to generate Excel file: ' + err.message;
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

function downloadCsv() {
  if (!currentSheet.value?.rows?.length) return;
  try {
    const csvContent = generatePdfCsvData(currentSheet.value.rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${outputFilename.value || 'pdf-data'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('CSV spreadsheet downloaded!');
  } catch (err) {
    error.value = 'Failed to generate CSV: ' + err.message;
  }
}

async function copyToClipboard() {
  if (!currentSheet.value?.rows?.length) return;
  try {
    const tsv = generatePdfTsvData(currentSheet.value.rows);
    await navigator.clipboard.writeText(tsv);
    showToast('Table copied to clipboard! Ready to paste into Excel or Sheets.');
  } catch {
    showToast('Could not copy to clipboard automatically.');
  }
}

function resetAll() {
  if (abortController) abortController.abort();
  pdfFile.value = null;
  extractedSheets.value = [];
  activeSheetIdx.value = 0;
  searchQuery.value = '';
  error.value = '';
}

onBeforeUnmount(() => {
  if (abortController) abortController.abort();
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<template>
  <div class="pdf-to-excel-root">
    <!-- Converter Header -->
    <div class="converter-header">
      <div class="header-badges">
        <span class="badge badge-emerald">
          <Zap :size="13" /> 100% In-Browser &amp; Free
        </span>
        <span class="badge badge-indigo">
          <Sparkles :size="13" /> Smart Table Detection AI
        </span>
      </div>
      <h2 class="converter-title">Convert PDF to Editable Excel &amp; CSV</h2>
      <p class="converter-subtitle">
        Automatically detect tables, organize rows and columns, and export clean Microsoft Excel (.xlsx) workbooks with zero server uploads.
      </p>
    </div>

    <!-- 3-Stage Progress Indicator -->
    <div class="stepper-bar">
      <div class="step-item" :class="{ active: stage >= 1, done: stage > 1 }">
        <span class="step-num">1</span>
        <span class="step-label">Upload PDF</span>
      </div>
      <div class="step-connector" :class="{ filled: stage >= 2 }" />
      <div class="step-item" :class="{ active: stage >= 2, done: stage > 2 }">
        <span class="step-num">2</span>
        <span class="step-label">Configure &amp; Preview</span>
      </div>
      <div class="step-connector" :class="{ filled: stage >= 3 }" />
      <div class="step-item" :class="{ active: stage >= 3 }">
        <span class="step-num">3</span>
        <span class="step-label">Download Excel</span>
      </div>
    </div>

    <!-- Notification Toast -->
    <transition name="fade">
      <div v-if="toastMessage" class="toast-alert" role="status">
        <Check :size="16" /> {{ toastMessage }}
      </div>
    </transition>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner" role="alert">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
      <button class="dismiss-btn" aria-label="Dismiss error" @click="error = ''">
        <X :size="16" />
      </button>
    </div>

    <!-- STAGE 1: Drag & Drop Zone -->
    <div
      v-if="!pdfFile"
      class="upload-zone"
      :class="{ 'is-dragging': isDragging }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".pdf,application/pdf"
        class="hidden-input"
        @change="handleFileInputChange"
      />
      <div class="upload-icon-circle">
        <Upload :size="32" />
      </div>
      <h3 class="upload-title">Choose a PDF file or drag &amp; drop it here</h3>
      <p class="upload-hint">Supports financial reports, invoices, price lists &amp; multi-page PDFs up to 50 MB.</p>
      
      <div class="upload-actions">
        <button class="btn btn-primary" @click="fileInput?.click()">
          <FileText :size="18" /> Choose PDF File
        </button>
        <button class="btn btn-outline" @click="loadSampleData">
          <Sparkles :size="16" /> Try Sample Table
        </button>
      </div>

      <div class="privacy-guarantee">
        <CheckCheck :size="15" /> 100% Private: All table parsing runs entirely on your device. Zero cloud uploads.
      </div>
    </div>

    <!-- STAGE 2 & 3: File Card + Options + Table Preview -->
    <div v-else class="workspace-area">
      <!-- File Metadata Card -->
      <div class="file-summary-card">
        <div class="file-info-group">
          <div class="file-icon-box">
            <FileSpreadsheet :size="24" />
          </div>
          <div>
            <div class="file-title-row">
              <strong class="file-name">{{ pdfFile.name }}</strong>
              <span class="file-size-pill">{{ formatSize(pdfFile.size || 0) }}</span>
            </div>
            <p class="file-meta-sub">
              {{ extractedSheets.length }} sheet{{ extractedSheets.length > 1 ? 's' : '' }} extracted • 
              {{ currentSheet?.rowCount || 0 }} rows • 
              {{ currentSheet?.colCount || 0 }} columns
            </p>
          </div>
        </div>

        <div class="file-actions">
          <button class="btn btn-sm btn-ghost" title="Re-extract tables" @click="runExtraction" :disabled="busy">
            <RefreshCw :size="15" :class="{ 'spin-icon': busy }" /> Re-extract
          </button>
          <button class="btn btn-sm btn-danger-ghost" title="Remove file" @click="resetAll">
            <Trash2 :size="15" /> Change PDF
          </button>
        </div>
      </div>

      <!-- Settings / Extraction Options Panel -->
      <div class="options-panel">
        <div class="options-header">
          <TableProperties :size="17" />
          <span>Extraction &amp; Table Settings</span>
        </div>

        <div class="options-grid">
          <!-- Extraction Mode -->
          <div class="option-field">
            <label for="extraction-mode-select">Table Detection Mode</label>
            <select
              id="extraction-mode-select"
              v-model="extractionMode"
              class="form-select"
              @change="runExtraction"
            >
              <option value="smart_table">Smart Table AI (Coordinate Cluster)</option>
              <option value="grid">Grid Alignment (Strict Bins)</option>
              <option value="line_by_line">Line-by-Line (Delimiter Split)</option>
            </select>
            <span class="field-hint">Smart Table automatically detects columns and headers.</span>
          </div>

          <!-- Page Organization -->
          <div class="option-field">
            <label for="merge-pages-select">Page Organization</label>
            <select
              id="merge-pages-select"
              v-model="mergePages"
              class="form-select"
              @change="runExtraction"
            >
              <option :value="true">Merge All Pages (Single Master Sheet)</option>
              <option :value="false">Separate Sheet per Page (Multi-Tab)</option>
            </select>
            <span class="field-hint">Combine multi-page PDF tables into one continuous sheet.</span>
          </div>

          <!-- Header Row Option -->
          <div class="option-field">
            <label for="detect-headers-check" class="checkbox-label">
              <input
                id="detect-headers-check"
                v-model="detectHeaders"
                type="checkbox"
                class="form-checkbox"
                @change="runExtraction"
              />
              <span>First row is bold table header</span>
            </label>
            <span class="field-hint">Formats top row with dark background and white bold text.</span>
          </div>

          <!-- Output File Name -->
          <div class="option-field">
            <label for="output-filename-input">Output Filename</label>
            <div class="input-with-suffix">
              <input
                id="output-filename-input"
                v-model="outputFilename"
                type="text"
                class="form-input"
                placeholder="my-table-data"
              />
              <span class="input-suffix">.xlsx</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div v-if="busy" class="loading-state">
        <LoaderCircle :size="36" class="spin-icon" />
        <p class="loading-text">{{ progress }}</p>
      </div>

      <!-- Interactive Data Table View -->
      <div v-else-if="currentSheet" class="table-container-card">
        <!-- Sheet Tabs (if multi-sheet) -->
        <div v-if="extractedSheets.length > 1" class="sheet-tabs-bar">
          <span class="sheets-label"><Layers :size="14" /> Sheets:</span>
          <button
            v-for="(sheet, sIdx) in extractedSheets"
            :key="sheet.name + sIdx"
            class="sheet-tab-pill"
            :class="{ active: activeSheetIdx === sIdx }"
            @click="activeSheetIdx = sIdx"
          >
            {{ sheet.name }} ({{ sheet.rowCount }} rows)
          </button>
        </div>

        <!-- Table Toolbar -->
        <div class="table-toolbar">
          <div class="search-box">
            <Search :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Filter table rows..."
            />
            <button
              v-if="searchQuery"
              class="search-clear-btn"
              aria-label="Clear search"
              @click="searchQuery = ''"
            >
              <X :size="14" />
            </button>
          </div>

          <div class="table-stats">
            <span class="badge badge-neutral">
              <Filter :size="13" /> Showing {{ displayedRows.filtered }} of {{ displayedRows.total }} rows
            </span>
            <span class="badge badge-neutral">
              {{ displayedRows.header.length }} columns
            </span>
          </div>

          <div class="toolbar-actions">
            <button class="btn btn-sm btn-outline" @click="addRow">
              <Plus :size="14" /> Add Row
            </button>
            <button class="btn btn-sm btn-outline" @click="copyToClipboard">
              <Copy :size="14" /> Copy Table
            </button>
          </div>
        </div>

        <!-- Scrollable Table -->
        <div class="table-scroll-wrapper">
          <table class="extracted-table">
            <thead>
              <tr>
                <th class="th-index">#</th>
                <th
                  v-for="(head, cIdx) in displayedRows.header"
                  :key="'th-' + cIdx"
                  class="th-cell"
                  contenteditable="true"
                  spellcheck="false"
                  title="Click to edit column header"
                  @blur="updateHeaderCell(cIdx, $event)"
                >
                  {{ head || `Col ${cIdx + 1}` }}
                </th>
                <th class="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, rIdx) in displayedRows.data"
                :key="'tr-' + rIdx"
                class="table-row"
              >
                <td class="td-index">{{ rIdx + 1 }}</td>
                <td
                  v-for="(cell, cIdx) in row"
                  :key="'td-' + rIdx + '-' + cIdx"
                  class="td-cell"
                  contenteditable="true"
                  spellcheck="false"
                  title="Click to edit cell"
                  @blur="updateCell(rIdx, cIdx, $event)"
                >
                  {{ cell }}
                </td>
                <td class="td-actions">
                  <button
                    class="row-delete-btn"
                    title="Delete row"
                    aria-label="Delete row"
                    @click="deleteRow(rIdx)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </td>
              </tr>
              <tr v-if="displayedRows.data.length === 0">
                <td :colspan="displayedRows.header.length + 2" class="empty-table-cell">
                  No matching rows found for "{{ searchQuery }}".
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Download & Export Bar -->
        <div class="export-actions-bar">
          <div class="export-left">
            <button class="btn btn-lg btn-emerald" @click="downloadExcel">
              <FileSpreadsheet :size="19" /> Download Excel (.xlsx) <ArrowRight :size="17" />
            </button>
            <button class="btn btn-lg btn-outline" @click="downloadCsv">
              <Download :size="17" /> Download CSV (.csv)
            </button>
          </div>

          <div class="export-right">
            <button class="btn btn-ghost" @click="resetAll">
              <RefreshCw :size="15" /> Convert Another PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pdf-to-excel-root {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  font-family: inherit;
}

.converter-header {
  text-align: center;
  margin-bottom: 24px;
}

.header-badges {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.badge-emerald {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.badge-indigo {
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
  border: 1px solid rgba(99, 102, 241, 0.25);
}

.badge-neutral {
  background: var(--bg-surface-subtle, #f1f5f9);
  color: var(--text-muted, #64748b);
  border: 1px solid var(--border-color, #e2e8f0);
}

.converter-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-heading, #0f172a);
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.converter-subtitle {
  font-size: 1.05rem;
  color: var(--text-muted, #64748b);
  max-width: 680px;
  margin: 0 auto;
  line-height: 1.5;
}

/* Stepper Bar */
.stepper-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 28px auto;
  max-width: 620px;
  padding: 0 16px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted, #94a3b8);
  font-weight: 600;
  font-size: 0.88rem;
}

.step-item.active {
  color: #059669;
}

.step-item.done {
  color: #0f172a;
}

.step-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface-subtle, #f1f5f9);
  border: 2px solid var(--border-color, #cbd5e1);
  font-size: 0.8rem;
}

.step-item.active .step-num {
  background: #059669;
  border-color: #059669;
  color: #ffffff;
}

.step-item.done .step-num {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
}

.step-connector {
  flex: 1;
  height: 2px;
  background: var(--border-color, #e2e8f0);
  margin: 0 12px;
  transition: background 0.3s ease;
}

.step-connector.filled {
  background: #10b981;
}

/* Toast */
.toast-alert {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0f172a;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.92rem;
  font-weight: 500;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 12px 18px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 0.92rem;
}

.dismiss-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #991b1b;
  cursor: pointer;
  padding: 4px;
}

/* Upload Zone */
.upload-zone {
  background: var(--bg-surface, #ffffff);
  border: 2px dashed var(--border-color, #cbd5e1);
  border-radius: 16px;
  padding: 56px 24px;
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.upload-zone:hover,
.upload-zone.is-dragging {
  border-color: #059669;
  background: rgba(16, 185, 129, 0.03);
}

.hidden-input {
  display: none;
}

.upload-icon-circle {
  width: 68px;
  height: 68px;
  margin: 0 auto 16px;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-heading, #0f172a);
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 0.95rem;
  color: var(--text-muted, #64748b);
  margin-bottom: 24px;
}

.upload-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.privacy-guarantee {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-muted, #64748b);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.94rem;
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-primary {
  background: #059669;
  color: #ffffff;
}

.btn-primary:hover {
  background: #047857;
}

.btn-emerald {
  background: #059669;
  color: #ffffff;
  border-color: #047857;
}

.btn-emerald:hover {
  background: #047857;
}

.btn-outline {
  background: var(--bg-surface, #ffffff);
  border-color: var(--border-color, #cbd5e1);
  color: var(--text-heading, #0f172a);
}

.btn-outline:hover {
  border-color: #059669;
  color: #059669;
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted, #475569);
}

.btn-ghost:hover {
  background: var(--bg-surface-subtle, #f1f5f9);
  color: var(--text-heading, #0f172a);
}

.btn-danger-ghost {
  background: transparent;
  color: #dc2626;
}

.btn-danger-ghost:hover {
  background: #fef2f2;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.82rem;
}

.btn-lg {
  padding: 12px 24px;
  font-size: 1rem;
}

/* Workspace */
.workspace-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* File Summary Card */
.file-summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.file-info-group {
  display: flex;
  align-items: center;
  gap: 14px;
}

.file-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-name {
  font-size: 1rem;
  color: var(--text-heading, #0f172a);
}

.file-size-pill {
  font-size: 0.78rem;
  background: var(--bg-surface-subtle, #f1f5f9);
  color: var(--text-muted, #64748b);
  padding: 2px 8px;
  border-radius: 6px;
}

.file-meta-sub {
  font-size: 0.84rem;
  color: var(--text-muted, #64748b);
  margin-top: 2px;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Options Panel */
.options-panel {
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 18px 20px;
}

.options-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-heading, #0f172a);
  margin-bottom: 14px;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.option-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.option-field label {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-heading, #334155);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin-top: 6px;
}

.form-select,
.form-input {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--bg-surface, #ffffff);
  color: var(--text-heading, #0f172a);
  font-size: 0.88rem;
}

.input-with-suffix {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  overflow: hidden;
}

.input-with-suffix .form-input {
  border: none;
  flex: 1;
}

.input-suffix {
  background: var(--bg-surface-subtle, #f1f5f9);
  padding: 8px 12px;
  font-size: 0.85rem;
  color: var(--text-muted, #64748b);
  border-left: 1px solid var(--border-color, #cbd5e1);
}

.field-hint {
  font-size: 0.76rem;
  color: var(--text-muted, #94a3b8);
}

/* Loading State */
.loading-state {
  padding: 60px 20px;
  text-align: center;
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
}

.spin-icon {
  animation: spin 1s linear infinite;
  color: #059669;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 14px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-heading, #0f172a);
}

/* Table Card */
.table-container-card {
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.sheet-tabs-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-surface-subtle, #f8fafc);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  overflow-x: auto;
}

.sheets-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted, #64748b);
}

.sheet-tab-pill {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--bg-surface, #ffffff);
  color: var(--text-muted, #475569);
  cursor: pointer;
  white-space: nowrap;
}

.sheet-tab-pill.active {
  background: #059669;
  color: #ffffff;
  border-color: #059669;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 240px;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--text-muted, #94a3b8);
}

.search-input {
  width: 100%;
  padding: 6px 30px 6px 32px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  font-size: 0.85rem;
  background: var(--bg-surface, #ffffff);
  color: var(--text-heading, #0f172a);
}

.search-clear-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
}

.table-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Scrollable Table */
.table-scroll-wrapper {
  max-height: 480px;
  overflow: auto;
}

.extracted-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  text-align: left;
}

.extracted-table thead {
  position: sticky;
  top: 0;
  background: #1e293b;
  color: #ffffff;
  z-index: 2;
}

.th-index,
.td-index {
  width: 44px;
  text-align: center;
  font-weight: 600;
  color: var(--text-muted, #94a3b8);
  background: var(--bg-surface-subtle, #f8fafc);
  border-right: 1px solid var(--border-color, #e2e8f0);
}

.extracted-table thead .th-index {
  background: #0f172a;
  color: #94a3b8;
}

.th-cell {
  padding: 10px 14px;
  font-weight: 700;
  border-right: 1px solid #334155;
  white-space: nowrap;
  outline: none;
}

.th-cell:focus {
  background: #334155;
}

.th-actions,
.td-actions {
  width: 50px;
  text-align: center;
}

.table-row {
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.table-row:hover {
  background: rgba(16, 185, 129, 0.04);
}

.td-cell {
  padding: 8px 14px;
  border-right: 1px solid var(--border-color, #e2e8f0);
  outline: none;
  color: var(--text-heading, #1e293b);
  white-space: nowrap;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.td-cell:focus {
  background: #ecfdf5;
  box-shadow: inset 0 0 0 2px #059669;
}

.row-delete-btn {
  background: none;
  border: none;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.row-delete-btn:hover {
  color: #dc2626;
  background: #fef2f2;
}

.empty-table-cell {
  text-align: center;
  padding: 36px;
  color: var(--text-muted, #64748b);
}

/* Export Actions Bar */
.export-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--bg-surface-subtle, #f8fafc);
  border-top: 1px solid var(--border-color, #e2e8f0);
  flex-wrap: wrap;
  gap: 12px;
}

.export-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.export-right {
  display: flex;
  align-items: center;
}

@media (max-width: 640px) {
  .converter-title {
    font-size: 1.5rem;
  }
  .stepper-bar {
    display: none;
  }
  .file-summary-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .table-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .export-actions-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .export-left {
    flex-direction: column;
  }
  .export-left .btn {
    width: 100%;
  }
}
</style>
