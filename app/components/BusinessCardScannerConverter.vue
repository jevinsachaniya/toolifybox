<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef } from 'vue';
import {
  Camera,
  Check,
  CheckCheck,
  CircleAlert,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  IdCard,
  Image as ImageIcon,
  Languages,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  RotateCw,
  Search,
  Share2,
  Sparkles,
  SwitchCamera,
  Trash2,
  Upload,
  User,
  X,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import {
  createEmptyCardData,
  generateCsvData,
  generateExcelWorkbook,
  generateVCard,
  SAMPLE_BUSINESS_CARDS,
  scanBusinessCardImages,
  validateBusinessCardFile,
} from '~/utils/business-card-scanner.js';

// State
const frontFile = shallowRef(null);
const backFile = shallowRef(null);
const frontPreview = ref('');
const backPreview = ref('');

const busy = ref(false);
const progress = ref('');
const error = ref('');
const toastMessage = ref('');
const language = ref('auto');
const enhanceImage = ref(true); // Auto-enhances contrast, upscales & inverts dark cards for sharp OCR

const activeCard = ref(null); // Current card being edited/reviewed
const scannedCards = ref([]); // Array of all cards accumulated for export
const searchQuery = ref('');
const isEditingCard = ref(false);
const frontInput = ref(null);
const backInput = ref(null);

// Camera Live Scanner State
const cameraModalOpen = ref(false);
const cameraTargetSide = ref('front'); // 'front' | 'back'
const cameraStream = shallowRef(null);
const cameraVideo = ref(null);
const cameraFacingMode = ref('environment'); // 'environment' (rear camera) | 'user' (selfie camera)
const cameraLoading = ref(false);
const cameraError = ref('');
const capturedPhotoBlob = shallowRef(null);
const capturedPhotoPreview = ref('');
const hasMultipleCameras = ref(false);

let request = null;
let toastTimer = null;
let active = true;

const stage = computed(() => {
  if (scannedCards.value.length > 0 || activeCard.value) return 3;
  if (frontFile.value || backFile.value) return 2;
  return 1;
});

const filteredCards = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return scannedCards.value;
  return scannedCards.value.filter(c =>
    (c.name || '').toLowerCase().includes(q) ||
    (c.company || '').toLowerCase().includes(q) ||
    (c.title || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q) ||
    (c.phone || '').toLowerCase().includes(q) ||
    (c.city || '').toLowerCase().includes(q)
  );
});

function showToast(msg) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
}

function handleFrontSelect(event) {
  const file = event.target?.files?.[0];
  if (!file) return;
  const err = validateBusinessCardFile(file);
  if (err) {
    error.value = err;
    return;
  }
  error.value = '';
  if (frontPreview.value && frontPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(frontPreview.value);
  }
  frontFile.value = file;
  frontPreview.value = URL.createObjectURL(file);
  event.target.value = '';
}

function handleBackSelect(event) {
  const file = event.target?.files?.[0];
  if (!file) return;
  const err = validateBusinessCardFile(file);
  if (err) {
    error.value = err;
    return;
  }
  error.value = '';
  if (backPreview.value && backPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(backPreview.value);
  }
  backFile.value = file;
  backPreview.value = URL.createObjectURL(file);
  event.target.value = '';
}

function removeFront() {
  if (frontPreview.value && frontPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(frontPreview.value);
  }
  frontFile.value = null;
  frontPreview.value = '';
}

function removeBack() {
  if (backPreview.value && backPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(backPreview.value);
  }
  backFile.value = null;
  backPreview.value = '';
}

// Camera Scanner Methods
async function checkCamerasCount() {
  if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      hasMultipleCameras.value = videoInputs.length > 1;
    } catch {
      hasMultipleCameras.value = false;
    }
  }
}

async function openCamera(side = 'front') {
  cameraTargetSide.value = side;
  if (capturedPhotoPreview.value && capturedPhotoPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(capturedPhotoPreview.value);
  }
  capturedPhotoBlob.value = null;
  capturedPhotoPreview.value = '';
  cameraError.value = '';
  cameraModalOpen.value = true;
  await nextTick();
  await startCameraStream();
  await checkCamerasCount();
}

async function startCameraStream() {
  stopCameraStream();

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    cameraError.value = 'Camera API is not supported in this browser or requires a secure HTTPS connection.';
    return;
  }

  cameraLoading.value = true;
  cameraError.value = '';

  try {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: cameraFacingMode.value },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false,
      });
    } catch {
      // Fallback without strict resolution constraints
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode.value },
        audio: false,
      });
    }

    cameraStream.value = stream;
    await nextTick();
    if (cameraVideo.value) {
      cameraVideo.value.srcObject = stream;
      await cameraVideo.value.play().catch(() => {});
    }
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      cameraError.value = 'Camera permission denied. Please allow camera access in your browser to capture cards.';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      cameraError.value = 'No camera found on this device.';
    } else {
      cameraError.value = `Unable to open camera: ${err.message || 'Unknown error'}`;
    }
  } finally {
    cameraLoading.value = false;
  }
}

function stopCameraStream() {
  if (cameraStream.value) {
    try {
      const tracks = cameraStream.value.getTracks();
      tracks.forEach(t => t.stop());
    } catch {}
    cameraStream.value = null;
  }
  if (cameraVideo.value) {
    cameraVideo.value.srcObject = null;
  }
}

function closeCameraModal() {
  stopCameraStream();
  if (capturedPhotoPreview.value && capturedPhotoPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(capturedPhotoPreview.value);
  }
  capturedPhotoBlob.value = null;
  capturedPhotoPreview.value = '';
  cameraModalOpen.value = false;
  cameraError.value = '';
}

async function switchCameraFacing() {
  cameraFacingMode.value = cameraFacingMode.value === 'environment' ? 'user' : 'environment';
  await startCameraStream();
}

function setCameraTargetSide(side) {
  cameraTargetSide.value = side;
  if (capturedPhotoBlob.value) {
    retakePhoto();
  }
}

function capturePhoto() {
  const video = cameraVideo.value;
  if (!video || !video.videoWidth || !video.videoHeight) {
    cameraError.value = 'Camera not ready yet. Please wait a moment.';
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(blob => {
    if (!blob) return;
    capturedPhotoBlob.value = blob;
    if (capturedPhotoPreview.value && capturedPhotoPreview.value.startsWith('blob:')) {
      URL.revokeObjectURL(capturedPhotoPreview.value);
    }
    capturedPhotoPreview.value = URL.createObjectURL(blob);
  }, 'image/jpeg', 0.95);
}

function retakePhoto() {
  if (capturedPhotoPreview.value && capturedPhotoPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(capturedPhotoPreview.value);
  }
  capturedPhotoBlob.value = null;
  capturedPhotoPreview.value = '';
}

function acceptCapturedPhoto() {
  if (!capturedPhotoBlob.value) return;

  const side = cameraTargetSide.value;
  const filename = `business-card-${side}-${Date.now()}.jpg`;
  const file = new File([capturedPhotoBlob.value], filename, { type: 'image/jpeg' });

  if (side === 'front') {
    if (frontPreview.value && frontPreview.value.startsWith('blob:')) {
      URL.revokeObjectURL(frontPreview.value);
    }
    frontFile.value = file;
    frontPreview.value = URL.createObjectURL(file);
    showToast('Front side photo captured from camera!');
  } else {
    if (backPreview.value && backPreview.value.startsWith('blob:')) {
      URL.revokeObjectURL(backPreview.value);
    }
    backFile.value = file;
    backPreview.value = URL.createObjectURL(file);
    showToast('Back side photo captured from camera!');
  }

  closeCameraModal();
}

function loadSampleCard() {
  const sample = JSON.parse(JSON.stringify(SAMPLE_BUSINESS_CARDS[0]));
  sample.id = `card-${Date.now()}`;
  activeCard.value = sample;
  if (!scannedCards.value.some(c => c.name === sample.name)) {
    scannedCards.value.push(sample);
  }
  showToast('Loaded sample business card!');
}

function loadAllSampleCards() {
  scannedCards.value = JSON.parse(JSON.stringify(SAMPLE_BUSINESS_CARDS));
  activeCard.value = scannedCards.value[0];
  showToast('Loaded 3 sample business cards into table!');
}

async function startScan() {
  if (!frontFile.value && !backFile.value) {
    error.value = 'Please upload at least the Front side of your business card.';
    return;
  }

  error.value = '';
  busy.value = true;
  progress.value = 'Preparing OCR engine on your device…';

  const controller = new AbortController();
  request = controller;

  const runtimeConfig = useRuntimeConfig();
  const baseURL = runtimeConfig.app?.baseURL || '/';
  const ocrVersion = runtimeConfig.public?.ocrVersion || '7.0.0';

  try {
    const cardData = await scanBusinessCardImages({
      frontFile: frontFile.value,
      backFile: backFile.value,
      language: language.value,
      baseURL,
      ocrVersion,
      enhanceImage: enhanceImage.value,
      signal: controller.signal,
      onProgress: msg => {
        if (active) progress.value = msg;
      },
    });

    if (active && !controller.signal.aborted) {
      activeCard.value = cardData;
      // Automatically add or update in table
      const existingIdx = scannedCards.value.findIndex(c => c.id === cardData.id);
      if (existingIdx >= 0) {
        scannedCards.value[existingIdx] = cardData;
      } else {
        scannedCards.value.unshift(cardData);
      }

      showToast(`Extracted details for "${cardData.name || cardData.company || 'Business Card'}"!`);
      // Clear uploaded files so user can easily upload the next card
      removeFront();
      removeBack();
    }
  } catch (err) {
    if (active && err.name !== 'AbortError') {
      error.value = err.message || 'We could not scan this business card. Try a clearer photo.';
    }
  } finally {
    if (request === controller) request = null;
    if (active) {
      busy.value = false;
      progress.value = '';
    }
  }
}

function saveActiveCard() {
  if (!activeCard.value) return;
  const idx = scannedCards.value.findIndex(c => c.id === activeCard.value.id);
  if (idx >= 0) {
    scannedCards.value[idx] = { ...activeCard.value };
  } else {
    scannedCards.value.unshift({ ...activeCard.value });
  }
  isEditingCard.value = false;
  showToast('Card details saved to table!');
}

function editCard(card) {
  activeCard.value = { ...card };
  isEditingCard.value = true;
  // Scroll to editor smoothly
  const el = document.getElementById('card-editor');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function deleteCard(id) {
  scannedCards.value = scannedCards.value.filter(c => c.id !== id);
  if (activeCard.value?.id === id) {
    activeCard.value = scannedCards.value[0] || null;
  }
  showToast('Card removed from table.');
}

function clearAllCards() {
  scannedCards.value = [];
  activeCard.value = null;
  removeFront();
  removeBack();
  showToast('Table cleared.');
}

async function exportExcel() {
  if (!scannedCards.value.length) return;
  try {
    const { blob, filename } = await generateExcelWorkbook(scannedCards.value, {
      filename: `business-cards-${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename} successfully!`);
  } catch (e) {
    error.value = 'Failed to generate Excel file: ' + e.message;
  }
}

function exportCsv() {
  if (!scannedCards.value.length) return;
  const { blob, filename } = generateCsvData(scannedCards.value, {
    filename: `business-cards-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${filename}!`);
}

function exportVCard() {
  if (!scannedCards.value.length) return;
  const { blob, filename } = generateVCard(scannedCards.value, {
    filename: `contacts-${new Date().toISOString().slice(0, 10)}.vcf`,
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Downloaded contacts (.vcf) ready to import to Phone!`);
}

async function copyTableToClipboard() {
  if (!scannedCards.value.length) return;
  const headers = ['#', 'Full Name', 'Job Title', 'Company', 'Primary Mobile', 'Office Phone', 'Extra Phone', 'Email', 'Website', 'Full Address', 'City', 'State', 'GSTIN'];
  const rows = [headers.join('\t')];
  scannedCards.value.forEach((c, idx) => {
    rows.push([
      idx + 1,
      c.name || '',
      c.title || '',
      c.company || '',
      c.phone || '',
      c.phone2 || '',
      c.phone3 || '',
      c.email || '',
      c.website || '',
      c.address || '',
      c.city || '',
      c.state || '',
      c.gstin || '',
    ].join('\t'));
  });
  try {
    await navigator.clipboard.writeText(rows.join('\n'));
    showToast('Copied all card data to clipboard! Paste directly into Excel or Google Sheets.');
  } catch {
    showToast('Could not copy to clipboard.');
  }
}

async function copyRawText() {
  if (!activeCard.value?.rawText) return;
  try {
    await navigator.clipboard.writeText(activeCard.value.rawText);
    showToast('Copied raw card text to clipboard!');
  } catch {
    showToast('Could not copy raw text.');
  }
}

onBeforeUnmount(() => {
  active = false;
  request?.abort();
  if (toastTimer) clearTimeout(toastTimer);
  removeFront();
  removeBack();
  stopCameraStream();
  if (capturedPhotoPreview.value && capturedPhotoPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(capturedPhotoPreview.value);
  }
});
</script>

<template>
  <section
    id="converter"
    class="converter bcs-converter"
    :class="{ 'is-converting': busy, 'has-data': scannedCards.length > 0 }"
    aria-label="Business Card to Excel converter"
    :aria-busy="busy"
  >
    <!-- Heading -->
    <div class="converter-heading">
      <div>
        <span class="mini-label">AI DUAL-SIDE SCANNER</span>
        <h2>Business Card Scanner</h2>
      </div>
      <span class="free-badge">Free to use</span>
    </div>

    <!-- Step Track -->
    <ol class="step-track" aria-label="Business card conversion steps">
      <li
        v-for="(label, index) in ['Upload Photos (Front & Back)', 'Review Extracted Details', 'Download Excel Sheet']"
        :key="label"
        :class="{ current: stage === index + 1, complete: stage > index + 1 }"
      >
        <span>
          <Check v-if="stage > index + 1" :size="12" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        {{ label }}
      </li>
    </ol>

    <!-- Upload Dual-Side Cards Section -->
    <div class="bcs-upload-container">
      <div class="bcs-upload-grid">
        <!-- Front Side Box -->
        <div class="bcs-side-box" :class="{ 'has-file': frontPreview }">
          <div class="bcs-side-header">
            <div class="bcs-side-title">
              <strong>Front Side Photo</strong>
              <span class="side-badge required">Required</span>
            </div>
            <button
              type="button"
              class="bcs-mini-cam-link"
              title="Capture front side with camera"
              :disabled="busy"
              @click="openCamera('front')"
            >
              <Camera :size="13" /> Camera
            </button>
          </div>

          <div v-if="frontPreview" class="bcs-preview-wrap">
            <img :src="frontPreview" alt="Front side card preview" />
            <div class="bcs-preview-top-actions">
              <button
                type="button"
                class="bcs-icon-cam-btn"
                title="Retake photo with camera"
                :disabled="busy"
                @click="openCamera('front')"
              >
                <Camera :size="14" />
              </button>
              <button
                type="button"
                class="bcs-remove-btn"
                title="Remove front side photo"
                :disabled="busy"
                @click="removeFront"
              >
                <X :size="15" />
              </button>
            </div>
            <span class="bcs-file-name">{{ frontFile?.name }}</span>
          </div>

          <div
            v-else
            class="bcs-drop-slot"
            tabindex="0"
            role="button"
            aria-label="Upload Front Side Photo"
            @click="frontInput?.click()"
            @keydown.enter.prevent="frontInput?.click()"
          >
            <div class="bcs-slot-icon">
              <IdCard :size="26" />
            </div>
            <p><strong>Upload Front Side</strong></p>
            <small>Drop photo here or choose an option below</small>

            <div class="bcs-slot-actions" @click.stop>
              <button
                type="button"
                class="bcs-slot-action-btn camera-btn"
                :disabled="busy"
                @click="openCamera('front')"
              >
                <Camera :size="13" /> Click with Camera
              </button>
              <button
                type="button"
                class="bcs-slot-action-btn browse-btn"
                :disabled="busy"
                @click="frontInput?.click()"
              >
                <Upload :size="13" /> Browse File
              </button>
            </div>

            <input
              ref="frontInput"
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp,.bmp"
              class="visually-hidden"
              @change="handleFrontSelect"
            />
          </div>
        </div>

        <!-- Back Side Box -->
        <div class="bcs-side-box" :class="{ 'has-file': backPreview }">
          <div class="bcs-side-header">
            <div class="bcs-side-title">
              <strong>Back Side Photo</strong>
              <span class="side-badge optional">Optional</span>
            </div>
            <button
              type="button"
              class="bcs-mini-cam-link"
              title="Capture back side with camera"
              :disabled="busy"
              @click="openCamera('back')"
            >
              <Camera :size="13" /> Camera
            </button>
          </div>

          <div v-if="backPreview" class="bcs-preview-wrap">
            <img :src="backPreview" alt="Back side card preview" />
            <div class="bcs-preview-top-actions">
              <button
                type="button"
                class="bcs-icon-cam-btn"
                title="Retake back side with camera"
                :disabled="busy"
                @click="openCamera('back')"
              >
                <Camera :size="14" />
              </button>
              <button
                type="button"
                class="bcs-remove-btn"
                title="Remove back side photo"
                :disabled="busy"
                @click="removeBack"
              >
                <X :size="15" />
              </button>
            </div>
            <span class="bcs-file-name">{{ backFile?.name }}</span>
          </div>

          <div
            v-else
            class="bcs-drop-slot"
            tabindex="0"
            role="button"
            aria-label="Upload Back Side Photo"
            @click="backInput?.click()"
            @keydown.enter.prevent="backInput?.click()"
          >
            <div class="bcs-slot-icon">
              <RotateCw :size="26" />
            </div>
            <p><strong>Upload Back Side</strong></p>
            <small>For cards with addresses or notes on back</small>

            <div class="bcs-slot-actions" @click.stop>
              <button
                type="button"
                class="bcs-slot-action-btn camera-btn"
                :disabled="busy"
                @click="openCamera('back')"
              >
                <Camera :size="13" /> Click with Camera
              </button>
              <button
                type="button"
                class="bcs-slot-action-btn browse-btn"
                :disabled="busy"
                @click="backInput?.click()"
              >
                <Upload :size="13" /> Browse File
              </button>
            </div>

            <input
              ref="backInput"
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp,.bmp"
              class="visually-hidden"
              @change="handleBackSelect"
            />
          </div>
        </div>
      </div>

      <!-- Control Bar: Language, Sample button, Scan button -->
      <div class="bcs-actions-bar">
        <div class="bcs-actions-left">
          <div class="bcs-lang-select">
            <label for="bcs-language">OCR Language:</label>
            <select id="bcs-language" v-model="language" :disabled="busy">
              <option value="auto">Auto Detect (English + Indian)</option>
              <option value="eng">English Only</option>
              <option value="hin">Hindi (हिन्दी)</option>
              <option value="guj">Gujarati (ગુજરાતી)</option>
              <option value="eng+hin">English + Hindi</option>
              <option value="eng+guj">English + Gujarati</option>
            </select>
          </div>

          <label class="bcs-enhance-toggle" title="Auto-upscales image, optimizes contrast, and inverts dark cards for sharp, accurate text recognition">
            <input v-model="enhanceImage" type="checkbox" :disabled="busy" />
            <span>Auto-Enhance Sharpness</span>
          </label>
        </div>

        <div class="bcs-buttons-group">
          <button
            type="button"
            class="text-button bcs-sample-btn"
            :disabled="busy"
            @click="loadSampleCard"
          >
            <Sparkles :size="15" /> Try Sample Card
          </button>

          <button
            type="button"
            class="primary-button bcs-scan-button"
            :disabled="busy || (!frontFile && !backFile)"
            @click="startScan"
          >
            <LoaderCircle v-if="busy" class="spinning" :size="17" />
            <Sparkles v-else :size="17" />
            {{ busy ? 'Scanning Details…' : 'Scan Card & Extract Details' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Scanning Progress Indicator -->
    <div v-if="busy" class="bcs-progress-panel" role="status">
      <div class="progress-track"><span /></div>
      <p><LoaderCircle class="spinning" :size="15" /> {{ progress }}</p>
      <button type="button" class="text-button cancel-conversion" @click="request?.abort()">
        Cancel
      </button>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="error-message" role="alert">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
    </div>

    <!-- Toast Notification -->
    <div v-if="toastMessage" class="bcs-toast" role="status">
      <Check :size="15" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- Extracted Card Details Form (Card Editor) -->
    <div v-if="activeCard" id="card-editor" class="bcs-editor-card">
      <div class="bcs-editor-header">
        <div>
          <h3>
            <IdCard :size="19" />
            {{ isEditingCard ? 'Edit Card Details' : 'Extracted Card Details' }}
          </h3>
          <p>Review or edit the recognized fields below. Changes automatically update your Excel export.</p>
        </div>
        <div class="bcs-editor-actions">
          <button type="button" class="secondary-button" @click="saveActiveCard">
            <CheckCheck :size="15" /> Save to Table
          </button>
        </div>
      </div>

      <div class="bcs-form-grid">
        <div class="bcs-form-group">
          <label>Full Name</label>
          <input v-model="activeCard.name" type="text" placeholder="e.g. Dr. Rajesh Sharma" />
        </div>

        <div class="bcs-form-group">
          <label>Job Title / Designation</label>
          <input v-model="activeCard.title" type="text" placeholder="e.g. Senior Consultant Cardiologist" />
        </div>

        <div class="bcs-form-group">
          <label>Company / Organization</label>
          <input v-model="activeCard.company" type="text" placeholder="e.g. Apex Heart &amp; Vascular Institute" />
        </div>

        <div class="bcs-form-group">
          <label>Primary Mobile Phone</label>
          <input v-model="activeCard.phone" type="tel" placeholder="e.g. +91 98250 12345" />
        </div>

        <div class="bcs-form-group">
          <label>Office / Second Phone</label>
          <input v-model="activeCard.phone2" type="tel" placeholder="e.g. +91 98250 67890 or 079-22871234" />
        </div>

        <div class="bcs-form-group">
          <label>Alternate / Extra Phone</label>
          <input v-model="activeCard.phone3" type="tel" placeholder="e.g. Landline, Toll-Free, or WhatsApp" />
        </div>

        <div class="bcs-form-group">
          <label>Email Address</label>
          <input v-model="activeCard.email" type="email" placeholder="e.g. doctor@apexheart.in" />
        </div>

        <div class="bcs-form-group">
          <label>Website URL</label>
          <input v-model="activeCard.website" type="text" placeholder="e.g. www.apexheart.in" />
        </div>

        <div class="bcs-form-group">
          <label>GSTIN / Tax ID</label>
          <input v-model="activeCard.gstin" type="text" placeholder="e.g. 24AAACG1234A1Z5" />
        </div>

        <div class="bcs-form-group">
          <label>PAN Number</label>
          <input v-model="activeCard.pan" type="text" placeholder="e.g. AAACG1234A" />
        </div>

        <div class="bcs-form-group full-width">
          <label>Full Address</label>
          <input v-model="activeCard.address" type="text" placeholder="e.g. Plot 45, Sector 18, Gurugram, Haryana" />
        </div>

        <div class="bcs-form-group">
          <label>City</label>
          <input v-model="activeCard.city" type="text" placeholder="e.g. Gurugram" />
        </div>

        <div class="bcs-form-group">
          <label>State / Province</label>
          <input v-model="activeCard.state" type="text" placeholder="e.g. Haryana" />
        </div>

        <div class="bcs-form-group">
          <label>ZIP / PIN Code</label>
          <input v-model="activeCard.postalCode" type="text" placeholder="e.g. 122002" />
        </div>

        <div class="bcs-form-group">
          <label>Country</label>
          <input v-model="activeCard.country" type="text" placeholder="e.g. India" />
        </div>

        <div class="bcs-form-group full-width">
          <label>Social Links</label>
          <input v-model="activeCard.social" type="text" placeholder="e.g. linkedin.com/in/doctor" />
        </div>

        <div class="bcs-form-group full-width">
          <label>Notes / Other Card Info</label>
          <textarea v-model="activeCard.notes" rows="2" placeholder="Services, taglines, registrations, or timings"></textarea>
        </div>
      </div>

      <!-- Raw OCR Text Inspector -->
      <details v-if="activeCard.rawText" class="bcs-raw-text-details">
        <summary>
          <FileText :size="14" />
          <span>Inspect Raw OCR Text (Front &amp; Back)</span>
        </summary>
        <div class="bcs-raw-text-box">
          <pre>{{ activeCard.rawText }}</pre>
          <button type="button" class="text-button copy-raw-btn" @click="copyRawText">
            <Copy :size="13" /> Copy Raw OCR Text
          </button>
        </div>
      </details>
    </div>

    <!-- Scanned Cards Excel Table Section -->
    <div v-if="scannedCards.length > 0" class="bcs-table-section">
      <div class="bcs-table-toolbar">
        <div class="bcs-toolbar-left">
          <h3>
            <FileSpreadsheet :size="18" />
            Cards Ready to Export ({{ scannedCards.length }})
          </h3>
          <div class="bcs-search-input">
            <Search :size="14" />
            <input v-model="searchQuery" type="text" placeholder="Filter by name, company, phone…" />
            <button v-if="searchQuery" type="button" class="clear-search-btn" @click="searchQuery = ''">
              <X :size="12" />
            </button>
          </div>
        </div>

        <!-- Export Buttons Group -->
        <div class="bcs-export-buttons">
          <button type="button" class="primary-button excel-btn" title="Download Excel .xlsx file" @click="exportExcel">
            <Download :size="16" /> Download Excel (.xlsx)
          </button>
          <button type="button" class="secondary-button" title="Download CSV file" @click="exportCsv">
            <FileText :size="15" /> CSV
          </button>
          <button type="button" class="secondary-button" title="Download vCard for Phone contacts" @click="exportVCard">
            <Share2 :size="15" /> vCard (.vcf)
          </button>
          <button type="button" class="icon-button" title="Copy table to clipboard" @click="copyTableToClipboard">
            <Copy :size="16" />
          </button>
          <button type="button" class="icon-button danger-button" title="Clear all cards" @click="clearAllCards">
            <Trash2 :size="16" />
          </button>
        </div>
      </div>

      <!-- Interactive Data Table -->
      <div class="bcs-table-wrapper">
        <table class="bcs-cards-table">
          <thead>
            <tr>
              <th style="width: 44px">#</th>
              <th>Full Name</th>
              <th>Job Title</th>
              <th>Company</th>
              <th>Phone(s)</th>
              <th>Email</th>
              <th>City / Location</th>
              <th style="width: 90px; text-align: center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(card, idx) in filteredCards"
              :key="card.id"
              :class="{ 'is-active': activeCard?.id === card.id }"
              @click="editCard(card)"
            >
              <td class="col-num">{{ idx + 1 }}</td>
              <td class="col-name">
                <strong>{{ card.name || '—' }}</strong>
              </td>
              <td>{{ card.title || '—' }}</td>
              <td>{{ card.company || '—' }}</td>
              <td class="col-phone">
                <div>{{ card.phone || '—' }}</div>
                <div v-if="card.phone2" class="secondary-phone">{{ card.phone2 }}</div>
                <div v-if="card.phone3" class="secondary-phone muted">{{ card.phone3 }}</div>
              </td>
              <td class="col-email">{{ card.email || '—' }}</td>
              <td>{{ card.city ? (card.state ? `${card.city}, ${card.state}` : card.city) : (card.state || card.address || '—') }}</td>
              <td class="col-actions" @click.stop>
                <button
                  type="button"
                  class="table-action-btn"
                  title="Edit Card"
                  @click="editCard(card)"
                >
                  <Pencil :size="13" />
                </button>
                <button
                  type="button"
                  class="table-action-btn delete"
                  title="Delete Card"
                  @click="deleteCard(card.id)"
                >
                  <Trash2 :size="13" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bcs-table-footer">
        <span>Showing {{ filteredCards.length }} of {{ scannedCards.length }} cards.</span>
        <button type="button" class="text-button" @click="loadAllSampleCards">
          + Load 3 Sample Cards
        </button>
      </div>
    </div>

    <!-- Assurance -->
    <div class="converter-assurance">
      <Sparkles :size="14" />
      <span>All OCR recognition and Excel files are generated 100% locally on your device. Zero server uploads.</span>
    </div>

    <!-- Live Camera Business Card Scanner Modal -->
    <div
      v-if="cameraModalOpen"
      class="bcs-camera-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Camera Business Card Scanner"
      @click.self="closeCameraModal"
    >
      <div class="bcs-camera-dialog">
        <!-- Modal Header -->
        <div class="bcs-camera-header">
          <div class="bcs-camera-title">
            <Camera :size="18" />
            <div>
              <h3>Scan Card with Camera</h3>
              <p>Align card inside the frame for maximum OCR sharpness</p>
            </div>
          </div>

          <div class="bcs-camera-header-right">
            <!-- Side Toggle Switch: Front vs Back -->
            <div class="bcs-camera-side-toggle">
              <button
                type="button"
                :class="{ active: cameraTargetSide === 'front' }"
                @click="setCameraTargetSide('front')"
              >
                Front Side
              </button>
              <button
                type="button"
                :class="{ active: cameraTargetSide === 'back' }"
                @click="setCameraTargetSide('back')"
              >
                Back Side
              </button>
            </div>

            <button
              type="button"
              class="bcs-camera-close-btn"
              title="Close Camera"
              aria-label="Close"
              @click="closeCameraModal"
            >
              <X :size="18" />
            </button>
          </div>
        </div>

        <!-- Viewfinder / Video Container -->
        <div class="bcs-camera-body">
          <!-- Loading state -->
          <div v-if="cameraLoading" class="bcs-camera-loading">
            <LoaderCircle class="spinning" :size="32" />
            <p>Accessing camera feed…</p>
          </div>

          <!-- Error state -->
          <div v-if="cameraError" class="bcs-camera-error-banner">
            <CircleAlert :size="24" />
            <div>
              <strong>Camera Unavailable</strong>
              <p>{{ cameraError }}</p>
            </div>
            <button type="button" class="secondary-button" @click="startCameraStream">
              <RefreshCw :size="14" /> Retry Camera
            </button>
          </div>

          <!-- Live Video Stream -->
          <div v-show="!capturedPhotoPreview && !cameraError" class="bcs-video-wrapper">
            <video
              ref="cameraVideo"
              autoplay
              playsinline
              muted
              class="bcs-live-video"
            ></video>

            <!-- Card Framing Guide Overlay -->
            <div class="bcs-card-guide">
              <div class="card-bracket tl" />
              <div class="card-bracket tr" />
              <div class="card-bracket bl" />
              <div class="card-bracket br" />
              <span class="card-guide-label">Align {{ cameraTargetSide === 'front' ? 'Front' : 'Back' }} Card Here</span>
            </div>
          </div>

          <!-- Captured Photo Review Preview -->
          <div v-if="capturedPhotoPreview" class="bcs-captured-wrapper">
            <img :src="capturedPhotoPreview" alt="Captured Card Preview" class="bcs-captured-img" />
            <div class="bcs-captured-badge">
              <Check :size="14" /> Photo Captured for {{ cameraTargetSide === 'front' ? 'Front' : 'Back' }} Side
            </div>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="bcs-camera-footer">
          <!-- Live Mode Actions -->
          <template v-if="!capturedPhotoPreview">
            <button
              v-if="hasMultipleCameras"
              type="button"
              class="secondary-button bcs-switch-cam-btn"
              title="Switch camera"
              @click="switchCameraFacing"
            >
              <SwitchCamera :size="16" /> Flip Camera
            </button>
            <div v-else class="bcs-footer-spacer" />

            <!-- Big Capture Shutter Button -->
            <button
              type="button"
              class="bcs-shutter-btn"
              title="Click to take photo"
              :disabled="cameraLoading || !!cameraError"
              @click="capturePhoto"
            >
              <span class="shutter-inner">
                <Camera :size="22" />
              </span>
            </button>

            <button
              type="button"
              class="text-button bcs-cancel-cam-btn"
              @click="closeCameraModal"
            >
              Cancel
            </button>
          </template>

          <!-- Captured Review Actions -->
          <template v-else>
            <button
              type="button"
              class="secondary-button"
              @click="retakePhoto"
            >
              <RotateCw :size="15" /> Retake Photo
            </button>

            <button
              type="button"
              class="primary-button"
              @click="acceptCapturedPhoto"
            >
              <CheckCheck :size="16" /> Use This Photo ({{ cameraTargetSide === 'front' ? 'Front' : 'Back' }})
            </button>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bcs-converter {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Upload Dual-Side Grid */
.bcs-upload-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
}

.bcs-upload-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 640px) {
  .bcs-upload-grid {
    grid-template-columns: 1fr;
  }
}

.bcs-side-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bcs-side-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13.5px;
  color: var(--text, #1e293b);
  min-height: 28px;
  gap: 8px;
}

.bcs-side-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.side-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 6px;
  letter-spacing: 0.03em;
}

.side-badge.required {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.side-badge.optional {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.bcs-mini-cam-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #2563eb;
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.bcs-mini-cam-link:hover {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

.bcs-slot-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  flex-wrap: wrap;
  justify-content: center;
}

.bcs-slot-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.bcs-slot-action-btn.camera-btn {
  background: #2563eb;
  color: #ffffff;
  border: 1px solid #1d4ed8;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
}

.bcs-slot-action-btn.camera-btn:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.bcs-slot-action-btn.browse-btn {
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.bcs-slot-action-btn.browse-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.bcs-preview-top-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 2;
}

.bcs-icon-cam-btn {
  background: rgba(0, 0, 0, 0.65);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.bcs-icon-cam-btn:hover {
  background: #2563eb;
}

.bcs-drop-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 26px 16px;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  min-height: 175px;
  transition: all 0.2s ease;
}

.bcs-drop-slot:hover {
  border-color: #3b82f6;
  background: #f0f7ff;
}

.bcs-slot-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  display: grid;
  place-items: center;
  margin-bottom: 8px;
}

.bcs-drop-slot:hover .bcs-slot-icon {
  background: #dbeafe;
  color: #2563eb;
}

.bcs-drop-slot p {
  margin: 0;
  font-size: 13.5px;
  color: #1e293b;
}

.bcs-drop-slot small {
  font-size: 11.5px;
  color: #64748b;
  margin-top: 3px;
}

.bcs-preview-wrap {
  position: relative;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
  height: 175px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bcs-preview-wrap img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.bcs-remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.65);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.bcs-remove-btn:hover {
  background: #ef4444;
}

.bcs-file-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  font-size: 10.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Actions Bar */
.bcs-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.bcs-actions-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.bcs-lang-select {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: #475569;
}

.bcs-lang-select select {
  height: 38px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  font-size: 12.5px;
  background: #ffffff;
  color: #1e293b;
  cursor: pointer;
}

.bcs-enhance-toggle {
  height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  user-select: none;
  background: #f8fafc;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.15s ease;
}

.bcs-enhance-toggle:hover {
  background: #e2e8f0;
}

.bcs-enhance-toggle input {
  cursor: pointer;
  accent-color: #2563eb;
  margin: 0;
}

.bcs-buttons-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.bcs-scan-button {
  height: 38px;
  padding: 0 20px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.bcs-sample-btn {
  font-size: 12.5px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #475569;
}

/* Progress Panel */
.bcs-progress-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  color: #166534;
  font-size: 13px;
}

.bcs-progress-panel p {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-weight: 500;
}

/* Toast */
.bcs-toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #10b981;
  color: #ffffff;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
}

/* Card Details Editor Form */
.bcs-editor-card {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
}

.bcs-editor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}

.bcs-editor-header h3 {
  margin: 0 0 4px;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text, #0f172a);
}

.bcs-editor-header p {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.bcs-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.bcs-form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bcs-form-group.full-width {
  grid-column: 1 / -1;
}

.bcs-form-group label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #475569;
}

.bcs-form-group input,
.bcs-form-group textarea {
  padding: 7px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 12.5px;
  background: var(--surface, #ffffff);
  color: var(--text, #1e293b);
  transition: border-color 0.15s ease;
}

.bcs-form-group input:focus,
.bcs-form-group textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

/* Raw OCR Text Inspector Details */
.bcs-raw-text-details {
  margin-top: 14px;
  border-top: 1px dashed #e2e8f0;
  padding-top: 12px;
}

.bcs-raw-text-details summary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  user-select: none;
}

.bcs-raw-text-details summary:hover {
  text-decoration: underline;
}

.bcs-raw-text-box {
  margin-top: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.bcs-raw-text-box pre {
  margin: 0 0 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: #334155;
  max-height: 220px;
  overflow-y: auto;
}

.copy-raw-btn {
  font-size: 11.5px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #475569;
}

/* Scanned Cards Table Section */
.bcs-table-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
}

.bcs-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.bcs-toolbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.bcs-toolbar-left h3 {
  margin: 0;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--text, #0f172a);
}

.bcs-search-input {
  position: relative;
  display: flex;
  align-items: center;
}

.bcs-search-input input {
  padding: 6px 26px 6px 28px;
  font-size: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  width: 210px;
}

.bcs-search-input svg:first-child {
  position: absolute;
  left: 8px;
  color: #94a3b8;
}

.clear-search-btn {
  position: absolute;
  right: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #94a3b8;
}

.bcs-export-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.excel-btn {
  background: #059669;
  border-color: #047857;
}

.excel-btn:hover {
  background: #047857;
}

.danger-button {
  color: #ef4444;
}

.bcs-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.bcs-cards-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  text-align: left;
}

.bcs-cards-table th {
  background: #f8fafc;
  padding: 10px 12px;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.bcs-cards-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

.bcs-cards-table tbody tr {
  cursor: pointer;
  transition: background 0.15s ease;
}

.bcs-cards-table tbody tr:hover {
  background: #f8fafc;
}

.bcs-cards-table tbody tr.is-active {
  background: #eff6ff;
}

.col-num {
  color: #94a3b8;
  font-weight: 600;
}

.col-name strong {
  color: #0f172a;
}

.col-phone {
  font-family: monospace;
  font-size: 11.5px;
}

.secondary-phone {
  font-size: 10.5px;
  color: #64748b;
  margin-top: 2px;
}

.secondary-phone.muted {
  color: #94a3b8;
}

.col-email {
  color: #2563eb;
}

.col-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.table-action-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.table-action-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.table-action-btn.delete:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}

.bcs-table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  color: #64748b;
  padding-top: 4px;
}

/* Dark mode */
html[data-theme='dark'] .bcs-upload-container,
html[data-theme='dark'] .bcs-editor-card,
html[data-theme='dark'] .bcs-table-section {
  background: #1e293b;
  border-color: #334155;
}

html[data-theme='dark'] .bcs-side-header,
html[data-theme='dark'] .bcs-editor-header h3,
html[data-theme='dark'] .bcs-toolbar-left h3,
html[data-theme='dark'] .col-name strong {
  color: #f1f5f9;
}

html[data-theme='dark'] .bcs-drop-slot {
  background: #0f172a;
  border-color: #334155;
}

html[data-theme='dark'] .bcs-drop-slot p {
  color: #f1f5f9;
}

html[data-theme='dark'] .bcs-form-group input,
html[data-theme='dark'] .bcs-form-group textarea,
html[data-theme='dark'] .bcs-search-input input,
html[data-theme='dark'] .bcs-lang-select select {
  background: #0f172a;
  border-color: #334155;
  color: #e2e8f0;
}

html[data-theme='dark'] .bcs-table-wrapper {
  border-color: #334155;
}

html[data-theme='dark'] .bcs-cards-table th {
  background: #0f172a;
  color: #94a3b8;
  border-color: #334155;
}

html[data-theme='dark'] .bcs-cards-table td {
  border-color: #334155;
  color: #cbd5e1;
}

html[data-theme='dark'] .bcs-cards-table tbody tr:hover {
  background: #334155;
}

html[data-theme='dark'] .bcs-cards-table tbody tr.is-active {
  background: #1e3a5f;
}

html[data-theme='dark'] .table-action-btn {
  background: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}

html[data-theme='dark'] .bcs-enhance-toggle {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

html[data-theme='dark'] .bcs-enhance-toggle:hover {
  background: #1e293b;
}

html[data-theme='dark'] .bcs-raw-text-details {
  border-top-color: #334155;
}

html[data-theme='dark'] .bcs-raw-text-box {
  background: #0f172a;
  border-color: #334155;
}

html[data-theme='dark'] .bcs-raw-text-box pre {
  color: #cbd5e1;
}

html[data-theme='dark'] .secondary-phone {
  color: #94a3b8;
}

html[data-theme='dark'] .bcs-slot-action-btn.browse-btn {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

html[data-theme='dark'] .bcs-slot-action-btn.browse-btn:hover {
  background: #1e293b;
  color: #f1f5f9;
}

html[data-theme='dark'] .bcs-mini-cam-link {
  background: #1e293b;
  border-color: #334155;
  color: #38bdf8;
}

html[data-theme='dark'] .bcs-mini-cam-link:hover {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

/* =========================================================================
   Live Camera Business Card Scanner Modal Styles
   ========================================================================= */
.bcs-camera-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  padding: 16px;
  animation: bcsFadeIn 0.2s ease-out;
}

@keyframes bcsFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.bcs-camera-dialog {
  background: #0f172a;
  color: #f8fafc;
  border: 1px solid #334155;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.bcs-camera-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #1e293b;
  gap: 12px;
  flex-wrap: wrap;
}

.bcs-camera-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bcs-camera-title svg {
  color: #38bdf8;
}

.bcs-camera-title h3 {
  margin: 0;
  font-size: 15px;
  color: #f8fafc;
}

.bcs-camera-title p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #94a3b8;
}

.bcs-camera-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bcs-camera-side-toggle {
  display: inline-flex;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 2px;
}

.bcs-camera-side-toggle button {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.bcs-camera-side-toggle button.active {
  background: #2563eb;
  color: #ffffff;
}

.bcs-camera-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  transition: all 0.15s ease;
}

.bcs-camera-close-btn:hover {
  background: #1e293b;
  color: #ffffff;
}

.bcs-camera-body {
  position: relative;
  background: #000000;
  min-height: 320px;
  max-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.bcs-camera-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #94a3b8;
  padding: 40px;
  font-size: 13px;
}

.bcs-camera-error-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  padding: 24px;
  color: #f87171;
}

.bcs-camera-error-banner strong {
  font-size: 14px;
}

.bcs-camera-error-banner p {
  margin: 0;
  font-size: 12px;
  color: #cbd5e1;
  max-width: 380px;
}

.bcs-video-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bcs-live-video {
  width: 100%;
  max-height: 55vh;
  object-fit: cover;
  display: block;
}

/* Card Framing Viewfinder Guide */
.bcs-card-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 78%;
  aspect-ratio: 1.58;
  border: 1.5px dashed rgba(255, 255, 255, 0.45);
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
}

.card-bracket {
  position: absolute;
  width: 22px;
  height: 22px;
  border-color: #38bdf8;
  border-style: solid;
}

.card-bracket.tl {
  top: -2px;
  left: -2px;
  border-width: 3px 0 0 3px;
  border-top-left-radius: 10px;
}

.card-bracket.tr {
  top: -2px;
  right: -2px;
  border-width: 3px 3px 0 0;
  border-top-right-radius: 10px;
}

.card-bracket.bl {
  bottom: -2px;
  left: -2px;
  border-width: 0 0 3px 3px;
  border-bottom-left-radius: 10px;
}

.card-bracket.br {
  bottom: -2px;
  right: -2px;
  border-width: 0 3px 3px 0;
  border-bottom-right-radius: 10px;
}

.card-guide-label {
  background: rgba(0, 0, 0, 0.65);
  color: #ffffff;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Captured Review Wrapper */
.bcs-captured-wrapper {
  position: relative;
  width: 100%;
  max-height: 55vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000000;
}

.bcs-captured-img {
  width: 100%;
  max-height: 55vh;
  object-fit: contain;
}

.bcs-captured-badge {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(16, 185, 129, 0.9);
  color: #ffffff;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(4px);
}

/* Modal Footer Actions */
.bcs-camera-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid #1e293b;
  background: #0b1120;
}

.bcs-footer-spacer {
  width: 90px;
}

.bcs-switch-cam-btn {
  font-size: 12px;
  background: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}

.bcs-switch-cam-btn:hover {
  background: #334155;
}

.bcs-shutter-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 4px solid #ffffff;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
  padding: 0;
}

.bcs-shutter-btn:hover:not(:disabled) {
  transform: scale(1.06);
}

.bcs-shutter-btn:active:not(:disabled) {
  transform: scale(0.94);
}

.bcs-shutter-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.shutter-inner {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #2563eb;
  color: #ffffff;
  display: grid;
  place-items: center;
  transition: background 0.15s ease;
}

.bcs-shutter-btn:hover .shutter-inner {
  background: #1d4ed8;
}

.bcs-cancel-cam-btn {
  color: #94a3b8;
  font-size: 13px;
}

.bcs-cancel-cam-btn:hover {
  color: #f8fafc;
}
</style>
