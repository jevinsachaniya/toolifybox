import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SITE_URL, normalizeSiteUrl, SITE_ROUTES } from '../site.config.mjs';

const publicDirectory = fileURLToPath(new URL('../public/', import.meta.url));
const siteUrl = normalizeSiteUrl(process.env.SITE_URL || process.env.URL || DEFAULT_SITE_URL);
const escapeXml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITE_ROUTES.map(route => `  <url><loc>${escapeXml(new URL(route, `${siteUrl}/`).href)}</loc></url>`).join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

await mkdir(publicDirectory, { recursive: true });
await Promise.all([
  writeFile(new URL('../public/sitemap.xml', import.meta.url), sitemap, 'utf8'),
  writeFile(new URL('../public/robots.txt', import.meta.url), robots, 'utf8'),
]);

console.log(`Generated sitemap.xml and robots.txt for ${siteUrl}`);
