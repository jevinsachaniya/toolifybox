<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { Check, CircleAlert, Download, Files, LoaderCircle, LockKeyhole, Scissors, Upload, X } from '@lucide/vue';
import { formatSize, validatePdf } from '~/utils/document.js';
import { openPdfForImages } from '~/utils/pdf-images.js';
import { buildSplitRanges, splitArchiveFilename, splitPdfFile } from '~/utils/split-pdf.js';

const file = shallowRef(null);
const pages = ref([]);
const splitAfter = ref([]);
const busy = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const results = ref([]);
const archiveUrl = ref('');
const input = ref(null);
const uploadButton = ref(null);
const stage = computed(() => results.value.length ? 3 : pages.value.length ? 2 : 1);
const ranges = computed(() => buildSplitRanges(pages.value.length, splitAfter.value));
let handle;
let request;
let dropDepth = 0;
let active = true;

function releaseResults() {
  for (const item of results.value) URL.revokeObjectURL(item.url);
  if (archiveUrl.value) URL.revokeObjectURL(archiveUrl.value);
  results.value = [];
  archiveUrl.value = '';
}

function releasePreviews() {
  for (const page of pages.value) URL.revokeObjectURL(page.url);
  pages.value = [];
  splitAfter.value = [];
}

async function closePdf() {
  const current = handle;
  handle = undefined;
  await current?.close();
}

onBeforeUnmount(() => {
  active = false;
  request?.abort();
  releaseResults();
  releasePreviews();
  void closePdf();
});

async function clear({ focus = true } = {}) {
  request?.abort();
  request = undefined;
  releaseResults();
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
  const controller = new AbortController();
  request = controller;
  const previews = [];
  try {
    handle = await openPdfForImages(file.value, {
      signal: controller.signal,
      onProgress: value => { if (active) progress.value = value; },
    });
    if (handle.pageCount < 2) throw new Error('Choose a PDF with at least two pages to split.');
    for (let number = 1; number <= handle.pageCount; number++) {
      progress.value = `Creating preview ${number} of ${handle.pageCount}...`;
      const image = await handle.renderPage(number, { maxDimension: 280, format: 'jpg', quality: 0.8, renderSignal: controller.signal });
      previews.push({ number, url: URL.createObjectURL(image.blob) });
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (active && !controller.signal.aborted) pages.value = previews;
  } catch (caught) {
    for (const page of previews) URL.revokeObjectURL(page.url);
    await closePdf();
    if (active && caught.name !== 'AbortError') error.value = caught.message || 'We could not preview this PDF. Try another file.';
  } finally {
    if (request === controller) request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}

function toggleSplit(number) {
  if (busy.value || number >= pages.value.length) return;
  releaseResults();
  splitAfter.value = splitAfter.value.includes(number)
    ? splitAfter.value.filter(point => point !== number)
    : [...splitAfter.value, number].sort((a, b) => a - b);
}

async function createParts() {
  if (!file.value || busy.value) return;
  if (!splitAfter.value.length) {
    error.value = 'Choose at least one split point between the PDF pages.';
    return;
  }
  busy.value = true;
  error.value = '';
  releaseResults();
  const controller = new AbortController();
  request = controller;
  try {
    const outputs = await splitPdfFile(file.value, splitAfter.value, {
      signal: controller.signal,
      onProgress: value => { if (active) progress.value = value; },
    });
    progress.value = 'Packing all PDF parts into a ZIP file...';
    const { default: JSZip } = await import('jszip');
    const archive = new JSZip();
    for (const output of outputs) archive.file(output.filename, output.blob);
    const archiveBlob = await archive.generateAsync({ type: 'blob', compression: 'STORE' });
    if (active && !controller.signal.aborted) {
      results.value = outputs.map(output => ({ ...output, url: URL.createObjectURL(output.blob) }));
      archiveUrl.value = URL.createObjectURL(archiveBlob);
    }
  } catch (caught) {
    if (active && caught.name !== 'AbortError') {
      error.value = /encrypt|password/i.test(caught.message)
        ? 'A password-protected PDF cannot be split. Save an unlocked copy and try again.'
        : caught.message || 'We could not split this PDF. Try another file.';
    }
  } finally {
    if (request === controller) request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}

function cancel() { request?.abort(); }
</script>

<template>
  <section id="converter" class="converter split-pdf-converter" :class="{ 'is-converting': busy, 'has-split-pages': pages.length }" aria-label="Split PDF converter" :aria-busy="busy">
    <div class="converter-heading"><div><span class="mini-label">CHOOSE EXACT SPLIT POINTS</span><h2>Split PDF by Pages</h2></div><span class="free-badge">Free to use</span></div>
    <ol class="step-track" aria-label="Split steps"><li v-for="(label, index) in ['Upload', 'Set splits', 'Download']" :key="label" :class="{ current: stage === index + 1, complete: stage > index + 1 }" :aria-current="stage === index + 1 ? 'step' : undefined"><span><Check v-if="stage > index + 1" :size="12" /><template v-else>{{ index + 1 }}</template></span>{{ label }}</li></ol>
    <input id="split-pdf-input" ref="input" class="visually-hidden" tabindex="-1" type="file" accept=".pdf,application/pdf" :disabled="busy" aria-label="Choose a PDF to split" @change="chooseFile" />

    <template v-if="pages.length">
      <div class="split-summary">
        <div><strong>{{ pages.length }} pages · {{ ranges.length }} {{ ranges.length === 1 ? 'output part' : 'output parts' }}</strong><span>{{ splitAfter.length ? `Split after ${splitAfter.map(page => `page ${page}`).join(', ')}` : 'Tap a split button between pages to create parts.' }}</span></div>
        <button type="button" class="icon-button" :disabled="busy" aria-label="Choose another PDF" @click="clear()"><X :size="17" /></button>
      </div>

      <div class="split-range-list" aria-live="polite"><span v-for="(range, index) in ranges" :key="`${range.start}-${range.end}`"><b>Part {{ index + 1 }}</b> Pages {{ range.start }}–{{ range.end }}</span></div>

      <div class="split-help"><span><Scissors :size="17" /></span><div><strong>Choose a split point</strong><small>Use the purple button below any page. A new PDF will start from the next page.</small></div></div>

      <div class="split-page-grid" aria-label="PDF pages and split points">
        <div v-for="page in pages" :key="page.number" class="split-page-unit">
          <article class="split-page-card" :class="{ 'split-selected': splitAfter.includes(page.number) }"><div class="split-page-preview"><img :src="page.url" :alt="`Preview of PDF page ${page.number}`" /><span>Page {{ page.number }}</span></div></article>
          <button v-if="page.number < pages.length" type="button" class="split-point-button" :disabled="busy" :aria-pressed="splitAfter.includes(page.number)" :aria-label="`${splitAfter.includes(page.number) ? 'Remove split after' : 'Split after'} page ${page.number}`" @click="toggleSplit(page.number)"><Scissors :size="15" /><span>{{ splitAfter.includes(page.number) ? `Split added after page ${page.number}` : `Split after page ${page.number}` }}</span><Check v-if="splitAfter.includes(page.number)" :size="15" /></button>
          <span v-else class="split-last-page"><Check :size="13" /> End of PDF</span>
        </div>
      </div>

      <div v-if="results.length" class="split-results" role="status">
        <div class="split-results-heading"><span><Check :size="17" /></span><div><strong>{{ results.length }} PDF parts are ready</strong><small>Download one part or get every part in a ZIP.</small></div><a :href="archiveUrl" :download="splitArchiveFilename(file.name)"><Download :size="15" /> Download all (.zip)</a></div>
        <div class="split-result-list"><a v-for="(result, index) in results" :key="result.filename" :href="result.url" :download="result.filename"><span>Part {{ index + 1 }}</span><div><strong>Pages {{ result.range.start }}–{{ result.range.end }}</strong><small>{{ result.range.pageCount }} {{ result.range.pageCount === 1 ? 'page' : 'pages' }} · {{ formatSize(result.blob.size) }}</small></div><Download :size="15" /></a></div>
      </div>

      <button class="primary-button split-pdf-button" :disabled="busy || !splitAfter.length" @click="createParts"><LoaderCircle v-if="busy" class="spinning" :size="18" /><Scissors v-else :size="18" />{{ busy ? 'Creating PDF parts...' : splitAfter.length ? `Create ${ranges.length} PDF parts` : 'Choose where to split' }}</button>
    </template>

    <template v-else>
      <div class="drop-zone split-drop-zone" :class="{ dragging, 'has-file': file }" @dragenter.prevent="dragEnter" @dragover.prevent="dragOver" @dragleave.prevent="dragLeave" @drop.prevent="drop">
        <template v-if="file"><div class="file-chosen-icon"><FileBadge type="pdf" /><span><Check :size="12" /></span></div><h3>Your PDF is ready.</h3><p>Open it to preview every page and choose the split points.</p><div class="selected-file"><FileBadge type="pdf" small /><div><strong>{{ file.name }}</strong><span>{{ formatSize(file.size) }} · PDF document</span></div><button class="icon-button" :disabled="busy" aria-label="Remove selected PDF" @click="clear()"><X :size="17" /></button></div><button class="text-button" :disabled="busy" @click="input?.click()">Choose a different PDF</button></template>
        <template v-else><div class="split-upload-art" aria-hidden="true"><FileBadge type="pdf" /><span><Scissors :size="25" /></span><Files :size="30" /></div><h3>{{ dragging ? 'Drop your PDF here.' : 'Add a PDF to split' }}</h3><p>Preview every page, then mark exactly where each new PDF should begin.</p><button ref="uploadButton" class="choose-button" aria-describedby="split-pdf-requirements" @click="input?.click()"><Upload :size="17" /> Choose PDF file</button><span id="split-pdf-requirements" class="file-requirements">.PDF only <span>·</span> Up to 20 MB <span>·</span> 2–100 pages</span></template>
      </div>
      <button v-if="file" class="primary-button convert-button" :disabled="busy" @click="loadPages"><LoaderCircle v-if="busy" class="spinning" :size="19" />{{ busy ? 'Preparing page previews...' : 'Preview pages and choose splits' }}</button>
    </template>

    <template v-if="busy"><div class="progress-track" role="status"><span /><p>{{ progress }} Keep this page open.</p></div><button class="text-button cancel-conversion" @click="cancel">Cancel</button></template>
    <div v-if="error" class="error-message" role="alert"><CircleAlert :size="18" /><span>{{ error }}</span></div>
    <p class="conversion-note">Each output keeps the original PDF page quality, dimensions, selectable text, links and vector content.</p>
    <div class="converter-assurance"><LockKeyhole :size="13" /><span>Processed on your device. No PDF uploads.</span></div>
  </section>
</template>
