<script setup>
import { ArrowRight, Check, ChevronDown, Copy, Cpu, Download, FileCheck, FileText, Globe, Languages, Layers, LockKeyhole, ScanText, ShieldCheck, Sparkles, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/extract-ocr', '/ocr-extract', '/tools/ocr-extract'],
});

const pageTitle = 'Extract OCR Text Online — Free & Private PDF/Image OCR | Toolifybox';
const pageDescription = 'Extract OCR text from scanned PDFs and images online for free. Convert scans, receipts, and photos to editable text in Hindi, Gujarati, English & more with 100% private in-browser recognition. Export to TXT or Word DOCX.';

const steps = [
  { number: '01', title: 'Choose Document or Photo', desc: 'Select any scanned PDF or image file (JPG, PNG, WebP) from your computer or smartphone.' },
  { number: '02', title: 'Select Recognition Language', desc: 'Pick Hindi, Gujarati, English, or bilingual models for highest character recognition fidelity.' },
  { number: '03', title: 'Copy or Export Text', desc: 'Read, edit, copy text directly to your clipboard, or download it as plain .TXT or Microsoft Word .DOCX.' },
];

const faqs = [
  ['Can this tool extract text from blurry paper scans or screenshots?', 'Yes. Toolifybox employs high-DPI canvas preprocessing and adaptive thresholding to enhance contrast before running neural optical recognition, successfully capturing text from phone photos, scans, and screenshots.'],
  ['Does it support Indic languages like Hindi and Gujarati?', 'Yes. Toolifybox includes full Unicode models for Hindi (हिन्दी), Gujarati (ગુજરાતી), and English. Complex ligatures, conjuncts, and matras are accurately recognized and mapped to standard Unicode.'],
  ['Are my sensitive documents uploaded to any external servers?', 'Never. Optical recognition executes entirely inside your browser using client-side WebAssembly. No images or text ever leave your device.'],
  ['Can I export the recognized text into an editable Word document?', 'Yes. With one click, you can export the recognized text into a formatted Microsoft Word document (.docx) or download it as a plain .txt file.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/extract-ocr',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Extract OCR Text', path: '/tools/extract-ocr' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/extract-ocr',
      'Extract OCR Text Online',
      pageDescription,
      ['High-accuracy local OCR engine', 'Multilingual Hindi, Gujarati & English recognition', 'Extracts from PDF, JPG, PNG, and WebP', 'Instant one-click copy to clipboard', 'Export to TXT or formatted Word (.docx)', '100% client-side privacy without cloud uploads']
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Extract OCR Text from Images & Scanned PDFs', pageDescription, steps, siteUrl, '/tools/extract-ocr'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container extract-ocr-layout">
    <div class="tools-hero">
      <span class="eyebrow"><Sparkles :size="13" /> OPTICAL CHARACTER RECOGNITION</span>
          <h1>Extract OCR<br /><span>text easily.</span></h1>
          <p>Recover clean, selectable text from scanned receipts, contracts, textbook pages, paper documents, and screenshot images. Copy text directly to your clipboard or download clean TXT and Word documents in seconds.</p>
    </div>

    <div class="tools-converter-wrap">
      <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Extract OCR Ready</div>
          <ExtractOcrConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero server uploads.</div>
    </div>

    <div class="tools-details-below">
      <ul class="tools-points">
            <li>
              <span><Check :size="14" /></span>
              <div>
                <b>PDF &amp; Image Support</b>
                <small>Works seamlessly on scanned multi-page PDF documents as well as JPG, PNG, and WebP photo files.</small>
              </div>
            </li>
            <li>
              <span><Languages :size="14" /></span>
              <div>
                <b>Hindi, Gujarati &amp; English OCR</b>
                <small>Trained optical neural networks accurately recognize English and Indic Devanagari/Gujarati text.</small>
              </div>
            </li>
            <li>
              <span><Copy :size="14" /></span>
              <div>
                <b>One-Click Copy &amp; Export</b>
                <small>Review, edit, and copy recognized text instantly, or export as plain text or formatted Word document.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>100% Client-Side Privacy</b>
                <small>OCR models run directly on your hardware inside WebAssembly. No scans are uploaded to remote servers.</small>
              </div>
            </li>
          </ul>
      
      <div class="tools-tip">
            <FileCheck :size="18" />
            <p>
              <b>Accuracy Tip</b><br />
              Ensure scanned receipts and photos are well-lit and oriented upright before running optical recognition for the cleanest accuracy.
            </p>
          </div>
    </div>
  </section>

      <section class="how-section container" id="how-it-works">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Extract Text from Your Document in Three Steps</h2>
          <p>Fast, private, and effortless text recovery directly in your browser.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><ScanText :size="22" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Educational SEO Guide Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">NEURAL TEXT RECOVERY</span>
          <h2>Optical Character Recognition Engineered for Accuracy</h2>
          <p>Stop typing long passages from paper books or screenshots manually. Toolifybox transforms static pixel images into digital text in seconds.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Languages :size="24" /></span>
            <h3>Complex Script Unicode Mapping</h3>
            <p>Indian languages require advanced glyph segmentation to recognize prefixes, halants, and conjunct consonants. Toolifybox leverages high-accuracy neural models trained specifically on Indic typography.</p>
            <ul>
              <li>Extracts Hindi Devanagari and Gujarati Unicode</li>
              <li>Eliminates broken characters and question marks</li>
              <li>Supports English technical vocabulary seamlessly</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Copy :size="24" /></span>
            <h3>Instant Clipboard &amp; Word Export</h3>
            <p>Need the text for an essay, WhatsApp message, or business email? Copy the entire output in one click, or save it as a clean .docx Word file with preserved line breaks and paragraph spacing.</p>
            <ul>
              <li>One-click clipboard copy functionality</li>
              <li>Instant .TXT plain text file download</li>
              <li>Formatted Microsoft Word (.docx) export</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>Complete Data Confidentiality</h3>
            <p>Financial bills, medical prescriptions, and private contracts should never be sent to cloud OCR servers. With Toolifybox, all optical recognition executes locally on your device CPU/GPU.</p>
            <ul>
              <li>Zero data transferred across the web</li>
              <li>No logs or retained document archives</li>
              <li>Runs smoothly even on restricted corporate networks</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">PRACTICAL APPLICATIONS</span>
          <h2>Popular Ways to Use Image &amp; PDF OCR</h2>
          <p>Save hours of tedious manual typing across multiple workflows.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Digitizing Printed Books &amp; Study Notes</h4>
            <p>Photograph textbook pages or lecture handouts with your phone and extract digital text to create summaries, flashcards, or study guides.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Extracting Data from Invoices &amp; Receipts</h4>
            <p>Quickly copy vendor names, invoice numbers, line items, and totals from scanned bills into spreadsheets or accounting software.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Legal Documents &amp; Certificates</h4>
            <p>Convert scanned court affidavits, agreements, and government letters into editable text for legal review and drafting.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Screenshots &amp; Social Media Quotes</h4>
            <p>Extract quotes, code snippets, or error messages trapped inside screenshot images without retyping word for word.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED OCR &amp; PDF TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/pdf-to-word" class="seo-keyword-pill">PDF to Word with Smart OCR</NuxtLink>
            <NuxtLink to="/tools/translate-pdf" class="seo-keyword-pill">Translate PDF Documents</NuxtLink>
            <NuxtLink to="/tools/word-to-pdf" class="seo-keyword-pill">Word to PDF Converter</NuxtLink>
            <NuxtLink to="/tools/compress-pdf" class="seo-keyword-pill">Compress PDF File Size</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About Optical Character Recognition</h2>
          <p>Get answers to common questions about OCR accuracy, languages, and export formats.</p>
          <div class="faq-decoration" aria-hidden="true">
            <ScanText :size="42" />
            <span>OCR &rarr; TXT</span>
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
          <span class="mini-label">NEED FORMATTED WORD DOCUMENTS?</span>
          <h2>Convert complete PDFs to editable Word</h2>
          <p>Use our flagship PDF to Word tool with automatic title, section, and alignment preservation.</p>
        </div>
        <NuxtLink to="/tools/pdf-to-word" class="primary-button">
          Open PDF to Word <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>
    <SiteFooter message="Free, private browser tools for everyday file work." />
  </div>
</template>

