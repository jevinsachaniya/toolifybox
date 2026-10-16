<script setup>
import { ArrowRight, ArrowUpRight, Check, Combine, FileImage, FileSpreadsheet, FileText, HeartHandshake, ImageDown, LockKeyhole, Minimize2, Presentation, ScanText, Scissors, Sparkles, WandSparkles } from '@lucide/vue';
import { breadcrumbSchema, usePageSeo } from '~/composables/usePageSeo';

const pageDescription = 'Learn about Toolifybox, a collection of free browser-based Word, PDF and image tools designed for simple, private file conversion without sign-up.';
usePageSeo({
  title: 'About Toolifybox — Private Browser File Tools',
  description: pageDescription,
  path: '/about',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'About', path: '/about' },
    ]),
    ({ siteUrl, canonical }) => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'AboutPage',
          name: 'About Toolifybox',
          description: pageDescription,
          url: canonical,
          about: { '@id': `${siteUrl}/#organization` },
          isPartOf: { '@type': 'WebSite', name: 'Toolifybox', url: siteUrl },
        },
        {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: 'Toolifybox',
          url: siteUrl,
          logo: { '@type': 'ImageObject', url: `${siteUrl}/brand/toolifybox-logo.svg` },
          description: 'Toolifybox creates free browser-based tools for Word, PDF and image files.',
        },
      ],
    }),
  ],
});

const values = [
  { icon: LockKeyhole, title: 'Private by design', text: 'Supported conversions run locally in your browser. The files you choose for a tool are not uploaded to a Toolifybox conversion server.' },
  { icon: WandSparkles, title: 'Simple on purpose', text: 'Each active tool has a focused workflow, clear options and a result you can download without creating an account.' },
  { icon: HeartHandshake, title: 'Honest about results', text: 'Complex layouts, unusual fonts and scanned pages can change during conversion, so every workflow asks you to review the downloaded file.' },
];

const tools = [
  { icon: FileText, iconName: 'word', title: 'Word to PDF', text: 'Create a share-ready PDF from a DOCX file.', to: '/tools/word-to-pdf' },
  { icon: Presentation, iconName: 'powerpoint', title: 'PowerPoint to PDF', text: 'Convert PPTX slides into share-ready PDF documents.', to: '/tools/powerpoint-to-pdf' },
  { icon: FileSpreadsheet, iconName: 'excel', title: 'Excel to PDF', text: 'Convert XLSX workbooks and CSV data into clean PDF documents.', to: '/tools/excel-to-pdf' },
  { icon: ScanText, iconName: 'pdf-to-word', title: 'PDF to Word', text: 'Recover editable text, including local OCR for scans.', to: '/tools/pdf-to-word' },
  { icon: FileImage, iconName: 'pdf-to-jpg', title: 'PDF to JPG', text: 'Extract high-resolution JPG images from any PDF pages.', to: '/tools/pdf-to-jpg' },
  { icon: FileImage, iconName: 'pdf-to-images', title: 'PDF to Images', text: 'Preview PDF pages and export selected PNG or JPG files.', to: '/tools/pdf-to-images' },
  { icon: Sparkles, iconName: 'images-to-pdf', title: 'Images to PDF', text: 'Arrange JPG, PNG and WebP images in one PDF.', to: '/tools/images-to-pdf' },
  { icon: Combine, iconName: 'merge-pdf', title: 'Merge PDF', text: 'Preview, reorder and combine multiple PDFs.', to: '/tools/merge-pdf' },
  { icon: Scissors, iconName: 'split-pdf', title: 'Split PDF', text: 'Choose exact split points and download separate PDF parts.', to: '/tools/split-pdf' },
  { icon: Minimize2, iconName: 'compress-pdf', title: 'Compress PDF', text: 'Reduce PDF size with clear quality and structure controls.', to: '/tools/compress-pdf' },
  { icon: ImageDown, iconName: 'compress-image', title: 'Compress Image', text: 'Reduce JPG, PNG and WebP size with a live preview.', to: '/tools/compress-image' },
  { icon: LockKeyhole, iconName: 'protect-pdf', title: 'Protect PDF', text: 'Encrypt PDF files with AES-256 or RC4 passwords.', to: '/tools/protect-pdf' },
  { icon: LockKeyhole, iconName: 'unlock-pdf', title: 'Unlock PDF', text: 'Remove password restrictions from secured PDF documents.', to: '/tools/unlock-pdf' },
];
</script>

<template>
  <div class="site-shell info-shell">
    <a class="skip-link" href="#main">Skip to content</a>
    <SiteHeader />

    <main id="main" class="info-main">
      <div class="info-ambient" aria-hidden="true"><span /><span /></div>
      <section class="info-hero container">
        <nav class="info-breadcrumb" aria-label="Breadcrumb"><NuxtLink to="/">Home</NuxtLink><span>/</span><span aria-current="page">About</span></nav>
        <span class="eyebrow"><Sparkles :size="13" /> ABOUT TOOLIFYBOX</span>
        <h1>File tools should feel<br /><span>clear, useful and private.</span></h1>
        <p>Toolifybox is a growing collection of free online tools for everyday Word, PDF and image work. The goal is simple: help you finish a file task without an account, a complicated dashboard or an unnecessary document upload.</p>
        <div class="info-hero-actions"><NuxtLink class="primary-button" to="/tools">Explore all tools <ArrowUpRight :size="17" /></NuxtLink><NuxtLink class="info-text-link" to="/contact">Contact Toolifybox <ArrowRight :size="15" /></NuxtLink></div>
      </section>

      <section class="info-section container" aria-labelledby="about-values">
        <div class="info-section-heading"><span class="mini-label">WHAT GUIDES THE PRODUCT</span><h2 id="about-values">Useful tools, fewer obstacles.</h2><p>Every active converter is designed around a real file task and a short path from selection to download.</p></div>
        <div class="value-grid">
          <article v-for="value in values" :key="value.title" class="info-card"><span class="info-card-icon"><component :is="value.icon" :size="23" /></span><h3>{{ value.title }}</h3><p>{{ value.text }}</p></article>
        </div>
      </section>

      <section class="process-panel container">
        <div class="process-copy"><span class="mini-label">HOW PRIVACY WORKS</span><h2>Your file stays in your browser.</h2><p>When you use an active converter, Toolifybox reads and processes the selected file in browser memory on your device. The generated result is downloaded directly by your browser.</p><p>The tools do load application code, fonts and language resources from the website. If you use the contact form, the details you enter there are submitted separately through Netlify Forms.</p></div>
        <ul class="process-list">
          <li><span><Check :size="15" /></span><div><b>No conversion account</b><small>Start without registration or a subscription.</small></div></li>
          <li><span><Check :size="15" /></span><div><b>No document upload</b><small>Supported file conversions run locally on your device.</small></div></li>
          <li><span><Check :size="15" /></span><div><b>Review before sharing</b><small>Check layout, text and image quality after conversion.</small></div></li>
        </ul>
      </section>

      <section class="info-section container" aria-labelledby="available-tools">
        <div class="info-section-heading"><span class="mini-label">AVAILABLE NOW</span><h2 id="available-tools">Thirteen focused browser tools.</h2><p>Choose the workflow that matches your file and see its supported formats, limits and options before converting.</p></div>
        <div class="about-tools-grid">
          <NuxtLink v-for="tool in tools" :key="tool.title" :to="tool.to" class="about-tool-card"><span><ToolRealisticIcon v-if="tool.iconName" :name="tool.iconName" :alt="tool.title" size="32" /><component :is="tool.icon" v-else :size="22" /></span><div><h3>{{ tool.title }}</h3><p>{{ tool.text }}</p></div><ArrowUpRight :size="18" /></NuxtLink>
        </div>
      </section>

      <section class="closing-cta container">
        <div><span class="mini-label">HAVE A QUESTION OR IDEA?</span><h2>Help shape what comes next.</h2><p>Send a bug report, improvement idea or general question through the contact page.</p></div>
        <NuxtLink to="/contact" class="primary-button">Contact us <ArrowRight :size="18" /></NuxtLink><div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>
    <SiteFooter message="Free browser tools for everyday file work." />
  </div>
</template>
