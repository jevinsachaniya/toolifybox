<script setup>
import { ArrowRight, Check, ChevronDown, FileCheck, FileMinus, FileText, Layers, ShieldCheck, Sparkles, Trash2, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/remove-pages', '/remove-pdf-pages', '/delete-pdf-pages', '/tools/remove-pages'],
});

const pageTitle = 'Remove PDF Pages Online — Free & Instant PDF Page Deleter | Toolifybox';
const pageDescription = 'Remove pages from PDF online for free. Delete unwanted pages, preview every page visually, select custom ranges, and download a clean PDF privately in your browser without uploading files.';

const steps = [
  { number: '01', title: 'Choose a PDF Document', desc: 'Select any PDF document with 2 or more pages from your device or drop it into the upload box.' },
  { number: '02', title: 'Pick Pages to Delete', desc: 'Click any page thumbnail or enter page numbers (e.g. 2, 4-6) to mark unwanted pages for removal.' },
  { number: '03', title: 'Download Clean PDF', desc: 'Your new PDF is rebuilt instantly in your browser memory with unwanted pages stripped away.' },
];

const faqs = [
  ['Does deleting PDF pages affect the quality of the remaining pages?', 'No. Toolifybox extracts and preserves the original PDF object tree for all retained pages. Your fonts, vector illustrations, images, annotations, and bookmarks remain at their exact original bit-for-bit quality.'],
  ['Can I remove multiple non-consecutive pages at once?', 'Yes! You can click any individual page card in the visual gallery or type custom syntax in the range input (such as "1, 3-5, 8, 12") to select multiple individual pages and ranges simultaneously.'],
  ['Are my confidential files uploaded to any third-party server?', 'Never. Toolifybox reconstructs your PDF entirely client-side using JavaScript in your web browser. Your confidential contracts, financial statements, and personal records never leave your local device.'],
  ['What is the maximum file size or page count supported?', 'Toolifybox supports PDF files up to 20 MB with dozens of pages, constrained only by your device memory. Because processing happens locally, there are no queue wait times or server bandwidth limits.'],
  ['Can I undo page deletions before downloading?', 'Yes. The interactive preview highlights deleted pages with a distinct red badge. Clicking the thumbnail again instantly restores the page back into the document before you finalize your download.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/remove-pdf-pages',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Remove PDF Pages', path: '/tools/remove-pdf-pages' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/remove-pdf-pages',
      'Remove Pages from PDF',
      pageDescription,
      ['Visual page preview grid', 'Click-to-delete page cards', 'Page range and comma input support', 'Zero server uploads', '100% private in-browser editing']
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Remove Pages from PDF Online for Free', pageDescription, steps, siteUrl, '/tools/remove-pdf-pages'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container remove-pdf-pages-layout">
    <div class="tools-hero">
      <span class="eyebrow"><Sparkles :size="13" /> PDF PAGE MANAGEMENT</span>
          <h1>Remove pages<br /><span>from your PDF.</span></h1>
          <p>Delete blank pages, covers, duplicate sheets, or confidential sections from your PDF documents in seconds. Review visual page previews, click pages to mark them for removal, and download a streamlined file without uploading to any server.</p>
    </div>

    <div class="tools-converter-wrap">
      <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Remove Pages Ready</div>
          <RemovePdfPagesConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Processed locally on your device. Zero server uploads.</div>
    </div>

    <div class="tools-details-below">
      <ul class="tools-points">
            <li>
              <span><Check :size="14" /></span>
              <div>
                <b>Visual Page Previews</b>
                <small>Inspect thumbnail previews of every page in your document before deciding what to delete.</small>
              </div>
            </li>
            <li>
              <span><Trash2 :size="14" /></span>
              <div>
                <b>Click-to-Delete Simplicity</b>
                <small>Click any page to mark it for deletion, or type custom page ranges like 2, 4–6, 9.</small>
              </div>
            </li>
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <b>100% Client-Side Privacy</b>
                <small>PDF pages are parsed and removed directly inside your browser. No files leave your computer or phone.</small>
              </div>
            </li>
            <li>
              <span><Layers :size="14" /></span>
              <div>
                <b>Lossless Rebuilding</b>
                <small>Retains original fonts, vector sharpness, embedded links, and resolution on all kept pages.</small>
              </div>
            </li>
          </ul>
      
      <div class="tools-tip">
            <FileMinus :size="18" />
            <p>
              <b>Pro Tip</b><br />
              Use the range box to quickly remove large blocks of pages, or use "Quick select" to clean up even or odd sheets from scanned booklets.
            </p>
          </div>
    </div>
  </section>

      <section class="how-section container" id="how-it-works">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Delete unwanted PDF pages in three easy steps</h2>
          <p>Streamline and trim your documents with simple, fast visual controls.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><Trash2 :size="22" /></span>
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
          <span class="mini-label">DOCUMENT TRIMMING</span>
          <h2>Why Pruning Unnecessary Pages Streamlines PDF Workflows</h2>
          <p>Large documents filled with blank pages, disclaimers, or unneeded annexures waste ink, inflate file sizes, and slow down document review for clients and colleagues.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><FileCheck :size="24" /></span>
            <h3>Interactive Thumbnail Visualizer</h3>
            <p>Never guess which page number corresponds to what content. Our high-fidelity browser canvas renders crisp visual cards for every page so you can spot empty sheets, scanner cover letters, or misprints instantly.</p>
            <ul>
              <li>High-resolution rendered page previews</li>
              <li>Toggle pages on or off with a single click</li>
              <li>Visual counters showing remaining vs deleted pages</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Layers :size="24" /></span>
            <h3>Advanced Page Range Selector</h3>
            <p>Need to strip out chapters 4 through 7? Type standard shorthand syntax like "1-3, 8-15" to quickly retain specific sections and discard everything else in one keystroke.</p>
            <ul>
              <li>Supports hyphens for ranges and commas for lists</li>
              <li>Instant visual highlight updates on thumbnail cards</li>
              <li>Syntax validation protects against invalid entries</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ShieldCheck :size="24" /></span>
            <h3>Private &amp; Confidential Processing</h3>
            <p>Legal teams, healthcare professionals, and accountants often need to expunge confidential pages before forwarding files. Toolifybox removes pages locally without sending sensitive records to third-party servers.</p>
            <ul>
              <li>100% in-browser memory execution</li>
              <li>No document persistence or server logs</li>
              <li>Preserves original vector sharpness and bookmarks</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">USE CASES</span>
          <h2>When to Delete PDF Pages</h2>
          <p>Optimize your PDFs for sharing, compliance, and archiving.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Eliminating Blank Scanner Sheets</h4>
            <p>Office sheet-fed scanners regularly output blank trailing pages or reverse sides. Remove them instantly before sharing.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Redacting Confidential Addendums</h4>
            <p>Strip internal pricing sheets, private client notes, or privileged legal disclosures prior to sending contracts externally.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Extracting Relevant Chapters</h4>
            <p>Delete introductory chapters, appendices, or unrelated assignments from textbook packages or conference proceedings.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Optimizing for Portal Upload Limits</h4>
            <p>Government, visa, and university submission portals strictly cap document sizes. Deleting superfluous pages helps you meet size caps easily.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED PDF TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/split-pdf" class="seo-keyword-pill">Split PDF</NuxtLink>
            <NuxtLink to="/tools/rotate-pdf" class="seo-keyword-pill">Rotate PDF</NuxtLink>
            <NuxtLink to="/tools/compress-pdf" class="seo-keyword-pill">Compress PDF</NuxtLink>
            <NuxtLink to="/tools/merge-pdf" class="seo-keyword-pill">Merge PDF</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About Removing PDF Pages</h2>
          <p>Find answers to common questions about deleting pages from PDF files securely in your browser.</p>
          <div class="faq-decoration" aria-hidden="true">
            <Trash2 :size="42" />
            <span>PDF &bull; DELETE</span>
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
          <span class="mini-label">NEED TO REDUCE FILE SIZE FURTHER?</span>
          <h2>Compress your cleaned-up PDF document</h2>
          <p>Shrink image resolution and optimize object streams to hit strict email and portal file size limits.</p>
        </div>
        <NuxtLink to="/tools/compress-pdf" class="primary-button">
          Open Compress PDF <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private PDF editing and page removal, right in your browser." />
  </div>
</template>

