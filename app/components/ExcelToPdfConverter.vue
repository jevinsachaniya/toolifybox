<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { Check, CircleAlert, Download, FileSpreadsheet, Layers, LoaderCircle, LockKeyhole, RotateCcw, Table, Upload, X } from '@lucide/vue';
import { formatSize, excelPdfFilename, validateExcel } from '~/utils/document.js';
import { openExcelWorkbook } from '~/utils/convert-excel.js';

const file = shallowRef(null);
const sheets = ref([]);
const activeSheetIndex = ref(0);
const orientation = ref('landscape');
const exportScope = ref('all'); // 'all' | 'current'
const gridlines = ref(true);
const busy = ref(false);
const exported = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const resultPdf = ref(null);
const input = ref(null);
const uploadButton = ref(null);

const activeSheet = computed(() => sheets.value[activeSheetIndex.value] || null);
const stage = computed(() => resultPdf.value ? 3 : sheets.value.length ? 2 : 1);

let handle;
let request;
let dropDepth = 0;
let active = true;

function clearResult() {
  if (resultPdf.value?.url) URL.revokeObjectURL(resultPdf.value.url);
  resultPdf.value = null;
}

function closeWorkbook() {
  const current = handle;
  handle = undefined;
  current?.close();
}

onBeforeUnmount(() => {
  active = false;
  request?.abort();
  clearResult();
  closeWorkbook();
});

async function clear({ focus = true } = {}) {
  request?.abort();
  request = undefined;
  sheets.value = [];
  activeSheetIndex.value = 0;
  clearResult();
  closeWorkbook();
  file.value = null;
  error.value = '';
  progress.value = '';
  exported.value = false;
  busy.value = false;
  if (input.value) input.value.value = '';
  if (focus && active) uploadButton.value?.focus();
}

async function select(files) {
  if (busy.value || !files?.length) return;
  const chosen = Array.from(files);
  const message = validateExcel(chosen);
  await clear({ focus: false });
  error.value = message;
  file.value = message ? null : chosen[0];
}

function chooseFile(event) {
  void select(event.target.files);
  event.target.value = '';
}

function dragEnter() {
  if (!busy.value) { dropDepth++; dragging.value = true; }
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
  void select(event.dataTransfer.files);
}

async function loadWorkbook() {
  if (!file.value || busy.value) return;
  busy.value = true;
  error.value = '';
  progress.value = 'Reading spreadsheet data…';
  exported.value = false;
  clearResult();
  const controller = new AbortController();
  request = controller;

  try {
    handle = await openExcelWorkbook(file.value, {
      signal: controller.signal,
      onProgress: value => { if (active) progress.value = value; },
    });

    if (active && !controller.signal.aborted) {
      sheets.value = handle.sheets;
      activeSheetIndex.value = 0;
    }
  } catch (caught) {
    closeWorkbook();
    if (active && caught.name !== 'AbortError') {
      error.value = caught.message || 'We couldn’t read this Excel spreadsheet. Please try another .xlsx or .csv file.';
    }
  } finally {
    if (request === controller) request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}

function downloadFile(url, filename) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

async function convertToPdf() {
  if (!handle || busy.value || !sheets.value.length) return;
  busy.value = true;
  error.value = '';
  clearResult();
  const controller = new AbortController();
  request = controller;

  try {
    progress.value = 'Rendering spreadsheet to PDF…';
    const selectedSheetIndex = exportScope.value === 'current' ? activeSheetIndex.value : null;

    const pdfBlob = await handle.convertToPdf({
      selectedSheetIndex,
      orientation: orientation.value,
      gridlines: gridlines.value,
      onProgress: msg => {
        if (active) progress.value = msg;
      },
    });

    const filename = excelPdfFilename(file.value.name);
    const url = URL.createObjectURL(pdfBlob);

    if (active) {
      resultPdf.value = {
        blob: pdfBlob,
        url,
        filename,
        size: pdfBlob.size,
      };
      exported.value = true;
      downloadFile(url, filename);
    }
  } catch (caught) {
    if (active && caught.name !== 'AbortError') {
      error.value = caught.message || 'We couldn’t convert this spreadsheet to PDF. Please check the file formatting.';
    }
  } finally {
    if (request === controller) request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}

function cancel() {
  request?.abort();
}
</script>

<template>
  <section
    id="converter"
    class="converter image-converter excel-converter"
    :class="{ 'is-converting': busy, 'has-page-results': sheets.length && !resultPdf }"
    aria-label="Excel to PDF converter"
    :aria-busy="busy"
  >
    <div class="converter-heading">
      <div>
        <span class="mini-label">SPREADSHEET TO PDF</span>
        <h2>Excel <span aria-hidden="true">→</span> PDF</h2>
      </div>
      <span class="free-badge">Free to use</span>
    </div>

    <ol class="step-track" aria-label="Conversion steps">
      <li
        v-for="(label, index) in ['Upload', 'Review sheets', 'Download']"
        :key="label"
        :class="{ current: stage === index + 1, complete: stage > index + 1 }"
        :aria-current="stage === index + 1 ? 'step' : undefined"
      >
        <span>
          <Check v-if="stage > index + 1" :size="12" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        {{ label }}
      </li>
    </ol>

    <input
      id="excel-input"
      ref="input"
      class="visually-hidden"
      tabindex="-1"
      type="file"
      accept=".xlsx, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
      :disabled="busy"
      aria-label="Choose an Excel spreadsheet"
      @change="chooseFile"
    />

    <!-- Result Stage (Stage 3) -->
    <template v-if="resultPdf">
      <div class="result-state">
        <div class="file-chosen-icon">
          <FileBadge type="pdf" />
          <span><Check :size="12" /></span>
        </div>
        <h3>Your PDF spreadsheet is ready!</h3>
        <p>Your spreadsheet rows, columns, and data have been formatted into a clean PDF document.</p>
        <div class="selected-file">
          <FileBadge type="pdf" small />
          <div>
            <strong>{{ resultPdf.filename }}</strong>
            <span>{{ formatSize(resultPdf.size) }} · PDF spreadsheet</span>
          </div>
        </div>
        <div class="result-actions" style="display: flex; gap: 10px; margin-top: 16px;">
          <a class="primary-button" :href="resultPdf.url" :download="resultPdf.filename">
            <Download :size="18" /> Download PDF again
          </a>
          <button class="text-button" @click="clear()">
            <RotateCcw :size="16" /> Convert another file
          </button>
        </div>
      </div>
    </template>

    <!-- Review & Options Stage (Stage 2) -->
    <template v-else-if="sheets.length">
      <div class="image-selection-summary">
        <div>
          <strong>{{ sheets.length }} sheet{{ sheets.length > 1 ? 's' : '' }} detected</strong>
          <span>{{ file.name }} ({{ formatSize(file.size) }})</span>
        </div>
        <button class="icon-button" :disabled="busy" aria-label="Choose another spreadsheet" @click="clear()">
          <X :size="17" />
        </button>
      </div>

      <!-- Sheet Tabs if multiple sheets -->
      <div v-if="sheets.length > 1" class="excel-sheet-tabs" role="tablist" aria-label="Spreadsheet sheets">
        <button
          v-for="(sh, idx) in sheets"
          :key="sh.name"
          role="tab"
          :aria-selected="activeSheetIndex === idx"
          class="excel-sheet-tab"
          :class="{ active: activeSheetIndex === idx }"
          :disabled="busy"
          @click="activeSheetIndex = idx"
        >
          <Table :size="14" />
          <span>{{ sh.name }}</span>
          <small>({{ sh.rowCount }} rows)</small>
        </button>
      </div>

      <!-- Sheet Data Preview Card -->
      <div v-if="activeSheet" class="excel-preview-card">
        <div class="excel-preview-header">
          <div class="excel-preview-meta">
            <Table :size="16" />
            <strong>{{ activeSheet.name }}</strong>
            <span class="excel-pill">{{ activeSheet.rowCount }} rows · {{ activeSheet.colCount }} cols</span>
          </div>
          <span class="excel-preview-hint">Live Data Preview</span>
        </div>

        <div class="excel-table-scroll">
          <table class="excel-preview-table">
            <thead>
              <tr>
                <th class="excel-th-index">#</th>
                <th v-for="cIndex in Math.min(activeSheet.colCount, 12)" :key="cIndex">
                  Col {{ cIndex }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rIdx) in activeSheet.rows.slice(0, 10)" :key="rIdx">
                <td class="excel-td-index">{{ rIdx + 1 }}</td>
                <td v-for="(cell, cIdx) in row.slice(0, 12)" :key="cIdx">
                  {{ cell || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="activeSheet.rowCount > 10 || activeSheet.colCount > 12" class="excel-preview-footer">
          <span>Showing preview of first 10 rows and 12 columns. All rows and columns will be included in the PDF export.</span>
        </div>
      </div>

      <!-- Conversion Options -->
      <div class="image-output-options" style="grid-template-columns: 1fr 1fr; margin-top: 14px;">
        <label>
          Page Orientation
          <select v-model="orientation" :disabled="busy">
            <option value="landscape">Landscape (Recommended for tables)</option>
            <option value="portrait">Portrait (Standard vertical)</option>
          </select>
        </label>
        <label>
          Sheets to Export
          <select v-model="exportScope" :disabled="busy">
            <option value="all">All Sheets (Complete Workbook)</option>
            <option value="current">Current Sheet Only ("{{ activeSheet?.name }}")</option>
          </select>
        </label>
      </div>

      <div class="excel-options-row" style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
        <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #475569; cursor: pointer;">
          <input type="checkbox" v-model="gridlines" :disabled="busy" style="width: 16px; height: 16px; accent-color: #059669;" />
          <span>Include table gridline borders in PDF</span>
        </label>
      </div>

      <button class="primary-button image-download-selected" :disabled="busy" @click="convertToPdf" style="margin-top: 16px;">
        <LoaderCircle v-if="busy" class="spinning" :size="18" />
        <FileSpreadsheet v-else :size="18" />
        {{ busy ? 'Converting spreadsheet to PDF…' : 'Convert spreadsheet to PDF' }}
      </button>
    </template>

    <!-- Upload Stage (Stage 1) -->
    <template v-else>
      <div
        class="drop-zone"
        :class="{ dragging, 'has-file': file }"
        @dragenter.prevent="dragEnter"
        @dragover.prevent="dragOver"
        @dragleave.prevent="dragLeave"
        @drop.prevent="drop"
      >
        <template v-if="file">
          <div class="file-chosen-icon">
            <FileBadge type="excel" />
            <span><Check :size="12" /></span>
          </div>
          <h3>Your spreadsheet is ready.</h3>
          <p>Open it to review sheets, preview tables, and generate your PDF.</p>
          <div class="selected-file">
            <FileBadge type="excel" small />
            <div>
              <strong>{{ file.name }}</strong>
              <span>{{ formatSize(file.size) }} · Excel spreadsheet</span>
            </div>
            <button class="icon-button" :disabled="busy" aria-label="Remove selected spreadsheet" @click="clear()">
              <X :size="17" />
            </button>
          </div>
          <button class="text-button" :disabled="busy" @click="input?.click()">
            Choose a different spreadsheet
          </button>
        </template>
        <template v-else>
          <div class="document-pair excel-pdf-pair" aria-hidden="true">
            <FileBadge type="excel" />
            <span class="pair-arrow">→</span>
            <FileBadge type="pdf" />
          </div>
          <h3>{{ dragging ? 'Drop it here.' : 'Drop your Excel spreadsheet here' }}</h3>
          <p>Convert your spreadsheets, workbooks, and CSV tables into clean PDF reports.</p>
          <button
            ref="uploadButton"
            class="choose-button"
            aria-describedby="excel-requirements"
            @click="input?.click()"
          >
            <Upload :size="17" /> Choose Excel file
          </button>
          <span id="excel-requirements" class="file-requirements">
            .XLSX or .CSV <span>·</span> Up to 20 MB <span>·</span> 100% private in browser
          </span>
        </template>
      </div>

      <button v-if="file" class="primary-button convert-button" :disabled="busy" @click="loadWorkbook">
        <LoaderCircle v-if="busy" class="spinning" :size="19" />
        <template v-if="busy">Reading spreadsheet…</template>
        <template v-else>Preview and convert to PDF</template>
      </button>
    </template>

    <template v-if="busy">
      <div class="progress-track" role="status">
        <span />
        <p>{{ progress }} Keep this page open.</p>
      </div>
      <button class="text-button cancel-conversion" @click="cancel">Cancel</button>
    </template>

    <div v-if="error" class="error-message" role="alert">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
    </div>

    <p class="conversion-note">
      Spreadsheet workbooks are processed directly on your device. Table rows, numeric data, and headers are preserved without uploading files to any remote server.
    </p>

    <div class="converter-assurance">
      <LockKeyhole :size="13" />
      <span>Processed on your device. No document uploads.</span>
    </div>
  </section>
</template>

