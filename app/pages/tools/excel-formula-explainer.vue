<script setup>
import { 
  ArrowRight,
  BookOpen,
  Check, 
  ChevronDown,
  Code2, 
  FileCheck,
  FileSpreadsheet, 
  HelpCircle, 
  Layers, 
  Lightbulb, 
  ShieldCheck, 
  Sliders, 
  Sparkles, 
  Table, 
  Wand2 
} from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/excel-formula-explainer', '/excel-formulas', '/tools/excel-formulas'],
});

const pageTitle = 'Excel Formula Explainer & Generator Online — All Formulas with Examples | We Make PDF';
const pageDescription = 'Free online Excel Formula Explainer, Fixer & Encyclopedia. Enter or paste any Excel formula to get instant plain-English explanations, syntax error corrections, parameter breakdowns, and explore 60+ formulas with spreadsheet examples.';

const steps = [
  {
    number: '01',
    title: 'Type or Paste Any Excel Formula',
    desc: 'Enter any formula into the fx formula bar (e.g., =XLOOKUP, =VLOOKUP, =SUMIFS, or complex nested IF statements).',
  },
  {
    number: '02',
    title: 'Instant Plain-English Breakdown',
    desc: 'Our engine identifies functions, separates parameters, checks for missing parentheses or errors, and suggests optimized formulas.',
  },
  {
    number: '03',
    title: 'Copy Fixed Formula & Learn',
    desc: 'Copy the verified/corrected formula directly to your spreadsheet, or explore our formula dictionary with realistic sample tables.',
  },
];

const faqs = [
  [
    'How does the Excel Formula Explainer inspect and explain custom formulas?',
    'Our client-side parser parses your formula into an abstract syntax tree, identifies every function name, checks parentheses balance, inspects argument positions against standard Excel rules, and translates what each parameter does into simple, plain-English steps.',
  ],
  [
    'Can it detect syntax errors like missing parentheses or wrong commas?',
    'Yes! It detects missing opening or closing parentheses, missing leading "=" signs, unclosed quotation marks, double period range errors (e.g., A1..B10), and even locale differences like semicolons (;) versus commas (,).',
  ],
  [
    'Does it suggest modern formula alternatives like XLOOKUP instead of VLOOKUP?',
    'Absolutely. Whenever you enter classic formulas like VLOOKUP, multiple nested IF statements, or CONCATENATE, our engine provides modern best-practice upgrades like XLOOKUP, IFS, or TEXTJOIN along with locked absolute references ($).',
  ],
  [
    'Are all 60+ Excel formulas explained with real-world table examples?',
    'Yes, every formula in our encyclopedia includes its formal syntax, a clear explanation of what it does, and a realistic spreadsheet table demonstrating exact inputs and expected outputs.',
  ],
  [
    'Is my spreadsheet formula or business data sent to any cloud server?',
    'Never. All parsing, validation, and explanation logic executes 100% locally inside your web browser using client-side JavaScript. Your confidential financial numbers and cell formulas never leave your device.',
  ],
  [
    'Which versions of Excel and Google Sheets are supported?',
    'Our formulas and explanations cover all versions of Microsoft Excel (Excel 365, Excel 2024, 2021, 2019, 2016) as well as Google Sheets, LibreOffice Calc, and Apple Numbers.',
  ],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/excel-formula-explainer',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Excel Formula Explainer', path: '/tools/excel-formula-explainer' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/excel-formula-explainer',
      'Excel Formula Explainer & Formulas Guide Online',
      pageDescription,
      [
        'Instant plain-English explanation for any Excel or Google Sheets formula',
        'Automatic syntax validation and error fixing (parentheses, commas, ranges)',
        'Detailed argument breakdown for functions like XLOOKUP, VLOOKUP, INDEX, MATCH, and SUMIFS',
        'Step-by-step execution simulation explaining how Excel computes your result',
        'Encyclopedia of 60+ Excel formulas with realistic spreadsheet examples',
        'Modern optimization recommendations (e.g., upgrading VLOOKUP to XLOOKUP)',
        '100% private in-browser analysis with zero server uploads',
      ]
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Explain and Fix Excel Formulas Online for Free', pageDescription, steps, siteUrl, '/tools/excel-formula-explainer'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to formula explainer</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <!-- Main Converter Hero Section -->
      <section class="tools-layout container excel-formula-layout">
        <div class="tools-hero">
          <span class="eyebrow"><FileSpreadsheet :size="13" /> SPREADSHEET FORMULAS &amp; AI EXPLAINER</span>
          <h1>Excel Formula Explainer Online<br /><span>explain, validate &amp; learn all formulas.</span></h1>
          <p>Paste any Excel formula to get instant plain-English explanations, automatic error detection, and syntax corrections. Explore our comprehensive formula dictionary with realistic spreadsheet tables and examples.</p>
        </div>

        <div class="tools-converter-wrap" id="converter">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Live Syntax Engine</div>
          <ExcelFormulaExplainer />
          <div class="under-card"><ShieldCheck :size="15" /> Processed 100% locally in browser memory. Zero formula uploads.</div>
        </div>

        <div class="tools-details-below">
          <ul class="tools-points">
            <li>
              <span><Lightbulb :size="14" /></span>
              <div>
                <strong>Plain-English Explanations</strong>
                <p>Translates complex, nested Excel formulas into simple, human-friendly steps anyone can understand.</p>
              </div>
            </li>
            <li>
              <span><Wand2 :size="14" /></span>
              <div>
                <strong>Automatic Error Detection</strong>
                <p>Instantly flags missing parentheses, unclosed quotes, incorrect range syntax, and missing required parameters.</p>
              </div>
            </li>
            <li>
              <span><BookOpen :size="14" /></span>
              <div>
                <strong>60+ Formulas with Examples</strong>
                <p>Complete dictionary covering XLOOKUP, INDEX/MATCH, SUMIFS, logical tests, dates, and dynamic arrays with sample tables.</p>
              </div>
            </li>
            <li>
              <span><ShieldCheck :size="14" /></span>
              <div>
                <strong>100% In-Browser Privacy</strong>
                <p>Formulas and cell references are parsed completely on your device. Nothing is ever sent to an external server.</p>
              </div>
            </li>
          </ul>

          <div class="tools-tip">
            <Sparkles :size="16" />
            <div>
              <strong>Pro-Tip for Formula Dragging:</strong>
              When looking up data across tables, always use absolute references with dollar signs (e.g. <code>$A$2:$D$50</code>). This ensures your lookup range won't drift downward when you drag the formula to other cells!
            </div>
          </div>
        </div>
      </section>

      <!-- How to Steps Section -->
      <section id="how-it-works" class="how-section container">
        <div class="section-intro">
          <span class="mini-label">QUICK TUTORIAL</span>
          <h2>How to Explain &amp; Fix Excel Formulas in 3 Simple Steps</h2>
          <p>Debug tricky formulas, understand nested logic, and learn Excel functions with zero guesswork.</p>
        </div>

        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span>
                <FileSpreadsheet v-if="step.number === '01'" :size="22" />
                <Wand2 v-else-if="step.number === '02'" :size="22" />
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
          <span class="mini-label">WHY USE OUR EXCEL FORMULA TOOL</span>
          <h2>Master Formulas Faster &amp; Eliminate Spreadsheet Errors</h2>
          <p>From finance analysts and accountants to marketers, developers, and students, everyone encounters broken formulas. Our tool deconstructs formulas, identifies bugs, and provides clean solutions.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><FileSpreadsheet :size="24" /></span>
            <h3>Deep Parameter Breakdown</h3>
            <p>Ever wonder what each comma in a formula means? We map every argument to its official definition so you can verify cell references at a glance.</p>
            <ul>
              <li>Highlights required vs optional parameters</li>
              <li>Flags missing arguments in red</li>
              <li>Identifies search modes and boolean criteria</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Wand2 :size="24" /></span>
            <h3>Smart Optimization Suggestions</h3>
            <p>Spreadsheet software evolves quickly. Our engine suggests modern functions that run faster and make workbooks more resilient.</p>
            <ul>
              <li>Upgrades VLOOKUP to XLOOKUP with left-lookup ability</li>
              <li>Replaces messy nested IFs with clean IFS or SWITCH</li>
              <li>Detects missing exact match flags to prevent false matches</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><Table :size="24" /></span>
            <h3>Interactive Spreadsheet Examples</h3>
            <p>Every formula card is paired with a mini spreadsheet showing realistic rows of sales, employees, or inventory data.</p>
            <ul>
              <li>1-click "Test in Explainer" button to see live calculation</li>
              <li>Realistic table headers and column formats</li>
              <li>Covers Microsoft Excel, Google Sheets &amp; Calc</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">POPULAR USE CASES</span>
          <h2>Common Formula Challenges Solved</h2>
          <p>Eliminate hours of manual debugging with instant formula breakdowns.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Financial Modeling &amp; Budgets</h4>
            <p>Deconstruct complex SUMIFS, NPV, IRR, and nested IF models to ensure balance sheets and financial statements are 100% audit-proof.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>HR &amp; Employee Data Management</h4>
            <p>Calculate employee tenure with DATEDIF, match employee IDs with XLOOKUP, and combine department records with TEXTJOIN.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Sales &amp; Marketing Analytics</h4>
            <p>Aggregate monthly campaign ROI, count multi-condition leads with COUNTIFS, and deduplicate customer emails with UNIQUE.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Inventory &amp; Operations Tracking</h4>
            <p>Lookup product SKUs, calculate workdays between shipments using NETWORKDAYS, and filter backorders using dynamic FILTER.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED SPREADSHEET &amp; DATA UTILITIES</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/excel-to-pdf" class="seo-keyword-pill">Excel to PDF</NuxtLink>
            <NuxtLink to="/tools/csv-to-json" class="seo-keyword-pill">CSV to JSON</NuxtLink>
            <NuxtLink to="/tools/json-to-csv" class="seo-keyword-pill">JSON to CSV</NuxtLink>
            <NuxtLink to="/tools/text-to-pdf" class="seo-keyword-pill">Text to PDF</NuxtLink>
            <NuxtLink to="/tools/pdf-to-word" class="seo-keyword-pill">PDF to Word</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">GOT QUESTIONS?</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about understanding and fixing Excel formulas with We Make PDF.</p>
          <div class="faq-decoration" aria-hidden="true">
            <FileSpreadsheet :size="42" />
            <span>EXCEL &bull; FORMULAS</span>
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
          <span class="mini-label">NEED TO CONVERT SPREADSHEETS?</span>
          <h2>Convert Excel &amp; CSV workbooks to PDF</h2>
          <p>Turn your Excel workbooks, sheets, and CSV files into clean, paginated PDF documents with 100% in-browser privacy.</p>
        </div>
        <NuxtLink to="/tools/excel-to-pdf" class="primary-button">
          Open Excel to PDF <ArrowRight :size="18" />
        </NuxtLink>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
.excel-formula-layout {
  position: relative;
}
</style>
