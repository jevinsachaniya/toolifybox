import { DEFAULT_SITE_URL, normalizeSiteUrl, SITE_ROUTES } from './site.config.mjs';

const siteUrl = normalizeSiteUrl(process.env.URL || process.env.SITE_URL || DEFAULT_SITE_URL);
const socialImage = `${siteUrl}/brand/toolifybox-social.png`;

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
      include: ['@lucide/vue', 'docx', 'docx-preview', 'html2canvas', 'jspdf', 'jszip', 'pdf-lib'],
    },
  },
  css: ['~/assets/css/styles.css'],
  runtimeConfig: {
    public: {
      siteUrl,
    },
  },
  app: {
    head: {
      title: 'Toolifybox — Powerful Word, PDF & Image Tools',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'theme-color', content: '#f8fafc' },
        { name: 'description', content: 'Free private browser tools for Word, PDF, and images. Convert files locally with no sign-up and no document uploads.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Toolifybox' },
        { property: 'og:title', content: 'Toolifybox — Powerful Tools. Simpler Work.' },
        { property: 'og:description', content: 'Convert Word, PDF, and image files privately in your browser.' },
        { property: 'og:image', content: socialImage },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Toolifybox — Powerful tools. Simpler work.' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Toolifybox — Powerful Tools. Simpler Work.' },
        { name: 'twitter:description', content: 'Private browser tools for Word, PDF, and images.' },
        { name: 'twitter:image', content: socialImage },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'mask-icon', href: '/favicon.svg', color: '#0875fb' },
      ],
      script: [
        { innerHTML: "try{var t=localStorage.getItem('toolifybox-theme');t=t==='dark'?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light'}" },
      ],
    },
  },
  nitro: {
    preset: 'static',
    prerender: { routes: SITE_ROUTES },
  },
});
