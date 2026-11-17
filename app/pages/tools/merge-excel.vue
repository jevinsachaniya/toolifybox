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
  alias: ['/merge-excel', '/combine-excel', '/tools/combine-excel'],
});

const pageTitle = 'Merge Excel Files Online — Combine Sheets [100% Free] | We Make PDF';
const pageDescription = 'Combine multiple Excel (.xlsx, .xls) & CSV files into one sheet or workbook online for free. Smart column matching, instant preview, 100% private & no sign-up!';

const steps = [
  {
    number: '01',
    title: 'Upload Excel & CSV Files',
    desc: 'Select or drag and drop multiple .xlsx, .xls, or .csv files. Reorder files easily or choose specific worksheets from multi-sheet workbooks.',
  },
  {
    number: '02',
    title: 'Choose Merge Settings',
    desc: 'Select whether to append all rows into a single master sheet (with automatic column header matching) or consolidate each file as a separate tab.',
  },
  {
    number: '03',
    title: 'Preview & Download Master Workbook',
    desc: 'Inspect the merged table preview directly in your browser, search columns, and download your consolidated Microsoft Excel (.xlsx) or CSV file with one click.',
  },
];

const faqs = [
  [
    'Can I merge multiple Excel files into one single sheet?',
    'Yes! Select the "Single Sheet (Append Rows)" mode. Our smart column matching aligns rows with identical header names across all files, even if the columns are ordered differently in each spreadsheet.',
  ],
  [
    'What happens if my files have different column orders or missing columns?',
    'When "Match by Column Header Names" is enabled, the tool builds a superset of all unique columns found across all files. Rows from each file are aligned to their matching column headers, and missing values are left blank without breaking data alignment.',
  ],
  [
    'Can I keep each uploaded file or worksheet as a separate tab in one Excel workbook?',
    'Yes! Choose the "Multiple Tabs (Consolidate Sheets)" mode. The tool packages each uploaded file or sheet into its own tab within a single master .xlsx workbook, automatically sanitizing sheet names and resolving duplicate names.',
  ],
  [
    'Can I include a column showing the source file name for each row?',
    'Yes! Enable the "Add \'Source File\' column" toggle in Single Sheet mode. The tool injects a leading column indicating which file each row originated from, making auditing and filtering effortless.',
  ],
  [
    'Are my private Excel sheets and financial data uploaded to any server?',
    'Never. We Make PDF processes all spreadsheet parsing, row alignment, and OpenXML Excel workbook generation 100% locally in your browser memory using WebAssembly and JavaScript. Your confidential records, payroll, and financials never leave your machine.',
  ],
  [
    'What file formats and sizes are supported?',
    'You can upload Microsoft Excel (.xlsx), older Excel (.xls), and comma-separated values (.csv) files. You can merge up to 50 files at once, with individual file sizes up to 100 MB.',
  ],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/merge-excel',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Merge Excel', path: '/tools/merge-excel' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/merge-excel',
      'Merge Excel Files Online Free',
      pageDescription,
    ),
    ({ siteUrl }) => howToSchema(
      'How to Merge Excel Files Online for Free',
      pageDescription,
      steps,
      siteUrl,
      '/tools/merge-excel',
    ),
    () => faqSchema(faqs),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to excel merger</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <!-- Main Layout: Hero + Converter Card + Quick Points -->
      <section class="tools-layout container">
        <div class="tools-hero">
          <span class="eyebrow"><Sparkles :size="13" /> IN-BROWSER SPREADSHEET CONSOLIDATOR</span>
          <h1>Merge multiple Excel files into<br /><span>one clean master workbook.</span></h1>
          <p>Combine multiple .xlsx, .xls, and .csv files effortlessly. Append rows into a single sheet with smart column matching or consolidate files as separate tabs in one workbook.</p>
        </div>

        <div class="tools-converter-wrap" id="converter">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Ready to Merge</div>
          <ClientOnly>
            <MergeExcelConverter />
          </ClientOnly>
          <div class="under-card"><ShieldCheck :size="15" /> 100% private client-side merge. Zero spreadsheet data leaves your device.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li><span><Merge :size="14" /></span><div><b>Smart Header Matching</b><small>Align columns automatically even if order differs across files.</small></div></li>
            <li><span><Layers :size="14" /></span><div><b>Multi-Tab Consolidation</b><small>Keep each sheet or file as an individual tab in one master workbook.</small></div></li>
            <li><span><Columns :size="14" /></span><div><b>Source File Tracking</b><small>Optionally inject a column showing which file each row came from.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>100% Device-Level Privacy</b><small>Parsed and assembled inside browser memory with zero server uploads.</small></div></li>
          </ul>

          <div class="tools-tip"><Check :size="18" /><p><b>Tip: Normalize header names for optimal alignment</b><br />If columns have slightly different names (e.g., "Email" vs "E-mail Address"), rename them before merging or use Position-Based merge mode.</p></div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="how-section container" id="how-it-works">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Combine multiple spreadsheets in three easy steps</h2>
          <p>Fast, clean, and private spreadsheet consolidation without installing desktop software.</p>
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
          <span class="mini-label">HIGH-PERFORMANCE EXCEL MERGER</span>
          <h2>Consolidate Data from Multiple Reports &amp; Branches</h2>
          <p>Manual copy-pasting between dozens of Excel workbooks leads to misaligned columns, missed rows, and formula errors. We Make PDF unites your spreadsheets with precision and zero hassle.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Merge :size="24" /></span>
            <h3>Single Sheet Append with Header Detection</h3>
            <p>Combine weekly sales, regional inventory, or survey responses into one unified table. Our smart alignment engine maps column headers dynamically, expanding columns when new headers appear and aligning matching headers perfectly.</p>
            <ul>
              <li>Supports both Header-Name and Column-Position alignment modes</li>
              <li>Toggle first row as table header or raw numeric row index</li>
              <li>Preserves text, numbers, dates, and currency values cleanly</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Layers :size="24" /></span>
            <h3>Consolidate as Multiple Workbook Tabs</h3>
            <p>Need to bundle quarterly reports, branch sheets, or department statements into a single deliverable? Multi-Tab mode gathers every uploaded sheet into one well-structured Microsoft Excel (.xlsx) file.</p>
            <ul>
              <li>Auto-sanitizes tab names to meet Microsoft Excel standards</li>
              <li>Auto-resolves duplicate tab names (e.g. "Sheet1", "Sheet1_2")</li>
              <li>Per-file sheet selector lets you choose specific worksheets</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><FileSpreadsheet :size="24" /></span>
            <h3>Authentic OpenXML (.xlsx) &amp; CSV Export</h3>
            <p>Generated files are valid OpenXML spreadsheets compatible with Microsoft Excel, Microsoft 365, Google Sheets, LibreOffice Calc, and Apple Numbers without corrupt file warnings or missing styles.</p>
            <ul>
              <li>Includes genuine styles, workbook relationships, and column widths</li>
              <li>Export as .xlsx workbook or download single-sheet data as .csv</li>
              <li>One-click copy to clipboard to paste directly into Google Sheets</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>100% In-Browser Confidentiality</h3>
            <p>Your business reports, customer lists, payroll figures, and financial balance sheets contain strictly sensitive corporate data. Our tool executes all parsing and zip packaging locally inside your web browser.</p>
            <ul>
              <li>No files are ever transmitted over the network or saved to clouds</li>
              <li>Safe for enterprise, healthcare (HIPAA), and GDPR environments</li>
              <li>Free to use with no account or registration required</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Where Merging Excel Files Saves Hours of Manual Work</h2>
          <p>Streamline reporting and analytics across business operations.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Monthly &amp; Quarterly Financial Consolidation</h4>
            <p>Unite 12 monthly expense sheets or 4 quarterly revenue logs into one continuous annual spreadsheet for pivot tables, tax prep, and year-over-year forecasting.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Multi-Location Store &amp; Branch Reports</h4>
            <p>Collect daily sales spreadsheets from multiple retail branches or franchises and merge them into a single master sheet with source tracking for centralized auditing.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>E-Commerce Order &amp; Inventory Sync</h4>
            <p>Combine export CSVs from Shopify, Amazon Seller Central, WooCommerce, and local warehouse logs into one consolidated database ready for bulk upload.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Survey &amp; Research Data Aggregation</h4>
            <p>Aggregate batch survey responses or experimental measurement sheets into a master dataset for statistical analysis and machine learning training.</p>
          </div>
        </div>

        <!-- Related Tools -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/business-card-to-excel" class="seo-keyword-pill">Business Card to Excel</NuxtLink>
            <NuxtLink to="/tools/excel-to-pdf" class="seo-keyword-pill">Excel to PDF</NuxtLink>
            <NuxtLink to="/tools/excel-formula-explainer" class="seo-keyword-pill">Excel Formula Explainer</NuxtLink>
            <NuxtLink to="/tools/json-to-csv" class="seo-keyword-pill">JSON to CSV</NuxtLink>
            <NuxtLink to="/tools/csv-to-json" class="seo-keyword-pill">CSV to JSON</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About Merging Excel Files</h2>
          <p>Everything you need to know about combining workbooks, alignment options, and sheet privacy.</p>
          <div class="faq-decoration" aria-hidden="true">
            <FileSpreadsheet :size="42" />
            <span>EXCEL &bull; MERGE</span>
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
          <span class="mini-label">READY TO CONSOLIDATE YOUR DATA?</span>
          <h2>Start Merging Excel Files Now</h2>
          <p>Upload your .xlsx or .csv files and get your unified master workbook in seconds. Fast, free, and 100% private.</p>
        </div>
        <a href="#converter" class="primary-button">
          Merge Excel Files <ArrowRight :size="18" />
        </a>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private client-side Excel and CSV workbook merger." />
  </div>
</template>
