<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, CheckCheck, CircleAlert, Download, GripVertical, Images, LoaderCircle, LockKeyhole, RotateCw, Trash2, Upload, X } from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import { convertImagesToPdf, imagesPdfFilename, validateImages } from '~/utils/images-pdf.js';

const images = ref([]);
const result = ref(null);
const pageSize = ref('a4');
const fit = ref('contain');
const margin = ref('18');
const quality = ref('maximum');
const busy = ref(false);
const draggingFiles = ref(false);
const draggedId = ref(null);
const error = ref('');
const progress = ref('');
const input = ref(null);
const uploadButton = ref(null);
const resultHeading = ref(null);
const stage = computed(() => result.value ? 3 : images.value.length ? 2 : 1);
let nextId = 0;
let dropDepth = 0;
let request;
let active = true;

function revokeResult() {
  if (result.value?.url) URL.revokeObjectURL(result.value.url);
  result.value = null;
}

function revokeImages() {
  for (const image of images.value) URL.revokeObjectURL(image.url);
  images.value = [];
}

onBeforeUnmount(() => {
  active = false;
  request?.abort();
  revokeResult();
  revokeImages();
});

async function imageDimensions(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return { width: image.naturalWidth, height: image.naturalHeight };
}

async function addFiles(files) {
  if (busy.value || !files?.length) return;
  const chosen = Array.from(files);
  const existingBytes = images.value.reduce((sum, image) => sum + image.file.size, 0);
  const message = validateImages(chosen, images.value.length, existingBytes);
  error.value = message;
  revokeResult();
  if (message) return;
  const additions = [];
  try {
    for (const file of chosen) {
      const url = URL.createObjectURL(file);
      try {
        const dimensions = await imageDimensions(url);
        additions.push({ id: ++nextId, file, url, ...dimensions, rotation: 0 });
      } catch {
        URL.revokeObjectURL(url);
        throw new Error(`${file.name} could not be read as an image.`);
      }
    }
    images.value = [...images.value, ...additions];
  } catch (caught) {
    for (const image of additions) URL.revokeObjectURL(image.url);
    error.value = caught.message;
  }
}

function chooseFiles(event) {
  const files = Array.from(event.target.files || []);
  event.target.value = '';
  void addFiles(files);
}

function fileDragEnter() { if (!busy.value) { dropDepth++; draggingFiles.value = true; } }
function fileDragOver(event) { event.dataTransfer.dropEffect = busy.value ? 'none' : 'copy'; }
function fileDragLeave() { dropDepth = Math.max(0, dropDepth - 1); if (!dropDepth) draggingFiles.value = false; }
function fileDrop(event) { dropDepth = 0; draggingFiles.value = false; void addFiles(event.dataTransfer.files); }

function removeImage(id) {
  if (busy.value) return;
  const image = images.value.find(item => item.id === id);
  if (image) URL.revokeObjectURL(image.url);
  images.value = images.value.filter(item => item.id !== id);
  revokeResult();
}

function clearAll() {
  if (busy.value) return;
  revokeResult();
  revokeImages();
  error.value = '';
  if (input.value) input.value.value = '';
  void nextTick(() => uploadButton.value?.focus());
}

function rotateImage(id) {
  if (busy.value) return;
  images.value = images.value.map(image => image.id === id ? { ...image, rotation: (image.rotation + 90) % 360 } : image);
  revokeResult();
}

function moveImage(id, offset) {
  if (busy.value) return;
  const current = images.value.findIndex(image => image.id === id);
  const target = current + offset;
  if (current < 0 || target < 0 || target >= images.value.length) return;
  const reordered = [...images.value];
  const [moved] = reordered.splice(current, 1);
  reordered.splice(target, 0, moved);
  images.value = reordered;
  revokeResult();
}

function dropImage(targetId) {
  const sourceId = draggedId.value;
  draggedId.value = null;
  if (!sourceId || sourceId === targetId || busy.value) return;
  const from = images.value.findIndex(image => image.id === sourceId);
  const to = images.value.findIndex(image => image.id === targetId);
  if (from < 0 || to < 0) return;
  const reordered = [...images.value];
  const [moved] = reordered.splice(from, 1);
  reordered.splice(to, 0, moved);
  images.value = reordered;
  revokeResult();
}

async function convert() {
  if (!images.value.length || busy.value) return;
  busy.value = true;
  error.value = '';
  revokeResult();
  const controller = new AbortController();
  request = controller;
  try {
    const output = await convertImagesToPdf(images.value, {
      pageSize: pageSize.value,
      fit: fit.value,
      margin: Number(margin.value),
      quality: quality.value,
      signal: controller.signal,
      onProgress: value => { if (active) progress.value = value; },
    });
    if (active && !controller.signal.aborted) {
      result.value = {
        url: URL.createObjectURL(output.blob),
        filename: imagesPdfFilename(images.value[0].file.name),
        size: output.blob.size,
        pageCount: output.pageCount,
      };
      await nextTick();
      resultHeading.value?.focus();
    }
  } catch (caught) {
    if (active && caught.name !== 'AbortError') error.value = caught.message || 'The PDF could not be created. Try fewer or smaller images.';
  } finally {
    if (request === controller) request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}

function cancel() { request?.abort(); }
</script>

<template>
  <section id="converter" class="converter images-pdf-converter" :class="{ 'is-converting': busy, 'has-image-list': images.length }" aria-label="Images to PDF converter" :aria-busy="busy">
    <div class="converter-heading"><div><span class="mini-label">BUILD YOUR PDF IN ORDER</span><h2>Images <span aria-hidden="true">→</span> PDF</h2></div><span class="free-badge">Free to use</span></div>
    <ol class="step-track" aria-label="Conversion steps"><li v-for="(label, index) in ['Add images', 'Arrange', 'Download']" :key="label" :class="{ current: stage === index + 1, complete: stage > index + 1 }" :aria-current="stage === index + 1 ? 'step' : undefined"><span><Check v-if="stage > index + 1" :size="12" /><template v-else>{{ index + 1 }}</template></span>{{ label }}</li></ol>
    <input id="images-pdf-input" ref="input" class="visually-hidden" tabindex="-1" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple :disabled="busy" aria-label="Choose images" @change="chooseFiles" />

    <div v-if="result" class="result-state">
      <span class="success-icon"><CheckCheck :size="31" /><span class="success-ring" aria-hidden="true" /></span><span class="mini-label">PDF READY</span>
      <h3 ref="resultHeading" tabindex="-1">Your images are now one PDF.</h3><p>{{ result.pageCount }} {{ result.pageCount === 1 ? 'page' : 'pages' }} · High-quality PDF</p>
      <div class="selected-file"><FileBadge type="pdf" small /><div><strong>{{ result.filename }}</strong><span>{{ formatSize(result.size) }} · PDF document</span></div><span class="ready-dot" /></div>
      <a class="primary-button" :href="result.url" :download="result.filename"><Download :size="18" /> Download PDF</a>
      <button class="text-button" @click="revokeResult">Change order or settings <ArrowLeft :size="15" /></button>
      <button class="text-button" @click="clearAll">Create another PDF <ArrowRight :size="15" /></button>
    </div>

    <template v-else>
      <div v-if="!images.length" class="drop-zone" :class="{ dragging: draggingFiles }" @dragenter.prevent="fileDragEnter" @dragover.prevent="fileDragOver" @dragleave.prevent="fileDragLeave" @drop.prevent="fileDrop">
        <div class="images-upload-art" aria-hidden="true"><span><Images :size="31" /></span><span>PDF</span></div>
        <h3>{{ draggingFiles ? 'Drop your images here.' : 'Add images for your PDF' }}</h3><p>Upload several images, preview them, and arrange their page order.</p>
        <button ref="uploadButton" class="choose-button" aria-describedby="images-pdf-requirements" @click="input?.click()"><Upload :size="17" /> Choose images</button>
        <span id="images-pdf-requirements" class="file-requirements">JPG, PNG, WebP <span>·</span> Up to 50 images <span>·</span> 20 MB each</span>
      </div>

      <template v-else>
        <div class="image-list-heading"><div><strong>{{ images.length }} {{ images.length === 1 ? 'image' : 'images' }} added</strong><span>Drag cards or use the arrows to set the PDF page order.</span></div><div><button type="button" :disabled="busy" @click="input?.click()"><Upload :size="14" /> Add more</button><button type="button" :disabled="busy" @click="clearAll"><X :size="14" /> Clear all</button></div></div>
        <div class="image-preview-grid" aria-label="Images in PDF page order" @dragover.prevent>
          <article v-for="(image, index) in images" :key="image.id" class="image-preview-card" :class="{ dragging: draggedId === image.id }" draggable="true" @dragstart="draggedId = image.id" @dragend="draggedId = null" @drop.prevent="dropImage(image.id)">
            <div class="image-page-number">{{ index + 1 }}</div>
            <div class="image-preview-frame"><img :src="image.url" :alt="`PDF page ${index + 1}: ${image.file.name}`" :style="{ transform: `rotate(${image.rotation}deg)` }" /></div>
            <div class="image-preview-info"><GripVertical :size="15" aria-hidden="true" /><div><strong>{{ image.file.name }}</strong><span>{{ image.width }} × {{ image.height }} · {{ formatSize(image.file.size) }}</span></div></div>
            <div class="image-card-actions">
              <button type="button" :disabled="busy || index === 0" :aria-label="`Move page ${index + 1} earlier`" @click="moveImage(image.id, -1)"><ArrowUp :size="14" /><span>Earlier</span></button>
              <button type="button" :disabled="busy || index === images.length - 1" :aria-label="`Move page ${index + 1} later`" @click="moveImage(image.id, 1)"><ArrowDown :size="14" /><span>Later</span></button>
              <button type="button" :disabled="busy" :aria-label="`Rotate page ${index + 1}`" @click="rotateImage(image.id)"><RotateCw :size="14" /><span>Rotate</span></button>
              <button type="button" class="remove" :disabled="busy" :aria-label="`Remove page ${index + 1}`" @click="removeImage(image.id)"><Trash2 :size="14" /><span>Remove</span></button>
            </div>
          </article>
        </div>

        <fieldset class="images-pdf-options" :disabled="busy"><legend>PDF output settings</legend>
          <label>Page size<select v-model="pageSize"><option value="a4">A4 — recommended</option><option value="letter">US Letter</option><option value="image">Match each image</option></select></label>
          <label>Image placement<select v-model="fit"><option value="contain">Fit entire image</option><option value="fill">Fill page (may crop)</option></select></label>
          <label>Page margin<select v-model="margin"><option value="0">No margin</option><option value="18">Small margin</option><option value="36">Comfortable margin</option></select></label>
          <label>Image quality<select v-model="quality"><option value="maximum">Maximum quality</option><option value="balanced">Balanced size</option></select></label>
        </fieldset>
        <button class="primary-button convert-button" :disabled="busy" @click="convert"><LoaderCircle v-if="busy" class="spinning" :size="19" /><template v-if="busy">Creating your PDF…</template><template v-else>Create {{ images.length }}-page PDF <ArrowRight :size="18" /></template></button>
      </template>

      <template v-if="busy"><div class="progress-track" role="status"><span /><p>{{ progress }} Keep this page open.</p></div><button class="text-button cancel-conversion" @click="cancel">Cancel</button></template>
      <div v-if="error" class="error-message" role="alert"><CircleAlert :size="18" /><span>{{ error }}</span></div>
    </template>
    <p class="conversion-note">Maximum quality keeps up to 30 megapixels per image. Transparent areas use a clean white PDF background.</p>
    <div class="converter-assurance"><LockKeyhole :size="13" /><span>Processed on your device. No image uploads.</span></div>
  </section>
</template>
