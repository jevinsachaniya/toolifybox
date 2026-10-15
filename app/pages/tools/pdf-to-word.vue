<script setup>
import { ArrowLeft, ArrowRight, Check, FileText, LockKeyhole, ScanText, ShieldCheck, Sparkles } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageDescription = 'Convert PDF files to editable Word DOCX online for free. Recover selectable text and use private in-browser OCR for scanned English and Hindi documents.';
usePageSeo({
  title: 'PDF to Word Converter with OCR — Free | Toolifybox',
  description: pageDescription,
  path: '/tools/pdf-to-word',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' }, { name: 'Tools', path: '/tools' }, { name: 'PDF to Word', path: '/tools/pdf-to-word' },
    ]),
    ({ siteUrl }) => toolSchema(siteUrl, '/tools/pdf-to-word', 'PDF to Word Converter with OCR', pageDescription, ['Editable DOCX output', 'English and Hindi OCR', 'Local browser processing']),
  ],
});

const steps = [
  { number: '01', title: 'Upload PDF', desc: 'Select a PDF document up to 20 MB and 100 pages from your computer or phone.' },
  { number: '02', title: 'Reconstruct Text & OCR', desc: 'PDF glyphs and scanned images are processed locally with Tesseract.js in browser memory.' },
  { number: '03', title: 'Download Word Document', desc: 'Get an editable .docx file with fonts, colors, and positions cleanly mapped.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <header class="site-header tools-header">
      <div class="container header-inner">
        <BrandLogo />
        <nav aria-label="Main navigation">
          <NuxtLink to="/">Home</NuxtLink>
          <NuxtLink to="/tools">All Utilities</NuxtLink>
          <NuxtLink to="/tools/pdf-to-word" aria-current="page">PDF to Word</NuxtLink>
        </nav>
        <ThemeToggle />
        <NuxtLink class="header-action" to="/tools"><ArrowLeft :size="16" /> Back to Utilities</NuxtLink>
      </div>
    </header>

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <section class="tools-layout container">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> DEDICATED CONVERTER</span>
          <h1>Convert PDF to<br /><span>editable Word.</span></h1>
          <p>Extract text, formatting, and colors from your PDF files into editable Microsoft Word documents. Includes in-browser OCR for scanned English and Hindi documents.</p>
          
          <ul class="tools-points">
            <li><span><Check :size="14" /></span><div><b>Editable Word Text</b><small>Reconstructs selectable text, styles, and colors in .docx.</small></div></li>
            <li><span><Check :size="14" /></span><div><b>In-Browser OCR</b><small>Recognizes English &amp; Hindi text on scanned pages locally.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>100% Local Privacy</b><small>Your PDF is processed on your machine, never on a server.</small></div></li>
          </ul>

          <div class="tools-tip">
            <FileText :size="18" />
            <p><b>Need the opposite?</b><br /><NuxtLink to="/tools/word-to-pdf" style="color: #a5b4fc; text-decoration: underline;">Switch to Word to PDF converter &rarr;</NuxtLink></p>
          </div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> PDF to Word Ready</div>
          <DocumentConverter fixed-direction="pdf-word" />
          <div class="under-card"><ShieldCheck :size="15" /> Converted locally on your device. No document uploads.</div>
        </div>
      </section>

      <!-- How to Convert Guide -->
      <section class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>How to convert PDF to Word online</h2>
          <p>Turn read-only PDF files into editable Microsoft Word documents in three steps.</p>
        </div>

        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><ScanText :size="22" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Switch Tool Banner -->
      <section class="closing-cta container">
        <div>
          <span class="mini-label">LOOKING FOR ANOTHER TOOL?</span>
          <h2>Need to turn Word into PDF?</h2>
          <p>Try our dedicated Word to PDF tool for instant, high-quality document conversion.</p>
        </div>
        <NuxtLink to="/tools/word-to-pdf" class="primary-button">
          Open Word to PDF <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private document conversion, right in your browser." />
  </div>
</template>

