<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { 
  Check, CheckCheck, CircleAlert, Download, FileCheck, FileText, Layers, 
  LoaderCircle, RotateCcw, ShieldCheck, Upload, X 
} from '@lucide/vue';
import { flattenedPdfFilename, formatSize, validatePdf } from '~/utils/document.js';
import { flattenPdf } from '~/utils/flatten-pdf.js';

const file = shallowRef(null);
const flattenMode = ref('form'); // 'form' or 'raster'
const busy = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const resultPdf = ref(null);
const input = ref(null);
const uploadButton = ref(null);

const stage = computed(() => (resultPdf.value ? 3 : file.value ? 2 : 1));

let request;
let dropDepth = 0;
let active = true;

function clearResult() {
  if (resultPdf.value?.url) URL.revokeObjectURL(resultPdf.value.url);
  resultPdf.value = null;
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
  flattenMode.value = 'form';
  if (input.value) input.value.value = '';
  if (focus && active) uploadButton.value?.focus();
}

function select(files) {
  if (busy.value || !files?.length) return;
  const chosen = Array.from(files);
  const message = validatePdf(chosen);
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

function downloadFile(url, filename) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

async function executeFlatten() {
  if (!file.value || busy.value) return;
  busy.value = true;
  error.value = '';
  progress.value = 'Preparing PDF flattening…';

  const controller = new AbortController();
  request = controller;

  try {
    const result = await flattenPdf(file.value, {
      mode: flattenMode.value,
      signal: controller.signal,
      onProgress: msg => { if (active) progress.value = msg; },
    });

    if (active) {
      const url = URL.createObjectURL(result.blob);
      const filename = flattenedPdfFilename(file.value.name);
      resultPdf.value = {
        url,
        filename,
        size: result.blob.size,
        pageCount: result.pageCount,
        fieldCount: result.fieldCount,
        mode: result.mode,
      };
      downloadFile(url, filename);
    }
  } catch (caught) {
    if (active && caught.name !== 'AbortError') {
      error.value = caught.message || 'We could not flatten this PDF. Please verify the document and try again.';
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
    class="converter flatten-pdf-converter"
    :class="{ 'is-converting': busy, 'has-file': file }"
    aria-label="Flatten PDF converter"
    :aria-busy="busy"
  >
    <div class="converter-heading">
      <div>
        <span class="mini-label">PDF STANDARDIZATION</span>
        <h2>Flatten PDF</h2>
      </div>
      <span class="free-badge">100% Private</span>
    </div>

    <ol class="step-track" aria-label="Flatten steps">
      <li
        v-for="(label, index) in ['Select PDF', 'Choose mode', 'Download PDF']"
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
      id="flatten-pdf-input"
      ref="input"
      class="visually-hidden"
      tabindex="-1"
      type="file"
      accept=".pdf,application/pdf"
      :disabled="busy"
      aria-label="Choose a PDF file to flatten"
      @change="chooseFile"
    />

    <!-- Stage 3: Result / Download -->
    <template v-if="resultPdf">
      <div class="result-state">
        <div class="file-chosen-icon" style="background: linear-gradient(135deg, #475569, #1e293b); color: #34d399; width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; margin: 0 auto 16px;">
          <CheckCheck :size="30" />
        </div>
        <h3>PDF Flattened Successfully!</h3>
        <p>
          {{ resultPdf.mode === 'form' 
            ? (resultPdf.fieldCount > 0 ? `Locked ${resultPdf.fieldCount} interactive form field${resultPdf.fieldCount > 1 ? 's' : ''} into fixed page content.` : 'Document forms and annotations locked into permanent page graphics.')
            : 'All pages and annotations rasterized into crisp, flat PDF pages.' }}
          All {{ resultPdf.pageCount }} pages preserved.
        </p>

        <div class="selected-file" style="margin: 20px 0;">
          <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
            <div style="color: #475569; background: #f1f5f9; padding: 10px; border-radius: 10px; display: grid; place-items: center;">
              <FileCheck :size="20" />
            </div>
            <div style="flex: 1; min-width: 0;">
              <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ resultPdf.filename }}</strong>
              <span style="font-size: 12px; color: #64748b;">
                {{ formatSize(resultPdf.size) }} · {{ resultPdf.pageCount }} pages · {{ resultPdf.mode === 'form' ? 'Vector Preserved' : 'Full Flattened' }}
              </span>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <a class="primary-button" :href="resultPdf.url" :download="resultPdf.filename" style="background: linear-gradient(135deg, #475569 0%, #1e293b 100%);">
            <Download :size="18" /> Download Flattened PDF again
          </a>
          <button class="text-button" @click="clear()">
            <RotateCcw :size="16" /> Flatten another PDF
          </button>
        </div>
      </div>
    </template>

    <!-- Stage 2: Options & Execution -->
    <template v-else-if="file">
      <div class="file-card" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: #f1f5f9; color: #334155; display: grid; place-items: center; flex-shrink: 0;">
            <FileText :size="20" />
          </div>
          <div style="min-width: 0;">
            <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px;">{{ file.name }}</strong>
            <span style="font-size: 12px; color: #64748b;">{{ formatSize(file.size) }}</span>
          </div>
        </div>
        <button class="icon-button" :disabled="busy" aria-label="Choose another PDF" @click="clear()">
          <X :size="18" />
        </button>
      </div>

      <!-- Flattening mode selector -->
      <div class="flatten-mode-selector" style="margin-bottom: 24px;">
        <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 10px;">
          Choose Flattening Mode:
        </label>
        
        <div class="mode-options-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
          <!-- Mode 1: Form Fields (Vector) -->
          <button
            type="button"
            class="mode-card-btn"
            :class="{ active: flattenMode === 'form' }"
            :disabled="busy"
            @click="flattenMode = 'form'"
          >
            <div class="mode-card-header">
              <span class="mode-icon"><FileCheck :size="18" /></span>
              <strong>Lock Form Fields</strong>
            </div>
            <p>Converts form fields and digital inputs into permanent page text without compromising crisp vector quality or font sharpness.</p>
            <span class="mode-tag">Recommended · Fast</span>
          </button>

          <!-- Mode 2: Full Raster Visual -->
          <button
            type="button"
            class="mode-card-btn"
            :class="{ active: flattenMode === 'raster' }"
            :disabled="busy"
            @click="flattenMode = 'raster'"
          >
            <div class="mode-card-header">
              <span class="mode-icon"><Layers :size="18" /></span>
              <strong>Full Visual Flatten</strong>
            </div>
            <p>Renders all pages and visual annotations to flat imagery. Eliminates all hidden layers, scripts, and form fields for legal/print compliance.</p>
            <span class="mode-tag">100% Non-interactive</span>
          </button>
        </div>
      </div>

      <div class="stage-actions">
        <button
          type="button"
          class="primary-button"
          :disabled="busy"
          style="min-width: 200px; background: linear-gradient(135deg, #475569 0%, #1e293b 100%); box-shadow: 0 4px 18px rgba(30, 41, 59, 0.35);"
          @click="executeFlatten"
        >
          <LoaderCircle v-if="busy" class="spin" :size="18" />
          <FileCheck v-else :size="18" />
          {{ busy ? (progress || 'Flattening PDF…') : 'Flatten & Download PDF' }}
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
        aria-label="Upload PDF to flatten"
        @click="input?.click()"
        @keydown.enter.space.prevent="input?.click()"
        @dragenter.prevent="dragEnter"
        @dragover.prevent="dragOver"
        @dragleave.prevent="dragLeave"
        @drop.prevent="drop"
      >
        <div class="drop-zone-icon" style="background: linear-gradient(135deg, #475569, #1e293b); color: #fff;">
          <FileCheck :size="32" />
        </div>
        <h3>{{ dragging ? 'Drop your PDF here' : 'Drop your fillable PDF here' }}</h3>
        <p>Lock interactive form fields or permanently flatten all layers</p>
        <button ref="uploadButton" class="choose-button" type="button" @click.stop="input?.click()">
          <Upload :size="17" /> Choose PDF file
        </button>
        <span class="file-requirements">.PDF only · Up to 50 MB · 100% Client-Side</span>
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

