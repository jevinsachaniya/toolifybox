import { fileURLToPath } from 'node:url';
import { DEFAULT_SITE_URL, normalizeSiteUrl, SITE_ROUTES } from './site.config.mjs';

const siteUrl = normalizeSiteUrl(process.env.URL || process.env.SITE_URL || DEFAULT_SITE_URL);
const socialImage = `${siteUrl}/brand/wemakepdf-social.svg`;

export default defineNuxtConfig({
  compatibilityDate: '2026-10-14',
  devtools: { enabled: false },
  ssr: true,
  alias: {
    '~': fileURLToPath(new URL('./app', import.meta.url)),
    '@': fileURLToPath(new URL('./app', import.meta.url)),
    'assets': fileURLToPath(new URL('./app/assets', import.meta.url)),
    '~/assets': fileURLToPath(new URL('./app/assets', import.meta.url)),
    '@/assets': fileURLToPath(new URL('./app/assets', import.meta.url)),
  },
  modules: ['./modules/pdf-assets'],
  vite: {
    optimizeDeps: {
      // PDF.js already ships as browser ESM. Keep it out of Vite's generated
      // dependency cache; its worker must also remain a separately served file.
      exclude: ['pdfjs-dist', 'tesseract.js', 'pptx-browser', '@imgly/background-removal'],
      // Prepare lazy converter libraries before a first click can trigger a
      // dependency re-bundle and invalidate the page's module URLs.
      include: ['@lucide/vue', 'docx', 'docx-preview', 'html2canvas', 'jspdf', 'jszip', 'pdf-lib', '@pdfsmaller/pdf-encrypt', '@pdfsmaller/pdf-decrypt'],
    },
  },
  css: [fileURLToPath(new URL('./app/assets/css/styles.css', import.meta.url))],
  runtimeConfig: {
    public: {
      siteUrl,
    },
  },
  app: {
    head: {
      title: 'We Make PDF — Powerful PDF & Document Tools',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'theme-color', content: '#f8fafc' },
        { name: 'description', content: 'Free private browser tools for PDF, Word, and images. Convert and edit files locally with no sign-up and no server uploads.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'We Make PDF' },
        { property: 'og:title', content: 'We Make PDF — Free Private Document Tools' },
        { property: 'og:description', content: 'Convert, optimize, and edit PDF and document files privately in your browser.' },
        { property: 'og:image', content: socialImage },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'We Make PDF — Free Private Document Tools' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'We Make PDF — Free Private Document Tools' },
        { name: 'twitter:description', content: 'Private browser tools for PDF and documents.' },
        { name: 'twitter:image', content: socialImage },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'mask-icon', href: '/favicon.svg', color: '#e11d48' },
      ],
      script: [
        { innerHTML: "try{var t=localStorage.getItem('wemakepdf-theme')||localStorage.getItem('toolifybox-theme');t=t==='dark'?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light'}" },
      ],
    },
  },
  nitro: {
    preset: 'static',
    prerender: { routes: SITE_ROUTES },
  },
});
