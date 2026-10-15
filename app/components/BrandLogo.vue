<template>
  <NuxtLink class="brand" to="/" aria-label="Toolifybox home">
    <svg class="brand-mark" viewBox="0 0 112 112" aria-hidden="true">
      <defs>
        <linearGradient id="toolifybox-mark-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#08b9ed" /><stop offset="1" stop-color="#0868f8" /></linearGradient>
        <linearGradient id="toolifybox-mark-stem" x1="0" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="#04a9ee" /><stop offset="1" stop-color="#0875fb" /></linearGradient>
      </defs>
      <path fill="url(#toolifybox-mark-top)" d="M12 22C14 12 21 7 31 7h73c0 19-15 34-34 34H7l5-19Z" />
      <path fill="url(#toolifybox-mark-stem)" d="M42 41h28v23c0 22-14 40-35 46V49c0-4 3-8 7-8Z" />
    </svg>
    <span class="brand-divider" aria-hidden="true" />
    <span class="brand-copy"><span class="brand-name"><span>toolify</span><b>box</b></span><small>Powerful tools. Simpler work.</small></span>
  </NuxtLink>
</template>
