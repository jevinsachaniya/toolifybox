<script setup>
import {
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  Code2,
  Cpu,
  Download,
  Eye,
  FileCheck,
  FileCode2,
  FileImage,
  FileText,
  FileUp,
  Globe,
  Image as ImageIcon,
  Layers,
  LockKeyhole,
  Maximize2,
  Palette,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Zap,
} from '@lucide/vue';
import HtmlToImageConverter from '~/components/HtmlToImageConverter.vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/html-to-image', '/tools/html-to-png', '/tools/convert-html-to-image'],
});

const pageTitle = 'HTML to Image Converter — Free Online HTML/CSS to PNG, JPG, WebP | We Make PDF';
const pageDescription = 'Render HTML code and CSS stylesheets into high-resolution PNG, JPG, and WebP images. 100% client-side rendering with Retina 2x/3x sharpness, custom viewports, transparent backgrounds, and instant clipboard copying.';

const steps = [
  {
    number: '01',
    title: 'Choose HTML Input',
    desc: 'Upload an .html or .htm file from your computer, or paste HTML & CSS markup directly into the interactive code editor.',
  },
  {
    number: '02',
    title: 'Customize Output Settings',
    desc: 'Select output format (PNG, JPG, WebP), resolution scale (1x, 2x Retina, 3x Ultra HD), viewport width, and background transparency.',
  },
  {
    number: '03',
    title: 'Render & Download Image',
    desc: 'Click convert to render in milliseconds. Preview the pixel-perfect image, copy directly to your clipboard, or download to your device.',
  },
];

const faqs = [
  [
    'How does HTML to Image conversion work in the browser?',
    'The tool loads your HTML and CSS markup into an isolated sandbox container, ensures all custom web fonts and inline styles are fully loaded, and captures the rasterized DOM using high-definition canvas rendering with anti-aliasing.',
  ],
  [
    'Does the converter support transparent backgrounds?',
    'Yes! When choosing PNG or WebP format, you can select "Transparent Background" to render logos, badges, stickers, and UI widgets without any white box or border artifacts.',
  ],
  [
    'Can I upload an entire HTML file?',
    'Absolutely. You can drag and drop any .html, .htm, or .xhtml document. The converter parses the HTML structure and embedded styles, ready to render into an image with one click.',
  ],
  [
    'What resolution and DPI does the converter produce?',
    'You can select between 1x (standard 96 DPI), 2x (Retina HD - recommended for social media and crisp displays), or 3x (300 DPI - ideal for high-definition presentations and print media).',
  ],
  [
    'Are my HTML files or private designs sent to a remote server?',
    'Never. 100% of the HTML parsing, CSS style injection, and image rasterization takes place entirely inside your web browser on your device. Zero bytes are uploaded to any cloud server.',
  ],
  [
    'Can I copy the generated image directly to my clipboard?',
    'Yes! Simply click the "Copy to Clipboard" button after rendering. You can then immediately paste (Ctrl+V / Cmd+V) the image into Slack, Figma, Discord, Word, Google Docs, or email drafts.',
  ],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/html-to-image',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'HTML to Image', path: '/tools/html-to-image' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/html-to-image',
      'HTML to Image Converter',
      pageDescription,
      [
        'Convert HTML code and CSS to PNG, JPG, and WebP images',
        'Dual input modes: Drag-and-drop file upload or interactive code editor',
        'Retina 2x and Ultra HD 3x resolution scaling',
        'Custom viewport width presets (Social, Banner, Full HD)',
        'Transparent background support for PNG and WebP',
        '1-click copy image to system clipboard',
        '100% client-side privacy with zero server uploads',
      ],
      'PhotoApplication'
    ),
    ({ siteUrl }) => howToSchema(
      'How to Convert HTML to Image Online',
      pageDescription,
      steps,
      siteUrl,
      '/tools/html-to-image'
    ),
    () => faqSchema(faqs),
  ],
});
</script>

<template>
  <div class="tool-page-wrapper">
    <SiteHeader />

    <main class="tool-main-content">
      <!-- Breadcrumb -->
      <nav class="tool-breadcrumbs container" aria-label="Breadcrumb">
        <ol>
          <li><NuxtLink to="/">Home</NuxtLink></li>
          <li><span class="sep">/</span></li>
          <li><NuxtLink to="/tools">Tools</NuxtLink></li>
          <li><span class="sep">/</span></li>
          <li aria-current="page">HTML to Image</li>
        </ol>
      </nav>

      <!-- Hero Header -->
      <header class="tool-hero container">
        <div class="tool-hero-badge">
          <Sparkles :size="15" />
          <span>INSTANT CLIENT-SIDE HTML RENDERER</span>
        </div>
        <h1 class="tool-hero-title">HTML to Image Converter</h1>
        <p class="tool-hero-desc">
          Transform HTML markup, Tailwind/CSS layouts, code snippets, and templates into crisp PNG, JPG, or WebP images.
          Zero cloud uploads &bull; 100% browser-based rendering.
        </p>
      </header>

      <!-- Tool Workspace -->
      <section class="tool-workspace-section container">
        <HtmlToImageConverter />
      </section>

      <!-- Quick How-To -->
      <section class="how-to-section container">
        <div class="section-intro">
          <span class="mini-label">QUICK TUTORIAL</span>
          <h2>How to Convert HTML to Image in 3 Simple Steps</h2>
          <p>Generate production-grade graphics from web code without installing headless browsers or server dependencies.</p>
        </div>

        <div class="steps-grid">
          <div v-for="step in steps" :key="step.number" class="step-card">
            <span class="step-num">{{ step.number }}</span>
            <h3 class="step-title">{{ step.title }}</h3>
            <p class="step-desc">{{ step.desc }}</p>
          </div>
        </div>
      </section>

      <!-- Feature Deep Dive -->
      <section class="seo-content-section container">
        <div class="section-intro">
          <span class="mini-label">WHY USE OUR HTML TO IMAGE TOOL</span>
          <h2>Pixel-Perfect DOM Rendering Built for Developers &amp; Creators</h2>
          <p>Turn HTML components, certificates, invoices, and promo banners into shareable images directly in your browser.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><FileCode2 :size="24" /></span>
            <h3>Dual Input: Upload or Write Code</h3>
            <p>Upload existing .html and .htm files, or write HTML and CSS in the built-in syntax editor with starter templates.</p>
            <ul>
              <li>Drag-and-drop .html, .htm, and .xhtml files</li>
              <li>Syntax-formatted code editor with line counts</li>
              <li>Pre-built templates for social banners, receipts, and KPIs</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Sparkles :size="24" /></span>
            <h3>2x &amp; 3x Ultra-Sharp Retina Export</h3>
            <p>Standard screenshots look blurry on modern high-DPI screens. Our engine scales the canvas for razor-sharp visual fidelity.</p>
            <ul>
              <li>1x standard, 2x Retina, and 3x 300 DPI print quality</li>
              <li>Custom viewport width simulation (1080px, 1200px, 1920px)</li>
              <li>Supports PNG, high-speed JPG, and modern WebP</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ShieldCheck :size="24" /></span>
            <h3>100% In-Browser Privacy &amp; Clipboard</h3>
            <p>Your HTML templates and customer records are processed completely in memory with zero network latency.</p>
            <ul>
              <li>Zero cloud uploads or server storage</li>
              <li>1-click copy directly to system clipboard</li>
              <li>Transparent background support for UI assets</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Where is HTML to Image Conversion Used in Everyday Work?</h2>
          <p>Bridge the gap between web markup and visual media for social sharing, documentation, and reporting.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Social Media Open Graph Cards</h4>
            <p>Design dynamic blog promo cards and product announcements in HTML/CSS and export them as 1200&times;630px social previews.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>E-Commerce Invoices &amp; Receipts</h4>
            <p>Convert transactional HTML email receipts into clear image attachments for messaging apps, customer support, and mobile chat.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Certificates &amp; Awards</h4>
            <p>Render personalized diplomas, event badges, and completion certificates styled with custom web typography into printable images.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Dashboard Metric &amp; KPI Cards</h4>
            <p>Snapshot live dashboard widgets and data charts into crisp PNG graphics for executive slide decks and weekly reports.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED MEDIA UTILITIES</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/html-to-pdf" class="seo-keyword-pill">HTML to PDF</NuxtLink>
            <NuxtLink to="/tools/convert-image" class="seo-keyword-pill">Convert Image Format</NuxtLink>
            <NuxtLink to="/tools/compress-image" class="seo-keyword-pill">Compress Image</NuxtLink>
            <NuxtLink to="/tools/split-image" class="seo-keyword-pill">Split Image Grid</NuxtLink>
            <NuxtLink to="/tools/watermark-image" class="seo-keyword-pill">Watermark Image</NuxtLink>
            <NuxtLink to="/tools/pdf-to-images" class="seo-keyword-pill">PDF to Images</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Frequently Asked Questions About HTML to Image</h2>
          <p>Everything you need to know about rendering web markup into high-definition images.</p>
          <div class="faq-decoration" aria-hidden="true">
            <ImageIcon :size="42" />
            <span>HTML &bull; IMG</span>
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
          <span class="mini-label">NEED A PAGINATED DOCUMENT INSTEAD?</span>
          <h2>Convert HTML files directly to printable PDF</h2>
          <p>Render complex web documents and stylesheets into print-ready PDF files with custom page margins and headers.</p>
        </div>
        <NuxtLink to="/tools/html-to-pdf" class="primary-button">
          Open HTML to PDF <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
.tool-page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #ffffff);
}

.tool-main-content {
  flex: 1;
}

.tool-breadcrumbs {
  padding-top: 24px;
  padding-bottom: 8px;
}

.tool-breadcrumbs ol {
  display: flex;
  align-items: center;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.tool-breadcrumbs a {
  color: #64748b;
  text-decoration: none;
  transition: color 0.15s ease;
}

.tool-breadcrumbs a:hover {
  color: #0f172a;
}

.tool-breadcrumbs .sep {
  color: #cbd5e1;
}

.tool-breadcrumbs li[aria-current="page"] {
  color: #0f172a;
  font-weight: 600;
}

.tool-hero {
  text-align: center;
  padding-top: 24px;
  padding-bottom: 32px;
}

.tool-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #e11d48;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: 16px;
}

.tool-hero-title {
  font-size: clamp(28px, 4.5vw, 44px);
  font-weight: 900;
  color: #0f172a;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.tool-hero-desc {
  max-width: 680px;
  margin: 0 auto;
  font-size: clamp(14px, 2vw, 16px);
  color: #64748b;
  line-height: 1.6;
}

.tool-workspace-section {
  padding-bottom: 64px;
}

/* Tutorial Steps */
.how-to-section {
  padding-top: 48px;
  padding-bottom: 64px;
  border-top: 1px solid #f1f5f9;
}

.section-intro {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 40px;
}

.mini-label {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #e11d48;
  margin-bottom: 8px;
}

.section-intro h2 {
  font-size: clamp(24px, 3.5vw, 32px);
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px;
}

.section-intro p {
  font-size: 14.5px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.step-card {
  padding: 28px 24px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.step-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px -6px rgba(0, 0, 0, 0.05);
}

.step-num {
  display: inline-block;
  font-size: 26px;
  font-weight: 900;
  color: #e11d48;
  margin-bottom: 12px;
}

.step-title {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
}

.step-desc {
  font-size: 13.5px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

/* Feature deep dive */
.seo-content-section {
  padding-bottom: 64px;
}

.seo-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.seo-feature-card {
  padding: 30px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.seo-feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #fff1f2;
  color: #e11d48;
  margin-bottom: 18px;
}

.seo-feature-card h3 {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px;
}

.seo-feature-card p {
  font-size: 13.5px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 16px;
}

.seo-feature-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.seo-feature-card li {
  font-size: 12.5px;
  color: #475569;
  position: relative;
  padding-left: 18px;
}

.seo-feature-card li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #e11d48;
  font-weight: 800;
}

/* Use cases */
.seo-usecases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.seo-usecase-item {
  padding: 22px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.seo-usecase-item h4 {
  font-size: 15px;
  font-weight: 750;
  color: #0f172a;
  margin: 0 0 8px;
}

.seo-usecase-item p {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

/* SEO Tags */
.seo-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.seo-keyword-pill {
  padding: 6px 14px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
}

.seo-keyword-pill:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* FAQ */
.faq-section {
  padding-top: 48px;
  padding-bottom: 64px;
  border-top: 1px solid #f1f5f9;
}

.faq-intro {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 36px;
  position: relative;
}

.faq-intro h2 {
  font-size: clamp(24px, 3.5vw, 32px);
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px;
}

.faq-intro p {
  font-size: 14.5px;
  color: #64748b;
  margin: 0;
}

.faq-decoration {
  display: none;
}

.faq-list {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-list details {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.faq-list details[open] {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.faq-list summary {
  padding: 18px 22px;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  list-style: none;
}

.faq-list summary::-webkit-details-marker {
  display: none;
}

.faq-answer {
  padding: 0 22px 18px;
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
}

.faq-answer p {
  margin: 0;
}

/* Closing CTA */
.closing-cta {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  border-radius: 28px;
  padding: 48px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  position: relative;
  overflow: hidden;
  margin-bottom: 72px;
}

.closing-cta h2 {
  font-size: clamp(22px, 3vw, 30px);
  font-weight: 900;
  margin: 0 0 10px;
}

.closing-cta p {
  font-size: 14.5px;
  color: #94a3b8;
  margin: 0;
  max-width: 540px;
  line-height: 1.6;
}

.closing-cta .primary-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 14px;
  background: #ffffff;
  color: #0f172a;
  font-weight: 800;
  font-size: 14.5px;
  text-decoration: none;
  flex-shrink: 0;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
}

.closing-cta .primary-button:hover {
  transform: translateY(-2px);
  background: #f8fafc;
}

@media (max-width: 768px) {
  .closing-cta {
    padding: 32px 24px;
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

