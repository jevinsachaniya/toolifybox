<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { Check, CircleAlert, Download, Gauge, ImageDown, LoaderCircle, LockKeyhole, Maximize2, Minimize2, ShieldCheck, Target, Upload, X } from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import { IMAGE_COMPRESSION_PRESETS, compressedImageFilename, compressImageFile, inspectCompressImage, validateCompressImage } from '~/utils/compress-image.js';

const file = shallowRef(null);
const details = ref(null);
const previewUrl = ref('');
const result = ref(null);
const preset = ref('high');
const targetSize = ref('250');
const targetUnit = ref('KB');
const busy = ref(false);
const dragging = ref(false);
const progress = ref('');
const error = ref('');
const input = ref(null);
const uploadButton = ref(null);
const stage = computed(() => result.value ? 3 : file.value ? 2 : 1);
const targetBytes = computed(() => {
  const value = Number(targetSize.value);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * (targetUnit.value === 'MB' ? 1024 * 1024 : 1024));
});
const targetError = computed(() => {
  if (preset.value !== 'target') return '';
  if (targetBytes.value < 10 * 1024) return 'Enter at least 10 KB.';
  if (targetBytes.value > 20 * 1024 * 1024) return 'Enter 20 MB or less.';
  return '';
});
let request;
let dropDepth = 0;
let active = true;

function releaseResult() {
  if (result.value?.url) URL.revokeObjectURL(result.value.url);
  result.value = null;
}

function releasePreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = '';
}

onBeforeUnmount(() => {
  active = false;
  request?.abort();
  releaseResult();
  releasePreview();
});

function clear({ focus = true } = {}) {
  request?.abort();
  request = undefined;
  releaseResult();
  releasePreview();
  file.value = null;
  details.value = null;
  preset.value = 'high';
  targetSize.value = '250';
  targetUnit.value = 'KB';
  busy.value = false;
  progress.value = '';
  error.value = '';
  if (input.value) input.value.value = '';
  if (focus && active) uploadButton.value?.focus();
}

async function select(files) {
  if (busy.value || !files?.length) return;
  const chosen = Array.from(files);
  const validation = validateCompressImage(chosen);
  clear({ focus: false });
  if (validation) {
    error.value = validation;
    return;
  }
  const controller = new AbortController();
  request = controller;
  busy.value = true;
  progress.value = 'Opening image preview...';
  try {
    const info = await inspectCompressImage(chosen[0], { signal: controller.signal });
    if (active && !controller.signal.aborted) {
      file.value = chosen[0];
      details.value = info;
      previewUrl.value = URL.createObjectURL(chosen[0]);
    }
  } catch (caught) {
    if (active && caught.name !== 'AbortError') error.value = caught.message || 'This image could not be opened.';
  } finally {
    if (request === controller) request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}

function chooseFile(event) {
  void select(event.target.files);
  event.target.value = '';
}

function dragEnter() { if (!busy.value) { dropDepth++; dragging.value = true; } }
function dragOver(event) { event.dataTransfer.dropEffect = busy.value ? 'none' : 'copy'; }
function dragLeave() { dropDepth = Math.max(0, dropDepth - 1); if (!dropDepth) dragging.value = false; }
function drop(event) { dropDepth = 0; dragging.value = false; void select(event.dataTransfer.files); }
function selectPreset(value) { if (!busy.value) { releaseResult(); preset.value = value; } }

async function compress() {
  if (!file.value || busy.value) return;
  if (targetError.value) { error.value = targetError.value; return; }
  releaseResult();
  error.value = '';
  busy.value = true;
  const controller = new AbortController();
  request = controller;
  try {
    const output = await compressImageFile(file.value, preset.value, {
      targetBytes: preset.value === 'target' ? targetBytes.value : undefined,
      signal: controller.signal,
      onProgress: value => { if (active) progress.value = value; },
    });
    if (active && !controller.signal.aborted) result.value = {
      ...output,
      url: URL.createObjectURL(output.blob),
      filename: compressedImageFilename(file.value.name, output.mimeType),
    };
  } catch (caught) {
    if (active && caught.name !== 'AbortError') error.value = caught.message || 'We could not compress this image. Try another quality setting.';
  } finally {
    if (request === controller) request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}
</script>

<template>
  <section id="converter" class="converter compress-image-converter" :class="{ 'is-converting': busy, 'has-image': file }" aria-label="Compress Image converter" :aria-busy="busy">
    <div class="converter-heading"><div><span class="mini-label">SMALLER IMAGE, CLEAR RESULT</span><h2>Compress Image</h2></div><span class="free-badge">Free to use</span></div>
    <ol class="step-track" aria-label="Image compression steps"><li v-for="(label, index) in ['Upload', 'Choose quality', 'Download']" :key="label" :class="{ current: stage === index + 1, complete: stage > index + 1 }" :aria-current="stage === index + 1 ? 'step' : undefined"><span><Check v-if="stage > index + 1" :size="12" /><template v-else>{{ index + 1 }}</template></span>{{ label }}</li></ol>
    <input id="compress-image-input" ref="input" class="visually-hidden" tabindex="-1" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" :disabled="busy" aria-label="Choose an image to compress" @change="chooseFile" />

    <template v-if="file">
      <div class="compress-image-summary"><div><strong>{{ file.name }}</strong><span>{{ details.width }} × {{ details.height }} px · {{ formatSize(file.size) }}</span></div><button class="icon-button" type="button" :disabled="busy" aria-label="Choose another image" @click="clear()"><X :size="17" /></button></div>
      <div class="compress-image-workspace">
        <figure class="compress-image-preview"><img :src="result?.url || previewUrl" :alt="result ? 'Compressed image preview' : 'Original image preview'" /><figcaption><span>{{ result ? 'Compressed preview' : 'Original preview' }}</span><b>{{ result ? `${result.width} × ${result.height} px` : `${details.width} × ${details.height} px` }}</b></figcaption></figure>
        <fieldset class="compress-options image-compress-options"><legend>Choose compression quality</legend><button v-for="option in Object.values(IMAGE_COMPRESSION_PRESETS)" :key="option.id" type="button" :class="{ selected: preset === option.id }" :aria-pressed="preset === option.id" :disabled="busy" @click="selectPreset(option.id)"><span class="compress-option-icon"><ShieldCheck v-if="option.id === 'high'" :size="19" /><Gauge v-else-if="option.id === 'balanced'" :size="19" /><Target v-else-if="option.id === 'target'" :size="19" /><Minimize2 v-else :size="19" /></span><span><strong>{{ option.label }}<b v-if="option.id === 'high'">Recommended</b></strong><small>{{ option.description }}</small><em>{{ option.detail }}</em></span><span class="compress-radio"><Check v-if="preset === option.id" :size="12" /></span></button></fieldset>
      </div>

      <div v-if="preset === 'target'" class="compress-target-size"><label for="compress-image-target"><span>Target file size</span><small>We keep the clearest result that can fit your requested maximum.</small></label><div><input id="compress-image-target" v-model="targetSize" type="number" min="0.01" step="0.05" inputmode="decimal" aria-describedby="compress-image-target-help" @input="releaseResult" /><select v-model="targetUnit" aria-label="Target image size unit" @change="releaseResult"><option>KB</option><option>MB</option></select></div><p id="compress-image-target-help" :class="{ error: targetError }">{{ targetError || `Requested maximum: ${formatSize(targetBytes)}` }}</p></div>
      <div class="compress-mode-note" :class="{ flattened: preset !== 'high' }"><Maximize2 v-if="preset === 'high'" :size="16" /><Target v-else-if="preset === 'target'" :size="16" /><ImageDown v-else :size="16" /><p v-if="preset === 'high'"><b>Original dimensions and format stay intact.</b> This mode applies gentle compression and keeps fine details.</p><p v-else-if="preset === 'target'"><b>Your requested size is a best-effort maximum.</b> The tool tests several quality and dimension levels, then keeps the clearest result that fits.</p><p v-else><b>Colors, transparency and visual layout are preserved.</b> The result uses efficient WebP compression; Smallest mode can reduce dimensions.</p></div>

      <div v-if="result" class="compress-result image-compress-result" :class="{ 'target-missed': result.targetBytes && !result.metTarget }" role="status"><span><Check v-if="!result.targetBytes || result.metTarget" :size="18" /><Target v-else :size="18" /></span><div><strong>{{ result.targetBytes ? (result.metTarget ? 'Target size reached' : 'Closest available size created') : result.changed ? `Image compressed by ${result.reduction}%` : 'This image is already well optimized' }}</strong><small>{{ formatSize(result.originalSize) }} <span>→</span> {{ formatSize(result.outputSize) }} · {{ result.width }} × {{ result.height }} px</small><em v-if="result.targetBytes && !result.metTarget">Try a larger target if you need to preserve more detail.</em><em v-else-if="!result.changed">We kept the smaller original file instead of creating a larger result.</em></div><a :href="result.url" :download="result.filename"><Download :size="16" /> Download Image</a></div>
      <button class="primary-button compress-image-button" :disabled="busy || Boolean(targetError)" @click="compress"><LoaderCircle v-if="busy" class="spinning" :size="18" /><Target v-else-if="preset === 'target'" :size="18" /><ImageDown v-else :size="18" />{{ busy ? 'Compressing image...' : preset === 'target' ? `Compress toward ${targetSize || 0} ${targetUnit}` : 'Compress Image' }}</button>
    </template>

    <div v-else class="drop-zone compress-image-drop-zone" :class="{ dragging }" @dragenter.prevent="dragEnter" @dragover.prevent="dragOver" @dragleave.prevent="dragLeave" @drop.prevent="drop">
      <div class="compress-image-upload-art" aria-hidden="true"><ImageDown :size="31" /><span><Minimize2 :size="18" /></span></div><h3>{{ dragging ? 'Drop your image here.' : 'Add an image to compress' }}</h3><p>Preview the image, choose a quality level, or enter the exact KB or MB size you need.</p><button ref="uploadButton" class="choose-button" aria-describedby="compress-image-requirements" @click="input?.click()"><Upload :size="17" /> Choose image</button><span id="compress-image-requirements" class="file-requirements">JPG, PNG or WebP <span>·</span> One image <span>·</span> Up to 20 MB</span>
    </div>

    <template v-if="busy"><div class="progress-track" role="status"><span /><p>{{ progress }} Keep this page open.</p></div><button class="text-button cancel-conversion" @click="request?.abort()">Cancel</button></template>
    <div v-if="error" class="error-message" role="alert"><CircleAlert :size="18" /><span>{{ error }}</span></div>
    <p class="conversion-note">High quality keeps the original format. Balanced, Smallest and Custom target create broadly supported WebP images for better compression.</p>
    <div class="converter-assurance"><LockKeyhole :size="13" /><span>Processed on your device. No image uploads.</span></div>
  </section>
</template>
