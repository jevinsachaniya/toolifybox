<script setup>
import { Check, LockKeyhole, Presentation, ShieldCheck, Sparkles, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/powerpoint-to-pdf', '/pptx-to-pdf'],
});

const pageDescription = 'Convert PowerPoint presentations (.pptx) to PDF online for free. Preview slides, select specific slides, and generate high-quality PDF documents privately in your browser.';
usePageSeo({
  title: 'PowerPoint to PDF Converter — Free PPTX to PDF | Toolifybox',
  description: pageDescription,
  path: '/tools/powerpoint-to-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' }, { name: 'Tools', path: '/tools' }, { name: 'PowerPoint to PDF', path: '/tools/powerpoint-to-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(siteUrl, '/tools/powerpoint-to-pdf', 'PowerPoint to PDF Converter', pageDescription, ['PPTX slide preview', 'High-resolution PDF export', 'Widescreen 16:9 and 4:3 support', 'Private browser processing']),
  ],
});

const steps = [
  { number: '01', title: 'Choose a Presentation', desc: 'Add one .pptx presentation up to 20 MB and 100 slides. Your file stays on your device.' },
  { number: '02', title: 'Review Slides & Quality', desc: 'Preview every slide thumbnail, choose your resolution, or select only the slides you need.' },
  { number: '03', title: 'Download PDF', desc: 'Convert and save your presentation as a clean, share-ready PDF with preserved layout and colors.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container powerpoint-pdf-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> PRESENTATION CONVERTER</span>
          <h1>Convert PowerPoint<br /><span>slides to PDF.</span></h1>
          <p>Turn your pitch decks and presentation slides into clean, share-ready PDF documents without opening Microsoft PowerPoint or uploading to a third-party server.</p>
          <ul class="tools-points">
            <li><span><Check :size="14" /></span><div><b>Preview Every Slide</b><small>Inspect each slide thumbnail and choose which slides to include.</small></div></li>
            <li><span><WandSparkles :size="14" /></span><div><b>Preserves Layout &amp; Colors</b><small>Maintains fonts, slide backgrounds, and widescreen dimensions.</small></div></li>
            <li><span><Zap :size="14" /></span><div><b>Quality Controls</b><small>Choose standard screen quality or high-resolution print output.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>100% Private in Browser</b><small>Conversion runs locally inside your browser memory.</small></div></li>
          </ul>
          <div class="tools-tip"><Presentation :size="18" /><p><b>Widescreen &amp; Standard Slides</b><br />Both 16:9 widescreen and 4:3 standard slide formats are automatically formatted into fitting PDF pages.</p></div>
        </div>
        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> PowerPoint to PDF Ready</div>
          <PowerpointToPdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Converted locally on your device. No document uploads.</div>
        </div>
      </section>

      <section class="how-section container">
        <div class="section-intro"><span class="mini-label">HOW IT WORKS</span><h2>Turn slides into PDF in seconds</h2><p>Accurate slide rendering makes sharing presentations effortless.</p></div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card"><div class="how-card-top"><span><Presentation :size="22" /></span><b>{{ step.number }}</b></div><h3>{{ step.title }}</h3><p>{{ step.desc }}</p><span class="card-line" aria-hidden="true" /></article>
        </div>
      </section>
    </main>

    <SiteFooter message="Private document conversion, right in your browser." />
  </div>
</template>

