<script setup>
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Cpu, FileCheck, FileText, Globe, Layers, LockKeyhole, ShieldCheck, Sparkles, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageTitle = 'Word to PDF Converter — Free, Fast & Private Online | We Make PDF';
const pageDescription = 'Convert Word DOCX documents to high-resolution, print-ready PDF files online for free. Preserves document formatting, fonts, tables, and images with 100% private in-browser conversion. No sign-up or watermark.';

const steps = [
  { number: '01', title: 'Select Word Document', desc: 'Choose any .docx Word file up to 20 MB from your computer, phone, or drag and drop into the converter.' },
  { number: '02', title: 'Local Browser Compilation', desc: 'We Make PDF processes the document elements, typography, and page structure locally in your browser memory.' },
  { number: '03', title: 'Download Pristine PDF', desc: 'Download your finalized, publication-ready PDF instantly. Retains layout, page numbering, and margins perfectly.' },
];

const faqs = [
  ['Will my fonts, margins, and document formatting change?', 'We Make PDF renders your document layout, preserving margins, standard fonts, paragraphs, and inline graphics so your PDF looks identical to your original Word file across all operating systems.'],
  ['Are my confidential files uploaded or saved on any server?', 'No. We Make PDF is built on a 100% private client-side architecture. Your DOCX file is parsed and compiled inside your web browser. No document data is ever sent to or stored on our servers.'],
  ['Is there a fee, trial period, or watermark added to the PDF?', 'None whatsoever. We Make PDF is completely free forever. There are no subscriptions, no credit card requirements, no hidden limits, and no branding or watermarks placed on your PDF.'],
  ['Can I convert multiple pages or documents with tables and images?', 'Yes. We Make PDF easily compiles multi-page Word documents including headers, footers, bullet lists, tables, and embedded JPEG/PNG images into a unified multi-page PDF.'],
  ['What should I do if I need to edit the PDF later?', 'You can convert your PDF back into an editable Microsoft Word document anytime using our dedicated We Make PDF PDF to Word tool with built-in Smart OCR.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/word-to-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Word to PDF Converter', path: '/tools/word-to-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/word-to-pdf',
      'Word to PDF Converter Online',
      pageDescription,
      [
        'Instant DOCX to PDF conversion',
        'Preserves fonts, tables, margins and image resolution',
        'Multi-page PDF generation',
        'Zero-upload 100% private browser processing',
        'No watermark and completely free forever',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Convert Word (.docx) to PDF Online', pageDescription, steps, siteUrl, '/tools/word-to-pdf'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <!-- Main Converter Section -->
      <section class="tools-layout container">
        <div class="tools-hero">
          <span class="eyebrow"><Sparkles :size="13" /> INSTANT DOCUMENT COMPILER</span>
          <h1>Convert Word<br /><span>to PDF flawlessly.</span></h1>
          <p>Transform Microsoft Word (.docx) files into clean, universal, publication-ready PDF documents. Lock your formatting, preserve typography, and share documents safely without uploading files to remote servers.</p>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Word to PDF Ready</div>
          <DocumentConverter fixed-direction="word-pdf" />
          <div class="under-card"><ShieldCheck :size="15" /> Converted locally on your device. Zero file uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li><span><Check :size="14" /></span><div><b>Exact Layout Preservation</b><small>Locks fonts, table grids, headers, and image alignments.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>100% Private Client-Side Conversion</b><small>Runs completely in browser memory. Zero server uploads.</small></div></li>
            <li><span><Zap :size="14" /></span><div><b>Free with No Watermarks</b><small>No registration, no daily conversion caps, and no brand stamps.</small></div></li>
          </ul>

          <div class="tools-tip">
            <FileText :size="18" />
            <p><b>Need to convert a PDF back to Word?</b><br /><NuxtLink to="/tools/pdf-to-word" style="color: #a5b4fc; text-decoration: underline;">Switch to PDF to Word with Smart OCR &rarr;</NuxtLink></p>
          </div>
        </div>
      </section>

      <!-- Step-by-Step Guide -->
      <section class="how-section container" id="how-to-convert">
        <div class="section-intro">
          <span class="mini-label">QUICK 3-STEP PROCESS</span>
          <h2>How to Convert Word (.docx) to PDF Online</h2>
          <p>Create professional, universally compatible PDF documents in three effortless steps.</p>
        </div>

        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><FileText :size="22" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Rich Informative Guide for SEO -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">PROFESSIONAL DOCUMENT COMPILATION</span>
          <h2>Why Convert Your Word Documents to PDF with We Make PDF?</h2>
          <p>Microsoft Word documents often shift layouts, reflow paragraphs, or replace fonts when opened on different devices or operating systems. Converting to PDF standardizes your presentation.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Layers :size="24" /></span>
            <h3>Universal Display Consistency</h3>
            <p>Whether viewed on a smartphone, Mac, Windows laptop, or Android tablet, a PDF document guarantees identical typography, line wraps, and pagination. Avoid the embarrassment of distorted resumes or misaligned business proposals.</p>
            <ul>
              <li>Locks margins, headers, and footer page numbers</li>
              <li>Eliminates missing font warnings and substitution errors</li>
              <li>Print-ready resolution for crisp physical copies</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>Prevents Accidental Edits</h3>
            <p>Sending a raw .docx file allows recipients or third parties to accidentally modify clauses, formulas, or numbers. Converting to PDF preserves your authorial integrity and ensures clients review finalized content.</p>
            <ul>
              <li>Read-only standardized document format</li>
              <li>Ideal for contracts, estimates, and invoices</li>
              <li>Ready for digital signing and legal archival</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Cpu :size="24" /></span>
            <h3>Zero Uploads &amp; Absolute Privacy</h3>
            <p>Traditional conversion websites store copies of your uploaded Word files on cloud servers, exposing confidential client contracts, financial reports, or personal data. We Make PDF compiles everything locally in your browser.</p>
            <ul>
              <li>100% on-device processing via modern JavaScript APIs</li>
              <li>No document storage, tracking, or remote database access</li>
              <li>Safe for confidential medical, legal, and financial files</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">EVERYDAY WORKFLOWS</span>
          <h2>Who Relies on We Make PDF Word to PDF?</h2>
          <p>Thousands of professionals, students, and businesses use We Make PDF daily.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Job Seekers &amp; Recruiters</h4>
            <p>Convert resumes, CVs, and cover letters from Word to PDF so hiring managers view your layout exactly as designed, without formatting glitches.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Business &amp; Sales Proposals</h4>
            <p>Export quotes, commercial tenders, and contracts into polished PDFs ready for client review, legal verification, and executive approval.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Academics &amp; Students</h4>
            <p>Submit dissertations, school essays, and research papers with locked margins, citations, and reference lists according to academic guidelines.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Invoicing &amp; Billing</h4>
            <p>Transform Word-based purchase orders, receipts, and invoices into compact PDFs that open cleanly in any email client or accounting software.</p>
          </div>
        </div>

        <!-- Keyword Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED DOCUMENT TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/pdf-to-word" class="seo-keyword-pill">PDF to Word OCR Converter</NuxtLink>
            <NuxtLink to="/tools/compress-pdf" class="seo-keyword-pill">Compress PDF File Size</NuxtLink>
            <NuxtLink to="/tools/merge-pdf" class="seo-keyword-pill">Merge Multiple PDFs</NuxtLink>
            <NuxtLink to="/tools/protect-pdf" class="seo-keyword-pill">Encrypt &amp; Password Protect PDF</NuxtLink>
            <NuxtLink to="/tools/watermark-pdf" class="seo-keyword-pill">Add Watermark to PDF</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">HELP &amp; ADVICE</span>
          <h2>Frequently Asked Questions About Word to PDF Conversion</h2>
          <p>Common questions about formatting, browser security, document sizes, and output quality.</p>
          <div class="faq-decoration" aria-hidden="true">
            <FileText :size="42" />
            <span>DOCX &rarr; PDF</span>
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

      <!-- Switch Tool Banner -->
      <section class="closing-cta container">
        <div>
          <span class="mini-label">LOOKING FOR ANOTHER TOOL?</span>
          <h2>Need to edit a PDF document?</h2>
          <p>Try our dedicated PDF to Word converter with built-in OCR for scanned pages.</p>
        </div>
        <NuxtLink to="/tools/pdf-to-word" class="primary-button">
          Open PDF to Word <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private document conversion, right in your browser." />
  </div>
</template>

