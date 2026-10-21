<script setup>
import { ArrowRight, Check, ChevronDown, Compass, FileCheck, Layers, RotateCcw, RotateCw, ShieldCheck, Sparkles, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/rotate-pdf', '/tools/rotate-pages', '/rotate-pages'],
});

const pageTitle = 'Rotate PDF Pages Online — Free & Permanent Page Orientation | Toolifybox';
const pageDescription = 'Rotate PDF pages online for free. Fix upside-down or sideways pages, rotate individual pages or the entire document 90, 180, or 270 degrees, and save permanently in your browser without uploading files.';

const steps = [
  { number: '01', title: 'Choose a PDF Document', desc: 'Select or drag-and-drop any PDF file up to 20 MB from your desktop, phone, or tablet.' },
  { number: '02', title: 'Rotate Specific or All Pages', desc: 'Turn individual pages 90° clockwise, counter-clockwise, or 180°, or rotate all pages together with batch buttons.' },
  { number: '03', title: 'Save & Download Reoriented PDF', desc: 'Download your permanently reoriented PDF in seconds with crystal-clear resolution and untouched text formatting.' },
];

const faqs = [
  ['Will rotating a PDF permanently save the new orientation?', 'Yes. Toolifybox modifies the internal page rotation dictionary (/Rotate metadata parameter) inside the PDF file structure. When you download the resulting PDF, it opens in the correct orientation in any PDF reader, browser, or printer.'],
  ['Can I rotate only a single sideways page without affecting the rest of the document?', 'Yes! You have granular per-page rotation controls. You can rotate single landscape tables or sideways invoice pages 90 degrees while keeping every other portrait page in its original position.'],
  ['Does rotating a PDF reduce text clarity or compress images?', 'Not at all. Toolifybox applies pure lossless transformation. Because it adjusts the orientation matrix rather than re-rendering or re-encoding visual elements, your document retains 100% of its original resolution, text vectors, and embedded font definitions.'],
  ['Are my confidential files uploaded to any external server?', 'Never. All PDF parsing and orientation adjustments run 100% client-side in your web browser memory using WebAssembly. Your documents never travel over the internet, ensuring strict privacy and confidentiality.'],
  ['Can I rotate PDFs scanned from mobile scanners or photocopiers?', 'Yes. Scanned PDFs often have upside-down or alternating portrait/landscape pages. You can preview every thumbnail visually in our interactive workspace and correct inverted pages in a single click.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/rotate-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Rotate PDF', path: '/tools/rotate-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/rotate-pdf',
      'Rotate PDF Pages',
      pageDescription,
      ['Visual interactive page thumbnails', 'Live rotation preview', 'Batch rotate left, right or 180 degrees', 'Individual page rotation controls', 'Lossless dictionary modification', 'Zero server uploads', '100% private in-browser orientation']
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Rotate PDF Pages Online Permanently', pageDescription, steps, siteUrl, '/tools/rotate-pdf'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container rotate-pdf-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> DOCUMENT ORIENTATION</span>
          <h1>Rotate PDF<br /><span>pages easily.</span></h1>
          <p>Fix scanned sheets, sideways receipts, inverted contract pages, or upside-down presentations. Preview every page live, rotate specific sheets or the whole file, and download clean PDFs without uploading to any remote server.</p>
          <ul class="tools-points">
            <li>
              <span><Check :size="14" /></span>
              <div>
                <b>Live Visual Previews</b>
                <small>See thumbnails rotate in real time as you click, making orientation adjustments effortless.</small>
              </div>
            </li>
            <li>
              <span><RotateCw :size="14" /></span>
              <div>
                <b>Individual or Batch Controls</b>
                <small>Rotate single pages 90° or 180°, or rotate every page across the whole document at once.</small>
              </div>
            </li>
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <b>Lossless &amp; Instant</b>
                <small>Rotation updates the PDF page dictionary directly without recompressing images or fonts.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>100% Private in Browser</b>
                <small>Files stay in your device memory. No confidential records or documents are ever uploaded.</small>
              </div>
            </li>
          </ul>
          <div class="tools-tip">
            <RotateCcw :size="18" />
            <p>
              <b>Pro Tip</b><br />
              Need to rotate a landscape table or sideways invoice? Just click the 90° right arrow on that page, while keeping all other portrait pages untouched.
            </p>
          </div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Rotate PDF Ready</div>
          <RotatePdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero server uploads.</div>
        </div>
      </section>

      <section class="how-section container" id="how-it-works">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Rotate your PDF in three easy steps</h2>
          <p>Quickly adjust page orientation with live visual feedback.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><RotateCw :size="22" /></span>
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
          <span class="mini-label">PRECISION ORIENTATION</span>
          <h2>Why Permanent PDF Page Rotation Matters</h2>
          <p>Rotating a page in a desktop viewer often only rotates your screen view temporarily without altering the underlying file. Toolifybox updates the document's true coordinate matrix permanently.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Compass :size="24" /></span>
            <h3>Native /Rotate Metadata Updates</h3>
            <p>PDF specifications define page orientation using an internal rotation angle attribute (0°, 90°, 180°, or 270°). We rewrite this dictionary key directly so every PDF viewer, mobile device, and commercial printing press renders it identically.</p>
            <ul>
              <li>Lossless orientation changes with zero visual artifacting</li>
              <li>Embedded font structures and vector line art remain crisp</li>
              <li>File size remains lean with zero re-encoding overhead</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Layers :size="24" /></span>
            <h3>Independent Page Control</h3>
            <p>Scanned packages, multi-page financial audits, and technical blueprints frequently mix portrait tables with wide landscape schematics. Fix specific pages without disrupting the flow of the rest.</p>
            <ul>
              <li>Rotate single pages 90 degrees clockwise or counter-clockwise</li>
              <li>Flip inverted pages 180 degrees upside-down</li>
              <li>Batch apply 90° rotation to all pages in one click</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ShieldCheck :size="24" /></span>
            <h3>100% In-Browser Privacy</h3>
            <p>Unlike cloud PDF services that transfer your confidential legal contracts or bank statements to remote servers, Toolifybox computes every rotation locally in your web browser memory.</p>
            <ul>
              <li>Zero telemetry, zero server storage, zero third-party access</li>
              <li>Works offline once loaded in your browser session</li>
              <li>Full compliance with strict privacy and enterprise data guidelines</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Common Scenarios for PDF Rotation</h2>
          <p>Eliminate crooked and sideways pages across everyday workflow documents.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Inverted Mobile Scans</h4>
            <p>Receipts, identity cards, and school assignments photographed or scanned upside-down via phone cameras can be aligned in seconds.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Financial Spreadsheets &amp; Blueprints</h4>
            <p>Ensure wide quarterly budget tables and architectural drawings are turned to horizontal landscape view for effortless reading.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Legal Briefs &amp; Court Filings</h4>
            <p>Meet strict court clerk filing specifications requiring all pages to be oriented uniformly in standard portrait view before submission.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Print Preparation</h4>
            <p>Prevent expensive printing mistakes where alternating pages print upside-down on dual-sided office laser printers.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED PDF TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/split-pdf" class="seo-keyword-pill">Split PDF Pages</NuxtLink>
            <NuxtLink to="/tools/remove-pdf-pages" class="seo-keyword-pill">Remove PDF Pages</NuxtLink>
            <NuxtLink to="/tools/merge-pdf" class="seo-keyword-pill">Merge PDF Files</NuxtLink>
            <NuxtLink to="/tools/compress-pdf" class="seo-keyword-pill">Compress PDF</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About Rotating PDFs</h2>
          <p>Learn how our browser-based PDF page orientation tool works without uploading files.</p>
          <div class="faq-decoration" aria-hidden="true">
            <RotateCw :size="42" />
            <span>PDF &bull; ROTATE</span>
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
          <span class="mini-label">LOOKING TO ORGANIZE FURTHER?</span>
          <h2>Delete unwanted pages or rearrange your document</h2>
          <p>Clean up blank sheets, cover pages, and redundant sections with our fast page remover.</p>
        </div>
        <NuxtLink to="/tools/remove-pdf-pages" class="primary-button">
          Open Remove PDF Pages <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private PDF orientation and page rotation, right in your browser." />
  </div>
</template>

