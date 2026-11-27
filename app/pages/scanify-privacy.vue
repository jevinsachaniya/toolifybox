<script setup>
import { ArrowRight, Camera, FileLock2, Mail, ShieldCheck, Smartphone } from '@lucide/vue';
import { breadcrumbSchema, usePageSeo } from '~/composables/usePageSeo';

const lastUpdated = 'November 27, 2026';
const pageDescription = 'Official Privacy Policy for the Scanify Android mobile application (com.wemakepdf.scanify). Learn how on-device OCR, camera permissions, QR generation, and local vault storage work.';

usePageSeo({
  title: 'Scanify App Privacy Policy | Official Mobile App Policy',
  description: pageDescription,
  path: '/scanify-privacy',
  schemas: [
    ({ siteUrl }) => breadcrumbSchema(siteUrl, [
      { name: 'Home', path: '/' },
      { name: 'Scanify Privacy Policy', path: '/scanify-privacy' },
    ]),
    ({ siteUrl, canonical }) => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Scanify Mobile App Privacy Policy',
      description: pageDescription,
      url: canonical,
      dateModified: '2026-11-27',
      isPartOf: { '@type': 'WebSite', name: 'We Make PDF', url: siteUrl },
    }),
  ],
});

const sections = [
  { id: 'overview', label: '1. App Overview & Services' },
  { id: 'services-data', label: '2. How Each Feature Handles Data' },
  { id: 'permissions', label: '3. Android Permissions Used' },
  { id: 'on-device-ml', label: '4. On-Device Processing (ML Kit)' },
  { id: 'local-vault', label: '5. Local Storage & Vault' },
  { id: 'sharing', label: '6. File Export & Third-Party Sharing' },
  { id: 'retention-deletion', label: '7. Data Retention & Deletion' },
  { id: 'children', label: '8. Children’s Privacy' },
  { id: 'changes', label: '9. Policy Updates' },
  { id: 'contact', label: '10. Developer Contact' },
];
</script>

<template>
  <div class="site-shell info-shell">
    <a class="skip-link" href="#scanify-privacy-content">Skip to Scanify privacy policy</a>
    <SiteHeader />
    <main id="main" class="info-main legal-main">
      <div class="info-ambient" aria-hidden="true"><span /><span /></div>
      <section class="legal-hero container">
        <nav class="info-breadcrumb" aria-label="Breadcrumb">
          <NuxtLink to="/">Home</NuxtLink>
          <span>/</span>
          <span aria-current="page">Scanify Privacy Policy</span>
        </nav>
        <span class="eyebrow"><Smartphone :size="13" /> SCANIFY MOBILE APPLICATION (ANDROID)</span>
        <h1>Privacy Policy for <span>Scanify</span><br />Document, Card &amp; QR Scanner</h1>
        <p>
          This Privacy Policy governs the <strong>Scanify</strong> Android mobile application
          (Package ID: <code>com.wemakepdf.scanify</code>), published by the We Make PDF Team.
          It explains what data Scanify accesses, why each permission is needed, and how all scanning and document tools operate privately on your device.
        </p>
        <div class="legal-meta">
          <span>Last updated</span>
          <time datetime="2026-11-27">{{ lastUpdated }}</time>
        </div>
      </section>

      <div class="legal-layout container">
        <aside class="legal-toc" aria-label="Scanify privacy policy contents">
          <span>On this page</span>
          <nav>
            <a v-for="section in sections" :key="section.id" :href="`#${section.id}`">{{ section.label }}</a>
          </nav>
        </aside>

        <article id="scanify-privacy-content" class="legal-content">
          <section class="legal-summary" aria-labelledby="scanify-privacy-overview">
            <span><FileLock2 :size="22" /></span>
            <div>
              <h2 id="scanify-privacy-overview">Privacy overview for Scanify</h2>
              <p>
                <strong>100% On-Device Processing &amp; Zero Cloud Uploads:</strong> Scanify does not require user registration, login, or cloud accounts. All business card scanning, ID card PDF merging, QR code scanning/generation, receipt parsing, and food/product label checks run locally on your device. We do not collect, upload, sell, or share your personal documents or camera images.
              </p>
            </div>
          </section>

          <section id="overview">
            <span class="legal-section-number">01</span>
            <h2>App Overview &amp; Services Offered</h2>
            <p>
              <strong>Scanify</strong> (<code>com.wemakepdf.scanify</code>) is an offline-first productivity and scanning application offering the following services:
            </p>
            <ul>
              <li><strong>Visiting Card Scanner &amp; Multi-Card Batch Scanner:</strong> Captures front and back images of business cards to extract names, phone numbers, emails, websites, and company details into a local contacts vault and Excel/CSV exports.</li>
              <li><strong>QR &amp; Barcode Suite:</strong> Scans product barcodes (EAN-13, UPC, Code 128), UPI payment codes, Wi-Fi QR codes, vCards, and URLs.</li>
              <li><strong>Custom QR Code Studio:</strong> Generates styled QR codes (links, text, UPI, Wi-Fi, vCard, WhatsApp) with custom colors, gradients, logos, and background images.</li>
              <li><strong>ID Card to PDF Merger:</strong> Combines front and back photos of ID documents (such as Aadhaar, PAN, or Voter ID) into a single A4 PDF file locally on your phone.</li>
              <li><strong>Receipt &amp; Invoice Scanner:</strong> Extracts merchant names, dates, tax/GST numbers, and totals from paper receipts for personal expense tracking.</li>
              <li><strong>Food &amp; Body Impact / Behind The Label Scanners:</strong> Reads ingredient lists and nutrition labels from food and consumer product packaging to highlight sugar, sodium, additives, and safety insights locally.</li>
              <li><strong>Encrypted Local Contacts Vault:</strong> Stores your scanned business card contacts locally on your device with 1-tap dial, email, WhatsApp, and Excel export actions.</li>
            </ul>
          </section>

          <section id="services-data">
            <span class="legal-section-number">02</span>
            <h2>How Each Feature Handles Your Data</h2>
            <ul>
              <li><strong>Document, ID Card &amp; Receipt Images:</strong> Images captured via camera or selected from your gallery are processed strictly in local device memory to perform text recognition (OCR) or PDF layout generation. They are never transmitted to any remote server.</li>
              <li><strong>Business Card Contact Details:</strong> Extracted names, phone numbers, and emails are saved only inside Scanify’s private local database on your device unless you choose to export or share them.</li>
              <li><strong>QR Code Generation &amp; Scanning:</strong> All QR payloads (including Wi-Fi passwords, UPI IDs, and contact vCards) are generated and decoded locally on your phone.</li>
              <li><strong>Food &amp; Product Label Analysis:</strong> Ingredient text extracted from packaging is evaluated locally using built-in rule tables on your device.</li>
              <li><strong>Optional Web Actions:</strong> If you tap "Search Product Online", "Open Link", or "WeMakePDF Cloud Suite", your device opens the requested URL in your phone’s external browser.</li>
            </ul>
          </section>

          <section id="permissions">
            <span class="legal-section-number">03</span>
            <h2>Android Permissions Requested by Scanify</h2>
            <p>
              Scanify requests only the permissions required for the user-initiated features above:
            </p>
            <ul>
              <li>
                <strong>Camera (<code>android.permission.CAMERA</code>):</strong> Used strictly when you capture photos of visiting cards, ID cards, receipts, QR/barcodes, or product labels. Camera feeds are never recorded in the background or uploaded to any server.
              </li>
              <li>
                <strong>Photos &amp; Media Storage (<code>READ_MEDIA_IMAGES</code>, <code>READ_EXTERNAL_STORAGE</code>, <code>WRITE_EXTERNAL_STORAGE</code>):</strong> Used only when you choose to import an existing image from your gallery (for OCR, ID merging, or Custom QR backgrounds/logos) or save generated PDFs and QR PNG files to your device.
              </li>
              <li>
                <strong>Internet Access (<code>android.permission.INTERNET</code>):</strong> Used only when you explicitly tap external actions such as searching a scanned barcode online, opening a scanned URL, or visiting <code>wemakepdf.com</code>. Core scanning and PDF tools work offline.
              </li>
              <li>
                <strong>App Intents (Phone Dialer, Email, Browser, WhatsApp):</strong> Used only when you tap Call, Email, Visit Website, or WhatsApp on a scanned business card or QR result. Scanify does not read your call logs, SMS, or WhatsApp chats.
              </li>
            </ul>
          </section>

          <section id="on-device-ml">
            <span class="legal-section-number">04</span>
            <h2>On-Device Machine Learning (Google ML Kit)</h2>
            <p>
              Scanify uses <strong>Google ML Kit</strong> on-device APIs (Text Recognition, Barcode Scanning, and Image Labeling) to power its OCR and scanner features. All image analysis runs locally on your phone’s processor. Scanify does not include third-party advertising SDKs, behavioral analytics trackers, or user profiling tools.
            </p>
          </section>

          <section id="local-vault">
            <span class="legal-section-number">05</span>
            <h2>Local Storage &amp; Vault Security</h2>
            <p>
              Scanned visiting cards and saved contacts are stored inside Scanify’s private application storage using an encrypted local Hive database on your device. We do not maintain user accounts, cloud backups, or remote databases of your scanned cards or ID documents.
            </p>
          </section>

          <section id="sharing">
            <span class="legal-section-number">06</span>
            <h2>File Export &amp; Third-Party Sharing</h2>
            <p>
              Scanify never shares your data automatically. Files such as merged ID card PDFs, custom QR code PNGs, and Excel/CSV contact sheets are shared only when you explicitly tap the <strong>Share</strong> or <strong>Export</strong> button, using Android’s standard Share Sheet to send files to the app you select (such as WhatsApp, Gmail, or Google Drive).
            </p>
          </section>

          <section id="retention-deletion">
            <span class="legal-section-number">07</span>
            <h2>Data Retention &amp; Deletion</h2>
            <p>
              Because Scanify does not collect or store your files on external servers, you have full control over your data:
            </p>
            <ul>
              <li>Delete individual saved contacts anytime inside the Contacts Vault.</li>
              <li>Use <strong>Settings &gt; Clear All Contacts Vault</strong> inside Scanify to wipe all stored records immediately.</li>
              <li>Uninstall the Scanify app or clear app storage in Android Settings to permanently remove all local app data.</li>
            </ul>
          </section>

          <section id="children">
            <span class="legal-section-number">08</span>
            <h2>Children’s Privacy</h2>
            <p>
              Scanify is a general-purpose utility and is not directed to children under 13. The app does not knowingly collect personal information from children.
            </p>
          </section>

          <section id="changes">
            <span class="legal-section-number">09</span>
            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy when new features or legal requirements are introduced. The updated date at the top of this page reflects the latest version.
            </p>
          </section>

          <section id="contact">
            <span class="legal-section-number">10</span>
            <h2>Developer Contact Information</h2>
            <p>
              If you have any questions regarding the Scanify mobile application or this Privacy Policy, please contact us:
            </p>
            <ul>
              <li><strong>App Name:</strong> Scanify (<code>com.wemakepdf.scanify</code>)</li>
              <li><strong>Publisher:</strong> We Make PDF Team</li>
              <li><strong>Support Email:</strong> <a href="mailto:support@wemakepdf.com">support@wemakepdf.com</a></li>
              <li><strong>Contact Page:</strong> <NuxtLink to="/contact">wemakepdf.com/contact</NuxtLink></li>
            </ul>
            <NuxtLink class="legal-contact-link" to="/contact">
              <Mail :size="16" /> Contact Scanify Support <ArrowRight :size="15" />
            </NuxtLink>
          </section>
        </article>
      </div>
    </main>
    <SiteFooter message="Scanify Mobile App — 100% on-device scanning and privacy." />
  </div>
</template>
