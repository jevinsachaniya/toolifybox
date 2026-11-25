<script setup>
import { ArrowRight, Camera, FileLock2, Lock, Mail, ShieldCheck, Smartphone } from '@lucide/vue';
import { breadcrumbSchema, usePageSeo } from '~/composables/usePageSeo';

const lastUpdated = 'November 21, 2026';
const pageDescription = 'Privacy Policy for We Make PDF website and Scanify Mobile Application (Android). Learn how on-device file processing, camera permissions, and local vault security protect your privacy.';

usePageSeo({
  title: 'Privacy Policy | We Make PDF & Scanify Mobile App',
  description: pageDescription,
  path: '/privacy',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Privacy Policy', path: '/privacy' },
    ]),
    ({ siteUrl, canonical }) => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'We Make PDF & Scanify Privacy Policy',
      description: pageDescription,
      url: canonical,
      dateModified: '2026-11-21',
      isPartOf: { '@type': 'WebSite', name: 'We Make PDF', url: siteUrl },
    }),
  ],
});

const sections = [
  { id: 'overview', label: '1. Overview & Scope' },
  { id: 'web-tools', label: '2. We Make PDF (Web Tools)' },
  { id: 'scanify-mobile', label: '3. Scanify Mobile App' },
  { id: 'mobile-permissions', label: '4. Device Permissions' },
  { id: 'local-storage', label: '5. Local Storage & Vault' },
  { id: 'information-collected', label: '6. Technical & Contact Data' },
  { id: 'third-party', label: '7. Infrastructure Providers' },
  { id: 'security-retention', label: '8. Security & Data Retention' },
  { id: 'user-rights', label: '9. Your Rights & Data Deletion' },
  { id: 'children', label: '10. Children’s Privacy' },
  { id: 'changes', label: '11. Policy Changes' },
  { id: 'privacy-contact', label: '12. Contact Information' },
];
</script>

<template>
  <div class="site-shell info-shell">
    <a class="skip-link" href="#privacy-content">Skip to privacy policy</a>
    <SiteHeader />
    <main id="main" class="info-main legal-main">
      <div class="info-ambient" aria-hidden="true"><span /><span /></div>
      <section class="legal-hero container">
        <nav class="info-breadcrumb" aria-label="Breadcrumb">
          <NuxtLink to="/">Home</NuxtLink>
          <span>/</span>
          <span aria-current="page">Privacy Policy</span>
        </nav>
        <span class="eyebrow"><ShieldCheck :size="13" /> PRIVACY & DATA TRANSPARENCY</span>
        <h1>Your files and privacy stay yours.<br /><span>We Make PDF &amp; Scanify App Policy</span></h1>
        <p>This privacy policy governs both the <strong>We Make PDF</strong> web platform (wemakepdf.com) and the <strong>Scanify</strong> mobile application (Android), explaining how client-side processing, device permissions, and local encryption safeguard your personal data.</p>
        <div class="legal-meta">
          <span>Last updated</span>
          <time datetime="2026-11-21">{{ lastUpdated }}</time>
        </div>
      </section>

      <div class="legal-layout container">
        <aside class="legal-toc" aria-label="Privacy policy contents">
          <span>On this page</span>
          <nav>
            <a v-for="section in sections" :key="section.id" :href="`#${section.id}`">{{ section.label }}</a>
          </nav>
        </aside>

        <article id="privacy-content" class="legal-content">
          <!-- Summary Callout -->
          <section class="legal-summary" aria-labelledby="privacy-overview">
            <span><FileLock2 :size="22" /></span>
            <div>
              <h2 id="privacy-overview">Privacy overview</h2>
              <p>
                <strong>Zero Document Uploads:</strong> Both our web suite and Scanify mobile application are architected to process documents, images, business cards, QR codes, and receipts <em>locally on your own device</em>. We do not transmit or store your scanned files on external cloud servers.
              </p>
            </div>
          </section>

          <!-- 01. Overview & Scope -->
          <section id="overview">
            <span class="legal-section-number">01</span>
            <h2>Overview &amp; Scope</h2>
            <p>
              This Privacy Policy applies to all services provided by <strong>We Make PDF</strong>, including:
            </p>
            <ul>
              <li><strong>We Make PDF Web Platform (wemakepdf.com):</strong> Online file utilities including PDF converters, image tools, document security, and utilities.</li>
              <li><strong>Scanify Mobile Application (Android package: com.wemakepdf.scanify):</strong> Mobile scanning and productivity suite including Visiting Card Scanner, QR &amp; Barcode Suite, Custom QR Code Studio, ID Card to PDF Merger, Receipt Scanner, Food Impact Analyzer, and Encrypted Contacts Vault.</li>
            </ul>
            <p>
              By accessing wemakepdf.com or installing and using Scanify, you agree to the collection and handling of information as described in this policy.
            </p>
          </section>

          <!-- 02. We Make PDF (Web Tools) -->
          <section id="web-tools">
            <span class="legal-section-number">02</span>
            <h2>We Make PDF (Web Tools &amp; Converters)</h2>
            <p>
              When using the converters and file utilities on wemakepdf.com:
            </p>
            <ul>
              <li><strong>In-Browser Processing:</strong> Supported document, image, and PDF conversions run inside your web browser using WebAssembly and client-side JavaScript.</li>
              <li><strong>No Server Uploads:</strong> Files selected for conversion are not uploaded to We Make PDF conversion servers.</li>
              <li><strong>Ephemeral Memory:</strong> Temporary file previews and download links use in-memory browser Object URLs that are automatically discarded when you remove the file, close the tab, or navigate away.</li>
              <li><strong>Download Privacy:</strong> Generated output files are saved directly to your device’s local download directory according to your browser settings.</li>
            </ul>
          </section>

          <!-- 03. Scanify Mobile App -->
          <section id="scanify-mobile">
            <span class="legal-section-number">03</span>
            <h2>Scanify Mobile Application (Android)</h2>
            <p>
              The <strong>Scanify</strong> mobile application is engineered for maximum user privacy, offline resilience, and local computing:
            </p>
            <ul>
              <li><strong>On-Device Machine Learning (ML Kit):</strong> Optical Character Recognition (OCR), barcode detection, receipt parsing, and image labeling utilize Google ML Kit on-device models. All recognition occurs locally in volatile device memory without sending video or photo feeds to cloud AI servers.</li>
              <li><strong>Offline Operation:</strong> Scanify functions fully without an internet connection. Core scanning, ID card PDF merging, Custom QR code creation, and contacts management require no network connectivity.</li>
              <li><strong>No Account Required:</strong> You do not need to register an account, sign in, or provide phone numbers/emails to use the features in Scanify.</li>
              <li><strong>Zero User Profiling:</strong> Scanify contains no advertising tracking SDKs, no behavioral trackers, and does not build demographic or advertising profiles.</li>
            </ul>
          </section>

          <!-- 04. Device Permissions -->
          <section id="mobile-permissions">
            <span class="legal-section-number">04</span>
            <h2>Mobile Permissions (Scanify App)</h2>
            <p>
              In compliance with Google Play Store and Indus Appstore guidelines, Scanify requests only the minimum runtime permissions necessary to deliver its core features:
            </p>
            <ul>
              <li>
                <strong>Camera Permission (<code>android.permission.CAMERA</code>):</strong><br />
                <em>Purpose:</em> Used strictly in real-time when you choose to scan physical business cards, ID cards (Aadhaar, PAN, voter cards), receipts, product barcodes, or QR codes.<br />
                <em>Handling:</em> Camera video frames are analyzed locally in device memory and immediately discarded. Scanify never streams, records, or transmits raw camera footage to any third party.
              </li>
              <li>
                <strong>Photo Gallery / Media Access (Photo Picker &amp; <code>READ_MEDIA_IMAGES</code>):</strong><br />
                <em>Purpose:</em> Used solely when you manually select an image from your device gallery to scan a business card, merge front/back ID cards, or pick a custom background photo or logo for the Custom QR Code Studio.<br />
                <em>Handling:</em> Scanify uses modern system photo picker APIs where possible, accessing only the specific images you explicitly choose.
              </li>
              <li>
                <strong>Contacts Access (<code>WRITE_CONTACTS</code> / System Intent):</strong><br />
                <em>Purpose:</em> Used only when you tap "Save to Phone Contacts" to export an extracted business card into your device's address book.<br />
                <em>Handling:</em> Scanify never reads, syncs, or uploads your existing address book. It only appends the single new contact you explicitly approved.
              </li>
              <li>
                <strong>Storage / Document Saving:</strong><br />
                <em>Purpose:</em> Used to save generated PDF documents (e.g., merged ID cards) and PNG images (Custom QR codes) into your device storage or share them via system share dialogs.
              </li>
            </ul>
          </section>

          <!-- 05. Local Storage & Vault -->
          <section id="local-storage">
            <span class="legal-section-number">05</span>
            <h2>Data Storage &amp; Local Encrypted Vault</h2>
            <p>
              Scanify incorporates an encrypted local database (Hive Vault) to store your scanned cards, notes, and contacts:
            </p>
            <ul>
              <li><strong>Physical Device Storage:</strong> Vault records reside exclusively within Scanify’s sandboxed private application storage on your physical device.</li>
              <li><strong>Zero Cloud Sync:</strong> Scanned cards, contact details, and ID PDFs are never synced to our servers or external databases.</li>
              <li><strong>Browser Preferences (Web):</strong> On wemakepdf.com, we store your preferred UI theme (light/dark) in your browser’s local storage (under <code>wemakepdf-theme</code> or <code>toolifybox-theme</code>). No tracking cookies are used.</li>
            </ul>
          </section>

          <!-- 06. Technical & Contact Data -->
          <section id="information-collected">
            <span class="legal-section-number">06</span>
            <h2>Technical Data &amp; Contact Form</h2>
            <p>
              <strong>Website Server Logs:</strong> When you access wemakepdf.com, the hosting provider (Netlify) receives standard technical HTTP request logs (IP address, browser user-agent, requested URL, timestamp) necessary for DDoS mitigation, security, and content delivery.
            </p>
            <p>
              <strong>Contact Form Submissions:</strong> If you submit a query through our contact page, we collect the name, email address, topic, and message you provide. This data is used solely to respond to your inquiry and provide technical support. Do not submit sensitive identity documents or credentials through contact forms.
            </p>
          </section>

          <!-- 07. Infrastructure Providers -->
          <section id="third-party">
            <span class="legal-section-number">07</span>
            <h2>Infrastructure &amp; Service Providers</h2>
            <p>
              We partner with industry-standard, reputable infrastructure providers:
            </p>
            <ul>
              <li><strong>Netlify:</strong> Hosts the We Make PDF website, CDN edge caching, and contact form endpoints under the <a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener noreferrer">Netlify Privacy Statement</a>.</li>
              <li><strong>Google ML Kit:</strong> Provides on-device vision libraries that run locally on Android devices without transmitting images to cloud servers.</li>
              <li><strong>System Share Services:</strong> When you tap "Share" in Scanify (for PDF or QR codes), your device's native Android ShareSheet coordinates the transfer directly to the app you select (e.g., WhatsApp, Gmail, Drive).</li>
            </ul>
          </section>

          <!-- 08. Security & Data Retention -->
          <section id="security-retention">
            <span class="legal-section-number">08</span>
            <h2>Security &amp; Data Retention</h2>
            <p>
              <strong>Retention:</strong> Because document conversions and camera scans occur in-memory, We Make PDF retains zero converted files. Local records in Scanify remain on your device until you choose to delete them. Contact inquiries are retained only as long as necessary to address your feedback and fulfill legal requirements.
            </p>
            <p>
              <strong>Security Safeguards:</strong> We employ HTTPS / TLS 1.3 encryption for all web communications, Android application sandboxing, and strict permission models to protect data integrity.
            </p>
          </section>

          <!-- 09. Your Rights & Data Deletion -->
          <section id="user-rights">
            <span class="legal-section-number">09</span>
            <h2>Your Rights &amp; Data Deletion</h2>
            <p>
              You maintain total control over your information:
            </p>
            <ul>
              <li><strong>Deleting Mobile App Data:</strong> You can delete any saved card or contact at any time directly in the Scanify Vault. To delete all app data completely, go to your phone’s <em>Settings &gt; Apps &gt; Scanify &gt; Storage &gt; Clear Data</em> or uninstall the app.</li>
              <li><strong>Revoking Permissions:</strong> You can grant or revoke Camera, Storage, or Contacts permissions at any time via Android App Settings.</li>
              <li><strong>Privacy Inquiries:</strong> You can request clarification or ask to delete any contact form messages by reaching out to us through our contact form.</li>
            </ul>
          </section>

          <!-- 10. Children’s Privacy -->
          <section id="children">
            <span class="legal-section-number">10</span>
            <h2>Children’s Privacy</h2>
            <p>
              We Make PDF and Scanify are general-purpose document and scanning tools not targeted at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has submitted personal details through our contact form, please notify us immediately for deletion.
            </p>
          </section>

          <!-- 11. Policy Changes -->
          <section id="changes">
            <span class="legal-section-number">11</span>
            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically to reflect app updates, new tools, or regulatory changes. The "Last updated" date at the top of this document indicates the effective version. Continued use of wemakepdf.com or Scanify after revisions signifies acceptance of the updated terms.
            </p>
          </section>

          <!-- 12. Contact Information -->
          <section id="privacy-contact">
            <span class="legal-section-number">12</span>
            <h2>Contact Information</h2>
            <p>
              If you have questions, feedback, or privacy-related requests regarding We Make PDF or the Scanify mobile application, please contact our team:
            </p>
            <ul>
              <li><strong>Developer / Publisher:</strong> We Make PDF &amp; Scanify Team</li>
              <li><strong>Website:</strong> <a href="https://wemakepdf.com" target="_blank" rel="noopener noreferrer">https://wemakepdf.com</a></li>
              <li><strong>Online Contact Form:</strong> <NuxtLink to="/contact">wemakepdf.com/contact</NuxtLink></li>
            </ul>
            <NuxtLink class="legal-contact-link" to="/contact">
              <Mail :size="16" /> Contact Privacy Support <ArrowRight :size="15" />
            </NuxtLink>
          </section>
        </article>
      </div>
    </main>
    <SiteFooter message="Private browser tools and on-device mobile scanner with clear data practices." />
  </div>
</template>
