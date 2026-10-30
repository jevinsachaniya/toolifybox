<script setup>
import { ArrowRight, Check, ChevronDown, FilePlus, FileText, LayoutGrid, ListTodo, LockKeyhole, Palette, ShieldCheck, Sparkles, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/create-pdf', '/tools/create'],
});

const pageTitle = 'Create PDF Online Free — Blank, Lined, Grid & Text Documents | We Make PDF';
const pageDescription = 'Create PDF documents online for free. Generate blank pages, lined notebook sheets, engineering graph paper, to-do checklists, or typeset text documents with instant on-device privacy.';

const steps = [
  { number: '01', title: 'Choose Mode or Template', desc: 'Select Paper Templates (blank, lined, graph, dot, checklist, Cornell) or open the Text Composer to write custom notes.' },
  { number: '02', title: 'Customize Layout & Styling', desc: 'Choose page size (A4, Letter, Legal), orientation, margins, running headers, and page numbering with live real-time preview.' },
  { number: '03', title: 'Download Vector PDF', desc: 'Click Create & Download PDF to generate a crisp, razor-sharp vector document directly in browser memory.' },
];

const faqs = [
  ['Can I create lined or graph paper and print it?', 'Yes! We Make PDF creates 100% vector-based PDF templates including College Ruled, Wide Ruled, 5mm Graph Paper, and Dot Grid sheets that print razor-sharp at 1200+ DPI on any standard printer.'],
  ['Can I write or paste long articles and notes into the PDF creator?', 'Absolutely. Switch to the Document & Text Composer tab to type or paste notes, articles, or essays. The tool automatically typesets and paginates your content across multiple pages with custom typography and line spacing.'],
  ['Are my notes or documents sent to a remote server?', 'Never. We Make PDF creates all PDFs entirely inside your browser memory using client-side JavaScript. Your notes, drafts, and created sheets remain strictly confidential on your local device.'],
  ['What page sizes are supported?', 'You can create PDFs in standard international and US formats including A4 (210 × 297 mm), US Letter (8.5 × 11 in), US Legal (8.5 × 14 in), A3 (large sheets), and A5 (compact booklet/notebook). Both Portrait and Landscape orientations are supported.'],
  ['Can I add page numbers and running headers?', 'Yes. You can toggle page numbering at the bottom (centered or right-aligned) with formats like "Page 1 of 5", "1", or "— 1 —", as well as specify an optional running header for topics or dates.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/create-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Create PDF', path: '/tools/create-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/create-pdf',
      'Create PDF Online',
      pageDescription,
      ['Create blank PDF documents and printable templates', 'Generate lined notebook, graph grid, dot matrix, and Cornell notes', 'Typeset custom text documents with auto-pagination and typography controls', 'Custom page sizes: A4, Letter, Legal, A3, and A5', 'Configurable margins, running headers, and page numbering', 'Interactive real-time sheet preview', '100% private in-browser generation with zero server uploads']
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Create PDF Documents Online for Free', pageDescription, steps, siteUrl, '/tools/create-pdf'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container create-pdf-layout">
        <div class="tools-hero">
          <span class="eyebrow"><Sparkles :size="13" /> DOCUMENT GENERATOR</span>
          <h1>Create PDF<br /><span>documents &amp; templates.</span></h1>
          <p>Generate clean, professional PDF files directly in your browser. Design printable lined notebook sheets, precision coordinate graph paper, dot-grid bullet journals, to-do task planners, or format and typeset custom text documents with complete privacy.</p>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Create PDF Ready</div>
          <CreatePdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Created locally on your device. Zero document uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><Check :size="14" /></span>
              <div>
                <b>Printable Sheet Templates</b>
                <small>Create blank, college-ruled, wide-ruled, 5mm grid, dot matrix, to-do checklist, Cornell notes, or music staves in seconds.</small>
              </div>
            </li>
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <b>Text &amp; Notes Composer</b>
                <small>Type or paste text with custom typography, font sizing, headings, author metadata, and seamless multi-page pagination.</small>
              </div>
            </li>
            <li>
              <span><Palette :size="14" /></span>
              <div>
                <b>Flexible Page Layouts &amp; Themes</b>
                <small>Choose A4, Letter, Legal, A3, or A5 sizing in portrait or landscape with customizable margins and stylish color themes.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <b>100% Local &amp; Private</b>
                <small>PDF creation runs entirely on your device using WebAssembly and vector rendering. Zero cloud uploads.</small>
              </div>
            </li>
          </ul>
          <div class="tools-tip">
            <FilePlus :size="18" />
            <p>
              <b>Printing Tip</b><br />
              All templates are generated as pure mathematical vectors, guaranteeing laser-sharp line quality and perfect print clarity on any standard printer.
            </p>
          </div>
        </div>
      </section>

      <!-- How it Works Section -->
      <section class="how-section container" id="how-it-works">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Create your PDF in three easy steps</h2>
          <p>Start from a blank canvas, printable template, or text notes in seconds.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><FilePlus :size="22" /></span>
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
          <span class="mini-label">VERSATILE DOCUMENT CREATION</span>
          <h2>Why Create PDFs Directly in Your Browser?</h2>
          <p>Instead of installing bloated desktop office software or subscribing to expensive PDF editors, We Make PDF gives you instant, lightweight document generation tools with zero sign-up requirements.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LayoutGrid :size="24" /></span>
            <h3>Printable Paper Templates</h3>
            <p>Need physical writing paper for school, college lectures, math homework, or bullet journaling? Generate custom stationery with exact millimeter-precision line and dot grids.</p>
            <ul>
              <li>College Ruled &amp; Wide Ruled sheets with red margin lines</li>
              <li>5mm coordinate graph paper for geometry and graphing</li>
              <li>Dot grid paper for rapid sketching and bullet journaling</li>
              <li>Cornell note-taking layouts for structured study sessions</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><FileText :size="24" /></span>
            <h3>Instant Text &amp; Memo Typesetting</h3>
            <p>Paste notes, letters, memos, or project requirements into the composer. Our layout engine handles line wrapping, font sizing, and multi-page pagination automatically.</p>
            <ul>
              <li>Document titles, subtitles, and author metadata formatting</li>
              <li>Standard typography fonts: Helvetica, Times New Roman, Courier</li>
              <li>Automatic page splitting when text exceeds page height</li>
              <li>Clean running headers and standardized page numbering</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>Complete Data Confidentiality</h3>
            <p>Unlike cloud document services that store your writings on third-party servers, We Make PDF creates PDF bytes directly within your local browser memory.</p>
            <ul>
              <li>Zero telemetry, zero server persistence, zero cloud tracking</li>
              <li>Instant generation speeds without network latency</li>
              <li>Safe for confidential business notes and personal journals</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>Popular Ways to Use Create PDF</h2>
          <p>Explore practical applications for students, professionals, and creatives.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Daily Planners &amp; Task Trackers</h4>
            <p>Generate clean to-do checklists with checkboxes and priority markings to organize your daily sprint or study schedule.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Academic &amp; Lecture Notes</h4>
            <p>Print Cornell study sheets or lined notebook pages tailored to your course binder before attending classes.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Technical Drafting &amp; Math Homework</h4>
            <p>Print exact 5mm graph grid paper for plotting graphs, geometry exercises, or engineering schematics.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Music Composition Staves</h4>
            <p>Quickly generate 5-line musical manuscript paper for transcribing sheet music, melodies, and guitar tab ideas.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE COMPLEMENTARY PDF UTILITIES</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/merge-pdf" class="seo-keyword-pill">Merge PDF Files</NuxtLink>
            <NuxtLink to="/tools/watermark-pdf" class="seo-keyword-pill">Watermark PDF</NuxtLink>
            <NuxtLink to="/tools/protect-pdf" class="seo-keyword-pill">Protect PDF with Password</NuxtLink>
            <NuxtLink to="/tools/compress-pdf" class="seo-keyword-pill">Compress PDF</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About Creating PDFs</h2>
          <p>Everything you need to know about generating documents, printing templates, and in-browser privacy.</p>
          <div class="faq-decoration" aria-hidden="true">
            <FilePlus :size="42" />
            <span>CREATE &bull; PDF</span>
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
          <span class="mini-label">MERGE OR EDIT YOUR NEW PDF</span>
          <h2>Combine your newly created PDF with other documents</h2>
          <p>Merge your newly created notes or templates with other existing PDF files in one organized document.</p>
        </div>
        <NuxtLink to="/tools/merge-pdf" class="primary-button">
          Open Merge PDF <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Free, private browser tools for everyday file work." />
  </div>
</template>

