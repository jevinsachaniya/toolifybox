<script setup>
import { ArrowUpRight, Menu, Search, X } from '@lucide/vue';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const route = useRoute();
const router = useRouter();
const menuOpen = ref(false);
const toolSearch = ref('');

function closeMenu() {
  menuOpen.value = false;
}

function onKeydown(event) {
  if (event.key === 'Escape') closeMenu();
}

async function findTool() {
  const search = toolSearch.value.trim();
  closeMenu();
  await nextTick();
  await router.push({ path: '/tools', query: search ? { search } : {}, hash: '#tool-results' });
  await nextTick();
  document.querySelector('#tool-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

watch(() => route.fullPath, closeMenu);
watch(menuOpen, open => {
  if (import.meta.client) document.body.classList.toggle('mobile-menu-open', open);
});

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.classList.remove('mobile-menu-open');
});
</script>

<template>
  <header class="site-header">
    <div class="container header-inner">
      <BrandLogo />
      <nav class="desktop-nav" aria-label="Main navigation">
        <NuxtLink to="/">Home</NuxtLink>
        <NuxtLink to="/tools">Tools</NuxtLink>
        <NuxtLink to="/about">About</NuxtLink>
        <NuxtLink to="/contact">Contact</NuxtLink>
      </nav>
      <ThemeToggle />
      <NuxtLink class="header-action" to="/tools">Open tools <ArrowUpRight :size="16" /></NuxtLink>
      <button
        type="button"
        class="mobile-menu-toggle"
        :class="{ open: menuOpen }"
        :aria-expanded="menuOpen"
        aria-controls="mobile-navigation"
        :aria-label="menuOpen ? 'Close navigation menu' : 'Open navigation menu'"
        @click="menuOpen = !menuOpen"
      >
        <X v-if="menuOpen" :size="21" aria-hidden="true" />
        <Menu v-else :size="22" aria-hidden="true" />
      </button>
    </div>

    <Transition name="mobile-menu">
      <div v-if="menuOpen" id="mobile-navigation" class="mobile-navigation">
        <div class="container mobile-navigation-inner">
          <nav class="mobile-primary-links" aria-label="Mobile main navigation">
            <NuxtLink to="/" @click="closeMenu">Home</NuxtLink>
            <NuxtLink to="/tools" @click="closeMenu">All tools</NuxtLink>
            <NuxtLink to="/about" @click="closeMenu">About</NuxtLink>
            <NuxtLink to="/contact" @click="closeMenu">Contact</NuxtLink>
          </nav>
          <div class="mobile-tool-finder">
            <span class="mobile-nav-label">Tool library</span>
            <h2>Find the right tool.</h2>
            <p>Search the complete library as new Word, PDF and image utilities are added.</p>
            <form role="search" @submit.prevent="findTool">
              <Search :size="16" aria-hidden="true" />
              <input v-model="toolSearch" type="search" placeholder="What do you need?" aria-label="Search all tools" autocomplete="off" />
              <button type="submit" aria-label="Search tools"><ArrowUpRight :size="17" /></button>
            </form>
            <NuxtLink class="mobile-library-link" to="/tools#catalog" @click="closeMenu">Browse the complete library <ArrowUpRight :size="14" /></NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>
