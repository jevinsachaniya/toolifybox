<script setup>
import { ArrowRight, Check, ChevronDown, Cpu, Eye, FileCheck, Layers, LockKeyhole, ShieldCheck, Sparkles, Stamp, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/watermark-pdf', '/tools/watermark'],
});

const pageTitle = 'Watermark PDF Online — Add Text & Stamp Watermarks | Toolifybox';
const pageDescription = 'Watermark PDF documents online for free. Add confidential stamps, copyright marks, or repeating watermark grids with custom opacity and rotation in your browser. 100% private.';

const steps = [
  { number: '01', title: 'Choose a PDF Document', desc: 'Select or drop any PDF document up to 20 MB from your phone, tablet, or desktop.' },
  { number: '02', title: 'Customize Watermark Text', desc: 'Pick presets like CONFIDENTIAL or type your company name. Adjust opacity, color, angle, and tiled grid position.' },
  { number: '03', title: 'Download Stamped PDF', desc: 'Download your stamped, protected PDF document instantly with zero server uploads or image degradation.' },
];

const faqs = [
  ['Will watermarking a PDF blur or flatten my original text?', 'No. Toolifybox stamps vector or text layers directly on top of the document canvas while preserving 100% of the underlying selectable text, embedded fonts, and vector lines.'],
  ['Can I add repeating tiled watermarks across the entire page?', 'Yes! You can choose our Repeating 3x3 Grid mode to cover the full page diagonally, making it impossible for third parties to crop out your copyright stamp.'],
  ['What opacity should I choose so the document is still readable?', 'We recommend between 15% and 30% opacity. This leaves the stamp clearly visible to prevent leaks while keeping the underlying text comfortable to read.'],
  ['Are my confidential drafts or contracts uploaded to any cloud service?', 'Never. Toolifybox stamps your PDF directly in your web browser memory using client-side JavaScript. Your documents never leave your computer.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/watermark-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Watermark PDF', path: '/tools/watermark-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/watermark-pdf',
      'Watermark PDF Documents',
      pageDescription,
      ['Add text stamps like CONFIDENTIAL, DRAFT, and SAMPLE', 'Customizable angle, opacity, color, and font size', 'Diagonal center, margins, and repeating grid watermarks', 'Interactive real-time canvas preview', 'No software installation required', 'Zero server uploads', '100% private in-browser execution']
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Add Watermarks to PDF Documents Online', pageDescription, steps, siteUrl, '/tools/watermark-pdf'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container watermark-pdf-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> PDF BRANDING &amp; SECURITY</span>
          <h1>Watermark PDF<br /><span>stamps &amp; text marks.</span></h1>
          <p>Protect confidential documents, contracts, drafts, and creative portfolios. Stamp clear visual copyright notices, confidentiality markers, or tiled watermarks across all or selected pages with instant browser-based processing.</p>
          <ul class="tools-points">
            <li>
              <span><Check :size="14" /></span>
              <div>
                <b>Confidentiality Presets &amp; Custom Text</b>
                <small>Quickly stamp CONFIDENTIAL, DRAFT, SAMPLE, DO NOT COPY, or type any custom watermark message.</small>
              </div>
            </li>
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <b>Live Interactive Preview</b>
                <small>Inspect your first PDF page and preview the exact watermark position, opacity, and angle before saving.</small>
              </div>
            </li>
            <li>
              <span><Layers :size="14" /></span>
              <div>
                <b>Diagonal, Margins &amp; Repeating Grids</b>
                <small>Choose 45° diagonal center, horizontal banners, margin headers, or repeating 3x3 security grids.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>Zero Server Uploads &amp; 100% Privacy</b>
                <small>Your legal documents, sensitive reports, and tax filings never leave your local device memory.</small>
              </div>
            </li>
          </ul>
          <div class="tools-tip">
            <Stamp :size="18" />
            <p>
              <b>Document Protection Tip</b><br />
              Use a semi-transparent diagonal watermark (20% - 30% opacity) to deter unauthorized distribution while keeping the underlying text easy to read.
            </p>
          </div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Watermark PDF Ready</div>
          <WatermarkPdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero server uploads.</div>
        </div>
      </section>

      <section class="how-section container" id="how-it-works">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Watermark Your PDF in Three Easy Steps</h2>
          <p>Brand and secure your PDF documents in seconds without installing third-party software.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><Stamp :size="22" /></span>
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
          <span class="mini-label">VISUAL SECURITY</span>
          <h2>Why Watermarking Documents Protects Intellectual Property</h2>
          <p>Unmarked PDFs are easily re-shared, plagiarized, or forwarded without permission. Stamping professional watermarks ensures your ownership remains clear.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Stamp :size="24" /></span>
            <h3>Custom Text &amp; Presets</h3>
            <p>Choose standard legal presets like CONFIDENTIAL, DRAFT, COPY, or FOR REVIEW, or enter your client's name or company brand to personalize individual proposals.</p>
            <ul>
              <li>Adjustable rotation angles (-45&deg;, 0&deg;, 45&deg;, 90&deg;)</li>
              <li>Custom font size and hex color picker</li>
              <li>Precise opacity slider (10% to 100%)</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Layers :size="24" /></span>
            <h3>Repeating Security Tiling</h3>
            <p>Clever unauthorized recipients can crop out single watermark stamps placed in margins. Our repeating tiled pattern stamps multiple semi-transparent marks across the full page.</p>
            <ul>
              <li>Prevents partial screenshot or cropping theft</li>
              <li>Maintains subtle contrast for comfortable reading</li>
              <li>Applies across all pages or custom page ranges</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>Client-Side Privacy Guarantee</h3>
            <p>Unreleased manuscripts, patents, and sensitive corporate presentations should never be uploaded to cloud watermarking tools. Toolifybox stamps your files directly in your browser.</p>
            <ul>
              <li>100% private in-browser canvas execution</li>
              <li>No server file storage or intermediate caching</li>
              <li>Zero watermarks added to the tool itself</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>When Should You Watermark a PDF?</h2>
          <p>Keep your creative and corporate property clearly attributed.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Commercial Quotes &amp; Proposals</h4>
            <p>Stamp preliminary estimates with "ESTIMATE ONLY" or "DRAFT" to prevent clients from executing unapproved terms.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Creative Portfolios &amp; Manuscripts</h4>
            <p>Protect photography proofs, screenplays, and book chapters with your name and copyright year before pitching to agencies.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Legal Briefs &amp; NDAs</h4>
            <p>Stamp confidential litigation documents with "STRICTLY PRIVATE &amp; CONFIDENTIAL" to enforce compliance among review teams.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>School &amp; University Sample Papers</h4>
            <p>Mark practice exams and mock test answers with "SAMPLE COPY" to indicate non-official academic resources.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED PDF TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/protect-pdf" class="seo-keyword-pill">Protect PDF with Password</NuxtLink>
            <NuxtLink to="/tools/flatten-pdf" class="seo-keyword-pill">Flatten PDF Forms</NuxtLink>
            <NuxtLink to="/tools/compress-pdf" class="seo-keyword-pill">Compress PDF</NuxtLink>
            <NuxtLink to="/tools/pdf-to-word" class="seo-keyword-pill">Convert PDF to Word</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About Watermarking PDFs</h2>
          <p>Everything you need to know about stamping copyright and confidentiality watermarks onto PDF pages.</p>
          <div class="faq-decoration" aria-hidden="true">
            <Stamp :size="42" />
            <span>PDF &bull; STAMP</span>
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
          <span class="mini-label">LOOKING TO LOCK YOUR PDF?</span>
          <h2>Password protect your watermarked document</h2>
          <p>Add AES-256 password encryption to ensure only authorized users can open your file.</p>
        </div>
        <NuxtLink to="/tools/protect-pdf" class="primary-button">
          Open Protect PDF <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Free, private browser tools for everyday file work." />
  </div>
</template>

