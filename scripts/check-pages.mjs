import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SITE_ROUTES } from '../site.config.mjs';
import { SITE_VERSION } from '../site.version.mjs';

const html = await readFile(new URL('../.output/public/index.html', import.meta.url), 'utf8').catch(() => { throw new Error('Run npm run build before checking the generated page.'); });
const toolsHtml = await readFile(new URL('../.output/public/tools/index.html', import.meta.url), 'utf8');
const wordToPdfHtml = await readFile(new URL('../.output/public/tools/word-to-pdf/index.html', import.meta.url), 'utf8');
const pdfToWordHtml = await readFile(new URL('../.output/public/tools/pdf-to-word/index.html', import.meta.url), 'utf8');
const pdfToImagesHtml = await readFile(new URL('../.output/public/tools/pdf-to-images/index.html', import.meta.url), 'utf8');
const imagesToPdfHtml = await readFile(new URL('../.output/public/tools/images-to-pdf/index.html', import.meta.url), 'utf8');
const mergePdfHtml = await readFile(new URL('../.output/public/tools/merge-pdf/index.html', import.meta.url), 'utf8');
const splitPdfHtml = await readFile(new URL('../.output/public/tools/split-pdf/index.html', import.meta.url), 'utf8');
const compressPdfHtml = await readFile(new URL('../.output/public/tools/compress-pdf/index.html', import.meta.url), 'utf8');
const compressImageHtml = await readFile(new URL('../.output/public/tools/compress-image/index.html', import.meta.url), 'utf8');
const aboutHtml = await readFile(new URL('../.output/public/about/index.html', import.meta.url), 'utf8');
const contactHtml = await readFile(new URL('../.output/public/contact/index.html', import.meta.url), 'utf8');
const privacyHtml = await readFile(new URL('../.output/public/privacy-policy/index.html', import.meta.url), 'utf8');
const termsHtml = await readFile(new URL('../.output/public/terms-and-conditions/index.html', import.meta.url), 'utf8');
const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const toolsVisible = toolsHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const wordToPdfVisible = wordToPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const pdfToWordVisible = pdfToWordHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const pdfToImagesVisible = pdfToImagesHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const imagesToPdfVisible = imagesToPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const mergePdfVisible = mergePdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const splitPdfVisible = splitPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const compressPdfVisible = compressPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const compressImageVisible = compressImageHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const aboutVisible = aboutHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const contactVisible = contactHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const privacyVisible = privacyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const termsVisible = termsHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
for (const anchor of ['main', 'how-it-works', 'questions']) assert.ok(visible.includes(`id="${anchor}"`), `Missing ${anchor} section`);
assert.ok(!visible.includes('id="converter"'), 'Converter should only appear on the Tools page');
assert.ok(visible.includes('href="/tools"') && visible.includes('Explore tools'));
assert.ok(toolsVisible.includes('id="converter"'));
assert.ok(toolsVisible.includes('type="file"') && toolsVisible.includes('.docx'));
assert.ok(toolsVisible.includes('Choose Word file'));
assert.ok(toolsVisible.includes('PDF to Word') && toolsVisible.includes('PDF to editable Word'));
assert.ok(toolsVisible.includes('href="/tools/word-to-pdf"'), 'Word to PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/pdf-to-word"'), 'PDF to Word tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/pdf-to-images"'), 'PDF to Images tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/images-to-pdf"'), 'Images to PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/merge-pdf"'), 'Merge PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/split-pdf"'), 'Split PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/compress-pdf"'), 'Compress PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/compress-image"'), 'Compress Image tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('No document uploads'));
assert.ok(!toolsVisible.includes('Our server') && !toolsVisible.includes('sent to this website'));
assert.equal((visible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((toolsVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((wordToPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((pdfToWordVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((pdfToImagesVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((imagesToPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((mergePdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((splitPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((compressPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((compressImageVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((aboutVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((contactVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((privacyVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((termsVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.ok(wordToPdfVisible.includes('id="converter"') && wordToPdfVisible.includes('Convert Word'));
assert.ok(pdfToWordVisible.includes('id="converter"') && pdfToWordVisible.includes('Convert PDF'));
assert.ok(wordToPdfVisible.includes('Choose Word file'));
assert.ok(pdfToWordVisible.includes('Choose PDF file'));
assert.ok(pdfToImagesVisible.includes('id="converter"') && pdfToImagesVisible.includes('PDF to images converter'));
assert.ok(pdfToImagesVisible.includes('Choose PDF file') && pdfToImagesVisible.includes('Select pages'));
assert.ok(imagesToPdfVisible.includes('id="converter"') && imagesToPdfVisible.includes('Images to PDF converter'));
assert.ok(imagesToPdfVisible.includes('Choose images') && imagesToPdfVisible.includes('Maximum quality'));
assert.ok(mergePdfVisible.includes('id="converter"') && mergePdfVisible.includes('Merge PDF converter'));
assert.ok(mergePdfVisible.includes('Choose PDF files') && mergePdfVisible.includes('Preview Every Page'));
assert.ok(splitPdfVisible.includes('id="converter"') && splitPdfVisible.includes('Split PDF converter'));
assert.ok(splitPdfVisible.includes('Choose PDF file') && splitPdfVisible.includes('Multiple Split Points'));
assert.ok(compressPdfVisible.includes('id="converter"') && compressPdfVisible.includes('Compress PDF converter'));
assert.ok(compressPdfVisible.includes('Choose PDF file') && compressPdfVisible.includes('Exact Quality Mode') && compressPdfVisible.includes('Custom KB or MB Target'));
assert.ok(compressImageVisible.includes('id="converter"') && compressImageVisible.includes('Compress Image converter'));
assert.ok(compressImageVisible.includes('Choose image') && compressImageVisible.includes('Custom KB or MB Target') && compressImageVisible.includes('JPG, PNG or WebP'));
assert.equal((visible.match(/<details(?:\s[^>]*)?>/g) || []).length, 4);
for (const removed of ['My favorites', 'Image resizer', 'JSON formatter']) assert.ok(!visible.includes(removed) && !toolsVisible.includes(removed), `Removed feature still visible: ${removed}`);
assert.ok(!visible.includes('undefined') && !toolsVisible.includes('undefined'));
const generatedPages = [html, aboutHtml, contactHtml, privacyHtml, termsHtml, toolsHtml, wordToPdfHtml, pdfToWordHtml, pdfToImagesHtml, imagesToPdfHtml, mergePdfHtml, splitPdfHtml, compressPdfHtml, compressImageHtml];
const visiblePages = [visible, aboutVisible, contactVisible, privacyVisible, termsVisible, toolsVisible, wordToPdfVisible, pdfToWordVisible, pdfToImagesVisible, imagesToPdfVisible, mergePdfVisible, splitPdfVisible, compressPdfVisible, compressImageVisible];
assert.ok(generatedPages.every(page => page.includes('id="__nuxt"')), 'Missing Nuxt application');
assert.ok(visiblePages.every(page => page.includes('class="theme-toggle"') && page.includes('Switch to dark theme')), 'Every page must include the theme switch');
assert.ok(visiblePages.every(page => page.includes('class="site-version"') && page.includes(`v${SITE_VERSION}`)), 'Every page must include the configured site version');
assert.ok(!visible.includes('motion-toggle') && !visible.includes('Motion on') && !visible.includes('Motion off'), 'Motion control must be removed');
assert.ok(visiblePages.every(page => page.includes('class="brand-mark"') && page.includes('class="brand-name"')), 'Every page must use the Toolifybox brand logo');
assert.ok(visiblePages.every(page => page.includes('class="footer-links"') && page.includes('href="/about"') && page.includes('href="/contact"')), 'Every page must link to About and Contact in the footer');
assert.ok(visiblePages.every(page => page.includes('href="/privacy-policy"') && page.includes('href="/terms-and-conditions"')), 'Every page must link to the legal pages');
assert.ok(visiblePages.every(page => page.includes('class="mobile-menu-toggle"') && page.includes('aria-label="Open navigation menu"')), 'Every page must include the mobile hamburger navigation');
assert.ok(visiblePages.every(page => page.includes('class="footer-links footer-tools"') && page.includes('href="/tools/word-to-pdf"') && page.includes('href="/tools/pdf-to-word"') && page.includes('href="/tools/pdf-to-images"') && page.includes('href="/tools/images-to-pdf"') && page.includes('href="/tools/merge-pdf"') && page.includes('href="/tools/split-pdf"') && page.includes('href="/tools/compress-pdf"') && page.includes('href="/tools/compress-image"')), 'Every page footer must link to all active converters');
assert.ok(toolsVisible.includes('id="tool-search"') && toolsVisible.includes('Search tools') && toolsVisible.includes('Search Word, PDF, image or OCR tools'), 'Tools page search is missing');
assert.ok(aboutVisible.includes('About Toolifybox') && aboutVisible.includes('Your file stays in your browser') && aboutVisible.includes('Eight focused browser tools'), 'About page content is incomplete');
assert.ok(contactVisible.includes('Tell us how we') && contactVisible.includes('name="contact"') && contactVisible.includes('data-netlify="true"'), 'Contact page or Netlify form markup is incomplete');
assert.ok(contactVisible.includes('name="form-name"') && contactVisible.includes('netlify-honeypot="bot-field"'), 'Contact form must include Netlify detection and spam protection fields');
assert.ok(privacyVisible.includes('Privacy overview') && privacyVisible.includes('toolifybox-theme') && privacyVisible.includes('Netlify Privacy Statement'), 'Privacy Policy content is incomplete');
assert.ok(termsVisible.includes('Acceptance of these terms') && termsVisible.includes('Permitted and prohibited use') && termsVisible.includes('Conversion results and accuracy'), 'Terms and Conditions content is incomplete');
assert.ok(html.includes('property="og:image"') && html.includes('/brand/toolifybox-social.png'), 'Missing Open Graph logo preview');
assert.ok(html.includes('name="twitter:card"') && html.includes('summary_large_image'), 'Missing Twitter card metadata');
assert.ok(html.includes('application/ld+json') && html.includes('toolifybox-logo.svg'), 'Missing structured website logo data');
assert.ok(html.includes('toolifybox-theme') && html.includes("dataset.theme='light'"), 'Theme must be restored before the page paints and default to light');

const pageRecords = [
  ['/', html],
  ['/about', aboutHtml],
  ['/contact', contactHtml],
  ['/privacy-policy', privacyHtml],
  ['/terms-and-conditions', termsHtml],
  ['/tools', toolsHtml],
  ['/tools/word-to-pdf', wordToPdfHtml],
  ['/tools/pdf-to-word', pdfToWordHtml],
  ['/tools/pdf-to-images', pdfToImagesHtml],
  ['/tools/images-to-pdf', imagesToPdfHtml],
  ['/tools/merge-pdf', mergePdfHtml],
  ['/tools/split-pdf', splitPdfHtml],
  ['/tools/compress-pdf', compressPdfHtml],
  ['/tools/compress-image', compressImageHtml],
];
const titles = [];
const descriptions = [];
for (const [route, page] of pageRecords) {
  const canonical = new URL(route, 'https://toolifybox.netlify.app/').href;
  const title = page.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  const description = page.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert.ok(title && description, `Missing title or description for ${route}`);
  titles.push(title);
  descriptions.push(description);
  assert.ok(page.includes(`<link rel="canonical" href="${canonical}">`), `Missing canonical URL for ${route}`);
  assert.ok(page.includes(`<meta property="og:url" content="${canonical}">`), `Missing Open Graph URL for ${route}`);
  assert.ok(page.includes('name="robots" content="index, follow, max-image-preview:large'), `Missing indexable robots policy for ${route}`);
  assert.ok(page.includes('application/ld+json'), `Missing structured data for ${route}`);
}
assert.equal(new Set(titles).size, pageRecords.length, 'Every indexable page needs a unique title');
assert.equal(new Set(descriptions).size, pageRecords.length, 'Every indexable page needs a unique meta description');
await readFile(new URL('../.output/public/200.html', import.meta.url));
await readFile(new URL('../.output/public/favicon.svg', import.meta.url));
await readFile(new URL('../.output/public/brand/toolifybox-logo.svg', import.meta.url));
const socialImage = await readFile(new URL('../.output/public/brand/toolifybox-social.png', import.meta.url));
assert.ok(socialImage.length > 50_000, 'Social preview image is missing or unexpectedly small');
const sitemap = await readFile(new URL('../.output/public/sitemap.xml', import.meta.url), 'utf8');
const robots = await readFile(new URL('../.output/public/robots.txt', import.meta.url), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)].map(match => new URL(match[1]));
assert.equal(sitemapUrls.length, SITE_ROUTES.length, 'Sitemap route count does not match the active site routes');
assert.deepEqual(sitemapUrls.map(url => url.pathname.replace(/\/$/, '') || '/'), SITE_ROUTES, 'Sitemap routes are incomplete or out of order');
assert.ok(robots.includes('User-agent: *') && robots.includes('Allow: /'), 'robots.txt must allow public crawling');
assert.ok(robots.includes(`Sitemap: ${sitemapUrls[0].origin}/sitemap.xml`), 'robots.txt sitemap URL does not match sitemap.xml');
console.log('Generated Nuxt pages pass: landing, tool catalog, dedicated converter routes, light/dark theme controls, navigation, privacy, and static fallback checks.');
