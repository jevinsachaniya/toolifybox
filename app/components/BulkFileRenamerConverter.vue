<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  CaseSensitive,
  Check,
  CheckCheck,
  CircleAlert,
  Copy,
  Download,
  FileCode,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderArchive,
  Hash,
  Layers,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  Sparkles,
  Terminal,
  Trash2,
  Type,
  Upload,
  X,
  Zap,
} from '@lucide/vue';
import { formatSize } from '~/utils/document.js';
import {
  applyRenameRule,
  generateBashScript,
  generatePowerShellScript,
  generateRenameCsv,
  generateRenamedZip,
  generateWindowsBatScript,
  resolveDuplicateFilenames,
  SAMPLE_RENAME_FILES,
  splitFilename,
} from '~/utils/bulk-file-renamer.js';

// State
const uploadedFiles = ref([]);
const fileInput = ref(null);
const addMoreInput = ref(null);

const busy = ref(false);
const progress = ref('');
const error = ref('');
const toastMessage = ref('');
const isDragging = ref(false);

// Active Tab in Options
const activeRuleTab = ref('text'); // 'text' | 'replace' | 'number' | 'case' | 'date' | 'extension'

// Renaming Rules State
const prefix = ref('');
const suffix = ref('');

const findText = ref('');
const replaceText = ref('');
const useRegex = ref(false);
const caseSensitive = ref(false);

const caseMode = ref('none'); // 'none' | 'lower' | 'upper' | 'title' | 'camel' | 'kebab' | 'snake'

const numberingEnabled = ref(false);
const numberStart = ref(1);
const numberStep = ref(1);
const numberPad = ref(2);
const numberFormat = ref('num'); // 'num' | 'paren' | 'bracket' | 'dash' | 'hash'
const numberPosition = ref('suffix'); // 'suffix' | 'prefix' | 'replace'

const dateEnabled = ref(false);
const dateFormat = ref('YYYY-MM-DD'); // 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'YYYYMMDD' | 'YYYY-MM-DD_HHmmss'
const datePosition = ref('prefix'); // 'prefix' | 'suffix'

const extensionMode = ref('original'); // 'original' | 'lower' | 'upper' | 'custom'
const customExtension = ref('');

const autoResolveDuplicates = ref(true);
const manualOverrides = ref({});

// Table & Search State
const searchQuery = ref('');
const previewLimit = ref(50);

let toastTimer = null;

const stage = computed(() => {
  if (uploadedFiles.value.length > 0) return 2;
  return 1;
});

// Computed list of renamed items with duplicates detected
const renamedList = computed(() => {
  if (!uploadedFiles.value.length) return [];

  const rawRenamed = uploadedFiles.value.map((file, idx) => {
    // Check if user manually edited this specific file's name
    if (manualOverrides.value[idx]) {
      return manualOverrides.value[idx];
    }

    return applyRenameRule(file.name, idx, uploadedFiles.value.length, {
      prefix: prefix.value,
      suffix: suffix.value,
      findText: findText.value,
      replaceText: replaceText.value,
      useRegex: useRegex.value,
      caseSensitive: caseSensitive.value,
      caseMode: caseMode.value,
      numbering: {
        enabled: numberingEnabled.value,
        start: numberStart.value,
        step: numberStep.value,
        padDigits: numberPad.value,
        format: numberFormat.value,
        position: numberPosition.value,
      },
      dateStamp: {
        enabled: dateEnabled.value,
        format: dateFormat.value,
        position: datePosition.value,
      },
      extensionMode: extensionMode.value,
      customExtension: customExtension.value,
    });
  });

  if (autoResolveDuplicates.value) {
    const resolved = resolveDuplicateFilenames(rawRenamed);
    return uploadedFiles.value.map((file, idx) => ({
      original: file.name,
      renamed: resolved[idx].name,
      size: file.size,
      isChanged: file.name !== resolved[idx].name,
      isDuplicate: resolved[idx].isDuplicate,
      file,
    }));
  }

  // Without auto-resolve, flag collisions
  const nameCounts = new Map();
  rawRenamed.forEach(name => {
    nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
  });

  return uploadedFiles.value.map((file, idx) => {
    const finalName = rawRenamed[idx];
    return {
      original: file.name,
      renamed: finalName,
      size: file.size,
      isChanged: file.name !== finalName,
      isDuplicate: (nameCounts.get(finalName) || 0) > 1,
      file,
    };
  });
});

const duplicateCount = computed(() => {
  return renamedList.value.filter(item => item.isDuplicate).length;
});

const changedCount = computed(() => {
  return renamedList.value.filter(item => item.isChanged).length;
});

const displayedFiles = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return renamedList.value.slice(0, previewLimit.value);

  return renamedList.value
    .filter(item =>
      item.original.toLowerCase().includes(q) || item.renamed.toLowerCase().includes(q)
    )
    .slice(0, previewLimit.value);
});

function showToast(msg) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
}

function handleDragOver(e) {
  e.preventDefault();
  isDragging.value = true;
}

function handleDragLeave(e) {
  e.preventDefault();
  isDragging.value = false;
}

function handleDrop(e) {
  e.preventDefault();
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    addFiles([...files]);
  }
}

function handleFileInput(e) {
  const files = e.target.files;
  if (files && files.length > 0) {
    addFiles([...files]);
  }
  if (fileInput.value) fileInput.value.value = '';
  if (addMoreInput.value) addMoreInput.value.value = '';
}

function addFiles(newFiles) {
  error.value = '';
  const filtered = newFiles.filter(f => f.size >= 0);
  if (!filtered.length) return;

  const existing = uploadedFiles.value;
  uploadedFiles.value = [...existing, ...filtered];
  showToast(`Added ${filtered.length} file${filtered.length > 1 ? 's' : ''}`);
}

function removeFile(index) {
  uploadedFiles.value.splice(index, 1);
  const newOverrides = {};
  Object.keys(manualOverrides.value).forEach(k => {
    const num = Number(k);
    if (num < index) newOverrides[num] = manualOverrides.value[num];
    else if (num > index) newOverrides[num - 1] = manualOverrides.value[num];
  });
  manualOverrides.value = newOverrides;
  showToast('File removed');
}

function moveFile(index, direction) {
  const targetIdx = index + direction;
  if (targetIdx < 0 || targetIdx >= uploadedFiles.value.length) return;

  const files = [...uploadedFiles.value];
  const temp = files[index];
  files[index] = files[targetIdx];
  files[targetIdx] = temp;
  uploadedFiles.value = files;

  // Swap overrides if any
  const ovA = manualOverrides.value[index];
  const ovB = manualOverrides.value[targetIdx];
  if (ovA !== undefined || ovB !== undefined) {
    const newOv = { ...manualOverrides.value };
    if (ovB !== undefined) newOv[index] = ovB; else delete newOv[index];
    if (ovA !== undefined) newOv[targetIdx] = ovA; else delete newOv[targetIdx];
    manualOverrides.value = newOv;
  }
}

function sortFiles(order = 'asc') {
  const files = [...uploadedFiles.value];
  files.sort((a, b) => {
    const comp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    return order === 'asc' ? comp : -comp;
  });
  uploadedFiles.value = files;
  manualOverrides.value = {};
  showToast(`Sorted files ${order === 'asc' ? 'A to Z' : 'Z to A'}`);
}

function sortBySize() {
  const files = [...uploadedFiles.value];
  files.sort((a, b) => (b.size || 0) - (a.size || 0));
  uploadedFiles.value = files;
  manualOverrides.value = {};
  showToast('Sorted by file size (largest first)');
}

function loadSampleFiles() {
  error.value = '';
  uploadedFiles.value = SAMPLE_RENAME_FILES.map(f => ({
    name: f.name,
    size: f.size,
    type: f.type,
    data: new Blob([`Sample content for ${f.name}`], { type: f.type }),
  }));
  prefix.value = '2026_';
  caseMode.value = 'lower';
  numberingEnabled.value = true;
  numberPad.value = 2;
  numberPosition.value = 'prefix';
  showToast('Loaded sample files with numbering!');
}

function handleManualEdit(index, event) {
  const text = event.target.innerText.trim();
  if (text) {
    manualOverrides.value = {
      ...manualOverrides.value,
      [index]: text,
    };
  } else {
    const updated = { ...manualOverrides.value };
    delete updated[index];
    manualOverrides.value = updated;
  }
}

function resetManualOverride(index) {
  const updated = { ...manualOverrides.value };
  delete updated[index];
  manualOverrides.value = updated;
}

// Downloads & Exports
async function downloadZip() {
  if (!renamedList.value.length) return;
  busy.value = true;
  progress.value = 'Packing renamed files into ZIP archive…';

  try {
    const files = uploadedFiles.value;
    const newNames = renamedList.value.map(r => r.renamed);

    const zipBlob = await generateRenamedZip(files, newNames, (msg) => {
      progress.value = msg;
    });

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `renamed-files-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Renamed files ZIP downloaded!');
  } catch (err) {
    error.value = 'Failed to generate ZIP archive: ' + err.message;
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

function downloadScript(type = 'bat') {
  if (!renamedList.value.length) return;
  const pairs = renamedList.value.map(item => ({
    original: item.original,
    renamed: item.renamed,
  }));

  let content = '';
  let filename = '';
  let mimeType = 'text/plain;charset=utf-8;';

  if (type === 'bat') {
    content = generateWindowsBatScript(pairs);
    filename = 'rename_files.bat';
  } else if (type === 'ps1') {
    content = generatePowerShellScript(pairs);
    filename = 'rename_files.ps1';
  } else if (type === 'sh') {
    content = generateBashScript(pairs);
    filename = 'rename_files.sh';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Downloaded ${filename} rename script!`);
}

async function copyCsvMapping() {
  if (!renamedList.value.length) return;
  const pairs = renamedList.value.map(item => ({
    original: item.original,
    renamed: item.renamed,
  }));

  try {
    const csv = generateRenameCsv(pairs);
    await navigator.clipboard.writeText(csv);
    showToast('Old ➔ New filename mapping copied to clipboard!');
  } catch {
    showToast('Failed to copy to clipboard.');
  }
}

function resetRules() {
  prefix.value = '';
  suffix.value = '';
  findText.value = '';
  replaceText.value = '';
  useRegex.value = false;
  caseSensitive.value = false;
  caseMode.value = 'none';
  numberingEnabled.value = false;
  numberStart.value = 1;
  numberStep.value = 1;
  numberPad.value = 2;
  numberFormat.value = 'num';
  numberPosition.value = 'suffix';
  dateEnabled.value = false;
  dateFormat.value = 'YYYY-MM-DD';
  extensionMode.value = 'original';
  customExtension.value = '';
  manualOverrides.value = {};
  showToast('Rules reset to default');
}

function clearAllFiles() {
  uploadedFiles.value = [];
  manualOverrides.value = {};
  searchQuery.value = '';
  error.value = '';
}

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<template>
  <div class="bulk-renamer-root">
    <!-- Header -->
    <div class="converter-header">
      <div class="header-badges">
        <span class="badge badge-emerald">
          <Zap :size="13" /> 100% In-Browser &amp; Free
        </span>
        <span class="badge badge-sky">
          <Sliders :size="13" /> Powerful Batch Renaming Rules
        </span>
      </div>
      <h2 class="converter-title">Bulk File Renamer Online</h2>
      <p class="converter-subtitle">
        Rename multiple files, images, PDFs, and documents in seconds. Add prefixes, sequential numbering, find &amp; replace, change letter cases, and export as ZIP or 1-click batch script.
      </p>
    </div>

    <!-- Stepper Indicator -->
    <div class="stepper-bar">
      <div class="step-item" :class="{ active: stage >= 1, done: stage > 1 }">
        <span class="step-num">1</span>
        <span class="step-label">Add Files</span>
      </div>
      <div class="step-connector" :class="{ filled: stage >= 2 }" />
      <div class="step-item" :class="{ active: stage >= 2 }">
        <span class="step-num">2</span>
        <span class="step-label">Apply Rules &amp; Download</span>
      </div>
    </div>

    <!-- Toast -->
    <transition name="fade">
      <div v-if="toastMessage" class="toast-alert" role="status">
        <Check :size="16" /> {{ toastMessage }}
      </div>
    </transition>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner" role="alert">
      <CircleAlert :size="18" />
      <span>{{ error }}</span>
      <button class="dismiss-btn" aria-label="Dismiss error" @click="error = ''">
        <X :size="16" />
      </button>
    </div>

    <!-- STAGE 1: Drag & Drop Zone -->
    <div
      v-if="uploadedFiles.length === 0"
      class="upload-zone"
      :class="{ 'is-dragging': isDragging }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        class="hidden-input"
        @change="handleFileInput"
      />
      <div class="upload-icon-circle">
        <Upload :size="32" />
      </div>
      <h3 class="upload-title">Choose files or drag &amp; drop them here</h3>
      <p class="upload-hint">Rename photos, PDFs, music, videos, spreadsheets, or any document format. Up to 500 files.</p>

      <div class="upload-actions">
        <button class="btn btn-primary" @click="fileInput?.click()">
          <Plus :size="18" /> Choose Files
        </button>
        <button class="btn btn-outline" @click="loadSampleFiles">
          <Sparkles :size="16" /> Try Sample Files
        </button>
      </div>

      <div class="privacy-guarantee">
        <CheckCheck :size="15" /> 100% Client-Side Privacy: Your files never leave your computer.
      </div>
    </div>

    <!-- STAGE 2: Workspace with Rules + Live Comparison Table -->
    <div v-else class="workspace-area">
      <!-- Top Action Toolbar -->
      <div class="top-file-bar">
        <div class="top-stats-group">
          <span class="badge badge-neutral">
            <Layers :size="13" /> {{ uploadedFiles.length }} files loaded
          </span>
          <span class="badge badge-emerald">
            <Check :size="13" /> {{ changedCount }} will be renamed
          </span>
          <span v-if="duplicateCount > 0" class="badge badge-amber">
            <CircleAlert :size="13" /> {{ duplicateCount }} duplicates auto-resolved
          </span>
        </div>

        <div class="top-btns-group">
          <input
            ref="addMoreInput"
            type="file"
            multiple
            class="hidden-input"
            @change="handleFileInput"
          />
          <button class="btn btn-sm btn-outline" @click="addMoreInput?.click()">
            <Plus :size="14" /> Add More Files
          </button>
          <button class="btn btn-sm btn-danger-ghost" @click="clearAllFiles">
            <Trash2 :size="14" /> Clear All
          </button>
        </div>
      </div>

      <!-- Rename Rules Card -->
      <div class="rules-card">
        <div class="rules-tabs-header">
          <button
            class="rule-tab"
            :class="{ active: activeRuleTab === 'text' }"
            @click="activeRuleTab = 'text'"
          >
            <Type :size="15" /> Prefix &amp; Suffix
          </button>
          <button
            class="rule-tab"
            :class="{ active: activeRuleTab === 'replace' }"
            @click="activeRuleTab = 'replace'"
          >
            <Search :size="15" /> Find &amp; Replace
          </button>
          <button
            class="rule-tab"
            :class="{ active: activeRuleTab === 'number' }"
            @click="activeRuleTab = 'number'"
          >
            <Hash :size="15" /> Numbering
          </button>
          <button
            class="rule-tab"
            :class="{ active: activeRuleTab === 'case' }"
            @click="activeRuleTab = 'case'"
          >
            <CaseSensitive :size="15" /> Change Case
          </button>
          <button
            class="rule-tab"
            :class="{ active: activeRuleTab === 'date' }"
            @click="activeRuleTab = 'date'"
          >
            <Calendar :size="15" /> Add Date
          </button>
          <button
            class="rule-tab"
            :class="{ active: activeRuleTab === 'extension' }"
            @click="activeRuleTab = 'extension'"
          >
            <FileCode :size="15" /> Extension
          </button>

          <button class="rule-reset-btn" title="Reset all rules" @click="resetRules">
            <RefreshCw :size="13" /> Reset Rules
          </button>
        </div>

        <div class="rules-tab-body">
          <!-- Tab 1: Prefix & Suffix -->
          <div v-if="activeRuleTab === 'text'" class="rule-fields-grid">
            <div class="field-item">
              <label for="prefix-input">Add Prefix (At Start)</label>
              <input
                id="prefix-input"
                v-model="prefix"
                type="text"
                class="form-input"
                placeholder="e.g. Vacation_ or 2026_"
              />
              <span class="field-hint">Added before the original filename</span>
            </div>
            <div class="field-item">
              <label for="suffix-input">Add Suffix (At End)</label>
              <input
                id="suffix-input"
                v-model="suffix"
                type="text"
                class="form-input"
                placeholder="e.g. _FINAL or _v2"
              />
              <span class="field-hint">Added before the file extension</span>
            </div>
          </div>

          <!-- Tab 2: Find & Replace -->
          <div v-if="activeRuleTab === 'replace'" class="rule-fields-grid">
            <div class="field-item">
              <label for="find-input">Find Text</label>
              <input
                id="find-input"
                v-model="findText"
                type="text"
                class="form-input"
                placeholder="e.g. IMG_ or draft or space"
              />
            </div>
            <div class="field-item">
              <label for="replace-input">Replace With</label>
              <input
                id="replace-input"
                v-model="replaceText"
                type="text"
                class="form-input"
                placeholder="e.g. Photo_ or leave blank to delete"
              />
            </div>
            <div class="field-item checkboxes-row">
              <label class="form-checkbox-label">
                <input v-model="caseSensitive" type="checkbox" />
                <span>Case Sensitive</span>
              </label>
              <label class="form-checkbox-label">
                <input v-model="useRegex" type="checkbox" />
                <span>Use Regular Expression (RegEx)</span>
              </label>
            </div>
          </div>

          <!-- Tab 3: Sequential Numbering -->
          <div v-if="activeRuleTab === 'number'" class="rule-fields-grid">
            <div class="field-item full-width-checkbox">
              <label class="form-checkbox-label">
                <input v-model="numberingEnabled" type="checkbox" />
                <strong>Enable Sequential Numbering (01, 02, 03...)</strong>
              </label>
            </div>
            <template v-if="numberingEnabled">
              <div class="field-item">
                <label for="start-num">Start Number</label>
                <input id="start-num" v-model.number="numberStart" type="number" min="0" class="form-input" />
              </div>
              <div class="field-item">
                <label for="pad-num">Zero Padding Digits</label>
                <select id="pad-num" v-model.number="numberPad" class="form-select">
                  <option :value="1">1 digit (1, 2, 3)</option>
                  <option :value="2">2 digits (01, 02, 03)</option>
                  <option :value="3">3 digits (001, 002, 003)</option>
                  <option :value="4">4 digits (0001, 0002)</option>
                </select>
              </div>
              <div class="field-item">
                <label for="num-format">Number Style</label>
                <select id="num-format" v-model="numberFormat" class="form-select">
                  <option value="num">Normal: 01</option>
                  <option value="paren">Parentheses: (01)</option>
                  <option value="bracket">Square Brackets: [01]</option>
                  <option value="dash">Dashes: -01-</option>
                  <option value="hash">Hashtag: #01</option>
                </select>
              </div>
              <div class="field-item">
                <label for="num-pos">Placement</label>
                <select id="num-pos" v-model="numberPosition" class="form-select">
                  <option value="suffix">Append to End: Name_01</option>
                  <option value="prefix">Prepend to Start: 01_Name</option>
                  <option value="replace">Replace Original Name: 01</option>
                </select>
              </div>
            </template>
          </div>

          <!-- Tab 4: Change Case -->
          <div v-if="activeRuleTab === 'case'" class="rule-fields-grid">
            <div class="field-item">
              <label for="case-select">Letter Casing Style</label>
              <select id="case-select" v-model="caseMode" class="form-select">
                <option value="none">Keep Original Case</option>
                <option value="lower">lowercase (my-file.pdf)</option>
                <option value="upper">UPPERCASE (MY-FILE.PDF)</option>
                <option value="title">Title Case (My File Name.pdf)</option>
                <option value="kebab">kebab-case (my-file-name.pdf)</option>
                <option value="snake">snake_case (my_file_name.pdf)</option>
                <option value="camel">camelCase (myFileName.pdf)</option>
              </select>
            </div>
          </div>

          <!-- Tab 5: Date Stamping -->
          <div v-if="activeRuleTab === 'date'" class="rule-fields-grid">
            <div class="field-item full-width-checkbox">
              <label class="form-checkbox-label">
                <input v-model="dateEnabled" type="checkbox" />
                <strong>Insert Current Date into Filename</strong>
              </label>
            </div>
            <template v-if="dateEnabled">
              <div class="field-item">
                <label for="date-format-select">Date Format</label>
                <select id="date-format-select" v-model="dateFormat" class="form-select">
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-11-17)</option>
                  <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 17-11-2026)</option>
                  <option value="YYYYMMDD">YYYYMMDD (e.g. 20261117)</option>
                  <option value="YYYY-MM-DD_HHmmss">Timestamp (2026-11-17_160530)</option>
                </select>
              </div>
              <div class="field-item">
                <label for="date-pos-select">Position</label>
                <select id="date-pos-select" v-model="datePosition" class="form-select">
                  <option value="prefix">Prefix (At Start)</option>
                  <option value="suffix">Suffix (At End)</option>
                </select>
              </div>
            </template>
          </div>

          <!-- Tab 6: Extension Manager -->
          <div v-if="activeRuleTab === 'extension'" class="rule-fields-grid">
            <div class="field-item">
              <label for="ext-mode-select">Extension Formatting</label>
              <select id="ext-mode-select" v-model="extensionMode" class="form-select">
                <option value="original">Keep Original Extension</option>
                <option value="lower">Force Lowercase (e.g. .jpg, .pdf)</option>
                <option value="upper">Force UPPERCASE (e.g. .JPG, .PDF)</option>
                <option value="custom">Change to Custom Extension</option>
              </select>
            </div>
            <div v-if="extensionMode === 'custom'" class="field-item">
              <label for="custom-ext-input">New Extension</label>
              <input
                id="custom-ext-input"
                v-model="customExtension"
                type="text"
                class="form-input"
                placeholder="e.g. .jpg or .png"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="busy" class="loading-state">
        <LoaderCircle :size="36" class="spin-icon" />
        <p class="loading-text">{{ progress }}</p>
      </div>

      <!-- Live Comparison Preview Table -->
      <div v-else class="preview-card">
        <div class="preview-toolbar">
          <div class="search-box">
            <Search :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Filter original or new names..."
            />
            <button
              v-if="searchQuery"
              class="search-clear-btn"
              aria-label="Clear search"
              @click="searchQuery = ''"
            >
              <X :size="14" />
            </button>
          </div>

          <div class="sort-actions">
            <button class="btn btn-sm btn-ghost" title="Sort A to Z" @click="sortFiles('asc')">
              <ArrowDown :size="14" /> A-Z
            </button>
            <button class="btn btn-sm btn-ghost" title="Sort Z to A" @click="sortFiles('desc')">
              <ArrowUp :size="14" /> Z-A
            </button>
            <button class="btn btn-sm btn-ghost" title="Sort by Size" @click="sortBySize">
              <ArrowUpDown :size="14" /> Size
            </button>
          </div>
        </div>

        <div class="table-scroll-wrapper">
          <table class="rename-table">
            <thead>
              <tr>
                <th class="th-num">#</th>
                <th class="th-original">Original Filename</th>
                <th class="th-arrow" aria-label="Arrow" />
                <th class="th-renamed">New Filename (Click to Edit)</th>
                <th class="th-size">Size</th>
                <th class="th-action">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, idx) in displayedFiles"
                :key="item.original + idx"
                class="rename-row"
                :class="{ 'is-changed': item.isChanged, 'has-collision': item.isDuplicate }"
              >
                <td class="td-num">{{ idx + 1 }}</td>
                <td class="td-original" :title="item.original">
                  <span class="file-name-text">{{ item.original }}</span>
                </td>
                <td class="td-arrow">
                  <ArrowRight :size="14" class="arrow-icon" />
                </td>
                <td
                  class="td-renamed"
                  contenteditable="true"
                  spellcheck="false"
                  title="Click to manually edit this specific filename"
                  @blur="handleManualEdit(idx, $event)"
                >
                  <span class="renamed-text">{{ item.renamed }}</span>
                  <span v-if="manualOverrides[idx]" class="manual-badge">Manual Edit</span>
                  <span v-if="item.isDuplicate" class="collision-badge">Collision</span>
                </td>
                <td class="td-size">{{ formatSize(item.size || 0) }}</td>
                <td class="td-action">
                  <button
                    class="row-action-btn"
                    title="Remove file"
                    aria-label="Remove file"
                    @click="removeFile(idx)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Export Actions Bar -->
        <div class="export-bar">
          <div class="export-main-actions">
            <button class="btn btn-lg btn-emerald" @click="downloadZip">
              <FolderArchive :size="19" /> Download All as ZIP (.zip) <ArrowRight :size="17" />
            </button>
            <button class="btn btn-lg btn-outline" @click="downloadScript('bat')">
              <Terminal :size="17" /> Windows Batch (.bat)
            </button>
            <button class="btn btn-lg btn-outline" @click="downloadScript('ps1')">
              <FileCode :size="17" /> PowerShell (.ps1)
            </button>
            <button class="btn btn-lg btn-outline" @click="copyCsvMapping">
              <Copy :size="17" /> Copy CSV Mapping
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bulk-renamer-root {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  font-family: inherit;
}

.converter-header {
  text-align: center;
  margin-bottom: 24px;
}

.header-badges {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.badge-emerald {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.badge-sky {
  background: rgba(2, 132, 199, 0.12);
  color: #0284c7;
  border: 1px solid rgba(2, 132, 199, 0.25);
}

.badge-amber {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.badge-neutral {
  background: var(--bg-surface-subtle, #f1f5f9);
  color: var(--text-muted, #64748b);
  border: 1px solid var(--border-color, #e2e8f0);
}

.converter-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-heading, #0f172a);
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.converter-subtitle {
  font-size: 1.05rem;
  color: var(--text-muted, #64748b);
  max-width: 680px;
  margin: 0 auto;
  line-height: 1.5;
}

/* Stepper Bar */
.stepper-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 28px auto;
  max-width: 480px;
  padding: 0 16px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted, #94a3b8);
  font-weight: 600;
  font-size: 0.88rem;
}

.step-item.active {
  color: #059669;
}

.step-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface-subtle, #f1f5f9);
  border: 2px solid var(--border-color, #cbd5e1);
  font-size: 0.8rem;
}

.step-item.active .step-num {
  background: #059669;
  border-color: #059669;
  color: #ffffff;
}

.step-connector {
  flex: 1;
  height: 2px;
  background: var(--border-color, #e2e8f0);
  margin: 0 12px;
  transition: background 0.3s ease;
}

.step-connector.filled {
  background: #10b981;
}

/* Toast */
.toast-alert {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0f172a;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.92rem;
  font-weight: 500;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 12px 18px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 0.92rem;
}

.dismiss-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #991b1b;
  cursor: pointer;
  padding: 4px;
}

/* Upload Zone */
.upload-zone {
  background: var(--bg-surface, #ffffff);
  border: 2px dashed var(--border-color, #cbd5e1);
  border-radius: 16px;
  padding: 56px 24px;
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.upload-zone:hover,
.upload-zone.is-dragging {
  border-color: #059669;
  background: rgba(16, 185, 129, 0.03);
}

.hidden-input {
  display: none;
}

.upload-icon-circle {
  width: 68px;
  height: 68px;
  margin: 0 auto 16px;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-heading, #0f172a);
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 0.95rem;
  color: var(--text-muted, #64748b);
  margin-bottom: 24px;
}

.upload-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.privacy-guarantee {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-muted, #64748b);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.94rem;
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-primary {
  background: #059669;
  color: #ffffff;
}

.btn-primary:hover {
  background: #047857;
}

.btn-emerald {
  background: #059669;
  color: #ffffff;
  border-color: #047857;
}

.btn-emerald:hover {
  background: #047857;
}

.btn-outline {
  background: var(--bg-surface, #ffffff);
  border-color: var(--border-color, #cbd5e1);
  color: var(--text-heading, #0f172a);
}

.btn-outline:hover {
  border-color: #059669;
  color: #059669;
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted, #475569);
}

.btn-ghost:hover {
  background: var(--bg-surface-subtle, #f1f5f9);
  color: var(--text-heading, #0f172a);
}

.btn-danger-ghost {
  background: transparent;
  color: #dc2626;
}

.btn-danger-ghost:hover {
  background: #fef2f2;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.82rem;
}

.btn-lg {
  padding: 12px 24px;
  font-size: 1rem;
}

/* Workspace */
.workspace-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.top-file-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.top-stats-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.top-btns-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Rules Card */
.rules-card {
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.rules-tabs-header {
  display: flex;
  align-items: center;
  background: var(--bg-surface-subtle, #f8fafc);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  overflow-x: auto;
  padding: 0 8px;
}

.rule-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.rule-tab:hover {
  color: #0f172a;
}

.rule-tab.active {
  color: #059669;
  border-bottom-color: #059669;
  background: var(--bg-surface, #ffffff);
}

.rule-reset-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: none;
  border: none;
  color: var(--text-muted, #94a3b8);
  font-size: 0.8rem;
  cursor: pointer;
}

.rule-reset-btn:hover {
  color: #0f172a;
}

.rules-tab-body {
  padding: 20px;
}

.rule-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  align-items: start;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-item label {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-heading, #334155);
}

.full-width-checkbox {
  grid-column: 1 / -1;
}

.checkboxes-row {
  grid-column: 1 / -1;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.form-checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--text-heading, #1e293b);
}

.form-input,
.form-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--bg-surface, #ffffff);
  color: var(--text-heading, #0f172a);
  font-size: 0.88rem;
}

.field-hint {
  font-size: 0.76rem;
  color: var(--text-muted, #94a3b8);
}

/* Loading State */
.loading-state {
  padding: 60px 20px;
  text-align: center;
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
}

.spin-icon {
  animation: spin 1s linear infinite;
  color: #059669;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 14px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-heading, #0f172a);
}

/* Preview Card */
.preview-card {
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  flex-wrap: wrap;
  gap: 12px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 240px;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--text-muted, #94a3b8);
}

.search-input {
  width: 100%;
  padding: 6px 30px 6px 32px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  font-size: 0.85rem;
  background: var(--bg-surface, #ffffff);
  color: var(--text-heading, #0f172a);
}

.search-clear-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
}

.sort-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Table */
.table-scroll-wrapper {
  max-height: 480px;
  overflow: auto;
}

.rename-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
  text-align: left;
}

.rename-table thead {
  position: sticky;
  top: 0;
  background: #1e293b;
  color: #ffffff;
  z-index: 2;
}

.th-num,
.td-num {
  width: 44px;
  text-align: center;
  color: var(--text-muted, #94a3b8);
  background: var(--bg-surface-subtle, #f8fafc);
  border-right: 1px solid var(--border-color, #e2e8f0);
}

.rename-table thead .th-num {
  background: #0f172a;
}

.th-original,
.th-renamed {
  padding: 10px 14px;
  font-weight: 700;
}

.th-arrow,
.td-arrow {
  width: 28px;
  text-align: center;
  color: var(--text-muted, #94a3b8);
}

.th-size,
.td-size {
  width: 80px;
  text-align: right;
  padding-right: 14px;
  color: var(--text-muted, #64748b);
  font-size: 0.8rem;
}

.th-action,
.td-action {
  width: 50px;
  text-align: center;
}

.rename-row {
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.rename-row:hover {
  background: rgba(16, 185, 129, 0.04);
}

.rename-row.is-changed .td-renamed {
  color: #047857;
  font-weight: 600;
}

.rename-row.has-collision {
  background: #fffbeb;
}

.td-original {
  padding: 8px 14px;
  color: var(--text-heading, #334155);
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-renamed {
  padding: 8px 14px;
  outline: none;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 4px;
}

.td-renamed:focus {
  background: #ecfdf5;
  box-shadow: inset 0 0 0 2px #059669;
}

.manual-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  font-size: 0.7rem;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 4px;
}

.collision-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  font-size: 0.7rem;
  background: #fef3c7;
  color: #b45309;
  border-radius: 4px;
}

.row-action-btn {
  background: none;
  border: none;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.row-action-btn:hover {
  color: #dc2626;
  background: #fef2f2;
}

/* Export Bar */
.export-bar {
  padding: 16px 20px;
  background: var(--bg-surface-subtle, #f8fafc);
  border-top: 1px solid var(--border-color, #e2e8f0);
}

.export-main-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .converter-title {
    font-size: 1.5rem;
  }
  .stepper-bar {
    display: none;
  }
  .rules-tabs-header {
    justify-content: flex-start;
  }
  .preview-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .export-main-actions {
    flex-direction: column;
  }
  .export-main-actions .btn {
    width: 100%;
  }
}
</style>
