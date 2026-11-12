<script setup>
import { 
  ArrowRight,
  BookOpen,
  Check, 
  ChevronDown,
  Code2, 
  Download,
  Eye, 
  FileArchive,
  FileCheck,
  FileImage,
  Globe,
  HelpCircle, 
  Image as ImageIcon, 
  Layers, 
  Laptop,
  Palette, 
  ShieldCheck, 
  Sliders, 
  Smartphone,
  Sparkles, 
  Wand2 
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/image-to-favicon', '/favicon-generator', '/tools/favicon-generator'],
});

const pageTitle = 'Image to Favicon Converter Online — Free Favicon Generator (.ico & PNG) | We Make PDF';
const pageDescription = 'Free online Image to Favicon converter and generator. Convert PNG, JPG, SVG, and WebP into crisp multi-resolution favicon.ico (16x16 to 256x256 HD), Apple Touch icons, Android Chrome icons, and PWA manifests with live browser tab preview. 100% private in-browser.';

const steps = [
  {
    number: '01',
    title: 'Upload Logo, Icon or Photo',
    desc: 'Drag & drop any PNG, JPG, SVG, or WebP graphic, paste from clipboard (Ctrl+V), or try our sample 3D geometric logo.',
  },
  {
    number: '02',
    title: 'Customize Shape, Padding & Background',
    desc: 'Choose square, rounded squircle, or circle shapes. Fine-tune safe margin padding and background fill (transparent, white, dark, or hex color).',
  },
  {
    number: '03',
    title: 'Download Complete Favicon Package',
    desc: 'Download the all-in-one ZIP bundle with multi-res favicon.ico, all PNG resolutions (16px to 512px), site.webmanifest, and ready-to-paste HTML code.',
  },
];

const faqs = [
  [
    'What image resolutions are embedded inside the generated favicon.ico file?',
    'Our client-side ICO compiler packages 16×16, 32×32, 48×48, 64×64, 128×128, and crystal-clear 256×256 HD resolutions into a single multi-resolution binary favicon.ico file. Stepped downsampling ensures zero blur when zooming in, while browsers and Windows taskbars automatically select the optimal frame.',
  ],
  [
    'Why do modern websites require both favicon.ico and PNG icons?',
    'Desktop web browsers like Google Chrome, Microsoft Edge, and Firefox use favicon.ico or 32×32 PNGs for browser tabs. Mobile devices require specialized high-resolution icons: iOS Safari uses the 180×180 Apple Touch Icon for bookmarks, while Android Chrome and Progressive Web Apps (PWA) require 192×192 and 512×512 icons specified in site.webmanifest.',
  ],
  [
    'How do I install the downloaded favicon package on my website?',
    'Extract the downloaded favicons.zip file and copy favicon.ico, site.webmanifest, and the PNG images into your website root public directory (e.g., /public or /static). Then copy the generated HTML snippet and paste it inside the <head> tags of your website HTML or layout templates.',
  ],
  [
    'What source image formats work best for generating favicons?',
    'Any square PNG, SVG vector, or high-resolution JPG works great. Square images of at least 512×512 pixels with transparent backgrounds yield the sharpest icons across Retina displays, mobile home screens, and browser tabs.',
  ],
  [
    'Are my uploaded logos or graphics sent to a remote server?',
    'No! All image resizing, canvas clipping, ICO binary encoding, and ZIP packaging run 100% locally inside your device browser memory using HTML5 Canvas and WebAssembly. Your photos, brand logos, and graphics never touch an external server or cloud service.',
  ],
  [
    'What is the Apple Touch Icon and how does iPhone Safari use it?',
    'The Apple Touch Icon (apple-touch-icon.png, 180×180 px) is displayed when an iPhone, iPad, or iPod user bookmarks your website or chooses "Add to Home Screen". iOS automatically applies its signature squircle masking and subtle drop shadow to give your site a native iOS app aesthetic.',
  ],
];

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Tools', path: '/tools' },
  { name: 'Image to Favicon', path: '/tools/image-to-favicon' },
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  canonicalPath: '/tools/image-to-favicon',
  keywords: [
    'image to favicon',
    'favicon generator',
    'convert image to ico',
    'png to favicon',
    'svg to favicon',
    'generate favicon ico',
    'apple touch icon generator',
    'pwa icon generator',
    'free favicon maker online',
  ],
  structuredData: [
    () => breadcrumbSchema(breadcrumbs),
    ({ siteUrl, canonicalUrl }) => toolSchema(
      'Image to Favicon Converter & Generator',
      pageDescription,
      canonicalUrl,
      siteUrl,
      [
        'Convert PNG, JPG, SVG, and WebP into multi-resolution favicon.ico',
        'Automatic generation of 16px, 32px, 48px, 64px, 128px, 180px, 192px, 512px icons',
        'Live realistic browser tab, mobile home screen, and Google search preview',
        'Ready-to-copy HTML <head> code and PWA site.webmanifest',
        '100% private in-browser processing with zero remote uploads',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Convert Images to Favicons Online', pageDescription, steps, siteUrl, '/tools/image-to-favicon'),
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
      <section class="tools-layout container">
        <div class="tools-hero">
          <span class="eyebrow"><Globe :size="13" /> WEB &amp; APP ICON GENERATOR</span>
          <h1>Image to Favicon Online<br /><span>generate favicon.ico, apple touch &amp; pwa icons.</span></h1>
          <p>Transform any logo, photo, or vector into multi-resolution <code>favicon.ico</code> (16×16 to 256×256 HD), Apple Touch icons for iOS, Android Chrome home screen icons, and web manifests. Preview your favicon in live browser tabs before downloading.</p>
        </div>

        <div class="tools-converter-wrap" id="converter">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Multi-Resolution ICO Engine</div>
          <ImageToFaviconConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed 100% locally in browser memory. Zero image uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><FileImage :size="14" /></span>
              <div>
                <b>Multi-Res HD Windows ICO</b>
                <small>Packages 16×16, 32×32, 48×48, up to 256×256 HD pixel streams into a true binary favicon.ico file.</small>
              </div>
            </li>
            <li>
              <span><Smartphone :size="14" /></span>
              <div>
                <b>iOS &amp; Android PWA Icons</b>
                <small>Generates high-res Apple Touch Icon (180×180) and Android Chrome icons (192×192 &amp; 512×512) for web apps.</small>
              </div>
            </li>
            <li>
              <span><Laptop :size="14" /></span>
              <div>
                <b>Live Browser Tab Simulation</b>
                <small>Inspect your favicon live in realistic light &amp; dark desktop browser tabs and mobile home screens.</small>
              </div>
            </li>
            <li>
              <span><FileArchive :size="14" /></span>
              <div>
                <b>All-In-One ZIP Package</b>
                <small>Download all sizes, manifest, and ready-to-copy HTML &lt;head&gt; code in a single organized ZIP bundle.</small>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <Sparkles :size="16" />
            <div>
              <b>Pro-Tip for Sharp Favicons:</b>
              Use a transparent PNG or SVG vector of at least 512×512 pixels with simple, bold shapes. High-contrast logos with 10%–15% padding ensure your icon stays crisp and easily recognizable even when shrunk to 16×16 pixels!
            </div>
          </div>
        </div>
      </section>

      <!-- How to Steps Section -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">QUICK TUTORIAL</span>
          <h2>How to Create Favicons from Images in 3 Simple Steps</h2>
          <p>Generate professional website icons for desktop browsers, iPhones, and Android in seconds.</p>
        </div>

        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span>
                <Globe v-if="step.number === '01'" :size="22" />
                <Sliders v-else-if="step.number === '02'" :size="22" />
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
          <span class="mini-label">WHY USE OUR FAVICON GENERATOR</span>
          <h2>Create Crisp, High-DPI Website Favicons &amp; App Icons in Seconds</h2>
          <p>Whether you're launching a new web application, establishing brand identity, creating Progressive Web Apps (PWAs), or bookmarking iOS home screen apps, our browser-based favicon generator delivers standard multi-resolution icons with zero server uploads.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><FileImage :size="24" /></span>
            <h3>Multi-Resolution Windows .ICO Compiler</h3>
            <p>Our client-side binary compiler embeds 16×16, 32×32, and 48×48 pixel streams into a true Windows binary favicon.ico file.</p>
            <ul>
              <li>Crystal clear rendering in desktop browser tabs</li>
              <li>Windows taskbar, desktop shortcut, and pinned site support</li>
              <li>Eliminates blurry 16px downscaling artifacts</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Smartphone :size="24" /></span>
            <h3>iOS Apple Touch &amp; Android PWA Icons</h3>
            <p>Generates high-resolution icons tailored for mobile bookmarks, homescreens, and Progressive Web App splash screens.</p>
            <ul>
              <li>180×180 Apple Touch Icon for iPhone and iPad Safari</li>
              <li>192×192 &amp; 512×512 Android Chrome home screen icons</li>
              <li>Pre-configured site.webmanifest JSON ready to drop into root</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ShieldCheck :size="24" /></span>
            <h3>100% In-Browser Privacy &amp; Speed</h3>
            <p>Your brand logos, vector artwork, and proprietary graphics are processed entirely inside your browser memory using HTML5 Canvas.</p>
            <ul>
              <li>Zero cloud uploads, tracking, or remote storage</li>
              <li>Instant generation with zero upload or download latency</li>
              <li>Works with large high-resolution images up to 50 MB</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Who Uses the Favicon Generator?</h2>
          <p>Essential for developers, web designers, agency owners, and digital brands.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Frontend &amp; Fullstack Developers</h4>
            <p>Generate production-ready favicon suites, manifest files, and HTML &lt;head&gt; tags for Next.js, Nuxt, React, Vue, WordPress, and HTML5 projects.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>UI/UX Designers &amp; Brand Teams</h4>
            <p>Test logo visibility in simulated browser tabs and smartphone home screens before shipping client design systems.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>SaaS &amp; Web App Founders</h4>
            <p>Ensure PWA installability on Android and iOS home screens with standard 192px and 512px progressive web app splash icons.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Digital Marketers &amp; SEO Specialists</h4>
            <p>Ensure your website displays a verified, high-resolution favicon badge in Google mobile search result snippets.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED MEDIA UTILITIES</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/convert-image" class="seo-keyword-pill">Convert Image Format</NuxtLink>
            <NuxtLink to="/tools/compress-image" class="seo-keyword-pill">Compress Image</NuxtLink>
            <NuxtLink to="/tools/remove-background" class="seo-keyword-pill">Remove Background</NuxtLink>
            <NuxtLink to="/tools/image-color-picker" class="seo-keyword-pill">Image Color Picker</NuxtLink>
            <NuxtLink to="/tools/image-to-svg" class="seo-keyword-pill">Image to SVG</NuxtLink>
            <NuxtLink to="/tools/blur-face" class="seo-keyword-pill">Blur Face</NuxtLink>
            <NuxtLink to="/tools/split-image" class="seo-keyword-pill">Split Image</NuxtLink>
            <NuxtLink to="/tools/image-collage" class="seo-keyword-pill">Image Collage</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">GOT QUESTIONS?</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about generating favicons from images with We Make PDF.</p>
          <div class="faq-decoration" aria-hidden="true">
            <Globe :size="42" />
            <span>FAVICON &bull; GENERATOR</span>
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

      <!-- Closing CTA Banner -->
      <section class="closing-cta container">
        <div>
          <span class="mini-label">ALL-IN-ONE IMAGE UTILITIES</span>
          <h2>Need to compress, convert, or edit your images?</h2>
          <p>Explore over 40 free client-side image and document tools. Convert formats, remove backgrounds, blur faces, extract colors, and generate favicons without ever uploading files to a remote server.</p>
        </div>
        <NuxtLink to="/tools/convert-image" class="primary-button">
          Open Convert Image <ArrowRight :size="18" />
        </NuxtLink>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

