<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import {
  ArrowLeftRight,
  Check,
  CheckCheck,
  CircleAlert,
  Copy,
  Download,
  FileCheck,
  FileText,
  Info,
  Languages,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stamp,
  Upload,
  X,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import { countWords } from '~/utils/extract-ocr.js';
import {
  createTranslatedDocx,
  createTranslatedPdf,
  createTranslatedTxtBlob,
  extractTextFromPdf,
  getLanguageInfo,
  SOURCE_LANGUAGES,
  SUPPORTED_LANGUAGES,
  translateDocumentPages,
  translatedOutputFilename,
  validatePdfForTranslation,
} from '~/utils/translate-pdf.js';

// State
const file = shallowRef(null);
const sourceLang = ref('auto');
const targetLang = ref('gu'); // Default to Gujarati as requested
const busy = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const copiedOriginal = ref(false);
const copiedTranslated = ref(false);
const activePageTab = ref(0); // 0 = All Pages, 1..N = Page number
const extractedData = ref(null); // { totalPages, totalWordCount, pages: [...] }
const isTranslatingAgain = ref(false);

// Watermark option state
const addWatermark = ref(false);
const watermarkText = ref('TRANSLATED');
const watermarkPosition = ref('center-diagonal');
const watermarkOpacity = ref(25);

const WATERMARK_POSITION_OPTIONS = [
  { value: 'center-diagonal', label: 'Diagonal Center (45°)' },
  { value: 'center', label: 'Horizontal Center' },
  { value: 'tiled', label: 'Repeating Grid (Tiled)' },
  { value: 'top', label: 'Top Margin' },
  { value: 'bottom', label: 'Bottom Margin' },
];

const input = ref(null);
const uploadButton = ref(null);

let dropDepth = 0;
let abortController = null;
let active = true;

const stage = computed(() => {
  if (extractedData.value && extractedData.value.pages[0]?.translatedText) {
    return 3;
  }
  if (file.value) {
    return 2;
  }
  return 1;
});

const sourceLangInfo = computed(() => getLanguageInfo(sourceLang.value));
const targetLangInfo = computed(() => getLanguageInfo(targetLang.value));

// Current view text for original and translated panels
const displayedOriginalText = computed(() => {
  if (!extractedData.value?.pages?.length) return '';
  if (activePageTab.value === 0) {
    return extractedData.value.pages
      .map((p, idx) => (extractedData.value.pages.length > 1 ? `--- Page ${idx + 1} ---\n\n${p.text}` : p.text))
      .join('\n\n');
  }
  const page = extractedData.value.pages[activePageTab.value - 1];
  return page ? page.text : '';
});

function updatePageBlocksFromText(page, newText) {
  if (!page) return;
  page.translatedText = newText;
  if (!page.blocks || !page.blocks.length) return;

  const paras = newText.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  if (paras.length === page.blocks.length) {
    page.blocks.forEach((b, idx) => {
      b.translatedText = paras[idx];
    });
  } else if (page.blocks.length === 1) {
    page.blocks[0].translatedText = newText;
  } else {
    const lines = newText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === page.blocks.length) {
      page.blocks.forEach((b, idx) => {
        b.translatedText = lines[idx];
      });
    } else {
      for (let i = 0; i < page.blocks.length; i++) {
        if (paras[i]) {
          page.blocks[i].translatedText = paras[i];
        }
      }
    }
  }
}

const displayedTranslatedText = computed({
  get() {
    if (!extractedData.value?.pages?.length) return '';
    if (activePageTab.value === 0) {
      return extractedData.value.pages
        .map((p, idx) => (extractedData.value.pages.length > 1 ? `--- Page ${idx + 1} ---\n\n${p.translatedText || ''}` : p.translatedText || ''))
        .join('\n\n');
    }
    const page = extractedData.value.pages[activePageTab.value - 1];
    return page ? page.translatedText || '' : '';
  },
  set(val) {
    if (!extractedData.value?.pages?.length) return;
    if (activePageTab.value === 0) {
      // Split by page marker if present or apply to first page
      const marker = /--- Page \d+ ---\n\n/;
      if (marker.test(val)) {
        const parts = val.split(/--- Page \d+ ---\n\n/).filter(Boolean);
        parts.forEach((chunk, i) => {
          if (extractedData.value.pages[i]) {
            extractedData.value.pages[i].translatedText = chunk.trim();
            extractedData.value.pages[i].translatedWordCount = countWords(chunk);
            updatePageBlocksFromText(extractedData.value.pages[i], chunk.trim());
          }
        });
      } else {
        if (extractedData.value.pages[0]) {
          extractedData.value.pages[0].translatedText = val;
          extractedData.value.pages[0].translatedWordCount = countWords(val);
          updatePageBlocksFromText(extractedData.value.pages[0], val);
        }
      }
    } else {
      const page = extractedData.value.pages[activePageTab.value - 1];
      if (page) {
        page.translatedText = val;
        page.translatedWordCount = countWords(val);
        updatePageBlocksFromText(page, val);
      }
    }
  },
});

const totalOriginalWords = computed(() => {
  if (!extractedData.value?.pages) return 0;
  return extractedData.value.pages.reduce((acc, p) => acc + (p.wordCount || 0), 0);
});

const totalTranslatedWords = computed(() => {
  if (!extractedData.value?.pages) return 0;
  return extractedData.value.pages.reduce((acc, p) => acc + (p.translatedWordCount || 0), 0);
});

// Lifecycle
onBeforeUnmount(() => {
  active = false;
  abortController?.abort();
  clearAll();
});

function clearAll({ focus = true } = {}) {
  abortController?.abort();
  abortController = null;
  file.value = null;
  extractedData.value = null;
  busy.value = false;
  error.value = '';
  progress.value = '';
  copiedOriginal.value = false;
  copiedTranslated.value = false;
  activePageTab.value = 0;
  if (input.value) input.value.value = '';
  if (focus && active) uploadButton.value?.focus();
}

// Drag & Drop handlers
function dragEnter() {
  if (!busy.value) {
    dropDepth++;
    dragging.value = true;
  }
}

function dragOver(e) {
  e.dataTransfer.dropEffect = busy.value ? 'none' : 'copy';
}

function dragLeave() {
  dropDepth = Math.max(0, dropDepth - 1);
  if (!dropDepth) dragging.value = false;
}

function drop(e) {
  dropDepth = 0;
  dragging.value = false;
  handleFileSelect(e.dataTransfer.files);
}

function chooseFile(e) {
  handleFileSelect(e.target.files);
  e.target.value = '';
}

function handleFileSelect(files) {
  if (busy.value || !files?.length) return;
  const chosen = Array.from(files);
  const msg = validatePdfForTranslation(chosen);
  if (msg) {
    error.value = msg;
    return;
  }
  clearAll({ focus: false });
  file.value = chosen[0];
}

// Swap languages
function swapLanguages() {
  if (busy.value) return;
  if (sourceLang.value === 'auto') {
    // If auto, change source to target and target to english
    sourceLang.value = targetLang.value;
    targetLang.value = sourceLang.value === 'en' ? 'hi' : 'en';
  } else {
    const temp = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = temp;
  }
}

// Extraction and Translation
async function startTranslation() {
  if (!file.value || busy.value) return;

  busy.value = true;
  error.value = '';
  progress.value = 'Preparing PDF extraction…';
  abortController = new AbortController();

  try {
    // 1. Extract digital text from PDF if not already done
    if (!extractedData.value) {
      progress.value = 'Reading PDF content…';
      const extracted = await extractTextFromPdf(file.value, {
        signal: abortController.signal,
        onProgress: msg => {
          if (active) progress.value = msg;
        },
      });

      if (!active) return;
      if (!extracted.pages.length || extracted.totalWordCount === 0) {
        throw new Error('This PDF has no readable text. It might be scanned or protected.');
      }
      extractedData.value = extracted;
    }

    // 2. Translate pages
    progress.value = `Translating to ${targetLangInfo.value.name}…`;
    const translatedPages = await translateDocumentPages(
      extractedData.value.pages,
      sourceLang.value,
      targetLang.value,
      (msg) => {
        if (active) progress.value = msg;
      },
      {
        signal: abortController.signal,
        fallbackOnFail: true,
      }
    );

    if (active) {
      extractedData.value.pages = translatedPages;
    }
  } catch (err) {
    if (active && err.name !== 'AbortError') {
      error.value = err.message || 'Failed to translate PDF. Please check your network connection and try again.';
    }
  } finally {
    if (active) {
      busy.value = false;
      progress.value = '';
    }
  }
}

// Re-translate to another language without re-extracting
async function changeTargetLanguageAndTranslate(newLangCode) {
  if (busy.value || newLangCode === targetLang.value) return;
  targetLang.value = newLangCode;
  await startTranslation();
}

// Downloads & Copy
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadTxt() {
  if (!extractedData.value?.pages?.length) return;
  const blob = createTranslatedTxtBlob(extractedData.value.pages, {
    sourceLang: sourceLang.value,
    targetLang: targetLang.value,
    originalName: file.value?.name || 'document.pdf',
  });
  const filename = translatedOutputFilename(file.value?.name || 'document', targetLang.value, 'txt');
  triggerDownload(blob, filename);
}

async function downloadDocx() {
  if (!extractedData.value?.pages?.length || busy.value) return;
  busy.value = true;
  progress.value = 'Generating Word document (.docx)…';
  try {
    const blob = await createTranslatedDocx(extractedData.value.pages, {
      sourceLang: sourceLang.value,
      targetLang: targetLang.value,
      originalName: file.value?.name || 'document.pdf',
    });
    const filename = translatedOutputFilename(file.value?.name || 'document', targetLang.value, 'docx');
    triggerDownload(blob, filename);
  } catch (err) {
    error.value = 'Failed to generate Word document.';
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

async function downloadPdf() {
  if (!extractedData.value?.pages?.length || busy.value) return;
  busy.value = true;
  error.value = '';
  progress.value = 'Generating translated PDF with original layout & design…';
  try {
    const watermarkOptions = addWatermark.value ? {
      enabled: true,
      text: watermarkText.value.trim() || 'TRANSLATED',
      position: watermarkPosition.value,
      opacity: (Number(watermarkOpacity.value) || 25) / 100,
      color: '#e11d48',
      rotation: watermarkPosition.value === 'center-diagonal' ? 45 : watermarkPosition.value === 'tiled' ? 35 : 0,
    } : undefined;

    const blob = await createTranslatedPdf(extractedData.value.pages, {
      sourceLang: sourceLang.value,
      targetLang: targetLang.value,
      originalName: file.value?.name || 'document.pdf',
      pdfBytes: extractedData.value?.pdfBytes,
      file: file.value,
      watermark: watermarkOptions,
      onProgress: (msg) => {
        if (active) progress.value = msg;
      },
    });
    const filename = translatedOutputFilename(file.value?.name || 'document', targetLang.value, 'pdf');
    triggerDownload(blob, filename);
  } catch (err) {
    console.error('PDF generation error:', err);
    error.value = err?.message || 'Failed to generate PDF document.';
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

async function copyText(text, targetRef) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    targetRef.value = true;
    setTimeout(() => {
      targetRef.value = false;
    }, 2000);
  } catch {
    // Fallback execCommand
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    targetRef.value = true;
    setTimeout(() => {
      targetRef.value = false;
    }, 2000);
  }
}

function copyOriginal() {
  copyText(displayedOriginalText.value, copiedOriginal);
}

function copyTranslated() {
  copyText(displayedTranslatedText.value, copiedTranslated);
}
</script>

<template>
  <section id="converter" class="converter translate-pdf-converter" :class="{ 'has-translation': stage === 3 }">
    <div class="converter-heading">
      <div>
        <span class="mini-label">5 LANGUAGES SUPPORTED</span>
        <h2>PDF Language Translator</h2>
      </div>
      <span class="free-badge">100% Private</span>
    </div>

    <!-- Hidden file input -->
    <input
      id="translate-pdf-input"
      ref="input"
      type="file"
      accept=".pdf,application/pdf"
      class="visually-hidden"
      aria-hidden="true"
      tabindex="-1"
      @change="chooseFile"
    />

    <!-- Step Track -->
    <ol class="step-track" aria-label="Translation progress steps">
      <li :class="{ current: stage === 1, complete: stage > 1 }">
        <span>1</span>
        <b>Upload PDF</b>
      </li>
      <li :class="{ current: stage === 2, complete: stage > 2 }">
        <span>2</span>
        <b>Select Languages</b>
      </li>
      <li :class="{ current: stage === 3 }">
        <span>3</span>
        <b>Translate &amp; Export</b>
      </li>
    </ol>

    <!-- Stage 3: Translation Studio Results -->
    <template v-if="stage === 3">
      <div class="translate-studio">
        <!-- Studio Header -->
        <div class="translate-studio-header">
          <div class="translate-doc-meta">
            <span class="file-badge pdf">
              <b>PDF</b>
            </span>
            <div class="doc-meta-info">
              <strong :title="file.name">{{ file.name }}</strong>
              <small>{{ formatSize(file.size) }} · {{ extractedData.totalPages }} {{ extractedData.totalPages === 1 ? 'Page' : 'Pages' }} · {{ totalOriginalWords }} Words</small>
            </div>
          </div>

          <div class="translate-header-actions">
            <button
              type="button"
              class="btn-reset-studio"
              title="Translate another document"
              :disabled="busy"
              @click="clearAll"
            >
              <RotateCcw :size="13" />
              <span>Translate Another PDF</span>
            </button>
          </div>
        </div>

        <!-- Language Quick Switcher Bar -->
        <div class="translate-pair-banner">
          <div class="pair-info">
            <span class="lang-flag">{{ sourceLangInfo.flag }}</span>
            <span class="lang-name">{{ sourceLangInfo.name }}</span>
            <span class="arrow-sep">→</span>
            <span class="lang-flag">{{ targetLangInfo.flag }}</span>
            <span class="lang-name highlight">{{ targetLangInfo.name }} ({{ targetLangInfo.native }})</span>
          </div>

          <div class="quick-target-selector">
            <label>Translate to:</label>
            <div class="target-pills">
              <button
                v-for="l in SUPPORTED_LANGUAGES"
                :key="l.code"
                type="button"
                class="pill-target-btn"
                :class="{ active: targetLang === l.code }"
                :disabled="busy"
                @click="changeTargetLanguageAndTranslate(l.code)"
              >
                <span>{{ l.flag }}</span>
                <b>{{ l.name }}</b>
              </button>
            </div>
          </div>
        </div>


        <!-- Multi-page tabs if document has > 1 page -->
        <div v-if="extractedData.totalPages > 1" class="ocr-page-tabs">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activePageTab === 0 }"
            @click="activePageTab = 0"
          >
            All Pages ({{ extractedData.totalPages }})
          </button>
          <button
            v-for="p in extractedData.pages"
            :key="p.pageNumber"
            type="button"
            class="tab-btn"
            :class="{ active: activePageTab === p.pageNumber }"
            @click="activePageTab = p.pageNumber"
          >
            Page {{ p.pageNumber }}
          </button>
        </div>

        <!-- Side-by-side translation workspace -->
        <div class="translation-workspace">
          <!-- Left Panel: Original Text -->
          <div class="trans-panel original-panel">
            <div class="trans-panel-header">
              <div class="trans-panel-title">
                <FileText :size="14" />
                <span>Original Text</span>
                <span class="panel-count-pill">{{ countWords(displayedOriginalText) }} words</span>
              </div>
              <button
                type="button"
                class="btn-copy-small"
                :class="{ copied: copiedOriginal }"
                title="Copy original text"
                @click="copyOriginal"
              >
                <Check v-if="copiedOriginal" :size="12" />
                <Copy v-else :size="12" />
                <span>{{ copiedOriginal ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>
            <textarea
              class="trans-textarea original-textarea"
              :value="displayedOriginalText"
              readonly
              aria-label="Original document text"
            ></textarea>
          </div>

          <!-- Right Panel: Translated Text (Editable) -->
          <div class="trans-panel translated-panel">
            <div class="trans-panel-header">
              <div class="trans-panel-title">
                <Sparkles :size="14" color="#e11d48" />
                <span class="highlight-title">Translated ({{ targetLangInfo.name }})</span>
                <span class="editable-hint-badge" title="You can directly edit this text before downloading">✏️ Editable Text</span>
                <span class="panel-count-pill highlight">{{ countWords(displayedTranslatedText) }} words</span>
              </div>
              <button
                type="button"
                class="btn-copy-small"
                :class="{ copied: copiedTranslated }"
                title="Copy translated text"
                @click="copyTranslated"
              >
                <Check v-if="copiedTranslated" :size="12" />
                <Copy v-else :size="12" />
                <span>{{ copiedTranslated ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>
            <textarea
              v-model="displayedTranslatedText"
              class="trans-textarea translated-textarea"
              placeholder="Translated text will appear here… Click to edit or make corrections."
              aria-label="Translated document text"
            ></textarea>
          </div>
        </div>

        <!-- Export Actions Toolbar -->
        <div class="translate-export-toolbar">
          <!-- Optional Watermark Toggle for PDF -->
          <div class="watermark-toggle-card">
            <div class="watermark-toggle-head">
              <label class="watermark-toggle-label">
                <input
                  v-model="addWatermark"
                  type="checkbox"
                  class="watermark-check"
                  :disabled="busy"
                />
                <Stamp :size="15" />
                <span><b>Watermark translated PDF</b> (optional)</span>
              </label>
              <NuxtLink to="/tools/watermark-pdf" class="watermark-tool-link" title="Open full Watermark PDF tool">
                Custom stamps &amp; full editor &rarr;
              </NuxtLink>
            </div>

            <div v-if="addWatermark" class="watermark-inline-controls">
              <input
                v-model="watermarkText"
                type="text"
                class="watermark-inline-input"
                placeholder="Watermark text (e.g. TRANSLATED, DRAFT)"
                maxlength="50"
                :disabled="busy"
              />
              <CustomSelect
                v-model="watermarkPosition"
                :options="WATERMARK_POSITION_OPTIONS"
                :disabled="busy"
                size="sm"
                aria-label="Watermark position"
                class="watermark-inline-select-custom"
              />
              <div class="watermark-inline-opacity">
                <span>Opacity: <b>{{ watermarkOpacity }}%</b></span>
                <input
                  v-model.number="watermarkOpacity"
                  type="range"
                  min="10"
                  max="70"
                  step="5"
                  class="watermark-mini-slider"
                  :disabled="busy"
                />
              </div>
            </div>
          </div>

          <div class="export-buttons-group">
            <button
              type="button"
              class="btn-export-doc btn-pdf"
              :disabled="busy || !displayedTranslatedText"
              title="Download a translated PDF aligned to the original page layout"
              @click="downloadPdf"
            >
              <Download :size="15" />
              <span>Download PDF (Preserve Layout)</span>
            </button>

            <button
              type="button"
              class="btn-export-doc btn-docx"
              :disabled="busy || !displayedTranslatedText"
              @click="downloadDocx"
            >
              <Download :size="15" />
              <span>Download Word (.docx)</span>
            </button>

            <button
              type="button"
              class="btn-export-doc btn-txt"
              :disabled="busy || !displayedTranslatedText"
              @click="downloadTxt"
            >
              <Download :size="15" />
              <span>Download Text (.txt)</span>
            </button>

            <button
              type="button"
              class="btn-export-doc btn-copy-all"
              :class="{ copied: copiedTranslated }"
              :disabled="busy || !displayedTranslatedText"
              @click="copyTranslated"
            >
              <Check v-if="copiedTranslated" :size="15" />
              <Copy v-else :size="15" />
              <span>{{ copiedTranslated ? 'Copied Translated Text!' : 'Copy to Clipboard' }}</span>
            </button>
          </div>

          <div class="layout-guarantee-note">
            <ShieldCheck :size="15" />
            <span><b>Important Quality Note:</b> Please check your translated text before downloading. You can make manual corrections directly in the editor above. If the document layout requires adjustment, click "Re-translate". Your exported PDF will always preserve your latest edits.</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Stage 2: Configure & Translate -->
    <template v-else-if="stage === 2">
      <div class="translate-config-card">
        <div class="selected-file">
          <div class="file-icon-wrap">
            <span class="file-badge pdf">
              <b>PDF</b>
            </span>
          </div>
          <div class="file-info">
            <strong :title="file.name">{{ file.name }}</strong>
            <small>{{ formatSize(file.size) }}</small>
          </div>
          <button
            type="button"
            class="remove-file-button"
            title="Choose different PDF"
            :disabled="busy"
            @click="clearAll"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Language Selector Bar -->
        <div class="language-selector-box">
          <div class="lang-column">
            <label>Translate From:</label>
            <div class="select-dropdown-wrap">
              <CustomSelect
                v-model="sourceLang"
                :options="SOURCE_LANGUAGES"
                :disabled="busy"
                size="sm"
                aria-label="Translate from source language"
              />
            </div>
          </div>

          <button
            type="button"
            class="btn-swap-languages"
            title="Swap source and target languages"
            :disabled="busy"
            @click="swapLanguages"
          >
            <ArrowLeftRight :size="16" />
          </button>

          <div class="lang-column">
            <label>Translate Into:</label>
            <div class="select-dropdown-wrap">
              <CustomSelect
                v-model="targetLang"
                :options="SUPPORTED_LANGUAGES"
                :disabled="busy"
                size="sm"
                aria-label="Translate into target language"
              />
            </div>
          </div>
        </div>

        <!-- Quick language chips -->
        <div class="quick-target-strip">
          <span class="quick-strip-label">Popular Target Languages:</span>
          <div class="quick-lang-chips">
            <button
              v-for="l in SUPPORTED_LANGUAGES"
              :key="l.code"
              type="button"
              class="quick-lang-btn"
              :class="{ active: targetLang === l.code }"
              :disabled="busy"
              @click="targetLang = l.code"
            >
              <span>{{ l.flag }}</span>
              <span>{{ l.name }}</span>
            </button>
          </div>
        </div>

        <!-- Translate Action Button -->
        <button
          type="button"
          class="primary-button"
          :disabled="busy"
          style="margin-top: 18px; width: 100%; background: var(--primary-gradient); box-shadow: var(--primary-glow);"
          @click="startTranslation"
        >
          <LoaderCircle v-if="busy" class="spin" :size="18" />
          <Languages v-else :size="18" />
          {{ busy ? (progress || 'Translating document…') : `Translate to ${targetLangInfo.name} (${targetLangInfo.native})` }}
        </button>
      </div>
    </template>

    <!-- Stage 1: Dropzone -->
    <template v-else>
      <div
        class="drop-zone"
        :class="{ dragging }"
        tabindex="0"
        role="button"
        aria-label="Upload PDF to translate"
        @click="input?.click()"
        @keydown.enter.space.prevent="input?.click()"
        @dragenter.prevent="dragEnter"
        @dragover.prevent="dragOver"
        @dragleave.prevent="dragLeave"
        @drop.prevent="drop"
      >
        <div class="drop-zone-icon" style="background: var(--primary-gradient); color: #fff;">
          <Languages :size="32" />
        </div>
        <h3>{{ dragging ? 'Drop your PDF here' : 'Drop your PDF to translate' }}</h3>
        <p>Translate documents seamlessly into English, Hindi, Spanish, French, and Gujarati.</p>
        <button ref="uploadButton" class="choose-button" type="button" @click.stop="input?.click()">
          <Upload :size="17" /> Choose PDF File
        </button>
        <span class="file-requirements">PDF documents · Up to 30 MB · 100% In-Browser Privacy</span>
      </div>
    </template>

    <!-- Progress track -->
    <div v-if="busy" class="progress-track" role="status" style="margin-top: 18px;">
      <span />
      <p>{{ progress }} Please keep this page open.</p>
    </div>

    <!-- Error message display -->
    <div v-if="error" class="error-message" role="alert" style="margin-top: 16px;">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
    </div>

    <p class="conversion-note">
      PDF translation extracts text directly inside your browser. No files are stored or logged on any external servers.
    </p>
  </section>
</template>
