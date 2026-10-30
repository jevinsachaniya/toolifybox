<script setup>
import { ArrowRight, BadgeCheck, CircleAlert, FileCheck2, Scale } from '@lucide/vue';
import { breadcrumbSchema, usePageSeo } from '~/composables/usePageSeo';

const lastUpdated = 'October 16, 2026';
const pageDescription = 'Read the We Make PDF Terms and Conditions covering permitted use, browser-based conversions, user responsibilities, downloads and service limitations.';

usePageSeo({
  title: 'Terms and Conditions | We Make PDF',
  description: pageDescription,
  path: '/terms-and-conditions',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Terms and Conditions', path: '/terms-and-conditions' },
    ]),
    ({ siteUrl, canonical }) => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'We Make PDF Terms and Conditions',
      description: pageDescription,
      url: canonical,
      dateModified: '2026-10-16',
      isPartOf: { '@type': 'WebSite', name: 'We Make PDF', url: siteUrl },
    }),
  ],
});

const sections = [
  { id: 'acceptance', label: 'Acceptance' },
  { id: 'service', label: 'The service' },
  { id: 'permitted-use', label: 'Permitted use' },
  { id: 'your-files', label: 'Your files and rights' },
  { id: 'results', label: 'Conversion results' },
  { id: 'availability', label: 'Availability and changes' },
  { id: 'intellectual-property', label: 'Intellectual property' },
  { id: 'third-parties', label: 'Third-party services' },
  { id: 'disclaimers', label: 'Disclaimers' },
  { id: 'liability', label: 'Liability' },
  { id: 'termination', label: 'Suspension' },
  { id: 'terms-changes', label: 'Changes and contact' },
];
</script>

<template>
  <div class="site-shell info-shell">
    <a class="skip-link" href="#terms-content">Skip to terms and conditions</a>
    <SiteHeader />
    <main id="main" class="info-main legal-main">
      <div class="info-ambient" aria-hidden="true"><span /><span /></div>
      <section class="legal-hero container">
        <nav class="info-breadcrumb" aria-label="Breadcrumb"><NuxtLink to="/">Home</NuxtLink><span>/</span><span aria-current="page">Terms and Conditions</span></nav>
        <span class="eyebrow"><Scale :size="13" /> WE MAKE PDF TERMS</span>
        <h1>Clear terms for<br /><span>using We Make PDF.</span></h1>
        <p>These terms explain the rules for using the website and its browser-based Word, PDF and image tools.</p>
        <div class="legal-meta"><span>Last updated</span><time datetime="2026-10-16">{{ lastUpdated }}</time></div>
      </section>

      <div class="legal-layout container">
        <aside class="legal-toc" aria-label="Terms and conditions contents">
          <span>On this page</span>
          <nav><a v-for="section in sections" :key="section.id" :href="`#${section.id}`">{{ section.label }}</a></nav>
        </aside>

        <article id="terms-content" class="legal-content">
          <section class="legal-summary" aria-labelledby="terms-overview"><span><FileCheck2 :size="22" /></span><div><h2 id="terms-overview">Before you use the tools</h2><p>Use We Make PDF only with files you are authorized to process. Review every downloaded result before relying on it or sharing it.</p></div></section>

          <section id="acceptance">
            <span class="legal-section-number">01</span><h2>Acceptance of these terms</h2>
            <p>By accessing or using We Make PDF, you agree to these Terms and Conditions and the <NuxtLink to="/privacy-policy">Privacy Policy</NuxtLink>. If you do not agree, do not use the website or its tools.</p>
            <p>You must be legally able to enter into these terms where you live. If you use We Make PDF for an organization, you represent that you have authority to accept these terms for that organization.</p>
          </section>

          <section id="service">
            <span class="legal-section-number">02</span><h2>The We Make PDF service</h2>
            <p>We Make PDF provides free browser-based utilities for supported Word, PDF and image tasks. Converter processing generally occurs locally on your device after application resources load. The website does not promise that every file, format, browser or document feature will be supported.</p>
            <p>No account is currently required for the available converters. File-size, page-count, format and browser limits shown in each tool form part of the service.</p>
          </section>

          <section id="permitted-use">
            <span class="legal-section-number">03</span><h2>Permitted and prohibited use</h2>
            <p>You may use We Make PDF for lawful personal or business file tasks. You agree that you will not:</p>
            <ul><li>process files when you do not have permission or a lawful right to use them;</li><li>use the website to violate copyright, privacy, confidentiality or other rights;</li><li>attempt to disrupt, overload, bypass security controls or introduce malicious code;</li><li>automatically scrape, copy or access the service in a way that harms availability;</li><li>misrepresent generated output as verified, certified or officially issued by We Make PDF; or</li><li>use the service for an unlawful, fraudulent or abusive purpose.</li></ul>
          </section>

          <section id="your-files">
            <span class="legal-section-number">04</span><h2>Your files and your rights</h2>
            <p>You keep ownership of your files and conversion results. Selecting a file does not transfer ownership to We Make PDF. You are responsible for ensuring that you have all permissions needed to process, convert, merge, reproduce and download the material.</p>
            <p>Because supported conversions run locally, We Make PDF cannot retrieve, restore or inspect a converter file for you. Keep your own backup before processing an important document.</p>
          </section>

          <section id="results">
            <span class="legal-section-number">05</span><h2>Conversion results and accuracy</h2>
            <p>File conversion can change fonts, spacing, pagination, colors, forms, annotations, metadata, accessibility information or other document features. OCR can misread text. Complex or damaged files may fail.</p>
            <p>You are responsible for reviewing the complete downloaded file before publishing, signing, printing, submitting or relying on it. We Make PDF is not a substitute for professional document review, archival software or legally certified conversion.</p>
          </section>

          <section id="availability">
            <span class="legal-section-number">06</span><h2>Availability, limits and changes</h2>
            <p>The website is provided without a guaranteed uptime or response time. Tools, limits, features and supported formats may be added, changed, interrupted or removed. Browser updates, device memory, local security settings and third-party hosting can affect performance.</p>
            <p>We Make PDF may limit use when reasonably necessary to protect the website, users or service availability.</p>
          </section>

          <section id="intellectual-property">
            <span class="legal-section-number">07</span><h2>Website intellectual property</h2>
            <p>The We Make PDF name, logo, interface, original text, graphics and website code are protected by applicable intellectual-property laws. These terms allow you to use the website for its intended purpose but do not transfer ownership of the website or brand.</p>
            <p>Third-party open-source libraries remain subject to their respective licenses.</p>
          </section>

          <section id="third-parties">
            <span class="legal-section-number">08</span><h2>Third-party services and links</h2>
            <p>We Make PDF relies on services such as Netlify for website hosting and contact-form processing. Third-party services have their own terms and privacy practices. External links are provided for convenience and do not imply control or endorsement of the linked service.</p>
            <p>Netlify’s website policies are available through its official <a href="https://www.netlify.com/legal/terms-of-use/" target="_blank" rel="noopener noreferrer">Terms of Use</a> and <a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener noreferrer">Privacy Statement</a>.</p>
          </section>

          <section id="disclaimers">
            <span class="legal-section-number">09</span><h2>Disclaimers</h2>
            <p>To the extent permitted by law, We Make PDF is provided “as is” and “as available,” without warranties of uninterrupted availability, compatibility, accuracy, fitness for a particular purpose or preservation of every file feature.</p>
            <p>Nothing in these terms excludes a warranty or consumer right that cannot lawfully be excluded.</p>
          </section>

          <section id="liability">
            <span class="legal-section-number">10</span><h2>Limitation of liability</h2>
            <p>To the extent permitted by law, We Make PDF will not be responsible for indirect, incidental, special or consequential loss arising from use of or inability to use the website, including lost files, lost profits, lost opportunities or corrupted data.</p>
            <p>You remain responsible for backups, checking results and deciding whether a generated file is suitable for its intended use. Liability that cannot legally be limited remains unaffected.</p>
          </section>

          <section id="termination">
            <span class="legal-section-number">11</span><h2>Suspension or termination of access</h2>
            <p>Access may be blocked or restricted when use appears unlawful, abusive, harmful to the service, or inconsistent with these terms. Provisions that by their nature should continue—including ownership, disclaimers and liability limits—survive the end of access.</p>
          </section>

          <section id="terms-changes">
            <span class="legal-section-number">12</span><h2>Changes, severability and contact</h2>
            <p>These terms may be updated when the website, tools or legal requirements change. Continued use after an updated version is published means you accept the revised terms. If one provision is unenforceable, the remaining provisions continue to apply to the extent permitted by law.</p>
            <p>Questions about these terms can be submitted through the contact page.</p>
            <NuxtLink class="legal-contact-link" to="/contact"><BadgeCheck :size="16" /> Contact We Make PDF <ArrowRight :size="15" /></NuxtLink>
          </section>

          <div class="legal-notice"><CircleAlert :size="18" /><p>These terms govern use of the We Make PDF website. They do not replace any mandatory rights available under the laws that apply to you.</p></div>
        </article>
      </div>
    </main>
    <SiteFooter message="Simple file tools with clear terms of use." />
  </div>
</template>
