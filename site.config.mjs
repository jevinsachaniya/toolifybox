export const DEFAULT_SITE_URL = 'https://toolifybox.netlify.app';

export const SITE_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms-and-conditions',
  '/tools',
  '/tools/word-to-pdf',
  '/tools/powerpoint-to-pdf',
  '/tools/excel-to-pdf',
  '/tools/pdf-to-word',
  '/tools/pdf-to-jpg',
  '/tools/pdf-to-images',
  '/tools/images-to-pdf',
  '/tools/merge-pdf',
  '/tools/split-pdf',
  '/tools/compress-pdf',
  '/tools/compress-image',
  '/tools/protect-pdf',
  '/tools/unlock-pdf',
];

export function normalizeSiteUrl(value = DEFAULT_SITE_URL) {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const parsed = new URL(candidate);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('SITE_URL must use http or https.');
  return parsed.origin;
}
