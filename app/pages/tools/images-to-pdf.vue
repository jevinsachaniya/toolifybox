<script setup>
import { ArrowRight, Check, ChevronDown, Cpu, FileCheck, FileImage, Images, Layers, LockKeyhole, ShieldCheck, Sparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageTitle = 'Images to PDF Converter — Combine JPG, PNG & WebP into PDF Online | Toolifybox';
const pageDescription = 'Combine JPG, PNG, and WebP images into one high-quality PDF online for free. Preview, reorder, rotate, adjust margins, and merge up to 50 photos into a single PDF privately in your browser without uploading files.';

const steps = [
  { number: '01', title: 'Add Your Images', desc: 'Choose up to 50 JPG, PNG, or WebP images and review every thumbnail preview before conversion.' },
  { number: '02', title: 'Arrange & Reorder Pages', desc: 'Drag images or use the move buttons to set the exact page sequence. Rotate or remove any photo as needed.' },
  { number: '03', title: 'Create & Download PDF', desc: 'Configure page size (A4, Letter, Auto), margins, and orientation, then download your combined PDF instantly.' },
];

const faqs = [
  ['What image formats can I convert to PDF?', 'Toolifybox supports standard web image formats including JPG (JPEG), PNG, WebP, and BMP. You can mix and match different formats in a single batch.'],
  ['Can I reorder or rotate images before generating the PDF?', 'Yes! You have full interactive control over the page sequence. Drag thumbnails to reorder them, use keyboard arrows or move buttons, and rotate individual photos 90 degrees if they were snapped sideways.'],
  ['Will combining images into a PDF reduce picture quality?', 'No. Toolifybox embeds your photos at up to 98% JPEG quality or lossless PNG resolution. You can also configure page dimensions (such as standard A4, US Letter, or Auto Fit to image dimensions) to avoid unnecessary compression or letterboxing.'],
  ['Are my photos or scanned receipts uploaded to any remote server?', 'Never. Toolifybox compiles your PDF entirely inside your web browser using client-side JavaScript. Your photos, personal IDs, certificates, and invoices remain 100% private in local device memory.'],
  ['How many images can I merge into a single PDF document?', 'You can combine up to 50 photos or scans per session. Because rendering occurs locally, your document generates within seconds without server queue delays.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/images-to-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Images to PDF', path: '/tools/images-to-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/images-to-pdf',
      'Images to PDF Converter',
      pageDescription,
      ['JPG, PNG, WebP, and BMP input support', 'Interactive drag-and-drop page reordering', 'Custom page sizes (A4, Letter, Auto)', 'Margin and orientation controls', 'Zero server uploads', '100% private in-browser generation']
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Convert Images into a Single PDF Document Online', pageDescription, steps, siteUrl, '/tools/images-to-pdf'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container images-pdf-layout">
    <div class="tools-hero">
      <span class="eyebrow"><Sparkles :size="13" /> YOUR IMAGES, ONE PDF</span>
          <h1>Turn images into<br /><span>a polished PDF.</span></h1>
          <p>Preview and arrange your images in the exact page order you want, then create a crisp PDF without uploading anything.</p>
    </div>

    <div class="tools-converter-wrap">
      <div class="converter-backdrop" aria-hidden="true" /><div class="floating-chip" aria-hidden="true"><span /> Images to PDF Ready</div><ImagesToPdfConverter /><div class="under-card"><ShieldCheck :size="15" /> Created locally on your device. No image uploads.</div>
    </div>

    <div class="tools-details-below">
      <ul class="tools-points">
            <li><span><Check :size="14" /></span><div><b>Preview Every Image</b><small>See filenames, dimensions, size, rotation, and final page order.</small></div></li>
            <li><span><Layers :size="14" /></span><div><b>Move and Organize</b><small>Drag cards or use accessible move buttons on desktop and mobile.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>Maximum Image Quality</b><small>High-resolution rendering with lossless PNG support and 98% JPEG quality.</small></div></li>
          </ul>
      
      <div class="tools-tip"><Images :size="18" /><p><b>Best results</b><br />Use Maximum quality and Fit entire image to keep every detail without cropping.</p></div>
    </div>
  </section>

      <section class="how-section container" id="how-it-works"><div class="section-intro"><span class="mini-label">HOW IT WORKS</span><h2>From separate images to one clear PDF</h2><p>Control the order and appearance before you download.</p></div><div class="how-grid"><article v-for="step in steps" :key="step.number" class="how-card"><div class="how-card-top"><span><Images :size="22" /></span><b>{{ step.number }}</b></div><h3>{{ step.title }}</h3><p>{{ step.desc }}</p><span class="card-line" aria-hidden="true" /></article></div></section>

      <!-- Educational Guide Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">ORGANIZED DIGITAL BINDING</span>
          <h2>Why Merge Loose Images into a Standard PDF?</h2>
          <p>Sending loose photos of multi-page agreements or receipts causes confusion and formatting discrepancies. Compiling them into a single PDF document ensures chronological order and professional presentation.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Layers :size="24" /></span>
            <h3>Intuitive Drag-and-Drop Sequencing</h3>
            <p>Smart visual cards allow you to reorganize pages effortlessly. Ensure page 1 is followed by page 2 without confusing filenames or messy directory sorts.</p>
            <ul>
              <li>Reorder with drag-and-drop or tactile arrow controls</li>
              <li>Individual 90-degree page rotation adjustments</li>
              <li>Live thumbnail previews verify correct sequence</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><FileCheck :size="24" /></span>
            <h3>Flexible Page Formatting</h3>
            <p>Standardize paper dimensions for printing or match the exact aspect ratio of each photo. Toolifybox provides custom page templates tailored to your destination medium.</p>
            <ul>
              <li>Preset formats: International A4, US Letter, or Auto Fit</li>
              <li>Adjustable margin padding (None, Narrow, or Standard)</li>
              <li>Portrait and landscape orientation options</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>Guaranteed Confidentiality</h3>
            <p>Photographs of government IDs, medical bills, insurance claims, and bank checks must never be uploaded to unknown third-party servers. Toolifybox generates the entire PDF locally.</p>
            <ul>
              <li>100% private in-browser memory execution</li>
              <li>No cloud storage, server logs, or telemetry</li>
              <li>Secure for sensitive corporate and personal files</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Common Uses for Images to PDF Conversion</h2>
          <p>Turn scattered photo files into clean, shareable documents.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Expense Reports &amp; Receipts</h4>
            <p>Snap photos of lunch receipts, hotel bills, and parking tickets, and combine them into a single reimbursement PDF for your finance department.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Identity &amp; KYC Verification</h4>
            <p>Merge photos of your passport, driver license, and utility bill into a single clean PDF required for bank accounts or visa applications.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Student Homework &amp; Assignments</h4>
            <p>Photograph handwritten math equations or essay pages and combine them into one sequential PDF file for Google Classroom or Canvas.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Portfolio &amp; Artwork Catalogs</h4>
            <p>Compile high-resolution photography, sketches, and 3D renderings into a professional portfolio booklet for prospective clients.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/pdf-to-images" class="seo-keyword-pill">PDF to Images</NuxtLink>
            <NuxtLink to="/tools/compress-pdf" class="seo-keyword-pill">Compress PDF</NuxtLink>
            <NuxtLink to="/tools/image-collage" class="seo-keyword-pill">Image Collage Maker</NuxtLink>
            <NuxtLink to="/tools/compress-image" class="seo-keyword-pill">Compress Images</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About Converting Images to PDF</h2>
          <p>Learn how to merge photos, scans, and graphic files into a single PDF document in your browser.</p>
          <div class="faq-decoration" aria-hidden="true">
            <Images :size="42" />
            <span>IMAGES &bull; PDF</span>
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
          <span class="mini-label">NEED TO REDUCE FILE SIZE?</span>
          <h2>Shrink your newly created PDF</h2>
          <p>Optimize image streams and compress your combined PDF file to make emailing and sharing instantaneous.</p>
        </div>
        <NuxtLink to="/tools/compress-pdf" class="primary-button">
          Open Compress PDF <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private image conversion, right in your browser." />
  </div>
</template>
