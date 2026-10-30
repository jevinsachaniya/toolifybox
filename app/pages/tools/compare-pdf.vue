<script setup>
import { ArrowRight, Check, ChevronDown, Columns2, FileCheck, FileDiff, FileText, GitCompareArrows, Layers, LockKeyhole, ShieldCheck, Sparkles, Split, Wand2, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/compare-pdf', '/tools/pdf-compare', '/pdf-diff'],
});

const pageTitle = 'Compare PDF Documents Online Free — Visual & Text Diff | We Make PDF';
const pageDescription = 'Compare two PDF documents online for free. Detect visual layout changes, text edits, added or removed content, and compare pages with an interactive split slider with 100% client-side privacy.';

const steps = [
  { number: '01', title: 'Upload Both PDF Documents', desc: 'Select or drag-and-drop the Original PDF (File A) and the Revised PDF (File B) into the dual upload zone.' },
  { number: '02', title: 'Review Differences Visually', desc: 'Switch between Color Overlay Diff, Interactive Wipe Slider, and Side-by-Side views to pinpoint edits and revisions instantly.' },
  { number: '03', title: 'Download Comparison Report', desc: 'Export a comprehensive visual diff PDF report with highlighted modifications directly to your computer.' },
];

const faqs = [
  ['How does the visual PDF comparison detect changes?', 'We Make PDF renders both PDF pages at high resolution and computes a pixel-by-pixel difference analysis. Content removed from Document A is highlighted in crimson red, while newly added content in Document B is highlighted in emerald green.'],
  ['Can I compare two PDFs with different page counts?', 'Yes! If Document B has extra pages or fewer pages, We Make PDF compares matching page numbers and flags added or deleted pages so you never miss a change.'],
  ['What is the Wipe Slider comparison view?', 'The Wipe Slider provides an interactive split-screen divider that you can drag left and right across the document to see a seamless "before and after" transition of any page.'],
  ['Are my confidential contracts or financial PDFs uploaded to a server?', 'Never. All rendering, image alignment, and diff computations run 100% locally on your computer or smartphone using WebAssembly. Your files remain completely private in browser memory.'],
  ['Can I export a PDF report showing the detected differences?', 'Yes! You can click "Download Comparison PDF Report" to download a multi-page PDF document containing color-highlighted diffs for each page.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/compare-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Compare PDF', path: '/tools/compare-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/compare-pdf',
      'Compare PDF Documents Online',
      pageDescription,
      [
        'Side-by-side and overlay visual PDF comparison',
        'Interactive split wipe slider for before/after inspection',
        'Crimson red highlights for deleted content',
        'Emerald green highlights for newly added content',
        'Multi-page synchronization and navigation',
        'Export visual comparison PDF report',
        '100% client-side privacy with zero document uploads',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Compare Two PDF Documents Online for Free', pageDescription, steps, siteUrl, '/tools/compare-pdf'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <section class="tools-layout container">
        <div class="tools-hero">
          <span class="eyebrow"><Sparkles :size="13" /> DOCUMENT DIFF &amp; AUDIT TOOL</span>
          <h1>Compare PDF documents<br /><span>spot every difference.</span></h1>
          <p>Compare two versions of a contract, agreement, or report in seconds. Pinpoint text edits, design revisions, and deleted content with visual color diffs, wipe sliders, and side-by-side analysis with 100% privacy.</p>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Compare PDF Ready</div>
          <ComparePdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero document uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><Layers :size="14" /></span>
              <div>
                <b>Visual Color Diff Overlay</b>
                <small>Added content appears in green, removed content in red, and unchanged text in muted gray.</small>
              </div>
            </li>
            <li>
              <span><Split :size="14" /></span>
              <div>
                <b>Interactive Wipe Slider</b>
                <small>Drag a split divider across the page to inspect before and after revisions in real time.</small>
              </div>
            </li>
            <li>
              <span><Columns2 :size="14" /></span>
              <div>
                <b>Side-by-Side Review</b>
                <small>View Document A and Document B synchronized side-by-side with matched page navigation.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>100% In-Browser Privacy</b>
                <small>Diffing is performed in your device memory with WebAssembly. No files are uploaded to any server.</small>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <FileText :size="18" />
            <p><b>Pro Tip:</b> Use the Swap button between Document A and B to quickly reverse the comparison direction.</p>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Three Steps to Compare Any Two PDF Documents</h2>
          <p>Audit contracts, legal briefs, technical specifications, and academic papers with complete accuracy.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><GitCompareArrows :size="20" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Privacy Strip -->
      <section class="privacy-strip container">
        <div class="privacy-strip-content">
          <div class="privacy-badge"><ShieldCheck :size="20" /> 100% Private Client-Side Processing</div>
          <h2>Your documents never leave your browser</h2>
          <p>Unlike cloud comparison tools, We Make PDF executes all rendering and pixel-level comparison directly on your machine. Your confidential contracts, NDAs, and proposals remain strictly on your computer.</p>
        </div>
      </section>

      <!-- Frequently Asked Questions -->
      <section id="questions" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about comparing PDF documents in your browser.</p>
        </div>
        <div class="faq-list">
          <details v-for="[q, a] in faqs" :key="q">
            <summary>
              <span>{{ q }}</span>
              <ChevronDown :size="18" class="faq-chevron" />
            </summary>
            <p>{{ a }}</p>
          </details>
        </div>
      </section>
    </main>

    <SiteFooter message="Free, private PDF comparison tool that runs 100% in your browser." />
  </div>
</template>

