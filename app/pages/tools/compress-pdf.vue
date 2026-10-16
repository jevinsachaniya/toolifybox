<script setup>
import { Check, Gauge, LockKeyhole, Minimize2, ShieldCheck, Sparkles, Target } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageDescription = 'Compress PDF files online with page previews and clear quality controls. Reduce file size while preserving page layout, dimensions and visual clarity privately in your browser.';
usePageSeo({
  title: 'Compress PDF Online with Quality Control | Toolifybox',
  description: pageDescription,
  path: '/tools/compress-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [{ name: 'Home', path: '/' }, { name: 'Tools', path: '/tools' }, { name: 'Compress PDF', path: '/tools/compress-pdf' }]),
    ({ siteUrl }) => toolSchema(siteUrl, '/tools/compress-pdf', 'Compress PDF Online', pageDescription, ['Full PDF page previews', 'Custom KB or MB target size', 'Multiple compression quality levels', 'Original page dimensions and private browser processing']),
  ],
});

const steps = [
  { number: '01', title: 'Preview Your PDF', desc: 'Open one PDF and check every page before compression begins.' },
  { number: '02', title: 'Choose the Quality', desc: 'Keep exact document structure or choose a stronger visual compression level.' },
  { number: '03', title: 'Compare and Download', desc: 'See the original and final size, then download the smaller PDF directly.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a><SiteHeader />
    <main class="tools-main"><div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container compress-pdf-layout">
        <div class="tools-copy"><span class="eyebrow"><Sparkles :size="13" /> SMALLER FILE, CLEAR CHOICES</span><h1>Compress PDF without<br /><span>guessing about quality.</span></h1><p>Preview every page, choose how much document structure or file size to preserve, and compare the result before downloading.</p><ul class="tools-points"><li><span><ShieldCheck :size="14" /></span><div><b>Exact Quality Mode</b><small>Preserves selectable text, links, vectors and page content.</small></div></li><li><span><Target :size="14" /></span><div><b>Custom KB or MB Target</b><small>Enter the maximum size you need and keep the clearest result that fits.</small></div></li><li><span><Gauge :size="14" /></span><div><b>Controlled Compression</b><small>Balanced and smallest-file modes keep the visual layout clear.</small></div></li><li><span><LockKeyhole :size="14" /></span><div><b>Private Processing</b><small>Your PDF is compressed locally in browser memory.</small></div></li></ul><div class="tools-tip"><Check :size="18" /><p><b>Use Exact quality for important documents</b><br />Balanced, smallest-file and custom-target modes flatten pages into images for stronger compression.</p></div></div>
        <div class="tools-converter-wrap"><div class="converter-backdrop" aria-hidden="true" /><div class="floating-chip" aria-hidden="true"><span /> Compress PDF Ready</div><CompressPdfConverter /><div class="under-card"><ShieldCheck :size="15" /> Compressed locally on your device. No PDF uploads.</div></div>
      </section>
      <section class="how-section container"><div class="section-intro"><span class="mini-label">HOW IT WORKS</span><h2>Quality and file size stay under your control</h2><p>Every compression choice explains exactly what it preserves.</p></div><div class="how-grid"><article v-for="step in steps" :key="step.number" class="how-card"><div class="how-card-top"><span><Minimize2 :size="22" /></span><b>{{ step.number }}</b></div><h3>{{ step.title }}</h3><p>{{ step.desc }}</p><span class="card-line" aria-hidden="true" /></article></div></section>
    </main>
    <SiteFooter message="Private PDF compression with clear quality controls." />
  </div>
</template>
