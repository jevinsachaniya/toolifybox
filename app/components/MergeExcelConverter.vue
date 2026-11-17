<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCheck,
  CircleAlert,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  TableProperties,
  Trash2,
  Upload,
  X,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import {
  generateMergedCsv,
  generateMergedExcelWorkbook,
  mergeExcelWorkbooks,
  parseUploadedWorkbook,
  SAMPLE_EXCEL_DATASETS,
  validateExcelMergeFile,
} from '~/utils/merge-excel.js';

// State
const workbooks = ref([]);
const fileInput = ref(null);
const addMoreInput = ref(null);

const busy = ref(false);
const progress = ref('');
const error = ref('');
const toastMessage = ref('');
const isDragging = ref(false);

// Merge Options
const mergeMode = ref('single_sheet'); // 'single_sheet' | 'multiple_sheets'
const headerMode = ref('header_match'); // 'header_match' | 'position_match'
const firstRowIsHeader = ref(true);
const addSourceColumn = ref(false);
const sourceColumnName = ref('Source File');
const outputFilename = ref('merged-excel');

// Preview State
const activePreviewSheetIdx = ref(0);
const previewRowLimit = ref(20);
const searchQuery = ref('');

let toastTimer = null;
let active = true;

const stage = computed(() => {
  if (workbooks.value.length >= 2) return 2;
  if (workbooks.value.length === 1) return 2;
  return 1;
});

// Computed merged dataset updated reactively
const mergedResult = computed(() => {
  if (!workbooks.value.length) return null;
  return mergeExcelWorkbooks(workbooks.value, {
    mode: mergeMode.value,
    headerMode: headerMode.value,
    firstRowIsHeader: firstRowIsHeader.value,
    addSourceColumn: addSourceColumn.value,
    sourceColumnName: sourceColumnName.value,
  });
});

const activeSheet = computed(() => {
  if (!mergedResult.value?.sheets?.length) return null;
  const idx = Math.min(activePreviewSheetIdx.value, mergedResult.value.sheets.length - 1);
  return mergedResult.value.sheets[idx] || mergedResult.value.sheets[0];
});

const previewRows = computed(() => {
  if (!activeSheet.value?.rows?.length) return [];
  const allRows = activeSheet.value.rows;
  const header = allRows[0] || [];
  const dataRows = allRows.slice(1);

  const q = searchQuery.value.trim().toLowerCase();
  let filtered = dataRows;
  if (q) {
    filtered = dataRows.filter(row =>
      row.some(cell => String(cell || '').toLowerCase().includes(q))
    );
  }

  return {
    header,
    data: filtered.slice(0, previewRowLimit.value),
    totalCount: dataRows.length,
    filteredCount: filtered.length,
  };
});

function showToast(msg) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
}

async function handleFilesSelected(files) {
  if (!files || !files.length) return;
  error.value = '';
  busy.value = true;
  progress.value = 'Reading spreadsheet files…';

  const fileList = Array.from(files);
  const newWbs = [];

  try {
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const validationErr = validateExcelMergeFile(file);
      if (validationErr) {
        error.value = validationErr;
        continue;
      }

      progress.value = `Parsing "${file.name}" (${i + 1} of ${fileList.length})…`;
      const parsed = await parseUploadedWorkbook(file);
      newWbs.push(parsed);
    }

    if (active) {
      workbooks.value.push(...newWbs);
      if (newWbs.length > 0) {
        showToast(`Added ${newWbs.length} file${newWbs.length > 1 ? 's' : ''}!`);
      }
    }
  } catch (err) {
    if (active) {
      error.value = err.message || 'Failed to read spreadsheet file. Please ensure it is a valid .xlsx or .csv file.';
    }
  } finally {
    if (active) {
      busy.value = false;
      progress.value = '';
    }
  }
}

function onDrop(e) {
  isDragging.value = false;
  if (busy.value) return;
  const droppedFiles = e.dataTransfer?.files;
  if (droppedFiles?.length) {
    void handleFilesSelected(droppedFiles);
  }
}

function removeWorkbook(index) {
  workbooks.value.splice(index, 1);
  if (activePreviewSheetIdx.value >= workbooks.value.length) {
    activePreviewSheetIdx.value = 0;
  }
  showToast('Removed file.');
}

function moveWorkbook(index, delta) {
  const newIdx = index + delta;
  if (newIdx < 0 || newIdx >= workbooks.value.length) return;
  const item = workbooks.value.splice(index, 1)[0];
  workbooks.value.splice(newIdx, 0, item);
}

function clearAll() {
  workbooks.value = [];
  activePreviewSheetIdx.value = 0;
  error.value = '';
  searchQuery.value = '';
  showToast('Cleared all files.');
}

function loadSampleWorkbooks() {
  const samples = JSON.parse(JSON.stringify(SAMPLE_EXCEL_DATASETS));
  workbooks.value = samples.map(s => ({
    id: `wb-sample-${Math.random().toString(36).substring(2, 7)}`,
    name: s.name,
    size: 24500,
    isCsv: false,
    sheets: s.sheets.map(sh => ({
      name: sh.name,
      rows: sh.rows,
      rowCount: sh.rows.length,
      colCount: sh.rows[0]?.length || 0,
    })),
    selectedSheetIndex: 'all',
    totalRows: s.sheets.reduce((sum, sh) => sum + sh.rows.length, 0),
  }));
  showToast('Loaded 3 sample sales spreadsheets!');
}

async function exportExcel() {
  if (!mergedResult.value?.sheets?.length) return;
  busy.value = true;
  progress.value = 'Generating merged Excel (.xlsx) file…';

  try {
    const rawName = (outputFilename.value || 'merged-excel').trim();
    const finalName = rawName.toLowerCase().endsWith('.xlsx') ? rawName : `${rawName}.xlsx`;

    const { blob, filename } = await generateMergedExcelWorkbook(mergedResult.value, {
      filename: finalName,
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Downloaded "${filename}" successfully!`);
  } catch (err) {
    error.value = 'Failed to generate Excel file: ' + err.message;
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

function exportCsv() {
  if (!mergedResult.value?.sheets?.length) return;
  const rawName = (outputFilename.value || 'merged-excel').trim();
  const finalName = rawName.toLowerCase().endsWith('.csv') ? rawName : `${rawName}.csv`;

  const { blob, filename } = generateMergedCsv(mergedResult.value, {
    filename: finalName,
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Downloaded "${filename}"!`);
}

async function copyPreviewToClipboard() {
  if (!activeSheet.value?.rows?.length) return;
  const rows = activeSheet.value.rows;
  const tsv = rows.map(r => r.join('\t')).join('\n');
  try {
    await navigator.clipboard.writeText(tsv);
    showToast('Copied merged data to clipboard! Paste directly into Excel or Google Sheets.');
  } catch {
    showToast('Could not copy to clipboard.');
  }
}

onBeforeUnmount(() => {
  active = false;
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<template>
  <section
    id="converter"
    class="converter mex-converter"
    :class="{ 'is-converting': busy, 'has-files': workbooks.length > 0 }"
    aria-label="Merge Excel Workbooks"
    :aria-busy="busy"
  >
    <!-- Heading -->
    <div class="converter-heading">
      <div>
        <span class="mini-label">SPREADSHEET CONSOLIDATOR</span>
        <h2>Merge Excel Files</h2>
      </div>
      <span class="free-badge">Free to use</span>
    </div>

    <!-- Step Track -->
    <ol class="step-track" aria-label="Excel merging steps">
      <li
        v-for="(label, index) in ['Add Excel Files', 'Configure & Preview', 'Download Merged File']"
        :key="label"
        :class="{ current: stage === index + 1, complete: stage > index + 1 }"
      >
        <span>
          <Check v-if="stage > index + 1" :size="12" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        {{ label }}
      </li>
    </ol>

    <!-- Upload Dropzone (When No Files Yet) -->
    <div
      v-if="workbooks.length === 0"
      class="mex-dropzone"
      :class="{ 'is-dragging': isDragging }"
      tabindex="0"
      role="button"
      aria-label="Upload Excel files to merge"
      @click="fileInput?.click()"
      @keydown.enter.prevent="fileInput?.click()"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <div class="mex-drop-icon">
        <FileSpreadsheet :size="36" />
      </div>
      <h3>Drop multiple Excel files here</h3>
      <p>Supports modern Microsoft Excel (.xlsx) and CSV spreadsheets up to 35 MB each</p>

      <div class="mex-drop-actions" @click.stop>
        <button
          type="button"
          class="primary-button mex-browse-btn"
          :disabled="busy"
          @click="fileInput?.click()"
        >
          <Upload :size="15" /> Choose Excel Files
        </button>

        <button
          type="button"
          class="text-button mex-sample-btn"
          :disabled="busy"
          @click="loadSampleWorkbooks"
        >
          <Sparkles :size="14" /> Try 3 Sample Files
        </button>
      </div>

      <input
        ref="fileInput"
        type="file"
        multiple
        accept=".xlsx, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
        class="visually-hidden"
        @change="e => handleFilesSelected(e.target.files)"
      />
    </div>

    <!-- Files Management Workspace (When Files Added) -->
    <div v-else class="mex-workspace">
      <!-- File Cards List -->
      <div class="mex-files-panel">
        <div class="mex-panel-header">
          <div class="mex-panel-title">
            <FileSpreadsheet :size="18" />
            <strong>Files to Merge ({{ workbooks.length }})</strong>
          </div>

          <div class="mex-panel-actions">
            <button
              type="button"
              class="secondary-button mex-add-more-btn"
              :disabled="busy"
              @click="addMoreInput?.click()"
            >
              <Plus :size="14" /> Add More Files
            </button>
            <button
              type="button"
              class="text-button danger-link"
              title="Remove all files"
              :disabled="busy"
              @click="clearAll"
            >
              <Trash2 :size="14" /> Clear All
            </button>
            <input
              ref="addMoreInput"
              type="file"
              multiple
              accept=".xlsx, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
              class="visually-hidden"
              @change="e => handleFilesSelected(e.target.files)"
            />
          </div>
        </div>

        <ul class="mex-files-list">
          <li
            v-for="(wb, idx) in workbooks"
            :key="wb.id"
            class="mex-file-card"
          >
            <span class="mex-card-num">{{ idx + 1 }}</span>
            <div class="mex-card-badge">
              <span>XLS</span>
            </div>

            <div class="mex-card-info">
              <strong class="mex-card-name" :title="wb.name">{{ wb.name }}</strong>
              <div class="mex-card-meta">
                <span>{{ formatSize(wb.size) }}</span>
                <span>•</span>
                <span>{{ wb.sheets.length }} sheet{{ wb.sheets.length > 1 ? 's' : '' }}</span>
                <span>•</span>
                <span>{{ wb.totalRows }} rows</span>
              </div>
            </div>

            <!-- Sheet Selection if multiple sheets -->
            <div v-if="wb.sheets.length > 1" class="mex-sheet-picker">
              <label :for="`sheet-select-${idx}`">Sheet:</label>
              <select
                :id="`sheet-select-${idx}`"
                v-model="wb.selectedSheetIndex"
                :disabled="busy"
              >
                <option value="all">All Sheets ({{ wb.sheets.length }})</option>
                <option
                  v-for="(s, sIndex) in wb.sheets"
                  :key="sIndex"
                  :value="sIndex"
                >
                  {{ s.name }} ({{ s.rowCount }} rows)
                </option>
              </select>
            </div>

            <!-- Reorder and Delete Actions -->
            <div class="mex-card-actions">
              <button
                type="button"
                class="mex-icon-action"
                title="Move Up"
                :disabled="idx === 0 || busy"
                @click="moveWorkbook(idx, -1)"
              >
                <ArrowUp :size="14" />
              </button>
              <button
                type="button"
                class="mex-icon-action"
                title="Move Down"
                :disabled="idx === workbooks.length - 1 || busy"
                @click="moveWorkbook(idx, 1)"
              >
                <ArrowDown :size="14" />
              </button>
              <button
                type="button"
                class="mex-icon-action delete"
                title="Remove file"
                :disabled="busy"
                @click="removeWorkbook(idx)"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </li>
        </ul>
      </div>

      <!-- Merge Configuration Options -->
      <div class="mex-options-panel">
        <div class="mex-options-grid">
          <!-- Merge Mode Toggle -->
          <div class="mex-option-group">
            <label class="mex-option-label">Merge Mode</label>
            <div class="mex-pills-group">
              <button
                type="button"
                class="mex-pill-btn"
                :class="{ active: mergeMode === 'single_sheet' }"
                @click="mergeMode = 'single_sheet'"
              >
                <TableProperties :size="14" />
                <span>Merge into Single Sheet</span>
              </button>
              <button
                type="button"
                class="mex-pill-btn"
                :class="{ active: mergeMode === 'multiple_sheets' }"
                @click="mergeMode = 'multiple_sheets'"
              >
                <Layers :size="14" />
                <span>Separate Tabs (Multi-Sheet)</span>
              </button>
            </div>
          </div>

          <!-- Column Matching (Only visible for Single Sheet mode) -->
          <div v-if="mergeMode === 'single_sheet'" class="mex-option-group">
            <label class="mex-option-label">Column Alignment</label>
            <div class="mex-pills-group">
              <button
                type="button"
                class="mex-pill-btn"
                :class="{ active: headerMode === 'header_match' }"
                @click="headerMode = 'header_match'"
              >
                <span>Match by Column Header Name (Recommended)</span>
              </button>
              <button
                type="button"
                class="mex-pill-btn"
                :class="{ active: headerMode === 'position_match' }"
                @click="headerMode = 'position_match'"
              >
                <span>Match by Column Position (Col A, B, C)</span>
              </button>
            </div>
          </div>

          <!-- Checkbox Toggles (Only for Single Sheet) -->
          <div v-if="mergeMode === 'single_sheet'" class="mex-checkboxes-row">
            <label class="mex-checkbox-label">
              <input v-model="firstRowIsHeader" type="checkbox" :disabled="busy" />
              <span>First row of each file contains Column Headers</span>
            </label>

            <label class="mex-checkbox-label">
              <input v-model="addSourceColumn" type="checkbox" :disabled="busy" />
              <span>Include "Source File" column to trace row origin</span>
            </label>
          </div>

          <!-- Output Filename -->
          <div class="mex-filename-group">
            <label for="mex-filename">Export Filename:</label>
            <div class="mex-filename-input-wrap">
              <input
                id="mex-filename"
                v-model="outputFilename"
                type="text"
                placeholder="merged-excel"
              />
              <span class="filename-ext">.xlsx</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Data Preview Table -->
      <div v-if="mergedResult && activeSheet" class="mex-preview-panel">
        <div class="mex-preview-toolbar">
          <div class="mex-preview-stats">
            <div class="mex-stat-pill">
              <Check :size="13" />
              <span><strong>{{ mergedResult.sheets.length }}</strong> sheet{{ mergedResult.sheets.length > 1 ? 's' : '' }}</span>
            </div>
            <div class="mex-stat-pill">
              <span><strong>{{ mergedResult.totalRows }}</strong> total rows</span>
            </div>
            <div class="mex-stat-pill">
              <span><strong>{{ mergedResult.totalCols }}</strong> columns</span>
            </div>
          </div>

          <!-- Multi-Sheet Preview Tabs (When in multi-sheet mode) -->
          <div v-if="mergedResult.sheets.length > 1" class="mex-sheet-tabs">
            <button
              v-for="(s, sIdx) in mergedResult.sheets"
              :key="sIdx"
              type="button"
              class="mex-sheet-tab"
              :class="{ active: activePreviewSheetIdx === sIdx }"
              @click="activePreviewSheetIdx = sIdx"
            >
              {{ s.name }} ({{ s.rowCount }})
            </button>
          </div>

          <!-- Search Filter -->
          <div class="mex-search-wrap">
            <Search :size="13" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search preview data…"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="clear-search-btn"
              @click="searchQuery = ''"
            >
              <X :size="12" />
            </button>
          </div>
        </div>

        <!-- Spreadsheet Table Display -->
        <div class="mex-table-wrapper">
          <table class="mex-table">
            <thead>
              <tr>
                <th class="col-index">#</th>
                <th
                  v-for="(headerCell, cIdx) in previewRows.header"
                  :key="cIdx"
                >
                  {{ headerCell || `Column ${cIdx + 1}` }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, rIdx) in previewRows.data"
                :key="rIdx"
              >
                <td class="col-index">{{ rIdx + 1 }}</td>
                <td
                  v-for="(cellVal, cIdx) in previewRows.header"
                  :key="cIdx"
                >
                  {{ row[cIdx] !== undefined && row[cIdx] !== null ? row[cIdx] : '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mex-preview-footer">
          <span>
            Showing first {{ Math.min(previewRowLimit, previewRows.filteredCount) }} of {{ previewRows.totalCount }} data rows.
          </span>
          <button
            type="button"
            class="text-button copy-table-btn"
            title="Copy table to clipboard"
            @click="copyPreviewToClipboard"
          >
            <Copy :size="13" /> Copy Preview Data
          </button>
        </div>
      </div>

      <!-- Export Bottom Bar -->
      <div class="mex-export-bar">
        <div class="mex-export-left">
          <button
            type="button"
            class="primary-button mex-download-btn"
            :disabled="busy || !mergedResult?.totalRows"
            @click="exportExcel"
          >
            <LoaderCircle v-if="busy" class="spinning" :size="18" />
            <Download v-else :size="18" />
            <span>Download Merged Excel (.xlsx)</span>
          </button>

          <button
            v-if="mergeMode === 'single_sheet'"
            type="button"
            class="secondary-button"
            :disabled="busy || !mergedResult?.totalRows"
            @click="exportCsv"
          >
            <FileText :size="15" />
            <span>Export as CSV</span>
          </button>
        </div>

        <button
          type="button"
          class="text-button reset-btn"
          :disabled="busy"
          @click="clearAll"
        >
          <RefreshCw :size="14" /> Start Over
        </button>
      </div>
    </div>

    <!-- Scanning Progress Indicator -->
    <div v-if="busy" class="mex-progress-panel" role="status">
      <div class="progress-track"><span /></div>
      <p><LoaderCircle class="spinning" :size="15" /> {{ progress }}</p>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="error-message" role="alert">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
    </div>

    <!-- Toast Notification -->
    <div v-if="toastMessage" class="mex-toast" role="status">
      <Check :size="15" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- Assurance -->
    <div class="converter-assurance">
      <Sparkles :size="14" />
      <span>All spreadsheet processing and merging happen 100% locally in your browser memory. Zero server uploads.</span>
    </div>
  </section>
</template>

<style scoped>
.mex-converter {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Dropzone */
.mex-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: var(--surface, #ffffff);
  border: 2px dashed var(--border, #cbd5e1);
  border-radius: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.02);
}

.mex-dropzone:hover,
.mex-dropzone.is-dragging {
  border-color: #059669;
  background: #f0fdf4;
}

.mex-drop-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #ecfdf5;
  color: #059669;
  display: grid;
  place-items: center;
  margin-bottom: 14px;
  transition: transform 0.2s ease;
}

.mex-dropzone:hover .mex-drop-icon {
  transform: scale(1.06);
}

.mex-dropzone h3 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text, #0f172a);
}

.mex-dropzone p {
  margin: 0 0 18px;
  font-size: 13px;
  color: #64748b;
  max-width: 420px;
}

.mex-drop-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.mex-browse-btn {
  background: #059669;
  border-color: #047857;
  padding: 10px 20px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.mex-browse-btn:hover {
  background: #047857;
}

.mex-sample-btn {
  font-size: 12.5px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #059669;
}

/* Workspace */
.mex-workspace {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Files List Panel */
.mex-files-panel {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.02);
}

.mex-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;
}

.mex-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text, #0f172a);
}

.mex-panel-title svg {
  color: #059669;
}

.mex-panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mex-add-more-btn {
  font-size: 12px;
  padding: 6px 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.danger-link {
  color: #ef4444;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.mex-files-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mex-file-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.15s ease;
}

.mex-file-card:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.mex-card-num {
  font-size: 11.5px;
  font-weight: 700;
  color: #94a3b8;
  width: 18px;
  text-align: center;
}

.mex-card-badge {
  background: #059669;
  color: #ffffff;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.mex-card-info {
  flex: 1;
  min-width: 0;
}

.mex-card-name {
  display: block;
  font-size: 13px;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mex-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.mex-sheet-picker {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: #475569;
}

.mex-sheet-picker select {
  padding: 4px 8px;
  font-size: 11.5px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  color: #1e293b;
}

.mex-card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mex-icon-action {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mex-icon-action:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.mex-icon-action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.mex-icon-action.delete:hover:not(:disabled) {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}

/* Options Panel */
.mex-options-panel {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.02);
}

.mex-options-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mex-option-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mex-option-label {
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #475569;
}

.mex-pills-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mex-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  font-size: 12.5px;
  font-weight: 500;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mex-pill-btn:hover {
  background: #f8fafc;
}

.mex-pill-btn.active {
  background: #ecfdf5;
  border-color: #059669;
  color: #047857;
  font-weight: 600;
  box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.15);
}

.mex-checkboxes-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  padding-top: 4px;
}

.mex-checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: #334155;
  cursor: pointer;
  user-select: none;
}

.mex-checkbox-label input {
  cursor: pointer;
  accent-color: #059669;
}

.mex-filename-group {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 4px;
  flex-wrap: wrap;
}

.mex-filename-group label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.mex-filename-input-wrap {
  display: inline-flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
}

.mex-filename-input-wrap input {
  padding: 7px 10px;
  font-size: 12.5px;
  border: none;
  outline: none;
  width: 180px;
}

.filename-ext {
  padding: 7px 10px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  border-left: 1px solid #cbd5e1;
}

/* Live Preview Panel */
.mex-preview-panel {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mex-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.mex-preview-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mex-stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  padding: 4px 8px;
  background: #ecfdf5;
  color: #047857;
  border-radius: 6px;
  border: 1px solid #a7f3d0;
}

.mex-sheet-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
}

.mex-sheet-tab {
  padding: 4px 10px;
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  white-space: nowrap;
}

.mex-sheet-tab.active {
  background: #059669;
  color: #ffffff;
  border-color: #047857;
}

.mex-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.mex-search-wrap input {
  padding: 5px 24px 5px 26px;
  font-size: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  width: 170px;
}

.mex-search-wrap svg:first-child {
  position: absolute;
  left: 7px;
  color: #94a3b8;
}

.clear-search-btn {
  position: absolute;
  right: 5px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.mex-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  max-height: 380px;
}

.mex-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
}

.mex-table th {
  background: #f8fafc;
  padding: 8px 12px;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  color: #475569;
  border-bottom: 2px solid #cbd5e1;
  position: sticky;
  top: 0;
  z-index: 1;
  white-space: nowrap;
}

.mex-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  white-space: nowrap;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mex-table tbody tr:hover {
  background: #f8fafc;
}

.col-index {
  color: #94a3b8;
  font-weight: 600;
  width: 44px;
}

.mex-preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  color: #64748b;
  padding-top: 4px;
}

.copy-table-btn {
  font-size: 11.5px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* Export Bottom Bar */
.mex-export-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.02);
  flex-wrap: wrap;
}

.mex-export-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.mex-download-btn {
  background: #059669;
  border-color: #047857;
  padding: 10px 22px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.mex-download-btn:hover {
  background: #047857;
}

.reset-btn {
  font-size: 12.5px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
}

/* Progress Panel */
.mex-progress-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  color: #166534;
  font-size: 13px;
}

.mex-progress-panel p {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-weight: 500;
}

/* Toast */
.mex-toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #059669;
  color: #ffffff;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
}

/* Dark mode */
html[data-theme='dark'] .mex-dropzone,
html[data-theme='dark'] .mex-files-panel,
html[data-theme='dark'] .mex-options-panel,
html[data-theme='dark'] .mex-preview-panel,
html[data-theme='dark'] .mex-export-bar {
  background: #1e293b;
  border-color: #334155;
}

html[data-theme='dark'] .mex-dropzone:hover,
html[data-theme='dark'] .mex-dropzone.is-dragging {
  background: #064e3b;
  border-color: #10b981;
}

html[data-theme='dark'] .mex-dropzone h3,
html[data-theme='dark'] .mex-panel-title strong {
  color: #f1f5f9;
}

html[data-theme='dark'] .mex-file-card {
  background: #0f172a;
  border-color: #334155;
}

html[data-theme='dark'] .mex-card-name {
  color: #f8fafc;
}

html[data-theme='dark'] .mex-pill-btn {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

html[data-theme='dark'] .mex-pill-btn.active {
  background: #064e3b;
  border-color: #10b981;
  color: #34d399;
}

html[data-theme='dark'] .mex-checkbox-label {
  color: #cbd5e1;
}

html[data-theme='dark'] .mex-filename-input-wrap {
  background: #0f172a;
  border-color: #334155;
}

html[data-theme='dark'] .mex-filename-input-wrap input {
  background: #0f172a;
  color: #f1f5f9;
}

html[data-theme='dark'] .filename-ext {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}

html[data-theme='dark'] .mex-table-wrapper {
  border-color: #334155;
}

html[data-theme='dark'] .mex-table th {
  background: #0f172a;
  color: #94a3b8;
  border-color: #334155;
}

html[data-theme='dark'] .mex-table td {
  border-color: #334155;
  color: #cbd5e1;
}

html[data-theme='dark'] .mex-table tbody tr:hover {
  background: #334155;
}

html[data-theme='dark'] .mex-icon-action,
html[data-theme='dark'] .mex-sheet-picker select,
html[data-theme='dark'] .mex-search-wrap input {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}
</style>
