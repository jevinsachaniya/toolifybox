<script setup>
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  ChevronDown,
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
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/image-collage', '/make-image-collage', '/tools/make-image-collage'],
});

const pageTitle = 'Make Image Collage Online — Free Side-by-Side & Grid Photo Maker | Toolifybox';
const pageDescription = 'Create photo collages online for free. Combine multiple photos with side-by-side (left/right), stacked (top/bottom), and custom grid positioning with 100% private in-browser rendering.';

const steps = [
  { number: '01', title: 'Upload Photos', desc: 'Select 2 to 12 images (JPG, PNG, WebP) from your phone, tablet, or computer.' },
  { number: '02', title: 'Pick Layout, Crop & Style', desc: 'Choose Left/Right, Top/Bottom, or Grid layout. Crop, rotate, or reorder photos and adjust spacing, borders, and colors.' },
  { number: '03', title: 'Download or Copy', desc: 'Export your high-resolution collage instantly as JPG or PNG, or copy directly to your clipboard.' },
];

const faqs = [
  ['Can I create a side-by-side before-and-after comparison collage?', 'Yes! Our dedicated Side-by-Side (Left/Right) mode is specifically designed for before-and-after transformations, product comparisons, and dual portraits with adjustable split ratios and dividing gap spacing.'],
  ['What aspect ratios are supported for social media sharing?', 'Toolifybox includes one-click social media aspect presets: 1:1 Square (Instagram Posts), 4:5 Portrait (Instagram & Facebook feed engagement), 16:9 Landscape (YouTube Thumbnails & Twitter), and 9:16 Vertical (Instagram Stories, TikTok & Reels).'],
  ['Can I adjust spacing, corner rounding, and frame background colors?', 'Yes. You have granular control over the photo gap width, outer canvas padding margin, corner radius (from sharp corners to pill-shaped rounding), and background fill colors (white, obsidian dark, soft cream, slate, or transparent PNG).'],
  ['Are my private personal photos uploaded to any web server?', 'Never. Toolifybox renders your image collage using hardware-accelerated client-side HTML5 Canvas. Your family photos, vacation snapshots, and private selfies remain strictly inside your device memory.'],
  ['Can I copy the finished collage directly to my clipboard without downloading?', 'Yes! In supported browsers, you can click "Copy to Clipboard" to paste your collage directly into Slack, Discord, WhatsApp Web, or email compose windows without saving an intermediate file.'],
];

usePageSeo({
  title: pageTitle,
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
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Make a Photo Collage Online for Free', pageDescription, steps, siteUrl, '/tools/image-collage'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container image-collage-layout">
    <div class="tools-hero">
      <span class="eyebrow"><Sparkles :size="13" /> PHOTO COLLAGE STUDIO</span>
          <h1>Make Image Collage<br /><span>with flexible layouts.</span></h1>
          <p>Easily combine multiple photos into a stunning collage. Position pictures side-by-side (left &amp; right), stacked (top &amp; bottom), or in balanced 2×2 and multi-photo grids with customizable spacing, rounded corners, and frame colors.</p>
    </div>

    <div class="tools-converter-wrap">
      <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Image Collage Ready</div>
          <ImageCollageConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero server uploads.</div>
    </div>

    <div class="tools-details-below">
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
  </section>

      <section class="how-section container" id="how-it-works">
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

      <!-- Educational Guide Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">CREATIVE PHOTO COMPOSITION</span>
          <h2>Combine Photos with Pixel-Perfect Layout Control</h2>
          <p>Whether you need a quick side-by-side comparison for social media or a high-resolution grid for a client presentation, Toolifybox gives you desktop-grade editing tools right inside your browser.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LayoutGrid :size="24" /></span>
            <h3>Adaptive Collage Templates</h3>
            <p>Choose from versatile layout styles: side-by-side split, vertical top/bottom stack, classic 2×2 grid, 3-column strips, or asymmetric hero layouts where one primary image is flanked by thumbnails.</p>
            <ul>
              <li>Auto-arranges 2 up to 12 photos cleanly</li>
              <li>Per-slot image pan, zoom, and aspect ratio crop</li>
              <li>Customizable split dividers and aspect proportions</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Palette :size="24" /></span>
            <h3>Styling &amp; Aesthetic Framing</h3>
            <p>Elevate your collage from a basic photo tile to a finished graphic design piece. Adjust inner borders, outer padding, rounded corner curvature, and canvas background tints.</p>
            <ul>
              <li>Color presets: Minimal White, Dark Onyx, Warm Cream, Slate</li>
              <li>Transparent background support for PNG graphics</li>
              <li>Smooth rounded corners from 0px to 32px</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ShieldCheck :size="24" /></span>
            <h3>Client-Side Privacy &amp; Speed</h3>
            <p>Never wait for slow cloud image upload queues. Toolifybox renders high-resolution canvases at 300 DPI directly on your computer or phone GPU using HTML5 Canvas.</p>
            <ul>
              <li>Zero telemetry, zero uploads, zero third-party caching</li>
              <li>Instant rendering with live slider adjustment feedback</li>
              <li>Export to full-resolution JPG, PNG, or copy to clipboard</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Popular Uses for Photo Collages</h2>
          <p>Craft engaging visuals for marketing, social media, and personal memories.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Before &amp; After Comparisons</h4>
            <p>Showcase fitness transformations, interior design renovations, makeup tutorials, or photo retouching side-by-side.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Social Media Posts &amp; Stories</h4>
            <p>Create thumb-stopping multi-photo posts for Instagram, Facebook, and Pinterest with perfect 1:1 square or 9:16 vertical dimensions.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>E-Commerce Product Highlights</h4>
            <p>Display multiple angles, color variations, or lifestyle shots of a product in a single cohesive image for Shopify or Amazon listings.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Event &amp; Vacation Recaps</h4>
            <p>Combine your favorite wedding, birthday, or travel memories into a stylish printable mood board or photo card.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/compress-image" class="seo-keyword-pill">Compress Image</NuxtLink>
            <NuxtLink to="/tools/images-to-pdf" class="seo-keyword-pill">Images to PDF</NuxtLink>
            <NuxtLink to="/tools/pdf-to-images" class="seo-keyword-pill">PDF to Images</NuxtLink>
            <NuxtLink to="/tools/pdf-to-jpg" class="seo-keyword-pill">PDF to JPG</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About Photo Collages</h2>
          <p>Find answers to common questions about making image collages online for free.</p>
          <div class="faq-decoration" aria-hidden="true">
            <LayoutGrid :size="42" />
            <span>PHOTO &bull; COLLAGE</span>
          </div>
        </div>

        <div class="faq-list">
          <details v-for="[question, answer] in faqs" :key="question">
            <summary>
              {{ question }}
              <ChevronDown :size="18" />
            </summary>
            <div class="faq-answer">
              <p>{{ answer }}</p>
            </div>
          </details>
        </div>
      </section>

      <!-- Closing CTA -->
      <section class="closing-cta container">
        <div>
          <span class="mini-label">WANT TO BIND COLLAGES INTO A PDF?</span>
          <h2>Compile your photo collages into a PDF album</h2>
          <p>Combine multiple collages into a clean, printable PDF booklet or lookbook in seconds.</p>
        </div>
        <NuxtLink to="/tools/images-to-pdf" class="primary-button">
          Open Images to PDF <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>
    <SiteFooter message="Free, private browser tools for everyday file work." />
  </div>
</template>

