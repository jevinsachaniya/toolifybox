<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { 
  ArrowRight, BookOpen, Check, CheckCheck, CircleAlert, Download, Eye, FilePlus, FileText, 
  FileUp, LayoutGrid, ListTodo, LoaderCircle, LockKeyhole, Music, Palette, RefreshCw, 
  Settings2, Sliders, Sparkles, X 
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import { 
  createPdf, 
  createdPdfFilename, 
  PAGE_SIZES, 
  PAGE_MARGINS, 
  TEMPLATES, 
  COLOR_THEMES 
} from '~/utils/create-pdf.js';

const activeTab = ref('template'); // 'template' | 'text' | 'file'
const selectedTemplate = ref('lined-college');
const pageSize = ref('a4');
const orientation = ref('portrait');
const pageCount = ref(1);
const pageMargin = ref('normal');
const colorTheme = ref('classic');

// Header & Page Numbering
const headerText = ref('');
const includePageNumbers = ref(true);
const pageNumberFormat = ref('page-of-total'); // 'page-of-total' | 'simple' | 'dash'
const pageNumberPosition = ref('bottom-center'); // 'bottom-center' | 'bottom-right'

// Text & Document Composer
const docTitle = ref('');
const docSubtitle = ref('');
const docAuthor = ref('');
const bodyText = ref('');
const textFont = ref('helvetica');
const textSize = ref(12);
const lineSpacing = ref(1.4);

// Processing & Output
const busy = ref(false);
const progress = ref('');
const error = ref('');
const result = ref(null);
let active = true;

// CustomSelect Options
const TEMPLATE_OPTIONS = TEMPLATES.map(tpl => ({
  value: tpl.id,
  label: tpl.name,
  sublabel: tpl.badge,
}));

const PAGE_SIZE_OPTIONS = Object.entries(PAGE_SIZES).map(([val, info]) => ({
  value: val,
  label: `${info.name} (${info.desc})`,
}));

const MARGIN_OPTIONS = Object.entries(PAGE_MARGINS).map(([val, info]) => ({
  value: val,
  label: `${info.name} — ${info.desc}`,
}));

const THEME_OPTIONS = Object.entries(COLOR_THEMES).map(([val, info]) => ({
  value: val,
  label: info.name,
}));

const FONT_OPTIONS = [
  { value: 'helvetica', label: 'Helvetica / Arial (Clean Sans-Serif)' },
  { value: 'times', label: 'Times New Roman (Classic Serif)' },
  { value: 'courier', label: 'Courier New (Technical Monospace)' },
];

const FONT_SIZE_OPTIONS = [
  { value: 10, label: '10 pt — Compact text' },
  { value: 12, label: '12 pt — Standard document' },
  { value: 14, label: '14 pt — Large / Readable' },
  { value: 16, label: '16 pt — Extra large' },
];

const NUMBER_FORMAT_OPTIONS = [
  { value: 'page-of-total', label: 'Page 1 of 5 (Standard)' },
  { value: 'simple', label: '1 (Simple number)' },
  { value: 'dash', label: '— 1 — (Framed dash)' },
  { value: 'fraction', label: '1 / 5 (Fraction)' },
];

// Computed Preview Dimensions & Aspect Ratio
const previewAspectRatio = computed(() => {
  const base = PAGE_SIZES[pageSize.value] || PAGE_SIZES.a4;
  if (orientation.value === 'landscape') {
    return Math.max(base.width, base.height) / Math.min(base.width, base.height);
  }
  return Math.min(base.width, base.height) / Math.max(base.width, base.height);
});

// Word & Character stats for Text mode
const wordCount = computed(() => {
  if (!bodyText.value) return 0;
  const matches = bodyText.value.trim().match(/[\p{L}\p{N}]+/gu);
  return matches ? matches.length : 0;
});
const charCount = computed(() => bodyText.value?.length || 0);

function revokeResult() {
  if (result.value?.url) {
    URL.revokeObjectURL(result.value.url);
  }
  result.value = null;
}

onBeforeUnmount(() => {
  active = false;
  revokeResult();
});

// File Import Handler
function handleFileImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  event.target.value = '';

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (['txt', 'md', 'json', 'csv'].includes(ext)) {
    const reader = new FileReader();
    reader.onload = (e) => {
      bodyText.value = String(e.target.result || '');
      docTitle.value = file.name.replace(/\.[^/.]+$/, '');
      activeTab.value = 'text';
    };
    reader.readAsText(file);
  } else {
    error.value = 'Please choose a plain text (.txt) or markdown (.md) file to import into the editor.';
  }
}

// Generate & Download PDF
async function generatePdf() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  progress.value = 'Preparing page layout…';
  revokeResult();

  try {
    const options = {
      mode: activeTab.value === 'text' ? 'text' : 'template',
      template: selectedTemplate.value,
      pageSize: pageSize.value,
      orientation: orientation.value,
      pageCount: Number(pageCount.value) || 1,
      margin: pageMargin.value,
      theme: colorTheme.value,
      headerText: headerText.value,
      includePageNumbers: includePageNumbers.value,
      pageNumberFormat: pageNumberFormat.value,
      pageNumberPosition: pageNumberPosition.value,
      title: docTitle.value,
      subtitle: docSubtitle.value,
      author: docAuthor.value,
      bodyText: bodyText.value,
      fontFamily: textFont.value,
      fontSize: Number(textSize.value) || 12,
      lineSpacing: Number(lineSpacing.value) || 1.4,
      onProgress: (msg) => {
        if (active) progress.value = msg;
      },
    };

    const res = await createPdf(options);

    if (active) {
      result.value = res;
      // Trigger instant download
      const anchor = document.createElement('a');
      anchor.href = res.url;
      anchor.download = res.filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    }
  } catch (err) {
    if (active) {
      console.error('PDF creation error:', err);
      error.value = err.message || 'Could not generate PDF. Please check your options and try again.';
    }
  } finally {
    if (active) {
      busy.value = false;
      progress.value = '';
    }
  }
}

function resetAll() {
  selectedTemplate.value = 'lined-college';
  pageSize.value = 'a4';
  orientation.value = 'portrait';
  pageCount.value = 1;
  pageMargin.value = 'normal';
  colorTheme.value = 'classic';
  headerText.value = '';
  includePageNumbers.value = true;
  docTitle.value = '';
  docSubtitle.value = '';
  docAuthor.value = '';
  bodyText.value = '';
  error.value = '';
  revokeResult();
}
</script>

<template>
  <section
    id="converter"
    class="converter create-pdf-converter"
    :class="{ 'is-busy': busy, 'has-result': result }"
    aria-label="Create PDF document tool"
    :aria-busy="busy"
  >
    <!-- Converter Header -->
    <div class="converter-heading">
      <div>
        <span class="mini-label">PDF GENERATOR &amp; TEMPLATES</span>
        <h2>Create PDF Online</h2>
      </div>
      <p>Generate clean, printable PDF documents, lined notebook sheets, engineering graph paper, to-do planners, or custom formatted text documents directly in your browser.</p>
    </div>

    <!-- Mode Tabs -->
    <div class="create-mode-tabs" role="tablist" aria-label="Creation mode selector">
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'template'"
        class="tab-btn"
        :class="{ active: activeTab === 'template' }"
        @click="activeTab = 'template'"
      >
        <LayoutGrid :size="16" />
        <span>Paper Templates &amp; Grids</span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'text'"
        class="tab-btn"
        :class="{ active: activeTab === 'text' }"
        @click="activeTab = 'text'"
      >
        <FileText :size="16" />
        <span>Document &amp; Text Composer</span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'file'"
        class="tab-btn"
        :class="{ active: activeTab === 'file' }"
        @click="activeTab = 'file'"
      >
        <FileUp :size="16" />
        <span>Import File (.txt / .md)</span>
      </button>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner" role="alert">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
      <button type="button" class="error-dismiss" aria-label="Dismiss error" @click="error = ''">
        <X :size="14" />
      </button>
    </div>

    <!-- Success Result State -->
    <div v-if="result" class="result-banner">
      <div class="result-icon">
        <Check :size="24" />
      </div>
      <div class="result-content">
        <h3>PDF Created Successfully!</h3>
        <p>{{ result.filename }} · {{ result.pageCount }} {{ result.pageCount === 1 ? 'page' : 'pages' }} · {{ formatSize(result.size) }}</p>
      </div>
      <div class="result-actions">
        <a :href="result.url" :download="result.filename" class="primary-button download-btn">
          <Download :size="16" /> Download Again
        </a>
        <button type="button" class="text-button" @click="resetAll">
          <RefreshCw :size="14" /> Create Another
        </button>
      </div>
    </div>

    <!-- MAIN TWO-COLUMN STUDIO WORKSPACE -->
    <div class="create-workspace">
      <!-- LEFT COLUMN: CONTROLS & SETTINGS -->
      <div class="create-settings-panel">
        
        <!-- MODE 1: TEMPLATE SELECTOR -->
        <div v-if="activeTab === 'template'" class="settings-group">
          <span class="group-title"><Sliders :size="15" /> Choose Sheet Template</span>
          <div class="template-select-wrap">
            <CustomSelect
              v-model="selectedTemplate"
              :options="TEMPLATE_OPTIONS"
              placeholder="Select Sheet Template"
              size="md"
            />
          </div>
        </div>

        <!-- MODE 2: TEXT COMPOSER -->
        <div v-else-if="activeTab === 'text'" class="settings-group">
          <span class="group-title"><FileText :size="15" /> Document Details &amp; Typography</span>
          <div class="input-row">
            <div class="field-item">
              <label for="doc-title-input">Document Title</label>
              <input
                id="doc-title-input"
                v-model="docTitle"
                type="text"
                class="form-control"
                placeholder="e.g. Project Proposal or Meeting Notes"
              />
            </div>
          </div>
          <div class="input-row two-col">
            <div class="field-item">
              <label for="doc-sub-input">Subtitle / Header</label>
              <input
                id="doc-sub-input"
                v-model="docSubtitle"
                type="text"
                class="form-control"
                placeholder="e.g. Q3 Strategic Plan"
              />
            </div>
            <div class="field-item">
              <label for="doc-author-input">Author / Organization</label>
              <input
                id="doc-author-input"
                v-model="docAuthor"
                type="text"
                class="form-control"
                placeholder="e.g. Jane Doe"
              />
            </div>
          </div>
          <div class="field-item">
            <div class="label-with-count">
              <label for="doc-body-input">Body Content / Paragraphs</label>
              <span class="char-counter">{{ wordCount }} words · {{ charCount }} chars</span>
            </div>
            <textarea
              id="doc-body-input"
              v-model="bodyText"
              rows="8"
              class="form-control text-composer-area"
              placeholder="Type or paste your text here. Paragraphs automatically wrap and split across pages seamlessly..."
            />
          </div>

          <div class="input-row two-col">
            <div class="field-item">
              <label>Font Family</label>
              <CustomSelect
                v-model="textFont"
                :options="FONT_OPTIONS"
                placeholder="Select font"
                size="sm"
              />
            </div>
            <div class="field-item">
              <label>Font Size</label>
              <CustomSelect
                v-model="textSize"
                :options="FONT_SIZE_OPTIONS"
                placeholder="Font size"
                size="sm"
              />
            </div>
          </div>
        </div>

        <!-- MODE 3: FILE IMPORT -->
        <div v-else-if="activeTab === 'file'" class="settings-group">
          <span class="group-title"><FileUp :size="15" /> Import Existing Notes</span>
          <div class="import-dropzone">
            <FileText :size="32" class="dropzone-icon" />
            <h4>Drop your .txt or .md file here</h4>
            <p>Upload a plain text or markdown file to populate the composer instantly.</p>
            <label class="primary-button choose-file-btn">
              <FileUp :size="16" /> Browse Text File
              <input
                type="file"
                accept=".txt,.md,.text"
                class="hidden-file-input"
                @change="handleFileImport"
              />
            </label>
          </div>
        </div>

        <!-- COMMON PAGE SETUP CONTROLS -->
        <div class="settings-group">
          <span class="group-title"><Settings2 :size="15" /> Page Layout &amp; Setup</span>
          <div class="input-row two-col">
            <div class="field-item">
              <label>Page Size</label>
              <CustomSelect
                v-model="pageSize"
                :options="PAGE_SIZE_OPTIONS"
                placeholder="Select size"
                size="sm"
              />
            </div>
            <div class="field-item">
              <label>Page Margins</label>
              <CustomSelect
                v-model="pageMargin"
                :options="MARGIN_OPTIONS"
                placeholder="Select margin"
                size="sm"
              />
            </div>
          </div>

          <div class="input-row two-col">
            <div class="field-item">
              <label>Orientation</label>
              <div class="segmented-control">
                <button
                  type="button"
                  class="seg-btn"
                  :class="{ active: orientation === 'portrait' }"
                  @click="orientation = 'portrait'"
                >
                  Portrait
                </button>
                <button
                  type="button"
                  class="seg-btn"
                  :class="{ active: orientation === 'landscape' }"
                  @click="orientation = 'landscape'"
                >
                  Landscape
                </button>
              </div>
            </div>
            <div class="field-item">
              <label>Color Theme</label>
              <CustomSelect
                v-model="colorTheme"
                :options="THEME_OPTIONS"
                placeholder="Select theme"
                size="sm"
              />
            </div>
          </div>

          <!-- Page Count (Template Mode) -->
          <div v-if="activeTab === 'template'" class="input-row two-col">
            <div class="field-item">
              <label for="page-count-input">Number of Pages</label>
              <div class="counter-input">
                <button type="button" :disabled="pageCount <= 1" @click="pageCount = Math.max(1, pageCount - 1)">−</button>
                <input
                  id="page-count-input"
                  v-model.number="pageCount"
                  type="number"
                  min="1"
                  max="50"
                  class="form-control number-box"
                />
                <button type="button" :disabled="pageCount >= 50" @click="pageCount = Math.min(50, pageCount + 1)">+</button>
              </div>
            </div>
            <div class="field-item">
              <label for="running-header-input">Running Header (Optional)</label>
              <input
                id="running-header-input"
                v-model="headerText"
                type="text"
                class="form-control"
                placeholder="e.g. Lecture 4 · Biology Notes"
              />
            </div>
          </div>
        </div>

        <!-- PAGE NUMBERING CONTROLS -->
        <div class="settings-group">
          <span class="group-title"><Palette :size="15" /> Header &amp; Footer Options</span>
          <div class="checkbox-row">
            <label class="custom-toggle">
              <input v-model="includePageNumbers" type="checkbox" />
              <span class="toggle-track" />
              <span class="toggle-label">Include Page Numbers at bottom</span>
            </label>
          </div>

          <div v-if="includePageNumbers" class="input-row two-col mt-2">
            <div class="field-item">
              <label>Number Format</label>
              <CustomSelect
                v-model="pageNumberFormat"
                :options="NUMBER_FORMAT_OPTIONS"
                size="sm"
              />
            </div>
            <div class="field-item">
              <label>Number Position</label>
              <div class="segmented-control">
                <button
                  type="button"
                  class="seg-btn"
                  :class="{ active: pageNumberPosition === 'bottom-center' }"
                  @click="pageNumberPosition = 'bottom-center'"
                >
                  Center
                </button>
                <button
                  type="button"
                  class="seg-btn"
                  :class="{ active: pageNumberPosition === 'bottom-right' }"
                  @click="pageNumberPosition = 'bottom-right'"
                >
                  Right
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- GENERATE BUTTON & ACTIONS -->
        <div class="action-footer">
          <button
            type="button"
            class="primary-button generate-btn"
            :disabled="busy"
            @click="generatePdf"
          >
            <template v-if="busy">
              <LoaderCircle class="spinning" :size="18" />
              <span>{{ progress || 'Generating PDF…' }}</span>
            </template>
            <template v-else>
              <FilePlus :size="18" />
              <span>Create &amp; Download PDF</span>
            </template>
          </button>

          <button
            type="button"
            class="text-button reset-btn"
            :disabled="busy"
            @click="resetAll"
          >
            Reset
          </button>
        </div>
      </div>

      <!-- RIGHT COLUMN: LIVE INTERACTIVE SHEET PREVIEW -->
      <div class="create-preview-panel">
        <div class="preview-header">
          <span class="preview-title"><Eye :size="15" /> Live Sheet Preview</span>
          <span class="preview-meta">{{ (PAGE_SIZES[pageSize] || PAGE_SIZES.a4).name }} · {{ orientation }}</span>
        </div>

        <!-- SHEET CANVAS PREVIEW CONTAINER -->
        <div class="sheet-preview-wrap">
          <div
            class="sheet-canvas"
            :class="[
              orientation,
              colorTheme,
              { 'is-lined': selectedTemplate.startsWith('lined') }
            ]"
            :style="{ aspectRatio: previewAspectRatio }"
          >
            <!-- Running Header Preview -->
            <div v-if="headerText" class="preview-running-header">
              <span>{{ headerText }}</span>
              <div class="header-divider" />
            </div>

            <!-- TEMPLATE VISUAL SIMULATION -->
            <div v-if="activeTab === 'template'" class="sheet-body-content">
              <!-- Blank -->
              <div v-if="selectedTemplate === 'blank'" class="preview-blank-sheet">
                <span class="blank-hint">Clean Blank Sheet</span>
              </div>

              <!-- Lined College / Wide -->
              <div
                v-else-if="selectedTemplate === 'lined-college' || selectedTemplate === 'lined-wide'"
                class="preview-lined-sheet"
                :class="selectedTemplate"
              >
                <div class="preview-vertical-margin" />
                <div class="preview-horizontal-lines">
                  <div v-for="n in 24" :key="n" class="preview-rule-line" />
                </div>
              </div>

              <!-- 5mm Graph Grid -->
              <div v-else-if="selectedTemplate === 'grid-5mm'" class="preview-grid-sheet" />

              <!-- Dot Grid -->
              <div v-else-if="selectedTemplate === 'grid-dot'" class="preview-dot-sheet" />

              <!-- Checklist / To-Do Planner -->
              <div v-else-if="selectedTemplate === 'checklist'" class="preview-checklist-sheet">
                <div class="checklist-date-row">DATE: _______________</div>
                <div v-for="n in 14" :key="n" class="checklist-row">
                  <span class="chk-box" />
                  <span class="chk-dot" />
                  <span class="chk-line" />
                </div>
              </div>

              <!-- Cornell Notes -->
              <div v-else-if="selectedTemplate === 'cornell'" class="preview-cornell-sheet">
                <div class="cornell-header-box">
                  <span>TOPIC / COURSE: ____________________</span>
                  <span>DATE: _______</span>
                </div>
                <div class="cornell-main-box">
                  <div class="cornell-cue-col">
                    <span class="box-tag">QUESTIONS / CUES</span>
                  </div>
                  <div class="cornell-notes-col">
                    <span class="box-tag">NOTES &amp; DETAILS</span>
                    <div v-for="n in 12" :key="n" class="preview-rule-line" />
                  </div>
                </div>
                <div class="cornell-summary-box">
                  <span class="box-tag">SUMMARY &amp; KEY TAKEAWAYS</span>
                </div>
              </div>

              <!-- Music Manuscript -->
              <div v-else-if="selectedTemplate === 'music'" class="preview-music-sheet">
                <div v-for="s in 6" :key="s" class="preview-music-stave">
                  <div v-for="l in 5" :key="l" class="stave-line" />
                </div>
              </div>
            </div>

            <!-- TEXT COMPOSER PREVIEW -->
            <div v-else class="sheet-body-content text-preview-content" :class="textFont">
              <h2 v-if="docTitle" class="preview-doc-title">{{ docTitle }}</h2>
              <p v-if="docSubtitle || docAuthor" class="preview-doc-meta">
                {{ [docSubtitle, docAuthor ? `By ${docAuthor}` : ''].filter(Boolean).join(' · ') }}
              </p>
              <div v-if="docTitle || docSubtitle" class="preview-doc-divider" />
              <div class="preview-doc-body">
                <p v-if="bodyText">{{ bodyText }}</p>
                <span v-else class="preview-placeholder-text">Your typed paragraphs will appear here formatted with {{ textFont }} typography...</span>
              </div>
            </div>

            <!-- Page Number Footer Preview -->
            <div
              v-if="includePageNumbers"
              class="preview-page-footer"
              :class="pageNumberPosition"
            >
              <span>{{ pageNumberFormat === 'page-of-total' ? 'Page 1 of ' + (activeTab === 'template' ? pageCount : 1) : pageNumberFormat === 'dash' ? '— 1 —' : '1' }}</span>
            </div>
          </div>
        </div>

        <div class="preview-footer-note">
          <LockKeyhole :size="13" />
          <span>High-resolution vector PDF generated directly in memory. 100% private.</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.create-pdf-converter {
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

/* Tabs */
.create-mode-tabs {
  display: flex;
  gap: 10px;
  border-bottom: 2px solid var(--border-color, #f1f5f9);
  padding-bottom: 12px;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  background: var(--btn-hover-bg, #f8fafc);
  color: var(--text-heading, #0f172a);
}

.tab-btn.active {
  background: var(--accent-subtle, #eff6ff);
  border-color: var(--accent-color, #3b82f6);
  color: var(--accent-color, #3b82f6);
}

/* Workspaces */
.create-workspace {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: start;
}

@media (max-width: 960px) {
  .create-workspace {
    grid-template-columns: 1fr;
  }
}

/* Left Panel: Settings */
.create-settings-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  background: var(--card-bg, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-heading, #334155);
}

/* Template Cards Grid */
.template-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 600px) {
  .template-grid {
    grid-template-columns: 1fr;
  }
}

.template-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 4px;
  padding: 12px;
  background: var(--surface-bg, #ffffff);
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.template-card:hover {
  border-color: var(--accent-color, #3b82f6);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
}

.template-card.selected {
  border-color: var(--accent-color, #3b82f6);
  background: var(--accent-subtle, #eff6ff);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}

.template-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.template-card-header strong {
  font-size: 0.85rem;
  color: var(--text-heading, #0f172a);
}

.tpl-badge {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-color, #2563eb);
}

.template-card p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted, #64748b);
  line-height: 1.4;
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

@media (max-width: 600px) {
  .input-row.two-col {
    grid-template-columns: 1fr;
  }
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-item label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-heading, #334155);
}

.label-with-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-counter {
  font-size: 0.72rem;
  color: var(--text-muted, #64748b);
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  font-size: 0.88rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--surface-bg, #ffffff);
  color: var(--text-heading, #0f172a);
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: var(--accent-color, #3b82f6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.text-composer-area {
  resize: vertical;
  line-height: 1.5;
  font-family: inherit;
}

/* Segmented Control */
.segmented-control {
  display: flex;
  border-radius: 8px;
  background: var(--border-color, #e2e8f0);
  padding: 2px;
  gap: 2px;
}

.seg-btn {
  flex: 1;
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  transition: all 0.15s ease;
}

.seg-btn.active {
  background: var(--surface-bg, #ffffff);
  color: var(--text-heading, #0f172a);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Counter Input */
.counter-input {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  background: var(--surface-bg, #ffffff);
  overflow: hidden;
}

.counter-input button {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--card-bg, #f1f5f9);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-heading, #0f172a);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.counter-input button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.number-box {
  border: none !important;
  text-align: center;
  font-weight: 700;
  border-radius: 0 !important;
}

/* Toggles */
.custom-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.custom-toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.toggle-track {
  width: 36px;
  height: 20px;
  background: #cbd5e1;
  border-radius: 12px;
  position: relative;
  transition: background 0.2s ease;
}

.toggle-track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.custom-toggle input:checked + .toggle-track {
  background: var(--accent-color, #3b82f6);
}

.custom-toggle input:checked + .toggle-track::after {
  transform: translateX(16px);
}

.toggle-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-heading, #334155);
}

/* Import Dropzone */
.import-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  padding: 32px 20px;
  border: 2px dashed var(--border-color, #cbd5e1);
  border-radius: 12px;
  background: var(--surface-bg, #ffffff);
}

.dropzone-icon {
  color: var(--accent-color, #3b82f6);
}

.import-dropzone h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-heading, #0f172a);
}

.import-dropzone p {
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-muted, #64748b);
}

.hidden-file-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.choose-file-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
}

/* Action Footer */
.action-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.generate-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
}

.reset-btn {
  font-size: 0.9rem;
  color: var(--text-muted, #64748b);
}

/* RIGHT PANEL: LIVE SHEET PREVIEW */
.create-preview-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--card-bg, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  padding: 20px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-heading, #334155);
}

.preview-meta {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted, #64748b);
  background: var(--surface-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  padding: 2px 8px;
  border-radius: 6px;
}

.sheet-preview-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px 0;
}

.sheet-canvas {
  width: 100%;
  max-width: 380px;
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px 20px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.preview-running-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  color: #64748b;
  text-align: right;
  margin-bottom: 8px;
}

.header-divider {
  height: 1px;
  background: #cbd5e1;
  width: 100%;
}

.sheet-body-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Blank Preview */
.preview-blank-sheet {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.blank-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  font-style: italic;
}

/* Lined Preview */
.preview-lined-sheet {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-vertical-margin {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 36px;
  width: 1px;
  background: rgba(239, 68, 68, 0.5);
}

.preview-horizontal-lines {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-rule-line {
  height: 1px;
  background: rgba(147, 197, 253, 0.6);
  width: 100%;
}

.sheet-canvas.slate .preview-rule-line {
  background: rgba(203, 213, 225, 0.7);
}

.sheet-canvas.emerald .preview-rule-line {
  background: rgba(167, 243, 208, 0.7);
}

.sheet-canvas.warm .preview-rule-line {
  background: rgba(254, 215, 170, 0.7);
}

/* 5mm Grid */
.preview-grid-sheet {
  flex: 1;
  background-image: linear-gradient(to right, rgba(147, 197, 253, 0.4) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(147, 197, 253, 0.4) 1px, transparent 1px);
  background-size: 12px 12px;
}

/* Dot Grid */
.preview-dot-sheet {
  flex: 1;
  background-image: radial-gradient(circle, rgba(100, 116, 139, 0.5) 1px, transparent 1px);
  background-size: 12px 12px;
}

/* Checklist Sheet */
.preview-checklist-sheet {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checklist-date-row {
  font-size: 0.6rem;
  font-weight: 700;
  color: #64748b;
  text-align: right;
  margin-bottom: 4px;
}

.checklist-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chk-box {
  width: 9px;
  height: 9px;
  border: 1px solid #64748b;
  border-radius: 2px;
}

.chk-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #cbd5e1;
}

.chk-line {
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

/* Cornell Notes */
.preview-cornell-sheet {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #3b82f6;
  border-radius: 2px;
}

.cornell-header-box {
  display: flex;
  justify-content: space-between;
  padding: 4px 6px;
  font-size: 0.55rem;
  font-weight: 700;
  border-bottom: 1px solid #3b82f6;
  color: #1e3a8a;
}

.cornell-main-box {
  flex: 1;
  display: flex;
  border-bottom: 1px solid #3b82f6;
}

.cornell-cue-col {
  width: 35%;
  border-right: 1.5px solid #3b82f6;
  padding: 4px;
}

.cornell-notes-col {
  flex: 1;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cornell-summary-box {
  height: 38px;
  padding: 4px;
}

.box-tag {
  font-size: 0.5rem;
  font-weight: 800;
  color: #2563eb;
  letter-spacing: 0.04em;
}

/* Music Sheet */
.preview-music-sheet {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-music-stave {
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-left: 1.5px solid #334155;
  border-right: 1.5px solid #334155;
  padding: 0 1px;
}

.stave-line {
  height: 1px;
  background: #334155;
  width: 100%;
}

/* Text Composer Preview */
.text-preview-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-doc-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
}

.preview-doc-meta {
  margin: 0;
  font-size: 0.65rem;
  color: #64748b;
  font-style: italic;
}

.preview-doc-divider {
  height: 1.5px;
  background: #3b82f6;
  width: 100%;
}

.preview-doc-body {
  font-size: 0.62rem;
  line-height: 1.4;
  color: #1e293b;
  overflow: hidden;
  max-height: 280px;
}

.preview-doc-body p {
  margin: 0;
  white-space: pre-wrap;
}

.preview-placeholder-text {
  color: #94a3b8;
  font-style: italic;
}

.preview-page-footer {
  display: flex;
  font-size: 0.6rem;
  color: #64748b;
  font-weight: 600;
  margin-top: 8px;
}

.preview-page-footer.bottom-center {
  justify-content: center;
}

.preview-page-footer.bottom-right {
  justify-content: flex-end;
}

.preview-footer-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--text-muted, #64748b);
  margin-top: 4px;
}

/* Result Banner */
.result-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 12px;
}

.result-icon {
  width: 40px;
  height: 40px;
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
  font-size: 1rem;
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
  padding: 8px 16px;
  font-size: 0.88rem;
}

/* Spinner */
.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ==========================================================================
   Mobile Responsive Overhauls (< 768px and < 480px)
   ========================================================================== */
@media (max-width: 768px) {
  .create-pdf-converter {
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

  .create-mode-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-bottom: 8px;
    width: 100%;
  }

  .tab-btn {
    flex: 1 1 auto;
    justify-content: center;
    padding: 8px 10px;
    font-size: 0.8rem;
    border-radius: 8px;
    white-space: normal;
    text-align: center;
  }

  .create-workspace {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .create-settings-panel {
    gap: 16px;
    width: 100%;
  }

  .settings-group {
    padding: 14px 12px;
    gap: 12px;
    border-radius: 12px;
    width: 100%;
    box-sizing: border-box;
  }

  .group-title {
    font-size: 0.78rem;
  }

  .input-row {
    width: 100%;
  }

  .input-row.two-col {
    grid-template-columns: 1fr !important;
    gap: 12px;
  }

  .field-item {
    width: 100%;
  }

  .field-item label {
    font-size: 0.78rem;
  }

  .form-control {
    font-size: 0.84rem;
    padding: 7px 10px;
    width: 100%;
  }

  .segmented-control {
    width: 100%;
  }

  .seg-btn {
    padding: 6px 8px;
    font-size: 0.78rem;
  }

  .counter-input button {
    width: 40px;
    height: 38px;
  }

  .action-footer {
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .generate-btn {
    width: 100%;
    padding: 12px 18px;
    font-size: 0.92rem;
  }

  .reset-btn {
    width: 100%;
    text-align: center;
    padding: 6px;
  }

  .create-preview-panel {
    padding: 14px 12px;
    border-radius: 14px;
    gap: 12px;
    width: 100%;
    box-sizing: border-box;
  }

  .sheet-preview-wrap {
    padding: 8px 0;
  }

  .sheet-canvas {
    max-width: 100%;
    padding: 16px 14px;
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

@media (max-width: 420px) {
  .create-pdf-converter {
    padding: 14px 8px;
  }

  .converter-heading h2 {
    font-size: 1.2rem;
  }

  .tab-btn {
    font-size: 0.74rem;
    padding: 7px 6px;
    gap: 5px;
  }

  .tab-btn svg {
    width: 14px;
    height: 14px;
  }

  .custom-toggle {
    gap: 8px;
  }

  .toggle-label {
    font-size: 0.78rem;
  }
}
</style>

