<script setup>
import { ArrowLeft, Check, FileImage, Images, LockKeyhole, ShieldCheck, Sparkles } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageDescription = 'Convert PDF pages to high-quality PNG or JPG images online. Preview and select pages, then download one image or multiple pages as a ZIP—privately in your browser.';
usePageSeo({
  title: 'PDF to Image Converter — PNG & JPG | Toolifybox',
  description: pageDescription,
  path: '/tools/pdf-to-images',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' }, { name: 'Tools', path: '/tools' }, { name: 'PDF to Images', path: '/tools/pdf-to-images' },
    ]),
    ({ siteUrl }) => toolSchema(siteUrl, '/tools/pdf-to-images', 'PDF to Image Converter', pageDescription, ['PDF page previews', 'PNG and JPG export', 'Selected-page ZIP download']),
  ],
});
const steps = [
  { number: '01', title: 'Choose a PDF', desc: 'Add one PDF up to 20 MB and 100 pages. Your file remains on your device.' },
  { number: '02', title: 'Select Pages', desc: 'Preview every page and select exactly which pages you want to turn into images.' },
  { number: '03', title: 'Download Images', desc: 'Choose PNG or JPG and download one image directly or multiple selected pages in a ZIP.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <header class="site-header tools-header">
      <div class="container header-inner">
        <BrandLogo />
        <nav aria-label="Main navigation"><NuxtLink to="/">Home</NuxtLink><NuxtLink to="/tools">All Utilities</NuxtLink><NuxtLink to="/tools/pdf-to-images" aria-current="page">PDF to Images</NuxtLink></nav>
        <ThemeToggle />
        <NuxtLink class="header-action" to="/tools"><ArrowLeft :size="16" /> Back to Utilities</NuxtLink>
      </div>
    </header>

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container pdf-images-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> PAGE-BY-PAGE CONTROL</span>
          <h1>Convert PDF<br /><span>pages to images.</span></h1>
          <p>Preview every page, choose only the pages you need, and export them as clear PNG or compact JPG images.</p>
          <ul class="tools-points">
            <li><span><Check :size="14" /></span><div><b>Select Any Pages</b><small>Pick one page, several pages, or the complete PDF.</small></div></li>
            <li><span><Images :size="14" /></span><div><b>PNG and JPG Output</b><small>Choose the format and resolution before downloading.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>Private Processing</b><small>The PDF is converted locally inside your browser.</small></div></li>
          </ul>
          <div class="tools-tip"><FileImage :size="18" /><p><b>How multiple pages work</b><br />One PDF page becomes one image. Multiple selected pages download together in a ZIP file.</p></div>
        </div>
        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> PDF to Images Ready</div>
          <PdfToImagesConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Converted locally on your device. No PDF uploads.</div>
        </div>
      </section>

      <section class="how-section container">
        <div class="section-intro"><span class="mini-label">HOW IT WORKS</span><h2>Choose exactly what to download</h2><p>Clear page previews make multi-page PDFs easy to export.</p></div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card"><div class="how-card-top"><span><FileImage :size="22" /></span><b>{{ step.number }}</b></div><h3>{{ step.title }}</h3><p>{{ step.desc }}</p><span class="card-line" aria-hidden="true" /></article>
        </div>
      </section>
    </main>

    <SiteFooter message="Private document conversion, right in your browser." />
  </div>
</template>
