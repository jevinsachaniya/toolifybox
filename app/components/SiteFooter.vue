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
        <span class="footer-privacy-note">Word, PDF and image processing runs locally in your browser.</span>
      </div>

      <nav class="footer-links footer-tools" aria-label="Converter links">
        <h2>Tools</h2>
        <NuxtLink to="/tools">All tools</NuxtLink>
        <NuxtLink to="/tools/word-to-pdf">Word to PDF</NuxtLink>
        <NuxtLink to="/tools/pdf-to-word">PDF to Word</NuxtLink>
        <NuxtLink to="/tools/pdf-to-images">PDF to Images</NuxtLink>
        <NuxtLink to="/tools/images-to-pdf">Images to PDF</NuxtLink>
      </nav>

      <nav class="footer-links" aria-label="Toolifybox links">
        <h2>Toolifybox</h2>
        <NuxtLink to="/">Home</NuxtLink>
        <NuxtLink to="/about">About us</NuxtLink>
        <NuxtLink to="/contact">Contact</NuxtLink>
      </nav>

      <div class="footer-help-column">
        <h2>Simple &amp; private</h2>
        <p>No sign-up, no watermarks and no document uploads for supported conversions.</p>
        <NuxtLink to="/tools">Choose a converter <span aria-hidden="true">→</span></NuxtLink>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© {{ year }} Toolifybox. All rights reserved.</span>
      <AppVersion />
    </div>
  </footer>
</template>
