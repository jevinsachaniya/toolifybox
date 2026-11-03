<script setup>
import { ArrowUpRight, ChevronDown, Menu, Search, X } from '@lucide/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const route = useRoute();
const router = useRouter();
const menuOpen = ref(false);
const toolSearch = ref('');
const isMegaOpen = ref(false);

const toolsBtnRef = ref(null);
const megaWrapperRef = ref(null);
const toolsDropdownRef = ref(null);
const pointerLeft = ref(null);

let closeTimer = null;

const isToolsActive = computed(() => {
  return route.path === '/tools' || route.path.startsWith('/tools/');
});

const row1Categories = [
  {
    title: 'Organize PDF',
    tools: [
      { name: 'Merge PDF', path: '/tools/merge-pdf', icon: '/icons/tools/merge-pdf.svg' },
      { name: 'Split PDF', path: '/tools/split-pdf', icon: '/icons/tools/split-pdf.svg' },
      { name: 'Remove Pages', path: '/tools/remove-pdf-pages', icon: '/icons/tools/remove-pages.svg' },
      { name: 'Organize PDF', path: '/tools/organize-pdf', icon: '/icons/tools/organize-pdf.svg' },
    ]
  },
  {
    title: 'Optimize & Scan',
    tools: [
      { name: 'Compress PDF', path: '/tools/compress-pdf', icon: '/icons/tools/compress-pdf.svg' },
      { name: 'Flatten PDF', path: '/tools/flatten-pdf', icon: '/icons/tools/flatten-pdf.svg' },
      { name: 'Extract OCR', path: '/tools/extract-ocr', icon: '/icons/tools/ocr-extract.svg' },
      { name: 'Compare PDF', path: '/tools/compare-pdf', icon: '/icons/tools/compare-pdf.svg' },
      { name: 'Translate PDF', path: '/tools/translate-pdf', icon: '/icons/tools/translate-pdf.svg' },
    ]
  },
  {
    title: 'Convert to PDF',
    cols: 2,
    tools: [
      { name: 'Word to PDF', path: '/tools/word-to-pdf', icon: '/icons/tools/word.svg' },
      { name: 'PowerPoint to PDF', path: '/tools/powerpoint-to-pdf', icon: '/icons/tools/powerpoint.svg' },
      { name: 'Excel to PDF', path: '/tools/excel-to-pdf', icon: '/icons/tools/excel.svg' },
      { name: 'Images to PDF', path: '/tools/images-to-pdf', icon: '/icons/tools/images-to-pdf.svg' },
      { name: 'HTML to PDF', path: '/tools/html-to-pdf', icon: '/icons/tools/html-to-pdf.svg' },
      { name: 'Text to PDF', path: '/tools/text-to-pdf', icon: '/icons/tools/text-to-pdf.svg' },
      { name: 'Create PDF', path: '/tools/create-pdf', icon: '/icons/tools/create-pdf.svg' },
    ]
  },
  {
    title: 'Convert from PDF',
    tools: [
      { name: 'PDF to Word', path: '/tools/pdf-to-word', icon: '/icons/tools/pdf-to-word.svg' },
      { name: 'PDF to JPG', path: '/tools/pdf-to-jpg', icon: '/icons/tools/pdf-to-jpg.svg' },
      { name: 'PDF to Images', path: '/tools/pdf-to-images', icon: '/icons/tools/pdf-to-images.svg' },
      { name: 'PDF to HTML', path: '/tools/pdf-to-html', icon: '/icons/tools/pdf-to-html.svg' },
    ]
  }
];

const row2Categories = [
  {
    title: 'Edit PDF',
    tools: [
      { name: 'Rotate PDF', path: '/tools/rotate-pdf', icon: '/icons/tools/rotate-pdf.svg' },
      { name: 'Crop PDF', path: '/tools/crop-pdf', icon: '/icons/tools/crop-pdf.svg' },
      { name: 'Watermark PDF', path: '/tools/watermark-pdf', icon: '/icons/tools/watermark-pdf.svg' },
      { name: 'Add Page Numbers', path: '/tools/add-page-numbers', icon: '/icons/tools/add-page-numbers.svg' },
    ]
  },
  {
    title: 'PDF Security',
    tools: [
      { name: 'Protect PDF', path: '/tools/protect-pdf', icon: '/icons/tools/protect-pdf.svg' },
      { name: 'Unlock PDF', path: '/tools/unlock-pdf', icon: '/icons/tools/unlock-pdf.svg' },
    ]
  },
  {
    title: 'Image Utilities',
    cols: 2,
    tools: [
      { name: 'Convert Image', path: '/tools/convert-image', icon: '/icons/tools/convert-image.svg' },
      { name: 'Compress Image', path: '/tools/compress-image', icon: '/icons/tools/compress-image.svg' },
      { name: 'Remove Background', path: '/tools/remove-background', icon: '/icons/tools/remove-background.svg' },
      { name: 'Watermark Image', path: '/tools/watermark-image', icon: '/icons/tools/watermark-image.svg' },
      { name: 'Blur Face', path: '/tools/blur-face', icon: '/icons/tools/blur-face.svg' },
      { name: 'Color Picker', path: '/tools/image-color-picker', icon: '/icons/tools/image-color-picker.svg' },
      { name: 'Split Image', path: '/tools/split-image', icon: '/icons/tools/split-image.svg' },
      { name: 'Image Collage', path: '/tools/image-collage', icon: '/icons/tools/image-collage.svg' },
    ]
  },
  {
    title: 'Web & Data Tools',
    tools: [
      { name: 'HTML to Image', path: '/tools/html-to-image', icon: '/icons/tools/html-to-image.svg' },
      { name: 'Image to SVG', path: '/tools/image-to-svg', icon: '/icons/tools/image-to-svg.svg' },
      { name: 'CSV to JSON', path: '/tools/csv-to-json', icon: '/icons/tools/csv-to-json.svg' },
      { name: 'JSON to CSV', path: '/tools/json-to-csv', icon: '/icons/tools/json-to-csv.svg' },
      { name: 'Excel Formulas', path: '/tools/excel-formula-explainer', icon: '/icons/tools/excel-formula.svg' },
    ]
  }
];

function getCategoryColumns(cat) {
  const numCols = cat.cols || (cat.tools.length > 5 ? 2 : 1);
  if (numCols <= 1 || cat.tools.length <= 1) {
    return [cat.tools];
  }
  const perCol = Math.ceil(cat.tools.length / numCols);
  const cols = [];
  for (let i = 0; i < cat.tools.length; i += perCol) {
    cols.push(cat.tools.slice(i, i + perCol));
  }
  return cols;
}

function updatePointerPosition() {
  if (!toolsBtnRef.value || !megaWrapperRef.value) return;
  const btnRect = toolsBtnRef.value.getBoundingClientRect();
  const wrapperRect = megaWrapperRef.value.getBoundingClientRect();
  const center = btnRect.left + btnRect.width / 2;
  const offset = center - wrapperRect.left;
  if (offset > 0 && offset < wrapperRect.width) {
    pointerLeft.value = Math.round(offset);
  }
}

function openMega() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  isMegaOpen.value = true;
  nextTick(() => {
    updatePointerPosition();
  });
}

function cancelCloseMega() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}

function scheduleCloseMega() {
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    isMegaOpen.value = false;
  }, 180);
}

function toggleMega() {
  if (closeTimer) clearTimeout(closeTimer);
  isMegaOpen.value = !isMegaOpen.value;
  if (isMegaOpen.value) {
    nextTick(() => {
      updatePointerPosition();
    });
  }
}

function closeMega() {
  if (closeTimer) clearTimeout(closeTimer);
  isMegaOpen.value = false;
}

function closeMenu() {
  menuOpen.value = false;
  closeMega();
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    closeMega();
    closeMenu();
  }
}

function onDocClick(event) {
  if (isMegaOpen.value && toolsDropdownRef.value && !toolsDropdownRef.value.contains(event.target)) {
    closeMega();
  }
}

async function findTool() {
  const search = toolSearch.value.trim();
  closeMenu();
  await nextTick();
  await router.push({ path: '/tools', query: search ? { search } : {}, hash: '#tool-results' });
  await nextTick();
  document.querySelector('#tool-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

watch(() => route.fullPath, () => {
  closeMenu();
  closeMega();
});

watch(isMegaOpen, (open) => {
  if (open) {
    nextTick(() => {
      updatePointerPosition();
    });
  }
});

watch(menuOpen, (open) => {
  if (import.meta.client) document.body.classList.toggle('mobile-menu-open', open);
});

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  document.addEventListener('click', onDocClick);
  window.addEventListener('resize', updatePointerPosition);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  document.removeEventListener('click', onDocClick);
  window.removeEventListener('resize', updatePointerPosition);
  if (closeTimer) clearTimeout(closeTimer);
  document.body.classList.remove('mobile-menu-open');
});
</script>

<template>
  <header class="site-header">
    <div class="container header-inner">
      <BrandLogo />
      <nav class="desktop-nav" aria-label="Main navigation">
        <NuxtLink to="/">Home</NuxtLink>

        <!-- Tools Dropdown Trigger + Mega Menu -->
        <div
          ref="toolsDropdownRef"
          class="nav-tools-item"
          @mouseenter="openMega"
          @mouseleave="scheduleCloseMega"
        >
          <button
            ref="toolsBtnRef"
            type="button"
            class="nav-tools-button"
            :class="{ active: isMegaOpen || isToolsActive }"
            :aria-expanded="isMegaOpen"
            aria-haspopup="true"
            @click.prevent="toggleMega"
          >
            <span>Tools</span>
            <ChevronDown class="nav-chevron" :class="{ 'is-flipped': isMegaOpen }" :size="13" />
          </button>

          <Transition name="mega-fade">
            <div
              v-if="isMegaOpen"
              ref="megaWrapperRef"
              class="mega-menu-wrapper"
              @mouseenter="cancelCloseMega"
              @mouseleave="scheduleCloseMega"
            >
              <div
                class="mega-pointer"
                :style="pointerLeft ? { left: `${pointerLeft}px` } : {}"
              />
              <div class="mega-menu-card">
                <!-- Row 1: Organize PDF, Optimize & Scan, Convert to PDF, Convert from PDF -->
                <div class="mega-row">
                  <div
                    v-for="cat in row1Categories"
                    :key="cat.title"
                    class="mega-col"
                    :class="{ 'span-2': (cat.cols || (cat.tools.length > 5 ? 2 : 1)) === 2 }"
                  >
                    <span class="mega-col-title">{{ cat.title }}</span>
                    <div class="mega-col-subgrid" :class="{ 'is-multi': getCategoryColumns(cat).length > 1 }">
                      <div
                        v-for="(subList, colIdx) in getCategoryColumns(cat)"
                        :key="colIdx"
                        class="mega-col-list"
                      >
                        <NuxtLink
                          v-for="tool in subList"
                          :key="tool.path"
                          :to="tool.path"
                          class="mega-tool-item"
                          @click="closeMega"
                        >
                          <img
                            :src="tool.icon"
                            :alt="tool.name"
                            class="mega-tool-icon"
                            width="18"
                            height="18"
                            loading="lazy"
                          />
                          <span class="mega-tool-name">{{ tool.name }}</span>
                        </NuxtLink>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mega-row-divider" />

                <!-- Row 2: Edit PDF, PDF Security, Image Utilities, Web & Data Tools -->
                <div class="mega-row">
                  <div
                    v-for="cat in row2Categories"
                    :key="cat.title"
                    class="mega-col"
                    :class="{ 'span-2': (cat.cols || (cat.tools.length > 5 ? 2 : 1)) === 2 }"
                  >
                    <span class="mega-col-title">{{ cat.title }}</span>
                    <div class="mega-col-subgrid" :class="{ 'is-multi': getCategoryColumns(cat).length > 1 }">
                      <div
                        v-for="(subList, colIdx) in getCategoryColumns(cat)"
                        :key="colIdx"
                        class="mega-col-list"
                      >
                        <NuxtLink
                          v-for="tool in subList"
                          :key="tool.path"
                          :to="tool.path"
                          class="mega-tool-item"
                          @click="closeMega"
                        >
                          <img
                            :src="tool.icon"
                            :alt="tool.name"
                            class="mega-tool-icon"
                            width="18"
                            height="18"
                            loading="lazy"
                          />
                          <span class="mega-tool-name">{{ tool.name }}</span>
                        </NuxtLink>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mega-footer-strip">
                  <div class="mega-footer-info">
                    <span class="mega-green-dot" />
                    <span>{{ TOTAL_TOOLS_COUNT }} free tools • 100% Client-side privacy</span>
                  </div>
                  <NuxtLink to="/tools" class="mega-footer-link" @click="closeMega">
                    <span>Explore full tool directory →</span>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <NuxtLink to="/about">About</NuxtLink>
        <NuxtLink to="/contact">Contact</NuxtLink>
      </nav>

      <ThemeToggle />
      <NuxtLink class="header-action" to="/tools">Open tools <ArrowUpRight :size="16" /></NuxtLink>
      <button
        type="button"
        class="mobile-menu-toggle"
        :class="{ open: menuOpen }"
        :aria-expanded="menuOpen"
        aria-controls="mobile-navigation"
        :aria-label="menuOpen ? 'Close navigation menu' : 'Open navigation menu'"
        @click="menuOpen = !menuOpen"
      >
        <X v-if="menuOpen" :size="21" aria-hidden="true" />
        <Menu v-else :size="22" aria-hidden="true" />
      </button>
    </div>

    <Transition name="mobile-menu">
      <div v-if="menuOpen" id="mobile-navigation" class="mobile-navigation">
        <div class="container mobile-navigation-inner">
          <nav class="mobile-primary-links" aria-label="Mobile main navigation">
            <NuxtLink to="/" @click="closeMenu">Home</NuxtLink>
            <NuxtLink to="/tools" @click="closeMenu">All tools</NuxtLink>
            <NuxtLink to="/about" @click="closeMenu">About</NuxtLink>
            <NuxtLink to="/contact" @click="closeMenu">Contact</NuxtLink>
          </nav>
          <div class="mobile-tool-finder">
            <span class="mobile-nav-label">Tool library</span>
            <h2>Find the right tool.</h2>
            <p>Search the complete library as new Word, PDF and image utilities are added.</p>
            <form role="search" @submit.prevent="findTool">
              <Search :size="16" aria-hidden="true" />
              <input v-model="toolSearch" type="search" placeholder="What do you need?" aria-label="Search all tools" autocomplete="off" />
              <button type="submit" aria-label="Search tools"><ArrowUpRight :size="17" /></button>
            </form>
            <NuxtLink class="mobile-library-link" to="/tools#catalog" @click="closeMenu">Browse the complete library <ArrowUpRight :size="14" /></NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>
