<script setup>
import { ArrowRight, Check, ChevronDown, Cpu, Files, Layers, LockKeyhole, Scissors, ShieldCheck, Sparkles, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageTitle = 'Split PDF Online — Separate PDF Pages Free & Privately | Toolifybox';
const pageDescription = 'Split a PDF online at exact page positions with thumbnail previews. Extract specific page ranges or separate multi-page documents into individual files with 100% private in-browser processing.';

const steps = [
  { number: '01', title: 'Upload & Preview PDF', desc: 'Select any PDF file up to 20 MB and inspect high-resolution thumbnail previews for every page.' },
  { number: '02', title: 'Mark Split Cut Points', desc: 'Click the split marker after any page where a new document should start. Live range labels update instantly.' },
  { number: '03', title: 'Download Split Parts', desc: 'Download the split PDF files individually or save all extracted documents together in a single ZIP file.' },
];

const faqs = [
  ['Will splitting a PDF reduce its visual clarity or remove text?', 'No. Toolifybox extracts the underlying vector content streams, fonts, and images directly without re-rasterizing them. The output parts retain 100% of their original visual quality.'],
  ['Can I extract only one or two specific pages from a large PDF?', 'Yes! You can mark split points before and after the pages you need, or use our "Remove PDF Pages" tool to quickly delete unneeded pages.'],
  ['Are my confidential files uploaded to any servers?', 'Never. All PDF splitting operations occur entirely inside your browser memory via WebAssembly. No documents are transferred or stored externally.'],
  ['Is there a fee or page limit for splitting documents?', 'Toolifybox is 100% free with no hidden charges, no account creation, no page limits, and zero watermarks.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/split-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Split PDF', path: '/tools/split-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/split-pdf',
      'Split PDF by Pages with Visual Preview',
      pageDescription,
      [
        'Visual page-by-page thumbnail inspection',
        'Multiple custom split cut points',
        'Lossless vector page extraction',
        'ZIP archive and individual file downloads',
        '100% private client-side browser processing',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Split PDF Pages Online', pageDescription, steps, siteUrl, '/tools/split-pdf'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <section class="tools-layout container split-pdf-layout">
    <div class="tools-hero">
      <span class="eyebrow"><Sparkles :size="13" /> SPLIT EXACTLY WHERE YOU NEED</span>
          <h1>Split one PDF into<br /><span>clear, ordered parts.</span></h1>
          <p>Preview every page and choose each exact point where the next PDF should begin. Your original page quality, fonts, and vector graphics stay completely intact.</p>
    </div>

    <div class="tools-converter-wrap">
      <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Split PDF Ready</div>
          <SplitPdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Split locally on your device. Zero PDF uploads.</div>
    </div>

    <div class="tools-details-below">
      <ul class="tools-points">
            <li><span><Scissors :size="14" /></span><div><b>Multiple Split Points</b><small>Split once or create several custom page ranges in one run.</small></div></li>
            <li><span><Files :size="14" /></span><div><b>Preview Every Page</b><small>See the complete document and live output ranges before splitting.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>Private and Lossless</b><small>Original PDF pages are copied locally without image conversion.</small></div></li>
          </ul>
      
      <div class="tools-tip">
            <Check :size="18" />
            <p><b>Example</b><br />Select “Split after page 3” and “Split after page 7” to create pages 1–3, 4–7 and 8–end.</p>
          </div>
    </div>
  </section>

      <!-- Step-by-Step Guide -->
      <section class="how-section container" id="how-it-works">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>You Decide Where Every PDF Begins</h2>
          <p>Visual split controls make page ranges clear and verifiable before downloading.</p>
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

      <!-- Educational Guide Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">PRECISION PAGE EXTRACTION</span>
          <h2>Lossless PDF Splitting with Exact Visual Control</h2>
          <p>Large multi-page PDF documents often contain only a few pages you actually need. Toolifybox lets you separate chapters, contracts, or individual certificates in seconds.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Layers :size="24" /></span>
            <h3>Native Lossless Stream Splitting</h3>
            <p>Unlike basic tools that render pages into JPEG images before saving, Toolifybox extracts pure PDF content dictionaries, retaining sharp vector paths, searchable text, and high-res imagery.</p>
            <ul>
              <li>100% searchable and selectable text preserved</li>
              <li>Keeps original page dimensions and rotation angles</li>
              <li>Preserves embedded forms, fonts, and annotations</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Files :size="24" /></span>
            <h3>Interactive Thumbnail Range Selector</h3>
            <p>Never guess page numbers again. Our interactive grid shows full-page thumbnails so you can visually verify where chapters, invoices, or sections start and finish.</p>
            <ul>
              <li>Live preview of all output page ranges</li>
              <li>Add or remove split cuts with a single click</li>
              <li>Instant ZIP download for multi-file exports</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>Confidential In-Browser Security</h3>
            <p>Corporate proposals, student transcripts, and legal briefs should never be transmitted to remote cloud queues. With Toolifybox, all PDF page separation runs locally on your computer.</p>
            <ul>
              <li>Zero data uploaded across the internet</li>
              <li>Compliant with enterprise data protection guidelines</li>
              <li>Zero file storage, logs, or third-party tracking</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Use Cases -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">POPULAR USE CASES</span>
          <h2>When Should You Split a PDF?</h2>
          <p>Streamline document sharing and extract only the relevant portions of large files.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Extracting Contracts &amp; Invoices</h4>
            <p>Pull out specific vendor invoices or signed signature pages from massive multi-page billing statements for accounting records.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Academic Chapters &amp; Syllabi</h4>
            <p>Split hefty textbooks, research papers, and course syllabi into bite-sized chapters for students and reading groups.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Government Portals &amp; ID Proofs</h4>
            <p>Separate scanned passport pages, tax filings, or utility bills from large bundled records to meet portal upload requirements.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Meeting Slides &amp; Handouts</h4>
            <p>Break company slide presentations into individual department decks for targeted client presentations.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED PDF TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/merge-pdf" class="seo-keyword-pill">Merge PDF Files</NuxtLink>
            <NuxtLink to="/tools/remove-pdf-pages" class="seo-keyword-pill">Remove PDF Pages</NuxtLink>
            <NuxtLink to="/tools/compress-pdf" class="seo-keyword-pill">Compress PDF</NuxtLink>
            <NuxtLink to="/tools/pdf-to-word" class="seo-keyword-pill">Convert PDF to Word</NuxtLink>
            <NuxtLink to="/tools/protect-pdf" class="seo-keyword-pill">Protect PDF</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About Splitting PDFs</h2>
          <p>Get answers to common questions about page cut points, output quality, and downloading split parts.</p>
          <div class="faq-decoration" aria-hidden="true">
            <Scissors :size="42" />
            <span>PDF &divide; PARTS</span>
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
          <span class="mini-label">NEED TO COMBINE FILES INSTEAD?</span>
          <h2>Merge multiple PDFs into one document</h2>
          <p>Use our dedicated Merge PDF tool to combine separate files with complete visual control.</p>
        </div>
        <NuxtLink to="/tools/merge-pdf" class="primary-button">
          Open Merge PDF <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private PDF splitting with exact page control." />
  </div>
</template>
