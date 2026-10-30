export const DEFAULT_SITE_URL = 'https://toolifybox.aliveradar.com';

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
  '/tools/remove-pdf-pages',
  '/tools/rotate-pdf',
  '/tools/flatten-pdf',
  '/tools/extract-ocr',
  '/tools/image-collage',
  '/tools/translate-pdf',
  '/tools/watermark-pdf',
  '/tools/create-pdf',
  '/tools/add-page-numbers',
  '/tools/crop-pdf',
  '/tools/compare-pdf',
  '/tools/html-to-pdf',
  '/tools/convert-image',
  '/tools/image-to-svg',
  '/tools/json-to-csv',
];

export function normalizeSiteUrl(value = DEFAULT_SITE_URL) {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const parsed = new URL(candidate);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('SITE_URL must use http or https.');
  return parsed.origin;
}
