<script setup>
import { ArrowRight, Check, ChevronDown, Cpu, FileCheck, FileImage, Layers, LockKeyhole, ShieldCheck, Sparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/pdf-to-jpg'],
});

const pageTitle = 'PDF to JPG Converter — Convert PDF Pages to High-Resolution JPG Online | Toolifybox';
const pageDescription = 'Convert PDF pages to high-quality JPG images online for free. Preview pages, choose custom JPG quality and resolution up to 300 DPI, and download single JPGs or all pages in a ZIP—privately in your browser.';

const steps = [
  { number: '01', title: 'Choose a PDF Document', desc: 'Add one PDF up to 20 MB and 450 pages. Your file remains securely on your device.' },
  { number: '02', title: 'Select Pages & Resolution', desc: 'Preview every page, pick the pages you want, and choose High or Standard JPG quality up to 300 DPI.' },
  { number: '03', title: 'Download JPG Images', desc: 'Download a single JPG page directly or get all selected pages bundled in a neat ZIP file.' },
];

const faqs = [
  ['What image quality and DPI are supported for PDF to JPG conversion?', 'Toolifybox renders PDF pages using HTML5 Canvas at up to 300 DPI (3× supersampling) and 92%–98% JPEG quality. This ensures text remains razor-sharp, fine line art is crisp, and colors remain vibrant.'],
  ['Can I extract only specific pages instead of converting the whole document?', 'Yes! The interactive thumbnail selector lets you select individual pages, odd/even sequences, or custom ranges. Single pages download immediately as a .jpg file, while multiple pages are bundled in a clean ZIP file.'],
  ['Are my confidential PDF documents uploaded to an external server?', 'Never. Toolifybox runs entirely inside your web browser using client-side WebAssembly and PDF.js rendering. Your files stay strictly in your device memory and are never uploaded to any remote server or cloud database.'],
  ['What is the difference between PDF to JPG and PDF to Images (PNG)?', 'JPG uses perceptual lossy compression that produces significantly smaller file sizes, making it ideal for web sharing, emails, slides, and social media. PNG is lossless and supports transparency, which is better for technical diagrams or print graphics.'],
  ['Does this tool work on mobile devices and tablets?', 'Yes. Toolifybox is fully responsive and functions smoothly on iOS (iPhone/iPad), Android, Windows, macOS, and Linux without requiring any software installations or browser extensions.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/pdf-to-jpg',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'PDF to JPG', path: '/tools/pdf-to-jpg' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/pdf-to-jpg',
      'PDF to JPG Converter',
      pageDescription,
      ['High-resolution 300 DPI rendering', 'Adjustable JPEG quality settings', 'Individual page selection', 'Instant single-page or ZIP archive download', 'Zero server uploads', '100% private in-browser conversion']
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Convert PDF Pages to JPG Images Online', pageDescription, steps, siteUrl, '/tools/pdf-to-jpg'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container pdf-jpg-layout">
    <div class="tools-hero">
      <span class="eyebrow"><Sparkles :size="13" /> INSTANT BROWSER CONVERSION</span>
          <h1>Convert PDF<br /><span>pages to JPG images.</span></h1>
          <p>Turn every page of your PDF into a crisp, high-resolution JPG image. Preview pages, adjust quality, and download single JPGs or all pages in a ZIP file.</p>
    </div>

    <div class="tools-converter-wrap">
      <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> PDF to JPG Ready</div>
          <PdfToJpgConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Converted locally on your device. No PDF uploads.</div>
    </div>

    <div class="tools-details-below">
      <ul class="tools-points">
            <li><span><Check :size="14" /></span><div><b>Select Any Pages</b><small>Convert the entire PDF or select specific pages to export.</small></div></li>
            <li><span><FileImage :size="14" /></span><div><b>High-Quality JPG</b><small>Export with up to 3× / 300 DPI resolution and crisp 98% quality.</small></div></li>
            <li><span><Zap :size="14" /></span><div><b>Instant &amp; Free</b><small>Fast client-side rendering with no watermark or file size delays.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>Private Processing</b><small>Your PDF is rendered locally inside your browser without uploads.</small></div></li>
          </ul>
      
      <div class="tools-tip"><FileImage :size="18" /><p><b>Single vs. Multiple Pages</b><br />Single pages download immediately as a .jpg file. Multiple selected pages are packed into a convenient .zip archive.</p></div>
    </div>
  </section>

      <section class="how-section container" id="how-it-works">
        <div class="section-intro"><span class="mini-label">HOW IT WORKS</span><h2>Fast, clear PDF to JPG export</h2><p>Crisp page previews make selecting and saving JPG images effortless.</p></div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card"><div class="how-card-top"><span><FileImage :size="22" /></span><b>{{ step.number }}</b></div><h3>{{ step.title }}</h3><p>{{ step.desc }}</p><span class="card-line" aria-hidden="true" /></article>
        </div>
      </section>

      <!-- Educational Guide Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">HIGH-DPI IMAGE RASTERIZATION</span>
          <h2>Why Convert PDF Pages to JPG Format?</h2>
          <p>PDF documents are excellent for printing and vector preservation, but websites, PowerPoint decks, photo editors, and social networks require raster image formats like JPEG for effortless embedding and sharing.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><FileImage :size="24" /></span>
            <h3>High-Fidelity Rendering</h3>
            <p>Our renderer rasterizes complex PDF vector paths, embedded fonts, and high-resolution photo assets at 300 DPI so small footnotes, mathematical symbols, and illustrations remain legible.</p>
            <ul>
              <li>Configurable scale multiplier for ultra-crisp output</li>
              <li>Accurate RGB color space mapping for monitors and screens</li>
              <li>Eliminates font substitution and layout distortion</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Layers :size="24" /></span>
            <h3>Selective Page Extraction</h3>
            <p>Why convert an entire 50-page brochure when you only need page 3 for a blog post or slide deck? Select only the pages you need and download them instantly.</p>
            <ul>
              <li>Visual click-to-select interface with zoom previews</li>
              <li>Single-click download for individual pages</li>
              <li>Automated ZIP packaging for multi-page batches</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>Total Device Privacy</h3>
            <p>Many online PDF converters upload your files to remote cloud servers where they may linger in temporary storage. Toolifybox processes everything inside your local web browser session.</p>
            <ul>
              <li>100% private in-memory canvas rendering</li>
              <li>No server data collection or file storage</li>
              <li>Compliant with enterprise confidentiality policies</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Common Applications for PDF to JPG Conversion</h2>
          <p>Transform documents into universal image assets for web and media workflows.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Presentations &amp; Slide Decks</h4>
            <p>Embed certificates, contract excerpts, or report pages directly into PowerPoint, Keynote, or Google Slides without PDF import issues.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Social Media &amp; Portfolios</h4>
            <p>Post high-resolution snippets of your resume, design portfolio, or academic research paper on LinkedIn, Twitter, or Instagram.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Website Content &amp; Blog Posts</h4>
            <p>Convert case study pages or product spec sheets into optimized web images that load fast and look sharp on retina displays.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Messaging &amp; Chat Previews</h4>
            <p>Share single-page receipts or tickets in WhatsApp, Slack, or Teams where recipients can preview them immediately without opening a PDF reader.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/pdf-to-images" class="seo-keyword-pill">PDF to Images (PNG/WebP)</NuxtLink>
            <NuxtLink to="/tools/images-to-pdf" class="seo-keyword-pill">Images to PDF</NuxtLink>
            <NuxtLink to="/tools/compress-image" class="seo-keyword-pill">Compress Images</NuxtLink>
            <NuxtLink to="/tools/pdf-to-word" class="seo-keyword-pill">PDF to Word</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About PDF to JPG</h2>
          <p>Find answers to common questions about converting PDF documents to JPG images online.</p>
          <div class="faq-decoration" aria-hidden="true">
            <FileImage :size="42" />
            <span>PDF &bull; JPG</span>
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
          <span class="mini-label">NEED TO SHRINK IMAGE SIZES?</span>
          <h2>Compress your JPG images instantly</h2>
          <p>Reduce image file size by up to 80% without losing visual clarity using our browser-based image compressor.</p>
        </div>
        <NuxtLink to="/tools/compress-image" class="primary-button">
          Open Compress Image <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private document conversion, right in your browser." />
  </div>
</template>

