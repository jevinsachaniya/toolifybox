<script setup>
import { computed } from 'vue';
import { ArrowRight, ArrowUpRight, Bug, CheckCircle2, HelpCircle, Lightbulb, LockKeyhole, Mail, MessageSquareText, ShieldCheck } from '@lucide/vue';
import { breadcrumbSchema, usePageSeo } from '~/composables/usePageSeo';

const route = useRoute();
const submitted = computed(() => route.query.submitted === 'true');
const pageDescription = 'Contact Toolifybox for converter support, bug reports, feedback and feature ideas. Send a message through the secure website contact form.';

usePageSeo({
  title: 'Contact Toolifybox — Support & Feedback',
  description: pageDescription,
  path: '/contact',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Contact', path: '/contact' },
    ]),
    ({ siteUrl, canonical }) => ({
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Toolifybox',
      description: pageDescription,
      url: canonical,
      isPartOf: { '@type': 'WebSite', name: 'Toolifybox', url: siteUrl },
      about: { '@type': 'Organization', name: 'Toolifybox', url: siteUrl },
    }),
  ],
});
</script>

<template>
  <div class="site-shell info-shell">
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header tools-header">
      <div class="container header-inner">
        <BrandLogo />
        <nav aria-label="Main navigation">
          <NuxtLink to="/">Home</NuxtLink>
          <NuxtLink to="/tools">Tools</NuxtLink>
          <NuxtLink to="/about">About</NuxtLink>
          <NuxtLink to="/contact" aria-current="page">Contact</NuxtLink>
        </nav>
        <ThemeToggle />
        <NuxtLink class="header-action" to="/tools">Open tools <ArrowUpRight :size="16" /></NuxtLink>
      </div>
    </header>

    <main id="main" class="info-main contact-main">
      <div class="info-ambient" aria-hidden="true"><span /><span /></div>
      <section class="contact-hero container">
        <nav class="info-breadcrumb" aria-label="Breadcrumb"><NuxtLink to="/">Home</NuxtLink><span>/</span><span aria-current="page">Contact</span></nav>
        <div class="contact-heading"><span class="eyebrow"><MessageSquareText :size="13" /> CONTACT TOOLIFYBOX</span><h1>Tell us how we<br /><span>can help.</span></h1><p>Send a converter question, bug report, feedback or a feature idea. Useful details help identify the issue faster.</p></div>
      </section>

      <section class="contact-layout container" aria-label="Contact form and guidance">
        <div class="contact-form-card">
          <div v-if="submitted" class="form-success" role="status"><CheckCircle2 :size="22" /><div><b>Message submitted.</b><p>Thank you for contacting Toolifybox.</p></div></div>
          <div class="contact-card-heading"><span><Mail :size="20" /></span><div><h2>Send a message</h2><p>All fields are required.</p></div></div>
          <form name="contact" method="POST" action="/contact?submitted=true" data-netlify="true" netlify-honeypot="bot-field">
            <input type="hidden" name="form-name" value="contact" />
            <p class="visually-hidden"><label>Do not fill this field: <input name="bot-field" /></label></p>
            <div class="form-row">
              <label><span>Name</span><input name="name" type="text" autocomplete="name" placeholder="Your name" required maxlength="80" /></label>
              <label><span>Email</span><input name="email" type="email" autocomplete="email" placeholder="you@example.com" required maxlength="160" /></label>
            </div>
            <label><span>Topic</span><select name="topic" required><option value="" disabled selected>Select a topic</option><option>Converter support</option><option>Bug report</option><option>Feature idea</option><option>General feedback</option><option>Other</option></select></label>
            <label><span>Message</span><textarea name="message" rows="7" placeholder="Describe what you were doing, the tool you used, your browser, and any error message you saw." required minlength="10" maxlength="3000" /></label>
            <div class="contact-form-footer"><p><LockKeyhole :size="14" /> Do not include passwords, confidential document text or sensitive personal information.</p><button class="primary-button" type="submit">Send message <ArrowRight :size="17" /></button></div>
          </form>
        </div>

        <aside class="contact-aside" aria-label="Contact guidance">
          <div class="contact-guide-card"><span class="contact-guide-icon"><Bug :size="20" /></span><h2>Reporting a problem?</h2><p>Include the tool name, file type, browser, device and the exact error message. You do not need to send the document itself.</p></div>
          <div class="contact-guide-card"><span class="contact-guide-icon"><Lightbulb :size="20" /></span><h2>Suggesting a tool?</h2><p>Explain the file you start with, the result you need and the options that would make the workflow useful.</p></div>
          <div class="contact-guide-card contact-privacy-card"><span class="contact-guide-icon"><ShieldCheck :size="20" /></span><h2>About form privacy</h2><p>This contact form is processed by Netlify Forms for the site owner. It is separate from Toolifybox converters, which process supported files locally in your browser.</p><NuxtLink to="/about">Read about Toolifybox <ArrowRight :size="14" /></NuxtLink></div>
          <div class="contact-quick-link"><HelpCircle :size="18" /><p>Need help choosing a converter?</p><NuxtLink to="/tools">View all tools</NuxtLink></div>
        </aside>
      </section>
    </main>
    <SiteFooter message="Questions, feedback and better file workflows." />
  </div>
</template>
