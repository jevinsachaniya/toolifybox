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
  alias: ['/csv-to-json', '/tools/csv-converter', '/tools/convert-csv-to-json'],
});

const pageTitle = 'CSV to JSON Converter – Free Instant Online Table Converter | We Make PDF';
const pageDescription = 'Convert CSV files, TSV data, and tabular text into clean, structured JSON objects in milliseconds. 100% private in-browser converter with type inference, nested key unflattening, and NDJSON support.';

const steps = [
  {
    number: '01',
    title: 'Choose Input Method',
    desc: 'Upload or drop a .csv / .tsv / .txt file, or paste raw delimited spreadsheet text directly into the interactive editor.',
  },
  {
    number: '02',
    title: 'Configure Parsing Options',
    desc: 'Auto-detect or select delimiters (comma, tab, semicolon, pipe), enable automatic number & boolean inference, and toggle nested key unflattening.',
  },
  {
    number: '03',
    title: 'Preview & Download JSON',
    desc: 'Inspect your structured data in the interactive code viewer or table preview, copy JSON to clipboard, or download the clean .json / .ndjson file.',
  },
];

const faqs = [
  [
    'How does automatic delimiter detection work?',
    'The converter analyzes candidate delimiters (comma, semicolon, tab, and pipe) across your non-empty lines outside of quotation marks. It calculates frequency and row consistency to determine the correct format automatically.',
  ],
  [
    'Can the converter handle quotes, commas, and multiline cells?',
    'Yes! Our engine is strictly compliant with the RFC 4180 specification. It accurately parses fields enclosed in quotes, escaped quotes (""), commas inside quotes, and multiline entries across row boundaries.',
  ],
  [
    'What does "Unflatten dot keys" do?',
    'If your CSV headers use dot notation (like customer.name, shipping.city, or items.0.sku), our engine automatically reconstructs true nested JSON objects and arrays instead of leaving flat dotted property names.',
  ],
  [
    'What output formats are supported?',
    'You can export your data as a standard Array of Objects [ { ... } ], an Object Keyed by First Column { "ID": { ... } }, a compact 2D Matrix { headers, rows }, or NDJSON (Newline Delimited JSON) for big data databases.',
  ],
  [
    'Are my confidential business files or CSV records uploaded to external servers?',
    'Never. 100% of the parsing, conversion, and JSON generation runs locally inside your browser memory using client-side JavaScript. Your confidential records, employee salaries, and customer databases never touch any remote cloud infrastructure.',
  ],
  [
    'What is NDJSON / JSON Lines and when should I use it?',
    'NDJSON outputs each record as a self-contained, single-line JSON string separated by newlines. It is the preferred format for streaming large datasets into cloud data warehouses like Google BigQuery, Amazon Athena, Elasticsearch, and MongoDB.',
  ],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/csv-to-json',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'CSV to JSON', path: '/tools/csv-to-json' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/csv-to-json',
      'CSV to JSON Converter',
      pageDescription,
      [
        'Convert CSV, TSV, and delimited text to structured JSON',
        'Dual input modes: Drag-and-drop file upload or direct text editor',
        'Auto delimiter detection (comma, semicolon, tab, pipe)',
        'Automatic data type inference (numbers, booleans, null)',
        'Dot notation unflattening (a.b.c to deep nested objects)',
        'Multiple JSON output modes (Array, Keyed Object, 2D Matrix, NDJSON)',
        'Interactive table preview with search and pagination',
        '100% private client-side execution with zero server uploads',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Convert CSV to JSON Online for Free', pageDescription, steps, siteUrl, '/tools/csv-to-json'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <!-- Main Converter Hero Section -->
      <section class="tools-layout container csv-to-json-layout">
        <div class="tools-hero">
          <span class="eyebrow"><Sparkles :size="13" /> DATA PARSER &amp; ETL TOOL</span>
          <h1>Convert CSV to JSON Online<br /><span>fast, private, and nested.</span></h1>
          <p>Transform spreadsheets, TSV data, and CSV dumps into clean, modern JSON in milliseconds. Supports auto-delimiter detection, type inference, dot-key unflattening, and NDJSON with 100% in-browser privacy.</p>
        </div>

        <div class="tools-converter-wrap" id="converter">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> CSV to JSON Ready</div>
          <CsvToJsonConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally in browser memory. Zero spreadsheet uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <strong>Auto Delimiter Detection</strong>
                <p>Intelligently recognizes commas, tabs (TSV), semicolons, and pipes without manual setup.</p>
              </div>
            </li>
            <li>
              <span><Sliders :size="14" /></span>
              <div>
                <strong>Smart Type Inference</strong>
                <p>Automatically detects booleans, integers, floats, and nulls, or preserves raw strings.</p>
              </div>
            </li>
            <li>
              <span><Layers :size="14" /></span>
              <div>
                <strong>Nested Keys &amp; NDJSON</strong>
                <p>Unflatten dot-notation headers into deep JSON objects, or output BigQuery-ready JSON Lines.</p>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <strong>100% Client-Side Privacy</strong>
                <p>All data transformation runs inside your browser sandbox. Your database dumps never leave your device.</p>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <Sparkles :size="16" />
            <div>
              <strong>Pro-Tip for Complex Data:</strong>
              Use dot notation in your column headers (e.g. <code>customer.name</code>, <code>customer.email</code>, <code>shipping.city</code>). Our engine will automatically reconstruct clean, multi-level nested JSON objects!
            </div>
          </div>
        </div>
      </section>

      <!-- How to Steps Section -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">QUICK TUTORIAL</span>
          <h2>How to Convert CSV to JSON in 3 Simple Steps</h2>
          <p>Parse and restructure tabular data into modern JSON payloads in seconds with zero software installations.</p>
        </div>

        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span>
                <FileSpreadsheet v-if="step.number === '01'" :size="22" />
                <Code2 v-else-if="step.number === '02'" :size="22" />
                <Download v-else :size="22" />
              </span>
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
          <span class="mini-label">WHY CONVERT CSV TO JSON?</span>
          <h2>Bridge Spreadsheets and Modern Software Development</h2>
          <p>Spreadsheet programs like Excel and Google Sheets are the world's most common database. But modern web apps, APIs, mobile backends, and cloud databases run on JSON.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><FileCode2 :size="24" /></span>
            <h3>RFC 4180 Parsing &amp; Auto-Delimiters</h3>
            <p>Standard regex splitters break when cells contain commas or quotes. Our parser fully implements the RFC 4180 specification.</p>
            <ul>
              <li>Handles quotes, escaped quotes (""), and commas inside text</li>
              <li>Auto-detects comma, semicolon (;), tab (\t), and pipe (|)</li>
              <li>Full support for multiline values and CRLF line breaks</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Database :size="24" /></span>
            <h3>Type Inference &amp; Deep Nesting</h3>
            <p>Convert flat tabular exports into production-ready object trees with native JavaScript primitives and nested keys.</p>
            <ul>
              <li>Casts numbers, booleans, and null values accurately</li>
              <li>Preserves leading zero strings (zip codes, phone IDs)</li>
              <li>Unflattens dot notation (e.g. <code>user.address.city</code>)</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ShieldCheck :size="24" /></span>
            <h3>4 Versatile Output Modes &amp; Privacy</h3>
            <p>Choose the exact JSON structure required by your target system, from standard arrays to streaming JSON Lines.</p>
            <ul>
              <li>Array of Objects [ { ... } ] &amp; Keyed Object maps</li>
              <li>Compact 2D Matrix mode { headers, rows }</li>
              <li>NDJSON / JSON Lines for Elasticsearch &amp; BigQuery</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Where is CSV to JSON Used in Everyday Work?</h2>
          <p>Streamline workflows between non-technical business teams and engineering systems.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>API Mocking &amp; Database Seeders</h4>
            <p>Turn client product spreadsheets and catalogs into JSON fixtures for Node.js, Python, or PostgreSQL seeders.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Data Warehousing &amp; Big Data</h4>
            <p>Export large CSV dumps into streaming NDJSON format for instant batch loading into Google BigQuery, Snowflake, or Elasticsearch.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>E-Commerce &amp; CRM Migration</h4>
            <p>Convert Shopify, WooCommerce, or Salesforce customer CSV exports into structured JSON payloads for custom webhooks.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>CI/CD &amp; Config Pipelines</h4>
            <p>Transform localization translations or configuration tables into JSON files used by frontend apps and build scripts.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED DATA UTILITIES</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/json-to-csv" class="seo-keyword-pill">JSON to CSV Converter</NuxtLink>
            <NuxtLink to="/tools/excel-to-pdf" class="seo-keyword-pill">Excel to PDF</NuxtLink>
            <NuxtLink to="/tools/extract-ocr" class="seo-keyword-pill">Extract OCR Text</NuxtLink>
            <NuxtLink to="/tools/convert-image" class="seo-keyword-pill">Convert Image Format</NuxtLink>
            <NuxtLink to="/tools/watermark-pdf" class="seo-keyword-pill">Watermark PDF</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Frequently Asked Questions About CSV to JSON</h2>
          <p>Everything you need to know about parsing delimited files, data types, and JSON formatting.</p>
          <div class="faq-decoration" aria-hidden="true">
            <FileSpreadsheet :size="42" />
            <span>CSV &bull; JSON</span>
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
          <span class="mini-label">NEED TO GO IN THE OPPOSITE DIRECTION?</span>
          <h2>Convert JSON data back to CSV spreadsheets</h2>
          <p>Transform JSON arrays and API responses into Excel-ready CSV files with automatic key flattening and UTF-8 BOM.</p>
        </div>
        <NuxtLink to="/tools/json-to-csv" class="primary-button">
          Open JSON to CSV <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

