<script setup>
import { 
  ArrowRight,
  BookOpen,
  Check, 
  ChevronDown,
  Copy, 
  Eye, 
  FileCheck,
  FileText, 
  HelpCircle, 
  Layers, 
  Palette, 
  ShieldCheck, 
  Sliders, 
  Sparkles, 
  Type,
  Wand2 
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/text-to-pdf', '/txt-to-pdf', '/tools/txt-to-pdf'],
});

const pageTitle = 'Text to PDF Converter Online — Convert TXT & Notes to PDF Free | We Make PDF';
const pageDescription = 'Free online Text to PDF converter. Type or paste your notes, essays, memos, and articles to generate professional, formatted vector PDF documents with custom typography, page numbers, and complete privacy.';

const steps = [
  {
    number: '01',
    title: 'Write, Paste or Upload Text',
    desc: 'Type your notes directly into the editor, paste from clipboard (Ctrl+V), or upload any .txt or .md text file.',
  },
  {
    number: '02',
    title: 'Customize Typography & Layout',
    desc: 'Select font styles (Helvetica, Times, Courier), font size, line spacing, margins, page size (A4, Letter), and color themes.',
  },
  {
    number: '03',
    title: 'Download Razor-Sharp PDF',
    desc: 'Click Convert & Download PDF. Your text is automatically typeset and paginated with vector typography in your browser memory.',
  },
];

const faqs = [
  [
    'How do I convert long text or articles into a multi-page PDF?',
    'Simply paste your text into the editor. We Make PDF automatically calculates page boundaries, paragraph heights, and line wraps to create a seamless multi-page PDF document. Words never get cut off across margins or page breaks.',
  ],
  [
    'Can I customize fonts, text sizes, and line spacing?',
    'Yes! You can choose between Sans-Serif (Helvetica), Serif (Times Roman), and Monospace (Courier). You can adjust font size from 10pt to 16pt, modify line spacing (1.3× to 2.0×), and select text alignment (Left, Center, Right).',
  ],
  [
    'Can I add a document title, author name, and running headers?',
    'Yes. You can add a prominent document title, subtitle, author name, and running header text. The tool also provides automatic page numbering with formats like "Page 1 of 5", "1 / 5", or "— 1 —".',
  ],
  [
    'Is my text or confidential data uploaded to a server?',
    'Never. All typesetting and PDF file encoding take place 100% locally on your computer or phone using client-side JavaScript. Your confidential notes, legal drafts, and essays never touch any cloud servers.',
  ],
  [
    'Does the converter support markdown headings?',
    'Yes! You can use standard markdown headings such as "# Main Heading" and "## Subheading" in your text. The converter will automatically render them with larger bold typography and proportional spacing.',
  ],
  [
    'What page sizes and orientations can I choose?',
    'You can generate PDFs in standard international and US formats including A4 (210 × 297 mm), US Letter (8.5 × 11 in), US Legal (8.5 × 14 in), A5, and A3, in both Portrait and Landscape orientations.',
  ],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/text-to-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Text to PDF', path: '/tools/text-to-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/text-to-pdf',
      'Text to PDF Converter Online',
      pageDescription,
      [
        'Convert plain text, notes, essays, and articles to PDF',
        'Automatic word wrapping and intelligent multi-page pagination',
        'Custom typography: Helvetica, Times-Roman, and Courier fonts',
        'Configurable font size, line spacing, margins, and text alignment',
        'Add document title, subtitle, author, and running header',
        'Automatic page numbering: Page X of Y, simple, and dash formats',
        'Multiple color themes: Standard Clean, Executive Navy, and Warm Sepia',
        '100% private client-side processing with zero cloud uploads',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Convert Text to PDF Online for Free', pageDescription, steps, siteUrl, '/tools/text-to-pdf'),
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
      <section class="tools-layout container text-to-pdf-layout">
        <div class="tools-hero">
          <span class="eyebrow"><FileText :size="13" /> DOCUMENT TYPESETTING &amp; EXPORT</span>
          <h1>Text to PDF Converter Online<br /><span>write text &amp; export clean pdfs.</span></h1>
          <p>Easily write, paste, or upload plain text notes, essays, memos, and articles to generate clean, professionally formatted PDF documents. Customize fonts, line spacing, margins, headers, and page numbers with zero server uploads.</p>
        </div>

        <div class="tools-converter-wrap" id="converter">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Client-Side Vector Engine</div>
          <TextToPdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed 100% locally in browser memory. Zero document uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><Type :size="14" /></span>
              <div>
                <strong>Vector Typography</strong>
                <p>Typesets crisp, scalable text using standard fonts with configurable sizes, alignments, and line spacing.</p>
              </div>
            </li>
            <li>
              <span><Layers :size="14" /></span>
              <div>
                <strong>Intelligent Pagination</strong>
                <p>Automatically segments long texts into multi-page documents without clipping sentences or paragraphs.</p>
              </div>
            </li>
            <li>
              <span><Sliders :size="14" /></span>
              <div>
                <strong>Headers &amp; Page Numbers</strong>
                <p>Add custom running headers, author metadata, and formatted page counters (e.g. "Page 1 of 5").</p>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <strong>100% Device Privacy</strong>
                <p>Your notes and texts are processed entirely inside browser memory. Nothing is ever sent to a remote server.</p>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <Sparkles :size="16" />
            <div>
              <strong>Pro-Tip for Fast Document Formatting:</strong>
              You can prefix any line with <code>#</code> for a bold main heading or <code>##</code> for a subheading. The engine will automatically enlarge and typeset the headings with proportional hierarchy in your generated PDF!
            </div>
          </div>
        </div>
      </section>

      <!-- How to Steps Section -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">QUICK TUTORIAL</span>
          <h2>How to Convert Text to PDF in 3 Simple Steps</h2>
          <p>Format, typeset, and download professional PDF documents in seconds directly in your web browser.</p>
        </div>

        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span>
                <Type v-if="step.number === '01'" :size="22" />
                <Sliders v-else-if="step.number === '02'" :size="22" />
                <FileCheck v-else :size="22" />
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
          <span class="mini-label">WHY USE OUR TEXT TO PDF CONVERTER</span>
          <h2>Turn Raw Notes into Polished, Share-Ready PDF Documents</h2>
          <p>Whether you're creating study notes, preparing executive memos, saving code snippets, or documenting legal statements, our browser-based text-to-PDF tool delivers publishing-quality results without complex word processors.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Type :size="24" /></span>
            <h3>Automated Typesetting &amp; Pagination</h3>
            <p>Our client-side document engine calculates character bounding boxes and word boundaries to ensure text flows naturally across pages.</p>
            <ul>
              <li>Supports multi-page documents up to dozens of pages</li>
              <li>Markdown heading detection (# Heading, ## Subheading)</li>
              <li>Natural paragraph spacing and bullet list formatting</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Palette :size="24" /></span>
            <h3>Curated Document Color Themes</h3>
            <p>Tailor your document's aesthetic to your audience. Choose between classic monochrome, modern executive navy, or bookish warm sepia.</p>
            <ul>
              <li>Executive Navy with stylized accent borders</li>
              <li>Warm Ivory/Book theme for comfortable reading</li>
              <li>Dark Mode / Code theme for technical summaries</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ShieldCheck :size="24" /></span>
            <h3>Zero Cloud Uploads Guaranteed</h3>
            <p>Your confidential drafts, private meeting notes, and internal proposals never touch third-party cloud servers or AI training pipelines.</p>
            <ul>
              <li>100% browser sandbox execution via WebAssembly &amp; pdf-lib</li>
              <li>Instant generation with zero upload or download latency</li>
              <li>Works offline in any modern desktop or smartphone browser</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Who Uses Text to PDF?</h2>
          <p>Essential for students, professionals, developers, and writers.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Students &amp; Academics</h4>
            <p>Convert lecture notes, study outlines, essay drafts, and bibliographies into clean, printable PDFs for coursework submissions.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Business &amp; Project Managers</h4>
            <p>Format meeting minutes, executive summaries, strategy briefs, and daily standup notes into formal PDFs for stakeholder distribution.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Developers &amp; Sysadmins</h4>
            <p>Convert code snippets, README documentation, server configuration files, and terminal logs into archived PDF documentation.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Legal &amp; Administrative Teams</h4>
            <p>Generate timestamped statements, incident logs, client correspondence records, and formatted memos with running headers.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED DOCUMENT UTILITIES</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/create-pdf" class="seo-keyword-pill">Create PDF Templates</NuxtLink>
            <NuxtLink to="/tools/word-to-pdf" class="seo-keyword-pill">Word to PDF</NuxtLink>
            <NuxtLink to="/tools/merge-pdf" class="seo-keyword-pill">Merge PDF</NuxtLink>
            <NuxtLink to="/tools/split-pdf" class="seo-keyword-pill">Split PDF</NuxtLink>
            <NuxtLink to="/tools/compress-pdf" class="seo-keyword-pill">Compress PDF</NuxtLink>
            <NuxtLink to="/tools/protect-pdf" class="seo-keyword-pill">Protect PDF</NuxtLink>
            <NuxtLink to="/tools/add-page-numbers" class="seo-keyword-pill">Add Page Numbers</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">GOT QUESTIONS?</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about converting text to PDF with We Make PDF.</p>
          <div class="faq-decoration" aria-hidden="true">
            <FileText :size="42" />
            <span>TEXT &bull; TO &bull; PDF</span>
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
          <span class="mini-label">NEED TO EDIT OR MERGE YOUR PDF?</span>
          <h2>Organize, protect, or compress your new PDF</h2>
          <p>Explore over 38 free client-side PDF and document tools. Merge documents, add passwords, compress file sizes, and reorder pages without uploading files.</p>
        </div>
        <NuxtLink to="/tools/merge-pdf" class="primary-button">
          Open Merge PDF <ArrowRight :size="18" />
        </NuxtLink>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
.text-to-pdf-layout {
  position: relative;
}
</style>

