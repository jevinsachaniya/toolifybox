<script setup>
import {
  ArrowRight,
  Check,
  ChevronDown,
  Code2,
  Cpu,
  Database,
  Download,
  Eye,
  FileCheck,
  FileCode2,
  FileSpreadsheet,
  FileText,
  FileUp,
  Globe,
  Layers,
  LockKeyhole,
  Maximize2,
  ShieldCheck,
  Sparkles,
  Table,
  UploadCloud,
  Zap,
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/json-to-csv', '/tools/json-converter', '/tools/convert-json-to-csv'],
});

const pageTitle = 'JSON to CSV Converter — Free Instant Online Table Converter | We Make PDF';
const pageDescription = 'Convert JSON files and raw JSON text into clean, organized CSV spreadsheets in milliseconds. 100% private in-browser converter with table preview, nested key flattening, and Excel UTF-8 BOM support.';

const steps = [
  { number: '01', title: 'Choose Input Method', desc: 'Select Option 1 to upload or drop a .json / .ndjson file, or select Option 2 to paste direct JSON text into the interactive editor.' },
  { number: '02', title: 'Customize CSV Options', desc: 'Configure your preferred delimiter (comma, semicolon, tab, pipe), toggle nested object flattening (e.g. user.address.city), and enable Excel UTF-8 BOM.' },
  { number: '03', title: 'Preview & Download', desc: 'Inspect your formatted data in the interactive grid table, copy the generated CSV directly to your clipboard, or download the ready-to-use .csv file.' },
];

const faqs = [
  ['How fast does the JSON to CSV conversion take?', 'Conversion happens virtually instantaneously in under 5 to 20 milliseconds directly inside your web browser. Because no files are uploaded over the network, thousands of rows are converted and previewed with zero lag.'],
  ['How does nested JSON object flattening work?', 'When "Flatten Nested Keys" is enabled, nested objects are automatically unpacked into clean column headers using dot notation. For example, { "customer": { "name": "Sarah", "city": "London" } } becomes two columns: customer.name and customer.city.'],
  ['Can I convert JSON lines (NDJSON) or files with multiple objects?', 'Yes! The tool automatically detects whether your input is a standard JSON array, an object with a data wrapper (such as { data: [...] }), or line-delimited JSON (NDJSON/JSONL) where each line represents an independent record.'],
  ['What is the Excel UTF-8 BOM option and should I use it?', 'The Byte Order Mark (\\uFEFF) instructs Microsoft Excel on Windows and macOS to open the CSV using UTF-8 text encoding. This ensures international names, accents, Hindi characters, currency symbols, and emojis display clearly without turning into gibberish.'],
  ['Is my JSON data or confidential company records uploaded to any server?', 'No. 100% of the parsing, flattening, and CSV generation executes client-side inside your browser sandbox. Your proprietary database dumps, customer emails, and sensitive logs never leave your device.'],
  ['Can I open the generated CSV in Google Sheets or Excel?', 'Yes! The generated CSV follows the official RFC 4180 specification with standard quotation escaping. You can open it directly in Microsoft Excel, Google Sheets, Apple Numbers, LibreOffice Calc, or import it into SQL databases.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/json-to-csv',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'JSON to CSV', path: '/tools/json-to-csv' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/json-to-csv',
      'JSON to CSV Converter',
      pageDescription,
      [
        'Convert JSON files and raw JSON text to CSV spreadsheets',
        'Dual input modes: Drag-and-drop file upload or direct text editor',
        'Lightning-fast conversion in under 10 milliseconds',
        'Automatic nested object flattening (a.b.c dot notation)',
        'Support for standard JSON, NDJSON/JSONL, and wrapped API arrays',
        'Interactive table grid preview with search and pagination',
        'Configurable delimiters: comma, semicolon, tab (TSV), and pipe',
        'RFC 4180 quotation escaping and Excel UTF-8 BOM encoding',
        '100% private client-side execution with zero server uploads',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Convert JSON to CSV Online for Free', pageDescription, steps, siteUrl, '/tools/json-to-csv'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to JSON to CSV converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <section class="tools-layout container">
        <div class="tools-hero">
          <span class="eyebrow"><Sparkles :size="13" /> INSTANT DATA &amp; CODE CONVERTER</span>
          <h1>Convert JSON to CSV<br /><span>fast, clean, and ready for Excel.</span></h1>
          <p>Transform raw JSON text or uploaded JSON files into structured, publication-quality CSV spreadsheets in milliseconds. Features nested key flattening, interactive table grid preview, RFC 4180 escaping, and 100% private in-browser processing.</p>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> JSON to CSV Ready</div>
          <JsonToCsvConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed 100% locally in your browser. Zero data uploads to any remote server.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <b>Instant In-Browser Speed</b>
                <small>Parses, flattens, and formats thousands of records in under 10ms with zero network lag.</small>
              </div>
            </li>
            <li>
              <span><FileSpreadsheet :size="14" /></span>
              <div>
                <b>Excel-Ready UTF-8 BOM</b>
                <small>Opens cleanly in Microsoft Excel, Google Sheets, and Numbers without character corruption.</small>
              </div>
            </li>
            <li>
              <span><Layers :size="14" /></span>
              <div>
                <b>Smart Nested Key Flattening</b>
                <small>Automatically unfolds complex deep object structures (<code>user.address.city</code>) into clean columns.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>Guaranteed Local Privacy</b>
                <small>Your proprietary database exports and customer records never leave your machine.</small>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <FileText :size="18" />
            <p><b>Pro Tip:</b> You can choose between Comma (<code>,</code>), Semicolon (<code>;</code> for European Excel), Tab (TSV), or Pipe (<code>|</code>) delimiters depending on where you plan to import your data.</p>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Three Steps to Convert JSON to CSV</h2>
          <p>Convert structured JSON trees into spreadsheet tables with full data fidelity.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><FileSpreadsheet :size="20" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Key Capabilities Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">KEY CAPABILITIES</span>
          <h2>Engineered for Developers, Analysts, and Accountants</h2>
          <p>Everything you need for seamless JSON data extraction and spreadsheet reporting.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><UploadCloud :size="24" /></span>
            <h3>Dual Input Flexibility</h3>
            <p>Drag and drop <code>.json</code> or <code>.ndjson</code> files up to 30 MB directly from your computer, or paste live payload text into the code editor with syntax formatting tools.</p>
            <ul>
              <li>Supports standard JSON, NDJSON/JSONL, and TXT files</li>
              <li>Syntax prettify, indent, minify, and clear tools</li>
              <li>Ready-to-use sample templates for quick testing</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Table :size="24" /></span>
            <h3>Interactive Table Grid Preview</h3>
            <p>Inspect your converted data with instant search filtering across all columns, row numbers, and paginated navigation before downloading.</p>
            <ul>
              <li>Live real-time search across values and headers</li>
              <li>Sticky table headers with clean horizontal scrolling</li>
              <li>Paginated navigation for large multi-page datasets</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Code2 :size="24" /></span>
            <h3>1-Click Copy or File Download</h3>
            <p>Copy the raw CSV output to your clipboard for quick pasting into code or databases, or download a dedicated <code>.csv</code> file ready for spreadsheets.</p>
            <ul>
              <li>Instant 1-click clipboard copy with checkmark toast</li>
              <li>Download clean RFC 4180 compliant <code>.csv</code> file</li>
              <li>Custom output filename configuration</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Database :size="24" /></span>
            <h3>NDJSON &amp; Wrapped Arrays</h3>
            <p>Handles line-delimited JSON log streams as well as standard REST API wrappers like <code>{ "data": [...] }</code> and <code>{ "items": [...] }</code> automatically.</p>
            <ul>
              <li>Auto-detects nested primary data arrays</li>
              <li>Supports streaming NDJSON / JSON Lines format</li>
              <li>Flattens deep objects with <code>a.b.c</code> dot notation</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Sparkles :size="24" /></span>
            <h3>RFC 4180 Escaping &amp; Excel BOM</h3>
            <p>Properly escapes double quotes, line breaks, commas, and special characters inside cells so spreadsheet parsers never break.</p>
            <ul>
              <li>Automatic quotation escaping for commas and quotes</li>
              <li>UTF-8 Byte Order Mark (BOM) for Excel encoding fix</li>
              <li>Configurable delimiters: comma, semicolon, tab, pipe</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ShieldCheck :size="24" /></span>
            <h3>100% Client-Side Security</h3>
            <p>Zero telemetry, zero server-side logging, and zero external network requests. Your proprietary customer and financial records remain completely confidential.</p>
            <ul>
              <li>Processing runs inside your device browser sandbox</li>
              <li>Zero file or data transmission over the internet</li>
              <li>No account registration, limits, or cookies required</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">EVERYDAY WORKFLOWS</span>
          <h2>Who Relies on We Make PDF JSON to CSV?</h2>
          <p>Developers, analysts, accountants, and e-commerce managers convert structured data with zero setup.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>API Developers &amp; DevOps</h4>
            <p>Export JSON logs, microservice payloads, and webhook events into clean CSV tables for debugging, reporting, and team retrospectives.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Data Analysts &amp; BI Teams</h4>
            <p>Flatten complex nested customer records and nested MongoDB collections directly into Excel-ready tables without writing custom Python scripts.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Accountants &amp; Operations</h4>
            <p>Import Stripe, Shopify, or billing JSON exports with customized UTF-8 BOM encoding for seamless analysis in Microsoft Excel and Google Sheets.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>E-Commerce &amp; Inventory Managers</h4>
            <p>Convert product catalogs, inventory manifests, and order dumps into standard CSV formats compatible with ERP systems and marketplace uploaders.</p>
          </div>
        </div>
      </section>

      <!-- Privacy Strip -->
      <section class="privacy-strip container">
        <div class="privacy-strip-content">
          <div class="privacy-badge"><ShieldCheck :size="20" /> 100% Private Client-Side Conversion</div>
          <h2>Your data never leaves your browser</h2>
          <p>Unlike third-party converters that harvest or store your JSON payloads on cloud servers, We Make PDF runs pure client-side JavaScript. Your confidential database records, API tokens, and user lists remain safe on your device.</p>
        </div>
      </section>

      <!-- Frequently Asked Questions -->
      <section id="questions" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about converting JSON records into CSV format.</p>
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

      <!-- Switch Tool Banner -->
      <section class="closing-cta container">
        <div>
          <span class="mini-label">LOOKING FOR ANOTHER TOOL?</span>
          <h2>Need to vectorize images to 4K SVG?</h2>
          <p>Try our dedicated Image to SVG vector converter with razor-sharp Bézier curve tracing.</p>
        </div>
        <NuxtLink to="/tools/image-to-svg" class="primary-button">
          Open Image to SVG <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

