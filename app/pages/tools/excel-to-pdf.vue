<script setup>
import { ArrowRight, Check, ChevronDown, Cpu, FileCheck, FileSpreadsheet, Layers, LockKeyhole, ShieldCheck, Sparkles, Table, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/excel-to-pdf', '/xlsx-to-pdf'],
});

const pageTitle = 'Excel to PDF Converter — Free XLSX & CSV to PDF Online | Toolifybox';
const pageDescription = 'Convert Excel spreadsheets (.xlsx, .csv) to PDF online for free. Preview spreadsheet tables, choose portrait or landscape page orientation, and generate clean PDF documents privately in your browser without uploading files.';

const steps = [
  { number: '01', title: 'Choose an Excel File', desc: 'Add one .xlsx or .csv spreadsheet up to 20 MB. Your confidential financial and business data never leaves your computer.' },
  { number: '02', title: 'Review Sheets & Layout', desc: 'Preview sheet tables, choose Landscape or Portrait orientation, and pick all sheets or a specific tab.' },
  { number: '03', title: 'Download PDF Report', desc: 'Convert and save your formatted spreadsheet report as a clean, paginated PDF ready to share or print.' },
];

const faqs = [
  ['How does the converter handle wide spreadsheets with many columns?', 'You can switch the page orientation to Landscape, which provides expansive horizontal margins. Toolifybox also applies smart table pagination, ensuring columns are auto-fitted proportionally and rows are never cut off in the middle of text.'],
  ['Can I convert multiple workbook tabs (sheets) into a single PDF document?', 'Yes! The multi-sheet selector allows you to render all sheets sequentially in your workbook or select only individual tabs (such as Q4 Summary or Balance Sheet) for export.'],
  ['Are my confidential accounting and payroll records uploaded to the cloud?', 'Never. Toolifybox parses XLSX and CSV files entirely client-side using JavaScript in your web browser. Your private profit-and-loss reports, employee salaries, and inventory figures never leave your local device.'],
  ['Does this tool support both .xlsx and .csv file formats?', 'Yes. You can upload modern Microsoft Excel XML workbooks (.xlsx) as well as comma-separated values (.csv) data exports from Google Sheets, QuickBooks, or database dumps.'],
  ['Will cell formulas show as formulas or calculated values?', 'Toolifybox extracts the cached calculated results of formulas (such as SUM, AVERAGE, and VLOOKUP) so your final PDF displays accurate final figures rather than raw formula syntax.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/excel-to-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Excel to PDF', path: '/tools/excel-to-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/excel-to-pdf',
      'Excel to PDF Converter',
      pageDescription,
      ['XLSX workbook parsing', 'CSV data table support', 'Multi-sheet tabs preview', 'Landscape and Portrait orientation', 'Private browser processing', 'Zero server uploads']
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Convert Excel Spreadsheets to PDF Online', pageDescription, steps, siteUrl, '/tools/excel-to-pdf'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container excel-pdf-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> SPREADSHEET CONVERTER</span>
          <h1>Convert Excel<br /><span>sheets to PDF.</span></h1>
          <p>Transform your Microsoft Excel (.xlsx) workbooks and CSV data tables into beautifully formatted, paginated PDF reports without third-party software or server uploads.</p>
          <ul class="tools-points">
            <li>
              <span><Check :size="14" /></span>
              <div>
                <b>Multi-Sheet Support</b>
                <small>Export all workbook sheets or select specific sheets to render.</small>
              </div>
            </li>
            <li>
              <span><WandSparkles :size="14" /></span>
              <div>
                <b>Landscape &amp; Portrait Fit</b>
                <small>Choose optimal orientation so wide spreadsheets stay legible and cleanly arranged.</small>
              </div>
            </li>
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <b>Clean Table Pagination</b>
                <small>Tables are split neatly across pages without cutting rows horizontally.</small>
              </div>
            </li>
            <li>
              <span><LockKeyhole :size="14" /></span>
              <div>
                <b>100% Private in Browser</b>
                <small>Financial, inventory, and sensitive records stay completely in local browser memory.</small>
              </div>
            </li>
          </ul>
          <div class="tools-tip">
            <FileSpreadsheet :size="18" />
            <p>
              <b>Wide Spreadsheets &amp; Tables</b><br />
              Landscape orientation gives extra width for multi-column spreadsheets and quarterly balance sheets.
            </p>
          </div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Excel to PDF Ready</div>
          <ExcelToPdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Converted locally on your device. No document uploads.</div>
        </div>
      </section>

      <section class="how-section container" id="how-it-works">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Turn spreadsheets into PDF in seconds</h2>
          <p>Clean spreadsheet formatting and private processing make sharing reports easy.</p>
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

      <!-- Educational Guide Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">REPORT STANDARDIZATION</span>
          <h2>Why Export Excel Spreadsheets to PDF?</h2>
          <p>Sending raw .xlsx files to clients, investors, or tax authorities exposes dynamic formula logic, uncalculated references, and risks accidental edits to underlying figures.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Table :size="24" /></span>
            <h3>Reliable Table Pagination</h3>
            <p>Anyone who has printed an Excel spreadsheet knows the frustration of tables splitting awkwardly across pages. Toolifybox structures table cells cleanly to ensure consistent, readable headers and margins.</p>
            <ul>
              <li>Intelligent column width auto-fitting</li>
              <li>Landscape orientation for multi-column accounting ledgers</li>
              <li>Clean page breaks between multiple worksheet tabs</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Layers :size="24" /></span>
            <h3>XLSX and CSV Versatility</h3>
            <p>Whether you are exporting raw SQL database records in CSV or multi-tab financial models in Microsoft Excel, our browser parser interprets cell types, currencies, dates, and percentages accurately.</p>
            <ul>
              <li>Supports both .xlsx workbook packages and plain text .csv</li>
              <li>Tab-by-tab preview with toggleable sheet inclusion</li>
              <li>Renders calculated values directly from formula caches</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>Financial Data Security</h3>
            <p>Payroll sheets, investor cap tables, and revenue projections must never be uploaded to third-party cloud servers. Toolifybox converts spreadsheets locally in your browser memory.</p>
            <ul>
              <li>Zero network transmission of spreadsheet data</li>
              <li>No server caching, temporary files, or third-party tracking</li>
              <li>Full compliance with strict corporate confidentiality policies</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Common Uses for Excel to PDF Conversion</h2>
          <p>Convert raw financial data into shareable executive reports.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Invoices &amp; Purchase Orders</h4>
            <p>Lock down pricing, line items, and bank details before emailing invoices to clients so figures cannot be modified.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Monthly Profit &amp; Loss Statements</h4>
            <p>Present clean, printable P&amp;L reports to business partners and board members without exposing internal accounting tabs.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Tax Audit Documentation</h4>
            <p>Create permanent, time-stamped PDF records of expense logs, tax deductions, and payroll summaries for tax preparation.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Project Budgets &amp; Timelines</h4>
            <p>Distribute project estimates and resource allocations to contractors in a universal format that opens on mobile phones.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED CONVERTERS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/powerpoint-to-pdf" class="seo-keyword-pill">PowerPoint to PDF</NuxtLink>
            <NuxtLink to="/tools/word-to-pdf" class="seo-keyword-pill">Word to PDF</NuxtLink>
            <NuxtLink to="/tools/compress-pdf" class="seo-keyword-pill">Compress PDF</NuxtLink>
            <NuxtLink to="/tools/protect-pdf" class="seo-keyword-pill">Protect PDF</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About Excel to PDF</h2>
          <p>Find answers to common questions about converting XLSX and CSV spreadsheets into PDF documents.</p>
          <div class="faq-decoration" aria-hidden="true">
            <FileSpreadsheet :size="42" />
            <span>EXCEL &bull; PDF</span>
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
          <span class="mini-label">LOOKING TO MERGE MULTIPLE REPORTS?</span>
          <h2>Combine your PDF reports into one document</h2>
          <p>Merge your newly converted spreadsheet PDF with financial statements, cover letters, and audit notes.</p>
        </div>
        <NuxtLink to="/tools/merge-pdf" class="primary-button">
          Open Merge PDF <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private spreadsheet conversion, right in your browser." />
  </div>
</template>

