<script setup>
defineProps({
  message: {
    type: String,
    default: 'Free, private file tools that run in your browser.',
  },
});

const year = new Date().getFullYear();
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-main">
      <div class="footer-brand-column">
        <BrandLogo />
        <p>{{ message }}</p>
        <span class="footer-privacy-note">Word, PDF, image, and data processing runs 100% locally in your browser with zero remote uploads.</span>
      </div>

      <nav class="footer-links footer-tools" aria-label="Converter links">
        <h2>Document &amp; File Tools</h2>
        <div class="footer-tools-columns">
          <div class="footer-tools-col">
            <span class="footer-col-subhead">Converters</span>
            <NuxtLink to="/tools/word-to-pdf">Word to PDF</NuxtLink>
            <NuxtLink to="/tools/powerpoint-to-pdf">PowerPoint to PDF</NuxtLink>
            <NuxtLink to="/tools/excel-to-pdf">Excel to PDF</NuxtLink>
            <NuxtLink to="/tools/pdf-to-word">PDF to Word</NuxtLink>
            <NuxtLink to="/tools/pdf-to-jpg">PDF to JPG</NuxtLink>
            <NuxtLink to="/tools/pdf-to-images">PDF to Images</NuxtLink>
            <NuxtLink to="/tools/images-to-pdf">Images to PDF</NuxtLink>
            <NuxtLink to="/tools/html-to-pdf">HTML to PDF</NuxtLink>
            <NuxtLink to="/tools/pdf-to-html">PDF to HTML</NuxtLink>
            <NuxtLink to="/tools/image-to-svg">Image to SVG</NuxtLink>
            <NuxtLink to="/tools/json-to-csv">JSON to CSV</NuxtLink>
          </div>
          <div class="footer-tools-col">
            <span class="footer-col-subhead">PDF Operations</span>
            <NuxtLink to="/tools/organize-pdf">Organize PDF</NuxtLink>
            <NuxtLink to="/tools/merge-pdf">Merge PDF</NuxtLink>
            <NuxtLink to="/tools/split-pdf">Split PDF</NuxtLink>
            <NuxtLink to="/tools/rotate-pdf">Rotate PDF</NuxtLink>
            <NuxtLink to="/tools/remove-pdf-pages">Remove PDF Pages</NuxtLink>
            <NuxtLink to="/tools/crop-pdf">Crop PDF</NuxtLink>
            <NuxtLink to="/tools/flatten-pdf">Flatten PDF</NuxtLink>
            <NuxtLink to="/tools/extract-ocr">Extract OCR Text</NuxtLink>
            <NuxtLink to="/tools/add-page-numbers">Add Page Numbers</NuxtLink>
            <NuxtLink to="/tools/watermark-pdf">Watermark PDF</NuxtLink>
            <NuxtLink to="/tools/compare-pdf">Compare PDF</NuxtLink>
          </div>
          <div class="footer-tools-col">
            <span class="footer-col-subhead">Security &amp; Media</span>
            <NuxtLink to="/tools/protect-pdf">Protect PDF</NuxtLink>
            <NuxtLink to="/tools/unlock-pdf">Unlock PDF</NuxtLink>
            <NuxtLink to="/tools/compress-pdf">Compress PDF</NuxtLink>
            <NuxtLink to="/tools/create-pdf">Create PDF</NuxtLink>
            <NuxtLink to="/tools/translate-pdf">Translate PDF</NuxtLink>
            <NuxtLink to="/tools/remove-background">Remove Background</NuxtLink>
            <NuxtLink to="/tools/convert-image">Convert Image</NuxtLink>
            <NuxtLink to="/tools/compress-image">Compress Image</NuxtLink>
            <NuxtLink to="/tools/split-image">Split Image</NuxtLink>
            <NuxtLink to="/tools/image-collage">Image Collage</NuxtLink>
            <NuxtLink to="/tools" class="footer-view-all">All 32 Tools →</NuxtLink>
          </div>
        </div>
      </nav>

      <nav class="footer-links footer-site-links" aria-label="We Make PDF links">
        <h2>Company</h2>
        <NuxtLink to="/">Home</NuxtLink>
        <NuxtLink to="/tools">All Tools</NuxtLink>
        <NuxtLink to="/about">About Us</NuxtLink>
        <NuxtLink to="/contact">Contact Support</NuxtLink>
        <NuxtLink to="/privacy-policy">Privacy Policy</NuxtLink>
        <NuxtLink to="/terms-and-conditions">Terms &amp; Conditions</NuxtLink>
      </nav>

      <div class="footer-help-column">
        <h2>Privacy First</h2>
        <p>Zero server uploads. Your confidential contracts, financial tables, and images remain safely inside your device's browser memory.</p>
        <NuxtLink to="/tools" class="footer-cta-link">
          Explore all tools <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </div>
    <div class="container footer-bottom">
      <div class="footer-bottom-copy">
        <span>© {{ year }} We Make PDF. All rights reserved.</span>
        <span class="footer-bottom-badge">100% Private Client-Side Tools</span>
      </div>
      <AppVersion />
    </div>
  </footer>
</template>
