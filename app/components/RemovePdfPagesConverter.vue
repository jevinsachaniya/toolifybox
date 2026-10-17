<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { 
  Check, CheckCheck, CircleAlert, Download, FileText, LoaderCircle, 
  RotateCcw, Trash2, Upload, X 
} from '@lucide/vue';
import { formatSize, removedPagesPdfFilename, validatePdf } from '~/utils/document.js';
import { openPdfForImages } from '~/utils/pdf-images.js';
import { formatPageList, parsePageInput, removePagesFromPdf } from '~/utils/remove-pdf-pages.js';

const file = shallowRef(null);
const pages = ref([]);
const removedPages = ref([]);
const rangeInput = ref('');
const busy = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const resultPdf = ref(null);
const input = ref(null);
const uploadButton = ref(null);

const stage = computed(() => (resultPdf.value ? 3 : pages.value.length ? 2 : 1));
const keptCount = computed(() => Math.max(0, pages.value.length - removedPages.value.length));
const canRemove = computed(() => {
  return (
    file.value &&
    pages.value.length > 1 &&
    removedPages.value.length > 0 &&
    keptCount.value > 0 &&
    !busy.value
  );
});

let handle;
let request;
let dropDepth = 0;
let active = true;

function clearResult() {
  if (resultPdf.value?.url) URL.revokeObjectURL(resultPdf.value.url);
  resultPdf.value = null;
}

function releasePreviews() {
  for (const page of pages.value) URL.revokeObjectURL(page.previewUrl);
  pages.value = [];
  removedPages.value = [];
  rangeInput.value = '';
}

async function closePdf() {
  const current = handle;
  handle = undefined;
  await current?.close();
}

onBeforeUnmount(() => {
  active = false;
  request?.abort();
  clearResult();
  releasePreviews();
  void closePdf();
});

async function clear({ focus = true } = {}) {
  request?.abort();
  request = undefined;
  clearResult();
  releasePreviews();
  await closePdf();
  file.value = null;
  busy.value = false;
  error.value = '';
  progress.value = '';
  if (input.value) input.value.value = '';
  if (focus && active) uploadButton.value?.focus();
}

async function select(files) {
  if (busy.value || !files?.length) return;
  const chosen = Array.from(files);
  const message = validatePdf(chosen);
  await clear({ focus: false });
  error.value = message;
  file.value = message ? null : chosen[0];
  if (file.value) {
    void loadPages();
  }
}

function chooseFile(event) {
  void select(event.target.files);
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
  void select(event.dataTransfer.files);
}

function downloadFile(url, filename) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

async function loadPages() {
  if (!file.value || busy.value) return;
  busy.value = true;
  error.value = '';
  const controller = new AbortController();
  request = controller;
  const previews = [];

  try {
    handle = await openPdfForImages(file.value, {
      signal: controller.signal,
      onProgress: msg => { if (active) progress.value = msg; },
    });

    if (handle.pageCount < 2) {
      throw new Error('This PDF has only 1 page. Choose a PDF with at least 2 pages to remove pages.');
    }

    for (let number = 1; number <= handle.pageCount; number++) {
      progress.value = `Loading preview for page ${number} of ${handle.pageCount}…`;
      const image = await handle.renderPage(number, {
        maxDimension: 300,
        format: 'jpg',
        quality: 0.82,
        renderSignal: controller.signal,
      });
      previews.push({
        number,
        previewUrl: URL.createObjectURL(image.blob),
      });
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    if (active && !controller.signal.aborted) {
      pages.value = previews;
    }
  } catch (caught) {
    for (const page of previews) URL.revokeObjectURL(page.previewUrl);
    await closePdf();
    if (active && caught.name !== 'AbortError') {
      error.value = caught.message || 'We could not preview this PDF. Try another file.';
    }
  } finally {
    if (request === controller) request = undefined;
    if (active) {
      busy.value = false;
      progress.value = '';
    }
  }
}

function togglePage(number) {
  if (busy.value) return;
  if (removedPages.value.includes(number)) {
    removedPages.value = removedPages.value.filter(n => n !== number);
  } else {
    removedPages.value = [...removedPages.value, number].sort((a, b) => a - b);
  }
  rangeInput.value = formatPageList(removedPages.value);
}

function onRangeInput() {
  if (busy.value) return;
  const parsed = parsePageInput(rangeInput.value, pages.value.length);
  removedPages.value = parsed;
}

function selectOdd() {
  if (busy.value) return;
  const odds = pages.value.filter(p => p.number % 2 !== 0).map(p => p.number);
  // Ensure we do not remove all pages
  if (odds.length >= pages.value.length) {
    odds.pop();
  }
  removedPages.value = odds;
  rangeInput.value = formatPageList(odds);
}

function selectEven() {
  if (busy.value) return;
  const evens = pages.value.filter(p => p.number % 2 === 0).map(p => p.number);
  // Ensure we do not remove all pages
  if (evens.length >= pages.value.length) {
    evens.pop();
  }
  removedPages.value = evens;
  rangeInput.value = formatPageList(evens);
}

function clearSelection() {
  if (busy.value) return;
  removedPages.value = [];
  rangeInput.value = '';
}

async function executeRemovePages() {
  if (!canRemove.value) return;
  busy.value = true;
  error.value = '';
  clearResult();
  const controller = new AbortController();
  request = controller;

  try {
    progress.value = 'Removing selected pages from PDF…';
    const result = await removePagesFromPdf(file.value, removedPages.value, {
      signal: controller.signal,
      onProgress: msg => { if (active) progress.value = msg; },
    });

    const filename = removedPagesPdfFilename(file.value.name);
    const url = URL.createObjectURL(result.blob);

    if (active) {
      resultPdf.value = {
        blob: result.blob,
        url,
        filename,
        size: result.blob.size,
        keptCount: result.keptCount,
        removedCount: result.removedCount,
        totalPages: result.totalPages,
      };
      downloadFile(url, filename);
    }
  } catch (caught) {
    if (active && caught.name !== 'AbortError') {
      error.value = caught.message || 'We could not remove pages from this PDF. Please try again.';
    }
  } finally {
    if (request === controller) request = undefined;
    if (active) {
      busy.value = false;
      progress.value = '';
    }
  }
}

function cancel() {
  request?.abort();
}
</script>

<template>
  <section
    id="converter"
    class="converter remove-pages-converter"
    :class="{ 'is-converting': busy, 'has-pages': pages.length }"
    aria-label="Remove PDF Pages converter"
    :aria-busy="busy"
  >
    <div class="converter-heading">
      <div>
        <span class="mini-label">ORGANIZE &amp; EDIT PDF</span>
        <h2>Remove PDF Pages <span aria-hidden="true">🗑️</span></h2>
      </div>
      <span class="free-badge">100% Private</span>
    </div>

    <ol class="step-track" aria-label="Removal steps">
      <li
        v-for="(label, index) in ['Select PDF', 'Choose pages', 'Download PDF']"
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
      id="remove-pages-input"
      ref="input"
      class="visually-hidden"
      tabindex="-1"
      type="file"
      accept=".pdf,application/pdf"
      :disabled="busy"
      aria-label="Choose a PDF file to remove pages from"
      @change="chooseFile"
    />

    <!-- Stage 3: Result / Success -->
    <template v-if="resultPdf">
      <div class="result-state">
        <div class="file-chosen-icon" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; margin: 0 auto 16px;">
          <CheckCheck :size="30" />
        </div>
        <h3>Pages Removed Successfully!</h3>
        <p>
          Removed {{ resultPdf.removedCount }} {{ resultPdf.removedCount === 1 ? 'page' : 'pages' }}.
          Your new document now has {{ resultPdf.keptCount }} {{ resultPdf.keptCount === 1 ? 'page' : 'pages' }}.
        </p>

        <div class="selected-file" style="margin: 20px 0;">
          <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
            <div style="color: #f43f5e; background: #ffe4e6; padding: 10px; border-radius: 10px; display: grid; place-items: center;">
              <FileText :size="20" />
            </div>
            <div style="flex: 1; min-width: 0;">
              <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ resultPdf.filename }}</strong>
              <span style="font-size: 12px; color: #64748b;">
                {{ formatSize(resultPdf.size) }} · {{ resultPdf.keptCount }} pages retained
              </span>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <a class="primary-button" :href="resultPdf.url" :download="resultPdf.filename">
            <Download :size="18" /> Download Clean PDF again
          </a>
          <button class="text-button" @click="clear()">
            <RotateCcw :size="16" /> Remove pages from another PDF
          </button>
        </div>
      </div>
    </template>

    <!-- Stage 2: Interactive Page Selection Grid -->
    <template v-else-if="pages.length">
      <!-- File header bar -->
      <div class="file-card" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: #ffe4e6; color: #f43f5e; display: grid; place-items: center; flex-shrink: 0;">
            <FileText :size="20" />
          </div>
          <div style="min-width: 0;">
            <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px;">{{ file.name }}</strong>
            <span style="font-size: 12px; color: #64748b;">
              {{ formatSize(file.size) }} · {{ pages.length }} total pages
            </span>
          </div>
        </div>
        <button class="icon-button" :disabled="busy" aria-label="Choose another PDF" @click="clear()">
          <X :size="18" />
        </button>
      </div>

      <!-- Live selection status & batch pills -->
      <div class="page-remove-toolbar">
        <div class="status-indicator">
          <span v-if="removedPages.length === 0" class="status-badge neutral">
            Click pages or enter numbers to mark for removal
          </span>
          <span v-else-if="keptCount === 0" class="status-badge error">
            ⚠️ You cannot remove all pages (keep at least 1)
          </span>
          <span v-else class="status-badge active">
            <strong>{{ removedPages.length }}</strong> {{ removedPages.length === 1 ? 'page' : 'pages' }} marked for removal · <strong>{{ keptCount }}</strong> will remain
          </span>
        </div>

        <!-- Range text input -->
        <div class="range-input-group">
          <label for="page-range-input">Pages to remove:</label>
          <div class="range-input-wrap">
            <input
              id="page-range-input"
              v-model="rangeInput"
              type="text"
              placeholder="e.g. 2, 4-6, 9"
              :disabled="busy"
              @input="onRangeInput"
            />
            <button
              v-if="rangeInput"
              type="button"
              class="clear-range-btn"
              title="Clear input"
              @click="clearSelection"
            >
              <X :size="14" />
            </button>
          </div>
        </div>

        <!-- Quick selection shortcuts -->
        <div class="quick-pills">
          <span class="quick-pills-label">Quick select:</span>
          <button type="button" :disabled="busy" @click="selectEven">Even pages</button>
          <button type="button" :disabled="busy" @click="selectOdd">Odd pages</button>
          <button v-if="removedPages.length" type="button" class="pill-reset" :disabled="busy" @click="clearSelection">Reset all</button>
        </div>
      </div>

      <!-- Page thumbnails grid -->
      <div class="page-remove-grid" aria-label="PDF pages to select for removal">
        <div
          v-for="page in pages"
          :key="page.number"
          class="page-remove-card"
          :class="{ 'is-removed': removedPages.includes(page.number) }"
          tabindex="0"
          role="checkbox"
          :aria-checked="removedPages.includes(page.number)"
          :aria-label="`Page ${page.number}: ${removedPages.includes(page.number) ? 'Marked for removal' : 'Kept'}`"
          @click="togglePage(page.number)"
          @keydown.enter.space.prevent="togglePage(page.number)"
        >
          <div class="card-image-wrap">
            <img :src="page.previewUrl" :alt="`Page ${page.number}`" loading="lazy" />
            <div class="card-overlay" aria-hidden="true">
              <span class="toggle-icon">
                <Trash2 v-if="removedPages.includes(page.number)" :size="20" />
                <span v-else class="hover-trash"><Trash2 :size="18" /></span>
              </span>
            </div>
          </div>

          <div class="card-footer">
            <span class="page-num">Page {{ page.number }}</span>
            <span v-if="removedPages.includes(page.number)" class="badge-removed">
              <Trash2 :size="11" /> Delete
            </span>
            <span v-else class="badge-keep">
              <Check :size="11" /> Keep
            </span>
          </div>
        </div>
      </div>

      <!-- Stage actions -->
      <div class="stage-actions" style="margin-top: 20px;">
        <button
          type="button"
          class="primary-button"
          :disabled="!canRemove"
          style="min-width: 200px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); box-shadow: 0 4px 18px rgba(239, 68, 68, 0.4);"
          @click="executeRemovePages"
        >
          <LoaderCircle v-if="busy" class="spin" :size="18" />
          <Trash2 v-else :size="18" />
          {{ busy ? 'Rebuilding PDF…' : removedPages.length ? `Remove ${removedPages.length} ${removedPages.length === 1 ? 'Page' : 'Pages'} & Download` : 'Select pages to delete' }}
        </button>
        <button type="button" class="text-button" :disabled="busy" @click="clear()">
          Choose another PDF
        </button>
      </div>
    </template>

    <!-- Stage 1: File Selection Dropzone -->
    <template v-else>
      <div
        class="drop-zone"
        :class="{ dragging }"
        tabindex="0"
        role="button"
        aria-label="Upload PDF to remove pages"
        @click="input?.click()"
        @keydown.enter.space.prevent="input?.click()"
        @dragenter.prevent="dragEnter"
        @dragover.prevent="dragOver"
        @dragleave.prevent="dragLeave"
        @drop.prevent="drop"
      >
        <div class="drop-zone-icon" style="background: linear-gradient(135deg, #f43f5e, #be123c); color: #fff; width: 64px; height: 64px; border-radius: 18px; display: grid; place-items: center; margin: 0 auto 16px;">
          <Trash2 :size="32" />
        </div>
        <h3>{{ dragging ? 'Drop your PDF here' : 'Select PDF to remove pages' }}</h3>
        <p>Preview all pages and delete the ones you don’t need.</p>
        <button ref="uploadButton" class="choose-button" type="button" @click.stop="input?.click()">
          <Upload :size="17" /> Choose PDF file
        </button>
        <span class="file-requirements">.PDF only · Up to 20 MB · 100% Client-Side</span>
      </div>
    </template>

    <!-- Busy progress bar -->
    <div v-if="busy" class="progress-track" role="status" style="margin-top: 18px;">
      <span />
      <p>{{ progress }} Please keep this window open.</p>
      <button type="button" class="text-button" style="margin-top: 4px; font-size: 11px;" @click="cancel">
        Cancel
      </button>
    </div>

    <!-- Error message display -->
    <div v-if="error" class="error-message" role="alert" style="margin-top: 16px;">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
    </div>

    <p class="conversion-note">
      Pages are deleted locally in your browser using secure client-side processing. Your document is never uploaded to any server.
    </p>
  </section>
</template>

