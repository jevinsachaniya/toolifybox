<script setup>
import { ArrowRight, Check, ChevronDown, Crop, FileCheck, FileText, Layers, LockKeyhole, Maximize2, ShieldCheck, Sparkles, Wand2, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/crop-pdf', '/tools/pdf-crop', '/pdf-crop'],
});

const pageTitle = 'Crop PDF Pages Online Free — Visual, Fast & Private | We Make PDF';
const pageDescription = 'Crop PDF pages online for free. Trim white margins, customize margins with an interactive visual crop box, or apply presets across all or selected pages with 100% in-browser privacy.';

const steps = [
  { number: '01', title: 'Upload Your PDF Document', desc: 'Select or drag-and-drop any PDF file up to 100 MB into the browser.' },
  { number: '02', title: 'Adjust Visual Crop Box & Margins', desc: 'Drag the visual crop handles directly on your page preview or enter exact Top, Bottom, Left, and Right margins in mm, inches, or points.' },
  { number: '03', title: 'Download Cropped PDF', desc: 'Click Crop & Download PDF to generate a pristine, vector-lossless PDF file immediately with zero quality degradation.' },
];

const faqs = [
  ['Does cropping a PDF reduce its visual quality or recompress images?', 'Not at all. We Make PDF performs lossless vector cropping by updating the PDF CropBox and MediaBox standard parameters. Your text, vector graphics, fonts, and images remain 100% intact and razor-sharp with zero recompression.'],
  ['Can I crop all pages or just a single specific page?', 'Both! You can choose "All Pages" to apply the same crop dimensions to every page in the document, "Current Page Only", or enter a "Custom Page Range" like "1-3, 5" or "odd/even".'],
  ['How does the Auto-Detect White Margins feature work?', 'Our smart border detector scans your document page pixels directly in your browser, finds the boundaries of visible content, and automatically sets the crop handles to remove excess whitespace.'],
  ['Are my confidential PDF documents uploaded to any remote server?', 'Never. All PDF parsing, rendering, and cropping occur 100% in your device web browser memory using WebAssembly. Your files never touch our servers or the cloud.'],
  ['Can I specify exact millimeter or inch margin measurements?', 'Yes! You can toggle between Millimeters (mm), Inches (in), Points (pt), and Percent (%) to set precision measurements with ease.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/crop-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Crop PDF', path: '/tools/crop-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/crop-pdf',
      'Crop PDF Online',
      pageDescription,
      [
        'Interactive visual crop box with 8 resize handles',
        'Lossless vector cropping with zero image recompression',
        'Auto-detect content borders and trim excess white margins',
        'Support for mm, inches, points, and percentage margin units',
        'Apply crop to all pages, current page, or custom page ranges',
        'Real-time page dimensions and reduction percentage calculations',
        '100% private in-browser processing with zero server uploads',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Crop PDF Pages Online for Free', pageDescription, steps, siteUrl, '/tools/crop-pdf'),
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
          <span class="eyebrow"><Sparkles :size="13" /> VECTOR PDF CROPPING TOOL</span>
          <h1>Crop PDF pages<br /><span>with precision &amp; privacy.</span></h1>
          <p>Trim excess white margins, adjust page dimensions, or cut out specific sections of your PDF documents. Enjoy an interactive visual bounding box, smart auto-trim, and 100% vector-lossless results right in your browser.</p>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Crop PDF Ready</div>
          <CropPdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero document uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><Crop :size="14" /></span>
              <div>
                <b>Interactive Visual Crop Box</b>
                <small>Drag handles directly over your PDF page preview to frame the exact area you want to keep.</small>
              </div>
            </li>
            <li>
              <span><Wand2 :size="14" /></span>
              <div>
                <b>Smart Auto Trim</b>
                <small>Automatically detect document content borders to remove empty whitespace and scanning borders.</small>
              </div>
            </li>
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <b>100% Lossless Vector Quality</b>
                <small>Adjusts standard PDF viewport boxes without compressing images or altering underlying text.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>Guaranteed Privacy</b>
                <small>Your PDF is processed strictly in your browser memory. No data is ever sent to external servers.</small>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <FileText :size="18" />
            <p><b>Pro Tip:</b> Use the "Lock All Sides" button to apply uniform margins across Top, Bottom, Left, and Right simultaneously.</p>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Three Steps to Crop Any PDF Online</h2>
          <p>Easily trim borders for printing, mobile e-readers, or digital presentations.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><Crop :size="20" /></span>
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
          <p>Everything you need to know about cropping PDF documents in your browser.</p>
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

    <SiteFooter message="Free, private PDF cropping tool that runs 100% in your browser." />
  </div>
</template>

