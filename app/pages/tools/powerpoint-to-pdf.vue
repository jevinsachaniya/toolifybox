<script setup>
import { ArrowRight, Check, ChevronDown, Cpu, FileCheck, Layers, LockKeyhole, Presentation, ShieldCheck, Sparkles, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/powerpoint-to-pdf', '/pptx-to-pdf'],
});

const pageTitle = 'PowerPoint to PDF Converter — Free PPTX to PDF Online | We Make PDF';
const pageDescription = 'Convert PowerPoint presentations (.pptx) to PDF online for free. Preview slides, select specific slides, lock layout, fonts, and graphics, and generate high-quality PDF documents privately in your browser without uploading files.';

const steps = [
  { number: '01', title: 'Choose a PPTX Presentation', desc: 'Add one .pptx presentation up to 20 MB and 100 slides. Your file stays securely on your device.' },
  { number: '02', title: 'Review Slides & Resolution', desc: 'Preview slide thumbnails, choose standard screen or high-resolution print output, or pick specific slides.' },
  { number: '03', title: 'Download Polished PDF', desc: 'Save your presentation as a clean, share-ready PDF with preserved layout, aspect ratios, and vivid colors.' },
];

const faqs = [
  ['Does converting PowerPoint to PDF alter slide formatting or font styles?', 'No. We Make PDF extracts embedded slide geometry, layout dimensions, background styles, and text blocks directly from the PPTX XML package. It locks all slide layouts so your deck renders identically across all devices and PDF readers.'],
  ['Does this converter support 16:9 widescreen and 4:3 standard slides?', 'Yes! Both modern 16:9 widescreen presentations and traditional 4:3 standard aspect ratios are automatically detected and converted into matching proportional PDF page geometries.'],
  ['Are my confidential pitch decks or corporate financial slides uploaded to any server?', 'Never. We Make PDF converts your PPTX files entirely inside your web browser using client-side JavaScript and WebAssembly. Your slides, business models, and trade secrets never leave your local device.'],
  ['Do I need Microsoft Office or PowerPoint installed to use this tool?', 'No software or plugin installation is required. You can convert presentations from any modern browser on Mac, Windows, Linux, Chromebook, iPad, or Android phone.'],
  ['Can I extract and convert only selected slides instead of the entire deck?', 'Yes. The interactive slide viewer allows you to preview and select only the exact slides you wish to include in your final PDF export.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/powerpoint-to-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'PowerPoint to PDF', path: '/tools/powerpoint-to-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/powerpoint-to-pdf',
      'PowerPoint to PDF Converter',
      pageDescription,
      ['Interactive PPTX slide thumbnail previews', 'Widescreen 16:9 and standard 4:3 aspect ratio support', 'Layout, font, and graphic preservation', 'Selective slide export capability', 'Zero server uploads', '100% private in-browser conversion']
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Convert PowerPoint Slides to PDF Online', pageDescription, steps, siteUrl, '/tools/powerpoint-to-pdf'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container powerpoint-pdf-layout">
    <div class="tools-hero">
      <span class="eyebrow"><Sparkles :size="13" /> PRESENTATION CONVERTER</span>
          <h1>Convert PowerPoint<br /><span>slides to PDF.</span></h1>
          <p>Turn your pitch decks and presentation slides into clean, share-ready PDF documents without opening Microsoft PowerPoint or uploading to a third-party server.</p>
    </div>

    <div class="tools-converter-wrap">
      <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> PowerPoint to PDF Ready</div>
          <PowerpointToPdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Converted locally on your device. No document uploads.</div>
    </div>

    <div class="tools-details-below">
      <ul class="tools-points">
            <li><span><Check :size="14" /></span><div><b>Preview Every Slide</b><small>Inspect each slide thumbnail and choose which slides to include.</small></div></li>
            <li><span><WandSparkles :size="14" /></span><div><b>Preserves Layout &amp; Colors</b><small>Maintains fonts, slide backgrounds, and widescreen dimensions.</small></div></li>
            <li><span><Zap :size="14" /></span><div><b>Quality Controls</b><small>Choose standard screen quality or high-resolution print output.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>100% Private in Browser</b><small>Conversion runs locally inside your browser memory.</small></div></li>
          </ul>
      
      <div class="tools-tip"><Presentation :size="18" /><p><b>Widescreen &amp; Standard Slides</b><br />Both 16:9 widescreen and 4:3 standard slide formats are automatically formatted into fitting PDF pages.</p></div>
    </div>
  </section>

      <section class="how-section container" id="how-it-works">
        <div class="section-intro"><span class="mini-label">HOW IT WORKS</span><h2>Turn slides into PDF in seconds</h2><p>Accurate slide rendering makes sharing presentations effortless.</p></div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card"><div class="how-card-top"><span><Presentation :size="22" /></span><b>{{ step.number }}</b></div><h3>{{ step.title }}</h3><p>{{ step.desc }}</p><span class="card-line" aria-hidden="true" /></article>
        </div>
      </section>

      <!-- Educational Guide Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">PRESENTATION ACCURACY</span>
          <h2>Why Convert PowerPoint Presentations to PDF?</h2>
          <p>Sharing native .pptx files often leads to missing fonts, misaligned animations, or broken text wrapping on client computers that lack the exact Office version or fonts installed on your computer.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Presentation :size="24" /></span>
            <h3>Permanent Layout Freezing</h3>
            <p>PDF acts as a digital printout. By converting slides to PDF, you lock text placement, image boundaries, and color schemes so your executive pitch deck looks flawless on every screen.</p>
            <ul>
              <li>Eliminates font substitution and awkward text reflow</li>
              <li>Preserves 16:9 widescreen and 4:3 slide aspect ratios</li>
              <li>Universal compatibility across iOS, Android, and macOS</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Layers :size="24" /></span>
            <h3>Curated Slide Selection</h3>
            <p>Don't want prospective investors or event attendees to see backup slides or draft appendix notes? Select only the slides you want to present and leave the rest out.</p>
            <ul>
              <li>Visual thumbnail cards with interactive checkboxes</li>
              <li>Batch select or omit specific slide numbers</li>
              <li>Generate clean, concise presentation handouts</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>Confidential Deck Security</h3>
            <p>Startup pitch decks, annual corporate budgets, and client roadmaps contain confidential business intelligence. We Make PDF converts files directly in your web browser memory.</p>
            <ul>
              <li>Zero server uploads, zero temporary files, zero leaks</li>
              <li>Works offline without sending files over the network</li>
              <li>Complies with enterprise security requirements</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Common Uses for PowerPoint to PDF Conversion</h2>
          <p>Deliver bulletproof presentations for meetings, webinars, and conferences.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Investor &amp; Sales Pitch Decks</h4>
            <p>Send pitch decks to angel investors and enterprise prospects knowing your formatting won't be disrupted by different operating systems.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Conference Speaker Handouts</h4>
            <p>Provide attendees with lightweight, printable PDF summaries of your talk that open seamlessly on mobile phones and tablets.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Webinar &amp; Online Course Materials</h4>
            <p>Share presentation slides as downloadable course guides in student portals without distributing editable slide files.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Print-Ready Board Reports</h4>
            <p>Print presentation slides cleanly on office printers without missing borders, awkward margins, or background color discrepancies.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED CONVERTERS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/excel-to-pdf" class="seo-keyword-pill">Excel to PDF</NuxtLink>
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
          <h2>Frequently Asked Questions About PowerPoint to PDF</h2>
          <p>Find answers to common questions about converting PPTX presentations into PDF files online.</p>
          <div class="faq-decoration" aria-hidden="true">
            <Presentation :size="42" />
            <span>PPTX &bull; PDF</span>
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
          <span class="mini-label">NEED TO LOCK YOUR PRESENTATION?</span>
          <h2>Protect your converted slides with a password</h2>
          <p>Prevent unauthorized viewing or printing of your pitch deck with AES-256 PDF encryption.</p>
        </div>
        <NuxtLink to="/tools/protect-pdf" class="primary-button">
          Open Protect PDF <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private document conversion, right in your browser." />
  </div>
</template>

