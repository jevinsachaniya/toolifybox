<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { Check, CheckSquare, CircleAlert, Download, FileImage, Images, LoaderCircle, LockKeyhole, Square, Upload, X } from '@lucide/vue';
import { formatSize, validatePdf } from '~/utils/document.js';
import { openPdfForImages, pdfImagesArchiveFilename, pdfPageImageFilename } from '~/utils/pdf-images.js';

const file = shallowRef(null);
const pages = ref([]);
const selectedPages = ref([]);
const format = ref('png');
const resolution = ref('2');
const busy = ref(false);
const exported = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const input = ref(null);
const uploadButton = ref(null);
const stage = computed(() => exported.value ? 3 : pages.value.length ? 2 : 1);
const selectedCount = computed(() => selectedPages.value.length);
const allSelected = computed(() => pages.value.length > 0 && selectedCount.value === pages.value.length);
let handle;
let request;
let dropDepth = 0;
let active = true;

function releasePreviews() {
  for (const page of pages.value) URL.revokeObjectURL(page.previewUrl);
  pages.value = [];
  selectedPages.value = [];
}

async function closePdf() {
  const current = handle;
  handle = undefined;
  await current?.close();
}

onBeforeUnmount(() => {
  active = false;
  request?.abort();
  releasePreviews();
  void closePdf();
});

async function clear({ focus = true } = {}) {
  request?.abort();
  request = undefined;
  releasePreviews();
  await closePdf();
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
  const message = validatePdf(chosen);
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

async function loadPages() {
  if (!file.value || busy.value) return;
  busy.value = true;
  error.value = '';
  progress.value = 'Opening your PDF…';
  exported.value = false;
  const controller = new AbortController();
  request = controller;
  const previews = [];
  try {
    handle = await openPdfForImages(file.value, {
      signal: controller.signal,
      onProgress: value => { if (active) progress.value = value; },
    });
    for (let number = 1; number <= handle.pageCount; number++) {
      progress.value = `Creating preview ${number} of ${handle.pageCount}…`;
      const preview = await handle.renderPage(number, { maxDimension: 360, format: 'jpg', quality: 0.82, renderSignal: controller.signal });
      previews.push({ number, previewUrl: URL.createObjectURL(preview.blob), width: preview.width, height: preview.height });
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (active && !controller.signal.aborted) {
      pages.value = previews;
      selectedPages.value = previews.map(page => page.number);
    }
  } catch (caught) {
    for (const page of previews) URL.revokeObjectURL(page.previewUrl);
    await closePdf();
    if (active && caught.name !== 'AbortError') error.value = caught.message || 'We couldn’t read this PDF. Please try another file.';
  } finally {
    if (request === controller) request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}

function togglePage(number) {
  if (busy.value) return;
  selectedPages.value = selectedPages.value.includes(number)
    ? selectedPages.value.filter(page => page !== number)
    : [...selectedPages.value, number].sort((a, b) => a - b);
  exported.value = false;
}

function selectAll() {
  selectedPages.value = pages.value.map(page => page.number);
  exported.value = false;
}

function selectNone() {
  selectedPages.value = [];
  exported.value = false;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

async function exportPages(numbers) {
  if (!handle || busy.value || !numbers.length) return;
  busy.value = true;
  error.value = '';
  exported.value = false;
  const controller = new AbortController();
  request = controller;
  try {
    let archive;
    if (numbers.length > 1) {
      const { default: JSZip } = await import('jszip');
      archive = new JSZip();
    }
    let single;
    for (let index = 0; index < numbers.length; index++) {
      const number = numbers[index];
      progress.value = `Rendering page ${number} (${index + 1} of ${numbers.length})…`;
      const image = await handle.renderPage(number, {
        scale: Number(resolution.value),
        format: format.value,
        quality: 0.92,
        renderSignal: controller.signal,
      });
      const filename = pdfPageImageFilename(file.value.name, number, handle.pageCount, format.value);
      if (archive) archive.file(filename, image.blob);
      else single = { blob: image.blob, filename };
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (archive) {
      progress.value = 'Packing selected images into a ZIP file…';
      const blob = await archive.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      downloadBlob(blob, pdfImagesArchiveFilename(file.value.name));
    } else {
      downloadBlob(single.blob, single.filename);
    }
    if (active) exported.value = true;
  } catch (caught) {
    if (active && caught.name !== 'AbortError') error.value = caught.message || 'We couldn’t create the selected images. Try a lower resolution.';
  } finally {
    if (request === controller) request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}

function cancel() { request?.abort(); }
</script>

<template>
  <section id="converter" class="converter image-converter" :class="{ 'is-converting': busy, 'has-page-results': pages.length }" aria-label="PDF to images converter" :aria-busy="busy">
    <div class="converter-heading">
      <div><span class="mini-label">SELECT THE PAGES YOU NEED</span><h2>PDF <span aria-hidden="true">→</span> Images</h2></div>
      <span class="free-badge">Free to use</span>
    </div>
    <ol class="step-track" aria-label="Conversion steps">
      <li v-for="(label, index) in ['Upload', 'Select pages', 'Download']" :key="label" :class="{ current: stage === index + 1, complete: stage > index + 1 }" :aria-current="stage === index + 1 ? 'step' : undefined">
        <span><Check v-if="stage > index + 1" :size="12" /><template v-else>{{ index + 1 }}</template></span>{{ label }}
      </li>
    </ol>

    <input id="pdf-images-input" ref="input" class="visually-hidden" tabindex="-1" type="file" accept=".pdf,application/pdf" :disabled="busy" aria-label="Choose a PDF document" @change="chooseFile" />

    <template v-if="pages.length">
      <div class="image-selection-summary">
        <div><strong>{{ selectedCount }} of {{ pages.length }} pages selected</strong><span>Each selected PDF page becomes one {{ format.toUpperCase() }} image.</span></div>
        <button class="icon-button" :disabled="busy" aria-label="Choose another PDF" @click="clear()"><X :size="17" /></button>
      </div>

      <div class="image-selection-actions">
        <div class="selection-buttons" role="group" aria-label="Page selection">
          <button type="button" :disabled="busy || allSelected" @click="selectAll"><CheckSquare :size="15" /> Select all</button>
          <button type="button" :disabled="busy || !selectedCount" @click="selectNone"><Square :size="15" /> Clear</button>
        </div>
        <span>{{ file.name }}</span>
      </div>

      <div class="pdf-page-grid" aria-label="PDF pages">
        <article v-for="page in pages" :key="page.number" class="pdf-page-card" :class="{ selected: selectedPages.includes(page.number) }">
          <button type="button" class="page-select" :aria-pressed="selectedPages.includes(page.number)" :aria-label="`${selectedPages.includes(page.number) ? 'Deselect' : 'Select'} page ${page.number}`" :disabled="busy" @click="togglePage(page.number)">
            <img :src="page.previewUrl" :alt="`Preview of PDF page ${page.number}`" />
            <span class="page-check"><Check v-if="selectedPages.includes(page.number)" :size="14" /></span>
          </button>
          <div class="page-card-footer"><strong>Page {{ page.number }}</strong><button type="button" :disabled="busy" :aria-label="`Download page ${page.number}`" @click="exportPages([page.number])"><Download :size="14" /> Download</button></div>
        </article>
      </div>

      <div class="image-output-options">
        <label>Image format<select v-model="format" :disabled="busy"><option value="png">PNG — sharp text</option><option value="jpg">JPG — smaller file</option></select></label>
        <label>Resolution<select v-model="resolution" :disabled="busy"><option value="1">Standard — 1×</option><option value="2">High — 2× (recommended)</option><option value="3">Ultra — 3×</option></select></label>
      </div>

      <button class="primary-button image-download-selected" :disabled="busy || !selectedCount" @click="exportPages(selectedPages)">
        <LoaderCircle v-if="busy" class="spinning" :size="18" />
        <Images v-else :size="18" />
        {{ busy ? 'Creating images…' : selectedCount > 1 ? `Download ${selectedCount} selected images (.zip)` : selectedCount === 1 ? 'Download selected image' : 'Select at least one page' }}
      </button>
    </template>

    <template v-else>
      <div class="drop-zone" :class="{ dragging, 'has-file': file }" @dragenter.prevent="dragEnter" @dragover.prevent="dragOver" @dragleave.prevent="dragLeave" @drop.prevent="drop">
        <template v-if="file">
          <div class="file-chosen-icon"><FileBadge type="pdf" /><span><Check :size="12" /></span></div>
          <h3>Your PDF is ready.</h3><p>Open it to preview and choose its pages.</p>
          <div class="selected-file"><FileBadge type="pdf" small /><div><strong>{{ file.name }}</strong><span>{{ formatSize(file.size) }} · PDF document</span></div><button class="icon-button" :disabled="busy" aria-label="Remove selected PDF" @click="clear()"><X :size="17" /></button></div>
          <button class="text-button" :disabled="busy" @click="input?.click()">Choose a different PDF</button>
        </template>
        <template v-else>
          <div class="document-pair pdf-image-pair" aria-hidden="true"><FileBadge type="pdf" /><span class="pair-arrow">→</span><span class="image-file-badge"><FileImage :size="29" /><b>IMG</b></span></div>
          <h3>{{ dragging ? 'Drop it here.' : 'Drop your PDF here' }}</h3>
          <p>Every PDF page will appear as a selectable image preview.</p>
          <button ref="uploadButton" class="choose-button" aria-describedby="pdf-images-requirements" @click="input?.click()"><Upload :size="17" /> Choose PDF file</button>
          <span id="pdf-images-requirements" class="file-requirements">.PDF only <span>·</span> Up to 20 MB <span>·</span> Up to 100 pages</span>
        </template>
      </div>
      <button v-if="file" class="primary-button convert-button" :disabled="busy" @click="loadPages">
        <LoaderCircle v-if="busy" class="spinning" :size="19" />
        <template v-if="busy">Preparing page previews…</template><template v-else>Preview and select pages</template>
      </button>
    </template>

    <template v-if="busy"><div class="progress-track" role="status"><span /><p>{{ progress }} Keep this page open.</p></div><button class="text-button cancel-conversion" @click="cancel">Cancel</button></template>
    <div v-if="error" class="error-message" role="alert"><CircleAlert :size="18" /><span>{{ error }}</span></div>
    <p class="conversion-note">One PDF page becomes one image. PNG keeps text crisp; JPG usually creates a smaller file.</p>
    <div class="converter-assurance"><LockKeyhole :size="13" /><span>Processed on your device. No document uploads.</span></div>
  </section>
</template>
