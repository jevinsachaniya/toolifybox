<script setup>
import { ArrowRight, Check, ChevronDown, FileCheck, FileText, Hash, Layers, LockKeyhole, Palette, ShieldCheck, Sparkles, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/add-page-numbers', '/tools/page-numbers', '/page-numbers'],
});

const pageTitle = 'Add Page Numbers to PDF Online Free — Fast & Private | Toolifybox';
const pageDescription = 'Add page numbers to your PDF documents online for free. Customize position, numbering format, starting page, margins, fonts, and colors directly in your browser with zero file uploads.';

const steps = [
  { number: '01', title: 'Choose Your PDF Document', desc: 'Select or drag-and-drop any PDF file up to 50 MB into the browser window.' },
  { number: '02', title: 'Configure Number Position & Style', desc: 'Select header or footer placement, number formats (e.g. Page 1 of 10, 1 / 10), starting number, and font styling with live simulation.' },
  { number: '03', title: 'Download Numbered PDF', desc: 'Click Add Page Numbers & Download to stamp clean vector numbers onto your pages instantly with 100% on-device privacy.' },
];

const faqs = [
  ['Can I skip adding page numbers to the cover page?', 'Yes! You can choose "Skip Cover Page" so numbering begins cleanly on page 2, or specify a custom page range like "2-10" to number only specific sections.'],
  ['Can I customize where the page numbers appear?', 'Absolutely. You can place page numbers at the bottom (Center, Right, Left) or top header (Center, Right, Left) with custom edge margin padding.'],
  ['Which numbering formats are supported?', 'Toolifybox supports standard formats including "Page 1 of 10", "1", "1 / 10", "— 1 —", "[ 1 ]", as well as optional custom prefix text like "Ref" or "Doc".'],
  ['Does adding page numbers modify or compress my original PDF content?', 'No. Toolifybox stamps razor-sharp vector numbers onto your existing pages without recompressing images, modifying underlying text, or altering page layout.'],
  ['Are my confidential PDF documents uploaded to your server?', 'Never. All PDF processing and vector numbering happen 100% locally on your computer or phone using WebAssembly and client-side JavaScript. Your files never leave your device.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/add-page-numbers',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Add Page Numbers', path: '/tools/add-page-numbers' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/add-page-numbers',
      'Add Page Numbers to PDF',
      pageDescription,
      ['Add header and footer page numbers to PDF documents', 'Custom numbering formats: Page 1 of 10, 1/10, dash, brackets', 'Configurable position: Bottom Center, Right, Left, Top', 'Skip cover page or select custom page range', 'Font family, size, margin, and color customization', 'Live interactive visual placement simulation', '100% client-side privacy with zero server uploads']
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Add Page Numbers to PDF Online for Free', pageDescription, steps, siteUrl, '/tools/add-page-numbers'),
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
          <span class="eyebrow"><Sparkles :size="13" /> PDF PAGINATION TOOL</span>
          <h1>Add Page Numbers<br /><span>to PDF documents.</span></h1>
          <p>Insert clean, customizable page numbers into your PDF files in seconds. Choose header or footer placement, number formats, starting page, custom fonts, and colors directly in your browser with complete privacy.</p>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Page Numbering Ready</div>
          <AddPageNumbersConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero document uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><Check :size="14" /></span>
              <div>
                <b>Flexible Number Placement</b>
                <small>Place numbers at bottom-center, bottom-right, bottom-left, or top headers with adjustable margin distances.</small>
              </div>
            </li>
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <b>Multiple Numbering Formats</b>
                <small>Choose "Page 1 of 10", simple "1", "1 / 10", dashes "— 1 —", or brackets with optional custom prefix text.</small>
              </div>
            </li>
            <li>
              <span><Palette :size="14" /></span>
              <div>
                <b>Typography &amp; Style Controls</b>
                <small>Customize font family (Helvetica, Times, Courier), font size, and color palette to match your document.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>100% Client-Side Privacy</b>
                <small>Page numbers are stamped in your browser using WebAssembly. Your files are never sent across the internet.</small>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <FileText :size="18" />
            <p><b>Pro Tip:</b> If your document contains a cover or title page, select "Skip Cover Page" so page numbering begins seamlessly on page 2.</p>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Three Steps to Number Any PDF Document</h2>
          <p>Organize academic papers, business reports, and legal filings with professional pagination.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><Hash :size="20" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Editorial Guide & Comparison -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">COMPLETE GUIDE</span>
          <h2>Why Number Your PDF Documents with Toolifybox?</h2>
          <p>Clean pagination is essential for legal briefs, university dissertations, contracts, and business reports. Toolifybox delivers desktop-grade PDF pagination directly in your browser without subscriptions or data tracking.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Hash :size="24" /></span>
            <h3>Precise Page Number Placement</h3>
            <p>Place page numbers exactly where your guidelines require: bottom-center for standard books, bottom-right for reports, or top headers for academic papers.</p>
            <ul>
              <li>6 distinct placement anchor positions</li>
              <li>Custom edge margin offsets (20pt to 72pt)</li>
              <li>Real-time visual position preview</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><FileCheck :size="24" /></span>
            <h3>Selective Range &amp; Cover Page Skipping</h3>
            <p>Avoid numbering cover pages, copyright notices, or table of contents pages. Easily start counting at page 2 while keeping the numbering offset aligned.</p>
            <ul>
              <li>One-click "Skip Cover Page" preset</li>
              <li>Custom page range selector (e.g. 2-25)</li>
              <li>Custom starting number offset</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ShieldCheck :size="24" /></span>
            <h3>100% Confidential &amp; Zero File Uploads</h3>
            <p>Unlike cloud PDF editors that store uploaded documents on external servers, Toolifybox processes everything inside your local browser memory.</p>
            <ul>
              <li>Zero server transfers or database storage</li>
              <li>Instant rendering with no download wait</li>
              <li>Works on Windows, macOS, Android &amp; iOS</li>
            </ul>
          </article>
        </div>

        <!-- FAQ Section -->
        <div id="faq" class="faq-section" style="padding-block: 48px 24px;">
          <div class="faq-intro">
            <span class="mini-label">FAQ &amp; SUPPORT</span>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about numbering PDF documents online.</p>
          </div>
          <div class="faq-list">
            <details v-for="[question, answer] in faqs" :key="question">
              <summary>{{ question }}<ChevronDown :size="18" /></summary>
              <div class="faq-answer"><p>{{ answer }}</p></div>
            </details>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter message="Private PDF page numbering in your browser." />
  </div>
</template>

