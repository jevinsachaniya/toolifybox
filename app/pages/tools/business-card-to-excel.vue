<script setup>
import {
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  Cpu,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  IdCard,
  Image as ImageIcon,
  Layers,
  LockKeyhole,
  Maximize2,
  ScanText,
  Share2,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCheck,
  Zap,
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/business-card-to-excel', '/business-card-scanner', '/tools/business-card-scanner'],
});

const pageTitle = 'Business Card to Excel Converter — Scan Dual-Side Visiting Cards to XLSX | We Make PDF';
const pageDescription = 'Scan business cards and visiting cards (both front and back sides) online for free. Automatically extract contact names, job titles, companies, phone numbers, emails, websites, and addresses directly into Microsoft Excel (.xlsx) and CSV files with 100% in-browser privacy.';

const steps = [
  {
    number: '01',
    title: 'Upload or Snap Photos (Front & Back)',
    desc: 'Capture photos directly with your camera or upload front and back images of any business card. Supports JPG, PNG, WebP, and BMP up to 30 MB.',
  },
  {
    number: '02',
    title: 'AI OCR Recognition & Parsing',
    desc: 'Our in-browser AI OCR extracts text and intelligently categorizes full names, designations, company names, mobile numbers, emails, websites, and street addresses.',
  },
  {
    number: '03',
    title: 'Review & Download Excel File',
    desc: 'Review and tweak recognized details in the interactive table, scan multiple cards in batch, and download all data in an authentic Microsoft Excel (.xlsx), CSV, or vCard (.vcf) file.',
  },
];

const faqs = [
  [
    'Can I scan both front and back sides of a business card?',
    'Yes! Many modern business cards print the name and logo on the front and phone numbers, addresses, or services on the back. You can upload photos of both sides; our AI engine combines the recognized text from both images and extracts all fields into a single structured contact entry.',
  ],
  [
    'Which fields are automatically extracted into the Excel sheet?',
    'Our intelligent extraction heuristic extracts 19 distinct columns: Full Name, Job Title / Designation, Company / Organization, Primary Mobile, Office / Alternate Phone, Extra Phones, Primary Email, Secondary Email, Website URL, Full Address, City, State, ZIP / PIN Code, Country, GSTIN, PAN, Social Media profiles, Notes / Services, and Scanned Date.',
  ],
  [
    'Are my business card photos uploaded to any remote server or AI cloud?',
    'Never. We Make PDF processes all images and OCR recognition 100% locally inside your device browser memory using client-side WebAssembly and JavaScript. Your contacts, private client cards, phone numbers, and company data never leave your phone or computer.',
  ],
  [
    'Can I scan multiple cards and export them together into one Excel file?',
    'Yes! As you scan each business card, it is added to your interactive card table below. You can scan 5, 10, or 20+ cards one after another and download all of them together in a single consolidated Excel (.xlsx) spreadsheet.',
  ],
  [
    'Can I also export contacts directly to my phone or Google Contacts?',
    'Yes! Along with Microsoft Excel (.xlsx) and universal CSV (.csv), you can click "vCard (.vcf)" to download standard contact files that can be imported directly into iPhone Contacts, Android Google Contacts, or Microsoft Outlook with 1 click.',
  ],
  [
    'What should I do if a card photo is slightly blurry or has stylized fonts?',
    'Ensure good lighting and avoid reflections when taking the photo. You can select your preferred OCR language (Auto, English, Hindi, Gujarati), and our live editor lets you review and quickly correct any character before generating your Excel workbook.',
  ],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/business-card-to-excel',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Business Card to Excel', path: '/tools/business-card-to-excel' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/business-card-to-excel',
      'Business Card to Excel Converter Online Free',
      pageDescription,
    ),
    ({ siteUrl }) => howToSchema(
      'How to Scan Business Cards to Excel Online for Free',
      pageDescription,
      steps,
      siteUrl,
      '/tools/business-card-to-excel',
    ),
    () => faqSchema(faqs),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to business card scanner</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <!-- Main Layout: Hero + Converter Card + Quick Points -->
      <section class="tools-layout container">
        <div class="tools-hero">
          <span class="eyebrow"><Sparkles :size="13" /> AI DUAL-SIDE CONTACT EXTRACTOR</span>
          <h1>Business card scanner with<br /><span>instant Excel export.</span></h1>
          <p>Scan both front and back sides of paper visiting cards. Extract complete phone numbers, emails, designations, and addresses directly to an Excel (.xlsx) spreadsheet.</p>
        </div>

        <div class="tools-converter-wrap" id="converter">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="converter-card" style="text-align: center; padding: 3.5rem 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); color: #ef4444; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
              <LockKeyhole :size="28" />
            </div>
            <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem;">Tool Temporarily Inactive</h2>
            <p style="color: var(--muted); max-width: 480px; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
              The Business Card to Excel converter is currently undergoing precision OCR recognition, field mapping, and layout improvements. Please check back soon or explore our other active tools.
            </p>
            <NuxtLink to="/tools" class="tool-card-btn btn-active" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none;">
              Explore Other Tools <ArrowRight :size="16" />
            </NuxtLink>
          </div>
          <div class="under-card"><ShieldCheck :size="15" /> 100% private OCR on your device. Zero card uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li><span><IdCard :size="14" /></span><div><b>Dual-Side Scanning</b><small>Scan both front and back of cards for complete contact info.</small></div></li>
            <li><span><FileSpreadsheet :size="14" /></span><div><b>Authentic Excel Output</b><small>Formatted columns, bold headers, and auto-adjusted widths.</small></div></li>
            <li><span><Camera :size="14" /></span><div><b>Direct Live Camera</b><small>Snap crisp photos directly with built-in card alignment guide.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>100% Device-Level Privacy</b><small>OCR runs in browser WebAssembly. Data never leaves your device.</small></div></li>
          </ul>

          <div class="tools-tip"><Check :size="18" /><p><b>Tip: Good lighting produces sharp OCR</b><br />Use the Auto-Enhance Sharpness toggle to boost contrast on fine or stylized fonts.</p></div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="how-section container" id="how-it-works">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Convert paper business cards into digital contacts</h2>
          <p>Three simple steps to build your clean digital contact database.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><ScanText :size="22" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <!-- Educational Feature Cards Section -->
      <section class="seo-guide-section container">
        <div class="section-intro">
          <span class="mini-label">INTELLIGENT CONTACT PARSER</span>
          <h2>Turn Networking Stacks into Organized Spreadsheets</h2>
          <p>Manual data entry of business cards is slow and error-prone. We Make PDF scans, extracts, and organizes visiting cards in seconds without sending your data to the cloud.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Camera :size="24" /></span>
            <h3>Direct Camera Capture &amp; Dual-Side Upload</h3>
            <p>Snap visiting cards directly from your webcam or smartphone camera using our built-in viewfinder guide, or upload existing photos. Scan both front and back to capture secondary phone numbers, personal notes, and office locations.</p>
            <ul>
              <li>Framed alignment guide for straight, high-resolution snapshots</li>
              <li>Front and back side merging into one structured record</li>
              <li>Supports JPG, PNG, WebP, and BMP images up to 30 MB</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Cpu :size="24" /></span>
            <h3>Sharp OCR with Auto-Levels &amp; Inversion</h3>
            <p>Stylized business cards often feature dark backgrounds, gold foil lettering, or fine 7pt fonts. Our client-side preprocessing engine automatically upscales cards, enhances dynamic contrast, and inverts dark cards for maximum OCR accuracy.</p>
            <ul>
              <li>Auto-inversion of dark cards with white or light text</li>
              <li>Resolves common OCR ambiguities (O vs 0, I vs 1)</li>
              <li>Splits compound phone lines into Mobile, Office, and Alternate</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><FileSpreadsheet :size="24" /></span>
            <h3>Authentic Excel, CSV &amp; Phone vCard Export</h3>
            <p>Review and edit details in an interactive table before exporting. Download an authentic Microsoft Excel (.xlsx) workbook with 19 structured columns, a universal CSV file, or a vCard (.vcf) ready to import directly into your smartphone contacts.</p>
            <ul>
              <li>Genuine OpenXML XLSX format with bold formatted headers</li>
              <li>One-click table copy to paste directly into Google Sheets</li>
              <li>Batch scanning: add multiple cards and export all together</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>100% In-Browser Privacy &amp; Security</h3>
            <p>Your business cards and client contacts contain confidential numbers and private email addresses. We Make PDF processes all OCR and spreadsheet generation locally in your browser memory. Nothing is ever sent to external servers.</p>
            <ul>
              <li>Zero server uploads — 100% on-device WebAssembly execution</li>
              <li>No account or sign-up required, completely free</li>
              <li>Complies with corporate privacy and data security policies</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Where Business Card Scanning Makes an Impact</h2>
          <p>Save hours of manual data entry after trade shows, client meetings, and conferences.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Trade Shows &amp; Industry Expos</h4>
            <p>Quickly photograph stacks of vendor and supplier visiting cards at exhibitions and export them into a single master Excel spreadsheet before heading back to the office.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Sales Teams &amp; Lead Generation</h4>
            <p>Turn leads collected at networking dinners into CRM-ready CSV and Excel records without hiring manual data-entry assistants or waiting days.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Phone Contacts Import via vCard</h4>
            <p>Download a single `.vcf` file containing all scanned business contacts and import them straight into your iPhone or Android Google Contacts in one tap.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Small Business Accounting &amp; GSTIN Filing</h4>
            <p>Capture vendor GSTIN, PAN numbers, and registered office addresses directly from visiting cards to keep your billing and tax records accurate.</p>
          </div>
        </div>

        <!-- Related Tools -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/compress-image" class="seo-keyword-pill">Compress Image</NuxtLink>
            <NuxtLink to="/tools/convert-image" class="seo-keyword-pill">Convert Image</NuxtLink>
            <NuxtLink to="/tools/passport-photo" class="seo-keyword-pill">Passport Photo Maker</NuxtLink>
            <NuxtLink to="/tools/json-to-csv" class="seo-keyword-pill">JSON to CSV</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About Business Card to Excel</h2>
          <p>Find answers to common questions about scanning paper cards and exporting contacts.</p>
          <div class="faq-decoration" aria-hidden="true">
            <FileSpreadsheet :size="42" />
            <span>CARD &bull; EXCEL</span>
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
          <span class="mini-label">READY TO CONVERT YOUR CARDS?</span>
          <h2>Start Scanning Business Cards to Excel Now</h2>
          <p>Upload or snap visiting card photos right from your camera. Fast, accurate, and 100% private.</p>
        </div>
        <a href="#converter" class="primary-button">
          Scan Business Cards <ArrowRight :size="18" />
        </a>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private dual-side business card OCR with instant Excel export." />
  </div>
</template>
