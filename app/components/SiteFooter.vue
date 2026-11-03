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
