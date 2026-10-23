<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Check, ChevronDown, Search, X } from '@lucide/vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: 'Select an option',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  searchable: {
    type: Boolean,
    default: null, // auto-detect: true if options > 7
  },
  name: {
    type: String,
    default: '',
  },
  id: {
    type: String,
    default: '',
  },
  ariaLabel: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md', // 'sm' | 'md' | 'lg'
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);
const searchQuery = ref('');
const focusedIndex = ref(-1);
const rootRef = ref(null);
const searchInputRef = ref(null);
const nativeSelectRef = ref(null);
const menuRef = ref(null);
const openUpward = ref(false);

/**
 * Normalizes options into a standard internal structure:
 * Array of { isGroup: true, label } OR { value, label, sublabel, flag, disabled }
 */
const normalizedOptions = computed(() => {
  const result = [];
  if (!Array.isArray(props.options)) return result;

  for (const item of props.options) {
    if (typeof item === 'string' || typeof item === 'number') {
      result.push({
        value: String(item),
        label: String(item),
        sublabel: '',
        flag: '',
        disabled: false,
      });
    } else if (item && item.group && Array.isArray(item.items)) {
      result.push({ isGroup: true, label: item.group });
      for (const sub of item.items) {
        if (typeof sub === 'string' || typeof sub === 'number') {
          result.push({
            value: String(sub),
            label: String(sub),
            sublabel: '',
            flag: '',
            disabled: false,
          });
        } else {
          result.push({
            value: String(sub.value ?? sub.code ?? sub.id ?? ''),
            label: String(sub.label ?? sub.name ?? sub.value ?? ''),
            sublabel: String(sub.sublabel ?? sub.native ?? ''),
            flag: String(sub.flag ?? ''),
            disabled: Boolean(sub.disabled),
          });
        }
      }
    } else if (item) {
      result.push({
        value: String(item.value ?? item.code ?? item.id ?? ''),
        label: String(item.label ?? item.name ?? item.value ?? ''),
        sublabel: String(item.sublabel ?? item.native ?? ''),
        flag: String(item.flag ?? ''),
        group: item.group || '',
        disabled: Boolean(item.disabled),
      });
    }
  }

  return result;
});

// Flat list of selectable items (excluding group headers)
const selectableOptions = computed(() => {
  return normalizedOptions.value.filter(item => !item.isGroup);
});

// Determine if search should be enabled
const isSearchEnabled = computed(() => {
  if (props.searchable !== null) return props.searchable;
  return selectableOptions.value.length > 7;
});

// Filtered options based on search query
const filteredOptions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return normalizedOptions.value;

  const filtered = [];
  let currentGroup = null;
  let groupHasMatch = false;

  for (const item of normalizedOptions.value) {
    if (item.isGroup) {
      currentGroup = item;
      groupHasMatch = false;
      continue;
    }

    const matches =
      item.label.toLowerCase().includes(query) ||
      (item.sublabel && item.sublabel.toLowerCase().includes(query)) ||
      (item.value && item.value.toLowerCase().includes(query)) ||
      (currentGroup && currentGroup.label.toLowerCase().includes(query));

    if (matches) {
      if (currentGroup && !groupHasMatch) {
        filtered.push(currentGroup);
        groupHasMatch = true;
      }
      filtered.push(item);
    }
  }

  return filtered;
});

// Filtered selectable items (for keyboard navigation)
const filteredSelectable = computed(() => {
  return filteredOptions.value.filter(item => !item.isGroup && !item.disabled);
});

// Currently selected option object
const selectedOption = computed(() => {
  const val = String(props.modelValue ?? '');
  return selectableOptions.value.find(opt => opt.value === val) || null;
});

// Display text in trigger button
const displayText = computed(() => {
  if (selectedOption.value) {
    if (selectedOption.value.sublabel) {
      return `${selectedOption.value.label} (${selectedOption.value.sublabel})`;
    }
    return selectedOption.value.label;
  }
  return props.placeholder;
});

function calculatePosition() {
  if (!rootRef.value) return;
  const rect = rootRef.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  // If less than 260px below and more space above, open upward
  openUpward.value = spaceBelow < 280 && spaceAbove > spaceBelow;
}

function open() {
  if (props.disabled || isOpen.value) return;
  calculatePosition();
  isOpen.value = true;
  searchQuery.value = '';
  focusedIndex.value = -1;

  nextTick(() => {
    if (isSearchEnabled.value && searchInputRef.value) {
      searchInputRef.value.focus();
    }
    // Scroll selected item into view
    scrollToSelected();
  });
}

function close() {
  isOpen.value = false;
  searchQuery.value = '';
  focusedIndex.value = -1;
}

function toggle() {
  if (isOpen.value) close();
  else open();
}

function selectItem(item) {
  if (!item || item.disabled || item.isGroup) return;
  emit('update:modelValue', item.value);
  emit('change', item.value);

  // Sync to native hidden select
  if (nativeSelectRef.value) {
    nativeSelectRef.value.value = item.value;
    nativeSelectRef.value.dispatchEvent(new Event('change', { bubbles: true }));
  }

  close();
  rootRef.value?.querySelector('.custom-select-trigger')?.focus();
}

function scrollToSelected() {
  if (!menuRef.value) return;
  const selectedEl = menuRef.value.querySelector('.custom-select-option.is-selected');
  if (selectedEl) {
    selectedEl.scrollIntoView({ block: 'nearest' });
  }
}

// Handle native select change (e.g. from tests or external scripts)
function onNativeChange(e) {
  const newVal = e.target.value;
  emit('update:modelValue', newVal);
  emit('change', newVal);
}

// Keyboard navigation
function onTriggerKeydown(e) {
  if (props.disabled) return;

  if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (!isOpen.value) open();
  } else if (e.key === 'Escape') {
    close();
  }
}

function onMenuKeydown(e) {
  const items = filteredSelectable.value;
  if (!items.length) {
    if (e.key === 'Escape') close();
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    focusedIndex.value = (focusedIndex.value + 1) % items.length;
    scrollFocusedIntoView();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    focusedIndex.value = (focusedIndex.value - 1 + items.length) % items.length;
    scrollFocusedIntoView();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (focusedIndex.value >= 0 && focusedIndex.value < items.length) {
      selectItem(items[focusedIndex.value]);
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    close();
    rootRef.value?.querySelector('.custom-select-trigger')?.focus();
  }
}

function scrollFocusedIntoView() {
  nextTick(() => {
    if (!menuRef.value) return;
    const focusedEl = menuRef.value.querySelector('.custom-select-option.is-focused');
    if (focusedEl) {
      focusedEl.scrollIntoView({ block: 'nearest' });
    }
  });
}

function onDocumentClick(e) {
  if (rootRef.value && !rootRef.value.contains(e.target)) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentClick);
});

// Watch modelValue prop changes to keep native select in sync
watch(() => props.modelValue, (newVal) => {
  if (nativeSelectRef.value && nativeSelectRef.value.value !== String(newVal)) {
    nativeSelectRef.value.value = String(newVal);
  }
});
</script>

<template>
  <div
    ref="rootRef"
    class="custom-select-wrapper"
    :class="[
      `size-${size}`,
      {
        'is-open': isOpen,
        'is-disabled': disabled,
        'open-upward': openUpward,
      },
    ]"
  >
    <!-- Hidden native select for accessibility and external script compatibility -->
    <select
      :id="id || undefined"
      ref="nativeSelectRef"
      :name="name || undefined"
      :value="modelValue"
      :disabled="disabled"
      :aria-label="ariaLabel || placeholder"
      tabindex="-1"
      class="custom-select-native sr-only"
      aria-hidden="true"
      @change="onNativeChange"
    >
      <template v-for="item in normalizedOptions" :key="item.value || item.label">
        <optgroup v-if="item.isGroup" :label="item.label" />
        <option
          v-else
          :value="item.value"
          :disabled="item.disabled"
        >
          {{ item.label }}{{ item.sublabel ? ` (${item.sublabel})` : '' }}
        </option>
      </template>
    </select>

    <!-- Trigger Button -->
    <button
      type="button"
      class="custom-select-trigger"
      :disabled="disabled"
      :aria-expanded="isOpen"
      :aria-label="ariaLabel || placeholder"
      aria-haspopup="listbox"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span class="custom-select-trigger-content">
        <span v-if="selectedOption?.flag" class="custom-select-flag" aria-hidden="true">
          {{ selectedOption.flag }}
        </span>
        <span class="custom-select-label" :class="{ 'is-placeholder': !selectedOption }">
          {{ displayText }}
        </span>
      </span>

      <span class="custom-select-chevron" :class="{ 'is-flipped': isOpen }" aria-hidden="true">
        <ChevronDown :size="16" />
      </span>
    </button>

    <!-- Floating Custom Dropdown Menu -->
    <Transition name="select-pop">
      <div
        v-if="isOpen"
        ref="menuRef"
        class="custom-select-menu"
        role="listbox"
        :aria-label="ariaLabel || placeholder"
        @keydown="onMenuKeydown"
      >
        <!-- Search filter input if list has many options -->
        <div v-if="isSearchEnabled" class="custom-select-search-wrap">
          <Search :size="14" class="search-icon" aria-hidden="true" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="custom-select-search-input"
            placeholder="Search language or option…"
            autocomplete="off"
            spellcheck="false"
            @click.stop
          />
          <button
            v-if="searchQuery"
            type="button"
            class="search-clear-btn"
            aria-label="Clear search"
            @click.stop="searchQuery = ''; searchInputRef?.focus()"
          >
            <X :size="12" />
          </button>
        </div>

        <!-- Scrollable Options List -->
        <div class="custom-select-options-list">
          <template v-if="filteredOptions.length">
            <template v-for="(item, idx) in filteredOptions" :key="item.value || item.label">
              <!-- Group Header -->
              <div v-if="item.isGroup" class="custom-select-group-header" role="presentation">
                <span>{{ item.label }}</span>
              </div>

              <!-- Selectable Option -->
              <div
                v-else
                class="custom-select-option"
                :class="{
                  'is-selected': String(item.value) === String(modelValue),
                  'is-focused': filteredSelectable[focusedIndex]?.value === item.value,
                  'is-disabled': item.disabled,
                }"
                role="option"
                :aria-selected="String(item.value) === String(modelValue)"
                @click.stop="selectItem(item)"
              >
                <div class="option-main">
                  <span v-if="item.flag" class="option-flag" aria-hidden="true">{{ item.flag }}</span>
                  <span class="option-label">{{ item.label }}</span>
                  <span v-if="item.sublabel" class="option-sublabel">({{ item.sublabel }})</span>
                </div>

                <span v-if="String(item.value) === String(modelValue)" class="option-check" aria-hidden="true">
                  <Check :size="15" />
                </span>
              </div>
            </template>
          </template>

          <!-- Empty search results -->
          <div v-else class="custom-select-empty">
            <span>No options match "{{ searchQuery }}"</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.custom-select-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
  font-family: inherit;
  user-select: none;
}

/* Screen reader only hidden native select */
.custom-select-native {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Trigger Button */
.custom-select-trigger {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.6rem 0.85rem;
  border-radius: 0.625rem;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--card-bg, #ffffff);
  color: var(--text-heading, #0f172a);
  font-size: 0.875rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.size-sm .custom-select-trigger {
  min-height: 36px;
  padding: 0.35rem 0.65rem;
  font-size: 0.8125rem;
}

.size-lg .custom-select-trigger {
  min-height: 48px;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
}

.custom-select-trigger:hover:not(:disabled) {
  border-color: #6366f1;
  background: var(--card-bg, #ffffff);
}

.custom-select-wrapper.is-open .custom-select-trigger {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
}

.custom-select-trigger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--surface-bg, #f8fafc);
}

.custom-select-trigger-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
}

.custom-select-flag {
  font-size: 1.15rem;
  line-height: 1;
}

.custom-select-label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-select-label.is-placeholder {
  color: var(--text-muted, #94a3b8);
}

.custom-select-chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted, #64748b);
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
}

.custom-select-chevron.is-flipped {
  transform: rotate(180deg);
  color: #6366f1;
}

/* Floating Custom Dropdown Menu */
.custom-select-menu {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  z-index: 1050;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  box-shadow: 0 12px 30px -4px rgba(15, 23, 42, 0.18), 0 4px 12px -2px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 320px;
  box-sizing: border-box;
}

@media (max-width: 600px) {
  .custom-select-trigger {
    min-height: 40px;
    padding: 0.5rem 0.75rem;
    font-size: 0.82rem;
  }

  .size-sm .custom-select-trigger {
    min-height: 36px;
    padding: 0.35rem 0.6rem;
    font-size: 0.78rem;
  }

  .custom-select-menu {
    max-height: 250px;
  }

  .custom-select-option {
    padding: 0.45rem 0.55rem;
    font-size: 0.8rem;
  }

  .option-label {
    max-width: 130px;
  }

  .option-sublabel {
    max-width: 110px;
    font-size: 0.72rem;
  }
}

.custom-select-wrapper.open-upward .custom-select-menu {
  top: auto;
  bottom: calc(100% + 6px);
  box-shadow: 0 -12px 30px -4px rgba(15, 23, 42, 0.18), 0 -4px 12px -2px rgba(15, 23, 42, 0.08);
}

/* Search input container */
.custom-select-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.custom-select-search-wrap .search-icon {
  color: #94a3b8;
  margin-right: 0.45rem;
  flex-shrink: 0;
}

.custom-select-search-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.8125rem;
  color: #0f172a;
  padding: 0;
}

.custom-select-search-input::placeholder {
  color: #94a3b8;
}

.search-clear-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.search-clear-btn:hover {
  color: #0f172a;
  background: #e2e8f0;
}

/* Scrollable Options List */
.custom-select-options-list {
  padding: 0.35rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.custom-select-options-list::-webkit-scrollbar {
  width: 6px;
}

.custom-select-options-list::-webkit-scrollbar-track {
  background: transparent;
}

.custom-select-options-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.custom-select-options-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Group Header */
.custom-select-group-header {
  padding: 0.5rem 0.65rem 0.25rem;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6366f1;
}

/* Option Item */
.custom-select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.65rem;
  border-radius: 0.5rem;
  font-size: 0.84rem;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.custom-select-option:hover:not(.is-disabled),
.custom-select-option.is-focused:not(.is-disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.custom-select-option.is-selected {
  background: #e0e7ff;
  color: #4338ca;
  font-weight: 600;
}

.custom-select-option.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.option-main {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  flex: 1;
}

.option-flag {
  font-size: 1.05rem;
  line-height: 1;
}

.option-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.option-sublabel {
  color: #64748b;
  font-size: 0.775rem;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.custom-select-option.is-selected .option-sublabel {
  color: #6366f1;
}

.option-check {
  color: #4338ca;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.custom-select-empty {
  padding: 1.25rem 0.75rem;
  text-align: center;
  font-size: 0.8125rem;
  color: #94a3b8;
}

/* Smooth Transition Animation */
.select-pop-enter-active,
.select-pop-leave-active {
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.select-pop-enter-from,
.select-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

.custom-select-wrapper.open-upward .select-pop-enter-from,
.custom-select-wrapper.open-upward .select-pop-leave-to {
  transform: translateY(4px) scale(0.98);
}

/* Dark Theme Overrides */
html[data-theme='dark'] .custom-select-trigger {
  background: #111827;
  border-color: #334155;
  color: #f8fafc;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

html[data-theme='dark'] .custom-select-trigger:hover:not(:disabled) {
  border-color: #818cf8;
  background: #17172b;
}

html[data-theme='dark'] .custom-select-wrapper.is-open .custom-select-trigger {
  border-color: #818cf8;
  box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.22);
}

html[data-theme='dark'] .custom-select-trigger:disabled {
  background: #0b1220;
}

html[data-theme='dark'] .custom-select-menu {
  background: #0f172a;
  border-color: #334155;
  box-shadow: 0 14px 35px -4px rgba(0, 0, 0, 0.65), 0 4px 12px -2px rgba(0, 0, 0, 0.35);
}

html[data-theme='dark'] .custom-select-search-wrap {
  background: #0b1220;
  border-color: #1e293b;
}

html[data-theme='dark'] .custom-select-search-input {
  color: #f8fafc;
}

html[data-theme='dark'] .custom-select-search-input::placeholder {
  color: #64748b;
}

html[data-theme='dark'] .search-clear-btn:hover {
  background: #334155;
  color: #f8fafc;
}

html[data-theme='dark'] .custom-select-options-list {
  scrollbar-color: #334155 transparent;
}

html[data-theme='dark'] .custom-select-options-list::-webkit-scrollbar-thumb {
  background: #334155;
}

html[data-theme='dark'] .custom-select-options-list::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

html[data-theme='dark'] .custom-select-group-header {
  color: #818cf8;
}

html[data-theme='dark'] .custom-select-option {
  color: #e2e8f0;
}

html[data-theme='dark'] .custom-select-option:hover:not(.is-disabled),
html[data-theme='dark'] .custom-select-option.is-focused:not(.is-disabled) {
  background: #1e293b;
  color: #ffffff;
}

html[data-theme='dark'] .custom-select-option.is-selected {
  background: #312e81;
  color: #c7d2fe;
}

html[data-theme='dark'] .option-sublabel {
  color: #94a3b8;
}

html[data-theme='dark'] .custom-select-option.is-selected .option-sublabel {
  color: #a5b4fc;
}

html[data-theme='dark'] .option-check {
  color: #a5b4fc;
}
</style>
