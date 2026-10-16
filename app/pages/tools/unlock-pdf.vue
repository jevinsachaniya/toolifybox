<script setup>
import { Check, KeyRound, LockKeyhole, LockOpen, ShieldCheck, Sparkles, WandSparkles, Zap } from '@lucide/vue';
import { breadcrumbSchema, toolSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/unlock-pdf', '/decrypt-pdf'],
});

const pageDescription = 'Unlock password protected PDF files online for free. Remove password restrictions and decrypt your PDF documents privately in your browser with zero server uploads.';
usePageSeo({
  title: 'Unlock PDF — Free Password Removal & Decryption | Toolifybox',
  description: pageDescription,
  path: '/tools/unlock-pdf',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Unlock PDF', path: '/tools/unlock-pdf' },
    ]),
    ({ siteUrl }) => toolSchema(
      siteUrl,
      '/tools/unlock-pdf',
      'Unlock PDF Password Remover',
      pageDescription,
      ['Instant password removal', 'AES-256 and RC4 decryption', 'Automatic encryption detection', 'Zero server uploads', '100% private in-browser decryption']
    ),
  ],
});

const steps = [
  { number: '01', title: 'Choose Protected PDF', desc: 'Select your password-protected PDF document up to 20 MB. Our tool instantly detects whether it has active encryption.' },
  { number: '02', title: 'Enter Password', desc: 'Type the document password once to authorize security removal. Your password stays strictly on your device.' },
  { number: '03', title: 'Download Unlocked PDF', desc: 'Decrypted and saved as a fresh, unencrypted PDF that opens anywhere without asking for passwords.' },
];
</script>

<template>
  <div class="site-shell tools-shell">
    <a class="skip-link" href="#converter">Skip to converter</a>
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>
      <section class="tools-layout container unlock-pdf-layout">
        <div class="tools-copy">
          <span class="eyebrow"><Sparkles :size="13" /> PDF DECRYPTION &amp; REMOVAL</span>
          <h1>Unlock PDF &amp;<br /><span>remove passwords.</span></h1>
          <p>Remove passwords and security restrictions from your PDF files directly in your web browser. Generate a clean, unlocked PDF that opens immediately in any reader without entering credentials each time.</p>
          <ul class="tools-points">
            <li>
              <span><Check :size="14" /></span>
              <div>
                <b>Permanent Password Removal</b>
                <small>Removes the open password so you or your colleagues can open and print without prompts.</small>
              </div>
            </li>
            <li>
              <span><WandSparkles :size="14" /></span>
              <div>
                <b>Automatic Encryption Detection</b>
                <small>Instantly inspects the PDF structure and alerts you if the file is already unlocked.</small>
              </div>
            </li>
            <li>
              <span><Zap :size="14" /></span>
              <div>
                <b>100% Private in Browser</b>
                <small>Your password and document content are never sent over the internet or logged on any server.</small>
              </div>
            </li>
            <li>
              <span><LockKeyhole :size="14" /></span>
              <div>
                <b>Standard AES &amp; RC4 Decryption</b>
                <small>Seamlessly handles modern AES-256 encrypted documents as well as legacy RC4 secured files.</small>
              </div>
            </li>
          </ul>
          <div class="tools-tip">
            <KeyRound :size="18" />
            <p>
              <b>Authorized Unlocking Only</b><br />
              You must know the password to remove encryption. This tool allows legitimate owners to remove restrictions without sending confidential files to third parties.
            </p>
          </div>
        </div>

        <div class="tools-converter-wrap">
          <div class="converter-backdrop" aria-hidden="true" />
          <div class="floating-chip" aria-hidden="true"><span /> Unlock PDF Ready</div>
          <UnlockPdfConverter />
          <div class="under-card"><ShieldCheck :size="15" /> Decrypted locally on your device. No document uploads.</div>
        </div>
      </section>

      <section class="how-section container">
        <div class="section-intro">
          <span class="mini-label">HOW IT WORKS</span>
          <h2>Remove PDF passwords in three simple steps</h2>
          <p>Authorize once, and your document is permanently unlocked for easy viewing and sharing.</p>
        </div>
        <div class="how-grid">
          <article v-for="step in steps" :key="step.number" class="how-card">
            <div class="how-card-top">
              <span><LockOpen :size="22" /></span>
              <b>{{ step.number }}</b>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
            <span class="card-line" aria-hidden="true" />
          </article>
        </div>
      </section>
    </main>

    <SiteFooter message="Private PDF decryption, right in your browser." />
  </div>
</template>

