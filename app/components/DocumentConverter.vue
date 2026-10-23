<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { ArrowRight, Check, CheckCheck, CircleAlert, Download, LoaderCircle, LockKeyhole, Upload, X } from '@lucide/vue';
import { validateDocument, validatePdf, formatSize, pdfFilename, wordFilename } from '~/utils/document.js';
import { convertDocument } from '~/utils/convert-document.js';
import { convertPdf } from '~/utils/convert-pdf.js';

const props = defineProps({
  modelValue: { type: String, default: 'word-pdf' },
  fixedDirection: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

const direction = ref(props.fixedDirection || props.modelValue || 'word-pdf');
const wordMode = ref('editable');
const ocrLanguage = ref('auto');

const OCR_LANGUAGE_OPTIONS = [
  { value: 'auto', label: 'Auto-detect Language', flag: '🌐' },
  {
    group: 'Indian Languages',
    items: [
      { value: 'hin', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
      { value: 'guj', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
      { value: 'mar', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
      { value: 'ben', label: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
      { value: 'tam', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
      { value: 'tel', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
      { value: 'kan', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
      { value: 'mal', label: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
      { value: 'pan', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
      { value: 'urd', label: 'Urdu', native: 'اردو', flag: '🇮🇳' },
      { value: 'san', label: 'Sanskrit', native: 'संस्कृतम्', flag: '🇮🇳' },
      { value: 'eng+guj', label: 'Gujarati + English', flag: '🇮🇳' },
      { value: 'eng+hin', label: 'Hindi + English', flag: '🇮🇳' },
    ],
  },
  {
    group: 'International Languages',
    items: [
      { value: 'eng', label: 'English', native: 'English', flag: '🇬🇧' },
      { value: 'spa', label: 'Spanish', native: 'Español', flag: '🇪🇸' },
      { value: 'fra', label: 'French', native: 'Français', flag: '🇫🇷' },
      { value: 'deu', label: 'German', native: 'Deutsch', flag: '🇩🇪' },
      { value: 'ara', label: 'Arabic', native: 'العربية', flag: '🇸🇦' },
      { value: 'rus', label: 'Russian', native: 'Русский', flag: '🇷🇺' },
    ],
  },
];
const toWord = computed(() => direction.value === 'pdf-word');
const sourceType = computed(() => toWord.value ? 'pdf' : 'word');
const targetType = computed(() => toWord.value ? 'word' : 'pdf');
const sourceName = computed(() => toWord.value ? 'PDF' : 'Word');
const targetName = computed(() => toWord.value ? 'Word' : 'PDF');
const file = shallowRef(null);
const result = shallowRef(null);
const busy = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const input = ref(null);
const resultHeading = ref(null);
const uploadButton = ref(null);
const stage = computed(() => result.value ? 3 : file.value ? 2 : 1);
let dropDepth = 0;
let request;
let active = true;

watch(() => props.fixedDirection, (next) => {
  if (next && (next === 'word-pdf' || next === 'pdf-word')) changeDirection(next);
});

watch(() => props.modelValue, (next) => {
  if (!props.fixedDirection && next && next !== direction.value && (next === 'word-pdf' || next === 'pdf-word')) {
    changeDirection(next);
  }
});

watch(result, async (next, previous) => {
  if (previous?.url && previous.url !== next?.url) URL.revokeObjectURL(previous.url);
  if (next) {
    await nextTick();
    if (active) resultHeading.value?.focus();
  }
}, { flush: 'post' });

onBeforeUnmount(() => {
  active = false;
  request?.abort();
  if (result.value?.url) URL.revokeObjectURL(result.value.url);
});

function select(files) {
  if (busy.value || !files?.length) return;
  const message = (toWord.value ? validatePdf : validateDocument)(files);
  error.value = message;
  result.value = null;
  file.value = message ? null : files[0];
}

function chooseFile(event) {
  select(event.target.files);
  event.target.value = '';
}

async function reset() {
  if (busy.value) return;
  file.value = null;
  result.value = null;
  error.value = '';
  wordMode.value = 'editable';
  ocrLanguage.value = 'auto';
  if (input.value) input.value.value = '';
  await nextTick();
  if (active) uploadButton.value?.focus();
}

function changeDirection(value) {
  if (busy.value || direction.value === value) return;
  direction.value = value;
  emit('update:modelValue', value);
  dragging.value = false;
  dropDepth = 0;
  void reset();
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
  select(event.dataTransfer.files);
}

function cancel() { request?.abort(); }

async function convert() {
  if (!file.value || busy.value) return;
  busy.value = true;
  error.value = '';
  const selected = file.value;
  const controller = new AbortController();
  request = controller;
  try {
    const conversion = toWord.value ? convertPdf : convertDocument;
    const output = await conversion(selected, {
      mode: wordMode.value,
      ocrLanguage: ocrLanguage.value,
      signal: controller.signal,
      onProgress: value => { if (active) progress.value = value; },
    });
    const { blob, pageCount } = output;
    if (active && !controller.signal.aborted) {
      result.value = { ...output, blob: undefined, url: URL.createObjectURL(blob), filename: (toWord.value ? wordFilename : pdfFilename)(selected.name), size: blob.size, pageCount };
    }
  } catch (err) {
    if (active && err.name !== 'AbortError') error.value = err.message || 'We couldn’t convert this document. Please try a smaller file.';
  } finally {
    request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}
</script>

<template>
  <section id="converter" class="converter" :class="{ 'is-converting': busy }" :aria-label="`${sourceName} to ${targetName} converter`" :aria-busy="busy">
    <div v-if="!fixedDirection" class="direction-switch" role="group" aria-label="Conversion direction">
      <button :aria-pressed="!toWord" :disabled="busy" @click="changeDirection('word-pdf')">Word to PDF</button>
      <button :aria-pressed="toWord" :disabled="busy" @click="changeDirection('pdf-word')">PDF to Word</button>
    </div>
    <div class="converter-heading">
      <div><span class="mini-label">YOUR DOCUMENT, SIMPLIFIED</span><h2>{{ sourceName }} <ArrowRight :size="21" /> {{ targetName }}</h2></div>
      <span class="free-badge">Free to use</span>
    </div>
    <ol class="step-track" aria-label="Conversion steps">
      <li v-for="(label, index) in ['Upload', 'Convert', 'Download']" :key="label" :class="{ current: stage === index + 1, complete: stage > index + 1 }" :aria-current="stage === index + 1 ? 'step' : undefined">
        <span><Check v-if="stage > index + 1" :size="12" /><template v-else>{{ index + 1 }}</template></span>{{ label }}
      </li>
    </ol>
    <input id="document-input" ref="input" class="visually-hidden" tabindex="-1" type="file" :accept="toWord ? '.pdf,application/pdf' : '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'" :disabled="busy" :aria-label="`Choose a ${sourceName} document`" @change="chooseFile" />

    <div v-if="result" class="result-state">
      <span class="success-icon"><CheckCheck :size="31" /><span class="success-ring" aria-hidden="true" /></span>
      <span class="mini-label">ALL DONE</span>
      <h3 ref="resultHeading" tabindex="-1">Your {{ targetName }} file is ready.</h3>
      <p>{{ result.pageCount }} {{ result.pageCount === 1 ? 'page' : 'pages' }} · {{ toWord ? 'Word document (.docx)' : 'Image-based PDF' }}</p>
      <p v-if="toWord" class="output-details" role="status">
        <template v-if="result.mode === 'appearance'">Page appearance preserved as images. Text is not editable.</template>
        <template v-else>{{ result.editablePages }} editable {{ result.editablePages === 1 ? 'page' : 'pages' }}. <template v-if="result.ocrPages">{{ result.ocrPages }} {{ result.ocrPages === 1 ? 'scanned page was' : 'scanned pages were' }} recognized with OCR.</template> <template v-if="result.imagePages">{{ result.imagePages }} {{ result.imagePages === 1 ? 'page was' : 'pages were' }} kept as images because no text was recognized.</template> Original page design stays behind the editable text; proofread OCR text before sharing.</template>
      </p>
      <div class="selected-file"><FileBadge :type="targetType" small /><div><strong>{{ result.filename }}</strong><span>{{ formatSize(result.size) }} · {{ targetName }} document</span></div><span class="ready-dot" /></div>
      <a class="primary-button" :href="result.url" :download="result.filename"><Download :size="18" />Download {{ targetName }}</a>
      <button class="text-button" @click="reset">Convert another document <ArrowRight :size="15" /></button>
    </div>
    <template v-else>
      <div class="drop-zone" :class="{ dragging, 'has-file': file }" @dragenter.prevent="dragEnter" @dragover.prevent="dragOver" @dragleave.prevent="dragLeave" @drop.prevent="drop">
        <template v-if="file">
          <div class="file-chosen-icon"><FileBadge :type="sourceType" /><span><Check :size="12" /></span></div>
          <h3>Looking good.</h3><p>Your document is ready to convert.</p>
          <div class="selected-file"><FileBadge :type="sourceType" small /><div><strong>{{ file.name }}</strong><span>{{ formatSize(file.size) }} · {{ sourceName }} document</span></div><button class="icon-button" :disabled="busy" aria-label="Remove selected document" @click="reset"><X :size="17" /></button></div>
          <button class="text-button" :disabled="busy" @click="input?.click()">Choose a different file</button>
        </template>
        <template v-else>
          <div class="document-pair" aria-hidden="true"><FileBadge :type="sourceType" /><span class="pair-arrow"><ArrowRight :size="18" /></span><FileBadge :type="targetType" /></div>
          <h3>{{ dragging ? 'Drop it here.' : `Drop your ${sourceName} document here` }}</h3>
          <p>or choose a file from your device</p>
          <button ref="uploadButton" class="choose-button" aria-describedby="file-requirements" @click="input?.click()"><Upload :size="17" /> Choose {{ sourceName }} file</button>
          <span id="file-requirements" class="file-requirements">{{ toWord ? '.PDF' : '.DOCX' }} only <span>·</span> Up to 20 MB <span>·</span> One file at a time</span>
        </template>
      </div>
      <fieldset v-if="toWord" class="word-options" :disabled="busy" aria-describedby="word-mode-note">
        <legend>Choose your Word output</legend>
        <label :class="{ selected: wordMode === 'editable' }">
          <input v-model="wordMode" type="radio" name="word-mode" value="editable" />
          <span><strong>Editable text with Smart OCR <small>Recommended</small></strong><span>Keeps the PDF's original Unicode language and layout. OCR runs only for scanned or broken-font pages.</span></span>
        </label>
        <label :class="{ selected: wordMode === 'appearance' }">
          <input v-model="wordMode" type="radio" name="word-mode" value="appearance" />
          <span><strong>Page images <small>Not editable</small></strong><span>Preserve appearance as pictures. Text cannot be edited.</span></span>
        </label>
      </fieldset>
      <div v-if="toWord && wordMode === 'editable'" class="ocr-language">
        <span>Document Language / OCR</span>
        <div class="ocr-select-holder">
          <CustomSelect
            v-model="ocrLanguage"
            :options="OCR_LANGUAGE_OPTIONS"
            :disabled="busy"
            placeholder="Auto-detect Language"
            size="sm"
            aria-label="Document Language and OCR"
          />
        </div>
      </div>
      <p v-if="toWord" id="word-mode-note" class="conversion-note">{{ wordMode === 'appearance' ? 'This creates pictures inside Word. Select Smart OCR to edit text.' : 'Existing Unicode text stays in its original language (Gujarati, Hindi, English, etc.). Scanned and legacy-font pages are recognized with OCR, while the original page layout remains visible.' }} Up to 450 pages (30 OCR pages).</p>
      <p v-else class="conversion-note">Basic layouts work best. PDF text is not selectable.</p>
      <template v-if="file">
        <button class="primary-button convert-button" :disabled="busy" @click="convert">
          <template v-if="busy"><LoaderCircle class="spinning" :size="19" />Converting on your device…</template>
          <template v-else>Convert to {{ targetName }}<ArrowRight :size="18" /></template>
        </button>
        <template v-if="busy"><div class="progress-track" role="status"><span /><p>{{ progress || 'Preparing your document…' }} Keep this page open.</p></div><button class="text-button cancel-conversion" @click="cancel">Cancel conversion</button></template>
      </template>
      <div v-if="error" class="error-message" role="alert"><CircleAlert :size="18" /><span>{{ error }}</span></div>
    </template>
    <div class="converter-assurance"><LockKeyhole :size="13" /><span>Converted on your device. No document uploads.</span></div>
  </section>
</template>
