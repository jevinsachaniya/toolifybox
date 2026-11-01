<script setup>
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  Clipboard,
  Eraser,
  FileCheck,
  FileImage,
  Layers,
  LockKeyhole,
  Maximize2,
  Paintbrush,
  Pipette,
  Scissors,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/remove-background', '/bg-remover', '/tools/bg-remover', '/tools/remove-bg'],
});

const pageTitle = 'Remove Background from Image Free — AI & Color Key Cutout | We Make PDF';
const pageDescription = 'Remove backgrounds from photos, logos, products, and signatures online for free. In-browser AI neural segmentation, instant color key flood fill, edge feathering, and custom background staging with 100% client privacy.';

const steps = [
  { number: '01', title: 'Upload or Paste Image', desc: 'Select any JPG, PNG, or WebP photo up to 35 MB, or simply press Ctrl+V to paste from your clipboard.' },
  { number: '02', title: 'AI Auto Cutout or Color Key', desc: 'Let our on-device AI isolate your subject automatically, or use the instant Color Key and Eyedropper for crisp logo cutouts.' },
  { number: '03', title: 'Refine & Download Transparent PNG', desc: 'Touch up edges with the erase/restore brush, choose transparent or colored background, and copy to clipboard or download.' },
];

const faqs = [
  ['How does client-side AI background removal work without uploading photos?', 'We Make PDF runs an optimized deep learning segmentation neural network entirely inside your browser using WebAssembly (WASM) and ONNX Runtime. The model detects humans, products, animals, and objects locally in your device memory — your private photos never get uploaded to any remote server.'],
  ['Can I remove white backgrounds from logos, signatures, and icons instantly?', 'Yes! Switch to the "Color Key" mode. It features corner-aware flood fill and eyedropper color sampling that instantly erases pure white, black, or custom background colors within 0 milliseconds, without downloading any AI weights.'],
  ['Can I replace the background with a solid color or custom photo?', 'Absolutely. Under the "Background Staging" panel, you can choose transparent (checkerboard), solid colors (white, black, studio gray, crimson ruby, custom hex picker), or soft background blur to make your subject pop.'],
  ['Which image formats are supported for input and export?', 'You can upload JPG, JPEG, PNG, WebP, AVIF, BMP, and GIF. For export, you can download transparent PNG (maximum visual fidelity), WebP (compact high-performance), or JPG (blended with your chosen background color).'],
  ['Can I touch up stray hairs or fine edges manually?', 'Yes! The built-in "Refine Brush" lets you interactively erase unwanted background pixels or restore missed foreground details with adjustable brush size and softness.'],
  ['Is We Make PDF background remover completely free with no watermarks?', 'Yes, 100% free with unlimited image cutouts, full original resolution export, and zero watermarks added.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/remove-background',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Remove Background', path: '/tools/remove-background' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/remove-background',
      'Remove Background Online Free',
      pageDescription,
    ),
    ({ siteUrl }) => howToSchema(
      'How to Remove Image Backgrounds Online for Free',
      pageDescription,
      steps,
      siteUrl,
      '/tools/remove-background',
    ),
    () => faqSchema(faqs),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#main">Skip to main content</a>
    <SiteHeader />

    <main id="main" class="tools-layout-main">
    <!-- Ambient glowing backdrop -->
    <div class="tools-ambient-glow" aria-hidden="true">
      <span class="glow-orb top-left" />
      <span class="glow-orb top-right" />
    </div>

    <div class="tool-page-wrapper container">
      <!-- Breadcrumb Bar -->
      <nav class="tool-breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/">Home</NuxtLink>
        <span class="bc-sep">/</span>
        <NuxtLink to="/tools">Tools</NuxtLink>
        <span class="bc-sep">/</span>
        <span class="bc-current">Remove Background</span>
      </nav>

      <!-- Hero Header -->
      <header class="tool-header-block">
        <div class="tool-badge-pill">
          <Sparkles :size="13" />
          <span>AI NEURAL CUTOUT &amp; COLOR KEY</span>
        </div>
        <h1 class="tool-main-heading">
          Remove Background from Image
        </h1>
        <p class="tool-lead-summary">
          Isolate people, products, animals, and logos with 100% in-browser AI segmentation and instant color keying. Transparent PNG cutouts with zero cloud uploads.
        </p>

        <div class="tool-guarantees-row">
          <span class="guarantee-item">
            <Check :size="14" /> High-Precision AI Cutout
          </span>
          <span class="guarantee-item">
            <Check :size="14" /> Instant Color Key &amp; Flood Fill
          </span>
          <span class="guarantee-item">
            <Check :size="14" /> 100% In-Browser Privacy
          </span>
        </div>
      </header>

      <!-- Main Converter Studio Box -->
      <section class="tool-converter-section">
        <ClientOnly>
          <RemoveBackgroundConverter />
        </ClientOnly>
      </section>

      <!-- Feature Highlight Badges -->
      <section class="tool-highlights-grid">
        <div class="highlight-feature-card">
          <div class="feat-icon-badge">
            <Wand2 :size="20" />
          </div>
          <h3 class="feat-title">On-Device AI Segmentation</h3>
          <p class="feat-desc">
            Powered by modern neural networks running via WebAssembly and ONNX Runtime. Accurately cuts out hair, clothing, and complex product edges.
          </p>
        </div>

        <div class="highlight-feature-card">
          <div class="feat-icon-badge">
            <Pipette :size="20" />
          </div>
          <h3 class="feat-title">Instant Color Key &amp; Eyedropper</h3>
          <p class="feat-desc">
            Remove solid white, green screen, or black studio backgrounds in 0ms with corner-aware flood fill and edge feathering.
          </p>
        </div>

        <div class="highlight-feature-card">
          <div class="feat-icon-badge">
            <Layers :size="20" />
          </div>
          <h3 class="feat-title">Background Staging &amp; Blur</h3>
          <p class="feat-desc">
            Swap backgrounds seamlessly with solid studio colors, custom image backdrops, or soft Gaussian blur for professional portraits.
          </p>
        </div>

        <div class="highlight-feature-card">
          <div class="feat-icon-badge">
            <ShieldCheck :size="20" />
          </div>
          <h3 class="feat-title">Zero Remote Uploads</h3>
          <p class="feat-desc">
            Every pixel is rendered directly inside your computer or mobile browser memory. Confidential photos and client designs stay strictly private.
          </p>
        </div>
      </section>

      <!-- Step-by-Step Guide -->
      <section class="tool-guide-section">
        <div class="section-title-wrap">
          <span class="section-sub-eyebrow">QUICK &amp; EASY</span>
          <h2 class="section-heading">How to Remove Image Backgrounds Online</h2>
        </div>

        <div class="steps-flow-grid">
          <div v-for="step in steps" :key="step.number" class="step-card-box">
            <span class="step-num-pill">{{ step.number }}</span>
            <h4 class="step-card-title">{{ step.title }}</h4>
            <p class="step-card-desc">{{ step.desc }}</p>
          </div>
        </div>
      </section>

      <!-- FAQ Accordion Section -->
      <section class="tool-faq-section">
        <div class="section-title-wrap">
          <span class="section-sub-eyebrow">COMMON QUESTIONS</span>
          <h2 class="section-heading">Frequently Asked Questions</h2>
        </div>

        <div class="faq-accordion-list">
          <details v-for="[question, answer] in faqs" :key="question" class="faq-item-collapsible">
            <summary class="faq-summary-row">
              <span class="faq-question-text">{{ question }}</span>
              <ChevronDown :size="18" class="faq-chevron" />
            </summary>
            <p class="faq-answer-content">{{ answer }}</p>
          </details>
        </div>
      </section>
    </div>
  </main>

  <SiteFooter />
</div>
</template>

<style scoped>
.tools-layout-main {
  position: relative;
  min-height: 80vh;
  padding: 40px 0 80px;
}
.tool-page-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
.tool-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted, #64748b);
  margin-bottom: 24px;
}
.tool-breadcrumb a {
  color: inherit;
  text-decoration: none;
}
.tool-breadcrumb a:hover {
  color: #e11d48;
}
.bc-current {
  color: #e11d48;
  font-weight: 600;
}
.tool-header-block {
  text-align: center;
  max-width: 760px;
  margin: 0 auto 36px;
}
.tool-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #be123c;
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}
html[data-theme='dark'] .tool-badge-pill {
  background: rgba(225, 29, 72, 0.15);
  border-color: #881337;
  color: #fecdd3;
}
.tool-main-heading {
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 850;
  color: var(--text, #0f172a);
  line-height: 1.2;
  margin-bottom: 14px;
  letter-spacing: -0.02em;
}
html[data-theme='dark'] .tool-main-heading {
  color: #f8fafc;
}
.tool-lead-summary {
  font-size: clamp(15px, 1.8vw, 17px);
  color: var(--text-muted, #64748b);
  line-height: 1.6;
  margin-bottom: 20px;
}
html[data-theme='dark'] .tool-lead-summary {
  color: #94a3b8;
}
.tool-guarantees-row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
}
.guarantee-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text, #334155);
}
html[data-theme='dark'] .guarantee-item {
  color: #cbd5e1;
}
.guarantee-item svg {
  color: #10b981;
}

.tool-converter-section {
  margin-bottom: 60px;
}

/* Feature Highlights */
.tool-highlights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 70px;
}
.highlight-feature-card {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s ease;
}
html[data-theme='dark'] .highlight-feature-card {
  background: #0f172a;
  border-color: #334155;
}
.highlight-feature-card:hover {
  transform: translateY(-2px);
  border-color: #e11d48;
}
.feat-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #fff1f2;
  color: #e11d48;
  display: flex;
  align-items: center;
  justify-content: center;
}
html[data-theme='dark'] .feat-icon-badge {
  background: rgba(225, 29, 72, 0.15);
}
.feat-title {
  font-size: 16px;
  font-weight: 750;
  color: var(--text, #0f172a);
}
html[data-theme='dark'] .feat-title {
  color: #f8fafc;
}
.feat-desc {
  font-size: 13px;
  color: var(--text-muted, #64748b);
  line-height: 1.55;
}
html[data-theme='dark'] .feat-desc {
  color: #94a3b8;
}

/* Steps Section */
.tool-guide-section {
  margin-bottom: 70px;
}
.section-title-wrap {
  text-align: center;
  margin-bottom: 32px;
}
.section-sub-eyebrow {
  font-size: 11.5px;
  font-weight: 750;
  color: #e11d48;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 6px;
}
.section-heading {
  font-size: 26px;
  font-weight: 800;
  color: var(--text, #0f172a);
}
html[data-theme='dark'] .section-heading {
  color: #f8fafc;
}
.steps-flow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}
.step-card-box {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 16px;
  padding: 26px;
  position: relative;
}
html[data-theme='dark'] .step-card-box {
  background: #0f172a;
  border-color: #334155;
}
.step-num-pill {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  color: #e11d48;
  background: #fff1f2;
  padding: 4px 10px;
  border-radius: 8px;
  margin-bottom: 14px;
}
html[data-theme='dark'] .step-num-pill {
  background: rgba(225, 29, 72, 0.15);
}
.step-card-title {
  font-size: 17px;
  font-weight: 750;
  color: var(--text, #0f172a);
  margin-bottom: 8px;
}
html[data-theme='dark'] .step-card-title {
  color: #f8fafc;
}
.step-card-desc {
  font-size: 13.5px;
  color: var(--text-muted, #64748b);
  line-height: 1.55;
}
html[data-theme='dark'] .step-card-desc {
  color: #94a3b8;
}

/* FAQ Accordion */
.tool-faq-section {
  max-width: 840px;
  margin: 0 auto 40px;
}
.faq-accordion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.faq-item-collapsible {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}
html[data-theme='dark'] .faq-item-collapsible {
  background: #0f172a;
  border-color: #334155;
}
.faq-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  font-weight: 700;
  font-size: 15px;
  color: var(--text, #0f172a);
  cursor: pointer;
  list-style: none;
}
html[data-theme='dark'] .faq-summary-row {
  color: #f8fafc;
}
.faq-summary-row::-webkit-details-marker {
  display: none;
}
.faq-chevron {
  color: var(--text-muted, #64748b);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}
.faq-item-collapsible[open] .faq-chevron {
  transform: rotate(180deg);
  color: #e11d48;
}
.faq-answer-content {
  padding: 0 20px 20px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-muted, #64748b);
}
html[data-theme='dark'] .faq-answer-content {
  color: #94a3b8;
}
</style>

