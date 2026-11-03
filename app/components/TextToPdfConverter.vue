<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  BookOpen,
  Check,
  CircleAlert,
  Clipboard,
  Copy,
  Download,
  Eye,
  FileCheck,
  FileText,
  FileUp,
  Hash,
  Layers,
  LoaderCircle,
  Palette,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Type,
  Upload,
  X,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import {
  COLOR_THEMES,
  convertTextToPdf,
  FONT_FAMILIES,
  PAGE_MARGINS,
  PAGE_SIZES,
  SAMPLE_TEXTS,
} from '~/utils/text-to-pdf.js';

// Document Text & Metadata
const text = ref(SAMPLE_TEXTS[0].text);
const title = ref(SAMPLE_TEXTS[0].title);
const subtitle = ref(SAMPLE_TEXTS[0].subtitle);
const author = ref(SAMPLE_TEXTS[0].author);
const filename = ref('document.pdf');

// Formatting & Typography
const fontFamily = ref('helvetica');
const fontSize = ref(12);
const lineSpacing = ref(1.5);
const textAlign = ref('left');

// Page Setup
const pageSize = ref('a4');
const orientation = ref('portrait');
const margin = ref('normal');
const theme = ref('classic');

// Header & Footer
const headerText = ref('');
const includePageNumbers = ref(true);
const pageNumberFormat = ref('page-of-total');
const pageNumberPosition = ref('bottom-center');

// States
const isGenerating = ref(false);
const progressMessage = ref('');
const error = ref('');
const notification = ref('');
const resultPdf = ref(null);
const fileInput = ref(null);

let noticeTimer = null;

function showNotice(msg) {
  notification.value = msg;
  if (noticeTimer) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notification.value = '';
  }, 3000);
}

// Text Analysis Stats
const textStats = computed(() => {
  const content = text.value || '';
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const lines = content ? content.split('\n').length : 0;
  // Estimate reading time at 200 words/min
  const readingTime = Math.max(1, Math.ceil(words / 200));
  // Estimate pages (~450 words per A4 page at 12pt standard margins)
  const estPages = Math.max(1, Math.ceil(words / 420));

  return { words, chars, lines, readingTime, estPages };
});

// Load Sample Text
function loadSample(index = 0) {
  const s = SAMPLE_TEXTS[index] || SAMPLE_TEXTS[0];
  text.value = s.text;
  title.value = s.title;
  subtitle.value = s.subtitle;
  author.value = s.author;
  showNotice(`Sample "${s.title}" loaded!`);
}

// Clear Text
function clearAll() {
  text.value = '';
  title.value = '';
  subtitle.value = '';
  author.value = '';
  showNotice('Editor cleared.');
}

// Paste from Clipboard
async function pasteFromClipboard() {
  try {
    const clip = await navigator.clipboard.readText();
    if (clip) {
      text.value = text.value ? `${text.value}\n\n${clip}` : clip;
      showNotice('Pasted text from clipboard!');
    }
  } catch {
    showNotice('Clipboard access denied. Please paste using Ctrl+V / Cmd+V.');
  }
}

// Upload TXT / MD File
function handleFileUpload(e) {
  const files = e.target.files;
  if (!files || !files[0]) return;
  const f = files[0];

  const reader = new FileReader();
  reader.onload = (event) => {
    const content = event.target.result;
    text.value = content;
    // Set title from filename
    title.value = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    filename.value = f.name.replace(/\.[^/.]+$/, '') + '.pdf';
    showNotice(`Loaded "${f.name}"!`);
  };
  reader.onerror = () => {
    error.value = 'Failed to read uploaded text file.';
  };
  reader.readAsText(f);
  e.target.value = '';
}

// Generate PDF
async function handleGeneratePdf() {
  if (!text.value.trim() && !title.value.trim()) {
    error.value = 'Please enter or paste some text to convert into a PDF.';
    return;
  }

  isGenerating.value = true;
  error.value = '';
  progressMessage.value = 'Preparing text…';

  try {
    const result = await convertTextToPdf({
      text: text.value,
      title: title.value,
      subtitle: subtitle.value,
      author: author.value,
      fontFamily: fontFamily.value,
      fontSize: Number(fontSize.value),
      lineSpacing: Number(lineSpacing.value),
      textAlign: textAlign.value,
      pageSize: pageSize.value,
      orientation: orientation.value,
      margin: margin.value,
      theme: theme.value,
      headerText: headerText.value,
      includePageNumbers: includePageNumbers.value,
      pageNumberFormat: pageNumberFormat.value,
      pageNumberPosition: pageNumberPosition.value,
      filename: filename.value || 'document.pdf',
      onProgress: (msg) => {
        progressMessage.value = msg;
      },
    });

    resultPdf.value = result;
    showNotice(`PDF generated successfully (${result.pageCount} pages)!`);
  } catch (err) {
    console.error('Text to PDF generation failed:', err);
    error.value = 'Error generating PDF: ' + err.message;
  } finally {
    isGenerating.value = false;
    progressMessage.value = '';
  }
}

function resetResult() {
  if (resultPdf.value?.url) {
    URL.revokeObjectURL(resultPdf.value.url);
  }
  resultPdf.value = null;
}

onBeforeUnmount(() => {
  if (resultPdf.value?.url) {
    URL.revokeObjectURL(resultPdf.value.url);
  }
  if (noticeTimer) clearTimeout(noticeTimer);
});
</script>

<template>
  <div class="text-to-pdf-converter">
    <!-- Hidden File Input for .txt/.md files -->
    <input
      ref="fileInput"
      type="file"
      accept=".txt,.md,.text,.rtf,.log"
      style="display: none;"
      @change="handleFileUpload"
    />

    <!-- ================= STAGE 2: RESULT VIEW ================= -->
    <div v-if="resultPdf" class="result-state text-pdf-result">
      <div
        class="file-chosen-icon"
        style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; width: 64px; height: 64px; border-radius: 20px; display: grid; place-items: center; margin: 0 auto 16px; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);"
      >
        <FileCheck :size="32" />
      </div>

      <h3>Your PDF is Ready!</h3>
      <p class="result-subtitle">
        Your text has been converted into a razor-sharp, paginated vector PDF document.
      </p>

      <div class="selected-file" style="margin: 20px auto; max-width: 480px;">
        <div style="display: flex; align-items: center; gap: 14px; width: 100%;">
          <div
            style="background: linear-gradient(135deg, #e11d48, #be123c); color: #fff; width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0;"
          >
            <FileText :size="22" />
          </div>
          <div style="min-width: 0; text-align: left; flex: 1;">
            <div style="font-weight: 700; font-size: 14px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
              {{ resultPdf.filename }}
            </div>
            <div style="font-size: 12px; color: var(--muted, #64748b); margin-top: 2px;">
              {{ resultPdf.pageCount }} {{ resultPdf.pageCount === 1 ? 'Page' : 'Pages' }} &bull; {{ formatSize(resultPdf.size) }} &bull; Vector Typography
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="result-actions" style="margin-top: 24px;">
        <a class="primary-button" :href="resultPdf.url" :download="resultPdf.filename">
          <Download :size="18" /> Download PDF
        </a>
        <button class="text-button" type="button" @click="resetResult">
          <RotateCcw :size="16" /> Edit Text &amp; Convert Again
        </button>
      </div>

      <!-- Embedded PDF Preview Frame -->
      <div class="pdf-preview-embed-wrap" style="margin-top: 32px;">
        <div class="preview-frame-header">
          <span><Eye :size="14" /> Embedded Document Preview</span>
          <span class="preview-meta">{{ resultPdf.pageCount }} Pages &bull; {{ pageSize.toUpperCase() }}</span>
        </div>
        <iframe :src="`${resultPdf.url}#toolbar=0&navpanes=0`" class="pdf-embed-frame" />
      </div>
    </div>

    <!-- ================= STAGE 1: EDITOR & CUSTOMIZER WORKSPACE ================= -->
    <div v-else class="text-pdf-workspace">
      <!-- Top Action & Status Bar -->
      <div class="organize-header-bar text-pdf-top-bar">
        <div class="text-stats-pills">
          <span class="stat-pill">
            <b>{{ textStats.words }}</b> words
          </span>
          <span class="stat-pill">
            <b>{{ textStats.chars }}</b> chars
          </span>
          <span class="stat-pill">
            <b>~{{ textStats.estPages }}</b> {{ textStats.estPages === 1 ? 'page' : 'pages' }}
          </span>
          <span class="stat-pill reading-time">
            {{ textStats.readingTime }} min read
          </span>
        </div>

        <div class="organize-top-actions">
          <button
            type="button"
            class="tool-action-btn secondary"
            title="Paste text from clipboard"
            @click="pasteFromClipboard"
          >
            <Clipboard :size="13" />
            <span>Paste</span>
          </button>

          <button
            type="button"
            class="tool-action-btn secondary"
            title="Upload a .txt or .md file"
            @click="fileInput?.click()"
          >
            <FileUp :size="13" />
            <span>Open File</span>
          </button>

          <button
            type="button"
            class="tool-action-btn secondary"
            title="Load sample strategy memo"
            @click="loadSample(0)"
          >
            <Sparkles :size="13" />
            <span>Sample</span>
          </button>

          <button
            type="button"
            class="tool-action-btn icon-only clear-btn"
            title="Clear editor"
            @click="clearAll"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </div>

      <!-- Main Workspace Grid: Editor Left, Controls Right -->
      <div class="text-pdf-grid">
        <!-- Left: Text Editor Section -->
        <div class="text-editor-pane">
          <!-- Optional Document Title & Header Fields -->
          <div class="meta-fields-group">
            <div class="meta-field-row">
              <input
                v-model="title"
                type="text"
                placeholder="Document Title (Optional)"
                class="meta-title-input"
              />
            </div>
            <div class="meta-field-row double">
              <input
                v-model="subtitle"
                type="text"
                placeholder="Subtitle or Topic (Optional)"
                class="meta-sub-input"
              />
              <input
                v-model="author"
                type="text"
                placeholder="Author / Organization (Optional)"
                class="meta-sub-input"
              />
            </div>
          </div>

          <!-- Main Textarea -->
          <div class="textarea-container">
            <textarea
              v-model="text"
              placeholder="Write or paste your text here… Markdown headings (# Heading, ## Subheading) and paragraphs are formatted automatically."
              class="main-text-input"
              :style="{
                fontFamily: fontFamily === 'courier' ? 'monospace' : fontFamily === 'times' ? 'serif' : 'sans-serif',
                textAlign: textAlign,
              }"
            />
          </div>

          <div class="editor-bottom-hint">
            <Sparkles :size="13" />
            <span>Supports plain text, paragraphs, lists, and markdown headings (<code># Heading 1</code>, <code>## Heading 2</code>).</span>
          </div>
        </div>

        <!-- Right: Styling & PDF Options Panel -->
        <div class="text-options-pane">
          <!-- Typography Section -->
          <div class="option-card">
            <label class="option-card-title">
              <Type :size="14" /> Typography &amp; Font
            </label>

            <!-- Font Family -->
            <div class="font-family-chips">
              <button
                v-for="f in FONT_FAMILIES"
                :key="f.id"
                type="button"
                class="font-chip-btn"
                :class="{ active: fontFamily === f.id }"
                @click="fontFamily = f.id"
              >
                <b>{{ f.name }}</b>
                <small>{{ f.desc }}</small>
              </button>
            </div>

            <!-- Font Size & Line Spacing Grid -->
            <div class="option-subgrid" style="margin-top: 14px;">
              <div class="select-field">
                <span class="field-label">Font Size</span>
                <select v-model.number="fontSize" class="tool-select">
                  <option :value="10">10 pt (Dense)</option>
                  <option :value="11">11 pt (Compact)</option>
                  <option :value="12">12 pt (Standard)</option>
                  <option :value="14">14 pt (Large)</option>
                  <option :value="16">16 pt (Spacious)</option>
                </select>
              </div>

              <div class="select-field">
                <span class="field-label">Line Spacing</span>
                <select v-model.number="lineSpacing" class="tool-select">
                  <option :value="1.3">1.3× (Compact)</option>
                  <option :value="1.5">1.5× (Normal)</option>
                  <option :value="1.8">1.8× (Relaxed)</option>
                  <option :value="2.0">2.0× (Double)</option>
                </select>
              </div>
            </div>

            <!-- Alignment -->
            <div class="alignment-row" style="margin-top: 12px;">
              <span class="field-label">Alignment</span>
              <div class="alignment-btn-group">
                <button
                  type="button"
                  class="align-btn"
                  :class="{ active: textAlign === 'left' }"
                  title="Align Left"
                  @click="textAlign = 'left'"
                >
                  <AlignLeft :size="14" /> Left
                </button>
                <button
                  type="button"
                  class="align-btn"
                  :class="{ active: textAlign === 'center' }"
                  title="Align Center"
                  @click="textAlign = 'center'"
                >
                  <AlignCenter :size="14" /> Center
                </button>
                <button
                  type="button"
                  class="align-btn"
                  :class="{ active: textAlign === 'right' }"
                  title="Align Right"
                  @click="textAlign = 'right'"
                >
                  <AlignRight :size="14" /> Right
                </button>
              </div>
            </div>
          </div>

          <!-- Page Setup Section -->
          <div class="option-card">
            <label class="option-card-title">
              <Layers :size="14" /> Page Setup &amp; Margins
            </label>

            <div class="option-subgrid">
              <div class="select-field">
                <span class="field-label">Paper Size</span>
                <select v-model="pageSize" class="tool-select">
                  <option v-for="(p, id) in PAGE_SIZES" :key="id" :value="id">
                    {{ p.name }} ({{ p.desc }})
                  </option>
                </select>
              </div>

              <div class="select-field">
                <span class="field-label">Orientation</span>
                <select v-model="orientation" class="tool-select">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            <div class="option-subgrid" style="margin-top: 12px;">
              <div class="select-field">
                <span class="field-label">Page Margins</span>
                <select v-model="margin" class="tool-select">
                  <option v-for="(m, id) in PAGE_MARGINS" :key="id" :value="id">
                    {{ m.name }} ({{ m.desc }})
                  </option>
                </select>
              </div>

              <div class="select-field">
                <span class="field-label">Color Theme</span>
                <select v-model="theme" class="tool-select">
                  <option v-for="(t, id) in COLOR_THEMES" :key="id" :value="id">
                    {{ t.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Header & Page Numbering Section -->
          <div class="option-card">
            <label class="option-card-title">
              <Sliders :size="14" /> Header &amp; Page Numbers
            </label>

            <div class="select-field">
              <span class="field-label">Running Header Text</span>
              <input
                v-model="headerText"
                type="text"
                placeholder="e.g. Confidential Draft &bull; Project Overview"
                class="tool-input"
              />
            </div>

            <div class="checkbox-row" style="margin-top: 12px;">
              <label class="check-label">
                <input v-model="includePageNumbers" type="checkbox" />
                <span>Include Page Numbering</span>
              </label>
            </div>

            <div v-if="includePageNumbers" class="option-subgrid" style="margin-top: 10px;">
              <div class="select-field">
                <span class="field-label">Number Format</span>
                <select v-model="pageNumberFormat" class="tool-select">
                  <option value="page-of-total">Page 1 of 5</option>
                  <option value="fraction">1 / 5</option>
                  <option value="dash">— 1 —</option>
                  <option value="simple">1</option>
                </select>
              </div>

              <div class="select-field">
                <span class="field-label">Position</span>
                <select v-model="pageNumberPosition" class="tool-select">
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Action & Export Button -->
          <div class="export-card">
            <div class="select-field" style="margin-bottom: 12px;">
              <span class="field-label">Output Filename</span>
              <input
                v-model="filename"
                type="text"
                placeholder="document.pdf"
                class="tool-input"
              />
            </div>

            <button
              type="button"
              class="primary-button convert-btn"
              :disabled="isGenerating || (!text.trim() && !title.trim())"
              @click="handleGeneratePdf"
            >
              <LoaderCircle v-if="isGenerating" :size="18" class="spin-icon" />
              <Download v-else :size="18" />
              <span>{{ isGenerating ? (progressMessage || 'Generating PDF…') : 'Convert & Download PDF' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <transition name="fade">
      <div v-if="notification" class="text-toast-notice">
        {{ notification }}
      </div>
    </transition>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">
      <CircleAlert :size="16" />
      <span>{{ error }}</span>
      <button type="button" class="banner-close-btn" @click="error = ''">&times;</button>
    </div>
  </div>
</template>

<style scoped>
.text-to-pdf-converter {
  position: relative;
  width: 100%;
}

/* Workspace Frame */
.text-pdf-workspace {
  background: var(--card-bg, #ffffff);
  border-radius: 24px;
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: 0 8px 30px -4px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

/* Top Stats & Actions Bar */
.text-pdf-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--toolbar-bg, #f8fafc);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  gap: 12px;
  flex-wrap: wrap;
}

.text-stats-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-pill {
  font-size: 12px;
  padding: 4px 10px;
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  color: var(--muted, #64748b);
}

.stat-pill b {
  color: var(--text-color, #0f172a);
}

.stat-pill.reading-time {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.2);
  font-weight: 600;
}

.organize-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--card-bg, #ffffff);
  color: var(--text-color, #334155);
}

.tool-action-btn:hover {
  background: #f1f5f9;
}

.tool-action-btn.icon-only.clear-btn {
  padding: 6px;
  color: #64748b;
}

.tool-action-btn.icon-only.clear-btn:hover {
  background: #fee2e2;
  color: #ef4444;
  border-color: #fca5a5;
}

/* Workspace Grid */
.text-pdf-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 1fr);
  gap: 0;
  min-height: 560px;
}

@media (max-width: 980px) {
  .text-pdf-grid {
    grid-template-columns: 1fr;
  }
}

/* Left Editor Column */
.text-editor-pane {
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-right: 1px solid var(--border-color, #e2e8f0);
  background: var(--card-bg, #ffffff);
}

.meta-fields-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.meta-field-row.double {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 600px) {
  .meta-field-row.double {
    grid-template-columns: 1fr;
  }
}

.meta-title-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 16px;
  font-weight: 800;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 10px;
  background: var(--input-bg, #f8fafc);
  color: var(--text-color, #0f172a);
  transition: all 0.2s ease;
}

.meta-title-input:focus,
.meta-sub-input:focus,
.tool-input:focus,
.tool-select:focus,
.main-text-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.meta-sub-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  background: var(--input-bg, #f8fafc);
  color: var(--text-color, #0f172a);
}

.textarea-container {
  flex: 1;
  display: flex;
  min-height: 380px;
}

.main-text-input {
  width: 100%;
  height: 100%;
  min-height: 380px;
  padding: 16px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 14px;
  background: var(--input-bg, #fcfdfe);
  color: var(--text-color, #0f172a);
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
}

.editor-bottom-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--muted, #64748b);
  margin-top: 10px;
}

.editor-bottom-hint code {
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 4px;
  font-family: monospace;
}

/* Right Options Column */
.text-options-pane {
  padding: 20px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.option-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 800;
  color: var(--text-color, #0f172a);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Font Chips */
.font-family-chips {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.font-chip-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 6px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.font-chip-btn b {
  font-size: 12px;
  color: var(--text-color, #0f172a);
}

.font-chip-btn small {
  font-size: 10px;
  color: var(--muted, #64748b);
  margin-top: 2px;
}

.font-chip-btn:hover {
  border-color: #cbd5e1;
}

.font-chip-btn.active {
  background: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.font-chip-btn.active b {
  color: #1d4ed8;
}

.option-subgrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.select-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted, #64748b);
}

.tool-select,
.tool-input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #cbd5e1);
  background: #ffffff;
  font-size: 12px;
  color: var(--text-color, #0f172a);
  box-sizing: border-box;
}

.alignment-btn-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-top: 4px;
}

.align-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: #f8fafc;
  cursor: pointer;
  color: var(--text-color, #334155);
}

.align-btn:hover {
  background: #f1f5f9;
}

.align-btn.active {
  background: #3b82f6;
  color: #ffffff;
  border-color: #3b82f6;
}

.checkbox-row {
  display: flex;
  align-items: center;
}

.check-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-color, #0f172a);
  cursor: pointer;
}

/* Export Card */
.export-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.convert-btn {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 10px;
}

.convert-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Result View */
.text-pdf-result {
  padding: 40px 24px;
  text-align: center;
  background: var(--card-bg, #ffffff);
  border-radius: 24px;
  border: 1px solid var(--border-color, #e2e8f0);
}

.pdf-preview-embed-wrap {
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  overflow: hidden;
  background: #0f172a;
}

.preview-frame-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(15, 23, 42, 0.9);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
}

.preview-meta {
  color: #94a3b8;
  font-weight: normal;
}

.pdf-embed-frame {
  width: 100%;
  height: 520px;
  border: none;
  display: block;
}

/* Toast */
.text-toast-notice {
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
  z-index: 100;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-banner {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
}

.banner-close-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #991b1b;
  font-size: 18px;
  cursor: pointer;
}
</style>

