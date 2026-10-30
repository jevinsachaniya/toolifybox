<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import {
  ArrowRight,
  Check,
  CheckCheck,
  CircleAlert,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileCode,
  FileText,
  FolderArchive,
  Layers,
  Laptop,
  Palette,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  Tablet,
  Upload,
  X,
  Zap,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import {
  CONVERSION_MODES,
  HTML_THEMES,
  escapeHtml,
  generateStandaloneHtmlDocument,
  generateZipArchive,
  groupIntoSemanticBlocks,
  parseHtmlPageRange,
  pdfToHtmlFilename,
  renderFixedLayoutToHtml,
  renderSemanticBlocksToHtml,
  validatePdfForHtml,
} from '~/utils/pdf-to-html.js';
import FileBadge from '~/components/FileBadge.vue';

// Input File State
const file = shallowRef(null);
const fileInput = ref(null);
const isDragging = ref(false);
const busy = ref(false);
const error = ref('');
const progress = ref('');
const progressPercent = ref(0);

// Document Metadata
const totalPages = ref(1);
const pdfDocumentInstance = shallowRef(null);

// Conversion Options
const conversionMode = ref('semantic'); // 'semantic' | 'fixed'
const selectedTheme = ref('modern'); // 'modern' | 'minimal' | 'dark' | 'plain'
const pageSelectionMode = ref('all'); // 'all' | 'custom'
const customPageRange = ref('');
const includeNav = ref(true);
const embedBackgrounds = ref(false);

// Output State
const previewTab = ref('render'); // 'render' | 'code'
const previewViewport = ref('desktop'); // 'desktop' | 'tablet' | 'mobile'
const generatedHtml = ref('');
const rawOriginalGeneratedHtml = ref('');
const isCodeModified = ref(false);
const generatedPagesData = shallowRef([]);
const resultBlob = shallowRef(null);
const resultUrl = ref('');
const copied = ref(false);
const zipBusy = ref(false);

// Template iframe ref
const previewIframe = ref(null);

let active = true;
let abortController = null;
let updateDebounceTimer = null;

onBeforeUnmount(() => {
  active = false;
  if (updateDebounceTimer) clearTimeout(updateDebounceTimer);
  if (abortController) abortController.abort();
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value);
  if (pdfDocumentInstance.value) {
    try { pdfDocumentInstance.value.destroy(); } catch (_) {}
  }
});

const stage = computed(() => {
  if (generatedHtml.value) return 2; // Studio with preview & ready actions
  if (file.value) return 2;
  return 1; // upload
});

const pagesToConvertList = computed(() => {
  if (pageSelectionMode.value === 'all') {
    return Array.from({ length: totalPages.value }, (_, i) => i + 1);
  }
  return parseHtmlPageRange(customPageRange.value, totalPages.value);
});

function handleFileDrop(e) {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files?.length) {
    onSelectFile(files[0]);
  }
}

function handleFileInput(e) {
  const files = e.target?.files;
  if (files?.length) {
    onSelectFile(files[0]);
  }
  if (fileInput.value) fileInput.value.value = '';
}

async function onSelectFile(selectedFile) {
  error.value = '';
  const validationError = validatePdfForHtml(selectedFile);
  if (validationError) {
    error.value = validationError;
    return;
  }

  artworkCache.clear();
  file.value = selectedFile;
  busy.value = true;
  progress.value = 'Analyzing PDF structure…';
  progressPercent.value = 10;

  try {
    const [pdfjs, { default: workerUrl }] = await Promise.all([
      import('pdfjs-dist/build/pdf.mjs'),
      import('pdfjs-dist/build/pdf.worker.mjs?url'),
    ]);

    if (!active) return;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

    const arrayBuffer = await selectedFile.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      stopAtErrors: false,
    });

    const doc = await loadingTask.promise;
    if (!active) return;

    pdfDocumentInstance.value = doc;
    totalPages.value = doc.numPages || 1;
    customPageRange.value = `1-${Math.min(doc.numPages, 5)}`;
    progress.value = '';
    busy.value = false;

    // Trigger initial conversion automatically
    await startConversion();
  } catch (err) {
    if (!active) return;
    busy.value = false;
    error.value = err?.message || 'Could not parse the PDF file. Please ensure it is not password protected.';
  }
}

// Memory cache for rendered page artwork
const artworkCache = new Map();

async function getPageArtwork(page, viewport, pdfjs, pageNum) {
  const cacheKey = `${file.value?.name || 'doc'}_${file.value?.size || 0}_p${pageNum}`;
  if (artworkCache.has(cacheKey)) {
    return artworkCache.get(cacheKey);
  }

  try {
    const scale = 1.0;
    const renderViewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(renderViewport.width);
    canvas.height = Math.ceil(renderViewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Suppress text operations using PDF.js native operationsFilter so the canvas
    // ONLY draws table grids, borders, background colors, banners, illustrations, and logos.
    // ZERO text is drawn to canvas, completely eliminating double words and keeping HTML text 100% editable!
    const textOps = new Set([
      pdfjs?.OPS?.showText,
      pdfjs?.OPS?.showSpacedText,
      pdfjs?.OPS?.nextLineShowText,
      pdfjs?.OPS?.nextLineSetSpacingShowText,
    ].filter(Boolean));

    await page.render({
      canvasContext: ctx,
      viewport: renderViewport,
      background: '#ffffff',
      operationsFilter: (opIdx, opList) => !textOps.has(opList.fnArray[opIdx]),
    }).promise;

    // Fast image format: webp (with fallback to jpeg)
    let dataUrl = '';
    try {
      dataUrl = canvas.toDataURL('image/webp', 0.82);
      if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      }
    } catch (_) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    }

    canvas.width = 0;
    canvas.height = 0;

    artworkCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (err) {
    return null;
    console.warn('Artwork render warning:', err);
  }
}

async function extractQuickImages(page, viewport, pdfjs) {
  const images = [];
  try {
    const opList = await page.getOperatorList();
    let currentTransform = [1, 0, 0, 1, 0, 0];
    const transformStack = [];

    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      const args = opList.argsArray[i];

      if (fn === pdfjs.OPS.save) {
        transformStack.push([...currentTransform]);
      } else if (fn === pdfjs.OPS.restore) {
        if (transformStack.length) currentTransform = transformStack.pop();
      } else if (fn === pdfjs.OPS.transform) {
        currentTransform = pdfjs.Util.transform(currentTransform, args);
      } else if (fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintInlineImageXObject) {
        const imgName = args[0];
        const viewTrans = pdfjs.Util.transform(viewport.transform, currentTransform);
        const width = Math.round(Math.abs(viewTrans[0] || 0));
        const height = Math.round(Math.abs(viewTrans[3] || 0));
        const x = Math.round(Math.max(0, viewTrans[4] || 0));
        const y = Math.round(Math.max(0, (viewTrans[5] || 0) - height));

        if (width < 8 || height < 8) continue;

        let imgObj = null;
        // Non-blocking check: retrieve only if already resolved in page.objs
        if (typeof imgName === 'string' && page.objs && page.objs.has(imgName)) {
          imgObj = page.objs.get(imgName);
        } else if (imgName && typeof imgName === 'object') {
          imgObj = imgName;
        }

        if (!imgObj || !imgObj.width || !imgObj.height) continue;

        const imgCanvas = document.createElement('canvas');
        imgCanvas.width = imgObj.width;
        imgCanvas.height = imgObj.height;
        const ctx = imgCanvas.getContext('2d');
        if (!ctx) continue;

        if (imgObj.bitmap) {
          ctx.drawImage(imgObj.bitmap, 0, 0);
        } else if (imgObj.data) {
          const imgData = ctx.createImageData(imgObj.width, imgObj.height);
          const src = imgObj.data;
          const dst = imgData.data;
          const len = imgObj.width * imgObj.height;

          if (src.length === len * 4) {
            dst.set(src);
          } else if (src.length === len * 3) {
            for (let s = 0, d = 0; s < src.length; s += 3, d += 4) {
              dst[d] = src[s];
              dst[d + 1] = src[s + 1];
              dst[d + 2] = src[s + 2];
              dst[d + 3] = 255;
            }
          } else if (src.length === len) {
            for (let s = 0, d = 0; s < src.length; s++, d += 4) {
              const v = src[s];
              dst[d] = v;
              dst[d + 1] = v;
              dst[d + 2] = v;
              dst[d + 3] = 255;
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        const dataUrl = imgCanvas.toDataURL('image/png');
        imgCanvas.width = 0;
        imgCanvas.height = 0;

        images.push({
          name: typeof imgName === 'string' ? imgName : 'img_' + images.length,
          dataUrl,
          x,
          y,
          width,
          height,
        });
      }
    }
  } catch (err) {
    console.warn('Quick image extraction warning:', err);
  }
  return images;
}

async function startConversion() {
  if (!pdfDocumentInstance.value || !file.value) return;

  busy.value = true;
  error.value = '';
  progress.value = 'Preparing pages…';
  progressPercent.value = 15;

  if (resultUrl.value) {
    URL.revokeObjectURL(resultUrl.value);
    resultUrl.value = '';
  }

  abortController = new AbortController();

  try {
    const [pdfjs] = await Promise.all([
      import('pdfjs-dist/build/pdf.mjs'),
    ]);
    const doc = pdfDocumentInstance.value;
    const pagesList = pagesToConvertList.value;
    const totalSelected = pagesList.length;
    const pagesData = [];

    for (let idx = 0; idx < totalSelected; idx++) {
      if (abortController.signal.aborted) throw new Error('Conversion cancelled.');

      const pageNum = pagesList[idx];
      progress.value = `Converting page ${pageNum} of ${totalPages.value} (${idx + 1}/${totalSelected})…`;
      progressPercent.value = Math.round(20 + ((idx + 1) / totalSelected) * 70);

      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      const textContent = await page.getTextContent();

      let pageArtwork = null;
      let pageImages = [];
      if (embedBackgrounds.value) {
        pageArtwork = await getPageArtwork(page, viewport, pdfjs, pageNum);
        if (conversionMode.value === 'semantic') {
          pageImages = await extractQuickImages(page, viewport, pdfjs);
        }
      }

      // Transform raw items to standard coordinates using pdfjs viewport transform
      const rawItems = textContent.items.map(it => {
        let x = 0;
        let y = 0;
        let fontSize = 12;

        if (it.transform && pdfjs?.Util?.transform && viewport?.transform) {
          const transform = pdfjs.Util.transform(viewport.transform, it.transform);
          x = Math.max(0, transform[4] || 0);
          const baseline = Math.max(0, transform[5] || 0);
          fontSize = Math.max(6, Math.round(Math.hypot(transform[2], transform[3]) || 12));
          y = Math.max(0, baseline - fontSize * 0.85);
        } else if (it.transform) {
          x = Math.max(0, it.transform[4] || 0);
          const rawY = it.transform[5] || 0;
          y = Math.max(0, viewport.height - rawY);
          fontSize = Math.max(6, Math.round(Math.hypot(it.transform[0], it.transform[1]) || 12));
        }

        return {
          str: it.str || '',
          x,
          y,
          width: it.width || (fontSize * (it.str?.length || 1) * 0.5),
          height: it.height || fontSize,
          fontSize,
          fontName: it.fontName || '',
        };
      });

      let pageHtmlContent = '';
      if (conversionMode.value === 'semantic') {
        const blocks = groupIntoSemanticBlocks(rawItems, viewport.width, viewport.height);
        pageHtmlContent = renderSemanticBlocksToHtml(blocks, pageImages);
      } else {
        pageHtmlContent = renderFixedLayoutToHtml(rawItems, viewport.width, viewport.height, pageArtwork);
      }

      pagesData.push({
        pageNumber: pageNum,
        width: Math.round(viewport.width),
        height: Math.round(viewport.height),
        htmlContent: pageHtmlContent,
      });

      page.cleanup();
    }

    if (abortController.signal.aborted) return;

    progress.value = 'Assembling HTML document & styles…';
    progressPercent.value = 95;

    const docTitle = file.value.name.replace(/\.pdf$/i, '');
    const finalHtml = generateStandaloneHtmlDocument(pagesData, {
      title: docTitle,
      mode: conversionMode.value,
      theme: selectedTheme.value,
      includeNav: includeNav.value,
    });

    const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    generatedPagesData.value = pagesData;
    generatedHtml.value = finalHtml;
    rawOriginalGeneratedHtml.value = finalHtml;
    isCodeModified.value = false;
    resultBlob.value = blob;
    resultUrl.value = url;

    progressPercent.value = 100;
    progress.value = '';
    busy.value = false;

    await nextTick();
    updateIframeContent();
  } catch (err) {
    if (abortController?.signal.aborted) return;
    busy.value = false;
    error.value = err?.message || 'Conversion failed. Please try again with a different mode.';
  }
}

function updateIframeContent() {
  if (!previewIframe.value) return;
  try {
    const iframe = previewIframe.value;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(generatedHtml.value);
      doc.close();
    }
  } catch (_) {
    // Sandboxed preview security fallback
  }
}

function handleCodeInput() {
  isCodeModified.value = (generatedHtml.value !== rawOriginalGeneratedHtml.value);

  // Update blob and object URL so downloading reflects the edited code
  if (resultUrl.value) {
    URL.revokeObjectURL(resultUrl.value);
  }
  const blob = new Blob([generatedHtml.value], { type: 'text/html;charset=utf-8' });
  resultBlob.value = blob;
  resultUrl.value = URL.createObjectURL(blob);

  // Real-time debounced update to the live rendered view
  clearTimeout(updateDebounceTimer);
  updateDebounceTimer = setTimeout(() => {
    updateIframeContent();
  }, 250);
}

function handleTabKey(e) {
  const textarea = e.target;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = generatedHtml.value;
  generatedHtml.value = val.substring(0, start) + '  ' + val.substring(end);
  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = start + 2;
  });
  handleCodeInput();
}

function resetHtmlCode() {
  if (!rawOriginalGeneratedHtml.value) return;
  generatedHtml.value = rawOriginalGeneratedHtml.value;
  isCodeModified.value = false;

  if (resultUrl.value) {
    URL.revokeObjectURL(resultUrl.value);
  }
  const blob = new Blob([generatedHtml.value], { type: 'text/html;charset=utf-8' });
  resultBlob.value = blob;
  resultUrl.value = URL.createObjectURL(blob);
  updateIframeContent();
}

watch([conversionMode, selectedTheme, includeNav, embedBackgrounds], () => {
  if (file.value && !busy.value) {
    startConversion();
  }
});

watch(previewTab, async (newTab) => {
  if (newTab === 'render') {
    await nextTick();
    updateIframeContent();
  }
});

function downloadHtmlFile() {
  if (!resultBlob.value || !file.value) return;
  const filename = pdfToHtmlFilename(file.value.name, 'html');
  const a = document.createElement('a');
  a.href = resultUrl.value;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function downloadZipArchive() {
  if (!generatedPagesData.value.length || !file.value || zipBusy.value) return;
  zipBusy.value = true;
  try {
    const zipBlob = await generateZipArchive(generatedPagesData.value, {
      title: file.value.name.replace(/\.pdf$/i, ''),
      mode: conversionMode.value,
      theme: selectedTheme.value,
      includeNav: includeNav.value,
    });
    const zipUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = zipUrl;
    a.download = pdfToHtmlFilename(file.value.name, 'zip');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(zipUrl), 2000);
  } catch (err) {
    error.value = 'Failed to generate ZIP package: ' + (err?.message || 'Unknown error');
  } finally {
    zipBusy.value = false;
  }
}

async function copyHtmlCode() {
  if (!generatedHtml.value) return;
  try {
    await navigator.clipboard.writeText(generatedHtml.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2200);
  } catch (_) {
    const textarea = document.createElement('textarea');
    textarea.value = generatedHtml.value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2200);
  }
}

function openInNewTab() {
  if (!resultUrl.value) return;
  window.open(resultUrl.value, '_blank');
}

function resetAll() {
  if (abortController) abortController.abort();
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value);
  if (pdfDocumentInstance.value) {
    try { pdfDocumentInstance.value.destroy(); } catch (_) {}
  }
  artworkCache.clear();
  file.value = null;
  pdfDocumentInstance.value = null;
  generatedHtml.value = '';
  generatedPagesData.value = [];
  resultBlob.value = null;
  resultUrl.value = '';
  error.value = '';
  progress.value = '';
  busy.value = false;
  totalPages.value = 1;
}
</script>

<template>
  <section id="converter" class="converter pdf-to-html-converter" :class="{ 'is-converting': busy }" aria-label="PDF to HTML converter" :aria-busy="busy">
    <!-- Converter Header -->
    <div class="converter-heading">
      <div>
        <span class="mini-label">HTML5 &amp; CSS WEBPAGE GENERATOR</span>
        <h2>PDF <ArrowRight :size="21" /> HTML</h2>
      </div>
      <span class="free-badge">Free to use</span>
    </div>

    <!-- Step Progress Header -->
    <ol class="step-track" aria-label="PDF to HTML conversion steps">
      <li :class="{ current: stage === 1, complete: stage > 1 }">
        <span><Check v-if="stage > 1" :size="12" /><template v-else>1</template></span>
        Upload PDF
      </li>
      <li :class="{ current: stage === 2, complete: Boolean(generatedHtml) }">
        <span><Check v-if="Boolean(generatedHtml)" :size="12" /><template v-else>2</template></span>
        Configure &amp; Preview
      </li>
      <li :class="{ current: Boolean(generatedHtml) }">
        <span>3</span>
        Download
      </li>
    </ol>

    <!-- Error Alert -->
    <div v-if="error" class="alert-box" role="alert">
      <CircleAlert :size="18" />
      <div>
        <strong>Conversion Notice</strong>
        <p>{{ error }}</p>
      </div>
      <button class="alert-close" type="button" aria-label="Dismiss alert" @click="error = ''">
        <X :size="16" />
      </button>
    </div>

    <!-- Hidden native file input -->
    <input
      id="pdf-to-html-input"
      ref="fileInput"
      type="file"
      accept=".pdf,application/pdf"
      class="visually-hidden"
      tabindex="-1"
      :disabled="busy"
      aria-label="Choose a PDF document"
      @change="handleFileInput"
    />

    <!-- STAGE 1: UPLOAD DROPZONE -->
    <div
      v-if="stage === 1"
      class="drop-zone"
      :class="{ dragging: isDragging }"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleFileDrop"
    >
      <div class="document-pair" aria-hidden="true">
        <FileBadge type="pdf" />
        <span class="pair-arrow"><ArrowRight :size="18" /></span>
        <div class="html-custom-badge">
          <Code2 :size="28" />
          <b>HTML</b>
        </div>
      </div>

      <h3>{{ isDragging ? 'Drop it here.' : 'Drop your PDF document here' }}</h3>
      <p>or choose a file from your device</p>

      <button
        type="button"
        class="choose-button"
        :disabled="busy"
        @click="fileInput?.click()"
      >
        <Upload :size="17" />
        Choose PDF file
      </button>

      <span class="file-requirements">
        .PDF only <span>&bull;</span> Up to 60 MB <span>&bull;</span> 100% In-Browser Privacy
      </span>
    </div>

    <!-- STAGE 2: STUDIO WORKSPACE & PREVIEW -->
    <div v-else class="html-studio" aria-label="PDF to HTML Studio Workspace">
      <!-- File Summary Bar -->
      <div class="selected-file">
        <FileBadge type="pdf" small />
        <div>
          <strong>{{ file.name }}</strong>
          <span>{{ formatSize(file.size) }} &bull; {{ totalPages }} {{ totalPages === 1 ? 'page' : 'pages' }} &bull; Client memory only</span>
        </div>
        <button
          type="button"
          class="icon-button"
          :disabled="busy"
          aria-label="Remove selected document"
          title="Change file"
          @click="resetAll"
        >
          <X :size="17" />
        </button>
      </div>

      <!-- Controls Panel Grid -->
      <div class="studio-controls-grid">
        <!-- Layout Engine Card -->
        <div class="control-box">
          <div class="control-box-header">
            <Layers :size="15" />
            <span>Layout Engine</span>
          </div>
          <div class="mode-cards">
            <button
              type="button"
              class="mode-card"
              :class="{ active: conversionMode === 'semantic' }"
              @click="conversionMode = 'semantic'"
            >
              <div class="mode-card-top">
                <b>Semantic Responsive</b>
                <span v-if="conversionMode === 'semantic'" class="mode-check"><Check :size="12" /></span>
              </div>
              <small>Auto-detects H1-H3, lists, and paragraphs for flexible mobile &amp; desktop flow</small>
            </button>
            <button
              type="button"
              class="mode-card"
              :class="{ active: conversionMode === 'fixed' }"
              @click="conversionMode = 'fixed'"
            >
              <div class="mode-card-top">
                <b>Pixel-Perfect Fixed</b>
                <span v-if="conversionMode === 'fixed'" class="mode-check"><Check :size="12" /></span>
              </div>
              <small>Preserves exact coordinates, margins, and geometric replica matching original PDF</small>
            </button>
          </div>
        </div>

        <!-- CSS Theme Card -->
        <div class="control-box">
          <div class="control-box-header">
            <Palette :size="15" />
            <span>CSS Theme Style</span>
          </div>
          <div class="themes-grid">
            <button
              v-for="thm in HTML_THEMES"
              :key="thm.id"
              type="button"
              class="theme-btn"
              :class="{ active: selectedTheme === thm.id }"
              @click="selectedTheme = thm.id"
            >
              <span class="theme-color-dot" :class="thm.id" />
              <span class="theme-title">{{ thm.name }}</span>
            </button>
          </div>
        </div>

        <!-- Pages Selection Card -->
        <div class="control-box">
          <div class="control-box-header">
            <FileCheck :size="15" />
            <span>Page Range</span>
          </div>
          <div class="range-radios">
            <label class="radio-pill" :class="{ selected: pageSelectionMode === 'all' }">
              <input
                v-model="pageSelectionMode"
                type="radio"
                value="all"
                name="pageSelection"
                @change="startConversion"
              />
              <span>All Pages ({{ totalPages }})</span>
            </label>
            <label class="radio-pill" :class="{ selected: pageSelectionMode === 'custom' }">
              <input
                v-model="pageSelectionMode"
                type="radio"
                value="custom"
                name="pageSelection"
              />
              <span>Custom Range</span>
            </label>
          </div>

          <div v-if="pageSelectionMode === 'custom'" class="custom-range-row">
            <input
              v-model="customPageRange"
              type="text"
              placeholder="e.g. 1-3, 5"
              class="range-input-field"
              @keyup.enter="startConversion"
            />
            <button type="button" class="btn-range-apply" @click="startConversion">
              Apply
            </button>
          </div>
        </div>

        <!-- Features & Toggles Card -->
        <div class="control-box">
          <div class="control-box-header">
            <Sliders :size="15" />
            <span>Document Options</span>
          </div>
          <div class="options-checklist">
            <label class="check-item" v-if="totalPages > 1">
              <input v-model="includeNav" type="checkbox" />
              <span>Floating Page Navigator</span>
            </label>
            <label class="check-item">
              <input v-model="embedBackgrounds" type="checkbox" />
              <span>Extract Embedded Images & Artwork</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Busy Progress Track -->
      <div v-if="busy" class="conversion-progress-box">
        <div class="progress-bar-head">
          <div class="progress-desc">
            <RefreshCw :size="14" class="spinning-icon" />
            <span>{{ progress }}</span>
          </div>
          <span class="progress-val">{{ progressPercent }}%</span>
        </div>
        <div class="track-bar">
          <div class="fill-bar" :style="{ width: progressPercent + '%' }" />
        </div>
      </div>

      <!-- Live Studio Workspace: Preview & Code -->
      <div v-if="generatedHtml" class="workspace-studio-preview">
        <!-- Preview Toolbar -->
        <div class="preview-nav-bar">
          <!-- Main Tab Switcher -->
          <div class="preview-main-tabs" role="tablist">
            <button
              type="button"
              class="preview-tab-btn"
              :class="{ active: previewTab === 'render' }"
              @click="previewTab = 'render'"
            >
              <Eye :size="15" /> Live Rendered View
            </button>
            <button
              type="button"
              class="preview-tab-btn"
              :class="{ active: previewTab === 'code' }"
              @click="previewTab = 'code'"
            >
              <Code2 :size="15" /> HTML Source Code
            </button>
          </div>

          <!-- Viewport Switcher for Rendered Tab -->
          <div v-if="previewTab === 'render'" class="viewport-buttons-group">
            <button
              type="button"
              title="Desktop Viewport (100%)"
              class="vp-btn"
              :class="{ active: previewViewport === 'desktop' }"
              @click="previewViewport = 'desktop'"
            >
              <Laptop :size="15" />
            </button>
            <button
              type="button"
              title="Tablet Viewport (768px)"
              class="vp-btn"
              :class="{ active: previewViewport === 'tablet' }"
              @click="previewViewport = 'tablet'"
            >
              <Tablet :size="15" />
            </button>
            <button
              type="button"
              title="Mobile Viewport (375px)"
              class="vp-btn"
              :class="{ active: previewViewport === 'mobile' }"
              @click="previewViewport = 'mobile'"
            >
              <Smartphone :size="15" />
            </button>
          </div>

          <!-- Top Quick Actions -->
          <div class="preview-quick-actions">
            <button
              type="button"
              class="action-btn-subtle"
              title="Open full page in new browser tab"
              @click="openInNewTab"
            >
              <ExternalLink :size="14" /> Open Tab
            </button>
            <button
              type="button"
              class="copy-quick-btn"
              :class="{ copied: copied }"
              @click="copyHtmlCode"
            >
              <CheckCheck v-if="copied" :size="14" />
              <Copy v-else :size="14" />
              <span>{{ copied ? 'Copied HTML!' : 'Copy Code' }}</span>
            </button>
          </div>
        </div>

        <!-- Rendered Iframe Stage -->
        <div
          v-show="previewTab === 'render'"
          class="preview-iframe-wrapper"
          :class="`vp-${previewViewport}`"
        >
          <iframe
            ref="previewIframe"
            class="live-iframe-element"
            sandbox="allow-same-origin allow-scripts"
            title="Rendered PDF to HTML Output"
          />
        </div>

        <!-- HTML Code Stage -->
        <div v-show="previewTab === 'code'" class="preview-code-wrapper">
          <div class="code-summary-bar">
            <span class="code-badge">Live Editable</span>
            <span class="sep">&bull;</span>
            <span>{{ (generatedHtml.length / 1024).toFixed(1) }} KB HTML Document</span>
            <span class="sep">&bull;</span>
            <span>{{ generatedHtml.split('\n').length }} Total Lines</span>
            <div class="code-actions-group">
              <button
                v-if="isCodeModified"
                type="button"
                class="code-reset-btn"
                title="Reset code to original converted state"
                @click="resetHtmlCode"
              >
                <RotateCcw :size="12" /> Reset
              </button>
              <button type="button" class="code-copy-link" @click="copyHtmlCode">
                <Copy :size="12" /> {{ copied ? 'Copied!' : 'Copy all' }}
              </button>
            </div>
          </div>
          <textarea
            v-model="generatedHtml"
            class="code-editor-textarea"
            spellcheck="false"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            placeholder="Edit HTML code directly here..."
            @input="handleCodeInput"
            @keydown.tab.prevent="handleTabKey"
          ></textarea>
        </div>
      </div>

      <!-- Action & Download Buttons -->
      <div v-if="generatedHtml" class="studio-bottom-actions">
        <button
          type="button"
          class="primary-button download-main-btn"
          @click="downloadHtmlFile"
        >
          <Download :size="18" />
          Download Standalone HTML
        </button>

        <button
          v-if="generatedPagesData.length > 1"
          type="button"
          class="btn-secondary"
          :disabled="zipBusy"
          @click="downloadZipArchive"
        >
          <FolderArchive :size="18" />
          {{ zipBusy ? 'Packaging ZIP…' : 'Download Multi-Page ZIP' }}
        </button>

        <button
          type="button"
          class="btn-secondary"
          @click="copyHtmlCode"
        >
          <Copy :size="18" />
          {{ copied ? 'Copied to Clipboard!' : 'Copy HTML Code' }}
        </button>

        <button
          type="button"
          class="text-button"
          @click="resetAll"
        >
          Convert another document <ArrowRight :size="15" />
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pdf-to-html-converter {
  width: 100%;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* Custom HTML Badge in Document Pair */
.html-custom-badge {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 72px;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  background: linear-gradient(145deg, #eff6ff, #dbeafe);
  transform: rotate(8deg);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.15);
  animation: html-float 4s 0.6s ease-in-out infinite;
}
.html-custom-badge b {
  position: absolute;
  bottom: 12px;
  left: -8px;
  padding: 4px 7px;
  color: white;
  background: #2563eb;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
}

@keyframes html-float {
  0%, 100% { transform: rotate(8deg) translateY(0); }
  50% { transform: rotate(6deg) translateY(-6px); }
}

/* Studio Workspace Container */
.html-studio {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
}

/* Sub-action buttons */
.action-btn-subtle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border, #cbd5e1);
  background: transparent;
  color: var(--text-muted, #64748b);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
:global(html.dark) .action-btn-subtle {
  border-color: #334155;
  color: #94a3b8;
}
.action-btn-subtle:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-heading, #0f172a);
}
:global(html.dark) .action-btn-subtle:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
}

/* Controls Grid */
.studio-controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}
.control-box {
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
:global(html.dark) .control-box {
  background: #111827;
  border-color: #1e293b;
}
.control-box-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
:global(html.dark) .control-box-header {
  color: #94a3b8;
}

/* Mode cards */
.mode-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mode-card {
  text-align: left;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border, #e2e8f0);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}
:global(html.dark) .mode-card {
  border-color: #334155;
}
.mode-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mode-card-top b {
  font-size: 13px;
  color: var(--text-heading, #0f172a);
}
:global(html.dark) .mode-card-top b {
  color: #f8fafc;
}
.mode-check {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  color: #ffffff;
}
.mode-card small {
  display: block;
  font-size: 11px;
  color: var(--text-muted, #64748b);
  margin-top: 2px;
  line-height: 1.3;
}
.mode-card.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.06);
}
:global(html.dark) .mode-card.active {
  background: rgba(59, 130, 246, 0.15);
}

/* Themes grid */
.themes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}
.theme-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 7px;
  border: 1px solid var(--border, #e2e8f0);
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-heading, #1e293b);
  transition: all 0.2s;
}
:global(html.dark) .theme-btn {
  border-color: #334155;
  color: #e2e8f0;
}
.theme-btn.active {
  border-color: #e11d48;
  background: rgba(99, 102, 241, 0.08);
  color: #e11d48;
}
:global(html.dark) .theme-btn.active {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}
.theme-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.theme-color-dot.modern { background: #e11d48; }
.theme-color-dot.minimal { background: #3b82f6; }
.theme-color-dot.dark { background: #0f172a; }
.theme-color-dot.plain { background: #94a3b8; }

/* Range radios */
.range-radios {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.radio-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 7px;
  border: 1px solid var(--border, #cbd5e1);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-heading, #1e293b);
}
:global(html.dark) .radio-pill {
  border-color: #334155;
  color: #e2e8f0;
}
.radio-pill.selected {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  color: #2563eb;
}
:global(html.dark) .radio-pill.selected {
  color: #60a5fa;
}
.custom-range-row {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}
.range-input-field {
  flex: 1;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border, #cbd5e1);
  background: var(--surface-bg, #ffffff);
  color: var(--text-heading, #0f172a);
  font-size: 12px;
}
:global(html.dark) .range-input-field {
  background: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}
.btn-range-apply {
  padding: 6px 12px;
  border-radius: 6px;
  background: #3b82f6;
  color: #ffffff;
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

/* Options checklist */
.options-checklist {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.check-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-heading, #1e293b);
  cursor: pointer;
}
:global(html.dark) .check-item {
  color: #e2e8f0;
}

/* Progress track */
.conversion-progress-box {
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  padding: 12px 16px;
}
:global(html.dark) .conversion-progress-box {
  background: #111827;
  border-color: #1e293b;
}
.progress-bar-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  margin-bottom: 8px;
}
.progress-desc {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #3b82f6;
  font-weight: 600;
}
.spinning-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.progress-val {
  font-weight: 700;
  color: var(--text-heading, #0f172a);
}
:global(html.dark) .progress-val {
  color: #f8fafc;
}
.track-bar {
  height: 6px;
  border-radius: 3px;
  background: rgba(148, 163, 184, 0.2);
  overflow: hidden;
}
.fill-bar {
  height: 100%;
  background: var(--primary-gradient);
  transition: width 0.2s ease;
}

/* Studio Preview & Code */
.workspace-studio-preview {
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
}
:global(html.dark) .workspace-studio-preview {
  background: #111827;
  border-color: #1e293b;
}

/* Preview toolbar */
.preview-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid var(--border, #e2e8f0);
  gap: 10px;
  flex-wrap: wrap;
}
:global(html.dark) .preview-nav-bar {
  background: rgba(255, 255, 255, 0.02);
  border-color: #1e293b;
}
.preview-main-tabs {
  display: flex;
  gap: 4px;
}
.preview-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--text-muted, #64748b);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
:global(html.dark) .preview-tab-btn {
  color: #94a3b8;
}
.preview-tab-btn.active {
  background: #ffffff;
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
:global(html.dark) .preview-tab-btn.active {
  background: #1e293b;
  color: #60a5fa;
}

/* Viewport switcher */
.viewport-buttons-group {
  display: flex;
  gap: 2px;
  background: rgba(148, 163, 184, 0.15);
  padding: 2px;
  border-radius: 6px;
}
.vp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 26px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  transition: all 0.2s ease;
}
.vp-btn.active {
  background: #ffffff;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
:global(html.dark) .vp-btn.active {
  background: #1e293b;
  color: #60a5fa;
}

/* Preview actions */
.preview-quick-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.copy-quick-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 7px;
  border: 1px solid var(--border, #cbd5e1);
  background: #ffffff;
  color: var(--text-heading, #0f172a);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
:global(html.dark) .copy-quick-btn {
  background: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}
.copy-quick-btn.copied {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
}

/* Iframe Stage */
.preview-iframe-wrapper {
  padding: 20px;
  background: #f1f5f9;
  display: flex;
  justify-content: center;
  overflow-x: auto;
  min-height: 540px;
}
:global(html.dark) .preview-iframe-wrapper {
  background: #0b0f19;
}
.live-iframe-element {
  width: 100%;
  height: 640px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: width 0.3s ease;
}
.preview-iframe-wrapper.vp-tablet .live-iframe-element {
  width: 768px;
}
.preview-iframe-wrapper.vp-mobile .live-iframe-element {
  width: 375px;
}

/* Code Stage */
.preview-code-wrapper {
  display: flex;
  flex-direction: column;
}
.code-summary-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #0f172a;
  color: #94a3b8;
  font-size: 12px;
  font-family: monospace;
  border-bottom: 1px solid #1e293b;
}
.sep {
  opacity: 0.5;
}
.code-badge {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.code-actions-group {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}
.code-reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: #f87171;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 3px 8px;
  border-radius: 4px;
  transition: background 0.15s ease, color 0.15s ease;
}
.code-reset-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}
.code-copy-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: #60a5fa;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 3px 8px;
  border-radius: 4px;
  transition: background 0.15s ease, color 0.15s ease;
}
.code-copy-link:hover {
  background: rgba(96, 165, 250, 0.15);
  color: #93c5fd;
  text-decoration: none;
}
.code-editor-textarea {
  width: 100%;
  min-height: 560px;
  max-height: 640px;
  box-sizing: border-box;
  padding: 16px;
  background: #0b0f19;
  color: #e2e8f0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  border: none;
  outline: none;
  resize: vertical;
  white-space: pre;
  overflow: auto;
  tab-size: 2;
  -moz-tab-size: 2;
}
.code-editor-textarea:focus {
  background: #070b13;
}

/* Bottom Action Bar */
.studio-bottom-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  padding-top: 4px;
}
.download-main-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 700;
  width: auto;
}
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 18px;
  background: var(--surface-card, #ffffff);
  color: var(--text-heading, #0f172a);
  border: 1px solid var(--border, #cbd5e1);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
:global(html.dark) .btn-secondary {
  background: #111827;
  border-color: #334155;
  color: #f8fafc;
}
.btn-secondary:hover {
  background: rgba(0, 0, 0, 0.04);
}
:global(html.dark) .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.06);
}

@media (max-width: 768px) {
  .studio-controls-grid {
    grid-template-columns: 1fr;
  }
  .preview-nav-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  .preview-quick-actions {
    width: 100%;
    justify-content: flex-end;
  }
  .preview-iframe-wrapper {
    padding: 10px;
  }
  .live-iframe-element {
    height: 480px;
  }
  .studio-bottom-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .download-main-btn,
  .btn-secondary {
    justify-content: center;
  }
}
</style>
