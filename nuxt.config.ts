export default defineNuxtConfig({
  compatibilityDate: '2026-10-14',
  devtools: { enabled: false },
  ssr: true,
  modules: ['./modules/pdf-assets'],
  vite: {
    optimizeDeps: {
      // PDF.js already ships as browser ESM. Keep it out of Vite's generated
      // dependency cache; its worker must also remain a separately served file.
      exclude: ['pdfjs-dist', 'tesseract.js'],
      // Prepare lazy converter libraries before a first click can trigger a
      // dependency re-bundle and invalidate the page's module URLs.
      include: ['@lucide/vue', 'docx', 'docx-preview', 'html2canvas', 'jspdf', 'jszip'],
    },
  },
  css: ['~/assets/css/styles.css'],
  app: {
    head: {
      title: 'Toolifybox — Word & PDF, simply.',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'theme-color', content: '#101320' },
        { name: 'description', content: 'Convert Word to PDF or PDF to Word in your browser. Preserve page appearance or choose editable text. Free, no sign-up, and no document uploads.' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  nitro: {
    preset: 'static',
    prerender: { routes: ['/', '/tools', '/tools/word-to-pdf', '/tools/pdf-to-word', '/tools/pdf-to-images'] },
  },
});
