<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
  size: {
    type: [Number, String],
    default: 38,
  },
});
</script>

<template>
  <img
    :src="`/icons/tools/${name}.svg`"
    :alt="alt || `${name} icon`"
    :width="size"
    :height="size"
    class="tool-realistic-img"
    loading="lazy"
    draggable="false"
  />
</template>

