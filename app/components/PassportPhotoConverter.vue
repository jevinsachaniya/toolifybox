<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Eraser,
  Eye,
  FileCheck,
  FileImage,
  FileText,
  FlipHorizontal,
  Grid,
  Hand,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Move,
  Paintbrush,
  Palette,
  Printer,
  Redo2,
  RefreshCw,
  RotateCcw,
  RotateCw,
  ScanFace,
  Scissors,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  UserCheck,
  Wand2,
  X,
  Zap,
} from '@lucide/vue';
import {
  DEFAULT_DPI,
  mmToPixels,
  PASSPORT_PRESETS,
  PASSPORT_BG_PRESETS,
  PRINT_SHEET_SIZES,
  validatePassportPhotoFile,
  formatPassportOutputFilename,
  calculateSheetGrid,
  renderPassportCanvas,
  renderPrintSheetCanvas,
  exportSheetToPdf,
  canvasToBlob,
  createSamplePassportPortrait,
  expandForegroundMask,
} from '~/utils/passport-photo.js';
import { removeBackgroundAI, autoDetectBackgroundColor, removeBackgroundColorKey } from '~/utils/remove-background.js';
import { formatSize } from '~/utils/document.js';

// File & Image State
const fileInput = ref(null);
const originalFile = ref(null);
const originalImage = ref(null);
const baseCutoutCanvas = ref(null); // Unaltered cutout before dilation
const cutoutCanvas = ref(null); // Active working cutout with dilation / brush
const activeSource = ref(null); // originalImage or cutoutCanvas
const fileMeta = ref({ name: '', size: 0, width: 0, height: 0 });
const isDragging = ref(false);

// Preset Configuration
const selectedPresetId = ref('us_passport');
const customWidthMm = ref(35);
const customHeightMm = ref(45);
const customDpi = ref(300);

// Background Replacement & Sensitivity Controls
const selectedBgColor = ref('#ffffff');
const isBgRemoved = ref(false);
const isRemovingBg = ref(false);
const bgProgressMsg = ref('');
const bgProgressPercent = ref(0);
const cutoutTolerance = ref(12); // Safe conservative tolerance (default 12%, not 35%!)
const edgeProtection = ref(2); // Edge expansion in px to preserve shoulders and hair

// Framing, Pan, Zoom, Rotation
const zoomLevel = ref(1.0);
const panX = ref(0);
const panY = ref(0);
const rotationDeg = ref(0);
const isFlipped = ref(false);
const showBiometricGuide = ref(true);

// Adjustments
const brightness = ref(0);
const contrast = ref(0);
const saturation = ref(0);
const exposure = ref(0);
const addBorder = ref(true);
const borderColor = ref('#e2e8f0');

// Active Tool Mode: 'pan' (hand / move) | 'brush' (touch-up)
const activeTool = ref('pan');
const brushMode = ref('restore'); // 'restore' (bring back over-cut parts) | 'erase' (remove leftover background)
const brushSize = ref(24);
const isPainting = ref(false);

// Cutout History for Undo
const cutoutHistory = ref([]);
const cutoutHistoryIndex = ref(-1);

// Print Sheet Options
const exportMode = ref('single'); // 'single' | 'sheet'
const selectedSheetSize = ref('4x6');
const addCutMarks = ref(true);
const downloadFormat = ref('jpg'); // 'jpg' | 'png' | 'pdf'

// Mouse dragging inside canvas for panning
const isPanning = ref(false);
const dragStart = { x: 0, y: 0 };
const panStart = { x: 0, y: 0 };

// Canvas references
const previewCanvasRef = ref(null);
const sheetCanvasRef = ref(null);
const viewportRef = ref(null);

// UI & Feedback
const errorMessage = ref('');
const toastMessage = ref('');
let toastTimer = null;
const isExporting = ref(false);

// Selected preset metadata
const currentPreset = computed(() => {
  if (selectedPresetId.value === 'custom') {
    const wPx = mmToPixels(customWidthMm.value, customDpi.value);
    const hPx = mmToPixels(customHeightMm.value, customDpi.value);
    return {
      id: 'custom',
      name: 'Custom',
      label: `Custom (${customWidthMm.value} × ${customHeightMm.value} mm)`,
      country: 'Custom',
      flag: '⚙️',
      widthMm: customWidthMm.value,
      heightMm: customHeightMm.value,
      widthPx: wPx,
      heightPx: hPx,
      aspectRatio: customWidthMm.value / (customHeightMm.value || 1),
      defaultBg: '#ffffff',
      headRatioMin: 0.65,
      headRatioMax: 0.80,
      description: `${customWidthMm.value} × ${customHeightMm.value} mm @ ${customDpi.value} DPI (${wPx} × ${hPx} px)`,
    };
  }
  return PASSPORT_PRESETS.find(p => p.id === selectedPresetId.value) || PASSPORT_PRESETS[0];
});

const currentSheetConfig = computed(() => {
  return PRINT_SHEET_SIZES.find(s => s.id === selectedSheetSize.value) || PRINT_SHEET_SIZES[1];
});

// Computed sheet grid summary
const sheetGridStats = computed(() => {
  if (exportMode.value !== 'sheet' || !currentPreset.value || !currentSheetConfig.value) {
    return { total: 1, cols: 1, rows: 1 };
  }
  const sheetWPx = mmToPixels(currentSheetConfig.value.widthMm, DEFAULT_DPI);
  const sheetHPx = mmToPixels(currentSheetConfig.value.heightMm, DEFAULT_DPI);
  const grid = calculateSheetGrid({
    sheetWidthPx: sheetWPx,
    sheetHeightPx: sheetHPx,
    photoWidthPx: currentPreset.value.widthPx,
    photoHeightPx: currentPreset.value.heightPx,
    marginPx: mmToPixels(3, DEFAULT_DPI),
    spacingPx: mmToPixels(2, DEFAULT_DPI),
  });
  return {
    total: grid.totalPhotos,
    cols: grid.cols,
    rows: grid.rows,
  };
});

function showToast(msg) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3200);
}

// Watchers to trigger re-render
watch(
  [
    selectedPresetId,
    customWidthMm,
    customHeightMm,
    customDpi,
    selectedBgColor,
    zoomLevel,
    panX,
    panY,
    rotationDeg,
    isFlipped,
    brightness,
    contrast,
    saturation,
    exposure,
    addBorder,
    borderColor,
    exportMode,
    selectedSheetSize,
    addCutMarks,
  ],
  () => {
    renderMainPreview();
  }
);

// File loading
function handleDrop(e) {
  e.preventDefault();
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    processUploadedFile(files[0]);
  }
}

function handleFileInput(e) {
  const files = e.target?.files;
  if (files && files.length > 0) {
    processUploadedFile(files[0]);
  }
}

function processUploadedFile(file) {
  const error = validatePassportPhotoFile(file);
  if (error) {
    errorMessage.value = error;
    return;
  }
  errorMessage.value = '';
  originalFile.value = file;
  fileMeta.value = {
    name: file.name,
    size: file.size,
    width: 0,
    height: 0,
  };

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      originalImage.value = img;
      activeSource.value = img;
      baseCutoutCanvas.value = null;
      cutoutCanvas.value = null;
      isBgRemoved.value = false;
      cutoutHistory.value = [];
      cutoutHistoryIndex.value = -1;
      fileMeta.value.width = img.naturalWidth || img.width;
      fileMeta.value.height = img.naturalHeight || img.height;
      resetTransforms();
      renderMainPreview();
      showToast('Photo loaded successfully!');
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function loadSamplePortrait() {
  errorMessage.value = '';
  const sampleCanvas = createSamplePassportPortrait();
  if (!sampleCanvas) return;

  const sampleImg = new Image();
  sampleImg.onload = () => {
    originalImage.value = sampleImg;
    activeSource.value = sampleImg;
    baseCutoutCanvas.value = null;
    cutoutCanvas.value = null;
    isBgRemoved.value = false;
    cutoutHistory.value = [];
    cutoutHistoryIndex.value = -1;
    fileMeta.value = {
      name: 'sample-portrait.jpg',
      size: 145000,
      width: sampleCanvas.width,
      height: sampleCanvas.height,
    };
    resetTransforms();
    renderMainPreview();
    showToast('Sample professional portrait loaded!');
  };
  sampleImg.src = sampleCanvas.toDataURL('image/jpeg', 0.95);
}

function resetTransforms() {
  zoomLevel.value = 1.0;
  panX.value = 0;
  panY.value = 0;
  rotationDeg.value = 0;
  isFlipped.value = false;
  brightness.value = 0;
  contrast.value = 0;
  saturation.value = 0;
  exposure.value = 0;
  activeTool.value = 'pan';
}

function autoEnhance() {
  brightness.value = 4;
  contrast.value = 8;
  saturation.value = 5;
  exposure.value = 3;
  showToast('Balanced brightness & contrast applied!');
}

function rotateQuarter(dir = 1) {
  rotationDeg.value = (rotationDeg.value + dir * 90) % 360;
}

// Cutout History Snapshot for Undo
function saveCutoutHistory() {
  if (!cutoutCanvas.value) return;
  const snapshot = document.createElement('canvas');
  snapshot.width = cutoutCanvas.value.width;
  snapshot.height = cutoutCanvas.value.height;
  snapshot.getContext('2d').drawImage(cutoutCanvas.value, 0, 0);

  if (cutoutHistoryIndex.value < cutoutHistory.value.length - 1) {
    cutoutHistory.value = cutoutHistory.value.slice(0, cutoutHistoryIndex.value + 1);
  }
  cutoutHistory.value.push(snapshot);
  if (cutoutHistory.value.length > 15) {
    cutoutHistory.value.shift();
  }
  cutoutHistoryIndex.value = cutoutHistory.value.length - 1;
}

function undoCutout() {
  if (cutoutHistoryIndex.value > 0) {
    cutoutHistoryIndex.value--;
    const saved = cutoutHistory.value[cutoutHistoryIndex.value];
    const ctx = cutoutCanvas.value.getContext('2d');
    ctx.clearRect(0, 0, cutoutCanvas.value.width, cutoutCanvas.value.height);
    ctx.drawImage(saved, 0, 0);
    renderMainPreview();
    showToast('Undo applied.');
  }
}

// 1-Click AI Background Removal with Over-cut Protection
async function triggerRemoveBackground() {
  if (!originalImage.value) {
    showToast('Please upload a photo first.');
    return;
  }

  isRemovingBg.value = true;
  bgProgressMsg.value = 'Analyzing portrait & subject contours...';
  bgProgressPercent.value = 15;

  try {
    const source = originalFile.value || originalImage.value;
    const blob = await removeBackgroundAI(source, (progress) => {
      bgProgressPercent.value = progress.percent || 40;
      bgProgressMsg.value = progress.message || 'Extracting portrait...';
    });

    const cutoutImg = new Image();
    const blobUrl = URL.createObjectURL(blob);
    await new Promise((resolve, reject) => {
      cutoutImg.onload = resolve;
      cutoutImg.onerror = reject;
      cutoutImg.src = blobUrl;
    });

    const c = document.createElement('canvas');
    c.width = cutoutImg.naturalWidth || cutoutImg.width;
    c.height = cutoutImg.naturalHeight || cutoutImg.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(cutoutImg, 0, 0);

    // Save untouched base cutout
    const baseC = document.createElement('canvas');
    baseC.width = c.width;
    baseC.height = c.height;
    baseC.getContext('2d').drawImage(c, 0, 0);
    baseCutoutCanvas.value = baseC;

    // Apply edge protection to restore any hairs, ears, or shoulders clipped by AI
    if (edgeProtection.value > 0) {
      expandForegroundMask(c, originalImage.value, edgeProtection.value);
    }

    cutoutCanvas.value = c;
    activeSource.value = c;
    isBgRemoved.value = true;
    isRemovingBg.value = false;
    URL.revokeObjectURL(blobUrl);

    saveCutoutHistory();
    renderMainPreview();
    showToast('Background removed cleanly with Edge Protection!');
  } catch (err) {
    console.warn('AI background removal error, running safe smart color cutout fallback:', err);
    runSmartColorCutout(cutoutTolerance.value);
  }
}

// Safe Smart Color Cutout (Conservative threshold that NEVER eats into clothes or face)
function runSmartColorCutout(tol = cutoutTolerance.value) {
  if (!originalImage.value) return;
  isRemovingBg.value = true;
  bgProgressMsg.value = 'Applying safe border color cutout...';

  try {
    const w = originalImage.value.naturalWidth || originalImage.value.width;
    const h = originalImage.value.naturalHeight || originalImage.value.height;

    const origCanv = document.createElement('canvas');
    origCanv.width = w;
    origCanv.height = h;
    const origCtx = origCanv.getContext('2d');
    origCtx.drawImage(originalImage.value, 0, 0);

    const detectedBg = autoDetectBackgroundColor(origCanv);

    // Conservative color key with low tolerance so subject is protected
    const cleanedImageData = removeBackgroundColorKey(origCanv, {
      targetColor: detectedBg.hex,
      tolerance: Math.min(22, Math.max(5, tol)),
      mode: 'flood',
      feather: 2,
    });

    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d').putImageData(cleanedImageData, 0, 0);

    // Save base cutout
    const baseC = document.createElement('canvas');
    baseC.width = w;
    baseC.height = h;
    baseC.getContext('2d').drawImage(c, 0, 0);
    baseCutoutCanvas.value = baseC;

    // Expand edges to guarantee hair/shoulder boundaries are retained
    if (edgeProtection.value > 0) {
      expandForegroundMask(c, originalImage.value, edgeProtection.value);
    }

    cutoutCanvas.value = c;
    activeSource.value = c;
    isBgRemoved.value = true;
    isRemovingBg.value = false;

    saveCutoutHistory();
    renderMainPreview();
    showToast(`Edge-safe background cutout applied (Sensitivity: ${tol}%)`);
  } catch (fallbackErr) {
    isRemovingBg.value = false;
    errorMessage.value = 'Could not remove background automatically. You can still crop and frame your photo.';
  }
}

// Real-time Edge Protection Slider Adjuster
function onEdgeProtectionChange() {
  if (!baseCutoutCanvas.value || !cutoutCanvas.value || !originalImage.value) return;

  const w = cutoutCanvas.value.width;
  const h = cutoutCanvas.value.height;
  const ctx = cutoutCanvas.value.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(baseCutoutCanvas.value, 0, 0);

  if (edgeProtection.value > 0) {
    expandForegroundMask(cutoutCanvas.value, originalImage.value, edgeProtection.value);
  }

  saveCutoutHistory();
  renderMainPreview();
}

function restoreOriginalBackground() {
  if (originalImage.value) {
    activeSource.value = originalImage.value;
    isBgRemoved.value = false;
    activeTool.value = 'pan';
    renderMainPreview();
    showToast('Restored original photo background.');
  }
}

// Coordinate Mapper: Convert Preview Canvas (screen) -> Source Image Pixels
function previewToSourceCoords(cx, cy) {
  if (!activeSource.value || !currentPreset.value) return null;
  const targetW = currentPreset.value.widthPx;
  const targetH = currentPreset.value.heightPx;
  const srcW = activeSource.value.width || activeSource.value.naturalWidth || targetW;
  const srcH = activeSource.value.height || activeSource.value.naturalHeight || targetH;

  // 1. Center & offset
  let dx = cx - (targetW / 2 + panX.value);
  let dy = cy - (targetH / 2 + panY.value);

  // 2. Un-rotate
  const rad = (-rotationDeg.value * Math.PI) / 180;
  let rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  let ry = dx * Math.sin(rad) + dy * Math.cos(rad);

  // 3. Un-flip
  if (isFlipped.value) {
    rx = -rx;
  }

  // 4. Un-scale
  const baseScale = Math.max(targetW / srcW, targetH / srcH);
  const finalScale = baseScale * zoomLevel.value;

  const srcX = rx / finalScale + srcW / 2;
  const srcY = ry / finalScale + srcH / 2;

  return {
    x: srcX,
    y: srcY,
    radiusInSrc: Math.max(3, brushSize.value / finalScale),
  };
}

// Touch-Up Brush: Paints Restore or Erase directly onto Cutout Canvas
function applyBrushAt(cx, cy) {
  if (!cutoutCanvas.value || !originalImage.value) return;
  const mapped = previewToSourceCoords(cx, cy);
  if (!mapped) return;

  const ctx = cutoutCanvas.value.getContext('2d');
  const srcW = cutoutCanvas.value.width;
  const srcH = cutoutCanvas.value.height;

  ctx.save();
  ctx.beginPath();
  ctx.arc(mapped.x, mapped.y, mapped.radiusInSrc, 0, Math.PI * 2);

  if (brushMode.value === 'restore') {
    // Restore original photo pixels inside brush circle!
    ctx.clip();
    ctx.drawImage(originalImage.value, 0, 0, srcW, srcH);
  } else {
    // Erase background pixels inside brush circle
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fill();
  }
  ctx.restore();

  renderMainPreview();
}

// Pointer Event Handlers (Supports both Pan Mode and Touch-Up Brush Mode)
function getPreviewCanvasCoords(e) {
  if (!previewCanvasRef.value) return null;
  const rect = previewCanvasRef.value.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const scaleX = previewCanvasRef.value.width / rect.width;
  const scaleY = previewCanvasRef.value.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function onPointerDown(e) {
  if (!activeSource.value) return;

  if (activeTool.value === 'brush' && isBgRemoved.value) {
    isPainting.value = true;
    const coords = getPreviewCanvasCoords(e);
    if (coords) applyBrushAt(coords.x, coords.y);
    return;
  }

  // Pan Mode
  isPanning.value = true;
  dragStart.x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  dragStart.y = e.clientY || (e.touches && e.touches[0].clientY) || 0;
  panStart.x = panX.value;
  panStart.y = panY.value;
}

function onPointerMove(e) {
  if (isPainting.value && activeTool.value === 'brush' && isBgRemoved.value) {
    const coords = getPreviewCanvasCoords(e);
    if (coords) applyBrushAt(coords.x, coords.y);
    return;
  }

  if (!isPanning.value) return;
  const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  const currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
  const dx = currentX - dragStart.x;
  const dy = currentY - dragStart.y;
  panX.value = panStart.x + dx;
  panY.value = panStart.y + dy;
}

function onPointerUp() {
  if (isPainting.value) {
    isPainting.value = false;
    saveCutoutHistory();
  }
  isPanning.value = false;
}

function onWheel(e) {
  if (!activeSource.value) return;
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.05 : -0.05;
  zoomLevel.value = Math.min(3.0, Math.max(0.4, Number((zoomLevel.value + delta).toFixed(2))));
}

// Main Render Logic
function renderMainPreview() {
  if (!activeSource.value || !previewCanvasRef.value) return;

  const preset = currentPreset.value;
  const adjustments = {
    brightness: brightness.value,
    contrast: contrast.value,
    saturation: saturation.value,
    exposure: exposure.value,
  };

  // 1. Render cropped passport canvas
  const passportCanvas = renderPassportCanvas({
    sourceCanvasOrImage: activeSource.value,
    targetWidthPx: preset.widthPx,
    targetHeightPx: preset.heightPx,
    bgColor: selectedBgColor.value,
    scale: zoomLevel.value,
    offsetX: panX.value,
    offsetY: panY.value,
    rotationDeg: rotationDeg.value,
    flipHorizontal: isFlipped.value,
    adjustments,
    addBorder: addBorder.value,
    borderColor: borderColor.value,
    borderWidth: 1,
  });

  if (!passportCanvas) return;

  // 2. Draw into the interactive preview canvas
  const previewCanvas = previewCanvasRef.value;
  previewCanvas.width = preset.widthPx;
  previewCanvas.height = preset.heightPx;
  const pCtx = previewCanvas.getContext('2d');
  pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  pCtx.drawImage(passportCanvas, 0, 0);

  // 3. If in Sheet mode, render the print sheet canvas
  if (exportMode.value === 'sheet' && currentSheetConfig.value.id !== 'single' && sheetCanvasRef.value) {
    const sheetResult = renderPrintSheetCanvas({
      passportCanvas,
      sheetConfig: currentSheetConfig.value,
      marginMm: 3,
      spacingMm: 2,
      addCutMarks: addCutMarks.value,
      addBorder: addBorder.value,
      borderColor: borderColor.value,
    });
    if (sheetResult && sheetResult.canvas) {
      const sheetCanvas = sheetCanvasRef.value;
      sheetCanvas.width = sheetResult.canvas.width;
      sheetCanvas.height = sheetResult.canvas.height;
      const sCtx = sheetCanvas.getContext('2d');
      sCtx.clearRect(0, 0, sheetCanvas.width, sheetCanvas.height);
      sCtx.drawImage(sheetResult.canvas, 0, 0);
    }
  }
}

// Trigger initial render when mounted
onMounted(() => {
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  // Auto-load sample portrait for immediate, impressive visual proof
  loadSamplePortrait();
});

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
});

// Download Handling
async function handleDownload() {
  if (!activeSource.value) {
    showToast('Please upload a photo first.');
    return;
  }

  isExporting.value = true;
  try {
    const preset = currentPreset.value;
    const adjustments = {
      brightness: brightness.value,
      contrast: contrast.value,
      saturation: saturation.value,
      exposure: exposure.value,
    };

    const passportCanvas = renderPassportCanvas({
      sourceCanvasOrImage: activeSource.value,
      targetWidthPx: preset.widthPx,
      targetHeightPx: preset.heightPx,
      bgColor: selectedBgColor.value,
      scale: zoomLevel.value,
      offsetX: panX.value,
      offsetY: panY.value,
      rotationDeg: rotationDeg.value,
      flipHorizontal: isFlipped.value,
      adjustments,
      addBorder: addBorder.value,
      borderColor: borderColor.value,
      borderWidth: 1,
    });

    if (exportMode.value === 'sheet' && currentSheetConfig.value.id !== 'single') {
      const sheetResult = renderPrintSheetCanvas({
        passportCanvas,
        sheetConfig: currentSheetConfig.value,
        marginMm: 3,
        spacingMm: 2,
        addCutMarks: addCutMarks.value,
        addBorder: addBorder.value,
        borderColor: borderColor.value,
      });

      if (downloadFormat.value === 'pdf') {
        const pdfBlob = await exportSheetToPdf(sheetResult.canvas, currentSheetConfig.value);
        downloadBlob(pdfBlob, formatPassportOutputFilename(fileMeta.value.name, preset.id, 'pdf', true));
        showToast('Print-ready PDF downloaded!');
      } else {
        const mime = downloadFormat.value === 'png' ? 'image/png' : 'image/jpeg';
        const blob = await canvasToBlob(sheetResult.canvas, mime, 0.98);
        downloadBlob(blob, formatPassportOutputFilename(fileMeta.value.name, preset.id, downloadFormat.value, true));
        showToast('Print sheet downloaded!');
      }
    } else {
      // Single Photo
      const mime = downloadFormat.value === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(passportCanvas, mime, 0.98);
      downloadBlob(blob, formatPassportOutputFilename(fileMeta.value.name, preset.id, downloadFormat.value, false));
      showToast('Passport photo downloaded!');
    }
  } catch (err) {
    console.error('Download error:', err);
    errorMessage.value = 'Failed to generate download. Please try again.';
  } finally {
    isExporting.value = false;
  }
}

async function copyToClipboard() {
  if (!previewCanvasRef.value) return;
  try {
    const blob = await canvasToBlob(previewCanvasRef.value, 'image/png');
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    showToast('Passport photo copied to clipboard!');
  } catch (err) {
    showToast('Clipboard copy failed. Try downloading instead.');
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function selectPreset(presetId) {
  selectedPresetId.value = presetId;
  const p = PASSPORT_PRESETS.find(x => x.id === presetId);
  if (p && p.defaultBg && !isBgRemoved.value) {
    selectedBgColor.value = p.defaultBg;
  }
  showToast(`Switched to ${p ? p.label : presetId}`);
}

function selectBgColor(hex) {
  selectedBgColor.value = hex;
  if (!isBgRemoved.value && hex !== 'transparent') {
    showToast(`Background color set to ${hex}`);
  }
}
</script>

<template>
  <div class="passport-converter-root">
    <!-- Header Notification Banner -->
    <div v-if="toastMessage" class="toast-bubble" role="status">
      <CheckCircle2 :size="16" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- Main Workspace Container -->
    <div class="passport-workspace">
      
      <!-- Top Preset Selection Bar -->
      <section class="preset-selector-bar" aria-label="Passport Country Preset Selection">
        <div class="preset-header">
          <div class="title-with-badge">
            <span class="badge-icon"><ScanFace :size="16" /></span>
            <div>
              <h3>Official Country &amp; Visa Specifications</h3>
              <p>Pre-calibrated 300 DPI dimensions with biometric head-height framing</p>
            </div>
          </div>
          <div class="sample-btn-group">
            <button
              type="button"
              class="secondary-pill-btn"
              title="Test the tool with a professionally lit studio sample portrait"
              @click="loadSamplePortrait"
            >
              <Sparkles :size="14" />
              <span>Try Studio Sample</span>
            </button>
            <button
              type="button"
              class="primary-pill-btn"
              @click="fileInput?.click()"
            >
              <Upload :size="14" />
              <span>Upload Photo</span>
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/tiff"
              class="hidden-input"
              @change="handleFileInput"
            />
          </div>
        </div>

        <!-- Presets Carousel / Scrollable Pills -->
        <div class="presets-scroll">
          <button
            v-for="preset in PASSPORT_PRESETS"
            :key="preset.id"
            type="button"
            class="preset-pill"
            :class="{ active: selectedPresetId === preset.id }"
            @click="selectPreset(preset.id)"
          >
            <span class="preset-flag">{{ preset.flag }}</span>
            <span class="preset-info">
              <span class="preset-name">{{ preset.name }}</span>
              <span class="preset-dims">
                {{ preset.id === 'custom' ? 'Custom mm' : `${preset.widthMm} × ${preset.heightMm} mm` }}
              </span>
            </span>
            <Check v-if="selectedPresetId === preset.id" :size="14" class="preset-check" />
          </button>
        </div>

        <!-- Custom Preset Inputs (When Custom Selected) -->
        <div v-if="selectedPresetId === 'custom'" class="custom-dims-row">
          <div class="dim-field">
            <label>Width (mm):</label>
            <input v-model.number="customWidthMm" type="number" min="10" max="250" step="1" />
          </div>
          <div class="dim-field">
            <label>Height (mm):</label>
            <input v-model.number="customHeightMm" type="number" min="10" max="250" step="1" />
          </div>
          <div class="dim-field">
            <label>Resolution (DPI):</label>
            <select v-model.number="customDpi">
              <option :value="300">300 DPI (Standard Print)</option>
              <option :value="600">600 DPI (Ultra Fine)</option>
              <option :value="150">150 DPI (Web ID)</option>
            </select>
          </div>
          <div class="dim-summary">
            Calculated: {{ currentPreset.widthPx }} × {{ currentPreset.heightPx }} px
          </div>
        </div>
      </section>

      <!-- Main Editor Grid (Canvas Viewport + Controls Sidebar) -->
      <div class="editor-grid">
        
        <!-- Center Viewport Stage -->
        <section class="stage-card">
          <!-- Viewport Mode Tabs & Status -->
          <div class="stage-top-bar">
            <div class="stage-spec-tag">
              <span class="tag-flag">{{ currentPreset.flag }}</span>
              <span class="tag-label">{{ currentPreset.label }}</span>
              <span class="tag-res">{{ currentPreset.widthPx }} × {{ currentPreset.heightPx }} px (300 DPI)</span>
            </div>

            <!-- Single vs Print Sheet View Toggle -->
            <div class="view-mode-tabs">
              <button
                type="button"
                class="tab-btn"
                :class="{ active: exportMode === 'single' }"
                @click="exportMode = 'single'"
              >
                <FileImage :size="14" />
                <span>Single Photo</span>
              </button>
              <button
                type="button"
                class="tab-btn"
                :class="{ active: exportMode === 'sheet' }"
                @click="exportMode = 'sheet'"
              >
                <Printer :size="14" />
                <span>Print Sheet ({{ sheetGridStats.total }}×)</span>
              </button>
            </div>
          </div>

          <!-- Secondary Toolbar: Active Interaction Tool (Pan vs Touch-Up Brush) -->
          <div v-if="exportMode === 'single'" class="stage-tool-selector">
            <div class="tool-switch-group">
              <button
                type="button"
                class="mode-switch-btn"
                :class="{ active: activeTool === 'pan' }"
                @click="activeTool = 'pan'"
              >
                <Hand :size="14" />
                <span>Move &amp; Zoom</span>
              </button>
              <button
                type="button"
                class="mode-switch-btn"
                :class="{ active: activeTool === 'brush' }"
                :disabled="!isBgRemoved"
                title="Manually touch up and restore any cut-off edges or erase background"
                @click="activeTool = 'brush'"
              >
                <Paintbrush :size="14" />
                <span>Touch-Up Brush</span>
                <span v-if="!isBgRemoved" class="tool-disabled-pill">Remove BG First</span>
              </button>
            </div>

            <!-- Active Brush Controls (When Touch-up Brush is active) -->
            <div v-if="activeTool === 'brush' && isBgRemoved" class="brush-inline-controls">
              <div class="brush-type-toggles">
                <button
                  type="button"
                  class="brush-type-btn restore-type"
                  :class="{ active: brushMode === 'restore' }"
                  title="Click &amp; brush over shoulders or hair that got cut off to restore original pixels"
                  @click="brushMode = 'restore'"
                >
                  <Sparkles :size="13" />
                  <span>Restore Edge (Wapas Layein)</span>
                </button>
                <button
                  type="button"
                  class="brush-type-btn erase-type"
                  :class="{ active: brushMode === 'erase' }"
                  title="Brush away leftover background"
                  @click="brushMode = 'erase'"
                >
                  <Eraser :size="13" />
                  <span>Erase (Hataayein)</span>
                </button>
              </div>

              <div class="brush-size-slider">
                <span>Size:</span>
                <input v-model.number="brushSize" type="range" min="10" max="60" step="2" />
                <span class="slider-px">{{ brushSize }}px</span>
              </div>

              <button
                type="button"
                class="undo-brush-btn"
                :disabled="cutoutHistoryIndex <= 0"
                title="Undo last brush stroke"
                @click="undoCutout"
              >
                <Undo2 :size="13" />
                <span>Undo</span>
              </button>
            </div>
          </div>

          <!-- Viewport Canvas Container -->
          <div
            ref="viewportRef"
            class="canvas-viewport"
            :class="{
              'is-dragging': isPanning,
              'brush-active': activeTool === 'brush' && isBgRemoved,
            }"
            @pointerdown="onPointerDown"
            @wheel="onWheel"
          >
            <!-- Single Passport Canvas View -->
            <div v-show="exportMode === 'single'" class="single-frame-wrapper">
              <div
                class="passport-card-shadow"
                :style="{
                  aspectRatio: `${currentPreset.widthPx} / ${currentPreset.heightPx}`,
                }"
              >
                <!-- Rendered Passport Canvas -->
                <canvas ref="previewCanvasRef" class="live-passport-canvas" />

                <!-- Biometric Framing Guide Overlay (ICAO Guidelines) -->
                <div v-if="showBiometricGuide" class="biometric-overlay" aria-hidden="true">
                  <!-- Head Oval Guide -->
                  <div class="guide-oval" />
                  <!-- Eye Level Line -->
                  <div class="guide-line eye-line">
                    <span class="guide-label">Eye Line</span>
                  </div>
                  <!-- Chin Line -->
                  <div class="guide-line chin-line">
                    <span class="guide-label">Chin Line</span>
                  </div>
                  <!-- Vertical Center Axis -->
                  <div class="guide-line center-v" />
                  <!-- Top Crown Margin Indicator -->
                  <div class="guide-crown-bracket">
                    <span>Crown Range (70-80%)</span>
                  </div>
                </div>
              </div>

              <!-- Interactive Floating Pan / Zoom Badge -->
              <div class="viewport-hint">
                <template v-if="activeTool === 'brush' && isBgRemoved">
                  <Paintbrush :size="12" />
                  <span>
                    {{ brushMode === 'restore' ? 'Brush over cut areas to restore hair or shoulders' : 'Brush over background to erase' }}
                  </span>
                </template>
                <template v-else>
                  <Move :size="12" />
                  <span>Drag photo to center • Scroll to zoom ({{ Math.round(zoomLevel * 100) }}%)</span>
                </template>
              </div>
            </div>

            <!-- Print Sheet Canvas View -->
            <div v-show="exportMode === 'sheet'" class="sheet-frame-wrapper">
              <div class="sheet-card-shadow">
                <canvas ref="sheetCanvasRef" class="live-sheet-canvas" />
              </div>
              <div class="sheet-hint">
                <span>{{ currentSheetConfig.name }} ({{ sheetGridStats.cols }} cols × {{ sheetGridStats.rows }} rows = {{ sheetGridStats.total }} passport photos)</span>
              </div>
            </div>
          </div>

          <!-- Quick Canvas Toolbar (Under Canvas) -->
          <div class="canvas-quick-toolbar">
            <div class="quick-tools-left">
              <label class="toggle-switch-label" title="Toggle ICAO biometric face alignment guide overlay">
                <input v-model="showBiometricGuide" type="checkbox" />
                <span class="switch-ui" />
                <span class="toggle-text">Biometric Guides</span>
              </label>

              <label class="toggle-switch-label" title="Add a fine 1px cutting border for scissors">
                <input v-model="addBorder" type="checkbox" />
                <span class="switch-ui" />
                <span class="toggle-text">Cut Border</span>
              </label>
            </div>

            <div class="quick-tools-center">
              <button
                type="button"
                class="icon-action-btn"
                title="Rotate 90 degrees counter-clockwise"
                @click="rotateQuarter(-1)"
              >
                <RotateCcw :size="15" />
              </button>
              <button
                type="button"
                class="icon-action-btn"
                title="Rotate 90 degrees clockwise"
                @click="rotateQuarter(1)"
              >
                <RotateCw :size="15" />
              </button>
              <button
                type="button"
                class="icon-action-btn"
                :class="{ active: isFlipped }"
                title="Flip horizontal (correct mirror selfies)"
                @click="isFlipped = !isFlipped"
              >
                <FlipHorizontal :size="15" />
              </button>
              <button
                type="button"
                class="icon-action-btn"
                title="Reset zoom and center positioning"
                @click="resetTransforms"
              >
                <RefreshCw :size="14" />
                <span>Reset</span>
              </button>
            </div>

            <div class="quick-tools-right">
              <button
                type="button"
                class="auto-enhance-btn"
                title="Automatically calibrate brightness and contrast"
                @click="autoEnhance"
              >
                <Wand2 :size="14" />
                <span>Auto-Enhance</span>
              </button>
            </div>
          </div>
        </section>

        <!-- Right Controls Sidebar -->
        <aside class="controls-sidebar">
          
          <!-- Section 1: AI Background Removal & Over-cut Protection -->
          <div class="control-box">
            <div class="control-box-header">
              <div class="box-title">
                <Scissors :size="16" />
                <h4>Background Removal &amp; Protection</h4>
              </div>
              <span v-if="isBgRemoved" class="clean-badge">
                <Check :size="12" /> Cutout Active
              </span>
            </div>

            <!-- 1-Click AI Removal Trigger -->
            <div class="bg-remove-cta">
              <button
                v-if="!isBgRemoved"
                type="button"
                class="ai-remove-btn"
                :disabled="isRemovingBg"
                @click="triggerRemoveBackground"
              >
                <LoaderCircle v-if="isRemovingBg" :size="16" class="spin-icon" />
                <Sparkles v-else :size="16" />
                <span>{{ isRemovingBg ? bgProgressMsg : '1-Click Remove Background' }}</span>
              </button>

              <div v-else class="bg-status-row">
                <span class="status-msg"><Sparkles :size="14" /> Background removed</span>
                <button
                  type="button"
                  class="revert-btn"
                  title="Restore original image background"
                  @click="restoreOriginalBackground"
                >
                  <RotateCcw :size="13" /> Keep Original
                </button>
              </div>

              <!-- Progress bar when computing -->
              <div v-if="isRemovingBg" class="progress-track">
                <div class="progress-fill" :style="{ width: `${bgProgressPercent}%` }" />
              </div>
            </div>

            <!-- Over-cut Prevention: Edge Protection Slider -->
            <div v-if="isBgRemoved" class="overcut-protection-box">
              <div class="protection-header">
                <div class="prot-label">
                  <ShieldCheck :size="15" />
                  <span>Protect Subject / Expand Edges</span>
                </div>
                <span class="prot-val">+{{ edgeProtection }}px</span>
              </div>
              <p class="prot-desc">
                If background removal cuts too much into shoulders or hair, slide to expand and restore borders.
              </p>
              <input
                v-model.number="edgeProtection"
                type="range"
                min="0"
                max="8"
                step="1"
                class="accent-range"
                @input="onEdgeProtectionChange"
              />
            </div>

            <!-- Fine-Tune Sensitivity (Smart Color Key alternative) -->
            <div class="fine-tune-accordion">
              <details>
                <summary class="fine-tune-summary">
                  <span>Sensitivity &amp; Border Options</span>
                  <ChevronDown :size="14" />
                </summary>
                <div class="fine-tune-body">
                  <div class="slider-group">
                    <div class="slider-header">
                      <label>Cutout Sensitivity / Tolerance</label>
                      <span class="slider-val">{{ cutoutTolerance }}%</span>
                    </div>
                    <p class="field-hint">Lower percentage protects shirt/skin from being eaten into.</p>
                    <input
                      v-model.number="cutoutTolerance"
                      type="range"
                      min="5"
                      max="30"
                      step="1"
                      class="accent-range"
                    />
                    <button
                      type="button"
                      class="re-cutout-btn"
                      @click="runSmartColorCutout(cutoutTolerance)"
                    >
                      <RefreshCw :size="12" /> Re-apply with this sensitivity
                    </button>
                  </div>
                </div>
              </details>
            </div>

            <!-- Standard Passport Background Colors -->
            <div class="color-palette-section">
              <span class="sub-label">Official Passport Background Colors:</span>
              <div class="color-presets-grid">
                <button
                  v-for="color in PASSPORT_BG_PRESETS"
                  :key="color.id"
                  type="button"
                  class="color-pill"
                  :class="{ active: selectedBgColor === color.hex }"
                  :style="{
                    backgroundColor: color.hex === 'transparent' ? '#ffffff' : color.hex,
                    borderColor: color.border,
                  }"
                  :title="`${color.label} — Standard for ${color.standard}`"
                  @click="selectBgColor(color.hex)"
                >
                  <span v-if="color.hex === 'transparent'" class="checker-pattern" />
                  <Check
                    v-if="selectedBgColor === color.hex"
                    :size="14"
                    :class="{ 'dark-check': color.hex === '#ffffff' || color.hex === '#f3f4f6' || color.hex === '#f8fafc' || color.hex === '#dbeafe' || color.hex === 'transparent' }"
                  />
                </button>
              </div>
              <div class="color-active-info">
                <span>Selected: <strong>{{ PASSPORT_BG_PRESETS.find(c => c.hex === selectedBgColor)?.label || selectedBgColor }}</strong></span>
                <span class="color-note">{{ PASSPORT_BG_PRESETS.find(c => c.hex === selectedBgColor)?.standard }}</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Scale, Pan & Straighten Sliders -->
          <div class="control-box">
            <div class="control-box-header">
              <div class="box-title">
                <Sliders :size="16" />
                <h4>Framing &amp; Positioning</h4>
              </div>
            </div>

            <!-- Zoom Slider -->
            <div class="slider-group">
              <div class="slider-header">
                <label>Zoom / Head Size</label>
                <span class="slider-val">{{ Math.round(zoomLevel * 100) }}%</span>
              </div>
              <input
                v-model.number="zoomLevel"
                type="range"
                min="0.5"
                max="2.5"
                step="0.01"
                class="accent-range"
              />
            </div>

            <!-- Straighten / Rotate Slider -->
            <div class="slider-group">
              <div class="slider-header">
                <label>Straighten Head Tilt</label>
                <span class="slider-val">{{ rotationDeg }}°</span>
              </div>
              <input
                v-model.number="rotationDeg"
                type="range"
                min="-30"
                max="30"
                step="0.5"
                class="accent-range"
              />
            </div>

            <!-- Brightness & Contrast -->
            <div class="slider-row-duo">
              <div class="slider-group">
                <div class="slider-header">
                  <label>Brightness</label>
                  <span class="slider-val">{{ brightness > 0 ? `+${brightness}` : brightness }}</span>
                </div>
                <input
                  v-model.number="brightness"
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  class="accent-range"
                />
              </div>

              <div class="slider-group">
                <div class="slider-header">
                  <label>Contrast</label>
                  <span class="slider-val">{{ contrast > 0 ? `+${contrast}` : contrast }}</span>
                </div>
                <input
                  v-model.number="contrast"
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  class="accent-range"
                />
              </div>
            </div>
          </div>

          <!-- Section 3: Printable Multi-Photo Sheet Configuration -->
          <div v-if="exportMode === 'sheet'" class="control-box sheet-box">
            <div class="control-box-header">
              <div class="box-title">
                <Printer :size="16" />
                <h4>Print Sheet Layout</h4>
              </div>
              <span class="sheet-count-tag">{{ sheetGridStats.total }} Photos</span>
            </div>

            <!-- Sheet Paper Size Selection -->
            <div class="sheet-options">
              <label class="sub-label">Select Photo Paper Size:</label>
              <div class="sheet-size-buttons">
                <button
                  v-for="s in PRINT_SHEET_SIZES.filter(x => x.id !== 'single')"
                  :key="s.id"
                  type="button"
                  class="sheet-btn"
                  :class="{ active: selectedSheetSize === s.id }"
                  @click="selectedSheetSize = s.id"
                >
                  <span class="sheet-name">{{ s.name }}</span>
                  <span class="sheet-sub">{{ s.widthMm }} × {{ s.heightMm }} mm</span>
                </button>
              </div>

              <!-- Cut Marks Checkbox -->
              <label class="checkbox-row">
                <input v-model="addCutMarks" type="checkbox" />
                <span>Include scissor cutting guide marks</span>
              </label>
            </div>
          </div>

          <!-- Section 4: Export & Download Action Center -->
          <div class="control-box download-box">
            <div class="download-header">
              <div class="format-selector">
                <span class="sub-label">Download Format:</span>
                <div class="format-pills">
                  <button
                    type="button"
                    class="format-pill"
                    :class="{ active: downloadFormat === 'jpg' }"
                    @click="downloadFormat = 'jpg'"
                  >
                    JPG (Photo)
                  </button>
                  <button
                    type="button"
                    class="format-pill"
                    :class="{ active: downloadFormat === 'png' }"
                    @click="downloadFormat = 'png'"
                  >
                    PNG (HD)
                  </button>
                  <button
                    v-if="exportMode === 'sheet'"
                    type="button"
                    class="format-pill"
                    :class="{ active: downloadFormat === 'pdf' }"
                    @click="downloadFormat = 'pdf'"
                  >
                    PDF (Print)
                  </button>
                </div>
              </div>
            </div>

            <!-- Big Primary Action Button -->
            <button
              type="button"
              class="primary-download-btn"
              :disabled="isExporting"
              @click="handleDownload"
            >
              <LoaderCircle v-if="isExporting" :size="20" class="spin-icon" />
              <Download v-else :size="20" />
              <div class="btn-text">
                <span class="btn-main">
                  {{ exportMode === 'sheet' ? `Download ${sheetGridStats.total}× Photo Print Sheet` : 'Download Passport Photo' }}
                </span>
                <span class="btn-sub">
                  {{ exportMode === 'sheet' ? `${currentSheetConfig.name} • ${downloadFormat.toUpperCase()}` : `${currentPreset.widthMm} × ${currentPreset.heightMm} mm @ 300 DPI` }}
                </span>
              </div>
            </button>

            <!-- Secondary Actions: Copy to Clipboard -->
            <div class="secondary-actions-row">
              <button
                type="button"
                class="copy-btn"
                title="Copy passport photo to clipboard"
                @click="copyToClipboard"
              >
                <Copy :size="14" />
                <span>Copy Image</span>
              </button>

              <button
                type="button"
                class="reset-btn"
                title="Upload a different photo"
                @click="fileInput?.click()"
              >
                <Upload :size="14" />
                <span>Replace Photo</span>
              </button>
            </div>
          </div>

          <!-- Section 5: Biometric Compliance Checklist -->
          <div class="compliance-card">
            <div class="compliance-header">
              <ShieldCheck :size="16" />
              <h5>ICAO Biometric Compliance Checklist</h5>
            </div>
            <ul class="compliance-list">
              <li><Check :size="13" class="check-green" /> Head centered &amp; facing camera directly</li>
              <li><Check :size="13" class="check-green" /> Eyes open, level &amp; clearly visible</li>
              <li><Check :size="13" class="check-green" /> Plain, shadow-free solid background</li>
              <li><Check :size="13" class="check-green" /> Neutral facial expression, mouth closed</li>
              <li><Check :size="13" class="check-green" /> Crisp 300 DPI print-ready resolution</li>
            </ul>
          </div>

        </aside>

      </div>

    </div>
  </div>
</template>

<style scoped>
.passport-converter-root {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
  font-family: var(--font-sans);
}

/* Toast Bubble */
.toast-bubble {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1.25rem;
  background: #0f172a;
  color: #ffffff;
  border-radius: 9999px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  font-size: 0.9rem;
  font-weight: 600;
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Preset Selector Bar */
.preset-selector-bar {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.preset-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.badge-icon {
  width: 36px;
  height: 36px;
  border-radius: 0.5rem;
  background: var(--accent-subtle);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-with-badge h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ink);
  margin: 0;
}

.title-with-badge p {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0.15rem 0 0;
}

.sample-btn-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.secondary-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1rem;
  background: #f1f5f9;
  color: #334155;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.secondary-pill-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.primary-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.15rem;
  background: var(--accent);
  color: #ffffff;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.25);
  transition: all 0.2s ease;
}

.primary-pill-btn:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.hidden-input {
  display: none;
}

/* Presets Scroll */
.presets-scroll {
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scrollbar-width: thin;
}

.preset-pill {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.6rem 0.95rem;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: left;
}

.preset-pill:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.preset-pill.active {
  background: var(--accent-subtle);
  border-color: var(--accent);
  color: var(--accent);
}

.preset-flag {
  font-size: 1.2rem;
}

.preset-info {
  display: flex;
  flex-direction: column;
}

.preset-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--ink);
}

.preset-pill.active .preset-name {
  color: var(--accent);
}

.preset-dims {
  font-size: 0.75rem;
  color: var(--muted);
}

.preset-check {
  color: var(--accent);
  margin-left: 0.2rem;
}

/* Custom Dims Row */
.custom-dims-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--border);
  flex-wrap: wrap;
}

.dim-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.dim-field input,
.dim-field select {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  font-size: 0.85rem;
  background: #ffffff;
}

.dim-summary {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-subtle);
  padding: 0.35rem 0.75rem;
  border-radius: 0.4rem;
}

/* Main Editor Grid */
.editor-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 1024px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }
}

/* Stage Card (Center Viewport) */
.stage-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.stage-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.25rem;
  background: #fafafa;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 0.75rem;
}

.stage-spec-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.tag-flag {
  font-size: 1.1rem;
}

.tag-label {
  font-weight: 700;
  color: var(--ink);
}

.tag-res {
  color: var(--muted);
  font-size: 0.8rem;
  background: #f1f5f9;
  padding: 0.2rem 0.5rem;
  border-radius: 0.35rem;
}

.view-mode-tabs {
  display: flex;
  background: #e2e8f0;
  padding: 3px;
  border-radius: 0.6rem;
  gap: 2px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  background: transparent;
  border-radius: 0.45rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  transition: all 0.15s ease;
}

.tab-btn.active {
  background: #ffffff;
  color: var(--ink);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Secondary Stage Toolbar: Mode Switcher (Move vs Touch-Up Brush) */
.stage-tool-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1.25rem;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tool-switch-group {
  display: flex;
  background: #e2e8f0;
  padding: 3px;
  border-radius: 0.5rem;
  gap: 3px;
}

.mode-switch-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  background: transparent;
  border-radius: 0.35rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  transition: all 0.15s ease;
}

.mode-switch-btn.active {
  background: #ffffff;
  color: var(--accent);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.mode-switch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-disabled-pill {
  font-size: 0.68rem;
  background: #cbd5e1;
  color: #334155;
  padding: 1px 4px;
  border-radius: 3px;
}

.brush-inline-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.brush-type-toggles {
  display: flex;
  gap: 4px;
}

.brush-type-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.65rem;
  border-radius: 0.4rem;
  font-size: 0.76rem;
  font-weight: 700;
  border: 1px solid var(--border);
  background: #ffffff;
  color: #475569;
  transition: all 0.15s;
}

.brush-type-btn.restore-type.active {
  background: #ecfdf5;
  border-color: #10b981;
  color: #047857;
}

.brush-type-btn.erase-type.active {
  background: #fef2f2;
  border-color: #f87171;
  color: #b91c1c;
}

.brush-size-slider {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
}

.brush-size-slider input {
  width: 70px;
  accent-color: var(--accent);
}

.slider-px {
  font-weight: 700;
  color: var(--ink);
  min-width: 30px;
}

.undo-brush-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.65rem;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
}

.undo-brush-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.undo-brush-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Canvas Viewport */
.canvas-viewport {
  position: relative;
  min-height: 480px;
  background: #0f172a;
  background-image: radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 0);
  background-size: 20px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  cursor: grab;
  user-select: none;
  overflow: hidden;
}

.canvas-viewport.is-dragging {
  cursor: grabbing;
}

.canvas-viewport.brush-active {
  cursor: crosshair;
}

.single-frame-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.passport-card-shadow {
  position: relative;
  width: 320px;
  max-width: 100%;
  border-radius: 0.35rem;
  overflow: hidden;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.15);
  background: #ffffff;
}

.live-passport-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* Biometric Overlay */
.biometric-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.guide-oval {
  position: absolute;
  top: 12%;
  left: 50%;
  width: 58%;
  height: 68%;
  transform: translateX(-50%);
  border: 1.5px dashed rgba(225, 29, 72, 0.75);
  border-radius: 50%;
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.15);
}

.guide-line {
  position: absolute;
  pointer-events: none;
}

.eye-line {
  top: 42%;
  left: 0;
  right: 0;
  border-top: 1px dashed rgba(56, 189, 248, 0.8);
}

.chin-line {
  top: 80%;
  left: 0;
  right: 0;
  border-top: 1px dashed rgba(245, 158, 11, 0.8);
}

.center-v {
  top: 0;
  bottom: 0;
  left: 50%;
  border-left: 1px dashed rgba(255, 255, 255, 0.4);
}

.guide-label {
  position: absolute;
  right: 6px;
  bottom: 2px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #ffffff;
  background: rgba(15, 23, 42, 0.75);
  padding: 1px 4px;
  border-radius: 3px;
}

.guide-crown-bracket {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.65rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(15, 23, 42, 0.65);
  padding: 2px 8px;
  border-radius: 9999px;
  white-space: nowrap;
}

.viewport-hint {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #94a3b8;
  background: rgba(15, 23, 42, 0.75);
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
}

/* Sheet Canvas View */
.sheet-frame-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 90%;
}

.sheet-card-shadow {
  max-width: 440px;
  border-radius: 0.4rem;
  overflow: hidden;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.6);
  background: #ffffff;
}

.live-sheet-canvas {
  width: 100%;
  height: auto;
  display: block;
}

.sheet-hint {
  margin-top: 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #e2e8f0;
}

/* Canvas Quick Toolbar */
.canvas-quick-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: #ffffff;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 0.75rem;
}

.quick-tools-left,
.quick-tools-center,
.quick-tools-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

/* Toggle Switch */
.toggle-switch-label {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.toggle-switch-label input {
  display: none;
}

.switch-ui {
  width: 32px;
  height: 18px;
  background: #cbd5e1;
  border-radius: 9999px;
  position: relative;
  transition: background 0.2s;
}

.switch-ui::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background: #ffffff;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle-switch-label input:checked + .switch-ui {
  background: var(--accent);
}

.toggle-switch-label input:checked + .switch-ui::after {
  transform: translateX(14px);
}

.icon-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.65rem;
  background: #f1f5f9;
  color: #334155;
  border-radius: 0.45rem;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.15s ease;
}

.icon-action-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.icon-action-btn.active {
  background: var(--accent-subtle);
  color: var(--accent);
}

.auto-enhance-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
  border-radius: 0.45rem;
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.15s ease;
}

.auto-enhance-btn:hover {
  background: #d1fae5;
}

/* Controls Sidebar */
.controls-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.control-box {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  padding: 1.15rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.control-box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.85rem;
}

.box-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ink);
}

.box-title h4 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
}

.clean-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #059669;
  background: #ecfdf5;
  padding: 0.2rem 0.5rem;
  border-radius: 0.35rem;
}

/* AI Background Button */
.bg-remove-cta {
  margin-bottom: 0.85rem;
}

.ai-remove-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #f43f5e, #e11d48);
  color: #ffffff;
  border-radius: 0.65rem;
  font-size: 0.9rem;
  font-weight: 700;
  box-shadow: 0 3px 12px rgba(225, 29, 72, 0.25);
  transition: all 0.2s ease;
}

.ai-remove-btn:hover:not(:disabled) {
  opacity: 0.94;
  transform: translateY(-1px);
}

.ai-remove-btn:disabled {
  opacity: 0.8;
  cursor: wait;
}

.bg-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.85rem;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 0.55rem;
}

.status-msg {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #065f46;
}

.revert-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  background: #ffffff;
  padding: 0.25rem 0.55rem;
  border-radius: 0.35rem;
  border: 1px solid #cbd5e1;
}

.progress-track {
  width: 100%;
  height: 5px;
  background: #f1f5f9;
  border-radius: 9999px;
  overflow: hidden;
  margin-top: 0.6rem;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s ease;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Over-Cut Protection Box */
.overcut-protection-box {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 0.65rem;
  padding: 0.75rem 0.85rem;
  margin-bottom: 0.85rem;
}

.protection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.prot-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #9f1239;
}

.prot-val {
  font-size: 0.8rem;
  font-weight: 800;
  color: #e11d48;
}

.prot-desc {
  font-size: 0.73rem;
  color: #881337;
  line-height: 1.35;
  margin: 0 0 0.5rem;
}

/* Fine-tune Accordion */
.fine-tune-accordion {
  margin-bottom: 0.85rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.6rem;
}

.fine-tune-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  user-select: none;
}

.fine-tune-body {
  padding-top: 0.6rem;
}

.field-hint {
  font-size: 0.72rem;
  color: var(--muted);
  margin: 0 0 0.35rem;
}

.re-cutout-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.45rem;
  padding: 0.35rem 0.65rem;
  background: #f1f5f9;
  color: #334155;
  border-radius: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--border);
}

.re-cutout-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* Color Presets */
.color-palette-section {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.sub-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
}

.color-presets-grid {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
  margin-top: 0.2rem;
}

.color-pill {
  width: 34px;
  height: 34px;
  border-radius: 0.5rem;
  border-width: 2px;
  border-style: solid;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.color-pill:hover {
  transform: scale(1.08);
}

.color-pill.active {
  box-shadow: 0 0 0 2px var(--accent);
}

.dark-check {
  color: #0f172a;
}

.checker-pattern {
  position: absolute;
  inset: 0;
  border-radius: 0.4rem;
  background: repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 8px 8px;
}

.color-active-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  color: var(--ink);
  margin-top: 0.35rem;
}

.color-note {
  font-size: 0.72rem;
  color: var(--muted);
}

/* Sliders */
.slider-group {
  margin-bottom: 0.85rem;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.35rem;
}

.slider-val {
  font-weight: 700;
  color: var(--accent);
}

.accent-range {
  width: 100%;
  accent-color: var(--accent);
  height: 4px;
  border-radius: 2px;
}

.slider-row-duo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

/* Sheet Options */
.sheet-count-tag {
  font-size: 0.75rem;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.2rem 0.55rem;
  border-radius: 0.35rem;
}

.sheet-size-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-top: 0.4rem;
  margin-bottom: 0.75rem;
}

.sheet-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.85rem;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  text-align: left;
  transition: all 0.15s ease;
}

.sheet-btn:hover {
  background: #f1f5f9;
}

.sheet-btn.active {
  background: #eff6ff;
  border-color: #3b82f6;
}

.sheet-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--ink);
}

.sheet-sub {
  font-size: 0.75rem;
  color: var(--muted);
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

/* Download Center */
.download-box {
  background: #ffffff;
  border: 1px solid var(--border);
}

.format-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.85rem;
}

.format-pills {
  display: flex;
  gap: 0.3rem;
  background: #f1f5f9;
  padding: 2px;
  border-radius: 0.45rem;
}

.format-pill {
  padding: 0.3rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  background: transparent;
  border-radius: 0.35rem;
  transition: all 0.15s;
}

.format-pill.active {
  background: #ffffff;
  color: var(--ink);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.primary-download-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.9rem 1.25rem;
  background: var(--primary-gradient);
  color: #ffffff;
  border-radius: 0.75rem;
  box-shadow: var(--primary-glow);
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-download-btn:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-2px);
}

.primary-download-btn:disabled {
  opacity: 0.8;
  cursor: wait;
}

.btn-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.btn-main {
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.2;
}

.btn-sub {
  font-size: 0.72rem;
  opacity: 0.85;
}

.secondary-actions-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin-top: 0.75rem;
}

.copy-btn,
.reset-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem;
  background: #f1f5f9;
  color: #334155;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.15s;
}

.copy-btn:hover,
.reset-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* Compliance Card */
.compliance-card {
  background: #f8fafc;
  border: 1px dashed var(--border);
  border-radius: 0.75rem;
  padding: 1rem;
}

.compliance-header {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: #059669;
  margin-bottom: 0.6rem;
}

.compliance-header h5 {
  font-size: 0.82rem;
  font-weight: 700;
  margin: 0;
  color: var(--ink);
}

.compliance-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.compliance-list li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: #475569;
}

.check-green {
  color: #059669;
}
</style>
