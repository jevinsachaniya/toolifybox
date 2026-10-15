<script setup>
import { SITE_VERSION } from '../../site.version.mjs';
</script>

<template>
  <span class="site-version" :aria-label="`Toolifybox version ${SITE_VERSION}`">v{{ SITE_VERSION }}</span>
</template>
