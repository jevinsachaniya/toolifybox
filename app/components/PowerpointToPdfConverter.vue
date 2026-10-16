<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { Check, CheckSquare, CircleAlert, Download, FileText, LoaderCircle, LockKeyhole, Presentation, RotateCcw, ShieldCheck, Square, Upload, X } from '@lucide/vue';
import { formatSize, powerpointPdfFilename, validatePowerpoint } from '~/utils/document.js';
import { openPowerpointPresentation } from '~/utils/convert-powerpoint.js';

const file = shallowRef(null);
const slides = ref([]);
const selectedSlides = ref([]);
const dpi = ref('150');
const busy = ref(false);
const exported = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const resultPdf = ref(null);
const input = ref(null);
const uploadButton = ref(null);

const stage = computed(() => resultPdf.value ? 3 : slides.value.length ? 2 : 1);
const selectedCount = computed(() => selectedSlides.value.length);
const allSelected = computed(() => slides.value.length > 0 && selectedCount.value === slides.value.length);

let handle;
let request;
let dropDepth = 0;
let active = true;

function releaseSlidePreviews() {
  for (const s of slides.value) URL.revokeObjectURL(s.previewUrl);
  slides.value = [];
  selectedSlides.value = [];
}

function clearResult() {
  if (resultPdf.value?.url) URL.revokeObjectURL(resultPdf.value.url);
  resultPdf.value = null;
}

async function closePresentation() {
  const current = handle;
  handle = undefined;
  await current?.close();
}

onBeforeUnmount(() => {
  active = false;
  request?.abort();
  releaseSlidePreviews();
  clearResult();
  void closePresentation();
});

async function clear({ focus = true } = {}) {
  request?.abort();
  request = undefined;
  releaseSlidePreviews();
  clearResult();
  await closePresentation();
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
  const message = validatePowerpoint(chosen);
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

async function loadSlides() {
  if (!file.value || busy.value) return;
  busy.value = true;
  error.value = '';
  progress.value = 'Opening your presentation…';
  exported.value = false;
  clearResult();
  const controller = new AbortController();
  request = controller;
  const previews = [];
  try {
    handle = await openPowerpointPresentation(file.value, {
      signal: controller.signal,
      onProgress: value => { if (active) progress.value = value; },
    });
    for (let index = 0; index < handle.slideCount; index++) {
      progress.value = `Creating slide preview ${index + 1} of ${handle.slideCount}…`;
      const preview = await handle.renderSlidePreview(index, { maxDimension: 360, renderSignal: controller.signal });
      previews.push({
        index,
        number: index + 1,
        previewUrl: URL.createObjectURL(preview.blob),
        width: preview.width,
        height: preview.height,
      });
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (active && !controller.signal.aborted) {
      slides.value = previews;
      selectedSlides.value = previews.map(s => s.number);
    }
  } catch (caught) {
    for (const s of previews) URL.revokeObjectURL(s.previewUrl);
    await closePresentation();
    if (active && caught.name !== 'AbortError') error.value = caught.message || 'We couldn’t read this PowerPoint presentation. Please try another file.';
  } finally {
    if (request === controller) request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}

function toggleSlide(number) {
  if (busy.value) return;
  selectedSlides.value = selectedSlides.value.includes(number)
    ? selectedSlides.value.filter(n => n !== number)
    : [...selectedSlides.value, number].sort((a, b) => a - b);
}

function selectAll() {
  selectedSlides.value = slides.value.map(s => s.number);
}

function selectNone() {
  selectedSlides.value = [];
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
  if (!handle || busy.value || !selectedSlides.value.length) return;
  busy.value = true;
  error.value = '';
  clearResult();
  const controller = new AbortController();
  request = controller;
  try {
    progress.value = 'Converting slides to PDF…';
    const slideIndices = selectedSlides.value.map(n => n - 1);
    const pdfBlob = await handle.convertToPdf({
      dpi: Number(dpi.value),
      quality: 0.94,
      slides: slideIndices.length === slides.value.length ? null : slideIndices,
      onProgress: (done, total) => {
        if (active) progress.value = `Rendering slide ${done} of ${total} to PDF…`;
      },
    });
    const filename = powerpointPdfFilename(file.value.name);
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
    if (active && caught.name !== 'AbortError') error.value = caught.message || 'We couldn’t convert the presentation to PDF. Try lower resolution.';
  } finally {
    if (request === controller) request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}

function cancel() { request?.abort(); }
</script>

<template>
  <section id="converter" class="converter image-converter powerpoint-converter" :class="{ 'is-converting': busy, 'has-page-results': slides.length && !resultPdf }" aria-label="PowerPoint to PDF converter" :aria-busy="busy">
    <div class="converter-heading">
      <div><span class="mini-label">PRESENTATION TO PDF</span><h2>PowerPoint <span aria-hidden="true">→</span> PDF</h2></div>
      <span class="free-badge">Free to use</span>
    </div>
    <ol class="step-track" aria-label="Conversion steps">
      <li v-for="(label, index) in ['Upload', 'Review slides', 'Download']" :key="label" :class="{ current: stage === index + 1, complete: stage > index + 1 }" :aria-current="stage === index + 1 ? 'step' : undefined">
        <span><Check v-if="stage > index + 1" :size="12" /><template v-else>{{ index + 1 }}</template></span>{{ label }}
      </li>
    </ol>

    <input id="powerpoint-input" ref="input" class="visually-hidden" tabindex="-1" type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" :disabled="busy" aria-label="Choose a PowerPoint presentation" @change="chooseFile" />

    <!-- Result Stage (Stage 3) -->
    <template v-if="resultPdf">
      <div class="result-state">
        <div class="file-chosen-icon"><FileBadge type="pdf" /><span><Check :size="12" /></span></div>
        <h3>Your PDF presentation is ready!</h3>
        <p>The PowerPoint slides have been converted into a high-quality PDF document.</p>
        <div class="selected-file">
          <FileBadge type="pdf" small />
          <div><strong>{{ resultPdf.filename }}</strong><span>{{ formatSize(resultPdf.size) }} · PDF presentation</span></div>
        </div>
        <div class="result-actions" style="display: flex; gap: 10px; margin-top: 16px;">
          <a class="primary-button" :href="resultPdf.url" :download="resultPdf.filename"><Download :size="18" /> Download PDF again</a>
          <button class="text-button" @click="clear()"><RotateCcw :size="16" /> Convert another file</button>
        </div>
      </div>
    </template>

    <!-- Slide Selection Stage (Stage 2) -->
    <template v-else-if="slides.length">
      <div class="image-selection-summary">
        <div><strong>{{ selectedCount }} of {{ slides.length }} slides selected</strong><span>All selected slides will be assembled into your PDF presentation.</span></div>
        <button class="icon-button" :disabled="busy" aria-label="Choose another presentation" @click="clear()"><X :size="17" /></button>
      </div>

      <div class="image-selection-actions">
        <div class="selection-buttons" role="group" aria-label="Slide selection">
          <button type="button" :disabled="busy || allSelected" @click="selectAll"><CheckSquare :size="15" /> Select all</button>
          <button type="button" :disabled="busy || !selectedCount" @click="selectNone"><Square :size="15" /> Clear</button>
        </div>
        <span>{{ file.name }}</span>
      </div>

      <div class="pdf-page-grid" aria-label="PowerPoint slides">
        <article v-for="slide in slides" :key="slide.number" class="pdf-page-card" :class="{ selected: selectedSlides.includes(slide.number) }">
          <button type="button" class="page-select" :aria-pressed="selectedSlides.includes(slide.number)" :aria-label="`${selectedSlides.includes(slide.number) ? 'Deselect' : 'Select'} slide ${slide.number}`" :disabled="busy" @click="toggleSlide(slide.number)">
            <img :src="slide.previewUrl" :alt="`Preview of slide ${slide.number}`" />
            <span class="page-check"><Check v-if="selectedSlides.includes(slide.number)" :size="14" /></span>
          </button>
          <div class="page-card-footer"><strong>Slide {{ slide.number }}</strong><span style="font-size: 10px; color: #64748b;">Included</span></div>
        </article>
      </div>

      <div class="image-output-options" style="grid-template-columns: 1fr;">
        <label>PDF Quality &amp; Resolution<select v-model="dpi" :disabled="busy"><option value="150">High Quality — 150 DPI (recommended balance)</option><option value="300">Print Quality — 300 DPI (ultra-sharp)</option><option value="96">Screen Quality — 96 DPI (compact size)</option></select></label>
      </div>

      <button class="primary-button image-download-selected" :disabled="busy || !selectedCount" @click="convertToPdf">
        <LoaderCircle v-if="busy" class="spinning" :size="18" />
        <Presentation v-else :size="18" />
        {{ busy ? 'Converting to PDF…' : selectedCount > 0 ? `Convert ${selectedCount} slides to PDF` : 'Select at least one slide' }}
      </button>
    </template>

    <!-- Upload Stage (Stage 1) -->
    <template v-else>
      <div class="drop-zone" :class="{ dragging, 'has-file': file }" @dragenter.prevent="dragEnter" @dragover.prevent="dragOver" @dragleave.prevent="dragLeave" @drop.prevent="drop">
        <template v-if="file">
          <div class="file-chosen-icon"><FileBadge type="ppt" /><span><Check :size="12" /></span></div>
          <h3>Your presentation is ready.</h3><p>Open it to review slides and generate your PDF.</p>
          <div class="selected-file"><FileBadge type="ppt" small /><div><strong>{{ file.name }}</strong><span>{{ formatSize(file.size) }} · PowerPoint presentation</span></div><button class="icon-button" :disabled="busy" aria-label="Remove selected presentation" @click="clear()"><X :size="17" /></button></div>
          <button class="text-button" :disabled="busy" @click="input?.click()">Choose a different presentation</button>
        </template>
        <template v-else>
          <div class="document-pair ppt-pdf-pair" aria-hidden="true"><FileBadge type="ppt" /><span class="pair-arrow">→</span><FileBadge type="pdf" /></div>
          <h3>{{ dragging ? 'Drop it here.' : 'Drop your PowerPoint here' }}</h3>
          <p>Every slide will be rendered crisply into a shareable PDF document.</p>
          <button ref="uploadButton" class="choose-button" aria-describedby="powerpoint-requirements" @click="input?.click()"><Upload :size="17" /> Choose PowerPoint file</button>
          <span id="powerpoint-requirements" class="file-requirements">.PPTX only <span>·</span> Up to 20 MB <span>·</span> Up to 100 slides</span>
        </template>
      </div>
      <button v-if="file" class="primary-button convert-button" :disabled="busy" @click="loadSlides">
        <LoaderCircle v-if="busy" class="spinning" :size="19" />
        <template v-if="busy">Loading slides…</template><template v-else>Preview and convert to PDF</template>
      </button>
    </template>

    <template v-if="busy"><div class="progress-track" role="status"><span /><p>{{ progress }} Keep this page open.</p></div><button class="text-button cancel-conversion" @click="cancel">Cancel</button></template>
    <div v-if="error" class="error-message" role="alert"><CircleAlert :size="18" /><span>{{ error }}</span></div>
    <p class="conversion-note">PowerPoint presentations are converted directly in your browser. Slide geometry, formatting and colors are preserved.</p>
    <div class="converter-assurance"><LockKeyhole :size="13" /><span>Processed on your device. No document uploads.</span></div>
  </section>
</template>

