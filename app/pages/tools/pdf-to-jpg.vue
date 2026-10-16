<script setup>
import { Check, FileImage, LockKeyhole, ShieldCheck, Sparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/pdf-to-jpg'],
});

const pageDescription = 'Convert PDF pages to high-quality JPG images online for free. Preview pages, choose custom JPG quality and resolution, and download single JPGs or all pages in a ZIP—privately in your browser.';
usePageSeo({
  title: 'PDF to JPG Converter — High Quality & Free | Toolifybox',
  description: pageDescription,
  path: '/tools/pdf-to-jpg',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' }, { name: 'Tools', path: '/tools' }, { name: 'PDF to JPG', path: '/tools/pdf-to-jpg' },
    ]),
    ({ siteUrl }) => toolSchema(siteUrl, '/tools/pdf-to-jpg', 'PDF to JPG Converter', pageDescription, ['PDF page previews', 'High-quality JPG export', 'Adjustable JPG quality and DPI', 'Selected-page ZIP download']),
  ],
});
const steps = [
  { number: '01', title: 'Choose a PDF', desc: 'Add one PDF up to 20 MB and 100 pages. Your file remains securely on your device.' },
  { number: '02', title: 'Select Pages & Quality', desc: 'Preview every page, pick the pages you want, and choose High or Standard JPG quality.' },
  { number: '03', title: 'Download JPG Images', desc: 'Download a single JPG page directly or get all selected pages bundled in a neat ZIP file.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container pdf-jpg-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> INSTANT BROWSER CONVERSION</span>
          <h1>Convert PDF<br /><span>pages to JPG images.</span></h1>
          <p>Turn every page of your PDF into a crisp, high-resolution JPG image. Preview pages, adjust quality, and download single JPGs or all pages in a ZIP file.</p>
          <ul class="tools-points">
            <li><span><Check :size="14" /></span><div><b>Select Any Pages</b><small>Convert the entire PDF or select specific pages to export.</small></div></li>
            <li><span><FileImage :size="14" /></span><div><b>High-Quality JPG</b><small>Export with up to 3× / 450 DPI resolution and crisp 98% quality.</small></div></li>
            <li><span><Zap :size="14" /></span><div><b>Instant &amp; Free</b><small>Fast client-side rendering with no watermark or file size delays.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>Private Processing</b><small>Your PDF is rendered locally inside your browser without uploads.</small></div></li>
          </ul>
          <div class="tools-tip"><FileImage :size="18" /><p><b>Single vs. Multiple Pages</b><br />Single pages download immediately as a .jpg file. Multiple selected pages are packed into a convenient .zip archive.</p></div>
        </div>
        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> PDF to JPG Ready</div>
          <PdfToJpgConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Converted locally on your device. No PDF uploads.</div>
        </div>
      </section>

      <section class="how-section container">
        <div class="section-intro"><span class="mini-label">HOW IT WORKS</span><h2>Fast, clear PDF to JPG export</h2><p>Crisp page previews make selecting and saving JPG images effortless.</p></div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card"><div class="how-card-top"><span><FileImage :size="22" /></span><b>{{ step.number }}</b></div><h3>{{ step.title }}</h3><p>{{ step.desc }}</p><span class="card-line" aria-hidden="true" /></article>
        </div>
      </section>
    </main>

    <SiteFooter message="Private document conversion, right in your browser." />
  </div>
</template>

