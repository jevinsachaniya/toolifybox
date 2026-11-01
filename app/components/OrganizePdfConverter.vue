<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  CircleAlert,
  Copy,
  Download,
  Eye,
  FilePlus,
  FileText,
  FileUp,
  Layers,
  LoaderCircle,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from '@lucide/vue';
import { formatSize, validatePdf } from '~/utils/document.js';
import { openPdfForImages } from '~/utils/pdf-images.js';
import { normalizeAngle } from '~/utils/rotate-pdf.js';
import { organizePdfDocument, organizedPdfFilename } from '~/utils/organize-pdf.js';

// State
const files = ref([]);
const pages = ref([]);
const selectedIds = ref([]);
const busy = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const resultPdf = ref(null);
const outputFilename = ref('organized.pdf');
const zoomPage = ref(null);

// Drag & drop page reordering
const draggedPageIndex = ref(null);
const dragOverIndex = ref(null);

const inputRef = ref(null);
const addFilesInputRef = ref(null);
const uploadButtonRef = ref(null);

let request = null;
let dropDepth = 0;
let active = true;

const stage = computed(() => (resultPdf.value ? 3 : pages.value.length ? 2 : 1));

function clearResult() {
  if (resultPdf.value?.url) URL.revokeObjectURL(resultPdf.value.url);
  resultPdf.value = null;
}

function releasePreviews() {
  for (const page of pages.value) {
    if (page.previewUrl) URL.revokeObjectURL(page.previewUrl);
  }
  pages.value = [];
  files.value = [];
  selectedIds.value = [];
}

onBeforeUnmount(() => {
  active = false;
  request?.abort();
  clearResult();
  releasePreviews();
});

async function clear({ focus = true } = {}) {
  request?.abort();
  request = null;
  clearResult();
  releasePreviews();
  files.value = [];
  busy.value = false;
  error.value = '';
  progress.value = '';
  zoomPage.value = null;
  if (inputRef.value) inputRef.value.value = '';
  if (addFilesInputRef.value) addFilesInputRef.value.value = '';
  if (focus && active) uploadButtonRef.value?.focus();
}

async function processFiles(newFiles, isAppend = false) {
  if (busy.value || !newFiles?.length) return;
  busy.value = true;
  error.value = '';

  const controller = new AbortController();
  request = controller;

  try {
    const startingFileIndex = isAppend ? files.value.length : 0;
    const loadedPages = [];

    for (let fIdx = 0; fIdx < newFiles.length; fIdx++) {
      if (controller.signal.aborted) break;
      const currentFile = newFiles[fIdx];
      const globalFileIndex = startingFileIndex + fIdx;

      progress.value = `Opening ${currentFile.name}…`;
      const handle = await openPdfForImages(currentFile, {
        signal: controller.signal,
        onProgress: (msg) => {
          if (active) progress.value = msg;
        },
      });

      for (let pageNum = 1; pageNum <= handle.pageCount; pageNum++) {
        if (controller.signal.aborted) break;
        progress.value = `Rendering thumbnail ${pageNum} of ${handle.pageCount} (${currentFile.name})…`;

        const image = await handle.renderPage(pageNum, {
          maxDimension: 320,
          format: 'jpg',
          quality: 0.82,
          renderSignal: controller.signal,
        });

        loadedPages.push({
          id: `p-${globalFileIndex}-${pageNum}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          fileIndex: globalFileIndex,
          originalPageNumber: pageNum,
          previewUrl: URL.createObjectURL(image.blob),
          rotation: 0,
          sourceFile: currentFile,
          filename: currentFile.name,
        });

        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      await handle.close();
    }

    if (active && !controller.signal.aborted) {
      if (isAppend) {
        files.value = [...files.value, ...newFiles];
        pages.value = [...pages.value, ...loadedPages];
      } else {
        files.value = newFiles;
        pages.value = loadedPages;
        outputFilename.value = organizedPdfFilename(newFiles[0]?.name);
      }
      progress.value = '';
    }
  } catch (err) {
    if (!controller.signal.aborted && active) {
      error.value = err?.message || 'Could not load PDF pages for organizing. Please verify the document is not password protected.';
    }
  } finally {
    if (active) busy.value = false;
  }
}

async function selectInitial(fileList) {
  const rawFiles = Array.from(fileList || []).filter((f) => /\.pdf$/i.test(f.name));
  if (!rawFiles.length) {
    error.value = 'Please choose valid .pdf document files.';
    return;
  }
  await clear({ focus: false });
  await processFiles(rawFiles, false);
}

async function handleAppendFiles(fileList) {
  const rawFiles = Array.from(fileList || []).filter((f) => /\.pdf$/i.test(f.name));
  if (!rawFiles.length) return;
  await processFiles(rawFiles, true);
}

// Move page
function movePage(fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= pages.value.length || fromIndex === toIndex) return;
  const list = [...pages.value];
  const [item] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, item);
  pages.value = list;
}

function movePageLeft(index) { movePage(index, index - 1); }
function movePageRight(index) { movePage(index, index + 1); }

// Rotation
function rotatePage(index, delta) {
  const list = [...pages.value];
  const page = list[index];
  if (page) {
    list[index] = { ...page, rotation: normalizeAngle(page.rotation + delta) };
    pages.value = list;
  }
}

function rotateAll(delta) {
  pages.value = pages.value.map((p) => ({
    ...p,
    rotation: normalizeAngle(p.rotation + delta),
  }));
}

function rotateSelected(delta) {
  if (!selectedIds.value.length) return;
  pages.value = pages.value.map((p) =>
    selectedIds.value.includes(p.id)
      ? { ...p, rotation: normalizeAngle(p.rotation + delta) }
      : p
  );
}

// Deletion
function deletePage(index) {
  const list = [...pages.value];
  const [removed] = list.splice(index, 1);
  if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
  selectedIds.value = selectedIds.value.filter((id) => id !== removed?.id);
  pages.value = list;
}

function deleteSelected() {
  if (!selectedIds.value.length) return;
  pages.value = pages.value.filter((p) => {
    if (selectedIds.value.includes(p.id)) {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      return false;
    }
    return true;
  });
  selectedIds.value = [];
}

// Duplicate
function duplicatePage(index) {
  const list = [...pages.value];
  const original = list[index];
  if (!original) return;
  const copy = {
    ...original,
    id: `copy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };
  list.splice(index + 1, 0, copy);
  pages.value = list;
}

// Insert Blank Page
function insertBlankPage(atIndex) {
  const targetIdx = atIndex !== undefined ? atIndex : pages.value.length;
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 340;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 240, 340);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 220, 320);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BLANK PAGE', 120, 175);
  }
  canvas.toBlob((blob) => {
    const previewUrl = blob ? URL.createObjectURL(blob) : '';
    const blankItem = {
      id: `blank-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileIndex: -1,
      originalPageNumber: 0,
      previewUrl,
      rotation: 0,
      sourceFile: files.value[0] || new Blob([]),
      filename: 'Blank Page',
      isBlank: true,
    };
    const list = [...pages.value];
    list.splice(targetIdx, 0, blankItem);
    pages.value = list;
  }, 'image/png');
}

// Preset Sorts
function reverseOrder() { pages.value = [...pages.value].reverse(); }
function sortByOriginal() {
  pages.value = [...pages.value].sort((a, b) => {
    if (a.fileIndex !== b.fileIndex) return a.fileIndex - b.fileIndex;
    return a.originalPageNumber - b.originalPageNumber;
  });
}

function selectAll() { selectedIds.value = pages.value.map((p) => p.id); }
function deselectAll() { selectedIds.value = []; }
function selectOdd() { selectedIds.value = pages.value.filter((_, idx) => (idx + 1) % 2 !== 0).map((p) => p.id); }
function selectEven() { selectedIds.value = pages.value.filter((_, idx) => (idx + 1) % 2 === 0).map((p) => p.id); }

function toggleSelect(id) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((i) => i !== id);
  } else {
    selectedIds.value = [...selectedIds.value, id];
  }
}

// Drag & Drop
function handleDragStart(e, index) {
  draggedPageIndex.value = index;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(index));
}

function handleDragOverCard(e, index) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (dragOverIndex.value !== index) dragOverIndex.value = index;
}

function handleDropOnCard(e, targetIndex) {
  e.preventDefault();
  if (draggedPageIndex.value !== null && draggedPageIndex.value !== targetIndex) {
    movePage(draggedPageIndex.value, targetIndex);
  }
  draggedPageIndex.value = null;
  dragOverIndex.value = null;
}

function handleDragEnd() {
  draggedPageIndex.value = null;
  dragOverIndex.value = null;
}

// Compile & Save
async function handleCompilePdf() {
  if (!pages.value.length || busy.value) return;
  busy.value = true;
  error.value = '';
  progress.value = 'Preparing to build organized PDF…';

  const controller = new AbortController();
  request = controller;

  try {
    const itemsToOrganize = pages.value.map((p) => ({
      sourceFile: p.sourceFile,
      originalPageNumber: p.originalPageNumber,
      rotation: p.rotation,
      isBlank: p.isBlank,
    }));

    const result = await organizePdfDocument(itemsToOrganize, {
      onProgress: (msg) => {
        if (active) progress.value = msg;
      },
      signal: controller.signal,
    });

    if (active && !controller.signal.aborted) {
      const downloadUrl = URL.createObjectURL(result.blob);
      resultPdf.value = {
        blob: result.blob,
        url: downloadUrl,
        filename: outputFilename.value || 'organized.pdf',
        size: result.size,
        pageCount: result.pageCount,
      };
    }
  } catch (err) {
    if (!controller.signal.aborted && active) {
      error.value = err?.message || 'Failed to generate organized PDF. Please try again.';
    }
  } finally {
    if (active) busy.value = false;
  }
}
</script>

<template>
  <div class="converter organize-pdf-converter" :data-stage="stage">
    <!-- Hidden file inputs -->
    <input
      ref="inputRef"
      type="file"
      accept=".pdf,application/pdf"
      multiple
      class="visually-hidden"
      style="display: none;"
      @change="(e) => { if (e.target.files) selectInitial(e.target.files); e.target.value = ''; }"
    />
    <input
      ref="addFilesInputRef"
      type="file"
      accept=".pdf,application/pdf"
      multiple
      class="visually-hidden"
      style="display: none;"
      @change="(e) => { if (e.target.files) handleAppendFiles(e.target.files); e.target.value = ''; }"
    />

    <!-- STAGE 3: Result / Download -->
    <div v-if="resultPdf" class="result-state">
      <div
        class="file-chosen-icon"
        style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; width: 58px; height: 58px; border-radius: 16px; display: grid; place-items: center; margin: 0 auto 16px;"
      >
        <CheckCheck :size="32" />
      </div>
      <h3>PDF Organized Successfully!</h3>
      <p>
        Your PDF has been reordered and saved with all rotations, deletions, and page arrangements applied locally.
      </p>

      <div class="selected-file" style="margin: 22px 0;">
        <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
          <div
            style="color: #e11d48; background: #ffe4e6; padding: 10px; border-radius: 10px; display: grid; place-items: center;"
          >
            <FileText :size="22" />
          </div>
          <div style="flex: 1; min-width: 0;">
            <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {{ resultPdf.filename }}
            </strong>
            <span style="font-size: 12px; color: #64748b;">
              {{ formatSize(resultPdf.size) }} &bull; {{ resultPdf.pageCount }} Pages Total &bull; 100% In-Browser Private
            </span>
          </div>
        </div>
      </div>

      <div class="result-actions">
        <a class="primary-button" :href="resultPdf.url" :download="resultPdf.filename">
          <Download :size="18" /> Download Organized PDF
        </a>
        <button class="text-button" @click="clear()">
          <RotateCcw :size="16" /> Organize Another PDF
        </button>
      </div>
    </div>

    <!-- STAGE 2: Workspace Grid -->
    <div v-else-if="pages.length" class="organize-workspace">
      <!-- Header bar with file summary & actions -->
      <div class="organize-header-bar">
        <div class="organize-files-info">
          <div class="files-summary-pill">
            <FileText :size="16" />
            <span>
              <b>{{ files.length }}</b> {{ files.length === 1 ? 'file' : 'files' }} &bull;
              <b>{{ pages.length }}</b> {{ pages.length === 1 ? 'page' : 'pages' }} total
            </span>
          </div>
          <div v-if="selectedIds.length > 0" class="selection-counter-badge">
            <span>{{ selectedIds.length }} selected</span>
            <button type="button" title="Clear selection" @click="deselectAll">
              <X :size="12" />
            </button>
          </div>
        </div>

        <div class="organize-top-actions">
          <button
            type="button"
            class="tool-action-btn secondary"
            title="Add more PDF files"
            :disabled="busy"
            @click="addFilesInputRef?.click()"
          >
            <FilePlus :size="15" />
            <span>Add PDFs</span>
          </button>

          <button
            type="button"
            class="tool-action-btn secondary"
            title="Insert a clean blank page"
            :disabled="busy"
            @click="insertBlankPage()"
          >
            <Plus :size="15" />
            <span>Add Blank Page</span>
          </button>

          <button
            type="button"
            class="tool-action-btn icon-only"
            title="Rotate all pages counter-clockwise (-90°)"
            :disabled="busy"
            @click="rotateAll(-90)"
          >
            <RotateCcw :size="16" />
          </button>

          <button
            type="button"
            class="tool-action-btn icon-only"
            title="Rotate all pages clockwise (+90°)"
            :disabled="busy"
            @click="rotateAll(90)"
          >
            <RotateCw :size="16" />
          </button>

          <button
            type="button"
            class="tool-action-btn icon-only clear-btn"
            title="Reset and start over"
            :disabled="busy"
            @click="clear()"
          >
            <X :size="18" />
          </button>
        </div>
      </div>

      <!-- Quick Toolbar (Selection & Presets) -->
      <div class="organize-quick-toolbar">
        <div class="toolbar-group">
          <span class="toolbar-label">Select:</span>
          <button type="button" class="pill-chip-btn" :disabled="busy" @click="selectAll">All</button>
          <button type="button" class="pill-chip-btn" :disabled="busy" @click="selectOdd">Odd</button>
          <button type="button" class="pill-chip-btn" :disabled="busy" @click="selectEven">Even</button>
          <button
            v-if="selectedIds.length > 0"
            type="button"
            class="pill-chip-btn danger"
            :disabled="busy"
            @click="deselectAll"
          >
            None
          </button>
        </div>

        <div class="toolbar-group">
          <span class="toolbar-label">Arrange:</span>
          <button
            type="button"
            class="pill-chip-btn"
            :disabled="busy"
            title="Reverse order of all pages"
            @click="reverseOrder"
          >
            <ArrowDownUp :size="13" /> Reverse
          </button>
          <button
            type="button"
            class="pill-chip-btn"
            :disabled="busy"
            title="Reset to original uploaded order"
            @click="sortByOriginal"
          >
            Original Order
          </button>
        </div>

        <div v-if="selectedIds.length > 0" class="toolbar-group selection-actions">
          <span class="toolbar-label">Selected ({{ selectedIds.length }}):</span>
          <button
            type="button"
            class="pill-chip-btn"
            :disabled="busy"
            title="Rotate selected pages 90° CW"
            @click="rotateSelected(90)"
          >
            <RotateCw :size="13" /> Rotate
          </button>
          <button
            type="button"
            class="pill-chip-btn danger"
            :disabled="busy"
            title="Delete all selected pages"
            @click="deleteSelected"
          >
            <Trash2 :size="13" /> Delete
          </button>
        </div>
      </div>

      <!-- Tip bar -->
      <div class="organize-hint-bar">
        <span>
          💡 <b>Tip:</b> Drag &amp; drop any page to rearrange order. Use hover icons to rotate, duplicate, or preview.
        </span>
      </div>

      <!-- Error banner -->
      <div v-if="error" class="error-banner" style="margin: 14px 0;">
        <CircleAlert :size="18" />
        <span>{{ error }}</span>
        <button type="button" class="close-err-btn" @click="error = ''">
          <X :size="14" />
        </button>
      </div>

      <!-- Thumbnails Grid -->
      <div class="organize-pages-grid" role="list">
        <div
          v-for="(page, index) in pages"
          :key="page.id"
          class="organize-page-card"
          :class="{
            'is-selected': selectedIds.includes(page.id),
            'is-dragging': draggedPageIndex === index,
            'is-drop-target': dragOverIndex === index,
          }"
          :draggable="!busy"
          @dragstart="(e) => handleDragStart(e, index)"
          @dragover="(e) => handleDragOverCard(e, index)"
          @drop="(e) => handleDropOnCard(e, index)"
          @dragend="handleDragEnd"
        >
          <!-- Card top bar -->
          <div class="card-top-bar">
            <span class="page-number-badge">#{{ index + 1 }}</span>
            <label class="page-select-checkbox" title="Select page">
              <input
                type="checkbox"
                :checked="selectedIds.includes(page.id)"
                @change="toggleSelect(page.id)"
              />
            </label>
          </div>

          <!-- Card thumb wrap -->
          <div
            class="card-thumbnail-wrap"
            title="Click to select or drag to move"
            @click="toggleSelect(page.id)"
          >
            <div
              class="thumb-rotation-container"
              :style="{
                transform: `rotate(${page.rotation}deg)`,
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }"
            >
              <img
                :src="page.previewUrl"
                :alt="`Page ${index + 1}`"
                loading="lazy"
                draggable="false"
              />
            </div>

            <!-- Hover action overlay -->
            <div class="card-hover-actions" @click.stop>
              <button
                type="button"
                class="hover-action-btn"
                title="Rotate -90°"
                @click="rotatePage(index, -90)"
              >
                <RotateCcw :size="13" />
              </button>
              <button
                type="button"
                class="hover-action-btn"
                title="Rotate +90°"
                @click="rotatePage(index, 90)"
              >
                <RotateCw :size="13" />
              </button>
              <button
                type="button"
                class="hover-action-btn"
                title="Zoom / Preview page"
                @click="zoomPage = page"
              >
                <ZoomIn :size="13" />
              </button>
              <button
                type="button"
                class="hover-action-btn"
                title="Duplicate page"
                @click="duplicatePage(index)"
              >
                <Copy :size="13" />
              </button>
              <button
                type="button"
                class="hover-action-btn danger"
                title="Delete page"
                @click="deletePage(index)"
              >
                <Trash2 :size="13" />
              </button>
            </div>
          </div>

          <!-- Card bottom bar -->
          <div class="card-bottom-bar">
            <div class="page-meta-tag" :title="page.filename">
              {{ page.isBlank ? 'Blank' : `Orig: ${page.originalPageNumber}` }}
            </div>

            <div class="shift-buttons-group">
              <button
                type="button"
                class="shift-btn"
                :disabled="index === 0 || busy"
                title="Move Left"
                @click="movePageLeft(index)"
              >
                <ArrowLeft :size="12" />
              </button>
              <button
                type="button"
                class="shift-btn"
                :disabled="index === pages.length - 1 || busy"
                title="Move Right"
                @click="movePageRight(index)"
              >
                <ArrowRight :size="12" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom controls & compile bar -->
      <div class="organize-bottom-bar">
        <div class="output-filename-group">
          <label for="output-filename-vue">Output Filename:</label>
          <input
            id="output-filename-vue"
            v-model="outputFilename"
            type="text"
            placeholder="organized.pdf"
            :disabled="busy"
          />
        </div>

        <div class="organize-action-buttons">
          <button
            type="button"
            class="organize-cancel-btn"
            :disabled="busy"
            title="Cancel organizing and choose another file"
            @click="clear()"
          >
            <RotateCcw :size="15" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            class="primary-button organize-save-btn"
            :disabled="!pages.length || busy"
            @click="handleCompilePdf"
          >
            <LoaderCircle v-if="busy" class="spin" :size="18" />
            <Download v-else :size="18" />
            <span>{{ busy ? 'Organizing & Saving…' : `Download PDF (${pages.length} Pages)` }}</span>
          </button>
        </div>
      </div>

      <!-- Live progress pill -->
      <div v-if="busy" class="progress-pill" style="margin-top: 14px;">
        <LoaderCircle class="spin" :size="14" />
        <span>{{ progress || 'Processing pages…' }}</span>
      </div>
    </div>

    <!-- STAGE 1: Dropzone -->
    <div
      v-else
      class="drop-zone"
      :class="{ dragging, active: dragging }"
      tabindex="0"
      role="button"
      aria-label="Upload PDF to organize"
      @click="inputRef?.click()"
      @keydown.enter.prevent="inputRef?.click()"
      @keydown.space.prevent="inputRef?.click()"
      @dragenter.prevent="dropDepth++; dragging = true;"
      @dragover.prevent
      @dragleave.prevent="dropDepth = Math.max(0, dropDepth - 1); if (!dropDepth) dragging = false;"
      @drop.prevent="dropDepth = 0; dragging = false; if ($event.dataTransfer?.files) selectInitial($event.dataTransfer.files);"
    >
      <div
        class="drop-zone-icon"
        style="background: linear-gradient(135deg, #f43f5e, #e11d48); color: #fff; width: 64px; height: 64px; border-radius: 18px; display: grid; place-items: center; margin: 0 auto 16px;"
      >
        <Layers :size="32" />
      </div>

      <h3>Select or drop PDF documents to organize</h3>
      <p>
        Rearrange, reorder, rotate, delete, or duplicate pages with drag &amp; drop. Combine multiple PDFs into one.
      </p>

      <button
        ref="uploadButtonRef"
        type="button"
        class="choose-button"
        :disabled="busy"
        @click.stop="inputRef?.click()"
      >
        <Upload :size="18" /> Choose PDF Documents
      </button>

      <p class="dropzone-privacy-note">
        100% private in-browser tool. Your documents are never uploaded to any cloud server.
      </p>

      <div v-if="busy" class="progress-pill" style="margin-top: 16px;">
        <LoaderCircle class="spin" :size="14" />
        <span>{{ progress || 'Loading PDF…' }}</span>
      </div>

      <div v-if="error" class="error-banner" style="margin-top: 16px;" @click.stop>
        <CircleAlert :size="18" />
        <span>{{ error }}</span>
        <button type="button" class="close-err-btn" @click="error = ''">
          <X :size="14" />
        </button>
      </div>
    </div>

    <!-- High-Resolution Zoom Modal -->
    <div v-if="zoomPage" class="organize-zoom-modal" @click="zoomPage = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>
            Preview: {{ zoomPage.isBlank ? 'Blank Page' : `${zoomPage.filename} (Page ${zoomPage.originalPageNumber})` }}
          </h4>
          <button type="button" class="modal-close-btn" @click="zoomPage = null">
            <X :size="18" />
          </button>
        </div>
        <div class="modal-body">
          <div
            :style="{
              transform: `rotate(${zoomPage.rotation}deg)`,
              transition: 'transform 0.25s ease',
              display: 'inline-block',
            }"
          >
            <img
              :src="zoomPage.previewUrl"
              alt="Preview"
              style="max-height: 70vh; max-width: 85vw; object-fit: contain; border-radius: 6px;"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

