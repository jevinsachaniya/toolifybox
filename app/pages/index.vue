<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Combine, Download, FileImage, FileSpreadsheet, FileText, ImageDown, Images, LockKeyhole, Minimize2, Presentation, ScanText, Scissors, ShieldCheck, Sparkles, Upload } from '@lucide/vue';
import { usePageSeo } from '~/composables/usePageSeo';

const shell = ref(null);
let observer;
let mounted = false;

const pageDescription = 'Convert Word, Excel, PowerPoint, PDF and image files online for free with Toolifybox. Private browser tools to convert, merge, split and compress documents without uploads.';
usePageSeo({
  title: 'Free Word, PDF & Image Tools Online | Toolifybox',
  description: pageDescription,
  path: '/',
  schemas: [({ siteUrl }) => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: 'Toolifybox',
        alternateName: 'Toolify Box',
        url: siteUrl,
        description: pageDescription,
        publisher: { '@id': `${siteUrl}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'Toolifybox',
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/brand/toolifybox-logo.svg`,
        },
      },
    ],
  })],
});

const questions = [
  ['Which files can I convert?', 'Choose a .docx for Word to PDF, a .pptx for PowerPoint to PDF, a .xlsx or .csv for Excel to PDF, a .pdf for PDF to Word, PDF to JPG, PDF to Images, Merge PDF, Split PDF or Compress PDF, or JPG, PNG and WebP images for Images to PDF and Compress Image. File tools support inputs up to 20 MB. Older .doc/.ppt/.xls files and password-protected PDFs are not supported.'],
  ['Will my colors and formatting stay the same?', 'PDF to Word defaults to editable text and uses OCR for scanned Hindi and English documents. Fonts, spacing, and scan backgrounds may change. Word to PDF supports basic text, tables and images. Always check the result before sharing.'],
  ['What happens to my document?', 'Conversion happens in your browser. Your document is never uploaded to a server or conversion service. Close the page or choose another document to clear the current selection.'],
  ['Do I need an account?', 'No account, subscription, or sign-up is needed. Open the Tools page, choose a conversion direction, select a document, and download the result.'],
];
const steps = [
  { icon: Upload, number: '01', title: 'Choose a tool.', text: 'Open the Tools page and choose one of the available document converters.' },
  { icon: FileText, number: '02', title: 'Drop it in.', text: 'Choose a document up to 20 MB, or drag it into the upload box.' },
  { icon: Download, number: '03', title: 'Send it on its way.', text: 'Convert, download, give the result a quick check, and carry on.' },
];

function setupReveals() {
  if (!mounted || !shell.value) return;
  observer?.disconnect();
  const elements = [...shell.value.querySelectorAll('[data-reveal]')];
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    elements.forEach(element => element.classList.remove('reveal-pending'));
    return;
  }
  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        entry.target.classList.add('has-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  elements.forEach(element => {
    if (element.classList.contains('has-revealed')) return;
    if (element.getBoundingClientRect().top >= window.innerHeight) {
      element.classList.add('reveal-pending');
      observer.observe(element);
    } else element.classList.add('has-revealed');
  });
}

onMounted(() => {
  mounted = true;
  setupReveals();
});
onBeforeUnmount(() => {
  mounted = false;
  observer?.disconnect();
});
</script>

<template>
  <div ref="shell" class="site-shell">
    <a class="skip-link" href="#main">Skip to content</a>
    <SiteHeader />
    <main id="main">
      <section class="hero-stage">
        <div class="ambient-art" aria-hidden="true"><span class="ambient-orb orb-violet" /><span class="ambient-orb orb-blue" /><span class="ambient-grid" /></div>
        <div class="hero container">
          <div class="hero-copy">
            <div class="eyebrow"><Sparkles :size="13" /> ONE DOCUMENT. A FRESH START.</div>
            <h1>Word &amp; PDF.<br />Ready for<br /><span class="pdf-title">what’s next.</span></h1>
            <p class="hero-description">Your next proposal. Your next opportunity.<br />From Word to PDF. From PDF to Word.<br />Keep your documents moving.</p>
            <div class="hero-actions"><NuxtLink to="/tools" class="primary-button">Explore tools <ArrowUpRight :size="18" /></NuxtLink><a href="#how-it-works" class="quiet-link">See how it works <ArrowRight :size="15" /></a></div>
            <div class="hero-benefits"><span><Check :size="15" /> No sign-up</span><span><Check :size="15" /> Free to use</span><span><Check :size="15" /> Private by design</span></div>
          </div>
          <div class="tool-showcase" aria-label="Available document tools">
            <div class="showcase-glow" aria-hidden="true" />
            <div class="showcase-label"><span>POPULAR TOOLS</span><NuxtLink to="/tools" class="showcase-all-link">All 11 tools <ArrowRight :size="12" /></NuxtLink></div>
            <NuxtLink to="/tools/word-to-pdf" class="showcase-tool word-tool"><span class="showcase-icon"><ToolRealisticIcon name="word" alt="Word to PDF" size="36" /></span><span><b>Word to PDF</b><small>Create a polished PDF from DOCX</small></span><ArrowUpRight :size="19" /></NuxtLink>
            <NuxtLink to="/tools/powerpoint-to-pdf" class="showcase-tool powerpoint-tool"><span class="showcase-icon"><ToolRealisticIcon name="powerpoint" alt="PowerPoint to PDF" size="36" /></span><span><b>PowerPoint to PDF</b><small>Convert PPTX slides to clean PDF</small></span><ArrowUpRight :size="19" /></NuxtLink>
            <NuxtLink to="/tools/excel-to-pdf" class="showcase-tool excel-tool"><span class="showcase-icon"><ToolRealisticIcon name="excel" alt="Excel to PDF" size="36" /></span><span><b>Excel to PDF</b><small>Convert spreadsheets &amp; CSV to PDF</small></span><ArrowUpRight :size="19" /></NuxtLink>
            <NuxtLink to="/tools" class="showcase-more-btn"><span>Explore all 11 document &amp; image tools</span><ArrowRight :size="15" /></NuxtLink>
            <div class="showcase-privacy"><ShieldCheck :size="15" /><span><b>Stays on your device</b><small>No document uploads</small></span></div>
          </div>
        </div>
        <div class="hero-bottom container"><span>A small tool for your next big thing.</span><NuxtLink to="/tools">VIEW ALL TOOLS <ArrowRight :size="13" /></NuxtLink></div>
      </section>

      <section id="how-it-works" class="how-section container">
        <div class="section-intro" data-reveal><span class="mini-label">A LITTLE LESS BUSYWORK</span><h2>From your desk to their inbox.</h2><p>Three easy steps. Then it’s business as usual.</p></div>
        <div class="how-grid">
          <article v-for="(step, index) in steps" :key="step.number" class="how-card" data-reveal :style="{ '--reveal-delay': `${index * 90}ms` }">
            <div class="how-card-top"><span><component :is="step.icon" :size="22" /></span><b>{{ step.number }}</b></div>
            <h3>{{ step.title }}</h3><p>{{ step.text }}</p><span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>

      <section class="privacy-strip container" data-reveal>
        <span class="privacy-icon"><ShieldCheck :size="23" /></span>
        <div><h2>Your documents have places to be.</h2><p>Conversion runs on your device. Your document never leaves your browser.</p></div>
        <span class="privacy-label"><LockKeyhole :size="13" /> No document uploads</span>
      </section>

      <section id="questions" class="faq-section container">
        <div class="faq-intro" data-reveal>
          <span class="mini-label">BEFORE YOU HIT CONVERT</span><h2>Good questions.<br />Straight answers.</h2><p>A few things worth knowing about your document.</p>
          <div class="faq-decoration" aria-hidden="true"><FileText :size="42" /><span>W <ArrowRight :size="18" /> PDF</span></div>
        </div>
        <div class="faq-list" data-reveal>
          <details v-for="[question, answer] in questions" :key="question"><summary>{{ question }}<ChevronDown :size="18" /></summary><div class="faq-answer"><p>{{ answer }}</p></div></details>
        </div>
      </section>

      <section class="closing-cta container" data-reveal>
        <div><span class="mini-label">ONE LESS THING ON YOUR LIST</span><h2>Ready when you are.</h2><p>Your document tools are waiting on one focused page.</p></div>
        <NuxtLink to="/tools" class="primary-button">Open tools <ArrowUpRight :size="18" /></NuxtLink><div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>
    <SiteFooter message="One simple tool. One less task." />
  </div>
</template>
