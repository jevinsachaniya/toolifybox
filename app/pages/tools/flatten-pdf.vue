<script setup>
import { Check, FileCheck, Layers, Lock, ShieldCheck, Sparkles, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/flatten-pdf', '/tools/flatten'],
});

const pageDescription = 'Flatten PDF forms and annotations online for free. Convert fillable form fields and digital markups into permanent page content privately in your browser without uploading files.';
usePageSeo({
  title: 'Flatten PDF Online — Lock Form Fields & Annotations | Toolifybox',
  description: pageDescription,
  path: '/tools/flatten-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Flatten PDF', path: '/tools/flatten-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/flatten-pdf',
      'Flatten PDF Forms & Annotations',
      pageDescription,
      ['Lock interactive form fields permanently', 'Preserve sharp vector fonts and text clarity', 'Full visual raster flattening mode for legal archiving', 'No software installation required', 'Zero server uploads', '100% private in-browser execution']
    ),
  ],
});

const steps = [
  { number: '01', title: 'Choose a PDF', desc: 'Select any fillable form or annotated PDF document from your device.' },
  { number: '02', title: 'Choose Mode', desc: 'Select Vector Form Locking (fast & crisp) or Full Visual Flattening for complete non-interactive compliance.' },
  { number: '03', title: 'Download Flat PDF', desc: 'Download your locked, flattened PDF ready for sharing, archiving, printing, or submission.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container flatten-pdf-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> PDF STANDARDIZATION</span>
          <h1>Flatten PDF<br /><span>forms &amp; layers.</span></h1>
          <p>Prevent unauthorized edits to completed contracts, tax forms, applications, and signed agreements. Flatten interactive AcroForm fields, checkboxes, dropdowns, and digital annotations permanently into read-only page content.</p>
          <ul class="tools-points">
            <li>
              <span><Check :size="14" /></span>
              <div>
                <b>Lock Interactive Form Fields</b>
                <small>Bake form values, text inputs, and check marks directly into the page graphics so they cannot be altered.</small>
              </div>
            </li>
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <b>Crisp Vector Preservation</b>
                <small>Standard mode maintains pristine vector typography, hyperlinks, and tiny file sizes without raster blur.</small>
              </div>
            </li>
            <li>
              <span><Layers :size="14" /></span>
              <div>
                <b>Full Print &amp; Legal Flattening</b>
                <small>Optional visual flattening rasterizes all page layers to ensure 100% compliance with government and legal standards.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>Guaranteed Device Privacy</b>
                <small>Your sensitive tax, personal, and financial documents never leave your browser memory.</small>
              </div>
            </li>
          </ul>
          <div class="tools-tip">
            <FileCheck :size="18" />
            <p>
              <b>Form Security Tip</b><br />
              Always flatten tax forms and filled contracts before emailing to prevent recipients or third parties from altering your completed numbers.
            </p>
          </div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Flatten PDF Ready</div>
          <FlattenPdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero server uploads.</div>
        </div>
      </section>

      <section class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Flatten your PDF in three easy steps</h2>
          <p>Create tamper-resistant, share-ready documents in seconds.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><FileCheck :size="22" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>
    </main>
    <SiteFooter message="Free, private browser tools for everyday file work." />
  </div>
</template>

