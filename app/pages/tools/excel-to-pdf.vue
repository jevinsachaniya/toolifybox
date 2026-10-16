<script setup>
import { Check, FileSpreadsheet, LockKeyhole, ShieldCheck, Sparkles, Table, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/excel-to-pdf', '/xlsx-to-pdf'],
});

const pageDescription = 'Convert Excel spreadsheets (.xlsx, .csv) to PDF online for free. Preview spreadsheet tables, choose page orientation, and generate clean PDF documents privately in your browser.';
usePageSeo({
  title: 'Excel to PDF Converter — Free XLSX & CSV to PDF | Toolifybox',
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
      ['XLSX workbook parsing', 'CSV data table support', 'Multi-sheet tabs preview', 'Landscape and Portrait orientation', 'Private browser processing']
    ),
  ],
});

const steps = [
  { number: '01', title: 'Choose an Excel File', desc: 'Add one .xlsx or .csv spreadsheet up to 20 MB. Your confidential financial and business data never leaves your computer.' },
  { number: '02', title: 'Review Sheets & Layout', desc: 'Preview sheet tables, choose Landscape or Portrait orientation, and pick all sheets or a specific tab.' },
  { number: '03', title: 'Download PDF', desc: 'Convert and save your formatted spreadsheet report as a clean, paginated PDF ready to share or print.' },
];
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

      <section class="how-section container">
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
    </main>

    <SiteFooter message="Private spreadsheet conversion, right in your browser." />
  </div>
</template>

