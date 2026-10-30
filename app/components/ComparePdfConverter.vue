<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Check,
  CheckCheck,
  CircleAlert,
  Columns2,
  Download,
  Eye,
  FileCheck,
  FileDiff,
  FileText,
  GitCompareArrows,
  Layers,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Split,
  Upload,
  X,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import { openPdfForImages } from '~/utils/pdf-images.js';
import {
  comparePdfFilename,
  computePixelDiff,
  computeTextDiff,
  generateComparisonPdfReport,
  validateComparePdfFiles,
} from '~/utils/compare-pdf.js';

// State for files
const fileA = shallowRef(null);
const fileB = shallowRef(null);
const busy = ref(false);
const error = ref('');
const progress = ref('');
const totalPages = ref(1);
const currentPage = ref(1);

// Comparison view mode: 'overlay' | 'slider' | 'side-by-side' | 'text'
const viewMode = ref('overlay');

// Slider position (0..100%) for wipe split view
const sliderPosition = ref(50);
const isDraggingSlider = ref(false);

// Per-page comparison data cache: pageNum -> { diffUrl, previewA, previewB, diffPercent, textA, textB, textDiff, width, height }
const pagesData = ref({});
const comparisonSummary = ref(null);
const resultPdf = ref(null);

let handleA = null;
let handleB = null;
let active = true;

const inputA = ref(null);
const inputB = ref(null);
const sliderContainer = ref(null);

const stage = computed(() => {
  if (resultPdf.value) return 3;
  if (comparisonSummary.value) return 2;
  return 1;
});

const isReadyToCompare = computed(() => fileA.value && fileB.value && !busy.value);

onBeforeUnmount(() => {
  active = false;
  cleanupResources();
});

function cleanupResources() {
  closeHandles();
  revokeAllUrls();
  if (resultPdf.value?.url) {
    URL.revokeObjectURL(resultPdf.value.url);
  }
}

function closeHandles() {
  if (handleA) {
    try { handleA.close(); } catch {}
    handleA = null;
  }
  if (handleB) {
    try { handleB.close(); } catch {}
    handleB = null;
  }
}

function revokeAllUrls() {
  for (const page of Object.values(pagesData.value)) {
    if (page.diffUrl) URL.revokeObjectURL(page.diffUrl);
    if (page.previewA) URL.revokeObjectURL(page.previewA);
    if (page.previewB) URL.revokeObjectURL(page.previewB);
  }
  pagesData.value = {};
}

function onFileASelected(e) {
  const f = e.target?.files?.[0];
  if (f) {
    error.value = '';
    fileA.value = f;
  }
}

function onFileBSelected(e) {
  const f = e.target?.files?.[0];
  if (f) {
    error.value = '';
    fileB.value = f;
  }
}

function swapDocuments() {
  if (busy.value) return;
  const temp = fileA.value;
  fileA.value = fileB.value;
  fileB.value = temp;
}

// Drag & Drop for Document A
const draggingA = ref(false);
function onDropA(e) {
  e.preventDefault();
  draggingA.value = false;
  const f = e.dataTransfer?.files?.[0];
  if (f) {
    error.value = '';
    fileA.value = f;
  }
}

// Drag & Drop for Document B
const draggingB = ref(false);
function onDropB(e) {
  e.preventDefault();
  draggingB.value = false;
  const f = e.dataTransfer?.files?.[0];
  if (f) {
    error.value = '';
    fileB.value = f;
  }
}

// Start comparison process
async function startComparison() {
  const valErr = validateComparePdfFiles(fileA.value, fileB.value);
  if (valErr) {
    error.value = valErr;
    return;
  }

  error.value = '';
  busy.value = true;
  progress.value = 'Opening documents…';
  cleanupResources();

  try {
    handleA = await openPdfForImages(fileA.value, {
      onProgress: (m) => { if (active) progress.value = `Doc A: ${m}`; },
    });
    handleB = await openPdfForImages(fileB.value, {
      onProgress: (m) => { if (active) progress.value = `Doc B: ${m}`; },
    });

    const maxP = Math.max(handleA.pageCount, handleB.pageCount);
    totalPages.value = maxP;
    currentPage.value = 1;

    progress.value = 'Comparing page 1…';
    await loadAndComparePage(1);

    comparisonSummary.value = {
      pagesCountA: handleA.pageCount,
      pagesCountB: handleB.pageCount,
      totalPages: maxP,
    };
  } catch (err) {
    console.error('Comparison error:', err);
    error.value = err.message || 'Could not compare documents. Please check that both files are valid PDFs.';
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

async function loadAndComparePage(pageNum) {
  if (pagesData.value[pageNum]) return; // already loaded and compared
  busy.value = true;
  progress.value = `Comparing page ${pageNum} of ${totalPages.value}…`;

  try {
    let imgBlobA = null;
    let imgBlobB = null;
    let canvasA = null;
    let canvasB = null;
    let width = 600;
    let height = 800;

    // Render page from Document A if it exists
    if (handleA && pageNum <= handleA.pageCount) {
      const resA = await handleA.renderPage(pageNum, { maxDimension: 1000, format: 'png', quality: 0.95 });
      imgBlobA = resA.blob;
      width = resA.width;
      height = resA.height;

      const imgA = new Image();
      imgA.src = URL.createObjectURL(imgBlobA);
      await new Promise(r => { imgA.onload = r; });

      canvasA = document.createElement('canvas');
      canvasA.width = imgA.naturalWidth;
      canvasA.height = imgA.naturalHeight;
      const ctxA = canvasA.getContext('2d');
      ctxA.drawImage(imgA, 0, 0);
    }

    // Render page from Document B if it exists
    if (handleB && pageNum <= handleB.pageCount) {
      const resB = await handleB.renderPage(pageNum, { maxDimension: 1000, format: 'png', quality: 0.95 });
      imgBlobB = resB.blob;
      if (!imgBlobA) {
        width = resB.width;
        height = resB.height;
      }

      const imgB = new Image();
      imgB.src = URL.createObjectURL(imgBlobB);
      await new Promise(r => { imgB.onload = r; });

      canvasB = document.createElement('canvas');
      canvasB.width = imgB.naturalWidth;
      canvasB.height = imgB.naturalHeight;
      const ctxB = canvasB.getContext('2d');
      ctxB.drawImage(imgB, 0, 0);
    }

    // Match canvas dimensions for comparison
    const targetW = Math.max(canvasA?.width || 0, canvasB?.width || 0) || 800;
    const targetH = Math.max(canvasA?.height || 0, canvasB?.height || 0) || 1100;

    const normCanvasA = document.createElement('canvas');
    normCanvasA.width = targetW;
    normCanvasA.height = targetH;
    const ctxNA = normCanvasA.getContext('2d');
    ctxNA.fillStyle = '#ffffff';
    ctxNA.fillRect(0, 0, targetW, targetH);
    if (canvasA) ctxNA.drawImage(canvasA, 0, 0);

    const normCanvasB = document.createElement('canvas');
    normCanvasB.width = targetW;
    normCanvasB.height = targetH;
    const ctxNB = normCanvasB.getContext('2d');
    ctxNB.fillStyle = '#ffffff';
    ctxNB.fillRect(0, 0, targetW, targetH);
    if (canvasB) ctxNB.drawImage(canvasB, 0, 0);

    const dataA = ctxNA.getImageData(0, 0, targetW, targetH);
    const dataB = ctxNB.getImageData(0, 0, targetW, targetH);

    // Compute pixel diff
    const diffRes = computePixelDiff(dataA, dataB, targetW, targetH);

    // Create diff canvas and blob
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = targetW;
    diffCanvas.height = targetH;
    const diffCtx = diffCanvas.getContext('2d');
    const diffImgData = diffCtx.createImageData(targetW, targetH);
    diffImgData.data.set(diffRes.diffData);
    diffCtx.putImageData(diffImgData, 0, 0);

    const diffBlob = await new Promise(resolve => diffCanvas.toBlob(resolve, 'image/png'));
    const diffUrl = URL.createObjectURL(diffBlob);

    const previewA = imgBlobA ? URL.createObjectURL(imgBlobA) : null;
    const previewB = imgBlobB ? URL.createObjectURL(imgBlobB) : null;

    // Simple text diff placeholder / extraction
    const sampleTextA = `Page ${pageNum} Content (Doc A)`;
    const sampleTextB = `Page ${pageNum} Content (Doc B)`;
    const textDiff = computeTextDiff(sampleTextA, sampleTextB);

    pagesData.value = {
      ...pagesData.value,
      [pageNum]: {
        diffUrl,
        diffBlob,
        previewA,
        previewB,
        diffPercent: diffRes.diffPercent,
        addedCount: diffRes.addedCount,
        removedCount: diffRes.removedCount,
        hasChanges: diffRes.diffPercent > 0.05,
        width,
        height,
        textDiff,
      },
    };
  } catch (err) {
    console.error(`Page ${pageNum} compare error:`, err);
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

async function goToPage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  await loadAndComparePage(page);
}

// Split Wipe Slider drag handling
function onSliderMouseDown(e) {
  e.preventDefault();
  isDraggingSlider.value = true;
  window.addEventListener('mousemove', onSliderMouseMove);
  window.addEventListener('mouseup', onSliderMouseUp);
}

function onSliderTouchStart(e) {
  isDraggingSlider.value = true;
  window.addEventListener('touchmove', onSliderTouchMove, { passive: false });
  window.addEventListener('touchend', onSliderMouseUp);
}

function onSliderMouseMove(e) {
  if (!isDraggingSlider.value || !sliderContainer.value) return;
  const rect = sliderContainer.value.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const pct = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
  sliderPosition.value = Math.round(pct);
}

function onSliderTouchMove(e) {
  if (!isDraggingSlider.value || !sliderContainer.value || !e.touches[0]) return;
  e.preventDefault();
  const rect = sliderContainer.value.getBoundingClientRect();
  const offsetX = e.touches[0].clientX - rect.left;
  const pct = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
  sliderPosition.value = Math.round(pct);
}

function onSliderMouseUp() {
  isDraggingSlider.value = false;
  window.removeEventListener('mousemove', onSliderMouseMove);
  window.removeEventListener('mouseup', onSliderMouseUp);
  window.removeEventListener('touchmove', onSliderTouchMove);
  window.removeEventListener('touchend', onSliderMouseUp);
}

// Export visual diff report
async function exportComparisonReport() {
  if (busy.value) return;
  busy.value = true;
  progress.value = 'Generating full visual comparison report…';

  try {
    // Ensure all pages are compared
    const diffPages = [];
    for (let p = 1; p <= totalPages.value; p++) {
      if (!pagesData.value[p]) {
        progress.value = `Processing page ${p} of ${totalPages.value}…`;
        await loadAndComparePage(p);
      }
      const pData = pagesData.value[p];
      if (pData) {
        diffPages.push({
          pageNum: p,
          diffImageBlob: pData.diffBlob,
          width: pData.width,
          height: pData.height,
          diffPercent: pData.diffPercent,
        });
      }
    }

    const reportBlob = await generateComparisonPdfReport(diffPages, {
      titleA: fileA.value?.name,
      titleB: fileB.value?.name,
    });

    const filename = comparePdfFilename(fileA.value?.name, fileB.value?.name);
    const url = URL.createObjectURL(reportBlob);

    resultPdf.value = {
      blob: reportBlob,
      url,
      filename,
      size: reportBlob.size,
      pageCount: totalPages.value,
    };
  } catch (err) {
    console.error('Report generation error:', err);
    error.value = 'Failed to generate comparison PDF report. Try again.';
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

function resetAll() {
  cleanupResources();
  fileA.value = null;
  fileB.value = null;
  comparisonSummary.value = null;
  resultPdf.value = null;
  error.value = '';
  progress.value = '';
  if (inputA.value) inputA.value.value = '';
  if (inputB.value) inputB.value.value = '';
}
</script>

<template>
  <div id="converter" class="converter compare-pdf-converter" :class="{ 'is-converting': busy }" aria-label="Compare PDF converter">
    <!-- Step Track -->
    <ol class="step-track" aria-label="Compare PDF steps">
      <li :class="{ current: stage === 1, complete: stage > 1 }">
        <span><Check v-if="stage > 1" :size="12" /><template v-else>1</template></span>
        Upload Two PDFs
      </li>
      <li :class="{ current: stage === 2, complete: stage > 2 }">
        <span><Check v-if="stage > 2" :size="12" /><template v-else>2</template></span>
        Review Differences
      </li>
      <li :class="{ current: stage === 3 }">
        <span>3</span>
        Download Report
      </li>
    </ol>

    <!-- Error Alert -->
    <div v-if="error" class="alert-box" role="alert">
      <CircleAlert :size="18" />
      <div>
        <strong>Comparison Notice</strong>
        <p>{{ error }}</p>
      </div>
      <button class="alert-close" type="button" aria-label="Dismiss alert" @click="error = ''">
        <X :size="16" />
      </button>
    </div>

    <!-- Hidden native file inputs -->
    <input ref="inputA" type="file" accept=".pdf,application/pdf" class="visually-hidden" tabindex="-1" @change="onFileASelected" />
    <input ref="inputB" type="file" accept=".pdf,application/pdf" class="visually-hidden" tabindex="-1" @change="onFileBSelected" />

    <!-- STAGE 1: DUAL UPLOAD INTERFACE -->
    <section v-if="stage === 1" class="dual-upload-section" aria-label="Choose two PDF files to compare">
      <div class="dual-upload-grid">
        <!-- Document A Drop Zone (Original) -->
        <div
          class="compare-card"
          :class="{ dragging: draggingA, 'has-file': fileA }"
          role="region"
          aria-label="Upload Original PDF"
          @dragenter.prevent="draggingA = true"
          @dragover.prevent="draggingA = true"
          @dragleave.prevent="draggingA = false"
          @drop="onDropA"
        >
          <div class="card-badge badge-original">DOCUMENT A (ORIGINAL)</div>
          <div class="card-icon"><FileText :size="28" /></div>

          <template v-if="fileA">
            <h4 class="file-name" :title="fileA.name">{{ fileA.name }}</h4>
            <p class="file-meta">{{ formatSize(fileA.size) }}</p>
            <button type="button" class="btn-subtle-change" @click="inputA?.click()">
              Change File A
            </button>
          </template>
          <template v-else>
            <h4>Select Original PDF</h4>
            <p>Drag &amp; drop original file or browse</p>
            <button type="button" class="btn-select-file" @click="inputA?.click()">
              <Upload :size="15" /> Choose Document A
            </button>
          </template>
        </div>

        <!-- Central Swap & VS Indicator -->
        <div class="compare-middle">
          <button
            type="button"
            class="swap-btn"
            :disabled="!fileA && !fileB"
            title="Swap Document A and Document B"
            @click="swapDocuments"
          >
            <ArrowRightLeft :size="18" />
          </button>
          <span class="vs-text">VS</span>
        </div>

        <!-- Document B Drop Zone (Revised) -->
        <div
          class="compare-card"
          :class="{ dragging: draggingB, 'has-file': fileB }"
          role="region"
          aria-label="Upload Revised PDF"
          @dragenter.prevent="draggingB = true"
          @dragover.prevent="draggingB = true"
          @dragleave.prevent="draggingB = false"
          @drop="onDropB"
        >
          <div class="card-badge badge-revised">DOCUMENT B (REVISED)</div>
          <div class="card-icon"><FileCheck :size="28" /></div>

          <template v-if="fileB">
            <h4 class="file-name" :title="fileB.name">{{ fileB.name }}</h4>
            <p class="file-meta">{{ formatSize(fileB.size) }}</p>
            <button type="button" class="btn-subtle-change" @click="inputB?.click()">
              Change File B
            </button>
          </template>
          <template v-else>
            <h4>Select Revised PDF</h4>
            <p>Drag &amp; drop updated file or browse</p>
            <button type="button" class="btn-select-file" @click="inputB?.click()">
              <Upload :size="15" /> Choose Document B
            </button>
          </template>
        </div>
      </div>

      <!-- Action Button -->
      <div class="compare-action-wrap">
        <button
          type="button"
          class="primary-button compare-submit-btn"
          :disabled="!isReadyToCompare"
          @click="startComparison"
        >
          <GitCompareArrows :size="20" />
          Compare Both Documents
        </button>
        <p class="privacy-note">
          100% private in-browser comparison. Documents never leave your device.
        </p>
      </div>
    </section>

    <!-- STAGE 2: COMPARISON STUDIO -->
    <section v-else-if="stage === 2" class="compare-studio" aria-label="PDF Comparison Workspace">
      <!-- Studio Header Bar -->
      <div class="studio-header-bar">
        <div class="header-titles">
          <div class="doc-badge doc-a">
            <span class="dot red-dot" />
            <strong :title="fileA?.name">Doc A: {{ fileA?.name }}</strong>
          </div>
          <span class="vs-tag">vs</span>
          <div class="doc-badge doc-b">
            <span class="dot green-dot" />
            <strong :title="fileB?.name">Doc B: {{ fileB?.name }}</strong>
          </div>
        </div>

        <div class="header-actions">
          <button type="button" class="action-btn-subtle" @click="resetAll">
            <RotateCcw :size="14" /> New Comparison
          </button>
        </div>
      </div>

      <!-- Navigation & Mode Controls Bar -->
      <div class="compare-nav-bar">
        <!-- Page navigation -->
        <div class="page-stepper">
          <button
            type="button"
            class="stepper-btn"
            :disabled="currentPage <= 1 || busy"
            aria-label="Previous Page"
            @click="goToPage(currentPage - 1)"
          >
            <ArrowLeft :size="16" />
          </button>
          <span class="stepper-text">Page {{ currentPage }} of {{ totalPages }}</span>
          <button
            type="button"
            class="stepper-btn"
            :disabled="currentPage >= totalPages || busy"
            aria-label="Next Page"
            @click="goToPage(currentPage + 1)"
          >
            <ArrowRight :size="16" />
          </button>
        </div>

        <!-- Mode Selector Tabs -->
        <div class="view-mode-tabs" role="tablist">
          <button
            type="button"
            class="mode-tab"
            :class="{ active: viewMode === 'overlay' }"
            @click="viewMode = 'overlay'"
          >
            <Layers :size="15" /> Overlay Diff
          </button>
          <button
            type="button"
            class="mode-tab"
            :class="{ active: viewMode === 'slider' }"
            @click="viewMode = 'slider'"
          >
            <Split :size="15" /> Wipe Slider
          </button>
          <button
            type="button"
            class="mode-tab"
            :class="{ active: viewMode === 'side-by-side' }"
            @click="viewMode = 'side-by-side'"
          >
            <Columns2 :size="15" /> Side-by-Side
          </button>
        </div>

        <!-- Difference Badge -->
        <div class="diff-badge" :class="{ 'has-diff': pagesData[currentPage]?.hasChanges }">
          <span v-if="pagesData[currentPage]?.hasChanges">
            {{ pagesData[currentPage]?.diffPercent }}% Difference
          </span>
          <span v-else class="match-text">
            <Check :size="13" /> 100% Match
          </span>
        </div>
      </div>

      <!-- Legend for Overlay mode -->
      <div v-if="viewMode === 'overlay'" class="diff-legend-bar">
        <div class="legend-item"><span class="swatch red-swatch" /> Removed / Unique to Doc A</div>
        <div class="legend-item"><span class="swatch green-swatch" /> Added / Unique to Doc B</div>
        <div class="legend-item"><span class="swatch gray-swatch" /> Identical / Unchanged</div>
      </div>

      <!-- VIEWPORT STAGE -->
      <div class="viewer-stage">
        <!-- MODE 1: OVERLAY DIFF -->
        <div v-if="viewMode === 'overlay'" class="overlay-viewer">
          <img
            v-if="pagesData[currentPage]?.diffUrl"
            :src="pagesData[currentPage]?.diffUrl"
            alt="Visual Diff Overlay"
            class="viewer-img"
          />
        </div>

        <!-- MODE 2: WIPE SLIDER -->
        <div
          v-else-if="viewMode === 'slider'"
          ref="sliderContainer"
          class="slider-viewer"
          @mousedown="onSliderMouseDown"
          @touchstart="onSliderTouchStart"
        >
          <!-- Base Image (Document A - Left) -->
          <img
            v-if="pagesData[currentPage]?.previewA"
            :src="pagesData[currentPage]?.previewA"
            alt="Document A Base"
            class="slider-base-img"
          />
          <!-- Clipped Overlay Image (Document B - Right) -->
          <div class="slider-clip-layer" :style="{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }">
            <img
              v-if="pagesData[currentPage]?.previewB"
              :src="pagesData[currentPage]?.previewB"
              alt="Document B Overlay"
              class="slider-top-img"
            />
          </div>

          <!-- Vertical Split Line & Handle -->
          <div class="slider-divider" :style="{ left: `${sliderPosition}%` }">
            <div class="slider-knob">
              <ArrowLeft :size="10" />
              <ArrowRight :size="10" />
            </div>
          </div>

          <div class="slider-labels">
            <span class="tag-left">Doc A</span>
            <span class="tag-right">Doc B</span>
          </div>
        </div>

        <!-- MODE 3: SIDE BY SIDE -->
        <div v-else-if="viewMode === 'side-by-side'" class="side-by-side-viewer">
          <div class="side-card">
            <span class="side-label">Document A (Original)</span>
            <img
              v-if="pagesData[currentPage]?.previewA"
              :src="pagesData[currentPage]?.previewA"
              alt="Page A"
              class="side-img"
            />
          </div>
          <div class="side-card">
            <span class="side-label">Document B (Revised)</span>
            <img
              v-if="pagesData[currentPage]?.previewB"
              :src="pagesData[currentPage]?.previewB"
              alt="Page B"
              class="side-img"
            />
          </div>
        </div>
      </div>

      <!-- Action Buttons Bar -->
      <div class="studio-bottom-actions">
        <button
          type="button"
          class="primary-button export-report-btn"
          :disabled="busy"
          @click="exportComparisonReport"
        >
          <Download :size="18" />
          Download Comparison PDF Report
        </button>
      </div>
    </section>

    <!-- STAGE 3: RESULT STATE -->
    <section v-else-if="stage === 3" class="result-state" aria-label="Comparison report ready">
      <div class="success-icon" aria-hidden="true">
        <CheckCheck :size="32" />
        <span class="success-ring" />
      </div>

      <span class="mini-label">COMPARISON COMPLETE</span>
      <h2>Your comparison report is ready!</h2>
      <p>
        Analyzed {{ resultPdf?.pageCount }} {{ resultPdf?.pageCount === 1 ? 'page' : 'pages' }} with visual color diff highlighting.
      </p>

      <div class="selected-file">
        <div class="file-icon"><FileDiff :size="24" /></div>
        <div class="file-details">
          <strong>{{ resultPdf?.filename }}</strong>
          <span>{{ formatSize(resultPdf?.size || 0) }} · PDF Comparison Report</span>
        </div>
        <span class="ready-dot" aria-hidden="true" />
      </div>

      <div class="result-actions">
        <a
          class="primary-button download-btn"
          :href="resultPdf?.url"
          :download="resultPdf?.filename"
        >
          <Download :size="18" />
          Download PDF Report
        </a>

        <button type="button" class="btn-secondary" @click="resetAll">
          <RotateCcw :size="16" />
          Compare Another Document Pair
        </button>
      </div>
    </section>

    <!-- Progress indicator -->
    <div v-if="busy && progress" class="progress-overlay" role="status">
      <div class="progress-box">
        <div class="spinner" aria-hidden="true" />
        <strong>Comparing Documents</strong>
        <p>{{ progress }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.compare-pdf-converter {
  position: relative;
  width: 100%;
}

/* Dual Upload Section */
.dual-upload-section {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 36px 20px;
}
.dual-upload-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 20px;
}
@media (max-width: 768px) {
  .dual-upload-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.compare-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 36px 20px;
  border: 2px dashed rgba(99, 102, 241, 0.35);
  border-radius: 18px;
  background: rgba(225, 29, 72, 0.03);
  transition: all 0.25s ease;
  min-height: 240px;
}
.compare-card.dragging {
  border-color: #e11d48;
  background: rgba(225, 29, 72, 0.1);
}
.compare-card.has-file {
  border-style: solid;
  border-color: rgba(225, 29, 72, 0.5);
  background: rgba(225, 29, 72, 0.05);
}
.card-badge {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  border-radius: 6px;
  margin-bottom: 14px;
}
.badge-original {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}
.badge-revised {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}
.card-icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: rgba(225, 29, 72, 0.12);
  color: #f43f5e;
  margin-bottom: 14px;
}
.compare-card h4 {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 6px;
}
html[data-theme='light'] .compare-card h4 {
  color: #0f172a;
}
.file-name {
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-meta {
  font-size: 12px;
  color: #94a3b8;
  margin: 0 0 14px;
}
.compare-card p {
  font-size: 12.5px;
  color: #94a3b8;
  margin: 0 0 16px;
}
.btn-select-file {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 10px;
  border: 1px solid rgba(99, 102, 241, 0.3);
  background: rgba(99, 102, 241, 0.15);
  color: #fecdd3;
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-select-file:hover {
  background: #e11d48;
  color: #ffffff;
}
.btn-subtle-change {
  background: none;
  border: none;
  color: #fb7185;
  font-size: 12px;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

/* Middle Swap & VS */
.compare-middle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.swap-btn {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
}
html[data-theme='light'] .swap-btn {
  border-color: #cbd5e1;
  background: #ffffff;
  color: #334155;
}
.swap-btn:hover:not(:disabled) {
  background: #e11d48;
  color: #ffffff;
  transform: rotate(180deg);
}
.swap-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.vs-text {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #94a3b8;
}

/* Compare Submit Action */
.compare-action-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.compare-submit-btn {
  min-width: 260px;
  justify-content: center;
  padding: 14px 28px;
  font-size: 15.5px;
  font-weight: 700;
  background: var(--primary-gradient);
  color: #ffffff;
  box-shadow: var(--primary-glow);
}
.compare-submit-btn:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}
.privacy-note {
  font-size: 11.5px;
  color: #94a3b8;
  margin: 0;
}

/* Studio Header Bar */
.studio-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  margin-bottom: 16px;
}
html[data-theme='light'] .studio-header-bar {
  background: #f8fafc;
  border-color: #e2e8f0;
}
.header-titles {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.doc-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #ffffff;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
html[data-theme='light'] .doc-badge {
  color: #0f172a;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.red-dot { background: #ef4444; }
.green-dot { background: #10b981; }
.vs-tag {
  font-size: 11px;
  font-weight: 750;
  color: #94a3b8;
  text-transform: uppercase;
}
.action-btn-subtle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #fb7185;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
.action-btn-subtle:hover {
  background: rgba(99, 102, 241, 0.1);
}

/* Compare Nav Bar */
.compare-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  margin-bottom: 14px;
}
html[data-theme='light'] .compare-nav-bar {
  background: #f1f5f9;
  border-color: #e2e8f0;
}
.page-stepper {
  display: flex;
  align-items: center;
  gap: 10px;
}
.stepper-btn {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  cursor: pointer;
}
html[data-theme='light'] .stepper-btn {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #0f172a;
}
.stepper-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.stepper-text {
  font-size: 13px;
  font-weight: 650;
  color: #cbd5e1;
}
html[data-theme='light'] .stepper-text {
  color: #334155;
}

/* Mode Selector Tabs */
.view-mode-tabs {
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
}
html[data-theme='light'] .view-mode-tabs {
  background: #e2e8f0;
}
.mode-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 12.5px;
  font-weight: 650;
  cursor: pointer;
  transition: all 0.2s;
}
.mode-tab.active {
  background: #e11d48;
  color: #ffffff;
}

/* Difference Badge */
.diff-badge {
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 750;
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}
.diff-badge.has-diff {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}
.match-text {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* Legend bar */
.diff-legend-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 8px 16px;
  font-size: 11.5px;
  color: #94a3b8;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}
.red-swatch { background: #ef4444; }
.green-swatch { background: #10b981; }
.gray-swatch { background: #94a3b8; }

/* Viewport stage */
.viewer-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  min-height: 480px;
  overflow: hidden;
}
html[data-theme='light'] .viewer-stage {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

/* Mode 1: Overlay */
.overlay-viewer {
  display: flex;
  justify-content: center;
}
.viewer-img {
  max-width: 100%;
  max-height: 540px;
  border-radius: 6px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
}

/* Mode 2: Wipe Slider */
.slider-viewer {
  position: relative;
  display: inline-block;
  line-height: 0;
  user-select: none;
  cursor: ew-resize;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
}
.slider-base-img,
.slider-top-img {
  display: block;
  max-width: 100%;
  max-height: 540px;
  width: auto;
  height: auto;
  pointer-events: none;
}
.slider-clip-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.slider-divider {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ffffff;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}
.slider-knob {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e11d48;
  color: #ffffff;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
}
.slider-labels {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}
.tag-left, .tag-right {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
}
.tag-left { background: rgba(239, 68, 68, 0.85); }
.tag-right { background: rgba(16, 185, 129, 0.85); }

/* Mode 3: Side by Side */
.side-by-side-viewer {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  width: 100%;
}
@media (max-width: 680px) {
  .side-by-side-viewer {
    grid-template-columns: 1fr;
  }
}
.side-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.side-label {
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
}
html[data-theme='light'] .side-label {
  color: #334155;
}
.side-img {
  max-width: 100%;
  max-height: 480px;
  border-radius: 6px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

/* Studio Bottom Actions */
.studio-bottom-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.export-report-btn {
  padding: 13px 28px;
  font-size: 15px;
  font-weight: 700;
  background: var(--primary-gradient);
  color: #ffffff;
  box-shadow: var(--primary-glow);
}
.export-report-btn:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

/* Stage 3: Result */
.result-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
}
.success-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  margin-bottom: 20px;
  box-shadow: 0 12px 30px rgba(16, 185, 129, 0.35);
}
.success-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid rgba(16, 185, 129, 0.3);
  animation: pulse-ring 2s infinite;
}
@keyframes pulse-ring {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 0.3; }
  100% { transform: scale(0.95); opacity: 0.8; }
}
.result-state h2 {
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 8px;
}
html[data-theme='light'] .result-state h2 {
  color: #0f172a;
}
.result-state p {
  font-size: 14px;
  color: #94a3b8;
  max-width: 520px;
  margin: 0 0 28px;
}
.selected-file {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 28px;
  width: min(440px, 100%);
}
html[data-theme='light'] .selected-file {
  background: #f8fafc;
  border-color: #e2e8f0;
}
.file-details {
  flex: 1;
  text-align: left;
  min-width: 0;
}
.file-details strong {
  display: block;
  font-size: 13.5px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
html[data-theme='light'] .file-details strong {
  color: #0f172a;
}
.file-details span {
  font-size: 12px;
  color: #94a3b8;
}
.ready-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}
.result-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(340px, 100%);
}
.download-btn {
  justify-content: center;
  padding: 14px 24px;
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
}
.download-btn:hover {
  background: linear-gradient(135deg, #34d399 0%, #059669 100%);
  transform: translateY(-1px);
}
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #cbd5e1;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
html[data-theme='light'] .btn-secondary {
  border-color: #cbd5e1;
  background: #ffffff;
  color: #334155;
}

/* Progress Overlay */
.progress-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  border-radius: 20px;
  z-index: 50;
}
.progress-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 32px;
  background: #1e293b;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: #e11d48;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 14px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.progress-box strong {
  font-size: 15px;
  color: #ffffff;
  margin-bottom: 4px;
}
.progress-box p {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

/* Alert Box */
.alert-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 20px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #fca5a5;
  font-size: 13px;
}
.alert-box strong {
  display: block;
  font-size: 13.5px;
  color: #f87171;
  margin-bottom: 2px;
}
.alert-box p {
  margin: 0;
  color: #fca5a5;
}
.alert-close {
  margin-left: auto;
  background: none;
  border: none;
  color: #f87171;
  cursor: pointer;
  padding: 2px;
}
</style>

