<script setup>
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  ChevronDown,
  Cpu,
  FileArchive,
  FileCheck,
  FileImage,
  FolderArchive,
  Globe,
  Image as ImageIcon,
  Layers,
  LockKeyhole,
  Maximize2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/convert-image', '/tools/image-converter', '/image-converter'],
});

const pageTitle = 'Convert Image Online Free — JPG, PNG, WebP, GIF, BMP, ICO | We Make PDF';
const pageDescription = 'Convert images online for free between JPG, PNG, WebP, GIF, BMP, ICO, and AVIF. Batch convert multiple images, customize quality, resize dimensions, and download all as a ZIP with 100% in-browser privacy.';

const steps = [
  { number: '01', title: 'Upload Your Images', desc: 'Drag and drop single or multiple JPG, PNG, WebP, GIF, BMP, ICO, SVG, or AVIF files up to 50 MB each.' },
  { number: '02', title: 'Choose Target Format & Options', desc: 'Select your target format (WebP, PNG, JPG, GIF, BMP, ICO, AVIF). Optionally adjust output quality, dimensions, or background color.' },
  { number: '03', title: 'Convert & Download', desc: 'Click "Convert Images" to transform your files instantly in your browser. Download single images or grab all in a single ZIP bundle.' },
];

const faqs = [
  ['Which image formats can I convert between?', 'We Make PDF supports converting between all major image formats, including JPG (JPEG), PNG, WebP, GIF, BMP, Windows ICO (favicons), AVIF, and SVG. You can convert JPG to WebP, PNG to WebP, WebP to PNG, JPG to PNG, PNG to JPG, or any image to ICO format.'],
  ['Can I convert multiple images at once (batch conversion)?', 'Yes! You can upload up to 30 images simultaneously. You can set a global target format for all images or customize the target format individually for each file, then download them all at once as a convenient ZIP file.'],
  ['Does converting from PNG to WebP or JPG keep transparency?', 'WebP, PNG, and GIF fully preserve alpha transparency. When converting transparent images to formats that do not support transparency (such as JPG or BMP), We Make PDF automatically blends the background with your choice of solid white or black to ensure clean, professional results without dark artifacts.'],
  ['Are my photos or images uploaded to any remote server?', 'Never. We Make PDF processes all images 100% locally inside your device browser memory via HTML5 Canvas and JavaScript. Your personal photos, client designs, and proprietary graphics never leave your computer or phone.'],
  ['How can I convert an image to an ICO favicon for my website?', 'Simply upload any JPG, PNG, or WebP image and select "ICO" as your target format. We Make PDF generates a compliant Windows ICO binary file containing standard 32-bit RGBA icon dimensions (32×32, 64×64, or 128×128 px) ready to drop into your website as `favicon.ico`.'],
  ['Why should I convert my JPG and PNG images to WebP?', 'WebP is a modern web format engineered by Google that offers 25% to 35% smaller file sizes than JPG and PNG at identical visual quality. Converting to WebP dramatically boosts website loading speed, reduces bandwidth consumption, and improves Google Core Web Vitals and SEO scores.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/convert-image',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Convert Image', path: '/tools/convert-image' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/convert-image',
      'Convert Image Online Free',
      pageDescription,
      [
        'Convert between JPG, PNG, WebP, GIF, BMP, ICO, and AVIF formats',
        'Batch multi-file conversion up to 30 images simultaneously',
        'Download all converted images as a single ZIP archive',
        'Adjustable output quality for lossy WebP and JPG conversions',
        'Optional dimension scaling (100%, 75%, 50%, 25%)',
        'Configurable background fill for transparent to opaque formats',
        'Built-in Windows ICO favicon generator',
        '100% private in-browser client-side processing with zero uploads',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Convert Images Online Free', pageDescription, steps, siteUrl, '/tools/convert-image'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to image converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <section class="tools-layout container">
        <div class="tools-hero">
          <span class="eyebrow"><Sparkles :size="13" /> ALL-IN-ONE IMAGE FORMAT CONVERTER</span>
          <h1>Convert image formats<br /><span>instantly in your browser.</span></h1>
          <p>Transform your images between JPG, PNG, WebP, GIF, BMP, ICO, and AVIF. Batch convert multiple files, customize compression quality, resize dimensions, and download all in a ZIP with 100% client-side privacy.</p>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Image Converter Ready</div>
          <ConvertImageConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally in your browser. Zero image uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><ArrowLeftRight :size="14" /></span>
              <div>
                <b>Multi-Format Conversion</b>
                <small>Convert freely between JPG, PNG, WebP, GIF, BMP, ICO, AVIF, and SVG.</small>
              </div>
            </li>
            <li>
              <span><FolderArchive :size="14" /></span>
              <div>
                <b>Batch Processing &amp; ZIP</b>
                <small>Convert up to 30 images in one go and download individually or packaged in a ZIP archive.</small>
              </div>
            </li>
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <b>WebP Optimization</b>
                <small>Reduce file sizes by up to 80% while retaining crisp transparency and detail.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>100% Local Privacy</b>
                <small>Your personal photos and client graphics never leave your device memory.</small>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <FileImage :size="18" />
            <p><b>Pro Tip:</b> Converting website images from PNG or JPG to <b>WebP</b> can reduce total page weight by over 60%, drastically improving Google PageSpeed and SEO ranking.</p>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Three Simple Steps to Convert Images</h2>
          <p>Convert single images or bulk batches with zero software installations.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><RefreshCw :size="20" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Format Comparison Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">FORMAT GUIDE</span>
          <h2>Choosing the Right Image Format for Your Use Case</h2>
          <p>Each image format is designed for specific performance and visual trade-offs. Here is how they compare:</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Zap :size="24" /></span>
            <h3>WebP — Modern Web Standard</h3>
            <p>Developed by Google, WebP provides superior lossless and lossy compression for web images. WebP files are on average 26% smaller than PNGs and 25-34% smaller than comparable JPEGs while supporting 24-bit RGB with alpha transparency.</p>
            <ul>
              <li>Recommended for all modern websites and blogs</li>
              <li>Fully supported in Chrome, Safari, Firefox, and Edge</li>
              <li>Supports both lossy and lossless modes with alpha channel</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><FileCheck :size="24" /></span>
            <h3>PNG — Lossless &amp; Transparent</h3>
            <p>PNG is an uncompressed, lossless bitmap format that preserves exact pixel values and full 8-bit alpha transparency. It is the premier choice for company logos, app icons, digital screenshots, and detailed diagrams.</p>
            <ul>
              <li>Sharp text, clean edges, and zero compression artifacts</li>
              <li>Full transparent background support</li>
              <li>Universal editing support in Photoshop, Figma, and Canva</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Globe :size="24" /></span>
            <h3>JPG / JPEG — Universal Photography</h3>
            <p>JPG is the world's most widely recognized image format. It uses lossy discrete cosine transform compression to achieve compact file sizes for complex photographs and real-world scenes.</p>
            <ul>
              <li>100% compatibility across all legacy operating systems and email clients</li>
              <li>Adjustable quality ratio from 10% to 100%</li>
              <li>Ideal for photo albums, digital cameras, and social media uploads</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Layers :size="24" /></span>
            <h3>ICO — Website Favicons &amp; App Icons</h3>
            <p>The Windows ICO format encapsulates multi-resolution icon bitmaps into a single container file. Essential for web development to display custom brand marks in browser tab headers and bookmarks.</p>
            <ul>
              <li>Standard format for website `favicon.ico` files</li>
              <li>Supports 32-bit RGBA true color with transparent pixels</li>
              <li>Standard sizes: 32×32, 64×64, and 128×128 px</li>
            </ul>
          </article>
        </div>
      </section>

      <!-- Privacy Strip -->
      <section class="privacy-strip container">
        <div class="privacy-strip-content">
          <div class="privacy-badge"><ShieldCheck :size="20" /> 100% Private Client-Side Conversion</div>
          <h2>Your images never leave your browser</h2>
          <p>Unlike cloud conversion services that upload your private photos and sensitive corporate graphics to external servers, We Make PDF processes everything inside your device browser memory. Zero files are stored, transmitted, or monitored.</p>
        </div>
      </section>

      <!-- Frequently Asked Questions -->
      <section id="questions" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about converting images online with We Make PDF.</p>
        </div>
        <div class="faq-list">
          <details v-for="[q, a] in faqs" :key="q">
            <summary>
              <span>{{ q }}</span>
              <ChevronDown :size="18" class="faq-chevron" />
            </summary>
            <p>{{ a }}</p>
          </details>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

