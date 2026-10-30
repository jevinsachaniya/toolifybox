<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import {
  ArrowLeftRight,
  ArrowUpDown,
  Check,
  CheckCheck,
  CircleAlert,
  Copy,
  Crop,
  Download,
  FlipHorizontal,
  FlipVertical,
  Grid2x2,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  LoaderCircle,
  Maximize2,
  Move,
  Palette,
  Plus,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  X,
} from '@lucide/vue';
import {
  ASPECT_RATIOS,
  calculateCollageLayout,
  calculateNormalizedCrop,
  COLLAGE_LAYOUTS,
  COLLAGE_PRESET_COLORS,
  collageOutputFilename,
  drawImageInCell,
  getAspectCropPreset,
  MAX_COLLAGE_IMAGES,
  validateCollageImages,
} from '~/utils/image-collage.js';
import { formatSize } from '~/utils/document.js';

// State
const images = ref([]); // { id, name, size, file, imgObj, rotation: 0, flipH: false, flipV: false, crop: null, cropPreset: 'free' }
const selectedLayout = ref('side-by-side');
const selectedAspectRatio = ref('1:1');
const gap = ref(12);
const padding = ref(16);
const cornerRadius = ref(8);
const fitMode = ref('cover'); // 'cover' | 'contain'
const backgroundColor = ref('#ffffff');
const customColor = ref('#ffffff');
const exportFormat = ref('jpg'); // 'jpg' | 'png'
const jpgQuality = ref(0.92);
const splitRatio = ref(0.5); // For 2-image layouts

// Crop State
const cropModalOpen = ref(false);
const activeCropIndex = ref(null);
const cropCanvas = ref(null);
const cropRect = ref({ x: 0, y: 0, width: 1, height: 1 });
const cropPreset = ref('free');
const isDraggingCrop = ref(false);
const dragStart = ref({ mx: 0, my: 0, startX: 0, startY: 0, drawW: 1, drawH: 1 });

const busy = ref(false);
const dragging = ref(false);
const error = ref('');
const progress = ref('');
const copied = ref(false);
const resultImage = ref(null); // { blob, url, filename, size, width, height }

const previewCanvas = ref(null);
const fileInput = ref(null);
const addMoreInput = ref(null);
const uploadButton = ref(null);

let dropDepth = 0;
let renderTimer = null;
let active = true;

const stage = computed(() => {
  if (resultImage.value) return 3;
  if (images.value.length >= 2) return 2;
  return 1;
});

// Available layouts filtered or recommended for the current image count
const applicableLayouts = computed(() => {
  const count = images.value.length;
  if (count <= 1) return COLLAGE_LAYOUTS;

  return COLLAGE_LAYOUTS.map(layout => {
    let disabled = false;
    let badge = '';

    if (count < layout.minImages || count > layout.maxImages) {
      disabled = true;
    }

    if (count === 2 && (layout.id === 'side-by-side' || layout.id === 'stacked')) {
      badge = 'Best match';
    } else if (count === 4 && layout.id === 'grid-2x2') {
      badge = 'Best match';
    } else if (count === 3 && (layout.id === 'three-col' || layout.id === 'three-row' || layout.id === 'main-left')) {
      badge = 'Popular';
    }

    return { ...layout, disabled, badge };
  });
});

// Current aspect ratio configuration
const currentAspect = computed(() => {
  return ASPECT_RATIOS.find(a => a.id === selectedAspectRatio.value) || ASPECT_RATIOS[0];
});

const activeCropImage = computed(() => {
  if (activeCropIndex.value === null || activeCropIndex.value < 0 || activeCropIndex.value >= images.value.length) {
    return null;
  }
  return images.value[activeCropIndex.value];
});

// Lifecycle
function handleKeyDown(e) {
  if (e.key === 'Escape' && cropModalOpen.value) {
    closeCropModal();
  }
}

function handleResize() {
  if (cropModalOpen.value) {
    drawCropModalCanvas();
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
  }
});

onBeforeUnmount(() => {
  active = false;
  clearTimeout(renderTimer);
  clearResult();
  releaseImages();
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('resize', handleResize);
  }
});

function clearResult() {
  if (resultImage.value?.url) {
    URL.revokeObjectURL(resultImage.value.url);
  }
  resultImage.value = null;
}

function releaseImages() {
  for (const item of images.value) {
    if (item.url) URL.revokeObjectURL(item.url);
  }
  images.value = [];
}

// Drag & Drop handlers
function dragEnter() {
  if (!busy.value) {
    dropDepth++;
    dragging.value = true;
  }
}

function dragOver(e) {
  e.dataTransfer.dropEffect = busy.value ? 'none' : 'copy';
}

function dragLeave() {
  dropDepth = Math.max(0, dropDepth - 1);
  if (!dropDepth) dragging.value = false;
}

function drop(e) {
  dropDepth = 0;
  dragging.value = false;
  void addFiles(e.dataTransfer.files);
}

function onFileSelect(e) {
  void addFiles(e.target.files);
  e.target.value = '';
}

function onAddMoreSelect(e) {
  void addFiles(e.target.files);
  e.target.value = '';
}

// Image Loader
async function addFiles(fileList) {
  if (busy.value || !fileList?.length) return;
  error.value = '';

  const validation = validateCollageImages(fileList, images.value.length);
  if (!validation.valid) {
    error.value = validation.message;
    return;
  }

  busy.value = true;
  progress.value = 'Loading photos…';

  try {
    const loadedItems = [];
    for (const f of validation.files) {
      const url = URL.createObjectURL(f);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error(`Failed to load ${f.name}`));
        img.src = url;
      });

      loadedItems.push({
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        size: f.size,
        file: f,
        url,
        imgObj: img,
        rotation: 0,
        flipH: false,
        flipV: false,
        crop: null,
        cropPreset: 'free',
      });
    }

    if (active) {
      images.value = [...images.value, ...loadedItems];

      // Auto pick best matching layout based on new count
      const count = images.value.length;
      if (count === 2) {
        selectedLayout.value = 'side-by-side';
      } else if (count === 3) {
        selectedLayout.value = 'main-left';
      } else if (count === 4) {
        selectedLayout.value = 'grid-2x2';
      } else if (count > 4) {
        selectedLayout.value = 'auto-grid';
      }

      await nextTick();
      scheduleRender();
    }
  } catch (err) {
    if (active) {
      error.value = err.message || 'Error loading photos. Please try different images.';
    }
  } finally {
    if (active) {
      busy.value = false;
      progress.value = '';
    }
  }
}

// Layout & Image Management
function removeImage(index) {
  if (busy.value) return;
  const removed = images.value.splice(index, 1)[0];
  if (removed?.url) URL.revokeObjectURL(removed.url);

  // Auto adjust layout if needed
  const count = images.value.length;
  if (count < 2) {
    clearResult();
    return;
  }
  if (count === 2 && (selectedLayout.value === 'grid-2x2' || selectedLayout.value === 'three-col')) {
    selectedLayout.value = 'side-by-side';
  } else if (count === 3 && selectedLayout.value === 'grid-2x2') {
    selectedLayout.value = 'main-left';
  }
  scheduleRender();
}

function moveImage(index, direction) {
  if (busy.value) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= images.value.length) return;

  const copy = [...images.value];
  const temp = copy[index];
  copy[index] = copy[targetIndex];
  copy[targetIndex] = temp;
  images.value = copy;
  scheduleRender();
}

function rotateImage(index, delta = 90) {
  if (busy.value) return;
  const item = images.value[index];
  if (!item) return;
  item.rotation = (item.rotation + delta) % 360;
  scheduleRender();
}

function toggleFlipH(index) {
  if (busy.value) return;
  const item = images.value[index];
  if (!item) return;
  item.flipH = !item.flipH;
  scheduleRender();
}

function toggleFlipV(index) {
  if (busy.value) return;
  const item = images.value[index];
  if (!item) return;
  item.flipV = !item.flipV;
  scheduleRender();
}

function selectColor(val) {
  backgroundColor.value = val;
  scheduleRender();
}

function onCustomColorInput(e) {
  backgroundColor.value = e.target.value;
  scheduleRender();
}

// Schedule canvas redrawing with debounce
function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    drawCollagePreview();
  }, 16);
}

// Watch settings and trigger canvas redraws
watch([selectedLayout, selectedAspectRatio, gap, padding, cornerRadius, fitMode, backgroundColor, splitRatio], () => {
  scheduleRender();
});

// Render collage to canvas
function drawCollagePreview() {
  const canvas = previewCanvas.value;
  if (!canvas || images.value.length < 2) return;

  const count = images.value.length;
  const targetAspect = currentAspect.value;
  const width = targetAspect.width;
  const height = targetAspect.height;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  // Background
  if (backgroundColor.value && backgroundColor.value !== 'transparent') {
    ctx.fillStyle = backgroundColor.value;
    ctx.fillRect(0, 0, width, height);
  }

  // Calculate cell layout
  const rects = calculateCollageLayout(selectedLayout.value, count, width, height, {
    gap: gap.value,
    padding: padding.value,
    splitRatio: splitRatio.value,
  });

  // Render each image in its calculated cell
  for (let i = 0; i < rects.length && i < count; i++) {
    const item = images.value[i];
    const rect = rects[i];
    drawImageInCell(ctx, item.imgObj, rect, {
      radius: cornerRadius.value,
      fitMode: fitMode.value,
      rotation: item.rotation,
      flipH: item.flipH,
      flipV: item.flipV,
      crop: item.crop,
      cellBackground: backgroundColor.value === 'transparent' ? 'transparent' : undefined,
    });
  }
}

// Crop Modal Methods
async function openCropModal(index) {
  if (busy.value || index < 0 || index >= images.value.length) return;
  const item = images.value[index];
  if (!item?.imgObj) return;

  activeCropIndex.value = index;
  cropPreset.value = item.cropPreset || 'free';
  if (item.crop) {
    cropRect.value = { ...item.crop };
  } else {
    cropRect.value = { x: 0, y: 0, width: 1, height: 1 };
  }

  cropModalOpen.value = true;
  await nextTick();
  drawCropModalCanvas();
}

function closeCropModal() {
  cropModalOpen.value = false;
  activeCropIndex.value = null;
  isDraggingCrop.value = false;
}

function applyCrop() {
  if (activeCropIndex.value === null || !activeCropImage.value) return;
  const item = images.value[activeCropIndex.value];

  // If crop is essentially full image, store null
  if (
    cropRect.value.x <= 0.005 &&
    cropRect.value.y <= 0.005 &&
    cropRect.value.width >= 0.995 &&
    cropRect.value.height >= 0.995
  ) {
    item.crop = null;
  } else {
    item.crop = {
      x: Number(cropRect.value.x.toFixed(4)),
      y: Number(cropRect.value.y.toFixed(4)),
      width: Number(cropRect.value.width.toFixed(4)),
      height: Number(cropRect.value.height.toFixed(4)),
    };
  }
  item.cropPreset = cropPreset.value;

  closeCropModal();
  scheduleRender();
}

function resetCrop() {
  cropRect.value = { x: 0, y: 0, width: 1, height: 1 };
  cropPreset.value = 'free';
  drawCropModalCanvas();
}

function setCropPreset(presetId) {
  cropPreset.value = presetId;
  if (!activeCropImage.value?.imgObj) return;

  const img = activeCropImage.value.imgObj;
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;

  if (presetId === 'free') {
    // Keep current crop
    return;
  }
  if (presetId === 'full') {
    cropRect.value = { x: 0, y: 0, width: 1, height: 1 };
  } else if (presetId === '1:1') {
    cropRect.value = getAspectCropPreset(nw, nh, 1);
  } else if (presetId === '4:3') {
    cropRect.value = getAspectCropPreset(nw, nh, 4 / 3);
  } else if (presetId === '16:9') {
    cropRect.value = getAspectCropPreset(nw, nh, 16 / 9);
  } else if (presetId === '9:16') {
    cropRect.value = getAspectCropPreset(nw, nh, 9 / 16);
  } else if (presetId === '3:4') {
    cropRect.value = getAspectCropPreset(nw, nh, 3 / 4);
  } else if (presetId === 'slot') {
    const count = images.value.length;
    const targetAspect = currentAspect.value;
    const rects = calculateCollageLayout(
      selectedLayout.value,
      count,
      targetAspect.width,
      targetAspect.height,
      { gap: gap.value, padding: padding.value, splitRatio: splitRatio.value }
    );
    const cell = rects[activeCropIndex.value] || rects[0];
    const slotRatio = (cell.width || 1) / (cell.height || 1);
    cropRect.value = getAspectCropPreset(nw, nh, slotRatio);
  }

  drawCropModalCanvas();
}

function drawCropModalCanvas() {
  const canvas = cropCanvas.value;
  if (!canvas || !activeCropImage.value?.imgObj) return;

  const img = activeCropImage.value.imgObj;
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;

  const containerW = canvas.parentElement?.clientWidth || 560;
  const targetW = Math.max(280, Math.min(680, containerW));
  const targetH = Math.max(200, Math.min(420, Math.round(targetW * 0.65)));

  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, targetW, targetH);

  // Background slate
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, targetW, targetH);

  // Image placement
  const pad = 16;
  const availW = targetW - pad * 2;
  const availH = targetH - pad * 2;
  const scale = Math.min(availW / nw, availH / nh);
  const drawW = nw * scale;
  const drawH = nh * scale;
  const drawX = (targetW - drawW) / 2;
  const drawY = (targetH - drawH) / 2;

  // Draw photo
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  // Crop overlay
  const c = cropRect.value;
  const boxX = drawX + c.x * drawW;
  const boxY = drawY + c.y * drawH;
  const boxW = c.width * drawW;
  const boxH = c.height * drawH;

  // Dim outer area
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(drawX, drawY, drawW, Math.max(0, boxY - drawY));
  ctx.fillRect(drawX, boxY + boxH, drawW, Math.max(0, drawY + drawH - (boxY + boxH)));
  ctx.fillRect(drawX, boxY, Math.max(0, boxX - drawX), boxH);
  ctx.fillRect(boxX + boxW, boxY, Math.max(0, drawX + drawW - (boxX + boxW)), boxH);

  // Crop border
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Rule of thirds lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(boxX + boxW / 3, boxY);
  ctx.lineTo(boxX + boxW / 3, boxY + boxH);
  ctx.moveTo(boxX + (boxW * 2) / 3, boxY);
  ctx.lineTo(boxX + (boxW * 2) / 3, boxY + boxH);
  ctx.moveTo(boxX, boxY + boxH / 3);
  ctx.lineTo(boxX + boxW, boxY + boxH / 3);
  ctx.moveTo(boxX, boxY + (boxH * 2) / 3);
  ctx.lineTo(boxX + boxW, boxY + (boxH * 2) / 3);
  ctx.stroke();
  ctx.setLineDash([]);

  // Corner markers
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#be123c';
  ctx.lineWidth = 2;
  const handleRadius = 5;
  const corners = [
    [boxX, boxY],
    [boxX + boxW, boxY],
    [boxX, boxY + boxH],
    [boxX + boxW, boxY + boxH],
  ];
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, handleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function onCropPointerDown(e) {
  const canvas = cropCanvas.value;
  if (!canvas || !activeCropImage.value?.imgObj) return;

  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);

  const img = activeCropImage.value.imgObj;
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  const pad = 16;
  const scale = Math.min((canvas.width - pad * 2) / nw, (canvas.height - pad * 2) / nh);
  const drawW = nw * scale;
  const drawH = nh * scale;

  isDraggingCrop.value = true;
  dragStart.value = {
    mx,
    my,
    startX: cropRect.value.x,
    startY: cropRect.value.y,
    drawW,
    drawH,
  };
}

function onCropPointerMove(e) {
  if (!isDraggingCrop.value || !cropCanvas.value) return;

  const canvas = cropCanvas.value;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);

  const dx = (mx - dragStart.value.mx) / (dragStart.value.drawW || 1);
  const dy = (my - dragStart.value.my) / (dragStart.value.drawH || 1);

  const maxX = Math.max(0, 1 - cropRect.value.width);
  const maxY = Math.max(0, 1 - cropRect.value.height);

  cropRect.value.x = Number(Math.max(0, Math.min(maxX, dragStart.value.startX + dx)).toFixed(4));
  cropRect.value.y = Number(Math.max(0, Math.min(maxY, dragStart.value.startY + dy)).toFixed(4));

  drawCropModalCanvas();
}

function onCropPointerUp() {
  isDraggingCrop.value = false;
}

function onCropTouchDown(e) {
  if (e.touches && e.touches[0]) {
    onCropPointerDown(e.touches[0]);
  }
}

function onCropTouchMove(e) {
  if (e.touches && e.touches[0]) {
    onCropPointerMove(e.touches[0]);
  }
}

function onCropSizeSlider(val) {
  const newW = Number(val);
  const currentAspectRatio = cropRect.value.width / (cropRect.value.height || 1);
  let newH = newW / currentAspectRatio;
  if (newH > 1) newH = 1;

  const centerX = cropRect.value.x + cropRect.value.width / 2;
  const centerY = cropRect.value.y + cropRect.value.height / 2;

  cropRect.value.width = Number(newW.toFixed(4));
  cropRect.value.height = Number(newH.toFixed(4));
  cropRect.value.x = Number(Math.max(0, Math.min(1 - newW, centerX - newW / 2)).toFixed(4));
  cropRect.value.y = Number(Math.max(0, Math.min(1 - newH, centerY - newH / 2)).toFixed(4));
  drawCropModalCanvas();
}

function onCropXSlider(val) {
  cropRect.value.x = Number(Number(val).toFixed(4));
  drawCropModalCanvas();
}

function onCropYSlider(val) {
  cropRect.value.y = Number(Number(val).toFixed(4));
  drawCropModalCanvas();
}

// Export Collage
async function generateCollageOutput() {
  const canvas = previewCanvas.value;
  if (!canvas || images.value.length < 2 || busy.value) return;

  busy.value = true;
  error.value = '';
  progress.value = 'Rendering final high-resolution collage…';
  clearResult();

  try {
    drawCollagePreview();

    const mimeType = exportFormat.value === 'png' ? 'image/png' : 'image/jpeg';
    const quality = exportFormat.value === 'png' ? undefined : jpgQuality.value;

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error('Failed to generate image blob.'))),
        mimeType,
        quality
      );
    });

    const url = URL.createObjectURL(blob);
    const filename = collageOutputFilename(exportFormat.value);

    if (active) {
      resultImage.value = {
        blob,
        url,
        filename,
        size: blob.size,
        width: canvas.width,
        height: canvas.height,
        format: exportFormat.value.toUpperCase(),
      };
    }
  } catch (err) {
    if (active) {
      error.value = err.message || 'Failed to export collage. Try again.';
    }
  } finally {
    if (active) {
      busy.value = false;
      progress.value = '';
    }
  }
}

// Copy to Clipboard
async function copyImageToClipboard() {
  if (!resultImage.value?.blob || copied.value) return;
  try {
    // ClipboardItem requires image/png
    let pngBlob = resultImage.value.blob;
    if (resultImage.value.blob.type !== 'image/png') {
      const canvas = previewCanvas.value;
      pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    }

    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      copied.value = true;
      setTimeout(() => { copied.value = false; }, 2600);
    } else {
      throw new Error('Clipboard image copy not supported in this browser.');
    }
  } catch (err) {
    error.value = 'Could not copy to clipboard. Please use the Download button.';
  }
}

function resetAll() {
  clearResult();
  releaseImages();
  error.value = '';
  gap.value = 12;
  padding.value = 16;
  cornerRadius.value = 8;
  fitMode.value = 'cover';
  backgroundColor.value = '#ffffff';
  selectedAspectRatio.value = '1:1';
  selectedLayout.value = 'side-by-side';
  splitRatio.value = 0.5;
}
</script>

<template>
  <section
    id="converter"
    class="converter image-collage-converter"
    :class="{ 'is-converting': busy, 'has-images': images.length >= 2, 'has-result': resultImage }"
    aria-label="Image Collage Maker"
    :aria-busy="busy"
  >
    <div class="converter-heading">
      <div>
        <span class="mini-label">CREATIVE LAYOUT STUDIO</span>
        <h2>Make Image Collage</h2>
      </div>
      <span class="free-badge">100% Private</span>
    </div>

    <ol class="step-track" aria-label="Collage steps">
      <li
        v-for="(label, index) in ['Select photos', 'Position & Design', 'Download collage']"
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

    <!-- Hidden file inputs -->
    <input
      id="collage-file-input"
      ref="fileInput"
      class="visually-hidden"
      tabindex="-1"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
      multiple
      :disabled="busy"
      aria-label="Choose image files to make a collage"
      @change="onFileSelect"
    />
    <input
      id="collage-add-more-input"
      ref="addMoreInput"
      class="visually-hidden"
      tabindex="-1"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
      multiple
      :disabled="busy"
      aria-label="Add more photos"
      @change="onAddMoreSelect"
    />

    <!-- Stage 3: Download & Success State -->
    <template v-if="resultImage">
      <div class="result-state collage-result-state">
        <div class="file-chosen-icon" style="background: var(--primary-gradient); color: #fff; width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; margin: 0 auto 16px;">
          <CheckCheck :size="30" />
        </div>
        <h3>Your Collage is Ready!</h3>
        <p>Combined {{ images.length }} photos into a high-resolution {{ resultImage.width }}×{{ resultImage.height }}px masterpiece.</p>

        <!-- Result Preview thumbnail -->
        <div class="collage-result-preview-wrap">
          <img :src="resultImage.url" :alt="resultImage.filename" class="collage-result-img" />
        </div>

        <div class="selected-file" style="margin: 20px 0;">
          <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
            <div style="color: #e11d48; background: #fff1f2; padding: 10px; border-radius: 10px; display: grid; place-items: center;">
              <ImageIcon :size="20" />
            </div>
            <div style="flex: 1; min-width: 0;">
              <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ resultImage.filename }}</strong>
              <span style="font-size: 12px; color: #64748b;">
                {{ formatSize(resultImage.size) }} · {{ resultImage.width }} × {{ resultImage.height }}px · {{ resultImage.format }}
              </span>
            </div>
          </div>
        </div>

        <div class="result-actions collage-result-actions">
          <a class="primary-button" :href="resultImage.url" :download="resultImage.filename" style="background: var(--primary-gradient);">
            <Download :size="18" /> Download Collage
          </a>
          <button type="button" class="btn-copy-clipboard" :class="{ copied }" @click="copyImageToClipboard">
            <Check v-if="copied" :size="16" />
            <Copy v-else :size="16" />
            {{ copied ? 'Copied to Clipboard!' : 'Copy to Clipboard' }}
          </button>
          <button type="button" class="text-button" @click="clearResult">
            Back to editor
          </button>
          <button type="button" class="text-button" style="color: #ef4444;" @click="resetAll">
            <RotateCcw :size="15" /> Start new collage
          </button>
        </div>
      </div>
    </template>

    <!-- Stage 2: Interactive Collage Studio -->
    <template v-else-if="images.length >= 2">
      <div class="collage-studio">
        <!-- Studio Toolbar Header -->
        <div class="studio-header">
          <div class="studio-header-left">
            <span class="photo-count-pill">
              <b>{{ images.length }}</b> {{ images.length === 1 ? 'photo' : 'photos' }}
            </span>
            <button
              v-if="images.length < MAX_COLLAGE_IMAGES"
              type="button"
              class="btn-add-photos"
              :disabled="busy"
              @click="addMoreInput?.click()"
            >
              <Plus :size="14" /> Add Photos
            </button>
          </div>
          <button type="button" class="btn-reset-studio" :disabled="busy" @click="resetAll">
            <RotateCcw :size="14" /> Reset
          </button>
        </div>

        <div class="studio-body-layout">
          <!-- Left: Live High-Res Canvas Preview -->
          <div class="canvas-preview-column">
            <div class="canvas-viewport" :style="{ aspectRatio: `${currentAspect.width} / ${currentAspect.height}` }">
              <canvas ref="previewCanvas" class="collage-render-canvas" />
            </div>

            <!-- Positioning Quick Bar (For 2 photos) -->
            <div v-if="images.length === 2 && selectedLayout === 'side-by-side'" class="split-ratio-control">
              <span>Positioning Split:</span>
              <div class="split-pill-group">
                <button
                  type="button"
                  class="btn-split"
                  :class="{ active: splitRatio === 0.5 }"
                  @click="splitRatio = 0.5"
                >
                  50 / 50 Equal
                </button>
                <button
                  type="button"
                  class="btn-split"
                  :class="{ active: splitRatio === 0.62 }"
                  @click="splitRatio = 0.62"
                >
                  Left 60%
                </button>
                <button
                  type="button"
                  class="btn-split"
                  :class="{ active: splitRatio === 0.38 }"
                  @click="splitRatio = 0.38"
                >
                  Right 60%
                </button>
              </div>
            </div>

            <div v-if="images.length === 2 && selectedLayout === 'stacked'" class="split-ratio-control">
              <span>Positioning Split:</span>
              <div class="split-pill-group">
                <button
                  type="button"
                  class="btn-split"
                  :class="{ active: splitRatio === 0.5 }"
                  @click="splitRatio = 0.5"
                >
                  50 / 50 Equal
                </button>
                <button
                  type="button"
                  class="btn-split"
                  :class="{ active: splitRatio === 0.62 }"
                  @click="splitRatio = 0.62"
                >
                  Top 60%
                </button>
                <button
                  type="button"
                  class="btn-split"
                  :class="{ active: splitRatio === 0.38 }"
                  @click="splitRatio = 0.38"
                >
                  Bottom 60%
                </button>
              </div>
            </div>
          </div>

          <!-- Right: Studio Controls Panel -->
          <div class="studio-controls-column">
            <!-- 1. Layout Selection -->
            <div class="control-card">
              <div class="control-card-title">
                <LayoutGrid :size="15" />
                <span>Choose Layout</span>
              </div>

              <div class="layout-presets-grid">
                <button
                  v-for="lay in applicableLayouts"
                  :key="lay.id"
                  type="button"
                  class="layout-preset-btn"
                  :class="{
                    active: selectedLayout === lay.id,
                    disabled: lay.disabled
                  }"
                  :disabled="lay.disabled || busy"
                  @click="selectedLayout = lay.id"
                >
                  <div class="layout-preset-header">
                    <strong>{{ lay.name }}</strong>
                    <span v-if="lay.badge" class="layout-badge">{{ lay.badge }}</span>
                  </div>
                  <small>{{ lay.desc }}</small>
                </button>
              </div>
            </div>

            <!-- 2. Aspect Ratio Selection -->
            <div class="control-card">
              <div class="control-card-title">
                <Maximize2 :size="15" />
                <span>Aspect Ratio</span>
              </div>
              <div class="aspect-ratio-grid">
                <button
                  v-for="aspect in ASPECT_RATIOS"
                  :key="aspect.id"
                  type="button"
                  class="aspect-btn"
                  :class="{ active: selectedAspectRatio === aspect.id }"
                  :disabled="busy"
                  @click="selectedAspectRatio = aspect.id"
                >
                  <b>{{ aspect.label }}</b>
                  <small>{{ aspect.desc }}</small>
                </button>
              </div>
            </div>

            <!-- 3. Spacing, Borders & Radius -->
            <div class="control-card">
              <div class="control-card-title">
                <Sliders :size="15" />
                <span>Spacing &amp; Corners</span>
              </div>

              <div class="sliders-list">
                <div class="slider-row">
                  <div class="slider-label">
                    <span>Photo Gap</span>
                    <b>{{ gap }}px</b>
                  </div>
                  <input v-model.number="gap" type="range" min="0" max="40" step="2" :disabled="busy" />
                </div>

                <div class="slider-row">
                  <div class="slider-label">
                    <span>Outer Margin</span>
                    <b>{{ padding }}px</b>
                  </div>
                  <input v-model.number="padding" type="range" min="0" max="48" step="2" :disabled="busy" />
                </div>

                <div class="slider-row">
                  <div class="slider-label">
                    <span>Corner Radius</span>
                    <b>{{ cornerRadius }}px</b>
                  </div>
                  <input v-model.number="cornerRadius" type="range" min="0" max="36" step="2" :disabled="busy" />
                </div>
              </div>
            </div>

            <!-- 4. Background Color & Fit Mode -->
            <div class="control-card">
              <div class="control-card-title">
                <Palette :size="15" />
                <span>Background &amp; Fit</span>
              </div>

              <div class="color-swatches-wrap">
                <div class="color-swatches">
                  <button
                    v-for="c in COLLAGE_PRESET_COLORS"
                    :key="c.value"
                    type="button"
                    class="color-swatch-btn"
                    :class="{ active: backgroundColor === c.value, transparent: c.value === 'transparent' }"
                    :style="{ background: c.value === 'transparent' ? undefined : c.value }"
                    :title="c.label"
                    @click="selectColor(c.value)"
                  >
                    <Check v-if="backgroundColor === c.value" :size="12" :color="c.value === '#ffffff' || c.value === '#fef3c7' || c.value === '#f1f5f9' ? '#0f172a' : '#ffffff'" />
                  </button>
                  <label class="custom-color-picker-label" title="Pick custom color">
                    <input type="color" :value="backgroundColor" @input="onCustomColorInput" />
                    <span>Hex</span>
                  </label>
                </div>
              </div>

              <div class="fit-mode-toggle" style="margin-top: 14px;">
                <label>Photo Fit Mode:</label>
                <div class="fit-pills">
                  <button
                    type="button"
                    class="btn-fit"
                    :class="{ active: fitMode === 'cover' }"
                    @click="fitMode = 'cover'"
                  >
                    Fill &amp; Crop
                  </button>
                  <button
                    type="button"
                    class="btn-fit"
                    :class="{ active: fitMode === 'contain' }"
                    @click="fitMode = 'contain'"
                  >
                    Fit Whole Photo
                  </button>
                </div>
              </div>
            </div>

            <!-- 5. Photo Positioning & Ordering List -->
            <div class="control-card">
              <div class="control-card-title">
                <Layers :size="15" />
                <span>Manage &amp; Position Photos</span>
              </div>

              <div class="image-order-list">
                <div
                  v-for="(img, idx) in images"
                  :key="img.id"
                  class="order-item"
                >
                  <div class="order-item-left">
                    <span class="order-index">{{ idx + 1 }}</span>
                    <img :src="img.url" class="order-thumb" :alt="img.name" />
                    <span class="order-name" :title="img.name">{{ img.name }}</span>
                  </div>

                  <div class="order-item-actions">
                    <!-- Move up / down -->
                    <button
                      type="button"
                      class="btn-order-action"
                      title="Move up"
                      :disabled="idx === 0 || busy"
                      @click="moveImage(idx, -1)"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      class="btn-order-action"
                      title="Move down"
                      :disabled="idx === images.length - 1 || busy"
                      @click="moveImage(idx, 1)"
                    >
                      ↓
                    </button>
                    <!-- Rotate 90 deg -->
                    <button
                      type="button"
                      class="btn-order-action"
                      title="Rotate 90° clockwise"
                      :disabled="busy"
                      @click="rotateImage(idx, 90)"
                    >
                      <RotateCw :size="12" />
                    </button>
                    <!-- Flip Horizontal -->
                    <button
                      type="button"
                      class="btn-order-action"
                      title="Flip horizontally"
                      :disabled="busy"
                      @click="toggleFlipH(idx)"
                    >
                      <FlipHorizontal :size="12" />
                    </button>
                    <!-- Crop Photo -->
                    <button
                      type="button"
                      class="btn-order-action btn-crop"
                      :class="{ 'is-cropped': !!img.crop }"
                      title="Crop photo"
                      :disabled="busy"
                      @click="openCropModal(idx)"
                    >
                      <Crop :size="12" />
                      <span v-if="img.crop" class="crop-dot" title="Custom cropped"></span>
                    </button>
                    <!-- Remove Photo -->
                    <button
                      type="button"
                      class="btn-order-action btn-danger"
                      title="Remove from collage"
                      :disabled="busy"
                      @click="removeImage(idx)"
                    >
                      <Trash2 :size="12" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Export format selection -->
            <div class="export-options-box">
              <div class="export-format-selector">
                <label>Export Format:</label>
                <div class="format-pills">
                  <button
                    type="button"
                    class="btn-fmt"
                    :class="{ active: exportFormat === 'jpg' }"
                    @click="exportFormat = 'jpg'"
                  >
                    JPG (High Res)
                  </button>
                  <button
                    type="button"
                    class="btn-fmt"
                    :class="{ active: exportFormat === 'png' }"
                    @click="exportFormat = 'png'"
                  >
                    PNG (Lossless)
                  </button>
                </div>
              </div>

              <!-- Main Action Button -->
              <button
                type="button"
                class="primary-button btn-generate-collage"
                :disabled="busy || images.length < 2"
                style="margin-top: 16px; background: var(--primary-gradient); box-shadow: 0 4px 18px rgba(225, 29, 72, 0.4);"
                @click="generateCollageOutput"
              >
                <LoaderCircle v-if="busy" class="spin" :size="18" />
                <Sparkles v-else :size="18" />
                {{ busy ? (progress || 'Rendering collage…') : 'Export Collage Image' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Stage 1: File Selection Dropzone (Need at least 2 photos) -->
    <template v-else>
      <div
        class="drop-zone"
        :class="{ dragging }"
        tabindex="0"
        role="button"
        aria-label="Upload photos to make a collage"
        @click="fileInput?.click()"
        @keydown.enter.space.prevent="fileInput?.click()"
        @dragenter.prevent="dragEnter"
        @dragover.prevent="dragOver"
        @dragleave.prevent="dragLeave"
        @drop.prevent="drop"
      >
        <div class="drop-zone-icon" style="background: var(--primary-gradient); color: #fff;">
          <LayoutGrid :size="32" />
        </div>
        <h3>{{ dragging ? 'Drop your photos here' : 'Drop your photos to make a collage' }}</h3>
        <p>Choose 2 to 12 images. Arrange with side-by-side, stacked, and grid layouts.</p>
        <button ref="uploadButton" class="choose-button" type="button" @click.stop="fileInput?.click()">
          <Upload :size="17" /> Choose Photos (2 or more)
        </button>
        <span class="file-requirements">JPG, PNG, WebP, GIF, BMP · Up to 25 MB each · 100% Client-Side</span>
      </div>

      <!-- Single photo warning if only 1 uploaded -->
      <div v-if="images.length === 1" class="single-image-hint">
        <span><ImageIcon :size="16" /> You've selected 1 photo (<b>{{ images[0].name }}</b>). Please add at least 1 more photo to create a collage!</span>
        <button type="button" class="btn-add-photos-alt" @click="fileInput?.click()">
          <Plus :size="14" /> Add Second Photo
        </button>
      </div>
    </template>

    <!-- Busy progress bar -->
    <div v-if="busy" class="progress-track" role="status" style="margin-top: 18px;">
      <span />
      <p>{{ progress }} Please keep this page open.</p>
    </div>

    <!-- Error message display -->
    <div v-if="error" class="error-message" role="alert" style="margin-top: 16px;">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
    </div>

    <p class="conversion-note">
      Collages are created directly on your device using hardware-accelerated Canvas 2D. Photos never leave your browser.
    </p>

    <!-- Crop Photo Modal -->
    <div v-if="cropModalOpen && activeCropImage" class="crop-modal-backdrop" @click.self="closeCropModal">
      <div class="crop-modal-dialog" role="dialog" aria-modal="true" aria-label="Crop Photo">
        <div class="crop-modal-header">
          <div class="crop-modal-title">
            <Crop :size="20" />
            <div>
              <h3>Crop Photo</h3>
              <small>{{ activeCropImage.name }}</small>
            </div>
          </div>
          <button type="button" class="btn-close-modal" aria-label="Close" @click="closeCropModal">
            <X :size="18" />
          </button>
        </div>

        <div class="crop-modal-body">
          <!-- Preset aspect ratio pills -->
          <div class="crop-presets-wrapper">
            <span class="crop-section-label">Aspect Ratio Presets:</span>
            <div class="crop-preset-pills">
              <button
                type="button"
                class="crop-pill"
                :class="{ active: cropPreset === 'free' }"
                @click="setCropPreset('free')"
              >
                Freeform
              </button>
              <button
                type="button"
                class="crop-pill"
                :class="{ active: cropPreset === '1:1' }"
                @click="setCropPreset('1:1')"
              >
                1:1 Square
              </button>
              <button
                type="button"
                class="crop-pill"
                :class="{ active: cropPreset === '4:3' }"
                @click="setCropPreset('4:3')"
              >
                4:3 Photo
              </button>
              <button
                type="button"
                class="crop-pill"
                :class="{ active: cropPreset === '16:9' }"
                @click="setCropPreset('16:9')"
              >
                16:9 Wide
              </button>
              <button
                type="button"
                class="crop-pill"
                :class="{ active: cropPreset === '9:16' }"
                @click="setCropPreset('9:16')"
              >
                9:16 Story
              </button>
              <button
                type="button"
                class="crop-pill"
                :class="{ active: cropPreset === '3:4' }"
                @click="setCropPreset('3:4')"
              >
                3:4 Portrait
              </button>
              <button
                type="button"
                class="crop-pill highlight"
                :class="{ active: cropPreset === 'slot' }"
                title="Match current collage cell shape"
                @click="setCropPreset('slot')"
              >
                Match Slot Aspect
              </button>
            </div>
          </div>

          <!-- Interactive Crop Canvas -->
          <div class="crop-canvas-container">
            <canvas
              ref="cropCanvas"
              class="crop-interactive-canvas"
              @mousedown="onCropPointerDown"
              @mousemove="onCropPointerMove"
              @mouseup="onCropPointerUp"
              @mouseleave="onCropPointerUp"
              @touchstart.passive="onCropTouchDown"
              @touchmove.passive="onCropTouchMove"
              @touchend="onCropPointerUp"
            ></canvas>
            <div class="crop-canvas-hint">
              <Move :size="13" />
              <span>Click &amp; drag inside the crop box to reposition</span>
            </div>
          </div>

          <!-- Fine-tune sliders -->
          <div class="crop-sliders-grid">
            <div class="crop-slider-col">
              <div class="crop-slider-head">
                <span>Crop Size / Zoom</span>
                <b>{{ Math.round((1 - (cropRect.width - 0.1) / 0.9) * 100) }}%</b>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.02"
                :value="cropRect.width"
                @input="onCropSizeSlider($event.target.value)"
              />
            </div>

            <div class="crop-slider-col">
              <div class="crop-slider-head">
                <span>Horizontal Pan</span>
                <b>{{ Math.round(cropRect.x * 100) }}%</b>
              </div>
              <input
                type="range"
                min="0"
                :max="Math.max(0, 1 - cropRect.width)"
                step="0.01"
                :value="cropRect.x"
                @input="onCropXSlider($event.target.value)"
              />
            </div>

            <div class="crop-slider-col">
              <div class="crop-slider-head">
                <span>Vertical Pan</span>
                <b>{{ Math.round(cropRect.y * 100) }}%</b>
              </div>
              <input
                type="range"
                min="0"
                :max="Math.max(0, 1 - cropRect.height)"
                step="0.01"
                :value="cropRect.y"
                @input="onCropYSlider($event.target.value)"
              />
            </div>
          </div>
        </div>

        <div class="crop-modal-footer">
          <button type="button" class="btn-crop-reset" @click="resetCrop">
            <RotateCcw :size="13" />
            <span>Reset to Full Photo</span>
          </button>

          <div class="crop-modal-actions">
            <button type="button" class="btn-crop-cancel" @click="closeCropModal">
              Cancel
            </button>
            <button type="button" class="btn-crop-apply" @click="applyCrop">
              <Check :size="15" />
              <span>Apply Crop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

