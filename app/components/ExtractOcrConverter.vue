<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { 
  Check, CheckCheck, CircleAlert, Copy, Download, FileText, 
  Languages, LoaderCircle, RotateCcw, ScanText, Sparkles, Upload, X 
} from '@lucide/vue';
import { formatSize, ocrTextFilename } from '~/utils/document.js';
import { 
  countWords, createOcrDocx, extractOcrFromFile, validateOcrFile 
} from '~/utils/extract-ocr.js';

const file = shallowRef(null);
const language = ref('eng+hin'); // 'eng', 'hin', 'eng+hin'
const forceOcr = ref(false);
const busy = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const copied = ref(false);
const activePageTab = ref(0); // 0 means 'All Pages', 1..N means specific page
const result = ref(null);
const editableText = ref('');
const input = ref(null);
const uploadButton = ref(null);

const stage = computed(() => (result.value ? 3 : file.value ? 2 : 1));

const isPdf = computed(() => {
  if (!file.value) return false;
  return file.value.type === 'application/pdf' || /\.pdf$/i.test(file.value.name || '');
});

const currentWordCount = computed(() => countWords(editableText.value));
const currentCharCount = computed(() => editableText.value.length);

let request;
let dropDepth = 0;
let active = true;

function clearResult() {
  result.value = null;
  editableText.value = '';
  copied.value = false;
  activePageTab.value = 0;
}

onBeforeUnmount(() => {
  active = false;
  request?.abort();
  clearResult();
});

function clear({ focus = true } = {}) {
  request?.abort();
  request = undefined;
  clearResult();
  file.value = null;
  busy.value = false;
  error.value = '';
  progress.value = '';
  forceOcr.value = false;
  if (input.value) input.value.value = '';
  if (focus && active) uploadButton.value?.focus();
}

function select(files) {
  if (busy.value || !files?.length) return;
  const chosen = Array.from(files);
  const message = validateOcrFile(chosen);
  clear({ focus: false });
  error.value = message;
  file.value = message ? null : chosen[0];
}

function chooseFile(event) {
  select(event.target.files);
  event.target.value = '';
}

function dragEnter() {
  if (!busy.value) {
    dropDepth++;
    dragging.value = true;
  }
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
  select(event.dataTransfer.files);
}

function downloadFile(blob, filename) {
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
  if (!editableText.value) return;
  const blob = new Blob([editableText.value], { type: 'text/plain;charset=utf-8' });
  const filename = ocrTextFilename(file.value?.name || 'document', 'txt');
  downloadFile(blob, filename);
}

async function downloadDocx() {
  if (!editableText.value) return;
  try {
    const blob = await createOcrDocx(editableText.value, {
      title: file.value?.name || 'Extracted Text',
    });
    const filename = ocrTextFilename(file.value?.name || 'document', 'docx');
    downloadFile(blob, filename);
  } catch (err) {
    error.value = 'Failed to generate Word document. Please try copying the text or downloading TXT.';
  }
}

async function copyToClipboard() {
  if (!editableText.value) return;
  try {
    await navigator.clipboard.writeText(editableText.value);
    copied.value = true;
    setTimeout(() => {
      if (active) copied.value = false;
    }, 2500);
  } catch {
    // Fallback selection
    const textarea = document.getElementById('ocr-text-editor');
    if (textarea) {
      textarea.select();
      document.execCommand('copy');
      copied.value = true;
      setTimeout(() => { if (active) copied.value = false; }, 2500);
    }
  }
}

function selectPageTab(pageNum) {
  activePageTab.value = pageNum;
  if (!result.value) return;
  if (pageNum === 0) {
    editableText.value = result.value.text;
  } else {
    const pageObj = result.value.pages.find(p => p.pageNumber === pageNum);
    editableText.value = pageObj ? pageObj.text : '';
  }
}

async function executeExtract() {
  if (!file.value || busy.value) return;
  busy.value = true;
  error.value = '';
  progress.value = 'Initializing text extraction…';

  const controller = new AbortController();
  request = controller;

  try {
    const data = await extractOcrFromFile(file.value, {
      language: language.value,
      forceOcr: forceOcr.value,
      signal: controller.signal,
      onProgress: msg => { if (active) progress.value = msg; },
    });

    if (active) {
      result.value = data;
      editableText.value = data.text;
      activePageTab.value = 0;
    }
  } catch (caught) {
    if (active && caught.name !== 'AbortError') {
      error.value = caught.message || 'We could not recognize text from this document. Try a clearer scan or select English + Hindi.';
    }
  } finally {
    if (request === controller) request = undefined;
    if (active) {
      busy.value = false;
      progress.value = '';
    }
  }
}
</script>

<template>
  <section
    id="converter"
    class="converter extract-ocr-converter"
    :class="{ 'is-converting': busy, 'has-file': file, 'has-results': result }"
    aria-label="Extract OCR Text converter"
    :aria-busy="busy"
  >
    <div class="converter-heading">
      <div>
        <span class="mini-label">OPTICAL CHARACTER RECOGNITION</span>
        <h2>Extract OCR Text</h2>
      </div>
      <span class="free-badge">100% Private</span>
    </div>

    <ol class="step-track" aria-label="OCR steps">
      <li
        v-for="(label, index) in ['Select document', 'Configure OCR', 'Copy & Download']"
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
      id="ocr-file-input"
      ref="input"
      class="visually-hidden"
      tabindex="-1"
      type="file"
      accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
      :disabled="busy"
      aria-label="Choose a PDF or image file for OCR"
      @change="chooseFile"
    />

    <!-- Stage 3: Extracted Text Editor & Export -->
    <template v-if="result">
      <div class="ocr-result-panel">
        <div class="ocr-stats-header">
          <div class="ocr-stats-pills">
            <span class="stat-pill"><b>{{ currentWordCount }}</b> words</span>
            <span class="stat-pill"><b>{{ currentCharCount }}</b> chars</span>
            <span v-if="result.totalPages > 1" class="stat-pill"><b>{{ result.totalPages }}</b> pages</span>
            <span v-if="result.ocrPages > 0" class="stat-pill pill-ocr"><Sparkles :size="12" /> {{ result.ocrPages }} OCR scanned</span>
          </div>

          <div class="ocr-quick-actions">
            <button
              type="button"
              class="btn-copy-text"
              :class="{ 'is-copied': copied }"
              :disabled="!editableText.trim()"
              @click="copyToClipboard"
            >
              <Check v-if="copied" :size="14" />
              <Copy v-else :size="14" />
              {{ copied ? 'Copied to clipboard!' : 'Copy text' }}
            </button>
            <button
              type="button"
              class="btn-export-text"
              :disabled="!editableText.trim()"
              title="Download as plain text file"
              @click="downloadTxt"
            >
              <Download :size="14" /> .TXT
            </button>
            <button
              type="button"
              class="btn-export-text btn-docx"
              :disabled="!editableText.trim()"
              title="Download as editable Word document"
              @click="downloadDocx"
            >
              <Download :size="14" /> .DOCX
            </button>
          </div>
        </div>

        <!-- Page switcher tabs for multipage PDFs -->
        <div v-if="result.pages.length > 1" class="ocr-page-tabs">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activePageTab === 0 }"
            @click="selectPageTab(0)"
          >
            All Pages ({{ result.pages.length }})
          </button>
          <button
            v-for="p in result.pages"
            :key="p.pageNumber"
            type="button"
            class="tab-btn"
            :class="{ active: activePageTab === p.pageNumber }"
            @click="selectPageTab(p.pageNumber)"
          >
            Page {{ p.pageNumber }}
          </button>
        </div>

        <!-- Editable extracted text area -->
        <div class="ocr-editor-wrapper">
          <textarea
            id="ocr-text-editor"
            v-model="editableText"
            class="ocr-textarea"
            rows="14"
            aria-label="Extracted OCR Text Content"
            placeholder="Extracted text will appear here..."
          ></textarea>
        </div>

        <div class="ocr-panel-footer">
          <div style="font-size: 12px; color: #64748b;">
            100% processed on this device. Edit, copy, or save your text anytime.
          </div>
          <button type="button" class="text-button" @click="clear()">
            <RotateCcw :size="15" /> Extract from another file
          </button>
        </div>
      </div>
    </template>

    <!-- Stage 2: Options & Start Recognition -->
    <template v-else-if="file">
      <div class="file-card" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: #e0f2fe; color: #0284c7; display: grid; place-items: center; flex-shrink: 0;">
            <ScanText :size="20" />
          </div>
          <div style="min-width: 0;">
            <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px;">{{ file.name }}</strong>
            <span style="font-size: 12px; color: #64748b;">{{ formatSize(file.size) }} · {{ isPdf ? 'PDF Document' : 'Image Scan' }}</span>
          </div>
        </div>
        <button class="icon-button" :disabled="busy" aria-label="Choose another file" @click="clear()">
          <X :size="18" />
        </button>
      </div>

      <!-- OCR Settings -->
      <div class="ocr-settings-box">
        <div class="setting-item">
          <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px;">
            Document Language:
          </label>
          <div class="lang-selector-grid">
            <button
              type="button"
              class="lang-pill"
              :class="{ active: language === 'eng+hin' }"
              :disabled="busy"
              @click="language = 'eng+hin'"
            >
              English + Hindi (Mixed)
            </button>
            <button
              type="button"
              class="lang-pill"
              :class="{ active: language === 'eng' }"
              :disabled="busy"
              @click="language = 'eng'"
            >
              English only
            </button>
            <button
              type="button"
              class="lang-pill"
              :class="{ active: language === 'hin' }"
              :disabled="busy"
              @click="language = 'hin'"
            >
              Hindi only
            </button>
          </div>
        </div>

        <div v-if="isPdf" class="setting-item" style="margin-top: 14px;">
          <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: #475569;">
            <input v-model="forceOcr" type="checkbox" :disabled="busy" style="accent-color: #0284c7;" />
            <span>Force optical OCR on every page (even if PDF already has embedded digital text)</span>
          </label>
        </div>
      </div>

      <div class="stage-actions" style="margin-top: 24px;">
        <button
          type="button"
          class="primary-button"
          :disabled="busy"
          style="min-width: 200px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); box-shadow: 0 4px 18px rgba(2, 132, 199, 0.35);"
          @click="executeExtract"
        >
          <LoaderCircle v-if="busy" class="spin" :size="18" />
          <ScanText v-else :size="18" />
          {{ busy ? (progress || 'Extracting text…') : 'Extract Text Now' }}
        </button>
        <button type="button" class="text-button" :disabled="busy" @click="clear()">
          Choose another file
        </button>
      </div>
    </template>

    <!-- Stage 1: File Dropzone -->
    <template v-else>
      <div
        class="drop-zone"
        :class="{ dragging }"
        tabindex="0"
        role="button"
        aria-label="Upload PDF or image to extract OCR text"
        @click="input?.click()"
        @keydown.enter.space.prevent="input?.click()"
        @dragenter.prevent="dragEnter"
        @dragover.prevent="dragOver"
        @dragleave.prevent="dragLeave"
        @drop.prevent="drop"
      >
        <div class="drop-zone-icon" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff;">
          <ScanText :size="32" />
        </div>
        <h3>{{ dragging ? 'Drop your document here' : 'Drop your scanned PDF or Image here' }}</h3>
        <p>Extract searchable, editable text directly in your browser</p>
        <button ref="uploadButton" class="choose-button" type="button" @click.stop="input?.click()">
          <Upload :size="17" /> Choose PDF or Image
        </button>
        <span class="file-requirements">PDF, JPG, PNG, WebP · Up to 30 MB · English &amp; Hindi OCR</span>
      </div>
    </template>

    <div v-if="error" class="error-banner" role="alert">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
    </div>

    <div v-if="busy && progress" class="progress-bar-wrap" aria-live="polite">
      <div class="progress-info">
        <LoaderCircle class="spin" :size="14" />
        <span>{{ progress }}</span>
      </div>
    </div>
  </section>
</template>

