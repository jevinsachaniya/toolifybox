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
  <footer class="site-footer container">
    <BrandLogo />
    <nav class="footer-links" aria-label="Footer navigation">
      <NuxtLink to="/tools">Tools</NuxtLink>
      <NuxtLink to="/about">About</NuxtLink>
      <NuxtLink to="/contact">Contact</NuxtLink>
    </nav>
    <p>{{ message }}</p>
    <AppVersion />
    <span>© {{ year }} Toolifybox</span>
  </footer>
</template>
