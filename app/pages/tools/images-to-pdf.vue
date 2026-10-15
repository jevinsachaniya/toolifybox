<script setup>
import { ArrowLeft, Check, Images, Layers, LockKeyhole, ShieldCheck, Sparkles } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageDescription = 'Combine JPG, PNG and WebP images into one high-quality PDF online. Preview, reorder and rotate pages before a private in-browser conversion.';
usePageSeo({
  title: 'Images to PDF Converter — JPG, PNG & WebP | Toolifybox',
  description: pageDescription,
  path: '/tools/images-to-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' }, { name: 'Tools', path: '/tools' }, { name: 'Images to PDF', path: '/tools/images-to-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(siteUrl, '/tools/images-to-pdf', 'Images to PDF Converter', pageDescription, ['JPG, PNG and WebP input', 'Image previews and page reordering', 'High-quality PDF output']),
  ],
});
const steps = [
  { number: '01', title: 'Add Your Images', desc: 'Choose up to 50 JPG, PNG, or WebP images and review every preview before conversion.' },
  { number: '02', title: 'Arrange PDF Pages', desc: 'Drag images or use the move buttons to set the exact page order. Rotate or remove any image.' },
  { number: '03', title: 'Create Your PDF', desc: 'Choose page size, fit, margins, and maximum quality, then download one polished PDF.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <header class="site-header tools-header"><div class="container header-inner"><BrandLogo /><nav aria-label="Main navigation"><NuxtLink to="/">Home</NuxtLink><NuxtLink to="/tools">All Utilities</NuxtLink><NuxtLink to="/tools/images-to-pdf" aria-current="page">Images to PDF</NuxtLink></nav><ThemeToggle /><NuxtLink class="header-action" to="/tools"><ArrowLeft :size="16" /> Back to Utilities</NuxtLink></div></header>

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container images-pdf-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> YOUR IMAGES, ONE PDF</span>
          <h1>Turn images into<br /><span>a polished PDF.</span></h1>
          <p>Preview and arrange your images in the exact page order you want, then create a crisp PDF without uploading anything.</p>
          <ul class="tools-points">
            <li><span><Check :size="14" /></span><div><b>Preview Every Image</b><small>See filenames, dimensions, size, rotation, and final page order.</small></div></li>
            <li><span><Layers :size="14" /></span><div><b>Move and Organize</b><small>Drag cards or use accessible move buttons on desktop and mobile.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>Maximum Image Quality</b><small>High-resolution rendering with lossless PNG support and 98% JPEG quality.</small></div></li>
          </ul>
          <div class="tools-tip"><Images :size="18" /><p><b>Best results</b><br />Use Maximum quality and Fit entire image to keep every detail without cropping.</p></div>
        </div>
        <div class="tools-converter-wrap"><div class="converter-backdrop" aria-hidden="true" /><div class="floating-chip" aria-hidden="true"><span /> Images to PDF Ready</div><ImagesToPdfConverter /><div class="under-card"><ShieldCheck :size="15" /> Created locally on your device. No image uploads.</div></div>
      </section>

      <section class="how-section container"><div class="section-intro"><span class="mini-label">HOW IT WORKS</span><h2>From separate images to one clear PDF</h2><p>Control the order and appearance before you download.</p></div><div class="how-grid"><article v-for="step in steps" :key="step.number" class="how-card"><div class="how-card-top"><span><Images :size="22" /></span><b>{{ step.number }}</b></div><h3>{{ step.title }}</h3><p>{{ step.desc }}</p><span class="card-line" aria-hidden="true" /></article></div></section>
    </main>

    <SiteFooter message="Private image conversion, right in your browser." />
  </div>
</template>
