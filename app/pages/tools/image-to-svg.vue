<script setup>
import {
  ArrowRight,
  Check,
  ChevronDown,
  Code2,
  Cpu,
  Eye,
  FileCheck,
  FileCode2,
  FileImage,
  Globe,
  Layers,
  LockKeyhole,
  Maximize2,
  Palette,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/image-to-svg', '/tools/vectorize-image', '/vectorize-image', '/png-to-svg', '/jpg-to-svg'],
});

const pageTitle = 'Image to SVG Converter — Free 4K Scalable Vector SVG Online | We Make PDF';
const pageDescription = 'Convert PNG, JPG, WebP, GIF, and BMP images into clean, infinitely scalable 4K vector SVG code for your website. 100% private in-browser vector tracing with instant code copy and zero server uploads.';

const steps = [
  { number: '01', title: 'Upload Image File', desc: 'Select or drag and drop any PNG, JPG, WebP, GIF, or BMP image up to 25 MB directly into the converter.' },
  { number: '02', title: 'Choose Vector Style Preset', desc: 'Select Ultra 4K Crisp for fine details, Clean Logo for branding, Posterized for illustrations, or B&W Silhouette for icons.' },
  { number: '03', title: 'Copy SVG Code or Download', desc: 'Click "Convert to 4K Vector SVG". Preview side-by-side with original, copy ready-to-use SVG code, or download the .svg file.' },
];

const faqs = [
  ['What is the difference between a raster image and a vector SVG?', 'Raster images (like PNG, JPG, and WebP) are made of fixed pixel grids that become blurry or pixelated when enlarged to 4K or Retina screens. Vector SVGs are mathematical formulas (points, lines, and Bézier curves) that scale infinitely to 4K, 8K, and any screen size without ever losing sharpness or quality.'],
  ['How does the 4K SVG code work on my website?', 'The output is clean, modern, sanitized <svg> markup with a responsive viewBox. You can paste the copied code directly into your HTML, React (JSX), Vue, Next.js, or Tailwind CSS templates, style it with CSS colors and sizes, or import the .svg file into Figma and Illustrator.'],
  ['Which vector preset should I choose?', 'Choose Ultra 4K Crisp for photos, artwork, and complex graphics requiring high color fidelity (64–128 colors). Choose Clean Logo & Icon for logos, brand identity, and UI icons with smoothed curves and noise filtering. Choose B&W Silhouette for high-contrast stamps, signatures, and glyphs.'],
  ['Can I make the background of my SVG transparent?', 'Yes! You can toggle "Remove background path" in the Fine-Tune settings. This automatically removes solid background blocks so your vector logo or illustration floats seamlessly over any dark, light, or patterned website background.'],
  ['Are my images or private logos uploaded to any server?', 'No. Vectorization runs 100% inside your browser using client-side WebAssembly, Canvas pixel scanning, and local contour-tracing algorithms. Your images, personal photos, and confidential company logos never touch any remote server.'],
  ['Can I also download a high-resolution 4K PNG from the SVG?', 'Yes! We Make PDF includes an "Export 4K PNG" button that rasterizes the vector at 3840px width, giving you an ultra-crisp high-resolution PNG image ready for print, social media, or presentations.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/image-to-svg',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Image to SVG', path: '/tools/image-to-svg' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/image-to-svg',
      'Image to SVG Converter',
      pageDescription,
      [
        'Convert PNG, JPG, WebP, GIF, and BMP into clean vector SVG code',
        'Scalable to 4K, 8K, and Retina displays with zero pixelation',
        'Multiple vector presets: Ultra 4K Detail, Clean Logo, Posterized, and B&W Silhouette',
        'Interactive side-by-side Before/After preview',
        '1-Click Copy SVG Code for immediate web development use',
        'Optional transparent background removal',
        'Custom color count, curve tightness, and noise filtering',
        'Bonus 3840px Ultra 4K PNG raster export',
        '100% private in-browser client-side execution with zero server uploads',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Convert Images to 4K SVG Online', pageDescription, steps, siteUrl, '/tools/image-to-svg'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to image to SVG converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <section class="tools-layout container">
        <div class="tools-hero">
          <span class="eyebrow"><Sparkles :size="13" /> ULTRA 4K VECTOR CONVERTER</span>
          <h1>Convert images to SVG<br /><span>clear 4K code for your website.</span></h1>
          <p>Transform raster PNG, JPG, WebP, GIF, and BMP photos into clean, infinitely scalable 4K vector SVG code. Copy production-ready SVG code for HTML, React, and Vue or download the .svg file with 100% in-browser privacy.</p>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Image to SVG Ready</div>
          <ImageToSvgConverter />
          <div class="under-card"><ShieldCheck :size="15" /> 100% Client-side vector tracing. Zero image uploads to any server.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><Maximize2 :size="14" /></span>
              <div>
                <b>Infinite 4K Scalability</b>
                <small>Scales infinitely to 4K, 8K, and Retina screens with zero blur or jagged pixels.</small>
              </div>
            </li>
            <li>
              <span><Code2 :size="14" /></span>
              <div>
                <b>1-Click Copy SVG Code</b>
                <small>Ready-to-use responsive &lt;svg&gt; markup for HTML, React, Vue, Next.js, and Tailwind.</small>
              </div>
            </li>
            <li>
              <span><Palette :size="14" /></span>
              <div>
                <b>Tailored Vector Presets</b>
                <small>Ultra 4K Crisp, Clean Logo, Posterized, and B&amp;W Silhouette vectorization modes.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>100% Local Privacy</b>
                <small>Contour tracing and curve fitting execute entirely in browser memory with zero uploads.</small>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <Sparkles :size="18" />
            <p><b>Pro Tip:</b> Vector SVGs are mathematical Bézier curves instead of fixed pixel grids. Using SVG instead of PNG for website logos, illustrations, and icons cuts file size while ensuring razor-sharp fidelity on high-DPI displays.</p>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>How to Convert Any Image to 4K Vector SVG</h2>
          <p>Three simple steps to transform raster photos, logos, and graphics into production-ready SVG code.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><Wand2 :size="20" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Key Capabilities Guide Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">KEY CAPABILITIES</span>
          <h2>Engineered for Crisp 4K Website Graphics and Logos</h2>
          <p>Convert raster bitmaps into clean, lightweight vector SVG code that renders with pixel-perfect clarity at any scale.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Maximize2 :size="24" /></span>
            <h3>Infinite 4K &amp; Retina Scalability</h3>
            <p>Vector SVGs use mathematical Bézier formulas (paths, points, and curves) rather than fixed pixel grids. Scale seamlessly to 4K monitors, 8K TVs, mobile screens, or print with zero blur or pixelation.</p>
            <ul>
              <li>Mathematical path rendering independent of screen resolution</li>
              <li>Responsive <code>viewBox</code> adapts automatically to any container</li>
              <li>Crisp typography and clean silhouette boundaries</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Code2 :size="24" /></span>
            <h3>1-Click Copy Ready-to-Use SVG Code</h3>
            <p>Instantly copy sanitized XML markup directly to your clipboard. Paste effortlessly into HTML documents, React (JSX) components, Vue templates, Next.js, or Tailwind CSS styling workflows.</p>
            <ul>
              <li>Sanitized and optimized markup free of unnecessary metadata</li>
              <li>Fully styleable with CSS <code>fill</code>, <code>stroke</code>, and hover animations</li>
              <li>Supports instant <code>.svg</code> file download</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Palette :size="24" /></span>
            <h3>Tailored Vector Presets &amp; Tuning</h3>
            <p>Tailor your vectorization for specific design requirements. Choose Ultra 4K Crisp for detailed artwork, Clean Logo for brand assets, Posterized for pop art, or B&amp;W Silhouette for stamps and icons.</p>
            <ul>
              <li>Granular color quantization control (2 to 128 colors)</li>
              <li>Adjustable curve fitting (Crisp, Balanced, Smooth)</li>
              <li>Optional transparent background removal</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><FileImage :size="24" /></span>
            <h3>Interactive Preview &amp; 4K PNG Export</h3>
            <p>Inspect your converted vector with zoom controls, transparency checkerboard backdrops, and side-by-side Before/After split comparisons. Export a full 3840px 4K PNG in one click whenever needed.</p>
            <ul>
              <li>Live interactive preview with zoom from 50% to 250%</li>
              <li>Side-by-side raster vs vector split comparison</li>
              <li>Bonus 3840px Ultra 4K PNG raster download</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">EVERYDAY WORKFLOWS</span>
          <h2>Who Relies on We Make PDF Image to SVG?</h2>
          <p>Designers, frontend engineers, marketing teams, and creators turn bitmaps into crisp vectors daily.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Frontend Developers &amp; UI Engineers</h4>
            <p>Paste clean XML vector markup directly into React, Vue, Next.js, and Tailwind CSS components without bloating bundle sizes.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Brand &amp; Graphic Designers</h4>
            <p>Convert low-res client logos, emblems, and sketches into scalable vectors ready for Figma, Adobe Illustrator, and print media.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Merchandise &amp; Apparel Printers</h4>
            <p>Prepare razor-sharp artwork for screen printing, vinyl cutters, CNC machines, and embroidery without pixelation or stair-stepping.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Icon &amp; Game Asset Creators</h4>
            <p>Transform raster game sprites, symbols, and monograms into high-performance vector graphics with transparent backgrounds.</p>
          </div>
        </div>
      </section>

      <!-- Privacy Strip -->
      <section class="privacy-strip container">
        <div class="privacy-strip-content">
          <div class="privacy-badge"><ShieldCheck :size="20" /> 100% Private Client-Side Conversion</div>
          <h2>Your images never leave your browser</h2>
          <p>Unlike cloud conversion services that upload your personal photos and proprietary corporate logos to remote servers, We Make PDF processes everything inside your device browser memory. Zero files are stored, transmitted, or monitored.</p>
        </div>
      </section>

      <!-- Frequently Asked Questions -->
      <section id="questions" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about converting images to 4K vector SVG with We Make PDF.</p>
        </div>
        <div class="faq-list">
          <details v-for="[q, a] in faqs" :key="q">
            <summary>
              <span>{{ q }}</span>
              <ChevronDown :size="18" class="faq-chevron" />
            </summary>
            <p>{{ a }}</p>
          </details>
        </div>
      </section>

      <!-- Switch Tool Banner -->
      <section class="closing-cta container">
        <div>
          <span class="mini-label">LOOKING FOR ANOTHER TOOL?</span>
          <h2>Need to convert raster images between formats?</h2>
          <p>Try our universal image converter for JPG, PNG, WebP, GIF, BMP, and ICO formats.</p>
        </div>
        <NuxtLink to="/tools/convert-image" class="primary-button">
          Open Convert Image <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
