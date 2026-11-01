<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Combine, Cpu, Download, FileCheck, FileImage, FileSpreadsheet, FileText, Globe, HeartHandshake, ImageDown, Images, Languages, Layers, LayoutGrid, LockKeyhole, Minimize2, Presentation, RotateCw, ScanText, Scissors, ShieldCheck, Sparkles, Stamp, Trash2, Upload, WandSparkles, Zap } from '@lucide/vue';
import { faqSchema, usePageSeo } from '~/composables/usePageSeo';

const shell = ref(null);
let observer;
let mounted = false;

const pageDescription = 'Free, private online tools for Word, PDF, Excel, PowerPoint, and images. Convert PDF to editable Word with Smart OCR in Hindi, Gujarati & English, compress PDFs to custom KB sizes, merge, split, translate, and protect documents with zero file uploads.';

const questions = [
  ['Which file formats and document types can I process with We Make PDF?', 'We Make PDF supports Microsoft Word (.docx), Excel (.xlsx, .csv), PowerPoint (.pptx), PDF (.pdf), and popular image formats including JPG, PNG, and WebP. You can convert between office formats and PDFs, run Multilingual OCR on scanned files, compress file sizes to exact KB limits, merge multiple PDFs, extract text, translate documents, watermark pages, and apply AES-256 encryption without file size limits.'],
  ['How does We Make PDF Smart OCR handle Indian languages like Hindi and Gujarati?', 'We Make PDF features a dedicated WebAssembly-based OCR engine equipped with full Unicode and OpenXML complex script support (Nirmala UI). Unlike standard cloud converters that split matras or output scrambled characters, We Make PDF cleanly recognizes Hindi (हिन्दी), Gujarati (ગુજરાતી), Marathi (मराठी), Bengali (বাংলা), Tamil, Telugu, and English, structuring the text into genuine editable paragraphs.'],
  ['Is We Make PDF truly 100% private? Are my files uploaded to any servers?', 'Yes, 100% private. All conversions, compression algorithms, OCR neural nets, and PDF compilation run directly inside your web browser on your own computer or mobile phone. Your documents and data are never sent across the internet, never saved in a database, and never shared with third parties.'],
  ['Will my fonts, tables, margins, and layout stay the same after conversion?', 'Yes. In PDF to Word conversion, We Make PDF uses intelligent baseline consolidation to group words into flowing paragraphs while preserving headings and table coordinates. In Word to PDF and image conversions, the document layout, page dimensions, and vector typography are faithfully preserved.'],
  ['How do I compress a PDF to under 100KB or 200KB for government job or exam portals?', 'Use our dedicated "Compress PDF" tool and enter your desired target file size in KB or MB (such as 100 KB, 200 KB, or 500 KB). We Make PDF dynamically adjusts raster resolution and stream compression to hit your exact portal requirement while keeping the text crisp and legible.'],
  ['Do I need to install any software, create an account, or pay a subscription?', 'No. We Make PDF is completely free forever. There are no subscriptions, no credit card requirements, no registration forms, no daily limits, and no watermarks placed on your converted files.'],
  ['Can I translate PDF documents while maintaining the original design?', 'Yes! Our built-in "Translate PDF" tool allows you to translate documents between English, Hindi, Spanish, French, and Gujarati while preserving original bounding boxes, columns, and headings.'],
];

usePageSeo({
  title: 'Free Word, PDF & Image Tools Online — 100% Private | We Make PDF',
  description: pageDescription,
  path: '/',
  schemas: [
    ({ siteUrl }) => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${siteUrl}/#website`,
          name: 'We Make PDF',
          alternateName: 'WeMakePDF',
          url: siteUrl,
          description: pageDescription,
          publisher: { '@id': `${siteUrl}/#organization` },
        },
        {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: 'We Make PDF',
          url: siteUrl,
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/brand/wemakepdf-logo.svg`,
          },
        },
      ],
    }),
    () => faqSchema(questions),
  ],
});
const steps = [
  { icon: Upload, number: '01', title: 'Choose a tool.', text: 'Select any of our 29 specialized tools for Word, PDF, Excel, PowerPoint, or images.' },
  { icon: FileText, number: '02', title: 'Drop your file in.', text: 'Select your file up to 20 MB, or drag it into the browser window.' },
  { icon: Download, number: '03', title: 'Instant local download.', text: 'Your file is processed instantly on your device. Download the result with zero wait time.' },
];

function setupReveals() {
  if (!mounted || !shell.value) return;
  observer?.disconnect();
  const elements = [...shell.value.querySelectorAll('[data-reveal]')];
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    elements.forEach(element => element.classList.remove('reveal-pending'));
    return;
  }
  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        entry.target.classList.add('has-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  elements.forEach(element => {
    if (element.classList.contains('has-revealed')) return;
    if (element.getBoundingClientRect().top >= window.innerHeight) {
      element.classList.add('reveal-pending');
      observer.observe(element);
    } else element.classList.add('has-revealed');
  });
}

onMounted(() => {
  mounted = true;
  setupReveals();
});
onBeforeUnmount(() => {
  mounted = false;
  observer?.disconnect();
});
</script>

<template>
  <div ref="shell" class="site-shell">
    <a class="skip-link" href="#main">Skip to content</a>
    <SiteHeader />
    <main id="main">
      <section class="hero-stage">
        <div class="ambient-art" aria-hidden="true"><span class="ambient-orb orb-violet" /><span class="ambient-orb orb-blue" /><span class="ambient-grid" /></div>
        <div class="hero container">
          <div class="hero-copy">
            <div class="eyebrow"><Sparkles :size="13" /> ONE DOCUMENT. A FRESH START.</div>
            <h1>Word &amp; PDF.<br />Ready for<br /><span class="pdf-title">what’s next.</span></h1>
            <p class="hero-description">Your next proposal. Your next opportunity.<br />From Word to PDF. From PDF to Word.<br />Keep your documents moving.</p>
            <div class="hero-actions"><NuxtLink to="/tools" class="primary-button">Explore tools <ArrowUpRight :size="18" /></NuxtLink><a href="#how-it-works" class="quiet-link">See how it works <ArrowRight :size="15" /></a></div>
            <div class="hero-benefits"><span><Check :size="15" /> No sign-up</span><span><Check :size="15" /> Free to use</span><span><Check :size="15" /> Private by design</span></div>
          </div>
          <div class="tool-showcase" aria-label="Available document tools">
            <div class="showcase-glow" aria-hidden="true" />
            <div class="showcase-label"><span>POPULAR TOOLS</span><NuxtLink to="/tools" class="showcase-all-link">All 31 tools <ArrowRight :size="12" /></NuxtLink></div>
            <NuxtLink to="/tools/word-to-pdf" class="showcase-tool word-tool"><span class="showcase-icon"><ToolRealisticIcon name="word" alt="Word to PDF" size="36" /></span><span><b>Word to PDF</b><small>Create a polished PDF from DOCX</small></span><ArrowUpRight :size="19" /></NuxtLink>
            <NuxtLink to="/tools/powerpoint-to-pdf" class="showcase-tool powerpoint-tool"><span class="showcase-icon"><ToolRealisticIcon name="powerpoint" alt="PowerPoint to PDF" size="36" /></span><span><b>PowerPoint to PDF</b><small>Convert PPTX slides to clean PDF</small></span><ArrowUpRight :size="19" /></NuxtLink>
            <NuxtLink to="/tools/excel-to-pdf" class="showcase-tool excel-tool"><span class="showcase-icon"><ToolRealisticIcon name="excel" alt="Excel to PDF" size="36" /></span><span><b>Excel to PDF</b><small>Convert spreadsheets &amp; CSV to PDF</small></span><ArrowUpRight :size="19" /></NuxtLink>
            <NuxtLink to="/tools" class="showcase-more-btn"><span>Explore all 31 document &amp; image tools</span><ArrowRight :size="15" /></NuxtLink>
            <div class="showcase-privacy"><ShieldCheck :size="15" /><span><b>Stays on your device</b><small>No document uploads</small></span></div>
          </div>
        </div>
        <div class="hero-bottom container"><span>A small tool for your next big thing.</span><NuxtLink to="/tools">VIEW ALL TOOLS <ArrowRight :size="13" /></NuxtLink></div>
      </section>

      <section id="how-it-works" class="how-section container">
        <div class="section-intro" data-reveal><span class="mini-label">A LITTLE LESS BUSYWORK</span><h2>From your desk to their inbox.</h2><p>Three easy steps. Then it’s business as usual.</p></div>
        <div class="how-grid">
          <article v-for="(step, index) in steps" :key="step.number" class="how-card" data-reveal :style="{ '--reveal-delay': `${index * 90}ms` }">
            <div class="how-card-top"><span><component :is="step.icon" :size="22" /></span><b>{{ step.number }}</b></div>
            <h3>{{ step.title }}</h3><p>{{ step.text }}</p><span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <section class="privacy-strip container" data-reveal>
        <span class="privacy-icon"><ShieldCheck :size="23" /></span>
        <div><h2>Your documents have places to be.</h2><p>Conversion runs on your device. Your document never leaves your browser.</p></div>
        <span class="privacy-label"><LockKeyhole :size="13" /> No document uploads</span>
      </section>

      <!-- Comprehensive Features & SEO Editorial Guide -->
      <section class="seo-guide-section container" data-reveal>
        <div class="section-intro">
          <span class="mini-label">ALL-IN-ONE DOCUMENT SUITE</span>
          <h2>Professional Document &amp; Image Tools Without the Complexity</h2>
          <p>We Make PDF provides everything you need to convert, organize, compress, protect, and edit documents without installing heavy desktop programs or paying monthly cloud subscriptions.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ScanText :size="24" /></span>
            <h3>PDF to Word with Multilingual OCR</h3>
            <p>Turn scanned and digital PDFs into clean, fully editable Microsoft Word documents (.docx). Equipped with dedicated neural models for Hindi, Gujarati, Marathi, Bengali, Tamil, Telugu, and English.</p>
            <ul>
              <li>Reconstructs flowing paragraphs without clipping</li>
              <li>Preserves complex script matras with Nirmala UI</li>
              <li>Auto-detects titles, question numbers, and legal clauses</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Minimize2 :size="24" /></span>
            <h3>Intelligent PDF &amp; Image Compression</h3>
            <p>Reduce bulky PDF files and high-res images to exact file sizes. Hit strict 100KB, 200KB, or 500KB thresholds required for government job applications, college admissions, and email limits.</p>
            <ul>
              <li>Custom KB and MB target size selector</li>
              <li>Exact Quality mode retains 100% vector sharpness</li>
              <li>Side-by-side visual preview before saving</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Combine :size="24" /></span>
            <h3>Merge, Split &amp; Organize Pages</h3>
            <p>Take complete control over your PDF page structure. Combine multiple reports into one consolidated PDF, split specific page ranges into separate files, delete unwanted pages, or rotate orientations permanently.</p>
            <ul>
              <li>Visual thumbnail drag-and-drop reordering</li>
              <li>Instant page rotation (90&deg;, 180&deg;, 270&deg;)</li>
              <li>Batch page extraction with zero quality loss</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>Enterprise-Grade PDF Security</h3>
            <p>Protect confidential financial statements, legal contracts, and personal records with military-grade AES-256 password encryption, or unlock previously protected files when you have the password.</p>
            <ul>
              <li>AES-128 &amp; AES-256 standard encryption</li>
              <li>Flatten interactive forms to prevent alterations</li>
              <li>Apply custom text or diagonal watermark stamps</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Languages :size="24" /></span>
            <h3>Document Translation &amp; Extraction</h3>
            <p>Break language barriers with in-browser document translation. Translate PDF documents between English, Hindi, Spanish, French, and Gujarati while keeping the layout and typography intact.</p>
            <ul>
              <li>Translates multi-page documents seamlessly</li>
              <li>Copies extracted OCR text directly to clipboard or Word</li>
              <li>Preserves columns, tables, and section headings</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LayoutGrid :size="24" /></span>
            <h3>Office &amp; Image Productivity</h3>
            <p>Convert PowerPoint (.pptx) presentations and Excel (.xlsx, .csv) spreadsheets into clean PDFs, create beautiful photo collages, and convert PDFs to high-resolution JPG or PNG images.</p>
            <ul>
              <li>Crisp slide and spreadsheet rendering</li>
              <li>Side-by-side, stacked, and grid photo collages</li>
              <li>High-DPI PDF page image export</li>
            </ul>
          </article>
        </div>

        <!-- Comparison Matrix -->
        <div class="seo-comparison-card">
          <h3>We Make PDF vs. Traditional Cloud PDF Services</h3>
          <p>Why security-conscious professionals and users choose We Make PDF over legacy upload-based converters.</p>
          <div class="seo-table-wrap">
            <table class="seo-comparison-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>We Make PDF</th>
                  <th>Cloud Upload Websites</th>
                  <th>Paid Desktop Software</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Data Privacy</td>
                  <td><span class="seo-badge-win">100% In-Browser (Zero Upload)</span></td>
                  <td><span class="seo-badge-loss">Sent to Remote Cloud Servers</span></td>
                  <td>Local Installation</td>
                </tr>
                <tr>
                  <td>Indic Language OCR (Hindi/Gujarati)</td>
                  <td><span class="seo-badge-win">Full Support (Nirmala UI)</span></td>
                  <td><span class="seo-badge-loss">Corrupted Fonts / Scrambled Text</span></td>
                  <td>Requires Expensive Add-ons</td>
                </tr>
                <tr>
                  <td>Pricing</td>
                  <td><span class="seo-badge-win">100% Free Forever</span></td>
                  <td><span class="seo-badge-loss">$15 - $25 / month</span></td>
                  <td><span class="seo-badge-loss">$120+ One-time Fee</span></td>
                </tr>
                <tr>
                  <td>Watermarks &amp; Restrictions</td>
                  <td><span class="seo-badge-win">No Watermarks, No Limits</span></td>
                  <td><span class="seo-badge-loss">Restricted on Free Tier</span></td>
                  <td>License Key Restricted</td>
                </tr>
                <tr>
                  <td>Account Creation</td>
                  <td><span class="seo-badge-win">No Sign-up or Email Needed</span></td>
                  <td><span class="seo-badge-loss">Sign-up Forced</span></td>
                  <td>Account Required</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Quick Links Pill Cloud -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">QUICK ACCESS TO POPULAR TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/pdf-to-word" class="seo-keyword-pill">PDF to Word OCR</NuxtLink>
            <NuxtLink to="/tools/word-to-pdf" class="seo-keyword-pill">Word to PDF</NuxtLink>
            <NuxtLink to="/tools/compress-pdf" class="seo-keyword-pill">Compress PDF</NuxtLink>
            <NuxtLink to="/tools/merge-pdf" class="seo-keyword-pill">Merge PDF</NuxtLink>
            <NuxtLink to="/tools/split-pdf" class="seo-keyword-pill">Split PDF</NuxtLink>
            <NuxtLink to="/tools/excel-to-pdf" class="seo-keyword-pill">Excel to PDF</NuxtLink>
            <NuxtLink to="/tools/powerpoint-to-pdf" class="seo-keyword-pill">PowerPoint to PDF</NuxtLink>
            <NuxtLink to="/tools/extract-ocr" class="seo-keyword-pill">Extract OCR Text</NuxtLink>
            <NuxtLink to="/tools/translate-pdf" class="seo-keyword-pill">Translate PDF</NuxtLink>
            <NuxtLink to="/tools/protect-pdf" class="seo-keyword-pill">Protect PDF</NuxtLink>
            <NuxtLink to="/tools/unlock-pdf" class="seo-keyword-pill">Unlock PDF</NuxtLink>
            <NuxtLink to="/tools/watermark-pdf" class="seo-keyword-pill">Watermark PDF</NuxtLink>
            <NuxtLink to="/tools/create-pdf" class="seo-keyword-pill">Create PDF</NuxtLink>
            <NuxtLink to="/tools/image-collage" class="seo-keyword-pill">Make Image Collage</NuxtLink>
          </div>
        </div>
      </section>

      <section id="questions" class="faq-section container">
        <div class="faq-intro" data-reveal>
          <span class="mini-label">BEFORE YOU HIT CONVERT</span><h2>Good questions.<br />Straight answers.</h2><p>A few things worth knowing about your document.</p>
          <div class="faq-decoration" aria-hidden="true"><FileText :size="42" /><span>W <ArrowRight :size="18" /> PDF</span></div>
        </div>
        <div class="faq-list" data-reveal>
          <details v-for="[question, answer] in questions" :key="question"><summary>{{ question }}<ChevronDown :size="18" /></summary><div class="faq-answer"><p>{{ answer }}</p></div></details>
        </div>
      </section>

      <section class="closing-cta container" data-reveal>
        <div><span class="mini-label">ONE LESS THING ON YOUR LIST</span><h2>Ready when you are.</h2><p>Your document tools are waiting on one focused page.</p></div>
        <NuxtLink to="/tools" class="primary-button">Open tools <ArrowUpRight :size="18" /></NuxtLink><div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>
    <SiteFooter message="One simple tool. One less task." />
  </div>
</template>
