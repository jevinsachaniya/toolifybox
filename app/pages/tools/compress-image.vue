<script setup>
import { ArrowRight, Check, ChevronDown, Cpu, FileCheck, FileImage, Gauge, ImageDown, Layers, LockKeyhole, Maximize2, ShieldCheck, Sparkles, Target, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageTitle = 'Compress Image Online — Reduce JPG, PNG & WebP to KB or MB | We Make PDF';
const pageDescription = 'Compress JPG, PNG, and WebP images online for free. Reduce file size to specific KB targets (such as under 100KB, 50KB, or 200KB) with live visual side-by-side comparison. 100% private in-browser compression.';

const steps = [
  { number: '01', title: 'Upload & Preview Your Image', desc: 'Choose any JPG, PNG, or WebP photo up to 20 MB and inspect dimensions and initial file size.' },
  { number: '02', title: 'Set Quality or Target Size', desc: 'Select High, Balanced, or Extreme compression presets, or specify an exact KB or MB target size.' },
  { number: '03', title: 'Compare & Download', desc: 'Inspect side-by-side visual fidelity and download your optimized image instantly with zero server uploads.' },
];

const faqs = [
  ['How does the custom KB or MB target feature work?', 'We Make PDF uses an iterative binary search compression algorithm executed in your browser. When you specify a target like 100 KB, the engine tests compression parameters until it finds the optimal balance of quality and resolution that fits strictly under your target threshold.'],
  ['Does compressing a PNG image remove transparency?', 'No. We Make PDF preserves alpha transparency layers for PNG and WebP files. Transparent logos, product cutouts, and UI badges maintain their transparent backgrounds without turning black or white.'],
  ['Which image format offers the best compression: JPG, PNG, or WebP?', 'WebP generally provides the best compression ratio, delivering 25%–35% smaller file sizes than JPEG at equivalent visual quality while supporting transparency. JPEG is best for universal backwards compatibility, and PNG is ideal when lossless crispness is non-negotiable.'],
  ['Are my private photos uploaded to any remote server?', 'Never. We Make PDF compresses all images locally inside your device browser memory via HTML5 Canvas and WebAssembly. Your photos, private documents, and client assets never leave your computer or phone.'],
  ['Can I compress images for government, exam, or job portal submissions?', 'Yes! Portals often strictly mandate image limits such as "passport photo under 50 KB" or "signature under 20 KB". Our custom KB target is engineered specifically to satisfy these strict portal requirements without tedious manual trial and error.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/compress-image',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Compress Image', path: '/tools/compress-image' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/compress-image',
      'Compress Images Online',
      pageDescription,
      ['JPG, PNG, and WebP format support', 'Custom target KB size limiter (e.g. 50KB, 100KB, 200KB)', 'Real-time side-by-side visual comparison', 'Alpha transparency preservation', 'Zero server uploads', '100% private in-browser compression']
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Compress JPG, PNG and WebP Images Online', pageDescription, steps, siteUrl, '/tools/compress-image'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to image compressor</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container compress-image-layout">
    <div class="tools-hero">
      <span class="eyebrow"><Sparkles :size="13" /> SMALLER IMAGE, SAME IMPACT</span>
          <h1>Compress images with<br /><span>quality you control.</span></h1>
          <p>Preview your picture, keep its colors and transparency, and choose a quality preset or the exact KB or MB target you need.</p>
    </div>

    <div class="tools-converter-wrap">
      <div class="converter-backdrop" aria-hidden="true" /><div class="floating-chip" aria-hidden="true"><span /> Image Compressor Ready</div><CompressImageConverter /><div class="under-card"><ShieldCheck :size="15" /> Compressed locally on your device. No image uploads.</div>
    </div>

    <div class="tools-details-below">
      <ul class="tools-points">
            <li><span><Maximize2 :size="14" /></span><div><b>Clear Image Preview</b><small>Check the original and compressed image before downloading.</small></div></li>
            <li><span><Target :size="14" /></span><div><b>Custom KB or MB Target</b><small>Get the clearest result that fits your requested file size.</small></div></li>
            <li><span><Gauge :size="14" /></span><div><b>Smart Quality Controls</b><small>High, balanced and smallest presets explain every trade-off.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>Private Processing</b><small>Your image stays in browser memory on your device.</small></div></li>
          </ul>
      
      <div class="tools-tip"><Check :size="18" /><p><b>Choose High quality for detailed artwork</b><br />Balanced WebP is a good choice for websites, sharing and everyday storage.</p></div>
    </div>
  </section>

      <section class="how-section container" id="how-it-works"><div class="section-intro"><span class="mini-label">HOW IT WORKS</span><h2>A smaller image with a clear preview</h2><p>See the quality, dimensions and file-size result before you download.</p></div><div class="how-grid"><article v-for="step in steps" :key="step.number" class="how-card"><div class="how-card-top"><span><ImageDown :size="22" /></span><b>{{ step.number }}</b></div><h3>{{ step.title }}</h3><p>{{ step.desc }}</p><span class="card-line" aria-hidden="true" /></article></div></section>

      <!-- Educational Guide Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">INTELLIGENT COMPRESSION</span>
          <h2>Optimize Images Without Sacrificing Visual Sharpness</h2>
          <p>High-resolution photos from modern smartphone cameras frequently exceed 5 MB to 15 MB in size. Large images slow down web pages, fail email size caps, and trigger portal rejection.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Target :size="24" /></span>
            <h3>Custom KB Target Sizing</h3>
            <p>Need your passport photo or signature under 50 KB or 100 KB? Instead of manually guessing quality sliders, simply type your exact byte requirement. Our iterative engine calculates the highest possible visual clarity that fits your limit.</p>
            <ul>
              <li>Instant convergence on requested KB / MB constraints</li>
              <li>Eliminates portal upload errors and file rejections</li>
              <li>Calculates optimal JPEG or WebP quantization matrices</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Maximize2 :size="24" /></span>
            <h3>Side-by-Side Visual Inspection</h3>
            <p>Never download an over-compressed, blurry image. Inspect side-by-side zoom previews comparing original textures with the compressed output before saving to disk.</p>
            <ul>
              <li>Real-time visual comparison with pixel-level inspection</li>
              <li>Clear metrics: Original size vs compressed size and % reduction</li>
              <li>Live dimension scaling and resolution feedback</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>100% In-Browser Privacy</h3>
            <p>Personal family portraits, identity documents, and sensitive marketing assets stay secure. We Make PDF executes all image compression routines locally in your browser memory.</p>
            <ul>
              <li>Zero network transmission of photo bytes</li>
              <li>No server caching or remote telemetry</li>
              <li>Instant speed without bandwidth throttling</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Where Image Compression Makes an Impact</h2>
          <p>Accelerate websites, streamline emails, and pass strict upload forms.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Website Performance &amp; Core Web Vitals</h4>
            <p>Shrinking hero banners and product catalog images to WebP improves Largest Contentful Paint (LCP) and boosts Google search rankings.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Passport, Visa &amp; Job Portals</h4>
            <p>Government portal upload forms regularly enforce strict limits (such as strictly under 100 KB). Hit the exact size requirement effortlessly.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Email Newsletters &amp; Attachments</h4>
            <p>Prevent bounced emails caused by 25 MB inbox limits. Send crisp proposals and flyers with tiny file sizes that download instantly.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>E-Commerce Product Listings</h4>
            <p>Optimize thousands of product pictures for Shopify, Amazon, and WooCommerce to improve mobile conversion rates.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/compress-pdf" class="seo-keyword-pill">Compress PDF</NuxtLink>
            <NuxtLink to="/tools/images-to-pdf" class="seo-keyword-pill">Images to PDF</NuxtLink>
            <NuxtLink to="/tools/image-collage" class="seo-keyword-pill">Image Collage Maker</NuxtLink>
            <NuxtLink to="/tools/pdf-to-images" class="seo-keyword-pill">PDF to Images</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About Compressing Images</h2>
          <p>Find answers to common questions about optimizing JPG, PNG, and WebP images online.</p>
          <div class="faq-decoration" aria-hidden="true">
            <ImageDown :size="42" />
            <span>IMAGE &bull; COMPRESS</span>
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
          <span class="mini-label">WANT TO BIND PHOTOS INTO A PDF?</span>
          <h2>Turn your compressed photos into a PDF</h2>
          <p>Assemble your newly compressed images into an organized, multipage PDF document ready for printing and archiving.</p>
        </div>
        <NuxtLink to="/tools/images-to-pdf" class="primary-button">
          Open Images to PDF <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private image compression with clear quality controls." />
  </div>
</template>
