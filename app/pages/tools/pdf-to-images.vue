<script setup>
import { ArrowRight, Check, ChevronDown, Cpu, FileCheck, FileImage, Images, Layers, LockKeyhole, ShieldCheck, Sparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageTitle = 'PDF to Images Converter — Export PDF Pages as PNG & JPG Online | Toolifybox';
const pageDescription = 'Convert PDF pages to high-quality PNG or JPG images online for free. Preview and select specific pages, choose custom resolution and format, and download single images or a ZIP archive—privately in your browser.';

const steps = [
  { number: '01', title: 'Choose a PDF Document', desc: 'Add one PDF up to 20 MB and 100 pages. Your file remains securely on your device.' },
  { number: '02', title: 'Select Pages & Format', desc: 'Preview every page, pick the exact pages you need, and choose lossless PNG or lightweight JPG output.' },
  { number: '03', title: 'Download Image Files', desc: 'Download a single image instantly or download all selected pages bundled in an organized ZIP file.' },
];

const faqs = [
  ['Should I choose PNG or JPG when converting PDF to images?', 'Choose PNG if your PDF contains text documents, architectural blueprints, vector diagrams, or graphics with sharp contrast where lossless fidelity is essential. Choose JPG for photography, color brochures, or when you need smaller file sizes for quick email attachments and web upload.'],
  ['Can I extract images from specific pages without converting the entire document?', 'Yes! You can review visual thumbnails of every page and selectively check only the pages you wish to export. Individual images download directly, while multi-page selections are packaged into a clean ZIP archive.'],
  ['Are my confidential files uploaded to any remote server or cloud database?', 'Never. Toolifybox converts PDF pages directly in your browser memory using WebAssembly and client-side HTML5 canvas APIs. Your sensitive documents never travel across the network, ensuring zero data leakage.'],
  ['What image resolution does the converter output?', 'Pages are rendered at high DPI (up to 300 DPI) to preserve small fonts, hairline borders, and graphic nuances. This produces crisp images that look stunning even on 4K retina displays.'],
  ['Is there any page limit or file size restriction?', 'You can process documents up to 20 MB and up to 100 pages per conversion session, with zero wait queues or daily conversion limits.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/pdf-to-images',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'PDF to Images', path: '/tools/pdf-to-images' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/pdf-to-images',
      'PDF to Image Converter',
      pageDescription,
      ['Lossless PNG and compressed JPG export options', 'High-DPI visual rendering', 'Interactive page-by-page selection', 'Single image or ZIP archive download', 'Zero server uploads', '100% private in-browser conversion']
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Convert PDF Pages into PNG and JPG Images', pageDescription, steps, siteUrl, '/tools/pdf-to-images'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container pdf-images-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> PAGE-BY-PAGE CONTROL</span>
          <h1>Convert PDF<br /><span>pages to images.</span></h1>
          <p>Preview every page, choose only the pages you need, and export them as clear PNG or compact JPG images.</p>
          <ul class="tools-points">
            <li><span><Check :size="14" /></span><div><b>Select Any Pages</b><small>Pick one page, several pages, or the complete PDF.</small></div></li>
            <li><span><Images :size="14" /></span><div><b>PNG and JPG Output</b><small>Choose the format and resolution before downloading.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>Private Processing</b><small>The PDF is converted locally inside your browser.</small></div></li>
          </ul>
          <div class="tools-tip"><FileImage :size="18" /><p><b>How multiple pages work</b><br />One PDF page becomes one image. Multiple selected pages download together in a ZIP file.</p></div>
        </div>
        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> PDF to Images Ready</div>
          <PdfToImagesConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Converted locally on your device. No PDF uploads.</div>
        </div>
      </section>

      <section class="how-section container" id="how-it-works">
        <div class="section-intro"><span class="mini-label">HOW IT WORKS</span><h2>Choose exactly what to download</h2><p>Clear page previews make multi-page PDFs easy to export.</p></div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card"><div class="how-card-top"><span><FileImage :size="22" /></span><b>{{ step.number }}</b></div><h3>{{ step.title }}</h3><p>{{ step.desc }}</p><span class="card-line" aria-hidden="true" /></article>
        </div>
      </section>

      <!-- Educational Guide Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">VERSATILE IMAGE EXTRACTION</span>
          <h2>Convert PDF Pages into Standard Graphic Files</h2>
          <p>Extracting PDF pages into standalone image formats makes it effortless to integrate document slides, charts, and certificates into presentations, graphic design software, and digital publications.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Images :size="24" /></span>
            <h3>Dual Format Flexibility (PNG &amp; JPG)</h3>
            <p>Different tasks require different visual formats. With Toolifybox, you have total control over whether to prioritize lossless clarity (PNG) or maximum storage compression (JPG).</p>
            <ul>
              <li>PNG: Crystal-clear rasterization for text, schematics, and UI mockups</li>
              <li>JPG: Optimized byte sizes for social posts, galleries, and mobile chat</li>
              <li>High DPI supersampling eliminates pixelation on high-res displays</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Layers :size="24" /></span>
            <h3>Granular Page Range Control</h3>
            <p>Never waste bandwidth downloading 100 images when you only need three diagrams. View thumbnail cards in real-time, click the pages you require, and export instantly.</p>
            <ul>
              <li>Instant visual card feedback for selected pages</li>
              <li>Batch select all, even, or odd page options</li>
              <li>Clean ZIP archive packaging with predictable filenames</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>Guaranteed Confidentiality</h3>
            <p>Client proposals, patient intake forms, and confidential blueprints contain valuable private information. We process your files entirely inside your device's browser memory.</p>
            <ul>
              <li>Zero network transmission of document bytes</li>
              <li>No server caching, temporary files, or third-party tracking</li>
              <li>Complete GDPR and enterprise compliance</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Where to Use Extracted Document Images</h2>
          <p>Unlock PDF contents for creative, marketing, and web publishing workflows.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Figma, Canva &amp; Adobe Photoshop</h4>
            <p>Import vector page renders directly into graphic design canvases without dealing with font mismatch errors or PDF import glitches.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Digital Portfolios &amp; Case Studies</h4>
            <p>Display your graphic design case studies, architecture portfolios, or academic publications on Behance, Dribbble, or your personal website.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Online Course Modules &amp; LMS</h4>
            <p>Convert lecture slides or worksheets into PNG images for seamless display in learning management systems like Canvas, Moodle, and Blackboard.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Social Media Carousel Posts</h4>
            <p>Extract whitepaper highlights or infoposter pages into sequential JPGs for LinkedIn and Instagram multi-slide carousel posts.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/pdf-to-jpg" class="seo-keyword-pill">PDF to JPG</NuxtLink>
            <NuxtLink to="/tools/images-to-pdf" class="seo-keyword-pill">Images to PDF</NuxtLink>
            <NuxtLink to="/tools/compress-image" class="seo-keyword-pill">Compress Images</NuxtLink>
            <NuxtLink to="/tools/image-collage" class="seo-keyword-pill">Image Collage Maker</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About Converting PDF to Images</h2>
          <p>Learn more about converting PDF documents into PNG and JPG images locally in your browser.</p>
          <div class="faq-decoration" aria-hidden="true">
            <Images :size="42" />
            <span>PDF &bull; IMAGES</span>
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
          <span class="mini-label">NEED TO REBUILD A PDF?</span>
          <h2>Convert multiple images back into a PDF</h2>
          <p>Combine JPG, PNG, and WebP pictures into an organized, print-ready PDF document in seconds.</p>
        </div>
        <NuxtLink to="/tools/images-to-pdf" class="primary-button">
          Open Images to PDF <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private document conversion, right in your browser." />
  </div>
</template>
