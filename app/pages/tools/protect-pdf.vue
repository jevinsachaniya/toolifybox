<script setup>
import { Check, KeyRound, Lock, LockKeyhole, ShieldCheck, Sparkles, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/protect-pdf', '/encrypt-pdf'],
});

const pageDescription = 'Protect PDF with password online for free. Encrypt your confidential PDF documents using bank-grade AES-256 or RC4 encryption directly in your browser without uploading files.';
usePageSeo({
  title: 'Protect PDF with Password — Free Client-Side Encryption | Toolifybox',
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
  ],
});

const steps = [
  { number: '01', title: 'Choose a PDF', desc: 'Select any standard PDF document up to 20 MB from your device or drop it into the upload box.' },
  { number: '02', title: 'Set Your Password', desc: 'Type your secure password with optional confirmation. Choose between modern AES-256 or legacy RC4 encryption.' },
  { number: '03', title: 'Download Protected PDF', desc: 'Your document is encrypted locally in your browser memory. Save the protected PDF with password restrictions applied.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container protect-pdf-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> PDF SECURITY &amp; PRIVACY</span>
          <h1>Protect PDF<br /><span>with password.</span></h1>
          <p>Add strong password protection and military-grade AES-256 encryption to your sensitive PDF files directly in your web browser. Confidential contracts, statements, and tax forms never leave your device.</p>
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
                <small>Protection runs 100% on your device using the browser Web Crypto engine.</small>
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
              Make sure you record your password. Toolifybox does not track or store passwords, and lost passwords cannot be recovered.
            </p>
          </div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Protect PDF Ready</div>
          <ProtectPdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Encrypted locally on your device. No document uploads.</div>
        </div>
      </section>

      <section class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Password protect your PDF in three easy steps</h2>
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
    </main>

    <SiteFooter message="Private PDF encryption, right in your browser." />
  </div>
</template>

