<script setup>
import {
  ArrowRight,
  Check,
  ChevronDown,
  Columns,
  FolderArchive,
  Grid2x2,
  Grid3x3,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Maximize2,
  Rows,
  Scissors,
  Share2,
  ShieldCheck,
  Sliders,
  Sparkles,
  Upload,
  Zap,
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/split-image', '/image-splitter', '/tools/image-splitter', '/tools/split-images'],
});

const pageTitle = 'Split Image Online Free — Grid, Carousel & Photo Slicer | We Make PDF';
const pageDescription = 'Split images online into equal grid tiles, Instagram 3x3 grids, or seamless panorama carousel slides. Download all split slices in 1-click ZIP with 100% in-browser privacy.';

const steps = [
  { number: '01', title: 'Upload Image', desc: 'Select or drag-and-drop any JPG, PNG, WebP, GIF, or BMP image up to 50 MB.' },
  { number: '02', title: 'Choose Grid or Carousel Mode', desc: 'Pick Instagram 3×3, 3×1 Panorama, 2×2 Quad, custom rows and columns, or fixed pixel dimensions.' },
  { number: '03', title: 'Slice & Download ZIP', desc: 'Preview high-precision cut lines in real-time and download all parts in a single ZIP file or copy individual slices.' },
];

const faqs = [
  ['How do I create a 9-square Instagram grid from one photo?', 'Upload your photo, click the "Instagram 3×3 (9-Grid)" preset (3 columns and 3 rows), and click "Split into 9 Tiles". We Make PDF slices the image evenly and names each tile in order so you can post them to your profile seamlessly.'],
  ['Can I split panorama photos into seamless multi-slide carousels?', 'Yes! Choose the "Vertical (Columns)" mode or pick one of our carousel presets (2, 3, 4, or 5 slides). Your wide panorama will be divided into seamless side-by-side slides perfect for Instagram, LinkedIn, and Facebook swipe posts.'],
  ['Are my private photos uploaded to a cloud server?', 'Never. We Make PDF slices and processes images directly inside your web browser using HTML5 Canvas. Your personal images, photography portfolios, and confidential graphics never leave your computer or phone.'],
  ['Which image formats are supported for input and export?', 'You can upload JPG, PNG, WebP, GIF, BMP, and AVIF. You can export your split tiles as lossless PNG, compressed JPG (with adjustable quality), or compact WebP.'],
  ['Can I download all sliced images at once?', 'Yes! We Make PDF automatically bundles all sliced tiles into a convenient `.zip` file for instant 1-click bulk download, while also allowing you to download or copy any single slice.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/split-image',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Split Image', path: '/tools/split-image' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/split-image',
      'Split Image Online Free',
      pageDescription,
      [
        'Split images into equal rows and columns (3x3, 3x2, 2x2, 4x4)',
        'Interactive custom cut lines with drag-and-drop position adjust',
        'Instagram 3x3 profile grid cutter and 3x1 panorama slicer',
        'Vertical carousel slide splitter for Instagram and LinkedIn posts',
        'Horizontal strip cutter for long infographics and banners',
        'Custom pixel dimension tile splitting (e.g. 1080x1080 px)',
        '1-click ZIP archive bulk download for all slices',
        'Individual tile preview and clipboard copying',
        '100% client-side privacy with zero server uploads',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Split Images Online for Free', pageDescription, steps, siteUrl, '/tools/split-image'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to slicer</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <!-- Main Converter Hero Section -->
      <section class="tools-layout container split-image-layout">
        <div class="tools-hero">
          <span class="eyebrow"><Sparkles :size="13" /> IMAGE GRID &amp; CAROUSEL SLICER</span>
          <h1>Split Images Online<br /><span>grid tiles &amp; seamless slides.</span></h1>
          <p>Slice any photo into equal grid squares, seamless Instagram carousels, or custom rows and columns. Download all high-resolution pieces in a single ZIP file with 100% in-browser privacy.</p>
        </div>

        <div class="tools-converter-wrap" id="slicer">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Image Splitter Ready</div>
          <SplitImageConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero photo uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><Grid3x3 :size="14" /></span>
              <div>
                <b>Instagram 3×3 &amp; Grid Slicing</b>
                <small>Create eye-catching 3×3, 3×2, or 3×1 grid headers for your Instagram profile feed with sequential numbering.</small>
              </div>
            </li>
            <li>
              <span><Sliders :size="14" /></span>
              <div>
                <b>Interactive Custom Cut Lines</b>
                <small>Place vertical and horizontal cut lines anywhere on the photo and drag them interactively to create custom-proportioned tiles.</small>
              </div>
            </li>
            <li>
              <span><Columns :size="14" /></span>
              <div>
                <b>Seamless Panorama Carousels</b>
                <small>Cut wide landscape photos into 2 to 10 equal vertical slides for seamless swipe-through carousels on social media.</small>
              </div>
            </li>
            <li>
              <span><FolderArchive :size="14" /></span>
              <div>
                <b>1-Click ZIP &amp; 100% Privacy</b>
                <small>Download every sliced tile in a clean ZIP archive with lossless quality and zero server uploads.</small>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <Sparkles :size="18" />
            <p>
              <b>Instagram Grid Tip</b><br />
              When uploading a 3×3 grid to Instagram, post tile #9 first and tile #1 last so your profile grid displays in perfect sequence.
            </p>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="how-section container" id="how-it-works">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Split images in three simple steps</h2>
          <p>Fast, private, and effortless grid and carousel slicing directly in your browser.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><Scissors :size="22" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Educational SEO Guide Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">PROFESSIONAL PHOTO SLICER</span>
          <h2>Slice High-Resolution Images with Pixel-Perfect Accuracy</h2>
          <p>Whether you want a giant 9-tile banner for your Instagram feed or panoramic carousel slides for LinkedIn, We Make PDF gives you professional cutting tools without uploading your photos to a server.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Grid3x3 :size="24" /></span>
            <h3>Instagram Profile 3×3 Grid</h3>
            <p>Turn any high-res photo into a cohesive 9-square matrix for your Instagram profile feed. Each tile is numbered sequentially so posting is effortless.</p>
            <ul>
              <li>Presets for 3×3 (9-grid), 3×2, and 3×1 panorama</li>
              <li>Even coordinate math with zero blurry sub-pixels</li>
              <li>Numbered file naming: tile_1, tile_2 ... tile_9</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Columns :size="24" /></span>
            <h3>Seamless Panorama Carousels</h3>
            <p>Cut panoramic landscape photography and infographics into seamless vertical slides. When followers swipe through on mobile, the image flows continuously without gaps.</p>
            <ul>
              <li>Presets for 2, 3, 4, and 5 seamless carousel slides</li>
              <li>Supports high-res panoramic shots up to 50 MB</li>
              <li>Maintains original sharpness and aspect proportions</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ShieldCheck :size="24" /></span>
            <h3>100% Client-Side Privacy</h3>
            <p>Never worry about cloud data storage or image leaks. All slicing and ZIP packaging happens entirely in your browser using HTML5 Canvas and WebAssembly.</p>
            <ul>
              <li>Zero uploads, zero telemetry, zero server storage</li>
              <li>Works offline once loaded in your browser</li>
              <li>Instant 1-click ZIP archive download</li>
            </ul>
          </article>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About Image Splitting</h2>
          <p>Find answers to common questions about splitting photos, creating Instagram grids, and carousel slices online for free.</p>
          <div class="faq-decoration" aria-hidden="true">
            <Scissors :size="42" />
            <span>GRID &bull; SLICER</span>
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
          <span class="mini-label">WANT TO COMBINE PHOTOS INSTEAD?</span>
          <h2>Combine your photos into a collage</h2>
          <p>Position images side-by-side, stacked, or in creative multi-photo grids in seconds.</p>
        </div>
        <NuxtLink to="/tools/image-collage" class="primary-button">
          Open Image Collage <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
