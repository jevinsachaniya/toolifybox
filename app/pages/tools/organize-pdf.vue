<script setup>
import {
  ArrowDownUp,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Layers,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/organize-pdf', '/reorder-pdf', '/sort-pdf', '/arrange-pdf'],
});

const pageTitle = 'Organize PDF Pages Free — Rearrange, Sort & Rotate PDF Online | We Make PDF';
const pageDescription = 'Organize, rearrange, reorder, rotate, delete, and duplicate PDF pages online for free. Drag and drop pages, combine multiple PDFs, insert blank pages, and sort with 100% private in-browser processing.';

const steps = [
  { number: '01', title: 'Upload One or Multiple PDFs', desc: 'Select or drag-and-drop any PDF file up to 20 MB, or add multiple PDF files to organize together.' },
  { number: '02', title: 'Drag, Reorder & Rotate Pages', desc: 'Visually drag and drop thumbnails to rearrange page order, rotate orientations, duplicate pages, or delete unwanted sheets.' },
  { number: '03', title: 'Save & Download Organized PDF', desc: 'Click "Save & Download" to compile your reorganized PDF document locally with zero quality loss and instant client-side privacy.' },
  { number: '04', title: 'Share or Store Securely', desc: 'Your newly structured PDF is ready for presentations, contracts, portfolio submissions, or archival.' },
];

const faqs = [
  ['How do I rearrange pages in a PDF using We Make PDF?', 'Simply upload your PDF, and our tool renders interactive visual thumbnails for every page. You can drag and drop any thumbnail card to move it to a new position, or use the quick arrow buttons to shift pages left, right, first, or last.'],
  ['Can I combine pages from multiple PDF files into one organized document?', 'Yes! After uploading your first file, click "Add PDFs" to append more documents. You can freely interleave, sort, and rearrange pages across all uploaded PDF files into a single consolidated document.'],
  ['Can I rotate, duplicate, or delete individual pages while organizing?', 'Absolutely. Each page card features dedicated quick action buttons to rotate 90 degrees clockwise or counter-clockwise, duplicate the page, preview in high resolution, or remove it from the final document.'],
  ['Can I insert a clean blank page between existing pages?', 'Yes! Click "+ Add Blank Page" to insert an A4 blank page anywhere in your document, perfect for separator sheets, blank backsides, or section dividers.'],
  ['Does organizing a PDF reduce text clarity or compress pictures?', 'Not at all. We Make PDF copies the exact vector streams, embedded fonts, annotations, and original image assets directly using pdf-lib without re-compressing them, maintaining 100% crystal-clear original fidelity.'],
  ['Are my confidential documents uploaded to any remote server?', 'Never. All PDF parsing, thumbnail generation, reordering, and file compilation run 100% client-side in your web browser memory. Your documents never leave your computer or phone.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/organize-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Organize PDF', path: '/tools/organize-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/organize-pdf',
      'Organize PDF Online Free',
      pageDescription,
    ),
    ({ siteUrl }) => howToSchema(
      'How to Organize PDF Pages Online for Free',
      pageDescription,
      steps,
      siteUrl,
      '/tools/organize-pdf',
    ),
    () => faqSchema(faqs),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to organize tool</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <section class="tools-layout container">
        <div class="tools-hero">
          <span class="eyebrow"><Sparkles :size="13" /> VISUAL PAGE ARRANGER &amp; ORGANIZER</span>
          <h1>Organize &amp; rearrange PDF pages<br /><span>instantly in your browser.</span></h1>
          <p>Reorder, rotate, duplicate, delete, and combine PDF pages with smooth drag-and-drop. Insert blank pages, merge multiple documents, and download your perfectly arranged PDF with 100% in-browser privacy.</p>
        </div>

        <div id="converter" class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Page Organizer Ready</div>
          <OrganizePdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero document uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><ArrowDownUp :size="14" /></span>
              <div>
                <b>Drag &amp; Drop Reordering</b>
                <small>Smoothly move pages into any custom sequence with intuitive visual feedback.</small>
              </div>
            </li>
            <li>
              <span><RotateCw :size="14" /></span>
              <div>
                <b>Per-Page &amp; Bulk Rotation</b>
                <small>Rotate individual sideways pages or orient all pages together in 90° increments.</small>
              </div>
            </li>
            <li>
              <span><Copy :size="14" /></span>
              <div>
                <b>Duplicate &amp; Insert Blank Pages</b>
                <small>Duplicate any existing page or insert fresh blank divider sheets anywhere.</small>
              </div>
            </li>
            <li>
              <span><Trash2 :size="14" /></span>
              <div>
                <b>Selective Page Removal</b>
                <small>Delete single or multiple unwanted pages with one click before downloading.</small>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <ArrowDownUp :size="18" />
            <p>
              <b>Pro Tip</b>
              <br />
              Need to combine pages from another file? Click "Add PDFs" to append more documents and interleave their pages anywhere into your current sequence.
            </p>
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Organize your PDF in four simple steps</h2>
          <p>Reorder, rotate, combine, and clean up PDF pages visually with instant preview.</p>
        </div>
        <div class="how-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span>
                <ArrowDownUp :size="22" />
              </span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Educational Guide -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">VISUAL PDF WORKFLOW</span>
          <h2>Total Control Over Your Document Structure</h2>
          <p>
            Whether reordering legal briefs, removing blank pages, or combining reports, We Make PDF gives you complete visual freedom with zero data uploads.
          </p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon">
              <Layers :size="24" />
            </span>
            <h3>Lossless Page Manipulation</h3>
            <p>
              We Make PDF operates directly on the underlying PDF syntax streams using WebAssembly and pdf-lib. Moving, rotating, or duplicating pages does not rasterize your vector fonts, form fields, or high-res photography.
            </p>
            <ul>
              <li>Preserves embedded TrueType and OpenType fonts</li>
              <li>Retains vector lines, tables, and bookmarks</li>
              <li>Zero lossy recompression or DPI degradation</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon">
              <Zap :size="24" />
            </span>
            <h3>Multi-Document Merging &amp; Staging</h3>
            <p>
              Don't bounce between different single-purpose tools. Seamlessly append additional PDFs, insert blank divider sheets, reorder everything visually, and export one consolidated document.
            </p>
            <ul>
              <li>Append multiple PDF files into one unified workspace</li>
              <li>Insert blank A4 divider pages on the fly</li>
              <li>Batch rotate all or selected sheets simultaneously</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon">
              <ShieldCheck :size="24" />
            </span>
            <h3>100% In-Browser Privacy &amp; Compliance</h3>
            <p>
              Unlike cloud converters that transmit confidential legal contracts, medical charts, and financial records over the internet, our engine runs 100% inside your browser's sandboxed memory.
            </p>
            <ul>
              <li>Zero server uploads, zero remote storage, zero tracking</li>
              <li>Runs entirely client-side on your desktop, laptop, or tablet</li>
              <li>Compliant with GDPR, HIPAA, and internal enterprise data policies</li>
            </ul>
          </article>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">
            EXPLORE RELATED PDF TOOLS
          </span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/split-pdf" class="seo-keyword-pill">
              Split PDF Pages
            </NuxtLink>
            <NuxtLink to="/tools/merge-pdf" class="seo-keyword-pill">
              Merge PDF Files
            </NuxtLink>
            <NuxtLink to="/tools/rotate-pdf" class="seo-keyword-pill">
              Rotate PDF Pages
            </NuxtLink>
            <NuxtLink to="/tools/remove-pdf-pages" class="seo-keyword-pill">
              Remove PDF Pages
            </NuxtLink>
            <NuxtLink to="/tools/compress-pdf" class="seo-keyword-pill">
              Compress PDF
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Frequently Asked Questions -->
      <section class="faq-section container">
        <div class="section-intro">
          <span class="mini-label">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Everything you need to know about PDF Organizing</h2>
          <p>Common questions answered about reordering, rotating, and combining PDF pages in your browser.</p>
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

      <!-- Closing CTA -->
      <section class="closing-cta container">
        <div>
          <h3>Need to merge or split documents instead?</h3>
          <p>Explore our full collection of 100% private, client-side PDF and document utilities.</p>
        </div>
        <NuxtLink class="primary-button" to="/tools">
          Explore All Tools <ArrowRight :size="16" />
        </NuxtLink>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

