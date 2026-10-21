<script setup>
import {
  ArrowLeftRight,
  Check,
  Download,
  FileCheck,
  Grid2x2,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Maximize2,
  Palette,
  ShieldCheck,
  Sliders,
  Sparkles,
} from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/image-collage', '/make-image-collage', '/tools/make-image-collage'],
});

const pageDescription = 'Create photo collages online for free. Combine multiple photos with side-by-side (left/right), stacked (top/bottom), and custom grid positioning with 100% private in-browser rendering.';

usePageSeo({
  title: 'Make Image Collage Online — Free Photo Collage Maker | Toolifybox',
  description: pageDescription,
  path: '/tools/image-collage',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Make Image Collage', path: '/tools/image-collage' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/image-collage',
      'Make Image Collage',
      pageDescription,
      [
        'Side-by-side (left/right) and stacked (top/bottom) positioning',
        'Main hero + side stack layouts for 3 or 4 photos',
        'Crop individual photos with aspect ratio presets (1:1, 4:3, 16:9, match slot)',
        '2x2 grid, 3-column strips, and auto-balancing grids',
        'Custom aspect ratios: 1:1 Square, 4:5 Portrait, 16:9 Landscape, 9:16 Story',
        'Adjustable photo gap, outer margin, and rounded corner radius',
        'Custom background colors (white, black, cream, slate, transparent)',
        'One-click high-resolution JPG or PNG download and copy to clipboard',
        '100% client-side privacy without uploading images to any server',
      ]
    ),
  ],
});

const steps = [
  { number: '01', title: 'Upload Photos', desc: 'Select 2 to 12 images (JPG, PNG, WebP) from your phone, tablet, or computer.' },
  { number: '02', title: 'Pick Layout, Crop & Style', desc: 'Choose Left/Right, Top/Bottom, or Grid layout. Crop, rotate, or reorder photos and adjust spacing, borders, and colors.' },
  { number: '03', title: 'Download or Copy', desc: 'Export your high-resolution collage instantly as JPG or PNG, or copy directly to your clipboard.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container image-collage-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> PHOTO COLLAGE STUDIO</span>
          <h1>Make Image Collage<br /><span>with flexible layouts.</span></h1>
          <p>Easily combine multiple photos into a stunning collage. Position pictures side-by-side (left &amp; right), stacked (top &amp; bottom), or in balanced 2×2 and multi-photo grids with customizable spacing, rounded corners, and frame colors.</p>
          <ul class="tools-points">
            <li>
              <span><ArrowLeftRight :size="14" /></span>
              <div>
                <b>Left/Right &amp; Top/Bottom Positioning</b>
                <small>Split photos horizontally or vertically with custom 50/50, 60/40, or hero-weighted proportions.</small>
              </div>
            </li>
            <li>
              <span><Grid2x2 :size="14" /></span>
              <div>
                <b>Multi-Photo Creative Grids</b>
                <small>Mix up to 12 images with 2×2 grids, 3-column strips, hero banners, and auto-arranging layouts.</small>
              </div>
            </li>
            <li>
              <span><Sliders :size="14" /></span>
              <div>
                <b>Custom Spacing, Borders &amp; Colors</b>
                <small>Fine-tune gap width, canvas margins, corner smoothness, and background colors with real-time preview.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>100% Client-Side Privacy</b>
                <small>Collages render entirely on your hardware using HTML5 Canvas. Your personal photos are never uploaded.</small>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <FileCheck :size="18" />
            <p>
              <b>Social Media Tip</b><br />
              Use the 1:1 Square ratio for Instagram feeds, 9:16 for Stories &amp; Reels, and 16:9 for YouTube thumbnails or landscape desktop wallpapers.
            </p>
          </div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Image Collage Ready</div>
          <ImageCollageConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero server uploads.</div>
        </div>
      </section>

      <section class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Create a photo collage in three easy steps</h2>
          <p>Fast, private, and effortless image composition in your browser.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><LayoutGrid :size="22" /></span>
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

