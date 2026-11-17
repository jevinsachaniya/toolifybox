<script setup>
import {
  ArrowRight,
  Check,
  ChevronDown,
  Code2,
  FileCheck,
  FileCode,
  FileText,
  Globe,
  Layers,
  LayoutGrid,
  LockKeyhole,
  Palette,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/pdf-to-html', '/tools/convert-pdf-to-html', '/pdf2html'],
});

const pageTitle = 'Free PDF to HTML5 Converter Online — Clean HTML & CSS [100% Free] | We Make PDF';
const pageDescription = 'Free PDF to HTML5 converter online. Convert PDF documents to clean, responsive HTML5 code and CSS stylesheets for free. 100% private in-browser, no upload & no sign-up!';

const steps = [
  { number: '01', title: 'Upload Your PDF Document', desc: 'Select or drag-and-drop any PDF file into the browser converter. Files up to 60 MB are supported.' },
  { number: '02', title: 'Choose Layout Engine & Theme', desc: 'Pick between Semantic Responsive Flow (auto-detects H1-H3, lists, tables) or Pixel-Perfect Fixed Layout, and select your preferred CSS theme.' },
  { number: '03', title: 'Preview & Download HTML5', desc: 'Inspect live rendered view across desktop, tablet, and mobile, copy clean HTML code to clipboard, or download standalone HTML5 and multi-page ZIP packages.' },
];

const faqs = [
  ['Is this free PDF to HTML converter truly 100% free with no limits?', 'Yes! Our free PDF to HTML converter is completely free with no daily limits, no paywalls, no watermark, and no account registration required.'],
  ['How does this tool convert PDF to HTML5 without uploading files?', 'We Make PDF uses client-side WebAssembly and modern browser canvas APIs to parse PDF documents, extract structured text blocks, detect headings and lists, and generate clean HTML5 markup directly in your device memory. Your confidential files never touch an external server.'],
  ['What is the difference between Semantic Flow and Fixed Layout?', 'Semantic Responsive Flow restructures your PDF into natural HTML tags (H1-H3 headings, paragraphs, bullet points, ordered lists) that reflow fluidly on mobile and tablet screens. Pixel-Perfect Fixed Layout preserves the exact geometric X/Y coordinates, line breaks, and page dimensions matching your original PDF layout.'],
  ['Can I copy the converted HTML code directly into WordPress or a CMS?', 'Yes! You can switch to the "Plain / Unstyled" theme and click "Copy HTML Code" to paste clean, semantic HTML directly into your WordPress block editor, Webflow, Notion, newsletter builders, or Markdown documents.'],
  ['Does the converter support multi-page documents and navigation?', 'Absolutely. You can convert the entire PDF or select specific page ranges. For multi-page documents, We Make PDF generates a sticky page jump menu and offers both a combined standalone HTML file and a downloadable ZIP archive containing separate page files.'],
  ['Can I preserve background artwork, charts, and logos?', 'Yes. By checking "Embed Background Visuals / Charts", high-resolution vector and graphic elements are rendered directly behind the selectable, searchable HTML text layer, giving you both visual fidelity and interactive text.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/pdf-to-html',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Free PDF to HTML5 Converter', path: '/tools/pdf-to-html' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/pdf-to-html',
      'Free PDF to HTML5 Converter Online',
      pageDescription,
      [
        'Free PDF to HTML5 converter online',
        'Convert PDF to semantic HTML5 with CSS',
        'Semantic responsive flow layout for mobile & desktop',
        'Pixel-perfect fixed layout with exact coordinate preservation',
        'Auto-detects H1-H3 headings, lists, tables, and links',
        '4 curated CSS themes: Modern Clean, Minimalist, Dark Slate, Plain',
        'Live studio iframe preview with responsive viewport switchers',
        'One-click HTML code copy and multi-page ZIP downloads',
        '100% private in-browser WebAssembly conversion',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Convert PDF to HTML5 Online for Free', pageDescription, steps, siteUrl, '/tools/pdf-to-html'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <section class="tools-layout container">
        <div class="tools-hero">
          <span class="eyebrow"><Sparkles :size="13" /> FREE PDF TO HTML5 CONVERTER</span>
          <h1>Free PDF to HTML5 Converter<br /><span>clean, responsive web code.</span></h1>
          <p>Easily convert PDF to HTML5 online for free. Transform PDF documents into clean, responsive HTML web pages with styled CSS. Choose between responsive fluid layouts or pixel-perfect replicas with 100% private client-side processing.</p>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> PDF to HTML5 Ready</div>
          <PdfToHtmlConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero document uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><Code2 :size="14" /></span>
              <div>
                <b>Semantic HTML5 Structure</b>
                <small>Auto-detects headings, bullet lists, numbered steps, tables, and hyperlinks for clean web publishing.</small>
              </div>
            </li>
            <li>
              <span><Smartphone :size="14" /></span>
              <div>
                <b>Responsive Mobile Flow</b>
                <small>Converts rigid print pages into responsive text layouts that adapt smoothly to smartphones, tablets, and desktops.</small>
              </div>
            </li>
            <li>
              <span><Palette :size="14" /></span>
              <div>
                <b>4 Curated CSS Themes</b>
                <small>Select Modern Clean, Minimalist Editorial, Dark Slate, or Plain Unstyled markup ready for any CMS or website.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>Guaranteed Privacy</b>
                <small>Your PDF is converted strictly in device memory. No files are ever uploaded to cloud servers.</small>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <FileCode :size="18" />
            <p>
              <b>Pro Tip:</b>
              Use the "Plain / Unstyled" theme and click "Copy HTML Code" to paste clean, semantically structured markup straight into WordPress, Webflow, or Notion.
            </p>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Three Steps to Convert Any PDF to HTML5 Online</h2>
          <p>Easily transform PDF documents into responsive HTML5 web pages with clean CSS for free.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><Code2 :size="20" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Privacy Strip -->
      <section class="privacy-strip container">
        <div class="privacy-strip-content">
          <div class="privacy-badge"><ShieldCheck :size="20" /> 100% Private Client-Side Processing</div>
          <h2>Your documents never leave your browser</h2>
          <p>Unlike other online PDF converters, We Make PDF runs entirely on your computer or smartphone using WebAssembly. Your confidential documents, contracts, and personal records remain strictly on your device.</p>
        </div>
      </section>

      <!-- Frequently Asked Questions -->
      <section id="questions" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Frequently Asked Questions About PDF to HTML5</h2>
          <p>Everything you need to know about our free PDF to HTML converter in your browser.</p>
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
    </main>

    <SiteFooter message="Free, private PDF to HTML converter that runs 100% in your browser." />
  </div>
</template>
