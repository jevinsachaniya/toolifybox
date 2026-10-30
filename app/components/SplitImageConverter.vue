<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import {
  ArrowLeftRight,
  ArrowUpDown,
  Check,
  CheckCheck,
  CircleAlert,
  Columns,
  Copy,
  Download,
  Eye,
  FileCheck,
  FolderArchive,
  Grid2x2,
  Grid3x3,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Minus,
  Move,
  Package,
  Plus,
  RotateCcw,
  Rows,
  Scissors,
  Share2,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from '@lucide/vue';
import {
  calculateSlices,
  EXPORT_FORMATS,
  generateImageSlices,
  GRID_PRESETS,
  SPLIT_MODES,
  validateSplitImage,
} from '~/utils/split-image.js';
import { formatSize } from '~/utils/document.js';

// Image Source State
const file = shallowRef(null);
const fileInput = ref(null);
const isDragging = ref(false);
const imageObj = shallowRef(null);
const imageDimensions = ref({ width: 0, height: 0 });

// Splitting Parameters
const splitMode = ref('custom-lines'); // Default directly to custom hand-drag cut lines!
const rows = ref(3);
const cols = ref(3);
const customTileWidth = ref(1080);
const customTileHeight = ref(1080);
const selectedPreset = ref(null);

// Interactive Hand-Drag Cut Lines (in natural image pixels)
const customVLines = ref([]);
const customHLines = ref([]);
const handTool = ref('all'); // 'all' (drag any line or click to add) | 'v' (vertical cut) | 'h' (horizontal cut)
const hoveredLine = ref(null); // { type: 'v' | 'h', index: number } | null
const draggingLine = ref(null); // { type: 'v' | 'h', index: number, isNew?: boolean } | null
const pointerHoverPos = ref(null); // { canvasX, canvasY, imageX, imageY } | null

// Export Options
const exportFormat = ref('png'); // 'png' | 'jpg' | 'webp'
const jpgQuality = ref(0.92);
const namingConvention = ref('sequential'); // 'sequential' | 'coordinates'

// UI & Processing States
const busy = ref(false);
const progress = ref('');
const error = ref('');
const copiedSliceId = ref(null);

// Canvas Refs
const previewCanvas = ref(null);

// Result State
const resultData = shallowRef(null); // { slices: [], zipBlob, zipUrl, zipFilename, totalSize }
let active = true;

const stage = computed(() => {
  if (resultData.value) return 3;
  if (file.value && imageObj.value) return 2;
  return 1;
});

onMounted(() => {
  active = true;
});

onBeforeUnmount(() => {
  active = false;
  cleanupResultUrls();
});

function cleanupResultUrls() {
  if (resultData.value) {
    if (resultData.value.zipUrl) URL.revokeObjectURL(resultData.value.zipUrl);
    if (resultData.value.slices) {
      resultData.value.slices.forEach(s => {
        if (s.url) URL.revokeObjectURL(s.url);
      });
    }
  }
}

// Drag & Drop
function onDragOver(e) {
  e.preventDefault();
  isDragging.value = true;
}

function onDragLeave(e) {
  e.preventDefault();
  isDragging.value = false;
}

function onDrop(e) {
  e.preventDefault();
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    onSelectFile(files[0]);
  }
}

function handleFileInput(e) {
  const files = e.target?.files;
  if (files && files.length > 0) {
    onSelectFile(files[0]);
  }
  if (fileInput.value) fileInput.value.value = '';
}

function triggerFilePicker() {
  fileInput.value?.click();
}

async function onSelectFile(selectedFile) {
  error.value = '';
  const validationError = validateSplitImage(selectedFile);
  if (validationError) {
    error.value = validationError;
    return;
  }

  try {
    busy.value = true;
    progress.value = 'Reading image…';

    const url = URL.createObjectURL(selectedFile);
    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to decode image. Please try another file.'));
      img.src = url;
    });

    if (!active) {
      URL.revokeObjectURL(url);
      return;
    }

    file.value = selectedFile;
    imageObj.value = img;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    imageDimensions.value = { width: w, height: h };

    // Default custom size
    customTileWidth.value = Math.max(100, Math.round(w / 3));
    customTileHeight.value = Math.max(100, Math.round(h / 3));

    // Default: start with 1 vertical cut line right in the center for immediate hand dragging!
    customVLines.value = [Math.round(w * 0.5)];
    customHLines.value = [];

    cleanupResultUrls();
    resultData.value = null;

    await nextTick();
    drawPreview();
  } catch (err) {
    error.value = err.message || 'Could not load image.';
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

// Switch Mode Handler
function switchMode(newMode) {
  splitMode.value = newMode;
  if (newMode === 'custom-lines') {
    selectedPreset.value = null;
    const w = imageDimensions.value.width;
    if (!customVLines.value.length && !customHLines.value.length && w) {
      customVLines.value = [Math.round(w * 0.5)];
    }
  }
  nextTick(() => drawPreview());
}

// Preset Handlers
function applyPreset(preset) {
  selectedPreset.value = preset.id;
  splitMode.value = preset.mode;
  if (preset.cols) cols.value = preset.cols;
  if (preset.rows) rows.value = preset.rows;
  nextTick(() => drawPreview());
}

// Hand-Drag Line Actions
function addVerticalCutLine() {
  const w = imageDimensions.value.width;
  if (!w || customVLines.value.length >= 12) return;

  const sorted = [0, ...customVLines.value, w].sort((a, b) => a - b);
  let maxGap = 0;
  let bestPos = Math.round(w / 2);

  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1] - sorted[i];
    if (gap > maxGap) {
      maxGap = gap;
      bestPos = Math.round(sorted[i] + gap / 2);
    }
  }

  customVLines.value.push(bestPos);
  customVLines.value.sort((a, b) => a - b);
  nextTick(() => drawPreview());
}

function addHorizontalCutLine() {
  const h = imageDimensions.value.height;
  if (!h || customHLines.value.length >= 12) return;

  const sorted = [0, ...customHLines.value, h].sort((a, b) => a - b);
  let maxGap = 0;
  let bestPos = Math.round(h / 2);

  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1] - sorted[i];
    if (gap > maxGap) {
      maxGap = gap;
      bestPos = Math.round(sorted[i] + gap / 2);
    }
  }

  customHLines.value.push(bestPos);
  customHLines.value.sort((a, b) => a - b);
  nextTick(() => drawPreview());
}

function removeVerticalCutLine(idx) {
  customVLines.value.splice(idx, 1);
  nextTick(() => drawPreview());
}

function removeHorizontalCutLine(idx) {
  customHLines.value.splice(idx, 1);
  nextTick(() => drawPreview());
}

function clearCustomLines() {
  customVLines.value = [];
  customHLines.value = [];
  nextTick(() => drawPreview());
}

function applyCustomRatioPreset(type) {
  const w = imageDimensions.value.width;
  const h = imageDimensions.value.height;
  if (!w || !h) return;

  if (type === 'half-v') {
    customVLines.value = [Math.round(w * 0.5)];
    customHLines.value = [];
  } else if (type === 'half-h') {
    customVLines.value = [];
    customHLines.value = [Math.round(h * 0.5)];
  } else if (type === 'thirds-v') {
    customVLines.value = [Math.round(w * 0.333), Math.round(w * 0.667)];
    customHLines.value = [];
  } else if (type === 'quad-cross') {
    customVLines.value = [Math.round(w * 0.5)];
    customHLines.value = [Math.round(h * 0.5)];
  } else if (type === 'golden-ratio') {
    customVLines.value = [Math.round(w * 0.618)];
    customHLines.value = [];
  } else if (type === 'header-cut') {
    customVLines.value = [];
    customHLines.value = [Math.round(h * 0.28)];
  }
  nextTick(() => drawPreview());
}

// Slice Calculation
const currentSlices = computed(() => {
  if (!imageObj.value || !imageDimensions.value.width) return [];

  return calculateSlices(
    imageDimensions.value.width,
    imageDimensions.value.height,
    {
      mode: splitMode.value,
      rows: rows.value,
      cols: cols.value,
      tileWidth: customTileWidth.value,
      tileHeight: customTileHeight.value,
      customVLines: customVLines.value,
      customHLines: customHLines.value,
    }
  );
});

// Watch parameters to redraw
watch([splitMode, rows, cols, customTileWidth, customTileHeight, customVLines, customHLines], () => {
  nextTick(() => drawPreview());
}, { deep: true });

// Robust Pointer Position Conversion (CSS screen pixels -> Natural image pixels)
function getCanvasPointerPos(e) {
  const canvas = previewCanvas.value;
  if (!canvas) return { normX: 0, normY: 0, imageX: 0, imageY: 0, canvasX: 0, canvasY: 0 };
  const rect = canvas.getBoundingClientRect();
  const naturalW = imageDimensions.value.width;
  const naturalH = imageDimensions.value.height;

  const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / (rect.width || 1)));
  const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / (rect.height || 1)));

  const imageX = Math.round(normX * naturalW);
  const imageY = Math.round(normY * naturalH);
  const canvasX = normX * canvas.width;
  const canvasY = normY * canvas.height;

  return { normX, normY, imageX, imageY, canvasX, canvasY };
}

// Live Canvas Preview with Grid Overlay & Hand Drag Handles
function drawPreview() {
  const canvas = previewCanvas.value;
  const img = imageObj.value;
  if (!canvas || !img) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const naturalW = imageDimensions.value.width;
  const naturalH = imageDimensions.value.height;

  const maxDisplayW = 580;
  const scale = naturalW > maxDisplayW ? maxDisplayW / naturalW : 1;
  const displayW = Math.round(naturalW * scale);
  const displayH = Math.round(naturalH * scale);

  canvas.width = displayW;
  canvas.height = displayH;

  // Draw base image
  ctx.clearRect(0, 0, displayW, displayH);
  ctx.drawImage(img, 0, 0, displayW, displayH);

  // Draw Slice Grid Overlays
  const slices = currentSlices.value;
  if (!slices || !slices.length) return;

  ctx.save();
  slices.forEach((s) => {
    const sx = s.x * scale;
    const sy = s.y * scale;
    const sw = s.width * scale;
    const sh = s.height * scale;

    // Outer subtle boundary shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(sx, sy, sw, sh);

    // Inner bright dashed line
    ctx.strokeStyle = splitMode.value === 'custom-lines' ? 'rgba(255, 255, 255, 0.7)' : '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(sx, sy, sw, sh);
    ctx.setLineDash([]);

    // Tile Number Badge
    const badgeW = 28;
    const badgeH = 22;
    const badgeX = sx + 8;
    const badgeY = sy + 8;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(s.index), badgeX + badgeW / 2, badgeY + badgeH / 2);
  });

  // =========================================================================
  // HAND-DRAG CUT LINES (Prominent glowing lines & Grab Handles)
  // =========================================================================
  if (splitMode.value === 'custom-lines') {
    // 1. Draw Vertical Drag Lines
    customVLines.value.forEach((vx, idx) => {
      const cx = vx * scale;
      const isHovered = hoveredLine.value?.type === 'v' && hoveredLine.value?.index === idx;
      const isDraggingNow = draggingLine.value?.type === 'v' && draggingLine.value?.index === idx;

      ctx.save();

      // Outer wide glow for easy visibility
      ctx.strokeStyle = isDraggingNow ? 'rgba(244, 63, 94, 0.5)' : isHovered ? 'rgba(99, 102, 241, 0.5)' : 'rgba(79, 70, 229, 0.35)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, displayH);
      ctx.stroke();

      // Sharp Core Cut Line
      ctx.strokeStyle = isDraggingNow ? '#f43f5e' : isHovered ? '#fb7185' : '#e11d48';
      ctx.lineWidth = isDraggingNow || isHovered ? 3.5 : 2.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, displayH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top, Middle & Bottom Hand Grab Handles
      const handleYPositions = [22, displayH / 2, displayH - 22];
      handleYPositions.forEach((hy, hIdx) => {
        const radius = isDraggingNow || isHovered ? 13 : 11;

        // Outer glow
        ctx.fillStyle = isDraggingNow ? '#f43f5e' : isHovered ? '#fb7185' : '#e11d48';
        ctx.beginPath();
        ctx.arc(cx, hy, radius + 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner white circle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, hy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Grip arrows ◀ ▶
        ctx.fillStyle = isDraggingNow ? '#f43f5e' : isHovered ? '#fb7185' : '#e11d48';
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◀▶', cx, hy);
      });

      // Dimension & Percentage Pill Badge
      const tagText = `✋ ${vx}px (${Math.round((vx / naturalW) * 100)}%)`;
      ctx.font = 'bold 11px system-ui, sans-serif';
      const textMetrics = ctx.measureText(tagText);
      const tagW = textMetrics.width + 16;
      const tagH = 22;
      const tagY = displayH / 2 - 28;
      const tagX = Math.max(6, Math.min(displayW - tagW - 6, cx - tagW / 2));

      ctx.fillStyle = isDraggingNow ? '#f43f5e' : 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, tagW, tagH, 6);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, tagX + tagW / 2, tagY + tagH / 2);

      ctx.restore();
    });

    // 2. Draw Horizontal Drag Lines
    customHLines.value.forEach((hy, idx) => {
      const cy = hy * scale;
      const isHovered = hoveredLine.value?.type === 'h' && hoveredLine.value?.index === idx;
      const isDraggingNow = draggingLine.value?.type === 'h' && draggingLine.value?.index === idx;

      ctx.save();

      // Outer wide glow
      ctx.strokeStyle = isDraggingNow ? 'rgba(244, 63, 94, 0.5)' : isHovered ? 'rgba(99, 102, 241, 0.5)' : 'rgba(79, 70, 229, 0.35)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(displayW, cy);
      ctx.stroke();

      // Sharp Core Cut Line
      ctx.strokeStyle = isDraggingNow ? '#f43f5e' : isHovered ? '#fb7185' : '#e11d48';
      ctx.lineWidth = isDraggingNow || isHovered ? 3.5 : 2.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(displayW, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Left, Center & Right Hand Grab Handles
      const handleXPositions = [22, displayW / 2, displayW - 22];
      handleXPositions.forEach((hx) => {
        const radius = isDraggingNow || isHovered ? 13 : 11;

        ctx.fillStyle = isDraggingNow ? '#f43f5e' : isHovered ? '#fb7185' : '#e11d48';
        ctx.beginPath();
        ctx.arc(hx, cy, radius + 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(hx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Grip arrows ▲▼
        ctx.fillStyle = isDraggingNow ? '#f43f5e' : isHovered ? '#fb7185' : '#e11d48';
        ctx.font = 'bold 8px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▲▼', hx, cy);
      });

      // Dimension & Percentage Pill Badge
      const tagText = `✋ ${hy}px (${Math.round((hy / naturalH) * 100)}%)`;
      ctx.font = 'bold 11px system-ui, sans-serif';
      const textMetrics = ctx.measureText(tagText);
      const tagW = textMetrics.width + 16;
      const tagH = 22;
      const tagX = displayW / 2 - tagW / 2;
      const tagY = Math.max(6, Math.min(displayH - tagH - 6, cy - tagH / 2 - 24));

      ctx.fillStyle = isDraggingNow ? '#f43f5e' : 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, tagW, tagH, 6);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, tagX + tagW / 2, tagY + tagH / 2);

      ctx.restore();
    });

    // 3. If hovering over empty canvas, show laser guideline indicating where dragging starts
    if (!draggingLine.value && pointerHoverPos.value && !hoveredLine.value) {
      const { canvasX, canvasY, imageX, imageY } = pointerHoverPos.value;
      ctx.save();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      if (handTool.value === 'h') {
        ctx.beginPath();
        ctx.moveTo(0, canvasY);
        ctx.lineTo(displayW, canvasY);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(canvasX, 0);
        ctx.lineTo(canvasX, displayH);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  ctx.restore();
}

// Hand-Dragging Pointer Handlers (Works on Mouse & Touch)
function onCanvasPointerDown(e) {
  if (splitMode.value !== 'custom-lines' || !previewCanvas.value) return;

  const canvas = previewCanvas.value;
  const { imageX, imageY, canvasX, canvasY } = getCanvasPointerPos(e);
  const naturalW = imageDimensions.value.width;
  const naturalH = imageDimensions.value.height;
  const scale = canvas.width / naturalW;

  const HIT_THRESHOLD = 24; // Generous 24px zone for easy hand grabbing

  // 1. Check if clicking on an existing Vertical line
  for (let i = 0; i < customVLines.value.length; i++) {
    const cx = customVLines.value[i] * scale;
    if (Math.abs(canvasX - cx) <= HIT_THRESHOLD) {
      draggingLine.value = { type: 'v', index: i };
      canvas.setPointerCapture?.(e.pointerId);
      drawPreview();
      return;
    }
  }

  // 2. Check if clicking on an existing Horizontal line
  for (let i = 0; i < customHLines.value.length; i++) {
    const cy = customHLines.value[i] * scale;
    if (Math.abs(canvasY - cy) <= HIT_THRESHOLD) {
      draggingLine.value = { type: 'h', index: i };
      canvas.setPointerCapture?.(e.pointerId);
      drawPreview();
      return;
    }
  }

  // 3. If user clicked on image where there is NO line:
  // Immediately create a cut line right under the hand/cursor and start dragging it!
  if (handTool.value === 'h') {
    const clampedY = Math.max(10, Math.min(naturalH - 10, imageY));
    customHLines.value.push(clampedY);
    customHLines.value.sort((a, b) => a - b);
    const newIdx = customHLines.value.indexOf(clampedY);
    draggingLine.value = { type: 'h', index: newIdx, isNew: true };
  } else {
    // Default or vertical cut line
    const clampedX = Math.max(10, Math.min(naturalW - 10, imageX));
    customVLines.value.push(clampedX);
    customVLines.value.sort((a, b) => a - b);
    const newIdx = customVLines.value.indexOf(clampedX);
    draggingLine.value = { type: 'v', index: newIdx, isNew: true };
  }

  canvas.setPointerCapture?.(e.pointerId);
  drawPreview();
}

function onCanvasPointerMove(e) {
  if (splitMode.value !== 'custom-lines' || !previewCanvas.value) return;

  const canvas = previewCanvas.value;
  const pos = getCanvasPointerPos(e);
  pointerHoverPos.value = pos;
  const { imageX, imageY, canvasX, canvasY } = pos;
  const naturalW = imageDimensions.value.width;
  const naturalH = imageDimensions.value.height;
  const scale = canvas.width / naturalW;

  // If dragging an active line with the hand
  if (draggingLine.value) {
    if (draggingLine.value.type === 'v') {
      const clampedX = Math.max(10, Math.min(naturalW - 10, imageX));
      customVLines.value[draggingLine.value.index] = clampedX;
      canvas.style.cursor = 'grabbing';
      drawPreview();
    } else if (draggingLine.value.type === 'h') {
      const clampedY = Math.max(10, Math.min(naturalH - 10, imageY));
      customHLines.value[draggingLine.value.index] = clampedY;
      canvas.style.cursor = 'grabbing';
      drawPreview();
    }
    return;
  }

  // Hover detection for grab hand cursor
  const HIT_THRESHOLD = 24;
  let found = null;
  for (let i = 0; i < customVLines.value.length; i++) {
    const cx = customVLines.value[i] * scale;
    if (Math.abs(canvasX - cx) <= HIT_THRESHOLD) {
      found = { type: 'v', index: i };
      break;
    }
  }
  if (!found) {
    for (let i = 0; i < customHLines.value.length; i++) {
      const cy = customHLines.value[i] * scale;
      if (Math.abs(canvasY - cy) <= HIT_THRESHOLD) {
        found = { type: 'h', index: i };
        break;
      }
    }
  }

  hoveredLine.value = found;
  if (found) {
    canvas.style.cursor = 'grab';
  } else {
    canvas.style.cursor = 'crosshair';
  }

  drawPreview();
}

function onCanvasPointerUp(e) {
  if (draggingLine.value) {
    if (previewCanvas.value?.releasePointerCapture) {
      try { previewCanvas.value.releasePointerCapture(e.pointerId); } catch (_) {}
    }
    draggingLine.value = null;
    customVLines.value.sort((a, b) => a - b);
    customHLines.value.sort((a, b) => a - b);
    drawPreview();
  }
}

function onCanvasPointerLeave() {
  pointerHoverPos.value = null;
  hoveredLine.value = null;
  if (!draggingLine.value) {
    drawPreview();
  }
}

// Execute Split & Export
async function handleSplitImage() {
  if (!imageObj.value || !currentSlices.value.length || busy.value) return;

  busy.value = true;
  progress.value = `Slicing into ${currentSlices.value.length} parts…`;
  error.value = '';

  try {
    const result = await generateImageSlices(
      imageObj.value,
      currentSlices.value,
      file.value.name,
      {
        format: exportFormat.value,
        quality: jpgQuality.value,
        namingConvention: namingConvention.value,
      },
      (p) => {
        if (active) progress.value = p;
      }
    );

    if (active) {
      resultData.value = result;
    }
  } catch (err) {
    error.value = err.message || 'Failed to split image. Please try again.';
  } finally {
    if (active) {
      busy.value = false;
      progress.value = '';
    }
  }
}

// Copy single slice to clipboard
async function copySliceToClipboard(slice) {
  if (!slice.blob || copiedSliceId.value === slice.id) return;

  try {
    let pngBlob = slice.blob;
    if (slice.blob.type !== 'image/png') {
      const img = new Image();
      const loaded = new Promise((resolve) => { img.onload = resolve; });
      img.src = slice.url;
      await loaded;

      const c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      pngBlob = await new Promise((resolve) => c.toBlob(resolve, 'image/png'));
    }

    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      copiedSliceId.value = slice.id;
      setTimeout(() => {
        if (copiedSliceId.value === slice.id) copiedSliceId.value = null;
      }, 2400);
    } else {
      throw new Error('Clipboard copy not supported in this browser.');
    }
  } catch (err) {
    error.value = 'Could not copy to clipboard. Please click Download instead.';
  }
}

function clearAll() {
  cleanupResultUrls();
  file.value = null;
  imageObj.value = null;
  imageDimensions.value = { width: 0, height: 0 };
  resultData.value = null;
  error.value = '';
  busy.value = false;
}

function backToEditor() {
  cleanupResultUrls();
  resultData.value = null;
  nextTick(() => drawPreview());
}
</script>

<template>
  <section
    id="converter"
    class="converter split-image-converter"
    :class="{ 'is-converting': busy, 'has-file': !!file, 'has-result': !!resultData }"
    aria-label="Split Image Tool"
    :aria-busy="busy"
  >
    <!-- Header -->
    <div class="converter-heading">
      <div>
        <span class="mini-label">GRID &amp; CAROUSEL SLICER</span>
        <h2><Scissors :size="24" /> Split Image Online</h2>
      </div>
      <span class="free-badge">100% Private</span>
    </div>

    <!-- Step Track -->
    <ol class="step-track" aria-label="Split image steps">
      <li
        v-for="(label, index) in ['Select image', 'Drag Cut Lines &amp; Settings', 'Download ZIP']"
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

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif"
      class="visually-hidden"
      tabindex="-1"
      aria-label="Choose image to split"
      @change="handleFileInput"
    />

    <!-- =========================================================================
         Stage 3: Result & Download Screen
         ========================================================================= -->
    <template v-if="stage === 3 && resultData">
      <div class="result-state">
        <div class="success-badge">
          <CheckCheck :size="28" />
        </div>
        <h3 class="result-title">Image Split Successfully!</h3>
        <p class="result-desc">
          Created <b>{{ resultData.slices.length }}</b> individual tiles from {{ file?.name }}.
        </p>

        <!-- Big Download All as ZIP Card -->
        <div class="zip-download-banner">
          <div class="zip-info">
            <div class="zip-icon">
              <FolderArchive :size="26" />
            </div>
            <div>
              <div class="zip-name">{{ resultData.zipFilename }}</div>
              <div class="zip-meta">
                {{ formatSize(resultData.totalSize) }} &bull; {{ resultData.slices.length }} parts ready
              </div>
            </div>
          </div>
          <a :href="resultData.zipUrl" :download="resultData.zipFilename" class="primary-button btn-download-zip">
            <Download :size="17" /> Download All (ZIP)
          </a>
        </div>

        <!-- Slices Gallery Grid -->
        <div class="slices-gallery-header">
          <h4>Individual Slices ({{ resultData.slices.length }})</h4>
          <span class="gallery-sub">Download individual parts or copy directly to clipboard</span>
        </div>

        <div class="slices-grid">
          <div v-for="slice in resultData.slices" :key="slice.id" class="slice-card">
            <div class="slice-preview-wrap">
              <img :src="slice.url" :alt="slice.filename" class="slice-thumb" />
              <span class="slice-index-tag">Tile #{{ slice.index }}</span>
            </div>
            <div class="slice-info">
              <div class="slice-filename" :title="slice.filename">{{ slice.filename }}</div>
              <div class="slice-dims">{{ slice.width }}×{{ slice.height }}px &bull; {{ formatSize(slice.size) }}</div>
            </div>
            <div class="slice-actions">
              <a :href="slice.url" :download="slice.filename" class="slice-btn-download" title="Download Tile">
                <Download :size="14" /> Download
              </a>
              <button
                type="button"
                class="slice-btn-copy"
                :title="copiedSliceId === slice.id ? 'Copied!' : 'Copy to Clipboard'"
                @click="copySliceToClipboard(slice)"
              >
                <Check v-if="copiedSliceId === slice.id" :size="14" />
                <Copy v-else :size="14" />
              </button>
            </div>
          </div>
        </div>

        <div class="result-footer-actions">
          <button type="button" class="secondary-button" @click="backToEditor">
            <Move :size="15" /> Adjust Cut Lines
          </button>
          <button type="button" class="text-button" @click="clearAll">
            <RotateCcw :size="15" /> Upload Another Image
          </button>
        </div>
      </div>
    </template>

    <!-- =========================================================================
         Stage 2: Split Editor Studio
         ========================================================================= -->
    <template v-else-if="stage === 2 && file && imageObj">
      <div class="split-studio">
        <!-- Top Toolbar Header -->
        <div class="studio-topbar">
          <div class="image-meta-pill">
            <ImageIcon :size="15" />
            <span class="filename-text">{{ file.name }}</span>
            <span class="meta-tag">{{ imageDimensions.width }} × {{ imageDimensions.height }}px</span>
            <span class="meta-tag">{{ formatSize(file.size) }}</span>
          </div>

          <button type="button" class="btn-clear" title="Choose another image" @click="clearAll">
            <X :size="15" /> Change Image
          </button>
        </div>

        <!-- Main Studio Split Grid -->
        <div class="studio-grid">
          <!-- Left: Visual Canvas Preview with Direct Hand-Dragging -->
          <div class="preview-panel">
            <div class="preview-panel-header">
              <span class="panel-tag"><Eye :size="14" /> Interactive Canvas Slicer</span>
              <span class="slice-count-chip">
                <b>{{ currentSlices.length }}</b> {{ currentSlices.length === 1 ? 'slice' : 'slices' }}
              </span>
            </div>

            <!-- Hand Tool Quick Bar right on top of canvas -->
            <div v-if="splitMode === 'custom-lines'" class="canvas-hand-toolbar">
              <div class="hand-tool-buttons">
                <button
                  type="button"
                  class="btn-canvas-tool"
                  :class="{ active: handTool === 'all' }"
                  @click="handTool = 'all'"
                  title="Drag any line with mouse/touch or click to add"
                >
                  <Move :size="13" /> Drag / Click to Cut
                </button>
                <button
                  type="button"
                  class="btn-canvas-tool"
                  :class="{ active: handTool === 'v' }"
                  @click="handTool = 'v'"
                  title="Add vertical cut line"
                >
                  <Columns :size="13" /> + Vertical Cut
                </button>
                <button
                  type="button"
                  class="btn-canvas-tool"
                  :class="{ active: handTool === 'h' }"
                  @click="handTool = 'h'"
                  title="Add horizontal cut line"
                >
                  <Rows :size="13" /> + Horizontal Cut
                </button>
              </div>

              <button
                v-if="customVLines.length || customHLines.length"
                type="button"
                class="btn-canvas-clear"
                title="Clear all cut lines"
                @click="clearCustomLines"
              >
                Clear
              </button>
            </div>

            <div class="canvas-viewport">
              <canvas
                ref="previewCanvas"
                class="split-preview-canvas"
                @pointerdown="onCanvasPointerDown"
                @pointermove="onCanvasPointerMove"
                @pointerup="onCanvasPointerUp"
                @pointercancel="onCanvasPointerUp"
                @pointerleave="onCanvasPointerLeave"
              />
            </div>

            <div class="preview-legend">
              <span v-if="splitMode === 'custom-lines'">
                <span class="legend-dot custom" /> <b>Drag with hand:</b> Click and drag any line or handle directly on the image!
              </span>
              <span v-else>
                <span class="legend-dot" /> High-precision cutting grid
              </span>
              <span>Average: <b>{{ currentSlices[0] ? `${currentSlices[0].width}×${currentSlices[0].height}px` : 'N/A' }}</b></span>
            </div>
          </div>

          <!-- Right: Controls & Presets Panel -->
          <div class="controls-panel">
            <!-- 1. Split Modes Selector -->
            <div class="control-group">
              <label class="control-label">Splitting Mode</label>
              <div class="mode-tabs">
                <button
                  v-for="m in SPLIT_MODES"
                  :key="m.id"
                  type="button"
                  class="mode-tab-btn"
                  :class="{ active: splitMode === m.id }"
                  @click="switchMode(m.id)"
                >
                  <Sliders v-if="m.id === 'custom-lines'" :size="16" />
                  <Grid3x3 v-else-if="m.id === 'grid'" :size="15" />
                  <Columns v-else-if="m.id === 'vertical'" :size="15" />
                  <Rows v-else-if="m.id === 'horizontal'" :size="15" />
                  <Scissors v-else :size="15" />
                  <span class="mode-btn-title">{{ m.label }}</span>
                  <span class="mode-btn-sub">{{ m.sublabel }}</span>
                </button>
              </div>
            </div>

            <!-- Mode D: HAND DRAG CUT LINES (Prominent Hand Controls) -->
            <template v-if="splitMode === 'custom-lines'">
              <div class="control-group">
                <div class="hand-drag-hero-box">
                  <div class="hand-icon-wrap">
                    <Move :size="20" />
                  </div>
                  <div>
                    <strong>Drag Lines on Image with Hand</strong>
                    <p>Click and drag lines across the image freely. Click on any blank area to drop a new cut line!</p>
                  </div>
                </div>

                <!-- Quick Ratio Presets for Hand Cut -->
                <label class="control-label" style="margin-top: 10px;">Quick Hand Presets</label>
                <div class="preset-chips">
                  <button type="button" class="preset-chip" @click="applyCustomRatioPreset('half-v')">
                    50 / 50 Vertical
                  </button>
                  <button type="button" class="preset-chip" @click="applyCustomRatioPreset('thirds-v')">
                    33% / 66% Thirds
                  </button>
                  <button type="button" class="preset-chip" @click="applyCustomRatioPreset('golden-ratio')">
                    Golden Ratio (62/38)
                  </button>
                  <button type="button" class="preset-chip" @click="applyCustomRatioPreset('quad-cross')">
                    2×2 Quad Cross
                  </button>
                  <button type="button" class="preset-chip" @click="applyCustomRatioPreset('header-cut')">
                    Header Strip (28/72)
                  </button>
                </div>

                <!-- Vertical Cut Lines List -->
                <div v-if="customVLines.length" class="custom-lines-list">
                  <div class="custom-list-title">
                    <Columns :size="12" /> Vertical Cut Lines ({{ customVLines.length }})
                  </div>
                  <div v-for="(vx, idx) in customVLines" :key="'v_' + idx" class="line-slider-row">
                    <span class="line-tag">V#{{ idx + 1 }}</span>
                    <input
                      v-model.number="customVLines[idx]"
                      type="range"
                      min="10"
                      :max="imageDimensions.width - 10"
                      class="line-slider"
                      @input="drawPreview"
                    />
                    <div class="line-val-box">
                      <input
                        v-model.number="customVLines[idx]"
                        type="number"
                        min="1"
                        :max="imageDimensions.width - 1"
                        class="line-number-input"
                        @input="drawPreview"
                      />
                      <small>px</small>
                    </div>
                    <button
                      type="button"
                      class="btn-del-line"
                      title="Remove cut line"
                      @click="removeVerticalCutLine(idx)"
                    >
                      <Trash2 :size="13" />
                    </button>
                  </div>
                </div>

                <!-- Horizontal Cut Lines List -->
                <div v-if="customHLines.length" class="custom-lines-list">
                  <div class="custom-list-title">
                    <Rows :size="12" /> Horizontal Cut Lines ({{ customHLines.length }})
                  </div>
                  <div v-for="(hy, idx) in customHLines" :key="'h_' + idx" class="line-slider-row">
                    <span class="line-tag">H#{{ idx + 1 }}</span>
                    <input
                      v-model.number="customHLines[idx]"
                      type="range"
                      min="10"
                      :max="imageDimensions.height - 10"
                      class="line-slider"
                      @input="drawPreview"
                    />
                    <div class="line-val-box">
                      <input
                        v-model.number="customHLines[idx]"
                        type="number"
                        min="1"
                        :max="imageDimensions.height - 1"
                        class="line-number-input"
                        @input="drawPreview"
                      />
                      <small>px</small>
                    </div>
                    <button
                      type="button"
                      class="btn-del-line"
                      title="Remove cut line"
                      @click="removeHorizontalCutLine(idx)"
                    >
                      <Trash2 :size="13" />
                    </button>
                  </div>
                </div>

                <div v-if="!customVLines.length && !customHLines.length" class="no-lines-hint">
                  <span>Click anywhere on the photo preview to start dragging cut lines!</span>
                </div>
              </div>
            </template>

            <!-- Mode A: Equal Grid (3x3, etc.) -->
            <template v-else-if="splitMode === 'grid'">
              <div class="control-group">
                <label class="control-label">Quick Presets</label>
                <div class="preset-chips">
                  <button
                    v-for="p in GRID_PRESETS.filter(p => p.mode === 'grid')"
                    :key="p.id"
                    type="button"
                    class="preset-chip"
                    :class="{ active: selectedPreset === p.id }"
                    @click="applyPreset(p)"
                  >
                    {{ p.name }}
                  </button>
                </div>
              </div>

              <div class="grid-dimensions-row">
                <div class="counter-box">
                  <label>Columns (Vertical)</label>
                  <div class="counter-control">
                    <button type="button" :disabled="cols <= 1" @click="cols = Math.max(1, cols - 1)"><Minus :size="14" /></button>
                    <input v-model.number="cols" type="number" min="1" max="10" />
                    <button type="button" :disabled="cols >= 10" @click="cols = Math.min(10, cols + 1)"><Plus :size="14" /></button>
                  </div>
                </div>

                <div class="counter-box">
                  <label>Rows (Horizontal)</label>
                  <div class="counter-control">
                    <button type="button" :disabled="rows <= 1" @click="rows = Math.max(1, rows - 1)"><Minus :size="14" /></button>
                    <input v-model.number="rows" type="number" min="1" max="10" />
                    <button type="button" :disabled="rows >= 10" @click="rows = Math.min(10, rows + 1)"><Plus :size="14" /></button>
                  </div>
                </div>
              </div>
            </template>

            <!-- Mode B: Carousel (Vertical) -->
            <template v-else-if="splitMode === 'vertical'">
              <div class="control-group">
                <label class="control-label">Carousel Slide Presets</label>
                <div class="preset-chips">
                  <button
                    v-for="p in GRID_PRESETS.filter(p => p.mode === 'vertical')"
                    :key="p.id"
                    type="button"
                    class="preset-chip"
                    :class="{ active: cols === p.cols }"
                    @click="applyPreset(p)"
                  >
                    {{ p.name }}
                  </button>
                </div>
              </div>

              <div class="counter-box">
                <label>Number of Carousel Slides</label>
                <div class="counter-control">
                  <button type="button" :disabled="cols <= 2" @click="cols = Math.max(2, cols - 1)"><Minus :size="14" /></button>
                  <input v-model.number="cols" type="number" min="2" max="15" />
                  <button type="button" :disabled="cols >= 15" @click="cols = Math.min(15, cols + 1)"><Plus :size="14" /></button>
                </div>
              </div>
            </template>

            <!-- Mode C: Strips (Horizontal) -->
            <template v-else-if="splitMode === 'horizontal'">
              <div class="counter-box">
                <label>Number of Horizontal Strips</label>
                <div class="counter-control">
                  <button type="button" :disabled="rows <= 2" @click="rows = Math.max(2, rows - 1)"><Minus :size="14" /></button>
                  <input v-model.number="rows" type="number" min="2" max="15" />
                  <button type="button" :disabled="rows >= 15" @click="rows = Math.min(15, rows + 1)"><Plus :size="14" /></button>
                </div>
              </div>
            </template>

            <!-- Mode E: Custom Tile Dimensions (px) -->
            <template v-else-if="splitMode === 'custom-size'">
              <div class="control-group">
                <label class="control-label">Tile Dimensions</label>
                <div class="grid-dimensions-row">
                  <div class="counter-box">
                    <label>Tile Width (px)</label>
                    <input v-model.number="customTileWidth" type="number" min="50" max="8000" class="input-number" />
                  </div>
                  <div class="counter-box">
                    <label>Tile Height (px)</label>
                    <input v-model.number="customTileHeight" type="number" min="50" max="8000" class="input-number" />
                  </div>
                </div>
              </div>
            </template>

            <!-- Format & Quality -->
            <div class="control-group">
              <label class="control-label">Export Format</label>
              <div class="format-chips">
                <button
                  v-for="f in EXPORT_FORMATS"
                  :key="f.id"
                  type="button"
                  class="format-chip"
                  :class="{ active: exportFormat === f.id }"
                  @click="exportFormat = f.id"
                >
                  {{ f.id.toUpperCase() }}
                </button>
              </div>

              <div v-if="exportFormat === 'jpg'" class="quality-slider-wrap">
                <div class="quality-label">
                  <span>JPG Quality</span>
                  <b>{{ Math.round(jpgQuality * 100) }}%</b>
                </div>
                <input v-model.number="jpgQuality" type="range" min="0.5" max="1" step="0.02" class="range-slider" />
              </div>
            </div>

            <!-- Primary Action Button -->
            <div class="action-footer">
              <button
                type="button"
                class="primary-button btn-split-action"
                :disabled="busy || !currentSlices.length"
                @click="handleSplitImage"
              >
                <Scissors :size="17" />
                <span>{{ busy ? progress : `Split into ${currentSlices.length} Tiles` }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- =========================================================================
         Stage 1: Upload Dropzone
         ========================================================================= -->
    <template v-else>
      <div
        class="drop-zone"
        :class="{ dragging: isDragging }"
        tabindex="0"
        role="button"
        aria-label="Choose an image to split"
        @click="triggerFilePicker"
        @keydown.enter.space.prevent="triggerFilePicker"
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        <div class="drop-zone-icon" style="background: var(--primary-gradient); color: #fff;">
          <Scissors :size="32" />
        </div>
        <h3>{{ isDragging ? 'Drop your image here' : 'Drop your image to split' }}</h3>
        <p>Slice any photo into equal grid squares, seamless Instagram carousels, or drag custom cut lines with your hand.</p>
        <button class="choose-button" type="button" @click.stop="triggerFilePicker">
          <Upload :size="17" /> Choose Image
        </button>
        <span class="file-requirements">
          Supports JPG, PNG, WebP, GIF, BMP · Up to 50 MB · 100% Client-Side
        </span>
      </div>

      <div class="dropzone-pills">
        <span class="pill-badge"><Sliders :size="13" /> Hand Drag Cut Lines</span>
        <span class="pill-badge"><Grid3x3 :size="13" /> Instagram 3×3 &amp; Presets</span>
        <span class="pill-badge"><Columns :size="13" /> Seamless Carousels</span>
        <span class="pill-badge"><FolderArchive :size="13" /> 1-Click ZIP Download</span>
        <span class="pill-badge"><ShieldCheck :size="13" /> 100% In-Browser Privacy</span>
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
      Image slicing runs 100% locally on your device using hardware-accelerated Canvas 2D. Photos never leave your browser.
    </p>
  </section>
</template>

<style scoped>
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

/* Feature pills below dropzone */
.dropzone-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 20px;
}

.pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}

.pill-badge svg {
  color: #e11d48;
}

/* Studio Editor */
.split-studio {
  background: transparent;
  padding: 0;
}

.studio-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 1.5rem;
}

.image-meta-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: #334155;
  background: #f8fafc;
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
}

.filename-text {
  font-weight: 700;
  color: #0f172a;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-tag {
  color: #64748b;
  font-size: 0.75rem;
  background: #ffffff;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.btn-clear {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

/* Studio Main Grid */
.studio-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 900px) {
  .studio-grid {
    grid-template-columns: 1.2fr 1fr;
  }
}

/* Preview Panel */
.preview-panel {
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
}

.preview-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.panel-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
}

.slice-count-chip {
  font-size: 0.75rem;
  background: #fff1f2;
  color: #e11d48;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid #ffe4e6;
}

/* Canvas Hand Toolbar */
.canvas-hand-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 0.5rem 0.85rem;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.hand-tool-buttons {
  display: flex;
  gap: 6px;
}

.btn-canvas-tool {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0.35rem 0.65rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-canvas-tool:hover {
  background: #f8fafc;
  color: #0f172a;
}

.btn-canvas-tool.active {
  background: #be123c;
  color: #ffffff;
  border-color: #be123c;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
}

.btn-canvas-clear {
  background: transparent;
  border: none;
  font-size: 0.72rem;
  font-weight: 600;
  color: #ef4444;
  cursor: pointer;
  padding: 0 4px;
}

.canvas-viewport {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  min-height: 330px;
  background: repeating-conic-gradient(#f1f5f9 0% 25%, #f8fafc 0% 50%) 50% / 20px 20px;
  user-select: none;
  touch-action: none;
}

.split-preview-canvas {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12);
  touch-action: none;
}

.preview-legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1rem;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  font-size: 0.75rem;
  color: #64748b;
}

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e11d48;
  margin-right: 4px;
}

.legend-dot.custom {
  background: #f43f5e;
}

/* Controls Panel */
.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mode-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 0.35rem;
}

.mode-tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 0.55rem 0.3rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.mode-btn-title {
  font-size: 0.72rem;
  font-weight: 750;
  line-height: 1.1;
}

.mode-btn-sub {
  font-size: 0.62rem;
  color: #94a3b8;
  line-height: 1.1;
}

.mode-tab-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.mode-tab-btn.active {
  background: #e11d48;
  color: #ffffff;
  border-color: #e11d48;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

.mode-tab-btn.active .mode-btn-sub {
  color: rgba(255, 255, 255, 0.8);
}

/* Hand Drag Hero Callout Box */
.hand-drag-hero-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 0.75rem 0.9rem;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 12px;
}

.hand-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #e11d48;
  color: #ffffff;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.hand-drag-hero-box strong {
  display: block;
  font-size: 0.82rem;
  font-weight: 750;
  color: #881337;
}

.hand-drag-hero-box p {
  font-size: 0.72rem;
  color: #9f1239;
  margin-top: 2px;
  line-height: 1.4;
}

.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.preset-chip {
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-chip:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.preset-chip.active {
  background: #fff1f2;
  color: #e11d48;
  border-color: #fecdd3;
}

.grid-dimensions-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.counter-box {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.counter-box label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.counter-control {
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
}

.counter-control button {
  width: 38px;
  height: 38px;
  background: #f8fafc;
  border: none;
  display: grid;
  place-items: center;
  color: #475569;
  cursor: pointer;
  transition: background 0.15s;
}

.counter-control button:hover:not(:disabled) {
  background: #e2e8f0;
  color: #0f172a;
}

.counter-control button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.counter-control input {
  flex: 1;
  border: none;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  width: 40px;
}

.counter-control input:focus {
  outline: none;
}

.custom-lines-list {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.65rem;
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.custom-list-title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
}

.line-slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.line-tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: #e11d48;
  width: 26px;
}

.line-slider {
  flex: 1;
  accent-color: #e11d48;
}

.line-val-box {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.15rem 0.35rem;
}

.line-number-input {
  width: 44px;
  border: none;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: right;
  color: #0f172a;
}

.line-number-input:focus {
  outline: none;
}

.line-val-box small {
  font-size: 0.68rem;
  color: #94a3b8;
}

.btn-del-line {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
  display: grid;
  place-items: center;
  transition: color 0.15s;
}

.btn-del-line:hover {
  color: #ef4444;
}

.no-lines-hint {
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
}

.input-number {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
}

.input-number:focus {
  outline: none;
  border-color: #e11d48;
}

.format-chips {
  display: flex;
  gap: 0.5rem;
}

.format-chip {
  flex: 1;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.format-chip.active {
  background: #fff1f2;
  color: #e11d48;
  border-color: #fecdd3;
}

.quality-slider-wrap {
  margin-top: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
}

.quality-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #475569;
  margin-bottom: 0.25rem;
}

.range-slider {
  width: 100%;
  accent-color: #e11d48;
}

.action-footer {
  margin-top: 0.5rem;
}

.btn-split-action {
  width: 100%;
}

/* Result Screen */
.result-state {
  background: transparent;
  padding: 1rem 0;
  text-align: center;
}

.success-badge {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: #fff1f2;
  color: #e11d48;
  display: grid;
  place-items: center;
  margin: 0 auto 1rem;
}

.result-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.result-desc {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 2rem;
}

.zip-download-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 2.5rem;
  text-align: left;
}

.zip-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.zip-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #fff1f2;
  color: #e11d48;
  display: grid;
  place-items: center;
}

.zip-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.zip-meta {
  font-size: 0.8rem;
  color: #64748b;
}

.btn-download-zip {
  width: auto;
  padding: 0.75rem 1.75rem;
  text-decoration: none;
}

.slices-gallery-header {
  text-align: left;
  margin-bottom: 1.25rem;
}

.slices-gallery-header h4 {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.2rem;
}

.gallery-sub {
  font-size: 0.8rem;
  color: #64748b;
}

.slices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.slice-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.slice-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.slice-preview-wrap {
  position: relative;
  aspect-ratio: 1;
  background: #e2e8f0;
  overflow: hidden;
}

.slice-thumb {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.slice-index-tag {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(15, 23, 42, 0.8);
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.slice-info {
  padding: 0.65rem;
  text-align: left;
  flex: 1;
}

.slice-filename {
  font-size: 0.75rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slice-dims {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 2px;
}

.slice-actions {
  display: flex;
  gap: 4px;
  padding: 0.5rem 0.65rem;
  border-top: 1px solid #e2e8f0;
}

.slice-btn-download {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0.35rem 0.5rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #334155;
  text-decoration: none;
  transition: all 0.15s;
}

.slice-btn-download:hover {
  background: #e11d48;
  color: #ffffff;
  border-color: #e11d48;
}

.slice-btn-copy {
  width: 30px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  display: grid;
  place-items: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.slice-btn-copy:hover {
  color: #0f172a;
  border-color: #94a3b8;
}

.result-footer-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.secondary-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.65rem 1.25rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s;
}

.secondary-button:hover {
  background: #f8fafc;
  color: #0f172a;
}

.text-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.65rem 1rem;
}

.text-button:hover {
  color: #0f172a;
}
</style>
