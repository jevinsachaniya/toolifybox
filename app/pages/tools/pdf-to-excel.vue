<script setup>
import {
  ArrowRight,
  Check,
  ChevronDown,
  Columns,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  Layers,
  LockKeyhole,
  Merge,
  ShieldCheck,
  Sparkles,
  Table,
  Upload,
  Zap,
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/pdf-to-excel', '/pdf2excel', '/tools/pdf2excel'],
});

const pageTitle = 'PDF to Excel Converter — Extract Tables to XLSX [100% Free] | We Make PDF';
const pageDescription = 'Convert PDF to editable Excel (.xlsx) & CSV online for free. Smart AI table detection, multi-page extraction, 100% private in-browser with zero uploads!';

const steps = [
  {
    number: '01',
    title: 'Upload PDF Document',
    desc: 'Select or drag-and-drop any PDF statement, invoice, or multi-page report up to 50 MB into the converter.',
  },
  {
    number: '02',
    title: 'Smart Table Detection & Preview',
    desc: 'Our on-device engine parses text coordinates, clusters rows and columns, and displays an interactive editable table preview.',
  },
  {
    number: '03',
    title: 'Download Excel (.xlsx) or CSV',
    desc: 'Export authentic Microsoft Excel workbooks with styled headers and auto-adjusted column widths, or copy table to clipboard.',
  },
];

const faqs = [
  [
    'How does We Make PDF extract tables from PDF files into Excel?',
    'We Make PDF uses client-side WebAssembly and PDF.js to inspect text item coordinates (X and Y positions) across each page. Our Smart Table algorithm groups items along the same horizontal baseline into rows and detects vertical column boundaries using coordinate clustering, constructing a clean multi-column spreadsheet.',
  ],
  [
    'Are my confidential financial statements or payroll PDFs uploaded to any server?',
    'Never. All PDF parsing, coordinate clustering, and OpenXML Excel workbook generation happen 100% locally inside your web browser memory. Your confidential tax returns, bank statements, client invoices, and business data never leave your device.',
  ],
  [
    'Can I combine all pages from a multi-page PDF into one continuous sheet?',
    'Yes! Under Table Settings, select "Merge All Pages (Single Master Sheet)". The converter merges all rows sequentially across all pages and intelligently skips duplicate repeating header rows from page 2 onward.',
  ],
  [
    'Can I edit cells or add/remove rows before downloading?',
    'Yes! The interactive table preview is completely editable. You can click on any cell or header to tweak numbers or fix typos, add new rows, or delete unwanted rows before downloading the finalized Excel workbook.',
  ],
  [
    'What spreadsheet formats can I download?',
    'You can download genuine Microsoft Excel OpenXML workbooks (.xlsx) with styled bold headers and auto-proportional column widths, standard comma-separated values (.csv) with UTF-8 BOM, or copy the table directly to your clipboard to paste into Google Sheets or Apple Numbers.',
  ],
  [
    'Is there any cost, subscription, or limit on PDF file size?',
    'No. We Make PDF is 100% free with unlimited conversions, no trial periods, no email registrations, and zero watermarks added to your downloaded spreadsheets.',
  ],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/pdf-to-excel',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'PDF to Excel', path: '/tools/pdf-to-excel' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/pdf-to-excel',
      'PDF to Excel Converter',
      pageDescription,
      [
        'Smart AI coordinate-based table detection',
        'Extracts tables from financial statements, invoices and reports',
        'Multi-page continuous merge or separate tab per page',
        'Interactive in-browser table preview with cell editing',
        'Authentic Microsoft Excel (.xlsx) and RFC 4180 CSV export',
        '100% private in-browser processing with zero server uploads',
      ]
    ),
    ({ siteUrl }) => howToSchema(
      'How to Convert PDF to Excel Online for Free',
      pageDescription,
      steps,
      siteUrl,
      '/tools/pdf-to-excel',
    ),
    () => faqSchema(faqs),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to PDF to Excel converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <!-- Main Layout: Hero + Converter Card + Quick Points -->
      <section class="tools-layout container">
        <div class="tools-hero">
          <span class="eyebrow"><Sparkles :size="13" /> IN-BROWSER TABLE EXTRACTOR</span>
          <h1>Convert PDF to Excel spreadsheets<br /><span>with perfect row &amp; column alignment.</span></h1>
          <p>Extract tables from bank statements, invoices, and financial reports into clean, editable Microsoft Excel (.xlsx) and CSV files. 100% private in your browser with zero file uploads.</p>
        </div>

        <div class="tools-converter-wrap" id="converter">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Ready to Convert</div>
          <ClientOnly>
            <PdfToExcelConverter />
          </ClientOnly>
          <div class="under-card"><ShieldCheck :size="15" /> 100% private client-side conversion. Zero document data leaves your device.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li><span><Table :size="14" /></span><div><b>Smart Table AI</b><small>Detects table boundaries, rows, and columns automatically.</small></div></li>
            <li><span><Layers :size="14" /></span><div><b>Multi-Page Support</b><small>Merge all pages into one sheet or create separate tabs.</small></div></li>
            <li><span><FileSpreadsheet :size="14" /></span><div><b>Real .XLSX &amp; CSV</b><small>Authentic Microsoft Excel OpenXML output with styled headers.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>100% Device-Level Privacy</b><small>Processed entirely inside your browser memory with zero uploads.</small></div></li>
          </ul>

          <div class="tools-tip"><Check :size="18" /><p><b>Tip: Digital PDFs produce 100% sharp tables</b><br />PDFs generated directly from software (invoices, statements, ERP exports) yield crystal-clear data alignment. You can edit any cell directly in the preview before downloading.</p></div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="how-section container" id="how-it-works">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Convert PDF to Excel in three easy steps</h2>
          <p>Fast, clean, and private table extraction without installing bulky desktop software or creating accounts.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><FileSpreadsheet :size="22" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Educational Feature Cards Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">POWERFUL TABLE RECONSTRUCTION</span>
          <h2>Stop Manual Copy-Pasting from PDF into Spreadsheets</h2>
          <p>Copy-pasting tables from PDF documents into Excel frequently results in scrambled text, broken rows, and all numbers crammed into Column A. We Make PDF solves this with coordinate-aware table reconstruction.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Table :size="24" /></span>
            <h3>Coordinate-Based Row &amp; Column Clustering</h3>
            <p>Our extraction engine inspects the exact X and Y geometry of every word on the page. By clustering text items along the horizontal baseline and identifying vertical column dividers, tables are mapped faithfully into genuine cells.</p>
            <ul>
              <li>Smart column boundary alignment across variable row lengths</li>
              <li>Consolidates fragmented words while preserving multi-column gaps</li>
              <li>Detects numbers and monetary values for proper spreadsheet calculation</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Layers :size="24" /></span>
            <h3>Multi-Page Consolidation Options</h3>
            <p>Whether you are dealing with a 2-page invoice or a 50-page audit statement, choose whether all pages append into one continuous master table or separate into individual worksheet tabs per page.</p>
            <ul>
              <li>Option to skip repeating header rows on subsequent pages</li>
              <li>Normalized column count prevents shifted columns</li>
              <li>Interactive sheet tab switcher in preview</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><FileSpreadsheet :size="24" /></span>
            <h3>Authentic Microsoft Excel &amp; CSV Export</h3>
            <p>Download clean, compliant OpenXML spreadsheets (.xlsx) styled with dark slate header bars and auto-proportional column widths, or download RFC 4180 CSV files ready for database imports.</p>
            <ul>
              <li>Compatible with Microsoft Excel, Office 365, Google Sheets &amp; Numbers</li>
              <li>Interactive table preview lets you edit cells before downloading</li>
              <li>One-click copy table to clipboard for rapid pasting</li>
            </ul>
          </article>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="faq-section container" id="questions">
        <div class="section-intro">
          <span class="mini-label">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Common Questions About Converting PDF to Excel</h2>
          <p>Everything you need to know about our free in-browser PDF to Excel table converter.</p>
        </div>
        <div class="faq-list">
          <details v-for="[question, answer] in faqs" :key="question" class="faq-item">
            <summary class="faq-question">
              <span>{{ question }}</span>
              <ChevronDown :size="18" class="faq-chevron" />
            </summary>
            <div class="faq-answer">
              <p>{{ answer }}</p>
            </div>
          </details>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
