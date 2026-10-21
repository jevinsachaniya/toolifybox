<script setup>
import {
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  Copy,
  Download,
  FileCheck,
  FileText,
  Info,
  Languages,
  ShieldCheck,
  Sparkles,
  Upload,
  Zap,
} from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/translate-pdf', '/pdf-translator', '/tools/pdf-translator'],
});

const pageDescription = 'Translate PDF documents online for free between English, Hindi, Spanish, French, and Gujarati. Extract text, translate accurately, and export to Word, PDF, or text with 100% in-browser privacy.';

usePageSeo({
  title: 'Translate PDF Online — Free PDF Language Translator | Toolifybox',
  description: pageDescription,
  path: '/tools/translate-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Translate PDF', path: '/tools/translate-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/translate-pdf',
      'Translate PDF',
      pageDescription,
      [
        'Translate PDFs between English, Hindi, Spanish, French, and Gujarati',
        'Auto-detect original language with instant language swapping',
        'Page-by-page and full document side-by-side translation preview',
        'Editable translation workspace with real-time word counting',
        'Export translated documents to Word (.docx), PDF (.pdf), and Text (.txt)',
        'One-click copy to clipboard with instant notification',
        '100% private in-browser document processing',
      ]
    ),
  ],
});

const steps = [
  { number: '01', title: 'Upload PDF Document', desc: 'Select any PDF document (contracts, research, notes, manuals) from your computer or phone.', icon: Upload },
  { number: '02', title: 'Choose Languages', desc: 'Select source and target languages among English, Hindi, Spanish, French, and Gujarati.', icon: Languages },
  { number: '03', title: 'Review, Edit & Export', desc: 'Check the translated text, make any corrections directly in the editor, or re-translate, then download your layout-preserved PDF.', icon: Download },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <!-- Top Information & Guidance Banner -->
      <div class="container translate-top-notice-wrap">
        <div class="translate-top-notice" role="status">
          <div class="notice-icon">
            <Info :size="20" />
          </div>
          <div class="notice-body">
            <strong>Review Before Downloading:</strong>
            <p>
              Please verify the translated text before exporting. You can <b>edit or correct any words directly in the editor</b>, and your changes will be saved to your downloaded PDF. If the layout or alignment needs adjustment, simply try translating again.
            </p>
          </div>
        </div>
      </div>

      <section class="tools-layout container translate-pdf-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> DOCUMENT TRANSLATION STUDIO</span>
          <h1>Translate PDF<br /><span>across 5 languages.</span></h1>
          <p>Easily translate contracts, invoices, academic research, certificates, and manuals into <b>English, Hindi, Spanish, French, and Gujarati</b>. Review side-by-side translations in real-time and export to Word, PDF, or text.</p>
          <ul class="tools-points">
            <li>
              <span><Languages :size="14" /></span>
              <div>
                <b>English, Hindi, Spanish, French &amp; Gujarati</b>
                <small>Full bilingual and multilingual support with native script font rendering for Devanagari and Gujarati.</small>
              </div>
            </li>
            <li>
              <span><ArrowLeftRight :size="14" /></span>
              <div>
                <b>Auto-Detection &amp; One-Click Swap</b>
                <small>Automatically detect the source language, or swap translation direction with a single click.</small>
              </div>
            </li>
            <li>
              <span><FileText :size="14" /></span>
              <div>
                <b>Export to Word (.docx), PDF &amp; TXT</b>
                <small>Download translated files formatted with clean headings and page breaks, or copy text to your clipboard.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>100% Private Document Processing</b>
                <small>Your PDF text is parsed directly inside your browser. No files are stored on any remote databases.</small>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <FileCheck :size="18" />
            <p>
              <b>Important Quality Tip:</b><br />
              Always review the translated text before downloading. You can make inline corrections directly in the editor, and click "Re-translate" if you need to refresh the layout alignment before exporting.
            </p>
          </div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> PDF Translator Ready</div>
          <TranslatePdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero server file storage.</div>
        </div>
      </section>

      <section class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Translate your PDF document in three easy steps</h2>
          <p>Fast, accurate, and private language translation in your browser.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><component :is="step.icon" :size="22" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Switch / Explore Tools Banner -->
      <section class="closing-cta container">
        <div>
          <span class="mini-label">ALL-IN-ONE TOOLBOX</span>
          <h2>Explore all 20 document tools</h2>
          <p>Convert, compress, rotate, protect, translate, and organize your files with 100% in-browser privacy.</p>
        </div>
        <NuxtLink to="/tools" class="primary-button">
          Explore all tools <ArrowUpRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private multilingual PDF translation, right in your browser." />
  </div>
</template>

