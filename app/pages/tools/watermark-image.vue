<script setup>
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  Eye,
  FileCheck,
  Grid3x3,
  Image as ImageIcon,
  ImagePlus,
  Layers,
  LayoutGrid,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Stamp,
  Type,
  Upload,
  Zap,
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/watermark-image', '/image-watermark', '/tools/image-watermark', '/tools/watermark-photos'],
});

const pageTitle = 'Watermark Image Online Free – Add Text & Logo Watermarks | We Make PDF';
const pageDescription = 'Add custom text or logo watermarks to images online for free. Protect photos with copyright marks, confidential stamps, 9-point grid alignment, or repeating tiled patterns with 100% in-browser privacy.';

const steps = [
  { number: '01', title: 'Upload Image', desc: 'Select or drop any JPG, PNG, WebP, SVG, or BMP photo up to 50 MB from your device.' },
  { number: '02', title: 'Customize Watermark', desc: 'Type custom text or upload a logo. Adjust opacity, rotation, font size, color, 9-point anchor, or diagonal tiled pattern.' },
  { number: '03', title: 'Download Watermarked Photo', desc: 'Preview changes live in real-time and download your protected photo in original resolution with zero cloud uploads.' },
];

const faqs = [
  ['Can I add both text and logo image watermarks?', 'Yes! You can switch seamlessly between Text Watermark mode (custom text, fonts, colors, and shadows) and Logo/Image Stamp mode (upload any PNG logo with transparency, SVG, or JPG).'],
  ['Will watermarking reduce the original quality of my photo?', 'No. We Make PDF processes your image at its full native resolution (including high-res 4K, DSLR, and smartphone photos) on an HTML5 canvas. You can export as lossless PNG, high-quality JPG, or compact WebP.'],
  ['What is the difference between 9-Point Position and Tiled Grid?', '9-Point Position anchors your watermark to a specific location on the photo (such as bottom-right copyright or center proof mark). Tiled Grid repeats the watermark diagonally across the entire surface of the image, making it impossible for unauthorized users to crop out your mark.'],
  ['Are my confidential photos or copyright designs uploaded to any server?', 'Never. All image rendering, watermark compositing, and file exports are executed 100% inside your web browser’s sandboxed memory using client-side JavaScript. Your photos never leave your device.'],
  ['Can I customize font styles and add shadow so text is readable on any background?', 'Yes! You can choose from modern typography fonts, toggle Bold and Italic, adjust opacity, and enable Text Shadow so your white or colored text remains crisp and readable over light or dark backgrounds.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/watermark-image',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Watermark Image', path: '/tools/watermark-image' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/watermark-image',
      'Watermark Images Online',
      pageDescription,
      [
        'Add custom text stamps like CONFIDENTIAL, SAMPLE, and © COPYRIGHT',
        'Upload custom logo image watermarks (PNG, SVG, JPG, WebP)',
        '9-point precision grid placement (top, center, bottom, corners)',
        'Tiled repeating diagonal grid mode for maximum copyright protection',
        'Adjustable opacity, rotation angle, font size, color, and drop shadow',
        'Real-time interactive canvas preview',
        'Export as lossless PNG, JPG with quality control, or WebP',
        '100% client-side execution with zero cloud uploads',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Watermark Images Online for Free', pageDescription, steps, siteUrl, '/tools/watermark-image'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <!-- Main Converter Hero Section -->
      <section class="tools-layout container watermark-image-layout">
        <div class="tools-hero">
          <span class="eyebrow"><Sparkles :size="13" /> IMAGE BRANDING &amp; COPYRIGHT</span>
          <h1>Watermark Images Online<br /><span>text stamps &amp; logo marks.</span></h1>
          <p>Protect your photography, creative portfolios, product mockups, and confidential images. Stamp custom text, copyright notices, or brand logos with live real-time canvas preview and 100% in-browser privacy.</p>
        </div>

        <div class="tools-converter-wrap" id="converter">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Image Watermark Ready</div>
          <WatermarkImageConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally in browser memory. Zero photo uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><Stamp :size="14" /></span>
              <div>
                <strong>Text &amp; Logo Stamps</strong>
                <p>Type custom text with rich typography or upload your brand logo with transparent PNG support.</p>
              </div>
            </li>
            <li>
              <span><Grid3x3 :size="14" /></span>
              <div>
                <strong>9-Point &amp; Tiled Grid</strong>
                <p>Position your watermark in any corner or repeat it diagonally across the entire image.</p>
              </div>
            </li>
            <li>
              <span><Sliders :size="14" /></span>
              <div>
                <strong>Opacity &amp; Rotation</strong>
                <p>Fine-tune transparency, rotation angles, margins, font sizes, and readable drop shadows.</p>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <strong>100% Client-Side Privacy</strong>
                <p>All compositing happens directly on your device canvas. Zero photos are sent to external servers.</p>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <Sparkles :size="16" />
            <div>
              <strong>Pro-Tip for Maximum Protection:</strong>
              Use our <b>Tiled Diagonal Grid</b> with 25%–35% opacity. This blankets the entire photo in a repeating pattern that cannot be easily cropped or content-aware filled by unauthorized third parties.
            </div>
          </div>
        </div>
      </section>

      <!-- How to Steps Section -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">QUICK TUTORIAL</span>
          <h2>How to Watermark Images Online in 3 Simple Steps</h2>
          <p>Protect and brand your photos and visual assets in seconds with zero software installations.</p>
        </div>

        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span>
                <ImageIcon v-if="step.number === '01'" :size="22" />
                <Stamp v-else-if="step.number === '02'" :size="22" />
                <ShieldCheck v-else :size="22" />
              </span>
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
          <span class="mini-label">WHY USE OUR IMAGE WATERMARK TOOL</span>
          <h2>Protect Your Creative Assets with Precision Watermark Branding</h2>
          <p>Whether you're a professional photographer publishing preview proofs for clients, an e-commerce store safeguarding product catalog photos, or a business sharing confidential visual drafts, visual watermarking provides instant copyright attribution and anti-theft protection.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Type :size="24" /></span>
            <h3>Versatile Text Typography</h3>
            <p>Choose from multiple typefaces, adjust font weights, pick custom brand colors, and enable drop shadows for readability over busy photographic backgrounds.</p>
            <ul>
              <li>Custom fonts: Sans-Serif, Serif, Monospace, Cursive</li>
              <li>Smooth opacity control from 5% to 100%</li>
              <li>Color swatches &amp; custom hex color picker</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ImagePlus :size="24" /></span>
            <h3>Brand Logo &amp; PNG Watermarks</h3>
            <p>Upload your official PNG logo with transparency and scale it proportionally to fit any photo dimension seamlessly.</p>
            <ul>
              <li>Supports transparent PNG, SVG, WebP, and JPG</li>
              <li>9-point anchor alignment grid</li>
              <li>Fine scale adjustment from 5% to 80%</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ShieldCheck :size="24" /></span>
            <h3>Full-Resolution Lossless Export</h3>
            <p>Retain 100% of your camera or design resolution with lossless PNG export or fine-tuned JPEG/WebP compression.</p>
            <ul>
              <li>100% in-browser HTML5 canvas processing</li>
              <li>Diagonal tiled grid security repeat mode</li>
              <li>Zero watermarks added by our tool</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>When Should You Watermark an Image?</h2>
          <p>Keep your visual creations, portfolios, and e-commerce assets secure.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Photography Client Proofs</h4>
            <p>Stamp preview galleries with "SAMPLE" or your studio logo so clients can review shots before final purchase.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>E-Commerce Product Catalogs</h4>
            <p>Prevent competitors from scraping your proprietary product photos by placing discrete or diagonal brand marks.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Social Media &amp; Portfolios</h4>
            <p>Add subtle copyright signatures or handles to digital artwork, infographics, and memes before posting online.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Confidential Visual Drafts</h4>
            <p>Mark architectural renderings, marketing mockups, and confidential UI designs with "CONFIDENTIAL" or "DRAFT".</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED MEDIA UTILITIES</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/compress-image" class="seo-keyword-pill">Compress Image</NuxtLink>
            <NuxtLink to="/tools/convert-image" class="seo-keyword-pill">Convert Image Format</NuxtLink>
            <NuxtLink to="/tools/remove-background" class="seo-keyword-pill">Remove Background</NuxtLink>
            <NuxtLink to="/tools/split-image" class="seo-keyword-pill">Split Image Grid</NuxtLink>
            <NuxtLink to="/tools/watermark-pdf" class="seo-keyword-pill">Watermark PDF</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Common Questions About Image Watermarking</h2>
          <p>Everything you need to know about stamping copyright marks, brand logos, and protection patterns onto photos.</p>
          <div class="faq-decoration" aria-hidden="true">
            <Stamp :size="42" />
            <span>IMAGE &bull; WATERMARK</span>
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
          <span class="mini-label">NEED TO OPTIMIZE YOUR WATERMARKED PHOTOS?</span>
          <h2>Compress your watermarked images for the web</h2>
          <p>Reduce file size by up to 80% while retaining high visual fidelity for fast website loading.</p>
        </div>
        <NuxtLink to="/tools/compress-image" class="primary-button">
          Open Compress Image <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

