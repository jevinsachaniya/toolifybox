<script setup>
import { ArrowRight, Check, ChevronDown, Cpu, KeyRound, Layers, Lock, LockKeyhole, ShieldCheck, Sparkles, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, faqSchema, howToSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/protect-pdf', '/encrypt-pdf'],
});

const pageTitle = 'Protect PDF with Password — Free Client-Side Encryption | We Make PDF';
const pageDescription = 'Protect PDF with password online for free. Encrypt your confidential PDF documents using bank-grade AES-256 or RC4 encryption directly in your browser without uploading files.';

const steps = [
  { number: '01', title: 'Choose a PDF Document', desc: 'Select any standard PDF document up to 20 MB from your device or drop it into the upload box.' },
  { number: '02', title: 'Set Your Secure Password', desc: 'Type your password with real-time strength feedback. Choose modern AES-256 or legacy RC4 encryption.' },
  { number: '03', title: 'Download Encrypted PDF', desc: 'Your document is encrypted locally in your browser memory. Save your password-locked PDF instantly.' },
];

const faqs = [
  ['What is the difference between AES-256 and RC4 encryption?', 'AES-256 is the modern cryptographic standard approved by banks and governments for top-secret documents. It provides virtually unbreakable security. RC4 128-bit is an older legacy standard supported by very old PDF viewers (Acrobat 5.0 and earlier). We recommend AES-256 for all modern devices.'],
  ['Does We Make PDF store or know my password?', 'Never. We Make PDF operates 100% inside your web browser. Neither your document nor your entered password is ever transmitted to or logged on any server. Because we do not store passwords, lost passwords cannot be retrieved.'],
  ['Will a password-protected PDF open on smartphones and tablets?', 'Yes. PDFs encrypted with standard AES-256 will prompt for a password when opened in Apple Books, Adobe Acrobat Reader on iOS/Android, Google Drive, or any modern web browser.'],
  ['How can I remove the password later?', 'You can unlock and decrypt your protected PDF document anytime using our companion "Unlock PDF" tool by entering your password.'],
];

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/protect-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Protect PDF', path: '/tools/protect-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/protect-pdf',
      'Protect PDF with Password',
      pageDescription,
      ['Bank-grade AES-256 encryption', 'Legacy RC4 128-bit support', 'Password strength verification', 'Zero server uploads', '100% private in-browser security']
    ),
    () => faqSchema(faqs),
    ({ siteUrl }) => howToSchema('How to Password Protect a PDF File Online', pageDescription, steps, siteUrl, '/tools/protect-pdf'),
  ],
});
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container protect-pdf-layout">
    <div class="tools-hero">
      <span class="eyebrow"><Sparkles :size="13" /> PDF SECURITY &amp; PRIVACY</span>
          <h1>Protect PDF<br /><span>with password.</span></h1>
          <p>Add strong password protection and military-grade AES-256 encryption to your sensitive PDF files directly in your web browser. Confidential contracts, statements, and tax forms never leave your device.</p>
    </div>

    <div class="tools-converter-wrap">
      <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Protect PDF Ready</div>
          <ProtectPdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Encrypted locally on your device. Zero document uploads.</div>
    </div>

    <div class="tools-details-below">
      <ul class="tools-points">
            <li>
              <span><Check :size="14" /></span>
              <div>
                <b>Bank-Grade AES-256</b>
                <small>Standard 256-bit AES encryption compliant with modern PDF readers and mobile viewers.</small>
              </div>
            </li>
            <li>
              <span><WandSparkles :size="14" /></span>
              <div>
                <b>Password Strength Indicator</b>
                <small>Real-time visual feedback guides you to create strong, secure passwords.</small>
              </div>
            </li>
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <b>Zero Server Uploads</b>
                <small>Protection runs 100% on your device using browser Web Crypto APIs.</small>
              </div>
            </li>
            <li>
              <span><LockKeyhole :size="14" /></span>
              <div>
                <b>Universal Reader Support</b>
                <small>Protected files prompt for a password in Adobe Acrobat, Chrome, Apple Preview, and mobile apps.</small>
              </div>
            </li>
          </ul>
      
      <div class="tools-tip">
            <Lock :size="18" />
            <p>
              <b>Important Privacy Notice</b><br />
              Make sure you record your password. We Make PDF does not track or store passwords, and lost passwords cannot be recovered.
            </p>
          </div>
    </div>
  </section>

      <section class="how-section container" id="how-it-works">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Password Protect Your PDF in Three Easy Steps</h2>
          <p>Instant client-side encryption ensures absolute privacy for every confidential document.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><Lock :size="22" /></span>
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
          <span class="mini-label">CRYPTOGRAPHIC SECURITY</span>
          <h2>Why In-Browser PDF Encryption Is the Safest Choice</h2>
          <p>Sending sensitive tax documents, salary slips, or legal agreements to cloud servers creates massive privacy vulnerabilities. We Make PDF encrypts your PDF directly on your processor.</p>
        </div>

        <div class="seo-features-grid">
          <article class="seo-feature-card">
            <span class="seo-feature-icon"><LockKeyhole :size="24" /></span>
            <h3>Standard AES-256 Encryption</h3>
            <p>We use the standardized Advanced Encryption Standard with 256-bit key length. This algorithm scrambles the internal PDF streams into ciphertext that cannot be cracked without your exact secret passphrase.</p>
            <ul>
              <li>Military-grade cryptographic cipher</li>
              <li>Protects text, embedded attachments, and images</li>
              <li>Fully compatible with all ISO 32000 PDF readers</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><KeyRound :size="24" /></span>
            <h3>True Zero-Knowledge Security</h3>
            <p>Because the encryption key is derived directly on your computer, no human, system administrator, or external hacker can intercept your password or examine your files.</p>
            <ul>
              <li>Zero server transmission or database logging</li>
              <li>Memory wiped as soon as your browser tab closes</li>
              <li>Safe for corporate intellectual property and HIPAA compliance</li>
            </ul>
          </article>

          <article class="seo-feature-card">
            <span class="seo-feature-icon"><ShieldCheck :size="24" /></span>
            <h3>Universal Reader Compatibility</h3>
            <p>Your protected document requires no specialized third-party viewers. It prompts for a password in Adobe Acrobat, Apple Preview, Google Chrome, Mozilla Firefox, and mobile PDF apps.</p>
            <ul>
              <li>Native password prompt on Windows, Mac, iOS, Android</li>
              <li>No extra software installation needed for recipients</li>
              <li>Locks print, copy, and edit permissions securely</li>
            </ul>
          </article>
        </div>

        <!-- Real-World Applications -->
        <div class="section-intro" style="margin-top: 56px;">
          <span class="mini-label">PROTECTION SCENARIOS</span>
          <h2>When Should You Password Protect a PDF?</h2>
          <p>Keep sensitive records safe from prying eyes and unauthorized distribution.</p>
        </div>

        <div class="seo-usecases-grid">
          <div class="seo-usecase-item">
            <h4>Financial &amp; Tax Filings</h4>
            <p>Lock bank statements, W-2/1099 tax forms, and salary payslips before sending them via email or uploading to cloud storage.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Legal NDAs &amp; Commercial Contracts</h4>
            <p>Protect non-disclosure agreements, merger briefs, and client proposals with a unique password shared only with key stakeholders.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Medical Records &amp; Patient Data</h4>
            <p>Comply with strict healthcare privacy standards by encrypting lab test results and medical histories before digital sharing.</p>
          </div>
          <div class="seo-usecase-item">
            <h4>Personal Identification Documents</h4>
            <p>Safeguard copies of your passport, driver license, or social security card when applying for loans or renting apartments.</p>
          </div>
        </div>

        <!-- Related Tool Pills -->
        <div style="margin-top: 40px; text-align: center;">
          <span class="mini-label" style="display: block; margin-bottom: 12px;">EXPLORE RELATED PDF TOOLS</span>
          <div class="seo-tags-wrap" style="justify-content: center;">
            <NuxtLink to="/tools/unlock-pdf" class="seo-keyword-pill">Unlock Protected PDF</NuxtLink>
            <NuxtLink to="/tools/watermark-pdf" class="seo-keyword-pill">Watermark PDF Pages</NuxtLink>
            <NuxtLink to="/tools/flatten-pdf" class="seo-keyword-pill">Flatten PDF Forms</NuxtLink>
            <NuxtLink to="/tools/compress-pdf" class="seo-keyword-pill">Compress Protected PDF</NuxtLink>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section container">
        <div class="faq-intro">
          <span class="mini-label">QUESTIONS &amp; ANSWERS</span>
          <h2>Frequently Asked Questions About PDF Password Protection</h2>
          <p>Learn how to select strong passwords and secure your files with modern AES encryption.</p>
          <div class="faq-decoration" aria-hidden="true">
            <Lock :size="42" />
            <span>AES &bull; 256</span>
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
          <span class="mini-label">NEED TO REMOVE A PASSWORD?</span>
          <h2>Unlock a password-protected PDF document</h2>
          <p>Easily remove password restrictions when you have the authorized credentials.</p>
        </div>
        <NuxtLink to="/tools/unlock-pdf" class="primary-button">
          Open Unlock PDF <ArrowRight :size="18" />
        </NuxtLink>
        <div class="closing-orbit" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter message="Private PDF encryption, right in your browser." />
  </div>
</template>

