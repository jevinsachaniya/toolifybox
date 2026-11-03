<script setup>
import {
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Grid3x3,
  Image as ImageIcon,
  Layers,
  LockKeyhole,
  ScanFace,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  UserCheck,
  Wand2,
  Zap,
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/blur-face', '/face-blur', '/tools/face-blur', '/censor-face', '/tools/censor-face'],
});

const pageTitle = 'Blur Faces Online Free – Automatic Face Censor & Mosaic Tool | We Make PDF';
const pageDescription = 'Automatically detect and blur faces in photos online for free. Censor portraits, team photos, or crowd scenes with smooth Gaussian blur, pixelate mosaic, or black censor bars. 100% client-side privacy.';

const steps = [
  { number: '01', title: 'Upload Photo', desc: 'Select or drop any JPG, PNG, WebP, or BMP photo from your computer or phone.' },
  { number: '02', title: 'Auto-Detect & Customize', desc: 'Faces are detected automatically. Choose Gaussian blur, pixelate mosaic, or solid black bars. Adjust blur strength, oval face shape, or add custom blur zones.' },
  { number: '03', title: 'Download Censored Photo', desc: 'Preview changes live in real-time, hold to compare with the original, and download your high-resolution censored image with zero server uploads.' },
];

const faqs = [
  ['How does the automatic face detector work?', 'We Make PDF uses modern in-browser hardware machine learning (Native FaceDetector API and local Pico cascade) to identify human faces in milliseconds. Everything executes locally in your browser memory.'],
  ['Are my photos or faces uploaded to any external server?', 'Never. Your photos never leave your device. All face scanning, blurring, pixelation, and file encoding are done 100% client-side inside your browser sandbox.'],
  ['Can I blur specific people and leave others visible?', 'Yes! You can toggle individual checkboxes to blur or unblur each person detected, or click "+ Add Blur Area" to place custom censorship boxes anywhere on the image.'],
  ['What censor styles are available?', 'You can choose between 4 styles: Gaussian Blur (smooth modern photo blur), Pixelate / Mosaic (blocky news-style censorship), Black Box (solid redaction bars), and Frosted Glass.'],
  ['Does blurring reduce image resolution or clarity of the unblurred areas?', 'No. Unblurred parts of your photo retain 100% native resolution, color, and sharpness. The output image is rendered at the exact original pixel dimensions.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/blur-face',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Blur Face', path: '/tools/blur-face' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/blur-face',
      'Blur Faces Online',
      pageDescription,
      [
        'Instant client-side face detection using Native AI and Pico cascade',
        'Multiple censor effects: Gaussian Blur, Pixelate Mosaic, Black Redaction Box, and Frosted Glass',
        'Natural oval face shape or classic rectangular bounding boxes',
        'Individual face controls: blur all, unblur all, or select specific people',
        'Add custom blur zones for license plates, badges, tattoos, and background faces',
        'Live interactive canvas preview with Hold-to-Compare original view',
        'Export as high-resolution JPG, PNG, or WebP with zero quality degradation',
        '100% private in-browser processing with zero cloud uploads',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Blur Faces in Photos Online for Free', pageDescription, steps, siteUrl, '/tools/blur-face'),
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
      <section class="tools-layout container blur-face-layout">
        <div class="tools-hero">
          <span class="eyebrow"><ScanFace :size="13" /> AI FACE PRIVACY &amp; REDACTION</span>
          <h1>Blur Faces in Photos Online<br /><span>auto-detect &amp; censor faces.</span></h1>
          <p>Conceal personal identities, redact confidential faces, and protect photo privacy. Automatically detect faces or draw custom blur areas with smooth Gaussian blur, pixelate mosaic, or black censor bars. 100% free with zero cloud uploads.</p>
        </div>

        <div class="tools-converter-wrap" id="converter">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Client-Side AI Detection</div>
          <BlurFaceConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed 100% locally in browser memory. Zero photo uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><ScanFace :size="14" /></span>
              <div>
                <strong>Smart Face Detection</strong>
                <p>High-speed local AI detection identifies facial features in portraits, group photos, and street scenes.</p>
              </div>
            </li>
            <li>
              <span><Sliders :size="14" /></span>
              <div>
                <strong>Multiple Censor Styles</strong>
                <p>Switch between smooth Gaussian blur, retro digital pixelation, solid redaction bars, or frosted glass.</p>
              </div>
            </li>
            <li>
              <span><Wand2 :size="14" /></span>
              <div>
                <strong>Custom Blur Zones</strong>
                <p>Add, drag, or resize blur boxes to censor car license plates, identity cards, tattoos, or background faces.</p>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <strong>100% Device Privacy</strong>
                <p>Photos never touch a remote server. Everything is rendered and censored inside your browser sandbox.</p>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <Sparkles :size="16" />
            <div>
              <strong>Pro-Tip for Precision Censorship:</strong>
              Use our <b>Hold to Compare</b> button while editing to verify that all private details are fully censored before downloading. You can also drag the corner resize handles on any face box to expand coverage.
            </div>
          </div>
        </div>
      </section>

      <!-- How to Steps Section -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">QUICK TUTORIAL</span>
          <h2>How to Blur Faces in Photos in 3 Simple Steps</h2>
          <p>Censor faces, license plates, and sensitive details in seconds directly from your browser.</p>
        </div>

        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span>
                <ImageIcon v-if="step.number === '01'" :size="22" />
                <ScanFace v-else-if="step.number === '02'" :size="22" />
                <ShieldCheck v-else :size="22" />
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
          <span class="mini-label">WHY USE OUR FACE BLUR TOOL</span>
          <h2>Protect Personal Privacy and Conceal Identities in Photos</h2>
          <p>Whether you're sharing crowd photos from public events, publishing street photography, protecting children's privacy, or preparing confidential documents for news broadcasts, automatic face blurring safeguards personal identity.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ScanFace :size="24" /></span>
            <h3>Instant Browser-Based AI Detection</h3>
            <p>Our dual-engine face detection uses your device's native hardware ML when supported, backed by a lightweight offline cascade that finds human faces in tens of milliseconds.</p>
            <ul>
              <li>Dual engine: Native FaceDetector + Pico cascade</li>
              <li>Detects multiple faces simultaneously in group shots</li>
              <li>Works 100% offline without sending photos to cloud APIs</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Sliders :size="24" /></span>
            <h3>Versatile Censor &amp; Mosaic Styles</h3>
            <p>Tailor the blur aesthetic to your needs. Choose smooth aesthetic photo blur, mosaic pixel blocks, or solid black redaction bars.</p>
            <ul>
              <li>Adjustable blur radius (5px to 60px) and mosaic pixel size</li>
              <li>Natural oval face contour or standard rectangular boxes</li>
              <li>Soft edge feathering for seamless blending</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ShieldCheck :size="24" /></span>
            <h3>Full-Resolution Lossless Export</h3>
            <p>Unblurred portions of your photo retain 100% of their original sharpness, color depth, and native pixel resolution.</p>
            <ul>
              <li>Supports high-res 4K, DSLR, and smartphone photos</li>
              <li>Export to lossless PNG, high-fidelity JPG, or WebP</li>
              <li>One-click copy to clipboard functionality</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>When Should You Blur Faces in Images?</h2>
          <p>Protect identity, ensure compliance, and safeguard vulnerable subjects.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Street &amp; Public Event Photography</h4>
            <p>Conceal bystanders and background pedestrians before sharing your urban photography on social media or portfolio sites.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Child &amp; Student Privacy</h4>
            <p>Protect minors in school activities, daycare photos, sports events, and family gatherings prior to public posting.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Investigative Journalism &amp; News</h4>
            <p>Conceal witnesses, confidential sources, undercover personnel, or accident victims with standard news-grade mosaic censorship.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Confidential Documents &amp; ID Badges</h4>
            <p>Use custom blur areas to redact employee badges, passport photos, driver license details, or vehicle license plates.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED MEDIA UTILITIES</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/remove-background" class="seo-keyword-pill">Remove Background</NuxtLink>
            <NuxtLink to="/tools/watermark-image" class="seo-keyword-pill">Watermark Image</NuxtLink>
            <NuxtLink to="/tools/compress-image" class="seo-keyword-pill">Compress Image</NuxtLink>
            <NuxtLink to="/tools/convert-image" class="seo-keyword-pill">Convert Image Format</NuxtLink>
            <NuxtLink to="/tools/split-image" class="seo-keyword-pill">Split Image Grid</NuxtLink>
            <NuxtLink to="/tools/image-collage" class="seo-keyword-pill">Image Collage</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Common Questions About Face Blurring</h2>
          <p>Everything you need to know about detecting, censoring, and redacting faces with We Make PDF.</p>
          <div class="faq-decoration" aria-hidden="true">
            <ScanFace :size="42" />
            <span>AI &bull; BLUR FACE</span>
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
          <span class="mini-label">NEED TO OPTIMIZE YOUR CENSORED PHOTOS?</span>
          <h2>Compress your blurred images for web &amp; mobile</h2>
          <p>Reduce image file size by up to 80% while preserving crystal-clear visual quality.</p>
        </div>
        <NuxtLink to="/tools/compress-image" class="primary-button">
          Open Compress Image <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
