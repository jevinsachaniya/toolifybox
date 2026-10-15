<script setup>
import { FileText } from '@lucide/vue';

defineProps({
  type: { type: String, default: 'word' },
  small: { type: Boolean, default: false },
});
</script>

<template>
  <span :class="['file-badge', type, { small }]" aria-hidden="true">
    <FileText :stroke-width="1.4" />
    <b>{{ type === 'word' ? 'W' : 'PDF' }}</b>
  </span>
</template>
