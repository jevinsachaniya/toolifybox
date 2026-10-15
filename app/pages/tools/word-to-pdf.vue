<script setup>
import { ArrowRight, Check, FileText, LockKeyhole, ShieldCheck, Sparkles } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageDescription = 'Convert Word DOCX files to clean PDF documents online for free. Your file is processed privately in your browser with no sign-up, upload or watermark.';
usePageSeo({
  title: 'Word to PDF Converter — Free & Private | Toolifybox',
  description: pageDescription,
  path: '/tools/word-to-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' }, { name: 'Tools', path: '/tools' }, { name: 'Word to PDF', path: '/tools/word-to-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(siteUrl, '/tools/word-to-pdf', 'Word to PDF Converter', pageDescription, ['DOCX to PDF conversion', 'Local browser processing', 'Multi-page PDF output']),
  ],
});

const steps = [
  { number: '01', title: 'Upload DOCX', desc: 'Choose a .docx Word document up to 20 MB from your device or drop it into the box.' },
  { number: '02', title: 'Convert Locally', desc: 'Toolifybox renders and compiles the pages entirely in your browser memory.' },
  { number: '03', title: 'Download PDF', desc: 'Save your completed PDF instantly, then check its layout before sharing.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <section class="tools-layout container">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> DEDICATED CONVERTER</span>
          <h1>Convert Word<br /><span>to PDF simply.</span></h1>
          <p>Transform your Microsoft Word (.docx) files into clean, share-ready PDF documents directly in your browser. Zero file uploads, complete confidentiality.</p>
          
          <ul class="tools-points">
            <li><span><Check :size="14" /></span><div><b>Standard PDF Output</b><small>Generates high-resolution multi-page PDF documents.</small></div></li>
            <li><span><Check :size="14" /></span><div><b>Client-Side Processing</b><small>Runs 100% on your device with no server uploads.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>Secure &amp; Free</b><small>No account, no watermarks, and no subscription fees.</small></div></li>
          </ul>

          <div class="tools-tip">
            <FileText :size="18" />
            <p><b>Need the opposite?</b><br /><NuxtLink to="/tools/pdf-to-word" style="color: #a5b4fc; text-decoration: underline;">Switch to PDF to Word converter &rarr;</NuxtLink></p>
          </div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Word to PDF Ready</div>
          <DocumentConverter fixed-direction="word-pdf" />
          <div class="under-card"><ShieldCheck :size="15" /> Converted locally on your device. No document uploads.</div>
        </div>
      </section>

      <!-- How to Convert Guide -->
      <section class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>How to convert Word to PDF online</h2>
          <p>Follow three simple steps to convert your document in seconds.</p>
        </div>

        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><FileText :size="22" /></span>
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
          <h2>Need to edit a PDF document?</h2>
          <p>Try our dedicated PDF to Word converter with built-in OCR for scanned pages.</p>
        </div>
        <NuxtLink to="/tools/pdf-to-word" class="primary-button">
          Open PDF to Word <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private document conversion, right in your browser." />
  </div>
</template>

