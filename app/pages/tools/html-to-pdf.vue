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
  Printer,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/html-to-pdf', '/tools/convert-html-to-pdf', '/html2pdf'],
});

const pageTitle = 'Convert HTML to PDF Online Free — Clean Code & Live Preview | We Make PDF';
const pageDescription = 'Convert HTML and CSS code to PDF online for free. Live sandbox preview, custom page sizes (A4, Letter), margins, templates, and high-resolution vector print with 100% in-browser privacy.';

const steps = [
  { number: '01', title: 'Enter HTML & CSS Code', desc: 'Type or paste your HTML markup and CSS styles directly into the editor, pick from starter templates (Invoice, Resume, Report, Certificate), or import an existing .html file.' },
  { number: '02', title: 'Configure Page Layout & Margins', desc: 'Inspect the live sandboxed preview across Print Sheet, Desktop, Tablet, or Mobile viewports. Select page format (A4, Letter, Legal), orientation, margins, and resolution.' },
  { number: '03', title: 'Convert & Download PDF', desc: 'Click "Convert & Download PDF" to generate a crystal-clear, print-ready PDF directly on your device, or use Vector Print for native browser export.' },
];

const faqs = [
  ['How does the HTML to PDF converter work without server uploads?', 'We Make PDF renders your HTML and CSS inside an isolated browser sandbox and converts it to a multi-page PDF using high-resolution canvas capture and jsPDF client-side libraries. Your code, invoices, and sensitive documents never leave your computer or phone.'],
  ['Can I use custom CSS styles, fonts, and images?', 'Yes! You can add any standard CSS in the "CSS Styles" editor tab, including custom fonts, flexbox, CSS grid, borders, gradients, and base64 or web-accessible image URLs.'],
  ['Which page sizes and orientations are supported?', 'We support standard paper formats including A4 (210 × 297 mm), US Letter (8.5 × 11 in), US Legal (8.5 × 14 in), A3, and A5. You can toggle between Portrait and Landscape orientation at any time with live updating previews.'],
  ['How does multi-page slicing work for long documents?', 'We Make PDF automatically calculates page heights based on your chosen paper format and margins, slicing tall content cleanly across sequential PDF pages. You can also enforce explicit page splits in your HTML using CSS page break rules like `break-after: page;` or `.page-break`.'],
  ['What is the difference between "Convert & Download PDF" and "Vector Print"?', '"Convert & Download PDF" generates a standalone PDF file directly in your browser with exact DPI scaling and auto-downloads it to your device. "Vector Print" opens your rendered HTML in a native browser print window, allowing 100% vector SVG printing and printer-specific driver settings.'],
  ['Are there starter templates available?', 'Yes! The tool includes 5 built-in professional starter templates: Modern Business Invoice, Executive Resume / CV, Quarterly Business Report, Certificate of Achievement, and a Blank Starter Canvas.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/html-to-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Convert HTML to PDF', path: '/tools/html-to-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/html-to-pdf',
      'Convert HTML to PDF Online Free',
      pageDescription,
      [
        'Convert HTML and CSS code to multi-page PDF documents',
        'Live sandboxed preview with responsive viewport switchers',
        '5 curated starter templates: Invoice, Resume, Report, Certificate, Blank',
        'Configurable page sizes (A4, Letter, Legal, A3, A5) and margins',
        'Portrait and landscape orientation toggles',
        'Retina print scaling (1x, 2x, 3x) and page numbering',
        'Native vector browser print and one-click PDF downloads',
        '100% private in-browser WebAssembly & canvas conversion',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Convert HTML to PDF Online for Free', pageDescription, steps, siteUrl, '/tools/html-to-pdf'),
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
          <span class="eyebrow"><Sparkles :size="13" /> CODE TO DOCUMENT CONVERTER</span>
          <h1>Convert HTML to PDF<br /><span>clean code, instant documents.</span></h1>
          <p>Transform your HTML and CSS into beautiful, print-ready PDF documents. Features live real-time sandboxed preview, starter templates, custom paper sizes, and 100% private client-side processing.</p>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> HTML to PDF Ready</div>
          <HtmlToPdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero document uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><Code2 :size="14" /></span>
              <div>
                <b>Full HTML &amp; CSS Control</b>
                <small>Write modern semantic markup, responsive CSS grid, flexbox layouts, and custom typography.</small>
              </div>
            </li>
            <li>
              <span><Eye :size="14" /></span>
              <div>
                <b>Live Real-Time Preview</b>
                <small>Inspect your document instantly across Print Sheet, Desktop, Tablet, and Mobile viewports.</small>
              </div>
            </li>
            <li>
              <span><Printer :size="14" /></span>
              <div>
                <b>High-Resolution Print Quality</b>
                <small>Generates crisp multi-page PDFs with 2x Retina canvas rendering and native browser vector print options.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>Guaranteed Local Privacy</b>
                <small>Your code, financial records, and personal documents never leave your computer or phone.</small>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <FileText :size="18" />
            <p><b>Pro Tip:</b> Use the starter templates dropdown to quickly scaffold professional Invoices, Resumes, or Business Reports in seconds.</p>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Three Steps to Convert HTML to PDF</h2>
          <p>Scaffold, customize, and download publication-quality PDFs without backend dependencies.</p>
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
          <h2>Your code and files never leave your browser</h2>
          <p>Unlike traditional online HTML to PDF web services that upload your code to remote servers, We Make PDF runs entirely inside your browser memory. Your confidential proprietary designs, invoices, and sensitive customer data remain strictly on your machine.</p>
        </div>
      </section>

      <!-- Frequently Asked Questions -->
      <section id="questions" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about generating PDFs from HTML and CSS code.</p>
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

    <SiteFooter />
  </div>
</template>

