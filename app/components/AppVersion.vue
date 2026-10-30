<script setup>
import { SITE_VERSION } from '../../site.version.mjs';
</script>

<template>
  <span class="site-version" :aria-label="`We Make PDF version ${SITE_VERSION}`">v{{ SITE_VERSION }}</span>
</template>
