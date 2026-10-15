<script setup>
import { FileText } from '@lucide/vue';
</script>

<template>
  <NuxtLink class="brand" to="/" aria-label="Toolifybox home">
    <span class="brand-symbol"><FileText :size="21" :stroke-width="2" /></span>toolifybox<span class="brand-period">.</span>
  </NuxtLink>
</template>
