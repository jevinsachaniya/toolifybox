<script setup>
import { Check, Eye, FileCheck, Layers, ShieldCheck, Sparkles, Stamp, Zap } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/watermark-pdf', '/tools/watermark'],
});

const pageDescription = 'Watermark PDF documents online for free. Add confidential stamps, copyright marks, or repeating watermark grids with custom opacity and rotation in your browser.';
usePageSeo({
  title: 'Watermark PDF Online — Add Text & Stamp Watermarks | Toolifybox',
  description: pageDescription,
  path: '/tools/watermark-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Watermark PDF', path: '/tools/watermark-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/watermark-pdf',
      'Watermark PDF Documents',
      pageDescription,
      ['Add text stamps like CONFIDENTIAL, DRAFT, and SAMPLE', 'Customizable angle, opacity, color, and font size', 'Diagonal center, margins, and repeating grid watermarks', 'Interactive real-time canvas preview', 'No software installation required', 'Zero server uploads', '100% private in-browser execution']
    ),
  ],
});

const steps = [
  { number: '01', title: 'Choose a PDF', desc: 'Select or drop any PDF document from your phone, tablet, or desktop.' },
  { number: '02', title: 'Customize Watermark', desc: 'Choose presets like CONFIDENTIAL or type custom text. Adjust opacity, color, angle, and grid position.' },
  { number: '03', title: 'Download Watermarked PDF', desc: 'Download your stamped, protected PDF document instantly with zero server uploads.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container watermark-pdf-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> PDF BRANDING &amp; SECURITY</span>
          <h1>Watermark PDF<br /><span>stamps &amp; text marks.</span></h1>
          <p>Protect confidential documents, contracts, drafts, and creative portfolios. Stamp clear visual copyright notices, confidentiality markers, or tiled watermarks across all or selected pages with instant browser-based processing.</p>
          <ul class="tools-points">
            <li>
              <span><Check :size="14" /></span>
              <div>
                <b>Confidentiality Presets &amp; Custom Text</b>
                <small>Quickly stamp CONFIDENTIAL, DRAFT, SAMPLE, DO NOT COPY, or type any custom watermark message.</small>
              </div>
            </li>
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <b>Live Interactive Preview</b>
                <small>Inspect your first PDF page and preview the exact watermark position, opacity, and angle before saving.</small>
              </div>
            </li>
            <li>
              <span><Layers :size="14" /></span>
              <div>
                <b>Diagonal, Margins &amp; Repeating Grids</b>
                <small>Choose 45° diagonal center, horizontal banners, margin headers, or repeating 3x3 security grids.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>Zero Server Uploads &amp; 100% Privacy</b>
                <small>Your legal documents, sensitive reports, and tax filings never leave your local device memory.</small>
              </div>
            </li>
          </ul>
          <div class="tools-tip">
            <Stamp :size="18" />
            <p>
              <b>Document Protection Tip</b><br />
              Use a semi-transparent diagonal watermark (20% - 30% opacity) to deter unauthorized distribution while keeping the underlying text easy to read.
            </p>
          </div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Watermark PDF Ready</div>
          <WatermarkPdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero server uploads.</div>
        </div>
      </section>

      <section class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Watermark your PDF in three easy steps</h2>
          <p>Brand and secure your PDF documents in seconds without installing third-party software.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><Stamp :size="22" /></span>
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

