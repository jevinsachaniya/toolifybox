<script setup>
import { Check, Gauge, ImageDown, LockKeyhole, Maximize2, ShieldCheck, Sparkles, Target } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageDescription = 'Compress JPG, PNG and WebP images online with a live preview, quality controls and a custom KB or MB target. Keep colors and transparency while processing files privately in your browser.';
usePageSeo({
  title: 'Compress Images Online to KB or MB | Toolifybox',
  description: pageDescription,
  path: '/tools/compress-image',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [{ name: 'Home', path: '/' }, { name: 'Tools', path: '/tools' }, { name: 'Compress Image', path: '/tools/compress-image' }]),
    ({ siteUrl }) => toolSchema(siteUrl, '/tools/compress-image', 'Compress Images Online', pageDescription, ['JPG, PNG and WebP support', 'Original and compressed image preview', 'Custom KB or MB target size', 'Private browser processing']),
  ],
});

const steps = [
  { number: '01', title: 'Preview Your Image', desc: 'Choose one JPG, PNG or WebP image and inspect it before compression.' },
  { number: '02', title: 'Set Quality or Size', desc: 'Choose a clear preset or enter the approximate KB or MB output you need.' },
  { number: '03', title: 'Compare and Download', desc: 'Check the final dimensions and size, then download the compressed image.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to image compressor</a><SiteHeader />
    <main class="tools-main"><div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container compress-image-layout">
        <div class="tools-copy"><span class="eyebrow"><Sparkles :size="13" /> SMALLER IMAGE, SAME IMPACT</span><h1>Compress images with<br /><span>quality you control.</span></h1><p>Preview your picture, keep its colors and transparency, and choose a quality preset or the exact KB or MB target you need.</p><ul class="tools-points"><li><span><Maximize2 :size="14" /></span><div><b>Clear Image Preview</b><small>Check the original and compressed image before downloading.</small></div></li><li><span><Target :size="14" /></span><div><b>Custom KB or MB Target</b><small>Get the clearest result that fits your requested file size.</small></div></li><li><span><Gauge :size="14" /></span><div><b>Smart Quality Controls</b><small>High, balanced and smallest presets explain every trade-off.</small></div></li><li><span><LockKeyhole :size="14" /></span><div><b>Private Processing</b><small>Your image stays in browser memory on your device.</small></div></li></ul><div class="tools-tip"><Check :size="18" /><p><b>Choose High quality for detailed artwork</b><br />Balanced WebP is a good choice for websites, sharing and everyday storage.</p></div></div>
        <div class="tools-converter-wrap"><div class="converter-backdrop" aria-hidden="true" /><div class="floating-chip" aria-hidden="true"><span /> Image Compressor Ready</div><CompressImageConverter /><div class="under-card"><ShieldCheck :size="15" /> Compressed locally on your device. No image uploads.</div></div>
      </section>
      <section class="how-section container"><div class="section-intro"><span class="mini-label">HOW IT WORKS</span><h2>A smaller image with a clear preview</h2><p>See the quality, dimensions and file-size result before you download.</p></div><div class="how-grid"><article v-for="step in steps" :key="step.number" class="how-card"><div class="how-card-top"><span><ImageDown :size="22" /></span><b>{{ step.number }}</b></div><h3>{{ step.title }}</h3><p>{{ step.desc }}</p><span class="card-line" aria-hidden="true" /></article></div></section>
    </main>
    <SiteFooter message="Private image compression with clear quality controls." />
  </div>
</template>
