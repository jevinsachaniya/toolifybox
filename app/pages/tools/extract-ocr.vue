<script setup>
import { Check, Copy, Download, FileCheck, Languages, ScanText, ShieldCheck, Sparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/extract-ocr', '/ocr-extract', '/tools/ocr-extract'],
});

const pageDescription = 'Extract OCR text from scanned PDFs and images online for free. Convert scans, receipts, and photos to editable text in English and Hindi with 100% private in-browser recognition.';
usePageSeo({
  title: 'Extract OCR Text Online — Free & Private PDF/Image OCR | Toolifybox',
  description: pageDescription,
  path: '/tools/extract-ocr',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Extract OCR Text', path: '/tools/extract-ocr' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/extract-ocr',
      'Extract OCR Text',
      pageDescription,
      ['High-accuracy local OCR engine', 'English and Hindi bilingual recognition support', 'Extracts from PDF, JPG, PNG, and WebP', 'Instant one-click copy to clipboard', 'Export to TXT or formatted Word (.docx)', '100% client-side privacy without cloud uploads']
    ),
  ],
});

const steps = [
  { number: '01', title: 'Choose Document', desc: 'Select any scanned PDF or image file (JPG, PNG, WebP) from your device.' },
  { number: '02', title: 'Select Language', desc: 'Pick English, Hindi, or mixed bilingual recognition for optimal accuracy.' },
  { number: '03', title: 'Copy or Download', desc: 'Read, edit, copy the text to your clipboard, or download it as plain .TXT or Word .DOCX.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container extract-ocr-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> OPTICAL CHARACTER RECOGNITION</span>
          <h1>Extract OCR<br /><span>text easily.</span></h1>
          <p>Recover clean, selectable text from scanned receipts, contracts, textbook pages, paper documents, and screenshot images. Copy text directly to your clipboard or download clean TXT and Word documents in seconds.</p>
          <ul class="tools-points">
            <li>
              <span><Check :size="14" /></span>
              <div>
                <b>PDF &amp; Image Support</b>
                <small>Works seamlessly on scanned multi-page PDF documents as well as JPG, PNG, and WebP photo files.</small>
              </div>
            </li>
            <li>
              <span><Languages :size="14" /></span>
              <div>
                <b>English &amp; Hindi Bilingual OCR</b>
                <small>Trained optical neural networks accurately recognize English and Devanagari Hindi text.</small>
              </div>
            </li>
            <li>
              <span><Copy :size="14" /></span>
              <div>
                <b>One-Click Copy &amp; Export</b>
                <small>Review, edit, and copy recognized text instantly, or export as plain text or formatted Word document.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>100% Client-Side Privacy</b>
                <small>OCR models run directly on your hardware inside WebAssembly. No scans are uploaded to remote servers.</small>
              </div>
            </li>
          </ul>
          <div class="tools-tip">
            <FileCheck :size="18" />
            <p>
              <b>Accuracy Tip</b><br />
              Ensure scanned receipts and photos are well-lit and oriented upright before running optical recognition for the cleanest accuracy.
            </p>
          </div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Extract OCR Ready</div>
          <ExtractOcrConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero server uploads.</div>
        </div>
      </section>

      <section class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Extract text from your document in three steps</h2>
          <p>Fast, private, and effortless text recovery on your device.</p>
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
    </main>
    <SiteFooter message="Free, private browser tools for everyday file work." />
  </div>
</template>

