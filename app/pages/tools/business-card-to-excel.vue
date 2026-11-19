<script setup>
import { onMounted } from 'vue';
import { ArrowRight, ExternalLink, ShieldCheck, Sparkles } from '@lucide/vue';
import { breadcrumbSchema, usePageSeo } from '~/composables/usePageSeo';

definePageMeta({
  alias: ['/business-card-to-excel', '/business-card-scanner', '/tools/business-card-scanner'],
});

const pageTitle = 'Business Card Scanner — AI Contact Scanner & Vault | Scan Karo by We Make PDF';
const pageDescription = 'We Make PDF Business Card Scanner has moved to Scan Karo — our dedicated AI business card scanner app. Live camera scanning, 1-click WhatsApp, vCard & Excel exports.';
const targetUrl = 'https://scan.wemakepdf.com?ref=wemakepdf';

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  path: '/tools/business-card-to-excel',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Business Card Scanner', path: '/tools/business-card-to-excel' },
    ]),
  ],
});

useHead({
  meta: [
    { 'http-equiv': 'refresh', content: `1; url=${targetUrl}` },
  ],
});

onMounted(() => {
  // Smoothly redirect user to the dedicated scanner web app
  setTimeout(() => {
    window.location.replace(targetUrl);
  }, 400);
});
</script>

<template>
  <div class="site-shell tools-shell">
    <SiteHeader />

    <main class="tools-main">
      <div class="tools-ambient" aria-hidden="true"><span /><span /></div>

      <section class="tools-layout container" style="max-width: 760px; margin: 2rem auto; text-align: center;">
        <div class="tools-hero" style="margin-bottom: 2rem;">
          <span class="eyebrow"><Sparkles :size="13" /> DEDICATED SCANNER APP</span>
          <h1>Redirecting to Scan Karo<br /><span>by We Make PDF.</span></h1>
          <p>
            Our Business Card Scanner has moved to <strong>Scan Karo</strong> — our dedicated AI scanner web app with live camera card scanning, 1-click WhatsApp, contacts vault, and instant Excel / vCard (.vcf) exports.
          </p>
        </div>

        <div class="converter-card" style="padding: 3rem 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; border-radius: 1.5rem; background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(37, 99, 235, 0.1); color: #2563eb; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 32px; height: 32px; animation: spin 1s linear infinite;" fill="none" viewBox="0 0 24 24">
              <circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          </div>

          <div>
            <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Opening Scan Karo App...</h2>
            <p style="color: var(--muted, #64748b); font-size: 0.95rem; max-width: 440px; margin: 0 auto;">
              Taking you to <code>scan.wemakepdf.com</code> in a moment. If it doesn't open automatically, click the button below:
            </p>
          </div>

          <a :href="targetUrl" class="primary-button" style="display: inline-flex; align-items: center; gap: 0.6rem; padding: 0.85rem 1.8rem; border-radius: 0.75rem; text-decoration: none; font-weight: 700;">
            Continue to Scan Karo <ArrowRight :size="16" />
          </a>

          <div class="under-card" style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--muted, #64748b); display: flex; align-items: center; gap: 0.4rem;">
            <ShieldCheck :size="15" /> 100% Private Client-Side AI &amp; Local Contact Vault.
          </div>
        </div>
      </section>
    </main>

    <SiteFooter message="Free, private browser tools for everyday document and card work." />
  </div>
</template>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
