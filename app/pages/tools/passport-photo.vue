<script setup>
import {
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  FileCheck,
  FileImage,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  LockKeyhole,
  Maximize2,
  Printer,
  ScanFace,
  Scissors,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wand2,
  Zap,
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/passport-photo', '/passport-photo-maker', '/tools/passport-photo-maker'],
});

const pageTitle = 'Free Passport Photo Maker Online [Print-Ready 4x6 & AI] | We Make PDF';
const pageDescription = 'Create official biometric passport & visa photos online for free. Instant white background AI cutout, standard 2x2" / 35x45mm sizing & printable 4x6" sheets. 100% private!';

const steps = [
  {
    number: '01',
    title: 'Upload or Snap Your Photo',
    desc: 'Upload any selfie or portrait (JPG, PNG, or WebP), or try our studio sample portrait. Stand against any wall or indoor lighting.',
  },
  {
    number: '02',
    title: '1-Click AI Background Removal & Sizing',
    desc: 'Our on-device AI automatically extracts your portrait and replaces the backdrop with pure white, light grey, or official visa colors.',
  },
  {
    number: '03',
    title: 'Align Biometric Guides & Download',
    desc: 'Align your head and eyes within the official ICAO oval frame, then download a single 300 DPI photo or a printable 4×6" / A4 multi-photo sheet with cut marks.',
  },
];

const faqs = [
  [
    'What are the standard passport photo sizes for US, India, UK, and Schengen countries?',
    'United States: 2 × 2 inches (51 × 51 mm) @ 300 DPI (600 × 600 px) with white background.\nIndia: 35 × 45 mm (3.5 × 4.5 cm) or 2 × 2" for online visas, with white or light background and 70-80% face coverage.\nUnited Kingdom: 35 × 45 mm with plain cream or light grey background.\nSchengen Visa (EU): 35 × 45 mm with light grey or white background and 32-36 mm head height.',
  ],
  [
    'How does the AI background removal ensure passport office compliance?',
    'Most passport authorities (US State Dept, Indian Passport Seva, UK HMPO, Schengen consulates) strictly reject patterned, textured, shadowed, or colored everyday backgrounds. Our in-browser AI segments your hair and shoulders precisely, then substitutes an official solid pure white (#ffffff) or light grey (#f3f4f6) backdrop.',
  ],
  [
    'What is the ICAO biometric face framing standard?',
    'ICAO (International Civil Aviation Organization) mandates that the distance from the bottom of your chin to the crown of your head must occupy between 70% to 80% of the total photo height. Our interactive biometric guide overlay displays these exact oval boundaries and eye-level lines so you can frame your face with zero guesswork.',
  ],
  [
    'Can I print the passport photos at local photo kiosks or on home printers?',
    'Yes! Under "Print Sheet", select 4 × 6 inches (10 × 15 cm), 5 × 7 inches, or A4 paper. The maker automatically tiles your passport photo into a grid (e.g., 6 or 8 photos on a 4x6" card) complete with scissor cutting marks. You can download it as a high-resolution JPG, PNG, or print-ready PDF.',
  ],
  [
    'Are my private personal photos uploaded to remote servers?',
    'Never! We Make PDF runs 100% client-side in your web browser using HTML5 Canvas, WebAssembly, and local image processing. Your face, biometric data, and photos never leave your computer or phone.',
  ],
  [
    'What rules should I follow when taking a passport photo at home?',
    '1. Look straight into the camera with a relaxed, neutral facial expression (mouth closed).\n2. Ensure both eyes are open, level, and clearly visible with no hair obscuring your face.\n3. Avoid heavy shadows across your cheeks or neck by facing a soft light source.\n4. Remove sunglasses, tinted eyeglasses, hats, or head coverings (unless for religious or medical reasons).',
  ],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/passport-photo',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Passport Photo Maker', path: '/tools/passport-photo' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/passport-photo',
      'Passport Photo Maker Online Free',
      pageDescription,
    ),
    ({ siteUrl }) => howToSchema(
      'How to Make an Official Passport Photo Online for Free',
      pageDescription,
      steps,
      siteUrl,
      '/tools/passport-photo',
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
          <span class="bc-current">Passport Photo Maker</span>
        </nav>

        <!-- Hero Header -->
        <header class="tool-header-block">
          <div class="tool-badge-pill">
            <Sparkles :size="13" />
            <span>AI BIOMETRIC PASSPORT &amp; VISA MAKER</span>
          </div>
          <h1 class="tool-main-heading">
            Passport Photo Maker Online
          </h1>
          <p class="tool-lead-summary">
            Create professional, government-compliant passport and visa photos in seconds. Automatic AI background removal, white studio replacement, biometric head-size framing, and print-ready 4×6" sheets.
          </p>

          <div class="tool-guarantees-row">
            <span class="guarantee-item">
              <Check :size="14" /> Official US, India, UK &amp; Schengen Specs
            </span>
            <span class="guarantee-item">
              <Check :size="14" /> 1-Click AI White Background
            </span>
            <span class="guarantee-item">
              <Check :size="14" /> Printable 4×6" &amp; A4 Sheets with Cut Marks
            </span>
            <span class="guarantee-item">
              <Check :size="14" /> 100% In-Browser Privacy
            </span>
          </div>
        </header>

        <!-- Main Converter Studio Box -->
        <section class="tool-converter-section">
          <ClientOnly>
            <PassportPhotoConverter />
          </ClientOnly>
        </section>

        <!-- Feature Highlight Badges -->
        <section class="tool-highlights-grid">
          <div class="highlight-feature-card">
            <div class="feat-icon-badge">
              <Wand2 :size="20" />
            </div>
            <h3 class="feat-title">1-Click AI Background Removal</h3>
            <p class="feat-desc">
              Extract portraits with sub-pixel precision around hair and shoulders, replacing messy backgrounds with pure white or official consular colors.
            </p>
          </div>

          <div class="highlight-feature-card">
            <div class="feat-icon-badge">
              <ScanFace :size="20" />
            </div>
            <h3 class="feat-title">Biometric Head-Height Guide</h3>
            <p class="feat-desc">
              Visual ICAO biometric overlay guides your eye-line and crown-to-chin distance (70–80% ratio) to guarantee application acceptance.
            </p>
          </div>

          <div class="highlight-feature-card">
            <div class="feat-icon-badge">
              <Printer :size="20" />
            </div>
            <h3 class="feat-title">Print-Ready 4×6" Photo Sheets</h3>
            <p class="feat-desc">
              Tile multiple photos with scissor cut lines onto standard 4×6", 5×7", or A4 photo paper. Save money printing at any local store for pennies.
            </p>
          </div>

          <div class="highlight-feature-card">
            <div class="feat-icon-badge">
              <ShieldCheck :size="20" />
            </div>
            <h3 class="feat-title">100% Private &amp; Secure</h3>
            <p class="feat-desc">
              Everything executes locally on your device using WebAssembly. Your personal photos, face scans, and documents are never uploaded to any server.
            </p>
          </div>
        </section>

        <!-- How It Works Section -->
        <section class="tool-how-it-works-block">
          <div class="section-label-chip">
            <Sparkles :size="12" />
            <span>SIMPLE 3-STEP PROCESS</span>
          </div>
          <h2 class="sub-section-heading">How to Make a Passport Photo Online</h2>
          <div class="how-steps-grid">
            <div v-for="step in steps" :key="step.number" class="step-card">
              <div class="step-num">{{ step.number }}</div>
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-text">{{ step.desc }}</p>
            </div>
          </div>
        </section>

        <!-- Frequently Asked Questions -->
        <section class="tool-faq-block">
          <div class="section-label-chip">
            <HelpCircle :size="12" />
            <span>COMMON QUESTIONS</span>
          </div>
          <h2 class="sub-section-heading">Frequently Asked Questions</h2>
          <div class="faq-list">
            <details v-for="([question, answer], index) in faqs" :key="index" class="faq-item">
              <summary class="faq-question">
                <span>{{ question }}</span>
                <ChevronDown :size="16" class="faq-chevron" />
              </summary>
              <div class="faq-answer">
                <p>{{ answer }}</p>
              </div>
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
  min-height: calc(100vh - 80px);
  padding-bottom: 4rem;
}

.tool-page-wrapper {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 3rem;
}

.tool-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--muted);
  margin-bottom: 1.5rem;
}

.tool-breadcrumb a:hover {
  color: var(--accent);
}

.bc-sep {
  color: #cbd5e1;
}

.bc-current {
  color: var(--ink);
  font-weight: 600;
}

.tool-header-block {
  text-align: center;
  max-width: 820px;
  margin: 0 auto 2.5rem;
}

.tool-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  background: var(--accent-subtle);
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.tool-main-heading {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 1rem;
}

.tool-lead-summary {
  font-size: 1.1rem;
  color: var(--muted);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.tool-guarantees-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
}

.guarantee-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-secondary);
}

.guarantee-item svg {
  color: #10b981;
}

.tool-converter-section {
  margin-bottom: 3.5rem;
}

/* Feature Highlights */
.tool-highlights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-bottom: 4rem;
}

.highlight-feature-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s, box-shadow 0.2s;
}

.highlight-feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.06);
}

.feat-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 0.75rem;
  background: var(--accent-subtle);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.feat-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 0.5rem;
}

.feat-desc {
  font-size: 0.88rem;
  color: var(--muted);
  line-height: 1.55;
}

/* How It Works */
.tool-how-it-works-block {
  text-align: center;
  margin-bottom: 4rem;
}

.section-label-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.sub-section-heading {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--ink);
  margin-bottom: 2rem;
}

.how-steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  text-align: left;
}

.step-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.75rem 1.5rem;
  position: relative;
}

.step-num {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--accent);
  margin-bottom: 0.75rem;
  opacity: 0.9;
}

.step-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 0.5rem;
}

.step-text {
  font-size: 0.88rem;
  color: var(--muted);
  line-height: 1.55;
}

/* FAQs */
.tool-faq-block {
  max-width: 860px;
  margin: 0 auto;
  text-align: center;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  text-align: left;
  margin-top: 1.5rem;
}

.faq-item {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  overflow: hidden;
  transition: border-color 0.15s;
}

.faq-item[open] {
  border-color: #cbd5e1;
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.15rem 1.35rem;
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
  user-select: none;
}

.faq-chevron {
  color: var(--muted);
  transition: transform 0.2s;
}

.faq-item[open] .faq-chevron {
  transform: rotate(180deg);
}

.faq-answer {
  padding: 0 1.35rem 1.25rem;
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.65;
  white-space: pre-line;
}
</style>

