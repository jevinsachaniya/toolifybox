<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { Check, CircleAlert, Download, Eye, EyeOff, FileText, KeyRound, LoaderCircle, Lock, LockOpen, RotateCcw, ShieldCheck, Upload, X } from '@lucide/vue';
import { formatSize, unlockedPdfFilename, validatePdf } from '~/utils/document.js';
import { inspectPdfLock, unlockPdfFile } from '~/utils/unlock-pdf.js';

const file = shallowRef(null);
const password = ref('');
const showPassword = ref(false);
const isEncrypted = ref(true);
const detectedAlgorithm = ref('');
const checking = ref(false);

const busy = ref(false);
const exported = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const resultPdf = ref(null);
const input = ref(null);
const uploadButton = ref(null);

const stage = computed(() => resultPdf.value ? 3 : file.value ? 2 : 1);

const canUnlock = computed(() => {
  return file.value &&
    isEncrypted.value &&
    password.value.trim().length > 0 &&
    !busy.value;
});

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

async function clear({ focus = true } = {}) {
  request?.abort();
  request = undefined;
  clearResult();
  file.value = null;
  password.value = '';
  showPassword.value = false;
  isEncrypted.value = true;
  detectedAlgorithm.value = '';
  checking.value = false;
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
  if (message) {
    error.value = message;
    return;
  }
  const selected = chosen[0];
  file.value = selected;

  // Immediate check if document is encrypted
  checking.value = true;
  try {
    const check = await inspectPdfLock(selected);
    if (active) {
      isEncrypted.value = check.encrypted;
      detectedAlgorithm.value = check.algorithm || 'Encrypted';
    }
  } catch (err) {
    // Non-blocking inspection failure
  } finally {
    if (active) checking.value = false;
  }
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

function downloadFile(url, filename) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

async function unlockDocument() {
  if (!canUnlock.value) return;

  busy.value = true;
  error.value = '';
  clearResult();
  const controller = new AbortController();
  request = controller;

  try {
    progress.value = 'Decrypting PDF document…';
    const blob = await unlockPdfFile(file.value, {
      password: password.value,
      signal: controller.signal,
      onProgress: msg => { if (active) progress.value = msg; },
    });

    const filename = unlockedPdfFilename(file.value.name);
    const url = URL.createObjectURL(blob);

    if (active) {
      resultPdf.value = {
        blob,
        url,
        filename,
        size: blob.size,
      };
      exported.value = true;
      downloadFile(url, filename);
    }
  } catch (caught) {
    if (active && caught.name !== 'AbortError') {
      error.value = caught.message || 'We could not unlock this PDF. Please check the password and try again.';
    }
  } finally {
    if (request === controller) request = undefined;
    if (active) { busy.value = false; progress.value = ''; }
  }
}

function cancel() {
  request?.abort();
}
</script>

<template>
  <section id="converter" class="converter unlock-pdf-converter" :class="{ 'is-converting': busy }" aria-label="Unlock PDF converter" :aria-busy="busy">
    <div class="converter-heading">
      <div>
        <span class="mini-label">SECURITY &amp; DECRYPTION</span>
        <h2>Unlock PDF <span aria-hidden="true">🔓</span></h2>
      </div>
      <span class="free-badge">100% Private</span>
    </div>

    <ol class="step-track" aria-label="Unlocking steps">
      <li v-for="(label, index) in ['Select PDF', 'Enter password', 'Download PDF']" :key="label" :class="{ current: stage === index + 1, complete: stage > index + 1 }" :aria-current="stage === index + 1 ? 'step' : undefined">
        <span><Check v-if="stage > index + 1" :size="12" /><template v-else>{{ index + 1 }}</template></span>{{ label }}
      </li>
    </ol>

    <input id="pdf-unlock-input" ref="input" class="visually-hidden" tabindex="-1" type="file" accept=".pdf,application/pdf" :disabled="busy" aria-label="Choose a password-protected PDF to unlock" @change="chooseFile" />

    <!-- Stage 3: Result / Success -->
    <template v-if="resultPdf">
      <div class="result-state">
        <div class="file-chosen-icon" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; margin: 0 auto 16px;">
          <LockOpen :size="30" />
        </div>
        <h3>Password Removed Successfully!</h3>
        <p>Your PDF has been completely unlocked and can now be opened without any password.</p>

        <div class="selected-file" style="margin: 20px 0;">
          <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
            <div style="color: #059669; background: #d1fae5; padding: 10px; border-radius: 10px; display: grid; place-items: center;">
              <FileText :size="20" />
            </div>
            <div style="flex: 1; min-width: 0;">
              <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ resultPdf.filename }}</strong>
              <span style="font-size: 12px; color: #64748b;">{{ formatSize(resultPdf.size) }} · Unlocked &amp; decrypted</span>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <a class="primary-button" :href="resultPdf.url" :download="resultPdf.filename">
            <Download :size="18" /> Download Unlocked PDF again
          </a>
          <button class="text-button" @click="clear()">
            <RotateCcw :size="16" /> Unlock another file
          </button>
        </div>
      </div>
    </template>

    <!-- Stage 2: Password Entry -->
    <template v-else-if="file">
      <div class="file-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 14px; min-width: 0;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: #fee2e2; color: #ef4444; display: grid; place-items: center;">
            <FileText :size="22" />
          </div>
          <div style="min-width: 0;">
            <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px;">{{ file.name }}</strong>
            <span style="font-size: 12px; color: #64748b;">
              {{ formatSize(file.size) }}
              <template v-if="detectedAlgorithm"> · {{ detectedAlgorithm }}</template>
            </span>
          </div>
        </div>
        <button class="icon-button" :disabled="busy" aria-label="Choose another PDF" @click="clear()">
          <X :size="18" />
        </button>
      </div>

      <!-- Notice if file is already unlocked -->
      <div v-if="!isEncrypted" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px; margin-bottom: 20px; display: flex; gap: 14px; align-items: flex-start; color: #166534;">
        <ShieldCheck :size="24" style="flex-shrink: 0; color: #16a34a; margin-top: 2px;" />
        <div style="font-size: 13px; line-height: 1.5;">
          <strong style="font-size: 14px; color: #14532d; display: block; margin-bottom: 4px;">This PDF is already unlocked!</strong>
          This document does not have any password protection or encryption enabled. You can open and edit it freely.
          <div style="margin-top: 10px;">
            <button type="button" class="text-button" style="padding: 0; color: #15803d; font-weight: 600;" @click="clear()">
              Choose another PDF file →
            </button>
          </div>
        </div>
      </div>

      <!-- Password form if encrypted -->
      <div v-else style="display: grid; gap: 16px; margin-bottom: 24px;">
        <div>
          <label for="pdf-unlock-pass" style="display: block; font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 6px;">
            Enter Password to Unlock <span style="color: #ef4444;">*</span>
          </label>
          <div style="position: relative;">
            <input
              id="pdf-unlock-pass"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter document password"
              :disabled="busy"
              autocomplete="current-password"
              style="width: 100%; box-sizing: border-box; padding: 12px 44px 12px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; outline: none; transition: border-color .2s;"
              @keydown.enter.prevent="unlockDocument"
            />
            <button
              type="button"
              style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: #64748b; cursor: pointer; padding: 4px;"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" :size="18" />
              <Eye v-else :size="18" />
            </button>
          </div>
          <span style="display: block; margin-top: 6px; font-size: 12px; color: #64748b;">
            Entering the correct password will permanently remove the password requirement from the exported file.
          </span>
        </div>

        <div class="stage-actions">
          <button
            type="button"
            class="primary-button"
            :disabled="!canUnlock"
            style="min-width: 180px;"
            @click="unlockDocument"
          >
            <LockOpen :size="18" /> Unlock PDF
          </button>
          <button type="button" class="text-button" :disabled="busy" @click="clear()">
            Cancel
          </button>
        </div>
      </div>
    </template>

    <!-- Stage 1: File Selection Dropzone -->
    <template v-else>
      <div
        class="drop-zone"
        :class="{ dragging }"
        tabindex="0"
        role="button"
        aria-label="Upload password-protected PDF to unlock"
        @click="input?.click()"
        @keydown.enter.space.prevent="input?.click()"
        @dragenter.prevent="dragEnter"
        @dragover.prevent="dragOver"
        @dragleave.prevent="dragLeave"
        @drop.prevent="drop"
      >
        <div class="drop-zone-icon" style="background: linear-gradient(135deg, #10b981, #047857); color: #fff; width: 64px; height: 64px; border-radius: 18px; display: grid; place-items: center; margin: 0 auto 16px;">
          <KeyRound :size="32" />
        </div>
        <h3>Select a Protected PDF to Unlock</h3>
        <p>Drag and drop your password-protected PDF here, or click to browse files up to 20 MB.</p>
        <button ref="uploadButton" type="button" class="primary-button" style="margin-top: 14px;">
          <Upload :size="18" /> Choose PDF file
        </button>
        <span class="drop-zone-hint" style="display: block; margin-top: 14px; font-size: 12px; color: #94a3b8;">
          🔓 Decryption runs 100% locally on your device. Your password and files are never sent to a server.
        </span>
      </div>
    </template>

    <!-- Progress / Busy Overlay -->
    <div v-if="busy" class="busy-overlay" role="status" aria-live="polite">
      <LoaderCircle class="spin" :size="38" />
      <p><strong>{{ progress || 'Unlocking document…' }}</strong></p>
      <button class="text-button" type="button" @click="cancel">Cancel</button>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner" role="alert" style="margin-top: 16px; display: flex; gap: 10px; align-items: center;">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
    </div>
  </section>
</template>

