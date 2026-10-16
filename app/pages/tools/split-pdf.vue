<script setup>
import { Check, Files, LockKeyhole, Scissors, ShieldCheck, Sparkles } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageDescription = 'Split a PDF online at exact page positions. Preview every page, choose multiple split points, and download clear original-quality PDF parts privately in your browser.';
usePageSeo({
  title: 'Split PDF by Pages with Preview | Toolifybox',
  description: pageDescription,
  path: '/tools/split-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [{ name: 'Home', path: '/' }, { name: 'Tools', path: '/tools' }, { name: 'Split PDF', path: '/tools/split-pdf' }]),
    ({ siteUrl }) => toolSchema(siteUrl, '/tools/split-pdf', 'Split PDF by Pages', pageDescription, ['Full PDF page previews', 'Multiple custom split points', 'Original-quality PDF parts and ZIP download']),
  ],
});

const steps = [
  { number: '01', title: 'Preview Every Page', desc: 'Choose one PDF and inspect every page thumbnail before setting a split.' },
  { number: '02', title: 'Mark Split Points', desc: 'Select every page after which a new PDF part should begin. The output ranges update immediately.' },
  { number: '03', title: 'Download Clear PDFs', desc: 'Create original-quality parts, then download them separately or together in one ZIP file.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a><SiteHeader />
    <main class="tools-main"><div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container split-pdf-layout">
        <div class="tools-copy"><span class="eyebrow"><Sparkles :size="13" /> SPLIT EXACTLY WHERE YOU NEED</span><h1>Split one PDF into<br /><span>clear, ordered parts.</span></h1><p>Preview every page and choose each exact point where the next PDF should begin. Your original page quality stays intact.</p><ul class="tools-points"><li><span><Scissors :size="14" /></span><div><b>Multiple Split Points</b><small>Split once or create several custom page ranges in one run.</small></div></li><li><span><Files :size="14" /></span><div><b>Preview Every Page</b><small>See the complete document and live output ranges before splitting.</small></div></li><li><span><LockKeyhole :size="14" /></span><div><b>Private and Lossless</b><small>Original PDF pages are copied locally without image conversion.</small></div></li></ul><div class="tools-tip"><Check :size="18" /><p><b>Example</b><br />Select “Split after page 3” and “Split after page 7” to create pages 1–3, 4–7 and 8–end.</p></div></div>
        <div class="tools-converter-wrap"><div class="converter-backdrop" aria-hidden="true" /><div class="floating-chip" aria-hidden="true"><span /> Split PDF Ready</div><SplitPdfConverter /><div class="under-card"><ShieldCheck :size="15" /> Split locally on your device. No PDF uploads.</div></div>
      </section>
      <section class="how-section container"><div class="section-intro"><span class="mini-label">HOW IT WORKS</span><h2>You decide where every PDF begins</h2><p>Visual split controls make page ranges clear before download.</p></div><div class="how-grid"><article v-for="step in steps" :key="step.number" class="how-card"><div class="how-card-top"><span><Scissors :size="22" /></span><b>{{ step.number }}</b></div><h3>{{ step.title }}</h3><p>{{ step.desc }}</p><span class="card-line" aria-hidden="true" /></article></div></section>
    </main>
    <SiteFooter message="Private PDF splitting with exact page control." />
  </div>
</template>
