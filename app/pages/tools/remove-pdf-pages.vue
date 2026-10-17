<script setup>
import { Check, FileMinus, FileText, Layers, ShieldCheck, Sparkles, Trash2, Zap } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/remove-pages', '/remove-pdf-pages', '/delete-pdf-pages', '/tools/remove-pages'],
});

const pageDescription = 'Remove pages from PDF online for free. Delete unwanted pages, preview every page visually, select custom ranges, and download a clean PDF privately in your browser without uploading files.';
usePageSeo({
  title: 'Remove Pages from PDF — Free Online PDF Page Remover | Toolifybox',
  description: pageDescription,
  path: '/tools/remove-pdf-pages',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Remove PDF Pages', path: '/tools/remove-pdf-pages' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/remove-pdf-pages',
      'Remove Pages from PDF',
      pageDescription,
      ['Visual page preview grid', 'Click-to-delete page cards', 'Page range and comma input support', 'Zero server uploads', '100% private in-browser editing']
    ),
  ],
});

const steps = [
  { number: '01', title: 'Choose a PDF', desc: 'Select any PDF document with 2 or more pages from your device or drop it into the upload box.' },
  { number: '02', title: 'Pick Pages to Delete', desc: 'Click any page thumbnail or enter page numbers (e.g. 2, 4-6) to mark unwanted pages for removal.' },
  { number: '03', title: 'Download Clean PDF', desc: 'Your new PDF is rebuilt instantly in your browser memory with unwanted pages stripped away.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container remove-pdf-pages-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> PDF PAGE MANAGEMENT</span>
          <h1>Remove pages<br /><span>from your PDF.</span></h1>
          <p>Delete blank pages, covers, duplicate sheets, or confidential sections from your PDF documents in seconds. Review visual page previews, click pages to mark them for removal, and download a streamlined file without uploading to any server.</p>
          <ul class="tools-points">
            <li>
              <span><Check :size="14" /></span>
              <div>
                <b>Visual Page Previews</b>
                <small>Inspect thumbnail previews of every page in your document before deciding what to delete.</small>
              </div>
            </li>
            <li>
              <span><Trash2 :size="14" /></span>
              <div>
                <b>Click-to-Delete Simplicity</b>
                <small>Click any page to mark it for deletion, or type custom page ranges like 2, 4–6, 9.</small>
              </div>
            </li>
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <b>100% Client-Side Privacy</b>
                <small>PDF pages are parsed and removed directly inside your browser. No files leave your computer or phone.</small>
              </div>
            </li>
            <li>
              <span><Layers :size="14" /></span>
              <div>
                <b>Lossless Rebuilding</b>
                <small>Retains original fonts, vector sharpness, embedded links, and resolution on all kept pages.</small>
              </div>
            </li>
          </ul>
          <div class="tools-tip">
            <FileMinus :size="18" />
            <p>
              <b>Pro Tip</b><br />
              Use the range box to quickly remove large blocks of pages, or use "Quick select" to clean up even or odd sheets from scanned booklets.
            </p>
          </div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Remove Pages Ready</div>
          <RemovePdfPagesConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero server uploads.</div>
        </div>
      </section>

      <section class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Delete unwanted PDF pages in three easy steps</h2>
          <p>Streamline and trim your documents with simple, fast visual controls.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><Trash2 :size="22" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>
    </main>

    <SiteFooter message="Private PDF editing and page removal, right in your browser." />
  </div>
</template>

