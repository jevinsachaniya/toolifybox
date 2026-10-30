<script setup>
import { ArrowRight, Database, FileLock2, HardDrive, Mail, ShieldCheck } from '@lucide/vue';
import { breadcrumbSchema, usePageSeo } from '~/composables/usePageSeo';

const lastUpdated = 'October 16, 2026';
const pageDescription = 'Read the We Make PDF Privacy Policy to understand how browser-based file processing, local preferences, contact forms and hosting data are handled.';

usePageSeo({
  title: 'Privacy Policy | We Make PDF',
  description: pageDescription,
  path: '/privacy-policy',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Privacy Policy', path: '/privacy-policy' },
    ]),
    ({ siteUrl, canonical }) => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'We Make PDF Privacy Policy',
      description: pageDescription,
      url: canonical,
      dateModified: '2026-10-16',
      isPartOf: { '@type': 'WebSite', name: 'We Make PDF', url: siteUrl },
    }),
  ],
});

const sections = [
  { id: 'files', label: 'Files and conversions' },
  { id: 'information', label: 'Information collected' },
  { id: 'storage', label: 'Browser storage' },
  { id: 'contact-data', label: 'Contact form data' },
  { id: 'providers', label: 'Service providers' },
  { id: 'retention', label: 'Retention and security' },
  { id: 'rights', label: 'Your choices and rights' },
  { id: 'children', label: 'Children’s privacy' },
  { id: 'changes', label: 'Policy changes' },
  { id: 'privacy-contact', label: 'Contact' },
];
</script>

<template>
  <div class="site-shell info-shell">
    <a class="skip-link" href="#privacy-content">Skip to privacy policy</a>
    <SiteHeader />
    <main id="main" class="info-main legal-main">
      <div class="info-ambient" aria-hidden="true"><span /><span /></div>
      <section class="legal-hero container">
        <nav class="info-breadcrumb" aria-label="Breadcrumb"><NuxtLink to="/">Home</NuxtLink><span>/</span><span aria-current="page">Privacy Policy</span></nav>
        <span class="eyebrow"><ShieldCheck :size="13" /> PRIVACY AT WE MAKE PDF</span>
        <h1>Your files stay yours.<br /><span>Here is how data is handled.</span></h1>
        <p>This policy explains what We Make PDF processes when you use the website, its browser-based file tools and the contact form.</p>
        <div class="legal-meta"><span>Last updated</span><time datetime="2026-10-16">{{ lastUpdated }}</time></div>
      </section>

      <div class="legal-layout container">
        <aside class="legal-toc" aria-label="Privacy policy contents">
          <span>On this page</span>
          <nav><a v-for="section in sections" :key="section.id" :href="`#${section.id}`">{{ section.label }}</a></nav>
        </aside>

        <article id="privacy-content" class="legal-content">
          <section class="legal-summary" aria-labelledby="privacy-overview"><span><FileLock2 :size="22" /></span><div><h2 id="privacy-overview">Privacy overview</h2><p>Supported Word, PDF and image conversions run in your browser. We Make PDF does not send the files selected in a converter to a We Make PDF conversion server.</p></div></section>

          <section id="files">
            <span class="legal-section-number">01</span><h2>Files and conversions</h2>
            <p>When you select a supported document or image, the website reads it in browser memory to create previews and conversion results. Processing is performed by code running on your device.</p>
            <ul><li>Selected files are not uploaded to We Make PDF for conversion.</li><li>Temporary previews and download links may use in-memory browser object URLs.</li><li>These temporary resources are released when you remove a file, replace it, leave the tool or close the page.</li><li>Downloaded results remain on your device according to your browser and operating-system settings.</li></ul>
            <p>Do not submit document contents through the contact form. We Make PDF support does not need your original document to receive a bug report.</p>
          </section>

          <section id="information">
            <span class="legal-section-number">02</span><h2>Information collected when you visit</h2>
            <p>We Make PDF does not currently use its own advertising trackers or analytics cookies. The hosting provider may receive ordinary technical request information needed to deliver and secure the website, such as an IP address, browser type, requested URL, timestamp and diagnostic or security data.</p>
            <p>This technical information may be processed for service delivery, reliability, abuse prevention and security. We Make PDF does not use converter file contents for advertising or profiling.</p>
          </section>

          <section id="storage">
            <span class="legal-section-number">03</span><h2>Browser storage and preferences</h2>
            <p>The website stores your light or dark theme choice in your browser’s local storage under the key <code>wemakepdf-theme</code> (or <code>toolifybox-theme</code>). This preference remains on your device so the selected theme can be restored on your next visit.</p>
            <p>You can remove it at any time by clearing site data in your browser. Blocking local storage may reset the theme to its default but does not prevent the converters from working in supported browsers.</p>
          </section>

          <section id="contact-data">
            <span class="legal-section-number">04</span><h2>Contact form data</h2>
            <p>If you submit the contact form, it collects the name, email address, topic and message you provide. This information is used to review and respond to support requests, bug reports, feedback and feature suggestions.</p>
            <p>The contact form is processed through Netlify Forms and is separate from file conversion. Do not include passwords, confidential document text, financial information, health information or other sensitive personal data in your message.</p>
          </section>

          <section id="providers">
            <span class="legal-section-number">05</span><h2>Hosting and service providers</h2>
            <p>We Make PDF is hosted on Netlify. Netlify provides website delivery, security infrastructure and form processing and may process technical or submitted form data on We Make PDF’s behalf or under its own policies.</p>
            <p>Review the official <a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener noreferrer">Netlify Privacy Statement</a> for details about Netlify’s practices. We Make PDF may change providers when necessary to operate the website and will update this policy when that materially changes how personal information is handled.</p>
          </section>

          <section id="retention">
            <span class="legal-section-number">06</span><h2>Retention and security</h2>
            <p>Converter files are not retained by We Make PDF because they are processed locally in your browser. Contact messages and related correspondence may be retained for as long as reasonably needed to respond, maintain support records, prevent abuse and meet legal obligations.</p>
            <p>Reasonable technical and organizational measures are used to protect information. No internet transmission, browser environment or storage system can be guaranteed completely secure.</p>
          </section>

          <section id="rights">
            <span class="legal-section-number">07</span><h2>Your choices and privacy rights</h2>
            <p>Depending on where you live, you may have rights to request access, correction, deletion, restriction or a copy of personal information associated with a contact submission. You may also have the right to object or complain to a local data-protection authority.</p>
            <p>Use the <NuxtLink to="/contact">contact page</NuxtLink> to make a privacy request. Include the email address used in the original message so the request can be located and verified. We Make PDF may ask for reasonable verification before acting on a request.</p>
          </section>

          <section id="children">
            <span class="legal-section-number">08</span><h2>Children’s privacy</h2>
            <p>We Make PDF is a general-purpose file utility and is not directed to children under 13. The website does not knowingly collect personal information from children under 13 through its contact form. A parent or guardian who believes a child submitted personal information can use the contact page to request its deletion.</p>
          </section>

          <section id="changes">
            <span class="legal-section-number">09</span><h2>Changes to this policy</h2>
            <p>This policy may be updated when the tools, hosting, forms or legal requirements change. The revised date at the top of this page identifies the latest published version. Material changes will be presented on the website when appropriate.</p>
          </section>

          <section id="privacy-contact">
            <span class="legal-section-number">10</span><h2>Contact We Make PDF</h2>
            <p>For a privacy question or request, choose “Other” on the contact form and describe what you need. Do not attach or paste the contents of a private document.</p>
            <NuxtLink class="legal-contact-link" to="/contact"><Mail :size="16" /> Contact We Make PDF <ArrowRight :size="15" /></NuxtLink>
          </section>
        </article>
      </div>
    </main>
    <SiteFooter message="Private browser tools with clear data practices." />
  </div>
</template>
