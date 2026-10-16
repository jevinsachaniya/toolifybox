<script setup>
import { Check, Combine, Files, LockKeyhole, ShieldCheck, Sparkles } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageDescription = 'Merge multiple PDF files online with full page previews and file reordering. Preserve original quality and selectable text with private in-browser processing.';
usePageSeo({
  title: 'Merge PDF Files Online with Preview | Toolifybox',
  description: pageDescription,
  path: '/tools/merge-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' }, { name: 'Tools', path: '/tools' }, { name: 'Merge PDF', path: '/tools/merge-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(siteUrl, '/tools/merge-pdf', 'Merge PDF Online', pageDescription, ['Full PDF page previews', 'PDF file reordering', 'Original-quality merged PDF']),
  ],
});

const steps = [
  { number: '01', title: 'Add Your PDFs', desc: 'Choose two or more PDF files and preview every page before anything is merged.' },
  { number: '02', title: 'Set the File Order', desc: 'Move complete PDFs up or down. Their pages follow the exact order shown in the preview.' },
  { number: '03', title: 'Merge and Download', desc: 'Create one original-quality PDF locally, then download it directly to your device.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />
    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container merge-pdf-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> COMBINE PDFS IN ORDER</span>
          <h1>Merge PDFs with<br /><span>every page in view.</span></h1>
          <p>Preview both PDFs, arrange complete files in the right order, and combine every page without reducing its original quality.</p>
          <ul class="tools-points">
            <li><span><Files :size="14" /></span><div><b>Preview Every Page</b><small>Check all documents and pages before creating the final file.</small></div></li>
            <li><span><Combine :size="14" /></span><div><b>Original PDF Quality</b><small>Selectable text, links, vectors and page dimensions are preserved.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>Private Processing</b><small>Your PDFs stay in browser memory on your device.</small></div></li>
          </ul>
          <div class="tools-tip"><Check :size="18" /><p><b>Check the order first</b><br />The first PDF appears first in the final document. Use the arrow controls to change the order.</p></div>
        </div>
        <div class="tools-converter-wrap"><div class="converter-backdrop" aria-hidden="true" /><div class="floating-chip" aria-hidden="true"><span /> Merge PDF Ready</div><MergePdfConverter /><div class="under-card"><ShieldCheck :size="15" /> Merged locally on your device. No PDF uploads.</div></div>
      </section>

      <section class="how-section container"><div class="section-intro"><span class="mini-label">HOW IT WORKS</span><h2>Two or more PDFs, one clear document</h2><p>Review the pages and control their order before download.</p></div><div class="how-grid"><article v-for="step in steps" :key="step.number" class="how-card"><div class="how-card-top"><span><Combine :size="22" /></span><b>{{ step.number }}</b></div><h3>{{ step.title }}</h3><p>{{ step.desc }}</p><span class="card-line" aria-hidden="true" /></article></div></section>
    </main>
    <SiteFooter message="Private PDF merging, right in your browser." />
  </div>
</template>
