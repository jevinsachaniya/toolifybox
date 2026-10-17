<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { 
  Check, CheckCheck, CircleAlert, Download, FileText, LoaderCircle, 
  RotateCcw, RotateCw, Upload, X 
} from '@lucide/vue';
import { formatSize, rotatedPdfFilename, validatePdf } from '~/utils/document.js';
import { openPdfForImages } from '~/utils/pdf-images.js';
import { normalizeAngle, rotatePdfFile } from '~/utils/rotate-pdf.js';

const file = shallowRef(null);
const pages = ref([]);
const pageRotations = ref({});
const busy = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const resultPdf = ref(null);
const input = ref(null);
const uploadButton = ref(null);

const stage = computed(() => (resultPdf.value ? 3 : pages.value.length ? 2 : 1));
const hasAnyRotation = computed(() => {
  return Object.values(pageRotations.value).some(deg => normalizeAngle(deg) !== 0);
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
  pageRotations.value = {};
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

    const rotations = {};
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
      rotations[number] = 0;
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    if (active && !controller.signal.aborted) {
      pages.value = previews;
      pageRotations.value = rotations;
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

function rotateSinglePage(pageNum, delta) {
  if (busy.value) return;
  const current = pageRotations.value[pageNum] || 0;
  pageRotations.value = {
    ...pageRotations.value,
    [pageNum]: normalizeAngle(current + delta),
  };
}

function rotateAll(delta) {
  if (busy.value) return;
  const updated = {};
  for (const page of pages.value) {
    const current = pageRotations.value[page.number] || 0;
    updated[page.number] = normalizeAngle(current + delta);
  }
  pageRotations.value = updated;
}

function resetAll() {
  if (busy.value) return;
  const updated = {};
  for (const page of pages.value) {
    updated[page.number] = 0;
  }
  pageRotations.value = updated;
}

async function executeRotate() {
  if (!file.value || busy.value || !pages.value.length) return;
  busy.value = true;
  error.value = '';
  clearResult();
  const controller = new AbortController();
  request = controller;

  try {
    progress.value = 'Applying page rotations…';
    const result = await rotatePdfFile(file.value, pageRotations.value, {
      signal: controller.signal,
      onProgress: msg => { if (active) progress.value = msg; },
    });

    const filename = rotatedPdfFilename(file.value.name);
    const url = URL.createObjectURL(result.blob);

    if (active) {
      resultPdf.value = {
        blob: result.blob,
        url,
        filename,
        size: result.blob.size,
        pageCount: result.pageCount,
        changedCount: result.changedCount,
      };
      downloadFile(url, filename);
    }
  } catch (caught) {
    if (active && caught.name !== 'AbortError') {
      error.value = caught.message || 'We could not rotate this PDF. Please try again.';
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
    class="converter rotate-pdf-converter"
    :class="{ 'is-converting': busy, 'has-pages': pages.length }"
    aria-label="Rotate PDF converter"
    :aria-busy="busy"
  >
    <div class="converter-heading">
      <div>
        <span class="mini-label">DOCUMENT ORIENTATION</span>
        <h2>Rotate PDF <span aria-hidden="true">🔄</span></h2>
      </div>
      <span class="free-badge">100% Private</span>
    </div>

    <ol class="step-track" aria-label="Rotation steps">
      <li
        v-for="(label, index) in ['Select PDF', 'Rotate pages', 'Download PDF']"
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
      id="rotate-pdf-input"
      ref="input"
      class="visually-hidden"
      tabindex="-1"
      type="file"
      accept=".pdf,application/pdf"
      :disabled="busy"
      aria-label="Choose a PDF file to rotate"
      @change="chooseFile"
    />

    <!-- Stage 3: Result / Success -->
    <template v-if="resultPdf">
      <div class="result-state">
        <div class="file-chosen-icon" style="background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; margin: 0 auto 16px;">
          <CheckCheck :size="30" />
        </div>
        <h3>PDF Rotated Successfully!</h3>
        <p>
          {{ resultPdf.changedCount ? `Updated orientation on ${resultPdf.changedCount} ${resultPdf.changedCount === 1 ? 'page' : 'pages'}.` : 'Document saved with current orientation.' }}
          All {{ resultPdf.pageCount }} pages preserved with pristine quality.
        </p>

        <div class="selected-file" style="margin: 20px 0;">
          <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
            <div style="color: #ea580c; background: #ffedd5; padding: 10px; border-radius: 10px; display: grid; place-items: center;">
              <FileText :size="20" />
            </div>
            <div style="flex: 1; min-width: 0;">
              <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ resultPdf.filename }}</strong>
              <span style="font-size: 12px; color: #64748b;">
                {{ formatSize(resultPdf.size) }} · {{ resultPdf.pageCount }} pages
              </span>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <a class="primary-button" :href="resultPdf.url" :download="resultPdf.filename" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);">
            <Download :size="18" /> Download Rotated PDF again
          </a>
          <button class="text-button" @click="clear()">
            <RotateCcw :size="16" /> Rotate another PDF
          </button>
        </div>
      </div>
    </template>

    <!-- Stage 2: Interactive Page Rotation Grid -->
    <template v-else-if="pages.length">
      <!-- File header bar -->
      <div class="file-card" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: #ffedd5; color: #ea580c; display: grid; place-items: center; flex-shrink: 0;">
            <FileText :size="20" />
          </div>
          <div style="min-width: 0;">
            <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px;">{{ file.name }}</strong>
            <span style="font-size: 12px; color: #64748b;">
              {{ formatSize(file.size) }} · {{ pages.length }} pages
            </span>
          </div>
        </div>
        <button class="icon-button" :disabled="busy" aria-label="Choose another PDF" @click="clear()">
          <X :size="18" />
        </button>
      </div>

      <!-- Global rotation control toolbar -->
      <div class="page-rotate-toolbar">
        <div class="rotate-toolbar-left">
          <span class="rotate-status">
            {{ hasAnyRotation ? 'Rotations applied to pages' : 'Click buttons below to rotate pages' }}
          </span>
        </div>

        <div class="rotate-toolbar-actions">
          <button type="button" class="btn-rotate-batch" :disabled="busy" title="Rotate all pages left 90°" @click="rotateAll(-90)">
            <RotateCcw :size="14" /> All Left 90°
          </button>
          <button type="button" class="btn-rotate-batch" :disabled="busy" title="Rotate all pages right 90°" @click="rotateAll(90)">
            <RotateCw :size="14" /> All Right 90°
          </button>
          <button type="button" class="btn-rotate-batch" :disabled="busy" title="Flip all pages 180°" @click="rotateAll(180)">
            Flip 180°
          </button>
          <button v-if="hasAnyRotation" type="button" class="btn-rotate-reset" :disabled="busy" title="Reset all to original" @click="resetAll">
            Reset 0°
          </button>
        </div>
      </div>

      <!-- Page thumbnails grid -->
      <div class="page-rotate-grid" aria-label="PDF pages to rotate">
        <div
          v-for="page in pages"
          :key="page.number"
          class="page-rotate-card"
          :class="{ 'is-rotated': normalizeAngle(pageRotations[page.number]) !== 0 }"
        >
          <div class="card-image-wrap">
            <img
              :src="page.previewUrl"
              :alt="`Page ${page.number}`"
              :style="{ transform: `rotate(${pageRotations[page.number] || 0}deg)` }"
              loading="lazy"
            />
          </div>

          <div class="card-footer">
            <div class="page-info">
              <span class="page-num">Page {{ page.number }}</span>
              <span class="angle-badge" :class="{ active: normalizeAngle(pageRotations[page.number]) !== 0 }">
                {{ pageRotations[page.number] || 0 }}°
              </span>
            </div>

            <div class="page-rotate-actions">
              <button
                type="button"
                class="btn-rotate-single"
                title="Rotate page left 90°"
                :disabled="busy"
                @click="rotateSinglePage(page.number, -90)"
              >
                <RotateCcw :size="13" />
              </button>
              <button
                type="button"
                class="btn-rotate-single"
                title="Rotate page right 90°"
                :disabled="busy"
                @click="rotateSinglePage(page.number, 90)"
              >
                <RotateCw :size="13" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stage actions -->
      <div class="stage-actions" style="margin-top: 20px;">
        <button
          type="button"
          class="primary-button"
          :disabled="busy"
          style="min-width: 200px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); box-shadow: 0 4px 18px rgba(249, 115, 22, 0.4);"
          @click="executeRotate"
        >
          <LoaderCircle v-if="busy" class="spin" :size="18" />
          <RotateCw v-else :size="18" />
          {{ busy ? 'Saving Rotated PDF…' : 'Apply Rotation & Download' }}
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
        aria-label="Upload PDF to rotate"
        @click="input?.click()"
        @keydown.enter.space.prevent="input?.click()"
        @dragenter.prevent="dragEnter"
        @dragover.prevent="dragOver"
        @dragleave.prevent="dragLeave"
        @drop.prevent="drop"
      >
        <div class="drop-zone-icon" style="background: linear-gradient(135deg, #fb923c, #ea580c); color: #fff; width: 64px; height: 64px; border-radius: 18px; display: grid; place-items: center; margin: 0 auto 16px;">
          <RotateCw :size="32" />
        </div>
        <h3>{{ dragging ? 'Drop your PDF here' : 'Select PDF to rotate' }}</h3>
        <p>Fix sideways or upside-down pages individually or all at once.</p>
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
      Rotation modifies the PDF orientation losslessly without altering content or image resolution. Processed 100% locally in your browser.
    </p>
  </section>
</template>

