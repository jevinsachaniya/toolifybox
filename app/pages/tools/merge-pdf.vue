<script setup>
import { ArrowRight, Check, ChevronDown, Combine, Cpu, Files, Layers, LockKeyhole, ShieldCheck, Sparkles, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageTitle = 'Merge PDF Files Online — Combine PDFs Free & Privately | Toolifybox';
const pageDescription = 'Combine multiple PDF documents into a single organized file online for free. Visual page previews, custom file ordering, zero loss of quality, and 100% private in-browser processing.';

const steps = [
  { number: '01', title: 'Upload Multiple PDFs', desc: 'Select two or more PDF documents from your device. Toolifybox displays thumbnail previews for all pages instantly.' },
  { number: '02', title: 'Arrange Document Order', desc: 'Use intuitive controls to reorder complete documents. The merged PDF strictly follows your chosen sequence.' },
  { number: '03', title: 'Combine & Download', desc: 'Merge the PDF stream locally in your browser memory and download your unified PDF without watermarks.' },
];

const faqs = [
  ['Will combining PDFs reduce the visual quality or text sharpness?', 'No. Toolifybox preserves 100% of the original vector streams, embedded fonts, hyperlink anchors, and image resolutions. Merging is lossless.'],
  ['Are my confidential documents uploaded to any remote server?', 'Never. Toolifybox executes the entire PDF byte-stream concatenation inside your web browser. Your sensitive files remain strictly on your computer or mobile device.'],
  ['Is there a limit on how many PDF files I can merge?', 'You can merge multiple PDFs up to 20 MB per file and up to 100 total pages simultaneously without cost, registration, or restrictions.'],
  ['Can I reorder individual pages or remove unwanted pages?', 'Yes! You can set the file order here, or use our companion tools "Remove PDF Pages" and "Split PDF" to trim or customize exact pages before merging.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/merge-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Merge PDF', path: '/tools/merge-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/merge-pdf',
      'Merge PDF Files Online with Visual Previews',
      pageDescription,
      [
        'Lossless multi-file PDF combination',
        'Visual page and document preview',
        'Custom document reordering',
        '100% private in-browser processing',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Merge Multiple PDF Files Online', pageDescription, steps, siteUrl, '/tools/merge-pdf'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <section class="tools-layout container merge-pdf-layout">
    <div class="tools-hero">
      <span class="eyebrow"><Sparkles :size="13" /> COMBINE MULTIPLE DOCUMENTS</span>
          <h1>Merge PDFs with<br /><span>every page in view.</span></h1>
          <p>Preview all documents, arrange complete files in the right order, and combine every page without reducing its original vector quality. Fast, free, and private.</p>
    </div>

    <div class="tools-converter-wrap">
      <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Merge PDF Ready</div>
          <MergePdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Merged locally on your device. Zero PDF uploads.</div>
    </div>

    <div class="tools-details-below">
      <ul class="tools-points">
            <li><span><Files :size="14" /></span><div><b>Preview Every Page</b><small>Check all documents and pages before creating the final file.</small></div></li>
            <li><span><Combine :size="14" /></span><div><b>100% Original Quality</b><small>Selectable text, links, vectors and page dimensions are preserved.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>Zero Server Uploads</b><small>Your PDFs stay in browser memory on your device.</small></div></li>
          </ul>
      
      <div class="tools-tip">
            <Check :size="18" />
            <p><b>Check the sequence first</b><br />The topmost PDF appears first in the merged output. Use the arrow controls to reposition files before clicking Merge.</p>
          </div>
    </div>
  </section>

      <!-- How to Merge Step-by-Step -->
      <section class="how-section container" id="how-it-works">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Two or More PDFs, One Cohesive Document</h2>
          <p>Review the pages, verify their order, and combine files in three simple steps.</p>
        </div>

        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><Combine :size="22" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Informative SEO Editorial Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">ORGANIZED DOCUMENT MANAGEMENT</span>
          <h2>Why Use Toolifybox to Combine Your PDF Files?</h2>
          <p>Merging PDFs manually or using cloud-based tools can be slow and risky. Toolifybox keeps your files secure on your computer while preserving internal document integrity.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Layers :size="24" /></span>
            <h3>Preserves Vector Text &amp; Formatting</h3>
            <p>Many online tools convert pages into low-resolution images before joining them, resulting in blurred text. Toolifybox performs native PDF stream concatenation, keeping all vector fonts and text crisp.</p>
            <ul>
              <li>100% searchable and selectable text</li>
              <li>Embedded images remain at native DPI</li>
              <li>Keeps interactive hyperlinks and form fields intact</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>Confidentiality for Sensitive Records</h3>
            <p>Whether merging employee contracts, tax returns, bank statements, or academic records, your files should not be stored on unknown third-party servers. Toolifybox runs locally in your browser.</p>
            <ul>
              <li>Zero file storage, queues, or cloud transfer</li>
              <li>Compliant with corporate and HIPAA privacy needs</li>
              <li>Memory cleared the instant you close the tab</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Zap :size="24" /></span>
            <h3>Zero Upload Lag &amp; Instant Output</h3>
            <p>Because your PDFs are not uploaded across internet connections, merging happens at the raw speed of your device hardware. Even large multi-page reports combine in seconds.</p>
            <ul>
              <li>No waiting for slow file uploads or downloads</li>
              <li>Works smoothly on desktop, laptop, or mobile</li>
              <li>No watermarks or conversion quotas</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">POPULAR USE CASES</span>
          <h2>Common Situations for Merging PDFs</h2>
          <p>Streamline document workflows across academic, legal, and commercial tasks.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Job &amp; University Applications</h4>
            <p>Combine your cover letter, resume/CV, degrees, and recommendation letters into a single, comprehensive submission document.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Tax &amp; Accounting Audits</h4>
            <p>Consolidate monthly financial statements, receipts, and expense reports into one audit-ready ledger for tax season.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Legal Briefs &amp; Real Estate Contracts</h4>
            <p>Assemble lease agreements, addendums, identification proofs, and property deeds into one legally compliant package.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>E-Books &amp; Training Manuals</h4>
            <p>Join disparate chapters, title pages, indices, and appendices into a polished, unified digital publication.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE COMPANION PDF TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/split-pdf" class="seo-keyword-pill">Split PDF Pages</NuxtLink>
            <NuxtLink to="/tools/remove-pdf-pages" class="seo-keyword-pill">Remove PDF Pages</NuxtLink>
            <NuxtLink to="/tools/compress-pdf" class="seo-keyword-pill">Compress Merged PDF</NuxtLink>
            <NuxtLink to="/tools/protect-pdf" class="seo-keyword-pill">Protect PDF with Password</NuxtLink>
            <NuxtLink to="/tools/pdf-to-word" class="seo-keyword-pill">Convert PDF to Word</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About Merging PDFs</h2>
          <p>Everything you need to know about joining multiple PDF files with perfect accuracy.</p>
          <div class="faq-decoration" aria-hidden="true">
            <Combine :size="42" />
            <span>PDF + PDF</span>
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
          <span class="mini-label">LOOKING TO SEPARATE PAGES?</span>
          <h2>Need to extract specific pages from a PDF?</h2>
          <p>Try our dedicated Split PDF tool to break large documents into individual files.</p>
        </div>
        <NuxtLink to="/tools/split-pdf" class="primary-button">
          Open Split PDF <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private PDF merging, right in your browser." />
  </div>
</template>
