<script setup>
import { ArrowRight, Check, ChevronDown, Cpu, FileCheck, FileText, Gauge, Layers, LockKeyhole, Minimize2, ShieldCheck, Sparkles, Target, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageTitle = 'Compress PDF Online — Reduce PDF File Size Privately | Toolifybox';
const pageDescription = 'Compress PDF files online for free while preserving clarity. Reduce PDF to 100KB, 200KB, 500KB or custom MB targets for email attachments and portal uploads. 100% private in-browser compression.';

const steps = [
  { number: '01', title: 'Upload & Preview PDF', desc: 'Select any PDF file up to 100 MB. Preview all pages and check the initial file size before compression.' },
  { number: '02', title: 'Set Quality or Target Size', desc: 'Choose Exact Quality (lossless vector streams), Balanced, Smallest File, or set an exact KB/MB target limit.' },
  { number: '03', title: 'Compare and Download', desc: 'Review the compressed size reduction percentage and download your optimized PDF directly without watermarks.' },
];

const faqs = [
  ['How can I compress a PDF to less than 100KB or 200KB for government portals?', 'Select our "Custom Target" mode and enter your required maximum limit (e.g., 100 KB or 200 KB). Toolifybox dynamically calculates the optimal resolution and image quality to meet your target without rendering the text unreadable.'],
  ['Will my PDF text remain clear and readable after compression?', 'Yes. In "Exact Quality" mode, your fonts, vector paths, links, and text streams remain completely untouched—only duplicate metadata and uncompressed streams are optimized. In visual modes, intelligent downsampling preserves high contrast on all letterforms.'],
  ['Are my confidential PDF documents uploaded to a remote server?', 'Never. Toolifybox performs all PDF stream decompression, image downsampling, and repackaging locally inside your web browser. Your private documents never leave your computer or smartphone.'],
  ['Is there a fee or daily limit on how many PDFs I can compress?', 'No. Toolifybox is 100% free with unlimited compressions, no account sign-up, no hidden fees, and zero watermarks on your downloaded documents.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/compress-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Compress PDF', path: '/tools/compress-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/compress-pdf',
      'Compress PDF Online with Custom Target Limits',
      pageDescription,
      [
        'Lossless and perceptual PDF compression',
        'Custom target file size mode (100KB, 200KB, 500KB, 1MB)',
        'Full PDF page preview before download',
        '100% private in-browser processing',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Compress PDF File Size Online', pageDescription, steps, siteUrl, '/tools/compress-pdf'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <section class="tools-layout container compress-pdf-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> PRECISION SIZE OPTIMIZER</span>
          <h1>Compress PDF without<br /><span>guessing about quality.</span></h1>
          <p>Preview every page, choose how much document structure or file size to preserve, and compare the result before downloading. Perfect for job portals, university admissions, and email size limits.</p>

          <ul class="tools-points">
            <li><span><ShieldCheck :size="14" /></span><div><b>Exact Quality Mode</b><small>Preserves selectable text, links, vectors and page content.</small></div></li>
            <li><span><Target :size="14" /></span><div><b>Custom KB or MB Target</b><small>Enter the exact maximum size you need (e.g. 100 KB, 200 KB).</small></div></li>
            <li><span><Gauge :size="14" /></span><div><b>Controlled Compression</b><small>Balanced and smallest-file modes keep the visual layout clear.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>100% Private Processing</b><small>Your PDF is compressed locally in browser memory.</small></div></li>
          </ul>

          <div class="tools-tip">
            <Check :size="18" />
            <p><b>Use Exact quality for legal &amp; corporate contracts</b><br />Balanced, smallest-file and custom-target modes downsample raster elements for maximum compression.</p>
          </div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Compress PDF Ready</div>
          <CompressPdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Compressed locally on your device. Zero PDF uploads.</div>
        </div>
      </section>

      <!-- Step-by-Step Guide -->
      <section class="how-section container" id="how-it-works">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Quality and File Size Stay Under Your Control</h2>
          <p>Every compression choice explains exactly what it preserves and how much space it saves.</p>
        </div>

        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><Minimize2 :size="22" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Rich SEO Educational Guide -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">ADVANCED PDF COMPRESSION</span>
          <h2>How Toolifybox Shrinks PDF Files Without Sacrificing Legibility</h2>
          <p>Understanding how PDF compression works empowers you to choose the right balance between file size and image clarity.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Layers :size="24" /></span>
            <h3>Flate Stream Streamlining</h3>
            <p>PDF documents often carry redundant internal metadata, unused font descriptors, and uncompressed stream tables. Our exact compression strips ghost objects while retaining 100% vector fidelity.</p>
            <ul>
              <li>Maintains crystal-clear vector text at any zoom</li>
              <li>Keeps interactive links and form inputs clickable</li>
              <li>Reduces file size by up to 40% with zero visual change</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Target :size="24" /></span>
            <h3>Custom KB &amp; MB Target Limits</h3>
            <p>Most job applications, government portals (such as UPSC, SSC, state boards), and visa portals enforce strict file size caps like &ldquo;Max 100KB&rdquo; or &ldquo;Max 200KB&rdquo;. You can specify your target size directly.</p>
            <ul>
              <li>Hit exact upload portal file size criteria</li>
              <li>Adaptive resolution tuning prevents over-compression</li>
              <li>Live preview confirms legibility before submitting</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>Zero Cloud Uploads</h3>
            <p>Other compression services upload your private financial statements, identity cards, and tax documents to remote cloud queues. Toolifybox runs entirely on your device with WebAssembly.</p>
            <ul>
              <li>100% private on your smartphone or PC</li>
              <li>No file copies created on our servers</li>
              <li>Works smoothly even on slow or limited connections</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">COMMON USE CASES</span>
          <h2>When to Use PDF Compression</h2>
          <p>Save storage and streamline file sharing across multiple channels.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Email Attachments (Gmail, Outlook)</h4>
            <p>Email providers cap attachments at 20–25 MB. Shrink bulky presentations, catalogs, and contracts so they land smoothly in client inboxes.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Government &amp; Admission Portals</h4>
            <p>Meet strict 100KB, 200KB, or 500KB limits required for passports, visa applications, entrance exams, and employment forms.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Website &amp; Mobile Downloads</h4>
            <p>Reduce bandwidth costs and speed up page load times by optimizing downloadable PDF brochures, whitepapers, and eBooks.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Mobile Storage &amp; WhatsApp Sharing</h4>
            <p>Send documents quickly over WhatsApp, Telegram, or mobile networks without exhausting mobile data or cloud drive space.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED PDF TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/pdf-to-word" class="seo-keyword-pill">PDF to Word OCR</NuxtLink>
            <NuxtLink to="/tools/word-to-pdf" class="seo-keyword-pill">Word to PDF</NuxtLink>
            <NuxtLink to="/tools/merge-pdf" class="seo-keyword-pill">Merge PDF Files</NuxtLink>
            <NuxtLink to="/tools/split-pdf" class="seo-keyword-pill">Split PDF Pages</NuxtLink>
            <NuxtLink to="/tools/protect-pdf" class="seo-keyword-pill">Protect PDF with Password</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About PDF Compression</h2>
          <p>Learn how to select the best compression profile and hit exact file size requirements.</p>
          <div class="faq-decoration" aria-hidden="true">
            <Minimize2 :size="42" />
            <span>PDF &darr; SIZE</span>
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

      <!-- Closing CTA Banner -->
      <section class="closing-cta container">
        <div>
          <span class="mini-label">LOOKING FOR MORE TOOLS?</span>
          <h2>Need to merge multiple compressed PDFs?</h2>
          <p>Combine multiple PDF documents into a single organized file in seconds.</p>
        </div>
        <NuxtLink to="/tools/merge-pdf" class="primary-button">
          Open Merge PDF <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private PDF compression with clear quality controls." />
  </div>
</template>
