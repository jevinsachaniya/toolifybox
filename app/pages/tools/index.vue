<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { 
  ArrowUpRight, Check, ChevronDown, FileCheck, FileImage, FileSpreadsheet, FileText,
  Globe, ImageDown, Languages, Layers, LayoutGrid, Lock, LockKeyhole, Minimize2, Presentation, RotateCw, ScanText, Scissors,
  Search, Shield, ShieldCheck, Sparkles, Stamp, Trash2, Unlock, WandSparkles, X, Zap 
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, usePageSeo } from '~/composables/usePageSeo';

const pageDescription = 'Free, private online Word, PDF, Excel, PowerPoint and image tools in your browser. Convert files, merge, split, compress, translate and edit PDFs locally with zero file uploads.';

const toolsFaqs = [
  ['Are all 20 tools on Toolifybox completely free to use?', 'Yes, every single tool on Toolifybox is 100% free with no hidden charges, no trial subscriptions, no daily conversion limits, and zero watermarks added to your downloaded documents.'],
  ['How is client-side in-browser file conversion safer than cloud tools?', 'When you upload documents to standard cloud converters, copies are saved on remote third-party servers, creating data privacy and compliance risks. Toolifybox processes files inside your device memory using WebAssembly, ensuring your documents never leave your computer or phone.'],
  ['Can I use Toolifybox on mobile devices (iPhone, iPad, Android)?', 'Absolutely. Toolifybox is fully responsive and optimized for mobile browsers including Safari, Chrome, Edge, and Firefox. You can convert, compress, merge, and edit documents on your mobile phone without installing apps.'],
  ['Which Indian and international languages are supported for OCR and Translation?', 'Toolifybox supports 17+ languages for OCR and document processing, including Hindi, Gujarati, Marathi, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Urdu, Sanskrit, English, Spanish, French, German, Arabic, and Russian.'],
  ['Can I convert multiple pages without losing document formatting?', 'Yes. Our converters and utility tools support multi-page documents up to 100 pages. Toolifybox retains headers, footers, font typography, tables, and page alignments.'],
];

usePageSeo({
  title: 'Free Online Word, PDF & Image Tools Suite — 100% Private | Toolifybox',
  description: pageDescription,
  path: '/tools',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
    ]),
    ({ siteUrl, canonical }) => ({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Free Word, PDF and Image Tools',
      description: pageDescription,
      url: canonical,
      isPartOf: { '@type': 'WebSite', name: 'Toolifybox', url: siteUrl },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: [
          ['Word to PDF', '/tools/word-to-pdf'],
          ['PowerPoint to PDF', '/tools/powerpoint-to-pdf'],
          ['Excel to PDF', '/tools/excel-to-pdf'],
          ['PDF to Word', '/tools/pdf-to-word'],
          ['PDF to JPG', '/tools/pdf-to-jpg'],
          ['PDF to Images', '/tools/pdf-to-images'],
          ['Images to PDF', '/tools/images-to-pdf'],
          ['Merge PDF', '/tools/merge-pdf'],
          ['Split PDF', '/tools/split-pdf'],
          ['Remove PDF Pages', '/tools/remove-pdf-pages'],
          ['Rotate PDF', '/tools/rotate-pdf'],
          ['Flatten PDF', '/tools/flatten-pdf'],
          ['Extract OCR Text', '/tools/extract-ocr'],
          ['Make Image Collage', '/tools/image-collage'],
          ['Translate PDF', '/tools/translate-pdf'],
          ['Watermark PDF', '/tools/watermark-pdf'],
          ['Compress PDF', '/tools/compress-pdf'],
          ['Compress Image', '/tools/compress-image'],
          ['Protect PDF', '/tools/protect-pdf'],
          ['Unlock PDF', '/tools/unlock-pdf'],
        ].map(([name, path], index) => ({ '@type': 'ListItem', position: index + 1, name, url: new URL(path, `${siteUrl}/`).href })),
      },
    }),
    () => faqSchema(toolsFaqs),
  ],
});

const route = useRoute();
const selectedTool = ref('word-pdf');
const searchQuery = ref(typeof route.query.search === 'string' ? route.query.search : '');
const selectedCategory = ref('all');
const toastMessage = ref('');
const toastVisible = ref(false);
let toastTimer = null;

const categories = [
  { id: 'all', label: 'All Utilities' },
  { id: 'pdf', label: 'PDF Utilities' },
  { id: 'security', label: 'Security & Passwords' },
  { id: 'word', label: 'Word Utilities' },
  { id: 'image', label: 'Image Utilities' },
  { id: 'ocr', label: 'OCR & Scans' },
  { id: 'pages', label: 'Organize Pages' },
];

const allTools = [
  {
    id: 'word-pdf',
    title: 'Word to PDF',
    category: 'word',
    description: 'Convert DOCX documents into clean, share-ready PDFs directly in your browser.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: FileText,
    iconName: 'word',
    theme: 'word',
    route: '/tools/word-to-pdf',
  },
  {
    id: 'powerpoint-pdf',
    title: 'PowerPoint to PDF',
    category: 'pdf',
    description: 'Convert PowerPoint (.pptx) pitch decks and slides into clean, presentation-ready PDFs.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: Presentation,
    iconName: 'powerpoint',
    theme: 'orange',
    route: '/tools/powerpoint-to-pdf',
  },
  {
    id: 'excel-pdf',
    title: 'Excel to PDF',
    category: 'pdf',
    description: 'Convert Excel (.xlsx, .csv) spreadsheets and workbooks into clean, paginated PDF documents.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: FileSpreadsheet,
    iconName: 'excel',
    theme: 'emerald',
    route: '/tools/excel-to-pdf',
  },
  {
    id: 'pdf-word',
    title: 'PDF to Word',
    category: 'pdf',
    description: 'Transform PDF documents into editable Word (.docx) files with local OCR text recovery.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: ScanText,
    iconName: 'pdf-to-word',
    theme: 'pdf',
    route: '/tools/pdf-to-word',
  },
  {
    id: 'pdf-jpg',
    title: 'PDF to JPG',
    category: 'pdf',
    description: 'Convert PDF pages into high-resolution JPG images with adjustable quality.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: FileImage,
    iconName: 'pdf-to-jpg',
    theme: 'orange',
    route: '/tools/pdf-to-jpg',
  },
  {
    id: 'pdf-img',
    title: 'PDF to Images',
    category: 'pdf',
    description: 'Export PDF pages as crisp, high-resolution PNG or JPG image files.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: FileImage,
    iconName: 'pdf-to-images',
    theme: 'amber',
    route: '/tools/pdf-to-images',
  },
  {
    id: 'img-pdf',
    title: 'Images to PDF',
    category: 'pdf',
    description: 'Combine PNG, JPG, and WebP graphics into a single multi-page PDF document.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: Layers,
    iconName: 'images-to-pdf',
    theme: 'emerald',
    route: '/tools/images-to-pdf',
  },
  {
    id: 'merge-pdf',
    title: 'Merge PDF',
    category: 'pages',
    description: 'Combine multiple PDF documents into a single organized file in seconds.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: Layers,
    iconName: 'merge-pdf',
    theme: 'violet',
    route: '/tools/merge-pdf',
  },
  {
    id: 'split-pdf',
    title: 'Split PDF',
    category: 'pages',
    description: 'Preview every page and choose exact split points to create separate PDF files.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: Scissors,
    iconName: 'split-pdf',
    theme: 'sky',
    route: '/tools/split-pdf',
  },
  {
    id: 'remove-pdf-pages',
    title: 'Remove PDF Pages',
    category: 'pages',
    categories: ['pages', 'pdf'],
    description: 'Select and delete unwanted pages from your PDF file and download a clean copy.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: Trash2,
    iconName: 'remove-pages',
    theme: 'rose',
    route: '/tools/remove-pdf-pages',
  },
  {
    id: 'compress-pdf',
    title: 'Compress PDF',
    category: 'pdf',
    description: 'Reduce PDF file sizes while retaining clear typography and image sharpness.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: Minimize2,
    iconName: 'compress-pdf',
    theme: 'teal',
    route: '/tools/compress-pdf',
  },
  {
    id: 'compress-image',
    title: 'Compress Image',
    category: 'image',
    description: 'Compress JPG, PNG and WebP images with a live preview or custom KB and MB target.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: ImageDown,
    iconName: 'compress-image',
    theme: 'amber',
    route: '/tools/compress-image',
  },
  {
    id: 'ocr-extract',
    title: 'Extract OCR Text',
    category: 'ocr',
    categories: ['ocr', 'pdf', 'image'],
    description: 'Scan Hindi and English documents with client-side OCR to copy clean text.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: ScanText,
    iconName: 'ocr-extract',
    theme: 'indigo',
    route: '/tools/extract-ocr',
  },
  {
    id: 'protect-pdf',
    title: 'Protect PDF',
    category: 'pdf',
    categories: ['pdf', 'security'],
    description: 'Encrypt sensitive documents with bank-grade AES-256 or RC4 password protection.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: Lock,
    iconName: 'protect-pdf',
    theme: 'rose',
    route: '/tools/protect-pdf',
  },
  {
    id: 'unlock-pdf',
    title: 'Unlock PDF',
    category: 'pdf',
    categories: ['pdf', 'security'],
    description: 'Remove password restrictions and decrypt secured PDF documents.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: Unlock,
    iconName: 'unlock-pdf',
    theme: 'emerald',
    route: '/tools/unlock-pdf',
  },
  {
    id: 'rotate-pdf',
    title: 'Rotate PDF',
    category: 'pages',
    categories: ['pages', 'pdf'],
    description: 'Adjust document orientation and rotate upside-down or sideways pages permanently.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: RotateCw,
    iconName: 'rotate-pdf',
    theme: 'orange',
    route: '/tools/rotate-pdf',
  },
  {
    id: 'flatten-pdf',
    title: 'Flatten PDF',
    category: 'pages',
    categories: ['pages', 'pdf'],
    description: 'Lock fillable form fields and digital annotations into permanent page content.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: FileCheck,
    iconName: 'flatten-pdf',
    theme: 'slate',
    route: '/tools/flatten-pdf',
  },
  {
    id: 'image-collage',
    title: 'Make Image Collage',
    category: 'image',
    categories: ['image'],
    description: 'Combine multiple photos into creative collages with side-by-side, stacked, and grid positioning.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: LayoutGrid,
    iconName: 'image-collage',
    theme: 'indigo',
    route: '/tools/image-collage',
  },
  {
    id: 'translate-pdf',
    title: 'Translate PDF',
    category: 'pdf',
    categories: ['pdf', 'ocr'],
    description: 'Translate PDF documents into English, Hindi, Spanish, French, and Gujarati with in-browser privacy.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: Languages,
    iconName: 'translate-pdf',
    theme: 'indigo',
    route: '/tools/translate-pdf',
  },
  {
    id: 'watermark-pdf',
    title: 'Watermark PDF',
    category: 'pdf',
    categories: ['pdf', 'security'],
    description: 'Add custom text stamps, confidentiality marks, or repeating watermark grids to PDF pages.',
    status: 'active',
    statusLabel: 'Active Now',
    icon: Stamp,
    iconName: 'watermark-pdf',
    theme: 'sky',
    route: '/tools/watermark-pdf',
  },
];

const filteredTools = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return allTools.filter(tool => {
    const matchesCategory = selectedCategory.value === 'all' || tool.category === selectedCategory.value || (Array.isArray(tool.categories) && tool.categories.includes(selectedCategory.value));
    const matchesQuery = !query || tool.title.toLowerCase().includes(query) || tool.description.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });
});

watch(() => route.query.search, value => {
  searchQuery.value = typeof value === 'string' ? value : '';
  selectedCategory.value = 'all';
});

function showToast(message) {
  toastMessage.value = message;
  toastVisible.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastVisible.value = false;
  }, 4000);
}

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <!-- Converter workspace -->
      <section class="tools-layout container">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> YOUR DOCUMENT WORKSPACE</span>
          <h1>Choose your<br /><span>document tool.</span></h1>
          <p>Convert Word and PDF files without sending them to a server. Choose a converter, add your document, and download the result.</p>
          <ul class="tools-points">
            <li><span><Check :size="14" /></span><div><b>Word to PDF</b><small>Turn DOCX files into share-ready PDFs.</small></div></li>
            <li><span><Check :size="14" /></span><div><b>PDF to editable Word</b><small>Extract real text, including Hindi and English scans.</small></div></li>
            <li><span><Check :size="14" /></span><div><b>PDF pages to images</b><small>Select pages and download clear PNG or JPG files.</small></div></li>
            <li><span><Check :size="14" /></span><div><b>Images to PDF</b><small>Preview, arrange, and combine images into one PDF.</small></div></li>
            <li><span><Check :size="14" /></span><div><b>Merge PDF files</b><small>Preview and combine complete PDFs in the order you choose.</small></div></li>
            <li><span><Check :size="14" /></span><div><b>Split PDF by pages</b><small>Preview pages and create exact PDF ranges with multiple split points.</small></div></li>
            <li><span><Check :size="14" /></span><div><b>Compress PDF files</b><small>Choose exact quality or stronger visual compression with clear trade-offs.</small></div></li>
            <li><span><Check :size="14" /></span><div><b>Compress images</b><small>Preview JPG, PNG or WebP files and control quality or target size.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>Private in your browser</b><small>Your files stay on your device during conversion.</small></div></li>
          </ul>
          <div class="tools-tip"><FileText :size="18" /><p><b>Best results</b><br />Use clear, standard documents and check the downloaded file before sharing.</p></div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Ready when you are</div>
          <DocumentConverter v-model="selectedTool" />
          <div class="under-card"><ShieldCheck :size="15" /> Converted locally. No document uploads.</div>
        </div>
      </section>

      <!-- Multi-Tool Hub / Catalog Section -->
      <section id="catalog" class="tools-catalog container">
        <div class="tools-catalog-header">
          <span class="mini-label"><Sparkles :size="13" /> DOCUMENT TOOL SUITE</span>
          <h2>Explore Document Utilities</h2>
          <p>A growing collection of fast, browser-powered tools designed for total privacy. Launch active converters or preview upcoming utilities.</p>
        </div>

        <!-- Filter & Search Controls -->
        <div class="tools-controls">
          <div class="tools-category-tabs" role="tablist" aria-label="Filter utilities by category">
            <button 
              v-for="cat in categories" 
              :key="cat.id" 
              class="cat-tab" 
              :class="{ active: selectedCategory === cat.id }"
              role="tab"
              :aria-selected="selectedCategory === cat.id"
              @click="selectedCategory = cat.id"
            >
              {{ cat.label }}
            </button>
          </div>

          <div class="tools-search-wrap">
            <label for="tool-search">Search tools <span aria-live="polite">{{ filteredTools.length }} {{ filteredTools.length === 1 ? 'result' : 'results' }}</span></label>
            <div class="tools-search-box">
              <Search :size="17" class="search-icon" />
              <input
                id="tool-search"
                v-model="searchQuery"
                type="search"
                placeholder="Search Word, PDF, image or OCR tools"
                autocomplete="off"
              />
              <button
                v-if="searchQuery"
                class="search-clear"
                aria-label="Clear tool search"
                @click="searchQuery = ''"
              >
                <X :size="14" />
              </button>
            </div>
          </div>
        </div>

        <!-- Tools Grid -->
        <div id="tool-results" class="tools-grid">
          <NuxtLink
            v-for="tool in filteredTools.filter(item => item.route)"
            :key="tool.id"
            :to="tool.route"
            class="tool-card"
            :class="[`theme-${tool.theme}`, { 'is-active': selectedTool === tool.id }]"
            :aria-label="`Open ${tool.title}`"
          >
            <div class="tool-card-top">
              <span class="tool-card-icon">
                <ToolRealisticIcon v-if="tool.iconName" :name="tool.iconName" :alt="tool.title" size="38" />
                <component :is="tool.icon" v-else :size="22" />
              </span>
              <span class="tool-status-badge active">
                <span class="status-pulse" />
                {{ tool.statusLabel }}
              </span>
            </div>

            <h3>{{ tool.title }}</h3>
            <p>{{ tool.description }}</p>

            <div class="tool-card-footer">
              <span class="tool-card-btn btn-active">Launch Tool <ArrowUpRight :size="14" /></span>
            </div>
          </NuxtLink>

          <button
            v-for="tool in filteredTools.filter(item => !item.route)"
            :key="tool.id" 
            type="button"
            class="tool-card" 
            :class="`theme-${tool.theme}`"
            :aria-label="`Preview ${tool.title} roadmap`"
            @click="showToast(`${tool.title} is scheduled for browser-only implementation in an upcoming release.`)"
          >
            <div class="tool-card-top">
              <span class="tool-card-icon">
                <ToolRealisticIcon v-if="tool.iconName" :name="tool.iconName" :alt="tool.title" size="38" />
                <component :is="tool.icon" v-else :size="22" />
              </span>
              <span class="tool-status-badge roadmap">
                {{ tool.statusLabel }}
              </span>
            </div>

            <h3>{{ tool.title }}</h3>
            <p>{{ tool.description }}</p>

            <div class="tool-card-footer">
              <span class="tool-card-btn">Preview Roadmap</span>
            </div>
          </button>
        </div>

        <div v-if="filteredTools.length === 0" class="tools-empty">
          <p>No tools matched your search. Try searching for "Word" or "PDF".</p>
          <button class="text-button" @click="searchQuery = ''; selectedCategory = 'all'">Reset filters</button>
        </div>

        <!-- Trust Highlights Banner -->
        <div class="tools-trust-banner">
          <div class="trust-item">
            <span class="trust-icon"><Zap :size="22" /></span>
            <div>
              <strong>Fast local processing</strong>
              <p>Conversion runs in your browser after the required app resources have loaded.</p>
            </div>
          </div>
          <div class="trust-item">
            <span class="trust-icon"><Shield :size="22" /></span>
            <div>
              <strong>Zero Document Uploads</strong>
              <p>Your confidential proposals, contracts, and scans remain 100% private in browser memory.</p>
            </div>
          </div>
          <div class="trust-item">
            <span class="trust-icon"><Sparkles :size="22" /></span>
            <div>
              <strong>Free &amp; Registration-Free</strong>
              <p>No credit cards, subscriptions, or account logins needed. Simply convert and download.</p>
            </div>
          </div>
        </div>

        <!-- In-Depth Catalog SEO Editorial Guide -->
        <div class="seo-guide-section" style="padding-top: 56px;">
          <div class="section-intro">
            <span class="mini-label">TOOL SUITE GUIDE</span>
            <h2>Why Millions Choose Toolifybox for Daily Document Tasks</h2>
            <p>From complex Indic script OCR to strict government PDF compression limits, Toolifybox gives you professional utility tools directly in your browser without sacrificing privacy or quality.</p>
          </div>

          <div class="seo-features-grid">
            <article class="seo-feature-card">
              <span class="seo-feature-icon"><FileText :size="24" /></span>
              <h3>Universal Document Converters</h3>
              <p>Seamlessly convert between Microsoft Office formats (Word, Excel, PowerPoint) and standard PDFs. Our converters preserve typography, column flows, complex tables, and bullet hierarchies.</p>
              <ul>
                <li>Convert DOCX to high-resolution print-ready PDF</li>
                <li>Convert PPTX slides into share-ready slide decks</li>
                <li>Convert XLSX spreadsheets and CSV records cleanly</li>
              </ul>
            </article>

            <article class="seo-feature-card">
              <span class="seo-feature-icon"><ScanText :size="24" /></span>
              <h3>Multilingual Indic &amp; Global OCR</h3>
              <p>Recover editable text from scanned documents, question papers, and old books in 17+ languages including Hindi, Gujarati, Marathi, Bengali, Tamil, Telugu, and English with Nirmala UI font mapping.</p>
              <ul>
                <li>Prevents split conjuncts and broken matras</li>
                <li>Auto-detects document language on upload</li>
                <li>Extracts clean text directly to clipboard or Word</li>
              </ul>
            </article>

            <article class="seo-feature-card">
              <span class="seo-feature-icon"><Minimize2 :size="24" /></span>
              <h3>Smart PDF &amp; Image Compression</h3>
              <p>Meet stringent file upload constraints on government, visa, and exam portals. Enter exact target limits like 100 KB or 200 KB, or use visual downsampling to shrink multi-megabyte files effortlessly.</p>
              <ul>
                <li>Custom KB and MB target size selector</li>
                <li>Retains text sharpness and interactive links</li>
                <li>Live before-and-after size comparison</li>
              </ul>
            </article>
          </div>

          <!-- FAQ Accordion -->
          <div id="faq" class="faq-section" style="padding-block: 48px 24px;">
            <div class="faq-intro">
              <span class="mini-label">FAQ &amp; SUPPORT</span>
              <h2>Frequently Asked Questions</h2>
              <p>Answers to common questions regarding tools, security, file limits, and format compatibility.</p>
              <div class="faq-decoration" aria-hidden="true"><Layers :size="42" /><span>20+ TOOLS</span></div>
            </div>
            <div class="faq-list">
              <details v-for="[question, answer] in toolsFaqs" :key="question">
                <summary>{{ question }}<ChevronDown :size="18" /></summary>
                <div class="faq-answer"><p>{{ answer }}</p></div>
              </details>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Roadmap Notification Toast -->
    <transition name="toast-fade">
      <div v-if="toastVisible" class="toast-notification" role="status">
        <Sparkles :size="16" />
        <span>{{ toastMessage }}</span>
        <button class="toast-close" aria-label="Dismiss message" @click="toastVisible = false"><X :size="14" /></button>
      </div>
    </transition>

    <SiteFooter message="Private file conversion, right in your browser." />
  </div>
</template>
