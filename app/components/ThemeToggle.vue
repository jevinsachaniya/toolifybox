<script setup>
import { Moon, Sun } from '@lucide/vue';
import { onBeforeUnmount, onMounted, ref } from 'vue';

const theme = ref('light');

function applyTheme(nextTheme, save = true) {
  const next = nextTheme === 'dark' ? 'dark' : 'light';
  theme.value = next;
  document.documentElement.dataset.theme = next;
  document.documentElement.style.colorScheme = next;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#080c14' : '#f8fafc');
  if (save) { localStorage.setItem('wemakepdf-theme', next); localStorage.setItem('toolifybox-theme', next); }
}

function toggleTheme() {
  applyTheme(theme.value === 'light' ? 'dark' : 'light');
}

function syncStoredTheme(event) {
  if (event.key === 'wemakepdf-theme' || event.key === 'toolifybox-theme') applyTheme(event.newValue, false);
}

onMounted(() => {
  applyTheme(document.documentElement.dataset.theme, false);
  window.addEventListener('storage', syncStoredTheme);
});

onBeforeUnmount(() => window.removeEventListener('storage', syncStoredTheme));
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'"
    :title="theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'"
    :aria-pressed="theme === 'dark'"
    @click="toggleTheme"
  >
    <Moon v-if="theme === 'light'" :size="15" aria-hidden="true" />
    <Sun v-else :size="15" aria-hidden="true" />
    <span>{{ theme === 'light' ? 'Dark mode' : 'Light mode' }}</span>
  </button>
</template>
