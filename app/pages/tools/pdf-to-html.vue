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

const pageTitle = 'Convert PDF to HTML Online Free — Responsive & Clean Code | We Make PDF';
const pageDescription = 'Convert PDF documents to HTML online for free. Transform PDF pages into clean, semantic responsive HTML5, styled CSS, or pixel-perfect fixed layouts with 100% in-browser privacy.';

const steps = [
  { number: '01', title: 'Upload Your PDF Document', desc: 'Select or drag-and-drop any PDF file into the browser converter. Files up to 60 MB are supported.' },
  { number: '02', title: 'Choose Layout Engine & Theme', desc: 'Pick between Semantic Responsive Flow (auto-detects H1-H3, lists, tables) or Pixel-Perfect Fixed Layout, and select your preferred CSS theme.' },
  { number: '03', title: 'Preview & Download HTML', desc: 'Inspect live rendered view across desktop, tablet, and mobile, copy code to your clipboard, or download standalone HTML and multi-page ZIP packages.' },
];

const faqs = [
  ['How does the PDF to HTML conversion work without server uploads?', 'We Make PDF uses client-side WebAssembly and modern browser canvas APIs to parse PDF documents, extract structured text blocks, detect headings and lists, and generate clean HTML5 markup directly in your device memory. Your confidential files never touch an external server.'],
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
      { name: 'Convert PDF to HTML', path: '/tools/pdf-to-html' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/pdf-to-html',
      'Convert PDF to HTML Online Free',
      pageDescription,
      [
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
    ({ siteUrl }) => howToSchema('How to Convert PDF to HTML Online for Free', pageDescription, steps, siteUrl, '/tools/pdf-to-html'),
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
          <span class="eyebrow"><Sparkles :size="13" /> DOCUMENT TO WEB CONVERTER</span>
          <h1>Convert PDF to HTML<br /><span>clean, responsive code.</span></h1>
          <p>Transform PDF documents into modern, semantic HTML5 web pages with clean CSS styling. Choose between responsive fluid layouts or pixel-perfect replicas with 100% client-side privacy.</p>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="converter-card" style="text-align: center; padding: 3.5rem 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); color: #ef4444; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
              <LockKeyhole :size="28" />
            </div>
            <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem;">Tool Temporarily Unavailable</h2>
            <p style="color: var(--muted); max-width: 480px; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
              The PDF to HTML converter is currently offline for maintenance and layout improvements. Please check back in an upcoming release or explore our other active PDF tools.
            </p>
            <NuxtLink to="/tools" class="tool-card-btn btn-active" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none;">
              Explore Other Tools <ArrowRight :size="16" />
            </NuxtLink>
          </div>
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
          <h2>Three Steps to Convert Any PDF to HTML</h2>
          <p>Easily transform PDF documents into responsive HTML web pages with clean CSS.</p>
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
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about converting PDF to HTML in your browser.</p>
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
