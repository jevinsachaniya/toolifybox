<script setup>
import { 
  ArrowRight,
  Check, 
  ChevronDown,
  Copy, 
  Eye, 
  HelpCircle, 
  Image as ImageIcon, 
  Layers, 
  Palette, 
  Pipette, 
  ShieldCheck, 
  Sliders, 
  Sparkles, 
  Wand2 
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

const pageTitle = 'Image Color Picker Online — Auto-Detect Hex, RGB & Color Names | We Make PDF';
const pageDescription = 'Free online image color picker tool. Upload any image, inspect pixels with a precision magnifier loupe cursor, and extract exact HEX, RGB, HSL, CMYK codes, and human-friendly color names. 100% private in-browser tool.';

const steps = [
  {
    number: '01',
    title: 'Upload Any Image or Photo',
    desc: 'Drag and drop any JPG, PNG, WebP, SVG, or BMP file, paste directly from clipboard (Ctrl+V), or try our sample photo.',
  },
  {
    number: '02',
    title: 'Hover & Point with Magnifier Loupe',
    desc: 'Glide your pointer across the canvas. A retro 9x9 zoomed magnifier lens reveals individual pixels and live color names.',
  },
  {
    number: '03',
    title: 'Click to Inspect & Copy Codes',
    desc: 'Lock on any pixel to see exact HEX, RGB, HSL, HSV, CMYK values, color names, and export CSS or JSON palettes with one click.',
  },
];

const faqs = [
  [
    'How do I pick an exact pixel color from my image?',
    'Simply upload or drop your photo into the workspace. As you move your mouse cursor or drag your finger on a mobile screen, an automatic 110px Magnifier Loupe lens enlarges the pixels 10x with a centered reticle. When you find the desired hue, click or release your touch to lock the color and view its codes.',
  ],
  [
    'How does the tool identify the color name (e.g., "Dodger Blue")?',
    'We Make PDF uses a comprehensive database of over 1,500 curated color names adhering to CSS, Pantone, and Namethatcolor specifications. Our Redmean perceptual distance algorithm computes the exact or closest human-friendly color name instantaneously inside your browser.',
  ],
  [
    'What color code formats are supported for copying?',
    'The color inspector displays HEX (#RRGGBB), RGB (rgb(r, g, b)), HSL (hsl(h, s%, l%)), HSV/HSB (hsv(h, s%, v%)), and CMYK (cmyk(c%, m%, y%, k%)). Every format includes a one-click copy button with instant clipboard confirmation.',
  ],
  [
    'Can I pick colors from anywhere on my desktop screen?',
    'Yes! If you are using Google Chrome, Microsoft Edge, or Opera on desktop, click the "Pick from Screen" button to launch your operating system native EyeDropper tool, allowing you to sample colors outside the browser window.',
  ],
  [
    'Does the tool automatically generate a color palette from my photo?',
    'Yes. Upon loading your image, our client-side quantization engine scans the photo and extracts the top 8 vibrant dominant colors. You can click any dominant swatch to view its codes or pick colors manually to build a custom palette that can be exported as CSS variables or JSON.',
  ],
  [
    'Are my photos uploaded to a remote cloud server?',
    'No. Like all We Make PDF utilities, the Image Color Picker operates 100% locally in your web browser using HTML5 Canvas and WebAssembly. Your photos and graphics never leave your computer or phone.',
  ],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/image-color-picker',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Image Color Picker', path: '/tools/image-color-picker' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/image-color-picker',
      'Image Color Picker Online',
      pageDescription,
      [
        'Interactive image canvas with pixel-level Magnifier Loupe',
        'Extracts exact HEX, RGB, HSL, HSV, and CMYK color codes',
        'Automatic human-friendly color naming from 1,500+ curated shades',
        'Auto-extracts top 8 dominant vibrant colors from any photo',
        'Build custom palettes and export as CSS Variables or JSON',
        'Tints, shades, and WCAG accessibility contrast ratio checker',
        'Native EyeDropper API integration for picking colors anywhere on screen',
        '100% private in-browser processing with zero remote uploads',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Pick Colors from Images Online', pageDescription, steps, siteUrl, '/tools/image-color-picker'),
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
      <section class="tools-layout container color-picker-layout">
        <div class="tools-hero">
          <span class="eyebrow"><Pipette :size="13" /> PRECISION COLOR INSPECTION &amp; PALETTES</span>
          <h1>Image Color Picker Online<br /><span>pick colors, hex, rgb &amp; names.</span></h1>
          <p>Sample colors directly from any photo or graphic. Hover with our high-precision magnifier loupe, identify color names, copy HEX, RGB, HSL, and CMYK codes, or auto-extract cohesive brand palettes. 100% private with zero file uploads.</p>
        </div>

        <div class="tools-converter-wrap" id="converter">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Precision Magnifier Loupe</div>
          <ColorPickerConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed 100% locally in browser memory. Zero image uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><Pipette :size="14" /></span>
              <div>
                <strong>Precision Magnifier Loupe</strong>
                <p>10x enlarged pixel grid with centered reticle lets you pinpoint exact single pixels in high-res photos.</p>
              </div>
            </li>
            <li>
              <span><Sparkles :size="14" /></span>
              <div>
                <strong>Human Color Naming</strong>
                <p>Instantly identifies recognizable names (e.g. "Dodger Blue", "Coral") using a 1,500+ curated shade dataset.</p>
              </div>
            </li>
            <li>
              <span><Copy :size="14" /></span>
              <div>
                <strong>Multi-Format Code Export</strong>
                <p>One-click copy for HEX, RGB, HSL, HSV, and CMYK, plus export palettes as CSS variables or JSON.</p>
              </div>
            </li>
            <li>
              <span><Palette :size="14" /></span>
              <div>
                <strong>Dominant Palette Extraction</strong>
                <p>Automatically scans your uploaded image and discovers the top 8 vibrant dominant colors.</p>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <Sparkles :size="16" />
            <div>
              <strong>Pro-Tip for Designers &amp; Developers:</strong>
              Use our <b>Zoom</b> buttons or mouse wheel to zoom into small UI buttons, logos, or icons. As you click different areas of your photo, they are automatically saved into your <b>Picked Palette</b>, which you can export in one click as ready-to-use <b>CSS Custom Properties</b>!
            </div>
          </div>
        </div>
      </section>

      <!-- How to Steps Section -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">QUICK TUTORIAL</span>
          <h2>How to Pick Colors from Images in 3 Simple Steps</h2>
          <p>Sample pixels, identify exact shades, and copy color values in seconds directly in your web browser.</p>
        </div>

        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span>
                <ImageIcon v-if="step.number === '01'" :size="22" />
                <Pipette v-else-if="step.number === '02'" :size="22" />
                <Copy v-else :size="22" />
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
          <span class="mini-label">WHY USE OUR COLOR PICKER</span>
          <h2>Extract Accurate Colors, Build Harmonious Palettes &amp; Verify Contrast</h2>
          <p>Whether you're developing websites, designing brand guidelines, matching digital artwork hues, or checking text readability, our browser-based eyedropper provides professional-grade color inspection.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Pipette :size="24" /></span>
            <h3>Pixel-Accurate Magnifier Lens</h3>
            <p>High-resolution photos can contain millions of subtle gradients. Our floating magnifier loupe enlarges a 9x9 pixel grid by 10x with zero blur, allowing you to select exact individual pixels.</p>
            <ul>
              <li>Crisp pixelated rendering with crosshair reticle</li>
              <li>Live hovered swatch, hex code, and color name preview</li>
              <li>Mobile-optimized touch tracking that avoids thumb occlusion</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Palette :size="24" /></span>
            <h3>Comprehensive Color Science</h3>
            <p>Every sampled color is analyzed in real-time across multiple color spaces, including digital screen values and commercial print targets.</p>
            <ul>
              <li>Instant conversions: HEX, RGB, HSL, HSV, and CMYK</li>
              <li>7-step tonal spectrum generating lighter tints and darker shades</li>
              <li>WCAG 2.1 accessibility contrast score against white and dark text</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ShieldCheck :size="24" /></span>
            <h3>100% Private Client-Side Sampling</h3>
            <p>Your uploaded graphics, client logos, and proprietary marketing mockups are decoded strictly inside your computer's browser sandbox using HTML5 Canvas APIs.</p>
            <ul>
              <li>Zero remote cloud server uploads or data logging</li>
              <li>Works with ultra-large files up to 50 MB with fast hardware acceleration</li>
              <li>Offline ready and functional without continuous internet connectivity</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Who Uses the Online Image Color Picker?</h2>
          <p>Streamlining creative workflows for designers, developers, illustrators, and marketers.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Web &amp; UI/UX Designers</h4>
            <p>Extract exact color codes from design inspiration screenshots, moodboards, or competitor websites to construct cohesive digital interfaces.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Digital Illustrators &amp; Concept Artists</h4>
            <p>Sample lighting tones, natural skin tones, and environmental gradients from reference photography to build custom digital painting swatches.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Brand Identity &amp; Marketing Teams</h4>
            <p>Verify brand logo colors across vector graphics, verify CMYK print values, and ensure consistent color palette usage in marketing collateral.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Accessibility &amp; Frontend Developers</h4>
            <p>Verify that foreground colors meet WCAG AA and AAA compliance contrast thresholds before publishing web interfaces.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED MEDIA UTILITIES</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/convert-image" class="seo-keyword-pill">Convert Image Format</NuxtLink>
            <NuxtLink to="/tools/compress-image" class="seo-keyword-pill">Compress Image</NuxtLink>
            <NuxtLink to="/tools/remove-background" class="seo-keyword-pill">Remove Background</NuxtLink>
            <NuxtLink to="/tools/watermark-image" class="seo-keyword-pill">Watermark Image</NuxtLink>
            <NuxtLink to="/tools/blur-face" class="seo-keyword-pill">Blur Face</NuxtLink>
            <NuxtLink to="/tools/image-to-svg" class="seo-keyword-pill">Image to SVG</NuxtLink>
            <NuxtLink to="/tools/split-image" class="seo-keyword-pill">Split Image Grid</NuxtLink>
            <NuxtLink to="/tools/image-collage" class="seo-keyword-pill">Image Collage</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">GOT QUESTIONS?</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about extracting colors from images with We Make PDF.</p>
          <div class="faq-decoration" aria-hidden="true">
            <Pipette :size="42" />
            <span>COLOR &bull; PICKER</span>
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
          <p>Explore over 37 free client-side image and document tools. Convert formats, remove backgrounds, blur faces, and optimize photos without ever uploading files to a remote server.</p>
        </div>
        <NuxtLink to="/tools/convert-image" class="primary-button">
          Open Convert Image <ArrowRight :size="18" />
        </NuxtLink>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
.color-picker-layout {
  position: relative;
}
</style>

