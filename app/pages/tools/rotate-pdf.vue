<script setup>
import { Check, Layers, RotateCcw, RotateCw, ShieldCheck, Sparkles, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/rotate-pdf', '/tools/rotate-pages', '/rotate-pages'],
});

const pageDescription = 'Rotate PDF pages online for free. Fix upside-down or sideways pages, rotate individual pages or the entire document, and download your rotated PDF privately in your browser without uploading files.';
usePageSeo({
  title: 'Rotate PDF Pages Online — Free & Private | Toolifybox',
  description: pageDescription,
  path: '/tools/rotate-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Rotate PDF', path: '/tools/rotate-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/rotate-pdf',
      'Rotate PDF Pages',
      pageDescription,
      ['Visual interactive page previews', 'Live thumbnail rotation feedback', 'Batch rotate left, right or 180 degrees', 'Individual page rotation controls', 'Zero server uploads', '100% private in-browser orientation']
    ),
  ],
});

const steps = [
  { number: '01', title: 'Choose a PDF', desc: 'Select any PDF document up to 20 MB from your device or drop it into the upload box.' },
  { number: '02', title: 'Rotate Pages', desc: 'Turn individual pages left or right, or rotate all pages at once with convenient batch buttons.' },
  { number: '03', title: 'Download Rotated PDF', desc: 'Your reoriented PDF is generated instantly in your browser without altering text or image quality.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container rotate-pdf-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> DOCUMENT ORIENTATION</span>
          <h1>Rotate PDF<br /><span>pages easily.</span></h1>
          <p>Fix scanned sheets, sideways receipts, inverted contract pages, or upside-down presentations. Preview every page live, rotate specific sheets or the whole file, and download clean PDFs without uploading to any remote server.</p>
          <ul class="tools-points">
            <li>
              <span><Check :size="14" /></span>
              <div>
                <b>Live Visual Previews</b>
                <small>See thumbnails rotate in real time as you click, making orientation adjustments effortless.</small>
              </div>
            </li>
            <li>
              <span><RotateCw :size="14" /></span>
              <div>
                <b>Individual or Batch Controls</b>
                <small>Rotate single pages 90° or 180°, or rotate every page across the whole document at once.</small>
              </div>
            </li>
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <b>Lossless &amp; Instant</b>
                <small>Rotation updates the PDF page dictionary directly without recompressing images or fonts.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>100% Private in Browser</b>
                <small>Files stay in your device memory. No confidential records or documents are ever uploaded.</small>
              </div>
            </li>
          </ul>
          <div class="tools-tip">
            <RotateCcw :size="18" />
            <p>
              <b>Pro Tip</b><br />
              Need to rotate a landscape table or sideways invoice? Just click the 90° right arrow on that page, while keeping all other portrait pages untouched.
            </p>
          </div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Rotate PDF Ready</div>
          <RotatePdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero server uploads.</div>
        </div>
      </section>

      <section class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Rotate your PDF in three easy steps</h2>
          <p>Quickly adjust page orientation with live visual feedback.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><RotateCw :size="22" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>
    </main>

    <SiteFooter message="Private PDF orientation and page rotation, right in your browser." />
  </div>
</template>

