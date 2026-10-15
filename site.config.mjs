export const DEFAULT_SITE_URL = 'https://toolifybox.netlify.app';

export const SITE_ROUTES = [
  '/',
  '/tools',
  '/tools/word-to-pdf',
  '/tools/pdf-to-word',
  '/tools/pdf-to-images',
];

export function normalizeSiteUrl(value = DEFAULT_SITE_URL) {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const parsed = new URL(candidate);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('SITE_URL must use http or https.');
  return parsed.origin;
}
