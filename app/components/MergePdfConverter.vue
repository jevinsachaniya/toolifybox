<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { ArrowDown, ArrowUp, Check, CircleAlert, Combine, Download, FilePlus2, Files, GripVertical, LoaderCircle, LockKeyhole, Trash2, Upload, X } from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import { MAX_MERGE_PAGES, mergePdfFiles, mergedPdfFilename, validateMergeFiles } from '~/utils/merge-pdf.js';
import { openPdfForImages } from '~/utils/pdf-images.js';

const documents = ref([]);
const busy = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const result = ref(null);
const input = ref(null);
const uploadButton = ref(null);
const stage = computed(() => result.value ? 3 : documents.value.length ? 2 : 1);
const totalPages = computed(() => documents.value.reduce((sum, item) => sum + item.pageCount, 0));
const totalSize = computed(() => documents.value.reduce((sum, item) => sum + item.file.size, 0));
let request;
let dropDepth = 0;
let nextId = 0;
let active = true;

function clearResult() {
  if (result.value?.url) URL.revokeObjectURL(result.value.url);
  result.value = null;
}

function releaseItem(item) {
  for (const page of item.previews) URL.revokeObjectURL(page.url);
  void item.handle.close();
}

onBeforeUnmount(() => {
  active = false;
  request?.abort();
  clearResult();
  for (const item of documents.value) releaseItem(item);
});

async function addFiles(files) {
  if (busy.value || !files?.length) return;
  error.value = validateMergeFiles(files, documents.value.map(item => item.file));
  if (error.value) return;
  clearResult();
  busy.value = true;
  const controller = new AbortController();
  request = controller;
  const added = [];
  try {
    for (const file of Array.from(files)) {
      progress.value = `Opening ${file.name}...`;
      const handle = await openPdfForImages(file, { signal: controller.signal });
      const previews = [];
      const projectedPages = totalPages.value + added.reduce((sum, item) => sum + item.pageCount, 0) + handle.pageCount;
      if (projectedPages > MAX_MERGE_PAGES) {
        await handle.close();
        throw new Error(`Choose PDFs with no more than ${MAX_MERGE_PAGES} pages in total.`);
      }
      try {
        for (let number = 1; number <= handle.pageCount; number++) {
          progress.value = `Previewing ${file.name}: page ${number} of ${handle.pageCount}...`;
          const image = await handle.renderPage(number, { maxDimension: 230, format: 'jpg', quality: 0.78, renderSignal: controller.signal });
          previews.push({ number, url: URL.createObjectURL(image.blob) });
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      } catch (caught) {
        for (const page of previews) URL.revokeObjectURL(page.url);
        await handle.close();
        throw caught;
      }
      added.push({ id: ++nextId, file, handle, pageCount: handle.pageCount, previews });
    }
    if (active && !controller.signal.aborted) documents.value = [...documents.value, ...added];
  } catch (caught) {
    for (const item of added) releaseItem(item);
    if (active && caught.name !== 'AbortError') error.value = caught.message || 'We could not preview these PDFs. Try another file.';
  } finally {
    if (request === controller) request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}

function chooseFiles(event) {
  void addFiles(event.target.files);
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
  void addFiles(event.dataTransfer.files);
}

function removeDocument(index) {
  if (busy.value) return;
  clearResult();
  const [removed] = documents.value.splice(index, 1);
  if (removed) releaseItem(removed);
}

function moveDocument(index, offset) {
  const target = index + offset;
  if (busy.value || target < 0 || target >= documents.value.length) return;
  clearResult();
  const ordered = [...documents.value];
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  documents.value = ordered;
}

async function clearAll() {
  request?.abort();
  request = undefined;
  clearResult();
  const current = documents.value;
  documents.value = [];
  for (const item of current) releaseItem(item);
  busy.value = false;
  error.value = '';
  progress.value = '';
  if (input.value) input.value.value = '';
  await Promise.resolve();
  if (active) uploadButton.value?.focus();
}

async function merge() {
  if (busy.value) return;
  if (documents.value.length < 2) {
    error.value = 'Add at least two PDF files before merging.';
    return;
  }
  busy.value = true;
  error.value = '';
  clearResult();
  const controller = new AbortController();
  request = controller;
  try {
    const files = documents.value.map(item => item.file);
    const merged = await mergePdfFiles(files, {
      signal: controller.signal,
      onProgress: value => { if (active) progress.value = value; },
    });
    if (active && !controller.signal.aborted) {
      result.value = {
        url: URL.createObjectURL(merged.blob),
        filename: mergedPdfFilename(files),
        size: merged.blob.size,
        pageCount: merged.pageCount,
      };
    }
  } catch (caught) {
    if (active && caught.name !== 'AbortError') {
      error.value = /encrypt|password/i.test(caught.message)
        ? 'A password-protected PDF cannot be merged. Save an unlocked copy and try again.'
        : caught.message || 'We could not merge these PDFs. Try another file.';
    }
  } finally {
    if (request === controller) request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}

function cancel() { request?.abort(); }
</script>

<template>
  <section id="converter" class="converter merge-pdf-converter" :class="{ 'is-converting': busy, 'has-merge-files': documents.length }" aria-label="Merge PDF converter" :aria-busy="busy">
    <div class="converter-heading">
      <div><span class="mini-label">PREVIEW, ARRANGE, MERGE</span><h2>Merge PDF Files</h2></div>
      <span class="free-badge">Free to use</span>
    </div>

    <ol class="step-track" aria-label="Merge steps">
      <li v-for="(label, index) in ['Add PDFs', 'Arrange', 'Download']" :key="label" :class="{ current: stage === index + 1, complete: stage > index + 1 }" :aria-current="stage === index + 1 ? 'step' : undefined">
        <span><Check v-if="stage > index + 1" :size="12" /><template v-else>{{ index + 1 }}</template></span>{{ label }}
      </li>
    </ol>

    <input id="merge-pdf-input" ref="input" class="visually-hidden" tabindex="-1" type="file" accept=".pdf,application/pdf" multiple :disabled="busy" aria-label="Choose PDF files to merge" @change="chooseFiles" />

    <template v-if="documents.length">
      <div class="merge-list-heading">
        <div><strong>{{ documents.length }} PDFs · {{ totalPages }} pages</strong><span>{{ formatSize(totalSize) }} total · merged in the order shown</span></div>
        <div><button type="button" :disabled="busy || documents.length >= 10" @click="input?.click()"><FilePlus2 :size="14" /> Add PDFs</button><button type="button" :disabled="busy" aria-label="Remove all PDFs" @click="clearAll"><X :size="15" /></button></div>
      </div>

      <div class="merge-document-list" aria-label="PDF merge order">
        <article v-for="(document, index) in documents" :key="document.id" class="merge-document-card">
          <div class="merge-document-head">
            <span class="merge-order">{{ index + 1 }}</span>
            <GripVertical :size="17" aria-hidden="true" />
            <div><strong>{{ document.file.name }}</strong><span>{{ document.pageCount }} {{ document.pageCount === 1 ? 'page' : 'pages' }} · {{ formatSize(document.file.size) }}</span></div>
            <div class="merge-order-actions">
              <button type="button" :disabled="busy || index === 0" :aria-label="`Move ${document.file.name} earlier`" @click="moveDocument(index, -1)"><ArrowUp :size="15" /></button>
              <button type="button" :disabled="busy || index === documents.length - 1" :aria-label="`Move ${document.file.name} later`" @click="moveDocument(index, 1)"><ArrowDown :size="15" /></button>
              <button type="button" class="remove" :disabled="busy" :aria-label="`Remove ${document.file.name}`" @click="removeDocument(index)"><Trash2 :size="15" /></button>
            </div>
          </div>
          <div class="merge-page-strip" :aria-label="`Pages in ${document.file.name}`">
            <figure v-for="page in document.previews" :key="page.number"><img :src="page.url" :alt="`Page ${page.number} of ${document.file.name}`" /><figcaption>Page {{ page.number }}</figcaption></figure>
          </div>
        </article>
      </div>

      <div v-if="result" class="merge-result" role="status">
        <span><Check :size="18" /></span>
        <div><strong>Your merged PDF is ready</strong><small>{{ result.pageCount }} pages · {{ formatSize(result.size) }}</small></div>
        <a :href="result.url" :download="result.filename"><Download :size="16" /> Download PDF</a>
      </div>

      <button class="primary-button merge-pdf-button" :disabled="busy || documents.length < 2" @click="merge">
        <LoaderCircle v-if="busy" class="spinning" :size="18" /><Combine v-else :size="18" />
        {{ busy ? 'Merging PDFs...' : documents.length < 2 ? 'Add one more PDF' : `Merge ${documents.length} PDFs` }}
      </button>
    </template>

    <div v-else class="drop-zone merge-drop-zone" :class="{ dragging }" @dragenter.prevent="dragEnter" @dragover.prevent="dragOver" @dragleave.prevent="dragLeave" @drop.prevent="drop">
      <div class="merge-upload-art" aria-hidden="true"><FileBadge type="pdf" /><span><Combine :size="24" /></span><FileBadge type="pdf" /></div>
      <h3>{{ dragging ? 'Drop your PDFs here.' : 'Add PDFs to merge' }}</h3>
      <p>Choose two or more PDFs. Every page will be previewed before merging.</p>
      <button ref="uploadButton" class="choose-button" aria-describedby="merge-pdf-requirements" @click="input?.click()"><Upload :size="17" /> Choose PDF files</button>
      <span id="merge-pdf-requirements" class="file-requirements">2–10 PDFs <span>·</span> 20 MB each <span>·</span> {{ MAX_MERGE_PAGES }} pages total</span>
    </div>

    <template v-if="busy"><div class="progress-track" role="status"><span /><p>{{ progress }} Keep this page open.</p></div><button class="text-button cancel-conversion" @click="cancel">Cancel</button></template>
    <div v-if="error" class="error-message" role="alert"><CircleAlert :size="18" /><span>{{ error }}</span></div>
    <p class="conversion-note">Pages keep their original quality, dimensions, selectable text, links and vector content.</p>
    <div class="converter-assurance"><LockKeyhole :size="13" /><span>Processed on your device. No PDF uploads.</span></div>
  </section>
</template>
