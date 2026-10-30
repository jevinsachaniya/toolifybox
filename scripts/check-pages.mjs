import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEFAULT_SITE_URL, normalizeSiteUrl, SITE_ROUTES } from '../site.config.mjs';
import { SITE_VERSION } from '../site.version.mjs';

const siteUrl = normalizeSiteUrl(process.env.SITE_URL || process.env.URL || DEFAULT_SITE_URL);

const html = await readFile(new URL('../.output/public/index.html', import.meta.url), 'utf8').catch(() => { throw new Error('Run npm run build before checking the generated page.'); });
const toolsHtml = await readFile(new URL('../.output/public/tools/index.html', import.meta.url), 'utf8');
const wordToPdfHtml = await readFile(new URL('../.output/public/tools/word-to-pdf/index.html', import.meta.url), 'utf8');
const powerpointToPdfHtml = await readFile(new URL('../.output/public/tools/powerpoint-to-pdf/index.html', import.meta.url), 'utf8');
const excelToPdfHtml = await readFile(new URL('../.output/public/tools/excel-to-pdf/index.html', import.meta.url), 'utf8');
const pdfToWordHtml = await readFile(new URL('../.output/public/tools/pdf-to-word/index.html', import.meta.url), 'utf8');
const pdfToJpgHtml = await readFile(new URL('../.output/public/tools/pdf-to-jpg/index.html', import.meta.url), 'utf8');
const pdfToImagesHtml = await readFile(new URL('../.output/public/tools/pdf-to-images/index.html', import.meta.url), 'utf8');
const imagesToPdfHtml = await readFile(new URL('../.output/public/tools/images-to-pdf/index.html', import.meta.url), 'utf8');
const mergePdfHtml = await readFile(new URL('../.output/public/tools/merge-pdf/index.html', import.meta.url), 'utf8');
const splitPdfHtml = await readFile(new URL('../.output/public/tools/split-pdf/index.html', import.meta.url), 'utf8');
const compressPdfHtml = await readFile(new URL('../.output/public/tools/compress-pdf/index.html', import.meta.url), 'utf8');
const compressImageHtml = await readFile(new URL('../.output/public/tools/compress-image/index.html', import.meta.url), 'utf8');
const protectPdfHtml = await readFile(new URL('../.output/public/tools/protect-pdf/index.html', import.meta.url), 'utf8');
const unlockPdfHtml = await readFile(new URL('../.output/public/tools/unlock-pdf/index.html', import.meta.url), 'utf8');
const removePdfPagesHtml = await readFile(new URL('../.output/public/tools/remove-pdf-pages/index.html', import.meta.url), 'utf8');
const rotatePdfHtml = await readFile(new URL('../.output/public/tools/rotate-pdf/index.html', import.meta.url), 'utf8');
const flattenPdfHtml = await readFile(new URL('../.output/public/tools/flatten-pdf/index.html', import.meta.url), 'utf8');
const extractOcrHtml = await readFile(new URL('../.output/public/tools/extract-ocr/index.html', import.meta.url), 'utf8');
const imageCollageHtml = await readFile(new URL('../.output/public/tools/image-collage/index.html', import.meta.url), 'utf8');
const translatePdfHtml = await readFile(new URL('../.output/public/tools/translate-pdf/index.html', import.meta.url), 'utf8');
const watermarkPdfHtml = await readFile(new URL('../.output/public/tools/watermark-pdf/index.html', import.meta.url), 'utf8');
const createPdfHtml = await readFile(new URL('../.output/public/tools/create-pdf/index.html', import.meta.url), 'utf8');
const addPageNumbersHtml = await readFile(new URL('../.output/public/tools/add-page-numbers/index.html', import.meta.url), 'utf8');
const cropPdfHtml = await readFile(new URL('../.output/public/tools/crop-pdf/index.html', import.meta.url), 'utf8');
const comparePdfHtml = await readFile(new URL('../.output/public/tools/compare-pdf/index.html', import.meta.url), 'utf8');
const htmlToPdfHtml = await readFile(new URL('../.output/public/tools/html-to-pdf/index.html', import.meta.url), 'utf8');
const convertImageHtml = await readFile(new URL('../.output/public/tools/convert-image/index.html', import.meta.url), 'utf8');
const imageToSvgHtml = await readFile(new URL('../.output/public/tools/image-to-svg/index.html', import.meta.url), 'utf8');
const jsonToCsvHtml = await readFile(new URL('../.output/public/tools/json-to-csv/index.html', import.meta.url), 'utf8');
const aboutHtml = await readFile(new URL('../.output/public/about/index.html', import.meta.url), 'utf8');
const contactHtml = await readFile(new URL('../.output/public/contact/index.html', import.meta.url), 'utf8');
const privacyHtml = await readFile(new URL('../.output/public/privacy-policy/index.html', import.meta.url), 'utf8');
const termsHtml = await readFile(new URL('../.output/public/terms-and-conditions/index.html', import.meta.url), 'utf8');
const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const toolsVisible = toolsHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const wordToPdfVisible = wordToPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const powerpointToPdfVisible = powerpointToPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const excelToPdfVisible = excelToPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const pdfToWordVisible = pdfToWordHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const pdfToJpgVisible = pdfToJpgHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const pdfToImagesVisible = pdfToImagesHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const imagesToPdfVisible = imagesToPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const mergePdfVisible = mergePdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const splitPdfVisible = splitPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const compressPdfVisible = compressPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const compressImageVisible = compressImageHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const protectPdfVisible = protectPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const unlockPdfVisible = unlockPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const removePdfPagesVisible = removePdfPagesHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const rotatePdfVisible = rotatePdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const flattenPdfVisible = flattenPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const extractOcrVisible = extractOcrHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const imageCollageVisible = imageCollageHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const translatePdfVisible = translatePdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const watermarkPdfVisible = watermarkPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const createPdfVisible = createPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const addPageNumbersVisible = addPageNumbersHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const cropPdfVisible = cropPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const comparePdfVisible = comparePdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const htmlToPdfVisible = htmlToPdfHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const convertImageVisible = convertImageHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const imageToSvgVisible = imageToSvgHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const jsonToCsvVisible = jsonToCsvHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const aboutVisible = aboutHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const contactVisible = contactHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const privacyVisible = privacyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const termsVisible = termsHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
for (const anchor of ['main', 'how-it-works', 'questions']) assert.ok(visible.includes(`id="${anchor}"`), `Missing ${anchor} section`);
assert.ok(!visible.includes('id="converter"'), 'Converter should not appear on the Home page');
assert.ok(visible.includes('href="/tools"') && visible.includes('Explore tools'));
assert.ok(toolsVisible.includes('id="catalog"'));
assert.ok(toolsVisible.includes('Explore Document Utilities'));
assert.ok(toolsVisible.includes('href="/tools/word-to-pdf"'), 'Word to PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/powerpoint-to-pdf"'), 'PowerPoint to PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/excel-to-pdf"'), 'Excel to PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/pdf-to-word"'), 'PDF to Word tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/pdf-to-jpg"'), 'PDF to JPG tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/pdf-to-images"'), 'PDF to Images tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/images-to-pdf"'), 'Images to PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/merge-pdf"'), 'Merge PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/split-pdf"'), 'Split PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/compress-pdf"'), 'Compress PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/compress-image"'), 'Compress Image tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/protect-pdf"'), 'Protect PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/unlock-pdf"'), 'Unlock PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/remove-pdf-pages"'), 'Remove PDF Pages tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/rotate-pdf"'), 'Rotate PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/flatten-pdf"'), 'Flatten PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/extract-ocr"'), 'Extract OCR Text tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/create-pdf"'), 'Create PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/add-page-numbers"'), 'Add Page Numbers tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/crop-pdf"'), 'Crop PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/compare-pdf"'), 'Compare PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/html-to-pdf"'), 'HTML to PDF tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/convert-image"'), 'Convert Image tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/image-to-svg"'), 'Image to SVG tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('href="/tools/json-to-csv"'), 'JSON to CSV tool card must link to its dedicated page');
assert.ok(toolsVisible.includes('No document uploads'));
assert.ok(!toolsVisible.includes('Our server') && !toolsVisible.includes('sent to this website'));
assert.equal((visible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((toolsVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((wordToPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((powerpointToPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((excelToPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((pdfToWordVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((pdfToJpgVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((pdfToImagesVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((imagesToPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((mergePdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((splitPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((compressPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((compressImageVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((protectPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((unlockPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((removePdfPagesVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((rotatePdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((flattenPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((extractOcrVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((imageCollageVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((createPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((addPageNumbersVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((cropPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((comparePdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((htmlToPdfVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((convertImageVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((imageToSvgVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((jsonToCsvVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((aboutVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((contactVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((privacyVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.equal((termsVisible.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
assert.ok(wordToPdfVisible.includes('id="converter"') && wordToPdfVisible.includes('Convert Word'));
assert.ok(powerpointToPdfVisible.includes('id="converter"') && powerpointToPdfVisible.includes('PowerPoint'));
assert.ok(powerpointToPdfVisible.includes('Choose PowerPoint file'));
assert.ok(excelToPdfVisible.includes('id="converter"') && excelToPdfVisible.includes('Excel'));
assert.ok(excelToPdfVisible.includes('Choose Excel file'));
assert.ok(pdfToWordVisible.includes('id="converter"') && pdfToWordVisible.includes('Convert PDF'));
assert.ok(wordToPdfVisible.includes('Choose Word file'));
assert.ok(pdfToWordVisible.includes('Choose PDF file'));
assert.ok(pdfToJpgVisible.includes('id="converter"') && pdfToJpgVisible.includes('PDF to JPG'));
assert.ok(pdfToJpgVisible.includes('Choose PDF file') && pdfToJpgVisible.includes('Select pages'));
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
assert.ok(protectPdfVisible.includes('id="converter"') && protectPdfVisible.includes('Protect PDF'));
assert.ok(unlockPdfVisible.includes('id="converter"') && unlockPdfVisible.includes('Unlock PDF'));
assert.ok(removePdfPagesVisible.includes('id="converter"') && removePdfPagesVisible.includes('Remove PDF Pages'));
assert.ok(rotatePdfVisible.includes('id="converter"') && rotatePdfVisible.includes('Rotate PDF'));
assert.ok(flattenPdfVisible.includes('id="converter"') && flattenPdfVisible.includes('Flatten PDF'));
assert.ok(extractOcrVisible.includes('id="converter"') && extractOcrVisible.includes('Extract OCR Text'));
assert.ok(imageCollageVisible.includes('id="converter"') && imageCollageVisible.includes('Make Image Collage'));
assert.ok(translatePdfVisible.includes('id="converter"') && (translatePdfVisible.includes('Translate PDF') || translatePdfVisible.includes('PDF Language Translator')));
assert.ok(watermarkPdfVisible.includes('id="converter"') && watermarkPdfVisible.includes('Watermark PDF'));
assert.ok(createPdfVisible.includes('id="converter"') && createPdfVisible.includes('Create PDF'));
assert.ok(addPageNumbersVisible.includes('id="converter"') && addPageNumbersVisible.includes('Add Page Numbers'));
assert.ok(cropPdfVisible.includes('id="converter"') && cropPdfVisible.includes('Crop PDF'));
assert.ok(comparePdfVisible.includes('id="converter"') && comparePdfVisible.includes('Compare PDF'));
assert.ok(htmlToPdfVisible.includes('id="converter"') && htmlToPdfVisible.includes('Convert HTML to PDF'));
assert.ok(convertImageVisible.includes('id="converter"') && convertImageVisible.includes('Convert Image'));
assert.ok(imageToSvgVisible.includes('id="converter"') && imageToSvgVisible.includes('Convert images to SVG'));
assert.ok(jsonToCsvVisible.includes('id="converter"') && jsonToCsvVisible.includes('Convert JSON to CSV'));
assert.ok((visible.match(/<details(?:\s[^>]*)?>/g) || []).length >= 4, 'FAQ details count must be at least 4');
for (const removed of ['My favorites', 'Image resizer', 'JSON formatter']) assert.ok(!visible.includes(removed) && !toolsVisible.includes(removed), `Removed feature still visible: ${removed}`);
assert.ok(!visible.includes('undefined') && !toolsVisible.includes('undefined'));
const generatedPages = [html, aboutHtml, contactHtml, privacyHtml, termsHtml, toolsHtml, wordToPdfHtml, powerpointToPdfHtml, excelToPdfHtml, pdfToWordHtml, pdfToJpgHtml, pdfToImagesHtml, imagesToPdfHtml, mergePdfHtml, splitPdfHtml, compressPdfHtml, compressImageHtml, protectPdfHtml, unlockPdfHtml, removePdfPagesHtml, rotatePdfHtml, flattenPdfHtml, extractOcrHtml, imageCollageHtml, translatePdfHtml, watermarkPdfHtml, createPdfHtml, addPageNumbersHtml, cropPdfHtml, comparePdfHtml, htmlToPdfHtml, convertImageHtml, imageToSvgHtml, jsonToCsvHtml];
const visiblePages = [visible, aboutVisible, contactVisible, privacyVisible, termsVisible, toolsVisible, wordToPdfVisible, powerpointToPdfVisible, excelToPdfVisible, pdfToWordVisible, pdfToJpgVisible, pdfToImagesVisible, imagesToPdfVisible, mergePdfVisible, splitPdfVisible, compressPdfVisible, compressImageVisible, protectPdfVisible, unlockPdfVisible, removePdfPagesVisible, rotatePdfVisible, flattenPdfVisible, extractOcrVisible, imageCollageVisible, translatePdfVisible, watermarkPdfVisible, createPdfVisible, addPageNumbersVisible, cropPdfVisible, comparePdfVisible, htmlToPdfVisible, convertImageVisible, imageToSvgVisible, jsonToCsvVisible];
assert.ok(generatedPages.every(page => page.includes('id="__nuxt"')), 'Missing Nuxt application');
assert.ok(visiblePages.every(page => page.includes('class="theme-toggle"') && page.includes('Switch to dark theme')), 'Every page must include the theme switch');
assert.ok(visiblePages.every(page => page.includes('class="site-version"') && page.includes(`v${SITE_VERSION}`)), 'Every page must include the configured site version');
assert.ok(!visible.includes('motion-toggle') && !visible.includes('Motion on') && !visible.includes('Motion off'), 'Motion control must be removed');
assert.ok(visiblePages.every(page => page.includes('class="brand-mark"') && page.includes('class="brand-name"')), 'Every page must use the We Make PDF brand logo');
assert.ok(visiblePages.every(page => page.includes('class="footer-links"') && page.includes('href="/about"') && page.includes('href="/contact"')), 'Every page must link to About and Contact in the footer');
assert.ok(visiblePages.every(page => page.includes('href="/privacy-policy"') && page.includes('href="/terms-and-conditions"')), 'Every page must link to the legal pages');
assert.ok(visiblePages.every(page => page.includes('class="mobile-menu-toggle"') && page.includes('aria-label="Open navigation menu"')), 'Every page must include the mobile hamburger navigation');
assert.ok(visiblePages.every(page => page.includes('class="footer-links footer-tools"') && page.includes('href="/tools/word-to-pdf"') && page.includes('href="/tools/powerpoint-to-pdf"') && page.includes('href="/tools/excel-to-pdf"') && page.includes('href="/tools/pdf-to-word"') && page.includes('href="/tools/pdf-to-jpg"') && page.includes('href="/tools/pdf-to-images"') && page.includes('href="/tools/images-to-pdf"') && page.includes('href="/tools/merge-pdf"') && page.includes('href="/tools/split-pdf"') && page.includes('href="/tools/remove-pdf-pages"') && page.includes('href="/tools/rotate-pdf"') && page.includes('href="/tools/flatten-pdf"') && page.includes('href="/tools/extract-ocr"') && page.includes('href="/tools/image-collage"') && page.includes('href="/tools/translate-pdf"') && page.includes('href="/tools/watermark-pdf"') && page.includes('href="/tools/create-pdf"') && page.includes('href="/tools/add-page-numbers"') && page.includes('href="/tools/crop-pdf"') && page.includes('href="/tools/compare-pdf"') && page.includes('href="/tools/html-to-pdf"') && page.includes('href="/tools/convert-image"') && page.includes('href="/tools/image-to-svg"') && page.includes('href="/tools/json-to-csv"') && page.includes('href="/tools/compress-pdf"') && page.includes('href="/tools/compress-image"') && page.includes('href="/tools/protect-pdf"') && page.includes('href="/tools/unlock-pdf"')), 'Every page footer must link to all active converters');
assert.ok(toolsVisible.includes('id="tool-search"') && toolsVisible.includes('Search tools') && toolsVisible.includes('Search Word, PDF, image or OCR tools'), 'Tools page search is missing');
assert.ok((aboutVisible.includes('About We Make PDF') || aboutVisible.includes('About Toolifybox')) && aboutVisible.includes('Your file stays in your browser') && aboutVisible.includes('focused browser tools'), 'About page content is incomplete');
assert.ok(contactVisible.includes('Tell us how we') && contactVisible.includes('name="contact"') && contactVisible.includes('data-netlify="true"'), 'Contact page or Netlify form markup is incomplete');
assert.ok(contactVisible.includes('name="form-name"') && contactVisible.includes('netlify-honeypot="bot-field"'), 'Contact form must include Netlify detection and spam protection fields');
assert.ok(privacyVisible.includes('Privacy overview') && privacyVisible.includes('toolifybox-theme') && privacyVisible.includes('Netlify Privacy Statement'), 'Privacy Policy content is incomplete');
assert.ok(termsVisible.includes('Acceptance of these terms') && termsVisible.includes('Permitted and prohibited use') && termsVisible.includes('Conversion results and accuracy'), 'Terms and Conditions content is incomplete');
assert.ok(html.includes('property="og:image"') && (html.includes('/brand/wemakepdf-social.svg') || html.includes('/brand/toolifybox-social.png')), 'Missing Open Graph logo preview');
assert.ok(html.includes('name="twitter:card"') && html.includes('summary_large_image'), 'Missing Twitter card metadata');
assert.ok(html.includes('application/ld+json') && (html.includes('wemakepdf-logo.svg') || html.includes('toolifybox-logo.svg')), 'Missing structured website logo data');
assert.ok((html.includes('wemakepdf-theme') || html.includes('toolifybox-theme')) && html.includes("dataset.theme='light'"), 'Theme must be restored before the page paints and default to light');

const pageRecords = [
  ['/', html],
  ['/about', aboutHtml],
  ['/contact', contactHtml],
  ['/privacy-policy', privacyHtml],
  ['/terms-and-conditions', termsHtml],
  ['/tools', toolsHtml],
  ['/tools/word-to-pdf', wordToPdfHtml],
  ['/tools/powerpoint-to-pdf', powerpointToPdfHtml],
  ['/tools/excel-to-pdf', excelToPdfHtml],
  ['/tools/pdf-to-word', pdfToWordHtml],
  ['/tools/pdf-to-jpg', pdfToJpgHtml],
  ['/tools/pdf-to-images', pdfToImagesHtml],
  ['/tools/images-to-pdf', imagesToPdfHtml],
  ['/tools/merge-pdf', mergePdfHtml],
  ['/tools/split-pdf', splitPdfHtml],
  ['/tools/remove-pdf-pages', removePdfPagesHtml],
  ['/tools/compress-pdf', compressPdfHtml],
  ['/tools/compress-image', compressImageHtml],
  ['/tools/protect-pdf', protectPdfHtml],
  ['/tools/unlock-pdf', unlockPdfHtml],
  ['/tools/rotate-pdf', rotatePdfHtml],
  ['/tools/flatten-pdf', flattenPdfHtml],
  ['/tools/extract-ocr', extractOcrHtml],
  ['/tools/image-collage', imageCollageHtml],
  ['/tools/translate-pdf', translatePdfHtml],
  ['/tools/watermark-pdf', watermarkPdfHtml],
  ['/tools/create-pdf', createPdfHtml],
  ['/tools/add-page-numbers', addPageNumbersHtml],
  ['/tools/crop-pdf', cropPdfHtml],
  ['/tools/compare-pdf', comparePdfHtml],
  ['/tools/html-to-pdf', htmlToPdfHtml],
  ['/tools/convert-image', convertImageHtml],
  ['/tools/image-to-svg', imageToSvgHtml],
  ['/tools/json-to-csv', jsonToCsvHtml],
];
const titles = [];
const descriptions = [];
for (const [route, page] of pageRecords) {
  const canonical = new URL(route, `${siteUrl}/`).href;
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
await readFile(new URL('../.output/public/brand/wemakepdf-logo.svg', import.meta.url));
const socialImage = await readFile(new URL('../.output/public/brand/wemakepdf-social.svg', import.meta.url));
assert.ok(socialImage.length > 500, 'Social preview image is missing or unexpectedly small');
const sitemap = await readFile(new URL('../.output/public/sitemap.xml', import.meta.url), 'utf8');
const robots = await readFile(new URL('../.output/public/robots.txt', import.meta.url), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)].map(match => new URL(match[1]));
assert.equal(sitemapUrls.length, SITE_ROUTES.length, 'Sitemap route count does not match the active site routes');
assert.deepEqual(sitemapUrls.map(url => url.pathname.replace(/\/$/, '') || '/'), SITE_ROUTES, 'Sitemap routes are incomplete or out of order');
assert.ok(robots.includes('User-agent: *') && robots.includes('Allow: /'), 'robots.txt must allow public crawling');
assert.ok(robots.includes(`Sitemap: ${sitemapUrls[0].origin}/sitemap.xml`), 'robots.txt sitemap URL does not match sitemap.xml');
console.log('Generated Nuxt pages pass: landing, tool catalog, dedicated converter routes, light/dark theme controls, navigation, privacy, and static fallback checks.');
