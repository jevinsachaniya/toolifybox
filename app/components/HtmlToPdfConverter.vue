<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  ArrowRight,
  Check,
  CircleAlert,
  Code2,
  Copy,
  Download,
  Eye,
  FileCode,
  FileText,
  FileUp,
  Laptop,
  Layers,
  LoaderCircle,
  Maximize2,
  Monitor,
  Palette,
  Printer,
  RefreshCw,
  RotateCcw,
  Settings2,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  X,
} from '@lucide/vue';
import CustomSelect from '~/components/CustomSelect.vue';
import { formatSize } from '~/utils/document.js';
import {
  combineHtmlAndCss,
  convertHtmlToPdf,
  htmlToPdfFilename,
  HTML_PAGE_MARGINS,
  HTML_PAGE_SIZES,
  HTML_TEMPLATES,
  validateHtmlInput,
} from '~/utils/html-to-pdf.js';

// State
const selectedTemplateId = ref('invoice');
const activeEditorTab = ref('html'); // 'html' | 'css'
const viewMode = ref('split'); // 'split' | 'editor' | 'preview'
const previewDevice = ref('print'); // 'print' | 'desktop' | 'tablet' | 'mobile'

// Editor Code
const htmlCode = ref('');
const cssCode = ref('');
const outputFilename = ref('invoice.pdf');

// PDF Export Settings
const pageSize = ref('a4');
const orientation = ref('portrait');
const pageMargin = ref('standard');
const scaleResolution = ref(2); // 1 = standard, 2 = retina, 3 = ultra
const pageNumbering = ref('none'); // 'none' | 'bottom-center' | 'bottom-right'
const printBackground = ref(true);

// Process state
const busy = ref(false);
const progressMessage = ref('');
const error = ref('');
const toastMessage = ref('');
const toastTimer = ref(null);
const result = ref(null);
const previewIframeRef = ref(null);
const lineNumbersRef = ref(null);

let abortController = null;
let previewDebounceTimer = null;

function syncScroll(e) {
  if (lineNumbersRef.value && e?.target) {
    lineNumbersRef.value.scrollTop = e.target.scrollTop;
  }
}

// Select Options
const TEMPLATE_OPTIONS = HTML_TEMPLATES.map(tpl => ({
  value: tpl.id,
  label: tpl.name,
  sublabel: tpl.badge,
}));

const PAGE_SIZE_OPTIONS = Object.entries(HTML_PAGE_SIZES).map(([val, info]) => ({
  value: val,
  label: info.name,
  sublabel: info.desc,
}));

const MARGIN_OPTIONS = Object.entries(HTML_PAGE_MARGINS).map(([val, info]) => ({
  value: val,
  label: `${info.name} (${info.top}mm)`,
  sublabel: info.desc,
}));

const SCALE_OPTIONS = [
  { value: 1, label: '1x Standard', sublabel: '96 DPI' },
  { value: 2, label: '2x High-Res', sublabel: 'Retina print' },
  { value: 3, label: '3x Ultra HD', sublabel: '300 DPI' },
];

const NUMBERING_OPTIONS = [
  { value: 'none', label: 'None', sublabel: 'No page numbers' },
  { value: 'bottom-center', label: 'Bottom Center', sublabel: 'Page X of Y' },
  { value: 'bottom-right', label: 'Bottom Right', sublabel: 'Page X of Y' },
];

// Stats
const htmlLineCount = computed(() => (htmlCode.value ? htmlCode.value.split('\n').length : 0));
const cssLineCount = computed(() => (cssCode.value ? cssCode.value.split('\n').length : 0));
const htmlCharCount = computed(() => (htmlCode.value ? htmlCode.value.length : 0));

// Load template code
function applyTemplate(tplId) {
  const tpl = HTML_TEMPLATES.find(t => t.id === tplId) || HTML_TEMPLATES[0];
  htmlCode.value = tpl.html;
  cssCode.value = tpl.css;
  orientation.value = tpl.orientation || 'portrait';
  pageSize.value = tpl.pageSize || 'a4';
  outputFilename.value = `${tpl.id}.pdf`;
  error.value = '';
  triggerPreviewUpdate();
}

function showToast(msg) {
  toastMessage.value = msg;
  if (toastTimer.value) clearTimeout(toastTimer.value);
  toastTimer.value = setTimeout(() => {
    toastMessage.value = '';
  }, 3200);
}

// Copy active editor code
async function copyActiveCode() {
  const text = activeEditorTab.value === 'html' ? htmlCode.value : cssCode.value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast(`${activeEditorTab.value.toUpperCase()} code copied to clipboard!`);
  } catch {
    showToast('Failed to copy to clipboard.');
  }
}

// Handle file import (.html, .htm, .txt)
function handleFileImport(event) {
  const file = event.target?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = String(e.target?.result || '');
    if (file.name.endsWith('.css')) {
      cssCode.value = content;
      activeEditorTab.value = 'css';
      showToast(`Imported styles from ${file.name}`);
    } else {
      // Check if file has embedded <style>
      const styleMatch = content.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
      if (styleMatch) {
        cssCode.value = styleMatch[1].trim();
        htmlCode.value = content.replace(/<style\b[^>]*>[\s\S]*?<\/style>/i, '').trim();
      } else {
        htmlCode.value = content;
      }
      outputFilename.value = htmlToPdfFilename(file.name);
      activeEditorTab.value = 'html';
      showToast(`Imported HTML from ${file.name}`);
    }
    triggerPreviewUpdate();
  };
  reader.readAsText(file);
  event.target.value = '';
}

// Update the live iframe preview
function triggerPreviewUpdate() {
  if (previewDebounceTimer) clearTimeout(previewDebounceTimer);
  previewDebounceTimer = setTimeout(() => {
    renderIframePreview();
  }, 200);
}

function renderIframePreview() {
  const iframe = previewIframeRef.value;
  if (!iframe) return;

  const combined = combineHtmlAndCss(htmlCode.value, cssCode.value, {
    pageSize: pageSize.value,
    orientation: orientation.value,
    margin: pageMargin.value,
    title: outputFilename.value.replace(/\.pdf$/i, ''),
  });

  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(combined);
      doc.close();
    }
  } catch (err) {
    console.error('Preview render error:', err);
  }
}

// Handle tab key indentation inside code textareas
function handleCodeKeydown(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const target = e.target;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const val = target.value;
    target.value = val.substring(0, start) + '  ' + val.substring(end);
    target.selectionStart = target.selectionEnd = start + 2;
    if (activeEditorTab.value === 'html') {
      htmlCode.value = target.value;
    } else {
      cssCode.value = target.value;
    }
    triggerPreviewUpdate();
  }
}

// Convert HTML to PDF
async function handleConvertPdf() {
  const validation = validateHtmlInput(htmlCode.value, cssCode.value);
  if (validation) {
    error.value = validation;
    return;
  }

  busy.value = true;
  progressMessage.value = 'Initializing in-browser converter...';
  error.value = '';
  result.value = null;

  abortController = new AbortController();

  try {
    const res = await convertHtmlToPdf({
      html: htmlCode.value,
      css: cssCode.value,
      pageSize: pageSize.value,
      orientation: orientation.value,
      margin: pageMargin.value,
      scale: scaleResolution.value,
      filename: outputFilename.value,
      pageNumbering: pageNumbering.value,
      printBackground: printBackground.value,
      signal: abortController.signal,
      onProgress: (msg) => {
        progressMessage.value = msg;
      },
    });

    const downloadUrl = URL.createObjectURL(res.blob);
    result.value = {
      ...res,
      downloadUrl,
      formattedSize: formatSize(res.size),
    };

    // Auto-trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = res.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Successfully converted to ${res.filename} (${res.pageCount} page${res.pageCount > 1 ? 's' : ''})`);
  } catch (err) {
    if (err?.name !== 'AbortError') {
      error.value = err?.message || 'Failed to convert HTML to PDF. Please check your code syntax.';
    }
  } finally {
    busy.value = false;
    abortController = null;
  }
}

// Vector browser print
function handleVectorPrint() {
  const combined = combineHtmlAndCss(htmlCode.value, cssCode.value, {
    pageSize: pageSize.value,
    orientation: orientation.value,
    margin: pageMargin.value,
    title: outputFilename.value.replace(/\.pdf$/i, ''),
  });

  const printWindow = window.open('', '_blank', 'width=900,height=750');
  if (!printWindow) {
    showToast('Please allow popups to open the vector print window.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(combined);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };
}

function cancelConversion() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  busy.value = false;
  progressMessage.value = '';
}

function resetToTemplate() {
  applyTemplate(selectedTemplateId.value);
  showToast('Reset to starter template.');
}

watch(selectedTemplateId, (newId) => {
  applyTemplate(newId);
});

watch([pageSize, orientation, pageMargin], () => {
  triggerPreviewUpdate();
});

onMounted(() => {
  applyTemplate(selectedTemplateId.value);
  nextTick(() => {
    renderIframePreview();
  });
});

onBeforeUnmount(() => {
  if (toastTimer.value) clearTimeout(toastTimer.value);
  if (previewDebounceTimer) clearTimeout(previewDebounceTimer);
  if (result.value?.downloadUrl) {
    URL.revokeObjectURL(result.value.downloadUrl);
  }
});
</script>

<template>
  <div id="converter" class="converter-card html-to-pdf-converter">
    <!-- Top Action Bar -->
    <div class="converter-header-bar">
      <div class="template-picker">
        <label for="template-select" class="picker-label">
          <Sparkles :size="14" /> Template:
        </label>
        <div class="custom-select-wrap">
          <CustomSelect
            id="template-select"
            v-model="selectedTemplateId"
            :options="TEMPLATE_OPTIONS"
            placeholder="Select Template"
            size="sm"
          />
        </div>
      </div>

      <div class="view-controls">
        <div class="segmented-control" role="tablist">
          <button
            type="button"
            class="seg-btn"
            :class="{ active: viewMode === 'split' }"
            @click="viewMode = 'split'"
            title="Split Code &amp; Preview"
          >
            <Layers :size="14" />
            <span>Split</span>
          </button>
          <button
            type="button"
            class="seg-btn"
            :class="{ active: viewMode === 'editor' }"
            @click="viewMode = 'editor'"
            title="Code Editor Full Width"
          >
            <Code2 :size="14" />
            <span>Code Only</span>
          </button>
          <button
            type="button"
            class="seg-btn"
            :class="{ active: viewMode === 'preview' }"
            @click="viewMode = 'preview'"
            title="Preview Full Width"
          >
            <Eye :size="14" />
            <span>Preview</span>
          </button>
        </div>

        <label class="icon-button import-btn" title="Import HTML or CSS file">
          <FileUp :size="15" />
          <span>Import</span>
          <input
            type="file"
            accept=".html,.htm,.css,.txt"
            class="hidden-file-input"
            @change="handleFileImport"
          />
        </label>

        <button
          type="button"
          class="icon-button"
          title="Reset to starter template"
          @click="resetToTemplate"
        >
          <RotateCcw :size="14" />
        </button>
      </div>
    </div>

    <!-- Main Workspace (Editor + Sandbox Preview) -->
    <div class="html-pdf-workspace" :class="`mode-${viewMode}`">
      <!-- Left Panel: Code Editor -->
      <div v-show="viewMode !== 'preview'" class="code-editor-panel">
        <div class="editor-subbar">
          <div class="editor-tabs">
            <button
              type="button"
              class="tab-btn"
              :class="{ active: activeEditorTab === 'html' }"
              @click="activeEditorTab = 'html'"
            >
              <FileCode :size="14" />
              <span>HTML</span>
              <span class="tab-badge">{{ htmlLineCount }} lines</span>
            </button>
            <button
              type="button"
              class="tab-btn"
              :class="{ active: activeEditorTab === 'css' }"
              @click="activeEditorTab = 'css'"
            >
              <Palette :size="14" />
              <span>CSS Styles</span>
              <span class="tab-badge">{{ cssLineCount }} lines</span>
            </button>
          </div>

          <div class="editor-actions">
            <button
              type="button"
              class="tiny-btn"
              title="Copy current code"
              @click="copyActiveCode"
            >
              <Copy :size="12" /> Copy
            </button>
          </div>
        </div>

        <div class="code-editor-body">
          <div ref="lineNumbersRef" class="line-numbers-gutter" aria-hidden="true">
            <span
              v-for="lineIndex in (activeEditorTab === 'html' ? htmlLineCount : cssLineCount)"
              :key="lineIndex"
              class="line-num"
            >
              {{ lineIndex }}
            </span>
          </div>

          <div class="code-textarea-wrap">
            <textarea
              v-if="activeEditorTab === 'html'"
              v-model="htmlCode"
              class="code-textarea html-mode"
              placeholder="Type or paste HTML code here..."
              spellcheck="false"
              @scroll="syncScroll"
              @input="triggerPreviewUpdate"
              @keydown="handleCodeKeydown"
            />
            <textarea
              v-else
              v-model="cssCode"
              class="code-textarea css-mode"
              placeholder="Type or paste CSS rules here..."
              spellcheck="false"
              @scroll="syncScroll"
              @input="triggerPreviewUpdate"
              @keydown="handleCodeKeydown"
            />
          </div>
        </div>
      </div>

      <!-- Right Panel: Live Sandboxed Preview -->
      <div v-show="viewMode !== 'editor'" class="preview-panel">
        <div class="preview-subbar">
          <div class="preview-label">
            <span class="status-dot pulse" />
            <span>Live Render View</span>
          </div>

          <div class="device-switcher">
            <button
              type="button"
              class="dev-btn"
              :class="{ active: previewDevice === 'print' }"
              title="Print Sheet View (A4)"
              @click="previewDevice = 'print'"
            >
              <Printer :size="13" />
              <span>Sheet</span>
            </button>
            <button
              type="button"
              class="dev-btn"
              :class="{ active: previewDevice === 'desktop' }"
              title="Desktop View"
              @click="previewDevice = 'desktop'"
            >
              <Monitor :size="13" />
            </button>
            <button
              type="button"
              class="dev-btn"
              :class="{ active: previewDevice === 'tablet' }"
              title="Tablet View (768px)"
              @click="previewDevice = 'tablet'"
            >
              <Tablet :size="13" />
            </button>
            <button
              type="button"
              class="dev-btn"
              :class="{ active: previewDevice === 'mobile' }"
              title="Mobile View (375px)"
              @click="previewDevice = 'mobile'"
            >
              <Smartphone :size="13" />
            </button>
          </div>
        </div>

        <div class="iframe-container" :class="`device-${previewDevice}`">
          <iframe
            ref="previewIframeRef"
            class="preview-iframe"
            title="HTML to PDF Live Preview"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </div>
    </div>

    <!-- PDF Document Configuration Controls -->
    <div class="settings-drawer">
      <div class="settings-drawer-title">
        <Settings2 :size="16" />
        <span>PDF Document &amp; Page Settings</span>
      </div>

      <div class="settings-grid">
        <div class="field-item">
          <label>Page Format</label>
          <CustomSelect
            v-model="pageSize"
            :options="PAGE_SIZE_OPTIONS"
            placeholder="Select Page Size"
            size="sm"
          />
        </div>

        <div class="field-item">
          <label>Orientation</label>
          <div class="btn-group-toggle">
            <button
              type="button"
              class="toggle-option-btn"
              :class="{ active: orientation === 'portrait' }"
              @click="orientation = 'portrait'"
            >
              Portrait
            </button>
            <button
              type="button"
              class="toggle-option-btn"
              :class="{ active: orientation === 'landscape' }"
              @click="orientation = 'landscape'"
            >
              Landscape
            </button>
          </div>
        </div>

        <div class="field-item">
          <label>Margins</label>
          <CustomSelect
            v-model="pageMargin"
            :options="MARGIN_OPTIONS"
            placeholder="Select Margins"
            size="sm"
          />
        </div>

        <div class="field-item">
          <label>Render Quality</label>
          <CustomSelect
            v-model="scaleResolution"
            :options="SCALE_OPTIONS"
            placeholder="Select Quality"
            size="sm"
          />
        </div>

        <div class="field-item">
          <label>Page Numbering</label>
          <CustomSelect
            v-model="pageNumbering"
            :options="NUMBERING_OPTIONS"
            placeholder="Page Numbers"
            size="sm"
          />
        </div>

        <div class="field-item">
          <label for="pdf-filename-input">Output Filename</label>
          <input
            id="pdf-filename-input"
            v-model="outputFilename"
            type="text"
            class="text-input"
            placeholder="document.pdf"
          />
        </div>
      </div>

      <div class="checkbox-row">
        <label class="custom-checkbox">
          <input v-model="printBackground" type="checkbox" />
          <span>Print Background Graphics &amp; Colors</span>
        </label>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
      <button type="button" class="close-err-btn" @click="error = ''"><X :size="14" /></button>
    </div>

    <!-- Action Buttons -->
    <div class="converter-actions-bar">
      <button
        type="button"
        class="secondary-button"
        title="Open browser vector print dialog"
        :disabled="busy || !htmlCode.trim()"
        @click="handleVectorPrint"
      >
        <Printer :size="16" />
        <span>Vector Print</span>
      </button>

      <button
        type="button"
        class="primary-button"
        :disabled="busy || !htmlCode.trim()"
        @click="handleConvertPdf"
      >
        <LoaderCircle v-if="busy" class="spin" :size="18" />
        <Download v-else :size="18" />
        <span>{{ busy ? 'Converting...' : 'Convert &amp; Download PDF' }}</span>
      </button>

      <button
        v-if="busy"
        type="button"
        class="cancel-button"
        @click="cancelConversion"
      >
        Cancel
      </button>
    </div>

    <!-- Progress Notification -->
    <div v-if="busy" class="progress-pill">
      <LoaderCircle class="spin" :size="14" />
      <span>{{ progressMessage }}</span>
    </div>

    <!-- Success Output Card -->
    <div v-if="result" class="result-card">
      <div class="result-icon-badge"><Check :size="20" /></div>
      <div class="result-info">
        <h4 class="result-title">{{ result.filename }}</h4>
        <div class="result-meta">
          <span>{{ result.formattedSize }}</span>
          <span>•</span>
          <span>{{ result.pageCount }} Page{{ result.pageCount > 1 ? 's' : '' }}</span>
          <span>•</span>
          <span class="badge-tag">100% Client-Side</span>
        </div>
      </div>
      <a :href="result.downloadUrl" :download="result.filename" class="download-again-btn">
        <Download :size="14" /> Download Again
      </a>
    </div>

    <!-- Floating Toast Notification -->
    <Transition name="fade">
      <div v-if="toastMessage" class="converter-toast">
        <Check :size="14" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.html-to-pdf-converter {
  position: relative;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: var(--radius-lg, 16px);
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 100%;
  box-sizing: border-box;
}
html[data-theme='dark'] .html-to-pdf-converter {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
}

/* Header Bar */
.converter-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border, #e2e8f0);
  width: 100%;
  box-sizing: border-box;
}
html[data-theme='dark'] .converter-header-bar {
  border-color: #334155;
}
.template-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-wrap: wrap;
}
.picker-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}
html[data-theme='dark'] .picker-label {
  color: #94a3b8;
}
.custom-select-wrap {
  min-width: 210px;
  max-width: 100%;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.segmented-control {
  display: inline-flex;
  background: var(--surface-muted, #f1f5f9);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--border);
}
.seg-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.seg-btn.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
html[data-theme='dark'] .segmented-control {
  background: #0f172a;
  border-color: #334155;
}
html[data-theme='dark'] .seg-btn {
  color: #94a3b8;
}
html[data-theme='dark'] .seg-btn:hover {
  color: #f1f5f9;
}
html[data-theme='dark'] .seg-btn.active {
  background: #1e293b;
  color: #fb7185;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.icon-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  cursor: pointer;
  transition: background 0.15s;
}
.icon-button:hover {
  background: var(--surface-hover, #f8fafc);
}
html[data-theme='dark'] .icon-button {
  background: #0f172a;
  border-color: #334155;
  color: #e2e8f0;
}
html[data-theme='dark'] .icon-button:hover {
  background: #1e293b;
  color: #ffffff;
  border-color: #475569;
}
.hidden-file-input {
  display: none;
}

/* Workspace Grid */
.html-pdf-workspace {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: 520px;
}
.html-pdf-workspace.mode-editor {
  grid-template-columns: 1fr;
}
.html-pdf-workspace.mode-preview {
  grid-template-columns: 1fr;
}

/* Code Editor Panel - Fixed height & internal scrolling */
.code-editor-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
.editor-subbar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}
.editor-tabs {
  display: flex;
  gap: 6px;
}
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
  background: transparent;
  color: #94a3b8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.tab-btn:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.06);
}
.tab-btn.active {
  background: #0f172a;
  color: #fb7185;
  border-color: #334155;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}
.tab-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
}
.tiny-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid #475569;
  background: #334155;
  border-radius: 6px;
  cursor: pointer;
  color: #e2e8f0;
  transition: all 0.15s ease;
}
.tiny-btn:hover {
  background: #475569;
  color: #ffffff;
}

/* Code Editor Body & Line Numbers Gutter */
.code-editor-body {
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  background: #0f172a;
  overflow: hidden;
  position: relative;
}
.line-numbers-gutter {
  width: 48px;
  height: 100%;
  padding: 14px 8px 14px 4px;
  background: #0b0f19;
  border-right: 1px solid #1e293b;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12.5px;
  text-align: right;
  user-select: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.line-num {
  height: 20px;
  line-height: 20px;
  opacity: 0.75;
  flex-shrink: 0;
}

.code-textarea-wrap {
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  background: #0f172a;
  overflow: hidden;
}
.code-textarea {
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 14px 16px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12.5px;
  line-height: 20px;
  border: none;
  resize: none;
  background: #0f172a !important;
  color: #f8fafc !important; /* High contrast, crisp white code text */
  caret-color: #fb7185;
  outline: none;
  tab-size: 2;
  white-space: pre;
  word-wrap: normal;
  overflow-y: auto;
  overflow-x: auto;
}
.code-textarea::selection {
  background: #e11d48;
  color: #ffffff;
}
.code-textarea::placeholder {
  color: #64748b;
}

/* Custom scrollbar on Code Textarea */
.code-textarea::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.code-textarea::-webkit-scrollbar-track {
  background: #0b0f19;
}
.code-textarea::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}
.code-textarea::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
.code-textarea::-webkit-scrollbar-corner {
  background: #0b0f19;
}

/* Preview Panel */
.preview-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface-muted, #f8fafc);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}
html[data-theme='dark'] .preview-panel {
  background: #0b0f19;
  border-color: #334155;
}
.preview-subbar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
html[data-theme='dark'] .preview-subbar {
  background: #1e293b;
  border-bottom-color: #334155;
}
.preview-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}
html[data-theme='dark'] .preview-label {
  color: #cbd5e1;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}
.status-dot.pulse {
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulse-green 2s infinite;
}
@keyframes pulse-green {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.device-switcher {
  display: flex;
  align-items: center;
  gap: 4px;
}
.dev-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-muted);
}
.dev-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}
.dev-btn.active {
  background: var(--surface-muted, #f1f5f9);
  border-color: var(--border);
  color: var(--accent, #e11d48);
}
html[data-theme='dark'] .dev-btn {
  color: #94a3b8;
}
html[data-theme='dark'] .dev-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
}
html[data-theme='dark'] .dev-btn.active {
  background: #0f172a;
  border-color: #334155;
  color: #fb7185;
}

.iframe-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 16px;
  background: #cbd5e1;
  overflow: auto;
  min-height: 380px;
}
html[data-theme='dark'] .iframe-container {
  background: #090d16;
}

.preview-iframe {
  width: 100%;
  height: 520px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  transition: width 0.2s ease;
}
.iframe-container.device-print .preview-iframe {
  max-width: 600px;
  height: 720px;
}
.iframe-container.device-desktop .preview-iframe {
  max-width: 100%;
}
.iframe-container.device-tablet .preview-iframe {
  max-width: 768px;
}
.iframe-container.device-mobile .preview-iframe {
  max-width: 375px;
}

/* Settings Drawer */
.settings-drawer {
  background: var(--surface-muted, #f8fafc);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}
html[data-theme='dark'] .settings-drawer {
  background: #0f172a;
  border-color: #334155;
}
.settings-drawer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 14px;
}
html[data-theme='dark'] .settings-drawer-title {
  color: #f1f5f9;
}
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 14px;
  margin-bottom: 12px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}
.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}
.field-item label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}
html[data-theme='dark'] .field-item label {
  color: #94a3b8;
}
.btn-group-toggle {
  display: flex;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border-radius: 6px;
  border: 1px solid var(--border);
  overflow: hidden;
}
html[data-theme='dark'] .btn-group-toggle {
  border-color: #334155;
}
.toggle-option-btn {
  flex: 1;
  min-width: 0;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}
.toggle-option-btn.active {
  background: var(--accent, #e11d48);
  color: #ffffff;
}
html[data-theme='dark'] .toggle-option-btn {
  background: #1e293b;
  color: #94a3b8;
}
html[data-theme='dark'] .toggle-option-btn:hover {
  color: #f1f5f9;
}
html[data-theme='dark'] .toggle-option-btn.active {
  background: #e11d48;
  color: #ffffff;
}
.text-input {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 8px 10px;
  font-size: 13px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
}
html[data-theme='dark'] .text-input {
  background: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}
html[data-theme='dark'] .text-input:focus {
  border-color: #fb7185;
  outline: none;
}

/* Ensure all nested CustomSelect components strictly fit container width */
:deep(.custom-select-wrapper) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
}
:deep(.custom-select-trigger) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
}
:deep(.custom-select-trigger-content) {
  min-width: 0 !important;
  max-width: 100% !important;
  flex: 1 !important;
  overflow: hidden !important;
}
:deep(.custom-select-label) {
  display: block !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  min-width: 0 !important;
  max-width: 100% !important;
}

.checkbox-row {
  margin-top: 8px;
}
.custom-checkbox input[type="checkbox"] {
  accent-color: #e11d48;
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.custom-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
}
html[data-theme='dark'] .custom-checkbox {
  color: #e2e8f0;
}

/* Actions Bar */
.converter-actions-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border, #e2e8f0);
}
html[data-theme='dark'] .converter-actions-bar {
  border-color: #334155;
}
.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  background: var(--accent, #e11d48);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.25);
  transition: all 0.15s ease;
}
.primary-button:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
}
.primary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.secondary-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
}
.secondary-button:hover:not(:disabled) {
  background: var(--surface-hover, #f8fafc);
}
html[data-theme='dark'] .secondary-button {
  background: #0f172a;
  border-color: #334155;
  color: #e2e8f0;
}
html[data-theme='dark'] .secondary-button:hover:not(:disabled) {
  background: #1e293b;
  color: #ffffff;
  border-color: #475569;
}

.cancel-button {
  padding: 10px 16px;
  font-size: 13px;
  color: #ef4444;
  background: transparent;
  border: 1px solid #fecaca;
  border-radius: 8px;
  cursor: pointer;
}
html[data-theme='dark'] .cancel-button {
  border-color: #7f1d1d;
  color: #f87171;
}
html[data-theme='dark'] .cancel-button:hover {
  background: rgba(239, 68, 68, 0.12);
}

/* Progress Pill */
.progress-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: center;
  padding: 6px 14px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #be123c;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
html[data-theme='dark'] .progress-pill {
  background: rgba(30, 58, 138, 0.25);
  border-color: #9f1239;
  color: #fecdd3;
}
.spin {
  animation: rotate 1s linear infinite;
}
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
}
html[data-theme='dark'] .error-banner {
  background: rgba(127, 29, 29, 0.25);
  border-color: #991b1b;
  color: #fca5a5;
}
html[data-theme='dark'] .close-err-btn {
  color: #fca5a5;
}
.close-err-btn {
  margin-left: auto;
  background: transparent;
  border: none;
  color: #b91c1c;
  cursor: pointer;
}

/* Result Card */
.result-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  box-sizing: border-box;
  max-width: 100%;
}
html[data-theme='dark'] .result-card {
  background: rgba(6, 78, 59, 0.25);
  border-color: #065f46;
}
.result-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #16a34a;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.result-info {
  flex: 1;
  min-width: 0;
}
.result-title {
  font-size: 14px;
  font-weight: 700;
  color: #14532d;
  margin-bottom: 2px;
  word-break: break-all;
}
html[data-theme='dark'] .result-title {
  color: #86efac;
}
.result-meta {
  font-size: 12px;
  color: #166534;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
html[data-theme='dark'] .result-meta {
  color: #4ade80;
}
.badge-tag {
  background: #dcfce7;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}
html[data-theme='dark'] .badge-tag {
  background: #064e3b;
  color: #a7f3d0;
}
.download-again-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  background: #16a34a;
  border-radius: 6px;
  text-decoration: none;
  flex-shrink: 0;
  white-space: nowrap;
}
html[data-theme='dark'] .download-again-btn {
  background: #059669;
  color: #ffffff;
}
html[data-theme='dark'] .download-again-btn:hover {
  background: #10b981;
}

/* Toast */
.converter-toast {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0f172a;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 50;
  max-width: 90%;
  box-sizing: border-box;
}
html[data-theme='dark'] .converter-toast {
  background: #1e293b;
  color: #f8fafc;
  border: 1px solid #334155;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive Breakpoints */
@media (max-width: 860px) {
  .html-pdf-workspace {
    grid-template-columns: 1fr;
    height: auto;
    gap: 16px;
  }
  .code-editor-panel {
    height: 480px;
  }
  .preview-panel {
    height: 480px;
  }
  .converter-header-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .template-picker {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }
  .custom-select-wrap {
    width: 100%;
    min-width: 0;
  }
  .view-controls {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .segmented-control {
    width: 100%;
    display: flex;
    box-sizing: border-box;
  }
  .seg-btn {
    flex: 1;
    justify-content: center;
    padding: 6px 4px;
    font-size: 11.5px;
    gap: 4px;
  }
  .icon-button.import-btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .html-to-pdf-converter {
    padding: 16px 12px;
    border-radius: 14px;
    gap: 16px;
  }
  .code-editor-panel {
    height: 420px;
  }
  .preview-panel {
    height: 420px;
  }
  .tab-badge {
    display: none;
  }
  .tab-btn {
    padding: 5px 10px;
    font-size: 11px;
  }
  .settings-drawer {
    padding: 12px;
  }
  .settings-grid {
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
    gap: 12px;
  }
  .converter-actions-bar {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 10px;
    padding-top: 14px;
  }
  .primary-button,
  .secondary-button,
  .cancel-button {
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
    padding: 12px 16px;
    font-size: 13.5px;
  }
  .result-card {
    flex-wrap: wrap;
    gap: 12px;
    padding: 14px;
  }
  .result-info {
    flex: 1 1 calc(100% - 52px);
    min-width: 0;
  }
  .result-title {
    font-size: 13.5px;
    word-break: break-all;
  }
  .result-meta {
    font-size: 11.5px;
    gap: 4px 6px;
  }
  .download-again-btn {
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
    padding: 10px 14px;
    font-size: 13px;
  }
}
</style>
