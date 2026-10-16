<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { Check, CircleAlert, Download, Gauge, Image, LoaderCircle, LockKeyhole, Minimize2, ShieldCheck, Sparkles, Target, Upload, X } from '@lucide/vue';
import { formatSize, validatePdf } from '~/utils/document.js';
import { openPdfForImages } from '~/utils/pdf-images.js';
import { COMPRESSION_PRESETS, compressedPdfFilename, compressPdfFile } from '~/utils/compress-pdf.js';

const file = shallowRef(null);
const pages = ref([]);
const preset = ref('exact');
const targetSize = ref('1');
const targetUnit = ref('MB');
const busy = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const result = ref(null);
const input = ref(null);
const uploadButton = ref(null);
const stage = computed(() => result.value ? 3 : pages.value.length ? 2 : 1);
const selectedPreset = computed(() => COMPRESSION_PRESETS[preset.value]);
const targetBytes = computed(() => {
  const value = Number(targetSize.value);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * (targetUnit.value === 'MB' ? 1024 * 1024 : 1024));
});
const targetError = computed(() => {
  if (preset.value !== 'target') return '';
  if (targetBytes.value < 50 * 1024) return 'Enter at least 50 KB.';
  if (targetBytes.value > 20 * 1024 * 1024) return 'Enter 20 MB or less.';
  return '';
});
let handle;
let request;
let dropDepth = 0;
let active = true;

function releaseResult() {
  if (result.value?.url) URL.revokeObjectURL(result.value.url);
  result.value = null;
}

function releasePreviews() {
  for (const page of pages.value) URL.revokeObjectURL(page.url);
  pages.value = [];
}

async function closePdf() {
  const current = handle;
  handle = undefined;
  await current?.close();
}

onBeforeUnmount(() => {
  active = false;
  request?.abort();
  releaseResult();
  releasePreviews();
  void closePdf();
});

async function clear({ focus = true } = {}) {
  request?.abort();
  request = undefined;
  releaseResult();
  releasePreviews();
  await closePdf();
  file.value = null;
  preset.value = 'exact';
  targetSize.value = '1';
  targetUnit.value = 'MB';
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

function dragEnter() { if (!busy.value) { dropDepth++; dragging.value = true; } }
function dragOver(event) { event.dataTransfer.dropEffect = busy.value ? 'none' : 'copy'; }
function dragLeave() { dropDepth = Math.max(0, dropDepth - 1); if (!dropDepth) dragging.value = false; }
function drop(event) { dropDepth = 0; dragging.value = false; void select(event.dataTransfer.files); }

async function loadPages() {
  if (!file.value || busy.value) return;
  busy.value = true;
  error.value = '';
  const controller = new AbortController();
  request = controller;
  const previews = [];
  try {
    handle = await openPdfForImages(file.value, { signal: controller.signal, onProgress: value => { if (active) progress.value = value; } });
    for (let number = 1; number <= handle.pageCount; number++) {
      progress.value = `Creating preview ${number} of ${handle.pageCount}...`;
      const image = await handle.renderPage(number, { maxDimension: 230, format: 'jpg', quality: 0.8, renderSignal: controller.signal });
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

function selectPreset(value) {
  if (busy.value) return;
  releaseResult();
  preset.value = value;
}

async function compress() {
  if (!file.value || !handle || busy.value) return;
  if (targetError.value) {
    error.value = targetError.value;
    return;
  }
  busy.value = true;
  error.value = '';
  releaseResult();
  const controller = new AbortController();
  request = controller;
  try {
    const output = await compressPdfFile(file.value, preset.value, {
      pageCount: pages.value.length,
      renderPage: handle.renderPage,
      targetBytes: preset.value === 'target' ? targetBytes.value : undefined,
      signal: controller.signal,
      onProgress: value => { if (active) progress.value = value; },
    });
    if (active && !controller.signal.aborted) result.value = { ...output, url: URL.createObjectURL(output.blob), filename: compressedPdfFilename(file.value.name), preset: preset.value };
  } catch (caught) {
    if (active && caught.name !== 'AbortError') error.value = /encrypt|password/i.test(caught.message)
      ? 'A password-protected PDF cannot be compressed. Save an unlocked copy and try again.'
      : caught.message || 'We could not compress this PDF. Try another file or quality setting.';
  } finally {
    if (request === controller) request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}

function cancel() { request?.abort(); }
</script>

<template>
  <section id="converter" class="converter compress-pdf-converter" :class="{ 'is-converting': busy, 'has-compress-pages': pages.length }" aria-label="Compress PDF converter" :aria-busy="busy">
    <div class="converter-heading"><div><span class="mini-label">CONTROL SIZE AND QUALITY</span><h2>Compress PDF</h2></div><span class="free-badge">Free to use</span></div>
    <ol class="step-track" aria-label="Compression steps"><li v-for="(label, index) in ['Upload', 'Choose quality', 'Download']" :key="label" :class="{ current: stage === index + 1, complete: stage > index + 1 }" :aria-current="stage === index + 1 ? 'step' : undefined"><span><Check v-if="stage > index + 1" :size="12" /><template v-else>{{ index + 1 }}</template></span>{{ label }}</li></ol>
    <input id="compress-pdf-input" ref="input" class="visually-hidden" tabindex="-1" type="file" accept=".pdf,application/pdf" :disabled="busy" aria-label="Choose a PDF to compress" @change="chooseFile" />

    <template v-if="pages.length">
      <div class="compress-summary"><div><strong>{{ file.name }}</strong><span>{{ pages.length }} {{ pages.length === 1 ? 'page' : 'pages' }} · {{ formatSize(file.size) }}</span></div><button type="button" class="icon-button" :disabled="busy" aria-label="Choose another PDF" @click="clear()"><X :size="17" /></button></div>
      <div class="compress-page-strip" aria-label="PDF page previews"><figure v-for="page in pages" :key="page.number"><img :src="page.url" :alt="`Preview of PDF page ${page.number}`" /><figcaption>Page {{ page.number }}</figcaption></figure></div>

      <fieldset class="compress-options"><legend>Choose compression quality</legend><button v-for="option in Object.values(COMPRESSION_PRESETS)" :key="option.id" type="button" :class="{ selected: preset === option.id }" :aria-pressed="preset === option.id" :disabled="busy" @click="selectPreset(option.id)"><span class="compress-option-icon"><ShieldCheck v-if="option.id === 'exact'" :size="19" /><Gauge v-else-if="option.id === 'balanced'" :size="19" /><Target v-else-if="option.id === 'target'" :size="19" /><Minimize2 v-else :size="19" /></span><span><strong>{{ option.label }}<b v-if="option.id === 'exact'">Recommended</b></strong><small>{{ option.description }}</small><em>{{ option.detail }}</em></span><span class="compress-radio"><Check v-if="preset === option.id" :size="12" /></span></button></fieldset>
      <div v-if="preset === 'target'" class="compress-target-size"><label for="compress-target-value"><span>Target file size</span><small>We will keep the highest quality that fits as closely as possible.</small></label><div><input id="compress-target-value" v-model="targetSize" type="number" min="0.05" step="0.05" inputmode="decimal" aria-describedby="compress-target-help" @input="releaseResult" /><select v-model="targetUnit" aria-label="Target size unit" @change="releaseResult"><option>KB</option><option>MB</option></select></div><p id="compress-target-help" :class="{ error: targetError }">{{ targetError || `Requested maximum: ${formatSize(targetBytes)}` }}</p></div>
      <div class="compress-mode-note" :class="{ flattened: !selectedPreset.preservesStructure }"><Sparkles v-if="selectedPreset.preservesStructure" :size="16" /><Target v-else-if="preset === 'target'" :size="16" /><Image v-else :size="16" /><p v-if="selectedPreset.preservesStructure"><b>Original document structure stays intact.</b> Text remains selectable and links and vectors are preserved.</p><p v-else-if="preset === 'target'"><b>Your requested size is a best-effort maximum.</b> The tool tests multiple levels and chooses the clearest result within the target when the document allows it.</p><p v-else><b>Visual layout and page dimensions stay the same.</b> Pages are rebuilt as clear compressed images, so text selection and links will not remain interactive.</p></div>

      <div v-if="result" class="compress-result" :class="{ 'target-missed': result.targetBytes && !result.metTarget }" role="status"><span><Check v-if="!result.targetBytes || result.metTarget" :size="18" /><Target v-else :size="18" /></span><div><strong>{{ result.targetBytes ? (result.metTarget ? 'Target size reached' : 'Closest available size created') : result.changed ? `PDF compressed by ${result.reduction}%` : 'This PDF is already well optimized' }}</strong><small>{{ formatSize(result.originalSize) }} <span>→</span> {{ formatSize(result.outputSize) }} · {{ result.pageCount }} {{ result.pageCount === 1 ? 'page' : 'pages' }}<template v-if="result.targetBytes"> · target {{ formatSize(result.targetBytes) }}</template></small><em v-if="result.targetBytes && !result.metTarget">This document cannot stay readable at the exact requested size. This is the smallest clear result available.</em><em v-else-if="!result.changed">We kept the smaller original-quality file instead of creating a larger result.</em></div><a :href="result.url" :download="result.filename"><Download :size="16" /> Download PDF</a></div>
      <button class="primary-button compress-pdf-button" :disabled="busy || Boolean(targetError)" @click="compress"><LoaderCircle v-if="busy" class="spinning" :size="18" /><Target v-else-if="preset === 'target'" :size="18" /><Minimize2 v-else :size="18" />{{ busy ? 'Compressing PDF...' : preset === 'target' ? `Compress toward ${targetSize || 0} ${targetUnit}` : 'Compress PDF' }}</button>
    </template>

    <template v-else>
      <div class="drop-zone compress-drop-zone" :class="{ dragging, 'has-file': file }" @dragenter.prevent="dragEnter" @dragover.prevent="dragOver" @dragleave.prevent="dragLeave" @drop.prevent="drop">
        <template v-if="file"><div class="file-chosen-icon"><FileBadge type="pdf" /><span><Check :size="12" /></span></div><h3>Your PDF is ready.</h3><p>Open it to preview the pages and choose the right compression quality.</p><div class="selected-file"><FileBadge type="pdf" small /><div><strong>{{ file.name }}</strong><span>{{ formatSize(file.size) }} · PDF document</span></div><button class="icon-button" :disabled="busy" aria-label="Remove selected PDF" @click="clear()"><X :size="17" /></button></div><button class="text-button" :disabled="busy" @click="input?.click()">Choose a different PDF</button></template>
        <template v-else><div class="compress-upload-art" aria-hidden="true"><FileBadge type="pdf" /><span><Minimize2 :size="25" /></span></div><h3>{{ dragging ? 'Drop your PDF here.' : 'Add a PDF to compress' }}</h3><p>Preview the document and choose how much quality or file size to preserve.</p><button ref="uploadButton" class="choose-button" aria-describedby="compress-pdf-requirements" @click="input?.click()"><Upload :size="17" /> Choose PDF file</button><span id="compress-pdf-requirements" class="file-requirements">.PDF only <span>·</span> Up to 20 MB <span>·</span> 1–100 pages</span></template>
      </div>
      <button v-if="file" class="primary-button convert-button" :disabled="busy" @click="loadPages"><LoaderCircle v-if="busy" class="spinning" :size="19" />{{ busy ? 'Preparing page previews...' : 'Preview PDF and choose quality' }}</button>
    </template>

    <template v-if="busy"><div class="progress-track" role="status"><span /><p>{{ progress }} Keep this page open.</p></div><button class="text-button cancel-conversion" @click="cancel">Cancel</button></template>
    <div v-if="error" class="error-message" role="alert"><CircleAlert :size="18" /><span>{{ error }}</span></div>
    <p class="conversion-note">The tool always keeps the smaller file. Exact quality is safest for documents that need selectable text or working links.</p>
    <div class="converter-assurance"><LockKeyhole :size="13" /><span>Processed on your device. No PDF uploads.</span></div>
  </section>
</template>
