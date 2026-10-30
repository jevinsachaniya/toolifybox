<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { Check, CircleAlert, Download, Eye, EyeOff, FileText, KeyRound, LoaderCircle, Lock, LockKeyhole, RotateCcw, ShieldCheck, Upload, X } from '@lucide/vue';
import { formatSize, protectedPdfFilename, validatePdf } from '~/utils/document.js';
import { checkPdfIsEncrypted, protectPdfFile } from '~/utils/protect-pdf.js';

const file = shallowRef(null);
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const algorithm = ref('AES-256');
const alreadyEncrypted = ref(false);
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

// Password strength calculation
const passwordStrength = computed(() => {
  const p = password.value;
  if (!p) return { score: 0, label: '', color: '' };
  let score = 0;
  if (p.length >= 6) score++;
  if (p.length >= 10) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;

  if (score <= 2) return { score: 1, label: 'Weak', color: '#ef4444' };
  if (score <= 3) return { score: 2, label: 'Fair', color: '#f59e0b' };
  return { score: 3, label: 'Strong', color: '#10b981' };
});

const passwordsMatch = computed(() => {
  if (!confirmPassword.value) return true;
  return password.value === confirmPassword.value;
});

const canProtect = computed(() => {
  return file.value &&
    !alreadyEncrypted.value &&
    password.value.trim().length > 0 &&
    (!confirmPassword.value || passwordsMatch.value) &&
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
  confirmPassword.value = '';
  showPassword.value = false;
  showConfirmPassword.value = false;
  alreadyEncrypted.value = false;
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

  // Immediate check if already protected
  checking.value = true;
  try {
    const check = await checkPdfIsEncrypted(selected);
    if (active && check.encrypted) {
      alreadyEncrypted.value = true;
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

async function protectDocument() {
  if (!canProtect.value) return;
  if (confirmPassword.value && password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match. Please verify both fields.';
    return;
  }

  busy.value = true;
  error.value = '';
  clearResult();
  const controller = new AbortController();
  request = controller;

  try {
    progress.value = 'Encrypting PDF document…';
    const blob = await protectPdfFile(file.value, {
      password: password.value,
      confirmPassword: confirmPassword.value,
      algorithm: algorithm.value,
      signal: controller.signal,
      onProgress: msg => { if (active) progress.value = msg; },
    });

    const filename = protectedPdfFilename(file.value.name);
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
      error.value = caught.message || 'We could not protect this PDF. Please check the file and try again.';
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
  <section id="converter" class="converter protect-pdf-converter" :class="{ 'is-converting': busy }" aria-label="Protect PDF converter" :aria-busy="busy">
    <div class="converter-heading">
      <div>
        <span class="mini-label">SECURITY &amp; ENCRYPTION</span>
        <h2>Protect PDF <span aria-hidden="true">🔒</span></h2>
      </div>
      <span class="free-badge">100% Private</span>
    </div>

    <ol class="step-track" aria-label="Protection steps">
      <li v-for="(label, index) in ['Select PDF', 'Set password', 'Download PDF']" :key="label" :class="{ current: stage === index + 1, complete: stage > index + 1 }" :aria-current="stage === index + 1 ? 'step' : undefined">
        <span><Check v-if="stage > index + 1" :size="12" /><template v-else>{{ index + 1 }}</template></span>{{ label }}
      </li>
    </ol>

    <input id="pdf-protect-input" ref="input" class="visually-hidden" tabindex="-1" type="file" accept=".pdf,application/pdf" :disabled="busy" aria-label="Choose a PDF file to protect" @change="chooseFile" />

    <!-- Stage 3: Result / Success -->
    <template v-if="resultPdf">
      <div class="result-state">
        <div class="file-chosen-icon" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; margin: 0 auto 16px;">
          <ShieldCheck :size="32" />
        </div>
        <h3>PDF Protected Successfully!</h3>
        <p>Your document is now encrypted with bank-grade {{ algorithm }} password protection.</p>

        <div class="selected-file" style="margin: 20px 0;">
          <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
            <div style="color: #f43f5e; background: #ffe4e6; padding: 10px; border-radius: 10px; display: grid; place-items: center;">
              <Lock :size="20" />
            </div>
            <div style="flex: 1; min-width: 0;">
              <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ resultPdf.filename }}</strong>
              <span style="font-size: 12px; color: #64748b;">{{ formatSize(resultPdf.size) }} · Protected with {{ algorithm }}</span>
            </div>
          </div>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px; text-align: left; margin-bottom: 20px; font-size: 12px; color: #166534; line-height: 1.5;">
          <strong>🔒 Important:</strong> Make sure to remember your password. We Make PDF encrypts files locally in your browser and never stores your passwords or file copies.
        </div>

        <div class="result-actions">
          <a class="primary-button" :href="resultPdf.url" :download="resultPdf.filename">
            <Download :size="18" /> Download Protected PDF again
          </a>
          <button class="text-button" @click="clear()">
            <RotateCcw :size="16" /> Protect another file
          </button>
        </div>
      </div>
    </template>

    <!-- Stage 2: Password Configuration -->
    <template v-else-if="file">
      <div class="file-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 14px; min-width: 0;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: #fee2e2; color: #ef4444; display: grid; place-items: center;">
            <FileText :size="22" />
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

      <!-- Warning if already encrypted -->
      <div v-if="alreadyEncrypted" style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 16px; margin-bottom: 20px; display: flex; gap: 12px; align-items: flex-start; color: #92400e;">
        <CircleAlert :size="20" style="flex-shrink: 0; margin-top: 2px;" />
        <div style="font-size: 13px; line-height: 1.5;">
          <strong>This PDF is already password-protected.</strong><br />
          You cannot re-encrypt a protected document. To remove or change its password, use our
          <NuxtLink to="/tools/unlock-pdf" style="color: #b45309; font-weight: 700; text-decoration: underline;">Unlock PDF Tool</NuxtLink>.
        </div>
      </div>

      <!-- Password form if not encrypted -->
      <div v-else style="display: grid; gap: 18px; margin-bottom: 24px;">
        <!-- Password Input -->
        <div>
          <label for="pdf-pass" style="display: block; font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 6px;">
            Set Document Password <span style="color: #ef4444;">*</span>
          </label>
          <div style="position: relative;">
            <input
              id="pdf-pass"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter a strong password"
              :disabled="busy"
              autocomplete="new-password"
              style="width: 100%; box-sizing: border-box; padding: 12px 44px 12px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; outline: none; transition: border-color .2s;"
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

          <!-- Strength Meter -->
          <div v-if="password" style="margin-top: 8px;">
            <div style="display: flex; gap: 4px; height: 4px; margin-bottom: 4px;">
              <span :style="{ flex: 1, borderRadius: '2px', background: passwordStrength.score >= 1 ? passwordStrength.color : '#e2e8f0' }" />
              <span :style="{ flex: 1, borderRadius: '2px', background: passwordStrength.score >= 2 ? passwordStrength.color : '#e2e8f0' }" />
              <span :style="{ flex: 1, borderRadius: '2px', background: passwordStrength.score >= 3 ? passwordStrength.color : '#e2e8f0' }" />
            </div>
            <span style="font-size: 11px; font-weight: 600;" :style="{ color: passwordStrength.color }">
              {{ passwordStrength.label }} password
            </span>
          </div>
        </div>

        <!-- Confirm Password Input -->
        <div>
          <label for="pdf-pass-confirm" style="display: block; font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 6px;">
            Confirm Password
          </label>
          <div style="position: relative;">
            <input
              id="pdf-pass-confirm"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Re-enter password to confirm"
              :disabled="busy"
              autocomplete="new-password"
              style="width: 100%; box-sizing: border-box; padding: 12px 44px 12px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; outline: none;"
            />
            <button
              type="button"
              style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: #64748b; cursor: pointer; padding: 4px;"
              :aria-label="showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <EyeOff v-if="showConfirmPassword" :size="18" />
              <Eye v-else :size="18" />
            </button>
          </div>
          <span v-if="confirmPassword && !passwordsMatch" style="display: block; margin-top: 4px; font-size: 11px; color: #ef4444; font-weight: 500;">
            Passwords do not match
          </span>
          <span v-else-if="confirmPassword && passwordsMatch" style="display: block; margin-top: 4px; font-size: 11px; color: #10b981; font-weight: 500;">
            ✓ Passwords match
          </span>
        </div>

        <!-- Encryption Algorithm Selection -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px;">
          <span style="display: block; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
            Encryption Standard
          </span>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <label :style="{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', border: algorithm === 'AES-256' ? '2px solid #e11d48' : '1px solid #cbd5e1', background: algorithm === 'AES-256' ? '#fff1f2' : '#ffffff' }">
              <input type="radio" v-model="algorithm" value="AES-256" style="margin: 0;" />
              <div>
                <strong style="display: block; font-size: 13px; color: #0f172a;">AES-256</strong>
                <small style="display: block; font-size: 11px; color: #64748b;">Bank-grade (Modern)</small>
              </div>
            </label>
            <label :style="{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', border: algorithm === 'RC4' ? '2px solid #e11d48' : '1px solid #cbd5e1', background: algorithm === 'RC4' ? '#fff1f2' : '#ffffff' }">
              <input type="radio" v-model="algorithm" value="RC4" style="margin: 0;" />
              <div>
                <strong style="display: block; font-size: 13px; color: #0f172a;">RC4 128-bit</strong>
                <small style="display: block; font-size: 11px; color: #64748b;">Legacy readers</small>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="!alreadyEncrypted" class="stage-actions">
        <button
          type="button"
          class="primary-button"
          :disabled="!canProtect"
          style="min-width: 180px;"
          @click="protectDocument"
        >
          <Lock :size="18" /> Protect PDF
        </button>
        <button type="button" class="text-button" :disabled="busy" @click="clear()">
          Cancel
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
        aria-label="Upload PDF to protect with password"
        @click="input?.click()"
        @keydown.enter.space.prevent="input?.click()"
        @dragenter.prevent="dragEnter"
        @dragover.prevent="dragOver"
        @dragleave.prevent="dragLeave"
        @drop.prevent="drop"
      >
        <div class="drop-zone-icon" style="background: linear-gradient(135deg, #f43f5e, #be123c); color: #fff; width: 64px; height: 64px; border-radius: 18px; display: grid; place-items: center; margin: 0 auto 16px;">
          <LockKeyhole :size="32" />
        </div>
        <h3>Select a PDF to Protect</h3>
        <p>Drag and drop your PDF here, or click to browse files up to 20 MB.</p>
        <button ref="uploadButton" type="button" class="primary-button" style="margin-top: 14px;">
          <Upload :size="18" /> Choose PDF file
        </button>
        <span class="drop-zone-hint" style="display: block; margin-top: 14px; font-size: 12px; color: #94a3b8;">
          🔒 Files are encrypted client-side. Your password and files never leave your browser.
        </span>
      </div>
    </template>

    <!-- Progress / Busy Overlay -->
    <div v-if="busy" class="busy-overlay" role="status" aria-live="polite">
      <LoaderCircle class="spin" :size="38" />
      <p><strong>{{ progress || 'Encrypting document…' }}</strong></p>
      <button class="text-button" type="button" @click="cancel">Cancel</button>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner" role="alert" style="margin-top: 16px; display: flex; gap: 10px; align-items: center;">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
    </div>
  </section>
</template>

