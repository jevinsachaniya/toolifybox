<script setup>
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileCode,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  Hash,
  Layers,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Type,
  Upload,
  Zap,
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/bulk-file-renamer', '/batch-rename', '/tools/batch-rename'],
});

const pageTitle = 'Bulk File Renamer Online — Batch Rename Files Free [100% Private] | We Make PDF';
const pageDescription = 'Rename multiple files, photos, PDFs & documents online for free. Sequential numbering, find & replace, prefix/suffix, letter case changes, 1-click ZIP or script export. 100% private in-browser!';

const steps = [
  {
    number: '01',
    title: 'Select or Drag Files',
    desc: 'Choose up to 500 files of any format (photos, PDFs, docs, music, videos) or try our sample files.',
  },
  {
    number: '02',
    title: 'Configure Renaming Rules',
    desc: 'Add prefixes, sequential numbering (01, 02), find & replace text, change casing (lowercase/UPPERCASE), or insert dates.',
  },
  {
    number: '03',
    title: 'Preview & Download',
    desc: 'Inspect real-time live side-by-side filename comparison, download all files in a single ZIP, or grab a 1-click batch script.',
  },
];

const faqs = [
  [
    'Are my confidential files uploaded to any server or cloud?',
    'Never. We Make PDF processes all file metadata, renaming rules, script generation, and ZIP compression 100% locally in your web browser memory. Your personal photos, client PDFs, and confidential documents never leave your computer or phone.',
  ],
  [
    'Can I rename very large files (like gigabytes of 4K videos or RAW photos) without waiting for uploads?',
    'Yes! Use our "Windows Batch (.bat)" or "PowerShell (.ps1)" or "Bash (.sh)" download option. Instead of re-uploading and downloading gigabytes of files, the tool generates an instantaneous 1-click script that renames the original files directly in your folder on your PC in under 1 second.',
  ],
  [
    'How does sequential numbering work?',
    'You can configure custom starting numbers, step increments, and zero padding (e.g., 01, 001, 0001). You can append numbers to the end, prepend them to the start, or replace the entire filename with formatted numbers like (01) or [01].',
  ],
  [
    'What happens if two files end up with the same name?',
    'Our smart duplicate collision resolver automatically detects name collisions and appends unique numbering suffixes (like _1, _2) so no file is accidentally overwritten.',
  ],
  [
    'Can I change file extensions in bulk?',
    'Yes! You can force all extensions to lowercase (e.g. converting .JPEG and .JPG to clean lowercase .jpg), uppercase, or change extensions to a custom format.',
  ],
  [
    'Which file formats are supported?',
    'Any file format is supported! Images (JPG, PNG, WebP, GIF, SVG, RAW), documents (PDF, DOCX, XLSX, PPTX, TXT), code files, audio (MP3, WAV), video (MP4, MKV), and archives.',
  ],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/bulk-file-renamer',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Bulk File Renamer', path: '/tools/bulk-file-renamer' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/bulk-file-renamer',
      'Bulk File Renamer Online',
      pageDescription,
      [
        'Batch rename up to 500 files simultaneously',
        'Add prefix, suffix, and date timestamps',
        'Find and replace text with RegEx support',
        'Sequential numbering with custom padding and brackets',
        'Change case: lowercase, UPPERCASE, Title Case, camelCase, kebab-case',
        'Generate 1-click Windows Batch (.bat), PowerShell (.ps1), and Bash scripts',
        '100% private in-browser processing with zero server uploads',
      ]
    ),
    ({ siteUrl }) => howToSchema(
      'How to Rename Multiple Files Online in Bulk for Free',
      pageDescription,
      steps,
      siteUrl,
      '/tools/bulk-file-renamer',
    ),
    () => faqSchema(faqs),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to bulk file renamer</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <!-- Main Layout: Hero + Converter Card + Quick Points -->
      <section class="tools-layout container">
        <div class="tools-hero">
          <span class="eyebrow"><Sparkles :size="13" /> IN-BROWSER BATCH FILE PROCESSOR</span>
          <h1>Batch rename multiple files online<br /><span>with powerful rules &amp; instant preview.</span></h1>
          <p>Organize chaotic photo folders, downloaded documents, and project assets. Add prefixes, numbering, find &amp; replace, and export as ZIP or 1-click local rename script.</p>
        </div>

        <div class="tools-converter-wrap" id="converter">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Ready to Rename</div>
          <ClientOnly>
            <BulkFileRenamerConverter />
          </ClientOnly>
          <div class="under-card"><ShieldCheck :size="15" /> 100% private client-side renamer. Zero file data leaves your device.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li><span><Hash :size="14" /></span><div><b>Sequential Numbering</b><small>Add 01, 001, or custom brackets with customizable start and step.</small></div></li>
            <li><span><Search :size="14" /></span><div><b>Find &amp; Replace</b><small>Clean underscores, remove spaces, or replace text with RegEx support.</small></div></li>
            <li><span><Terminal :size="14" /></span><div><b>1-Click Local Scripts</b><small>Generate .bat or .ps1 scripts to rename gigabytes of files on your PC in 0.1s.</small></div></li>
            <li><span><LockKeyhole :size="14" /></span><div><b>100% Device-Level Privacy</b><small>Renamed and compressed inside your browser memory with zero uploads.</small></div></li>
          </ul>

          <div class="tools-tip"><Check :size="18" /><p><b>Tip: Renaming huge files on your PC?</b><br />If you have dozens of large 4K video files or high-res camera RAW photos, click "Windows Batch (.bat)" or "PowerShell (.ps1)" after configuring your rules. Move the script into your folder and double-click to rename all files locally on your PC in under a second!</p></div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="how-section container" id="how-it-works">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Rename hundreds of files in three easy steps</h2>
          <p>Fast, clean, and private batch renaming without installing third-party utilities or software.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><FileText :size="22" /></span>
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
          <span class="mini-label">FLEXIBLE BATCH RENAMING SYSTEM</span>
          <h2>Bring Order to Messy File Names and Camera Downloads</h2>
          <p>Digital cameras, scanner apps, and cloud downloads often produce unreadable filenames like <code>IMG_3910.JPG</code> or <code>scan_20261102_001.pdf</code>. We Make PDF gives you total control over your digital asset naming conventions.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Hash :size="24" /></span>
            <h3>Custom Sequential Numbering</h3>
            <p>Number your documents in sequence with granular control. Choose whether numbers appear as prefixes, suffixes, or replace original filenames completely.</p>
            <ul>
              <li>Configurable zero-padding: <code>01</code>, <code>001</code>, <code>0001</code></li>
              <li>Multiple formats: plain, parentheses <code>(01)</code>, brackets <code>[01]</code>, dashes <code>-01-</code></li>
              <li>Custom starting numbers and increments</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Search :size="24" /></span>
            <h3>Intelligent Find &amp; Replace</h3>
            <p>Search for specific terms, dates, tags, or unwanted characters across hundreds of files and replace them with clean labels or remove them entirely.</p>
            <ul>
              <li>Supports both case-sensitive and case-insensitive matching</li>
              <li>Powerful Regular Expression (RegEx) pattern support</li>
              <li>Clean unwanted punctuation, double spaces, and brackets</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Terminal :size="24" /></span>
            <h3>Local Batch Scripts (.bat, .ps1, .sh)</h3>
            <p>Dealing with massive files or folders on your computer? Save bandwidth and time by exporting lightweight rename scripts for Windows, macOS, or Linux.</p>
            <ul>
              <li>Windows Batch (.bat) file with UTF-8 support</li>
              <li>PowerShell (.ps1) script with error checking</li>
              <li>macOS / Linux shell script (.sh)</li>
            </ul>
          </article>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="faq-section container" id="questions">
        <div class="section-intro">
          <span class="mini-label">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Common Questions About Bulk File Renamer</h2>
          <p>Everything you need to know about batch renaming files online for free.</p>
        </div>
        <div class="faq-list">
          <details v-for="[question, answer] in faqs" :key="question" class="faq-item">
            <summary class="faq-question">
              <span>{{ question }}</span>
              <ChevronDown :size="18" class="faq-chevron" />
            </summary>
            <div class="faq-answer">
              <p>{{ answer }}</p>
            </div>
          </details>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
