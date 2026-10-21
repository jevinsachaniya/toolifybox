import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_DOCUMENT_SIZE, validateDocument, validatePdf, pdfFilename, wordFilename, formatSize, validatePowerpoint, powerpointPdfFilename, validateExcel, excelPdfFilename, protectedPdfFilename, unlockedPdfFilename } from '../app/utils/document.js';
import { paintedCharacters, editableItems, wordFont } from '../app/utils/pdf-text.js';
import JSZip from 'jszip';
import { validateDocxPackage, pageSliceEnd } from '../app/utils/docx-package.js';
import { runConversionTask } from '../app/utils/conversion-task.js';
import { wordPixels } from '../app/utils/pdf-pixels.js';
import { pdfImagesArchiveFilename, pdfJpgArchiveFilename, pdfPageImageFilename } from '../app/utils/pdf-images.js';
import { imagesPdfFilename, MAX_IMAGE_COUNT, MAX_TOTAL_IMAGE_SIZE, validateImages } from '../app/utils/images-pdf.js';
import { consolidateWordItems } from '../app/utils/convert-pdf.js';
import { needsOcrForDigitalText, resolveOcrLanguage } from '../app/utils/pdf-ocr.js';

test('Word uploads accept uppercase extensions and files at the 20 MB boundary', () => {
  assert.equal(validateDocument([{ name: 'Résumé.DOCX', size: MAX_DOCUMENT_SIZE }]), '');
  assert.ok(validateDocument([{ name: 'report.docx', size: MAX_DOCUMENT_SIZE + 1 }]).includes('20 MB'));
});
test('Reject unsupported files, empty documents and multiple dropped files', () => {
  assert.ok(validateDocument([{ name: 'old.doc', size: 100 }]).includes('.docx'));
  assert.ok(validateDocument([{ name: 'pretend.docx.pdf', size: 100 }]).includes('.docx'));
  assert.ok(validateDocument([{ name: 'empty.docx', size: 0 }]).includes('empty'));
  assert.ok(validateDocument([{ name: 'one.docx', size: 100 }, { name: 'two.docx', size: 100 }]).includes('one Word'));
});
test('Downloads retain the document name and readable size', () => {
  assert.equal(pdfFilename('Résumé.final.DOCX'), 'Résumé.final.pdf');
  assert.equal(formatSize(512), '1 KB');
  assert.equal(formatSize(1024 * 1024), '1.0 MB');
});

test('PDF uploads validate type, count, size, and keep Unicode download names', () => {
  assert.equal(validatePdf([{ name: 'Résumé.PDF', size: MAX_DOCUMENT_SIZE }]), '');
  assert.match(validatePdf([{ name: 'fake.pdf.docx', size: 10 }]), /\.pdf/);
  assert.match(validatePdf([{ name: 'empty.pdf', size: 0 }]), /empty/);
  assert.match(validatePdf([{ name: 'large.pdf', size: MAX_DOCUMENT_SIZE + 1 }]), /20 MB/);
  assert.match(validatePdf([{ name: 'one.pdf' }, { name: 'two.pdf' }]), /one PDF/);
  assert.equal(wordFilename('Résumé.final.PDF'), 'Résumé.final.docx');
  assert.equal(protectedPdfFilename('Secret.PDF'), 'Secret-protected.pdf');
  assert.equal(unlockedPdfFilename('Locked.PDF'), 'Locked-unlocked.pdf');
});

test('PowerPoint uploads validate type, count, size, and generate PDF filenames', () => {
  assert.equal(validatePowerpoint([{ name: 'Deck.PPTX', size: MAX_DOCUMENT_SIZE }]), '');
  assert.match(validatePowerpoint([{ name: 'old.ppt', size: 100 }]), /\.pptx/);
  assert.match(validatePowerpoint([{ name: 'empty.pptx', size: 0 }]), /empty/);
  assert.match(validatePowerpoint([{ name: 'large.pptx', size: MAX_DOCUMENT_SIZE + 1 }]), /20 MB/);
  assert.match(validatePowerpoint([{ name: 'one.pptx' }, { name: 'two.pptx' }]), /one PowerPoint/);
  assert.equal(powerpointPdfFilename('Quarterly.Results.PPTX'), 'Quarterly.Results.pdf');
});

test('Excel uploads validate type, count, size, and generate PDF filenames', () => {
  assert.equal(validateExcel([{ name: 'Accounts.XLSX', size: MAX_DOCUMENT_SIZE }]), '');
  assert.equal(validateExcel([{ name: 'Data.csv', size: 1000 }]), '');
  assert.match(validateExcel([{ name: 'old.xls', size: 100 }]), /\.xlsx/);
  assert.match(validateExcel([{ name: 'empty.xlsx', size: 0 }]), /empty/);
  assert.match(validateExcel([{ name: 'large.xlsx', size: MAX_DOCUMENT_SIZE + 1 }]), /20 MB/);
  assert.match(validateExcel([{ name: 'one.xlsx' }, { name: 'two.xlsx' }]), /one Excel/);
  assert.equal(excelPdfFilename('Quarterly.Budget.XLSX'), 'Quarterly.Budget.pdf');
  assert.equal(excelPdfFilename('Report.csv'), 'Report.pdf');
});

test('PDF page images use ordered, Unicode-safe download names', () => {
  assert.equal(pdfPageImageFilename('Résumé.final.PDF', 3, 12, 'png'), 'Résumé.final-page-03.png');
  assert.equal(pdfPageImageFilename('report.pdf', 100, 100, 'jpg'), 'report-page-100.jpg');
  assert.equal(pdfImagesArchiveFilename('Résumé.final.PDF'), 'Résumé.final-images.zip');
  assert.equal(pdfJpgArchiveFilename('Résumé.final.PDF'), 'Résumé.final-jpg.zip');
});

test('Image uploads validate supported formats, limits, and PDF names', () => {
  assert.equal(validateImages([{ name: 'photo.JPG', type: 'image/jpeg', size: 100 }, { name: 'graphic.webp', type: 'image/webp', size: 200 }]), '');
  assert.match(validateImages([{ name: 'vector.svg', type: 'image/svg+xml', size: 100 }]), /JPG, PNG, or WebP/);
  assert.match(validateImages([{ name: 'empty.png', type: 'image/png', size: 0 }]), /empty/);
  assert.match(validateImages([{ name: 'extra.png', type: 'image/png', size: 10 }], MAX_IMAGE_COUNT), /up to 50/);
  assert.match(validateImages([{ name: 'more.jpg', type: 'image/jpeg', size: 10 }], 1, MAX_TOTAL_IMAGE_SIZE), /larger than 100 MB/);
  assert.equal(imagesPdfFilename('Résumé.final.PNG'), 'Résumé.final-images.pdf');
});

test('Editable PDF text keeps color changes and restores colors after graphics state changes', () => {
  const OPS = { save: 10, restore: 11, setFillRGBColor: 59, showText: 44 };
  const ink = paintedCharacters({ fnArray: [59, 44, 10, 59, 44, 11, 44], argsArray: [
    ['#2563eb'], [[{ unicode: 'Blue' }]], [], ['#e11d48'], [[{ unicode: 'red' }]], [], [[{ unicode: 'blue' }]],
  ] }, OPS);
  const items = editableItems({ items: [{ str: 'Blue red blue' }] }, ink);
  assert.equal(items[0].runs.map(run => run.text).join(''), 'Blue red blue');
  assert.deepEqual(items[0].runs.filter(run => run.text.trim()).map(run => run.color), ['2563EB', 'E11D48', '2563EB']);
  assert.equal(editableItems({ items: [{ str: 'Missing characters' }] }, ink), null);
  assert.equal(wordFont('ABCDEF+Helvetica-Bold', 'sans-serif'), 'Arial');
  assert.equal(wordFont('Times-Roman'), 'Times New Roman');
  assert.equal(wordFont('CustomFont', '', 'नमस्ते'), 'Nirmala UI');
  assert.equal(wordFont('Mangal-Regular'), 'Nirmala UI');
  assert.equal(wordFont('CustomFont', '', 'નમસ્તે'), 'Nirmala UI');
  assert.equal(wordFont('Shruti-Regular'), 'Nirmala UI');
});

test('paintedCharacters extracts text from showSpacedText arrays with Devanagari unicode', () => {
  const OPS = { save: 10, restore: 11, setFillRGBColor: 59, showText: 44, showSpacedText: 45 };
  const ink = paintedCharacters({
    fnArray: [59, 45],
    argsArray: [
      ['#111827'],
      [[{ unicode: 'भारत' }, -20, { unicode: 'वर्ष' }]]
    ]
  }, OPS);
  assert.ok(ink);
  assert.equal(ink.map(c => c.char).join(''), 'भारतवर्ष');
  const items = editableItems({ items: [{ str: 'भारतवर्ष' }] }, ink);
  assert.ok(items);
  assert.equal(items[0].runs.map(r => r.text).join(''), 'भारतवर्ष');
});

test('Invisible OCR text and patterned text use the complete visual page', () => {
  const OPS = { setTextRenderingMode: 38, showText: 44, setFillColorN: 55 };
  assert.equal(paintedCharacters({ fnArray: [38, 44], argsArray: [[3], [[{ unicode: 'Hidden OCR' }]]] }, OPS), null);
  assert.equal(paintedCharacters({ fnArray: [55, 44], argsArray: [[], [[{ unicode: 'Pattern' }]]] }, OPS), null);
});

test('OCR samples colored letters separately from their page background', () => {
  const width = 24, height = 18;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const ink = x > 4 && x < 18 && y > 3 && y < 14;
    pixels.set(ink ? [83, 50, 179, 255] : [244, 240, 255, 255], (y * width + x) * 4);
  }
  const context = { canvas: { width, height }, getImageData: () => ({ data: pixels }) };
  const sampled = wordPixels(context, { x0: 1, y0: 1, x1: 22, y1: 16 });
  assert.equal(sampled.color, '5332B3');
  assert.equal(sampled.background, 'F4F0FF');
});

async function archive(entries) {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(entries)) zip.file(name, content);
  return zip.generateAsync({ type: 'arraybuffer' });
}

test('Accept a DOCX package and reject renamed ZIP files and corrupt archives', async () => {
  const data = await archive({ '[Content_Types].xml': '<Types/>', 'word/document.xml': '<document/>' });
  assert.doesNotThrow(() => validateDocxPackage(data));
  assert.throws(() => validateDocxPackage(new ArrayBuffer(12)), /valid/);
  const renamed = await archive({ 'unrelated.txt': 'not a Word document' });
  assert.throws(() => validateDocxPackage(renamed), /valid/);
  const corrupt = data.slice(0, data.byteLength - 10);
  assert.throws(() => validateDocxPackage(corrupt), /valid/);
});

test('Reject expanded archives that exceed the browser processing limit', async () => {
  const data = await archive({ '[Content_Types].xml': '<Types/>', 'word/document.xml': '<document/>' });
  const view = new DataView(data);
  for (let offset = 0; offset < data.byteLength - 46; offset++) {
    if (view.getUint32(offset, true) === 0x02014b50) { view.setUint32(offset + 24, 81 * 1024 * 1024, true); break; }
  }
  assert.throws(() => validateDocxPackage(data), /too large/);
});

test('Page boundaries keep a text line together and split oversized blocks safely', () => {
  assert.equal(pageSliceEnd(0, 1000, 2000, [[990, 1010]]), 990);
  assert.equal(pageSliceEnd(0, 1000, 2000, [[0, 1500]]), 1000);
  assert.equal(pageSliceEnd(1000, 1000, 1500, []), 1500);
});

test('A stalled conversion step times out instead of leaving the UI busy', async () => {
  await assert.rejects(runConversionTask(() => new Promise(() => {}), { timeout: 10, message: 'Rendering timed out' }), /Rendering timed out/);
});

test('Conversion cancellation stops waiting for pending work', async () => {
  const controller = new AbortController();
  const work = runConversionTask(() => new Promise(() => {}), { signal: controller.signal });
  controller.abort();
  await assert.rejects(work, { name: 'AbortError' });
  assert.equal(await runConversionTask(() => Promise.resolve('ready')), 'ready');
});

test('consolidateWordItems merges horizontal items on the same baseline to prevent frame collisions', () => {
  const items = [
    { transform: [12, 0, 0, -12, 50, 100], width: 40, size: 12, str: 'Hello', runs: [{ text: 'Hello', color: '000000' }] },
    { transform: [12, 0, 0, -12, 95, 100], width: 45, size: 12, str: 'World', runs: [{ text: 'World', color: '000000' }] },
    { transform: [12, 0, 0, -12, 50, 125], width: 80, size: 12, str: 'Second line', runs: [{ text: 'Second line', color: '000000' }] },
  ];
  const consolidated = consolidateWordItems(items, 612);
  assert.equal(consolidated.length, 2);
  assert.equal(consolidated[0].str, 'Hello World');
  assert.equal(consolidated[0].runs.map(r => r.text).join(''), 'Hello World');
  assert.equal(consolidated[1].str, 'Second line');
});

test('Smart OCR preserves readable digital text in its original language', () => {
  assert.equal(resolveOcrLanguage('auto'), 'eng+hin');
  assert.equal(resolveOcrLanguage('eng'), 'eng');
  assert.equal(resolveOcrLanguage('hin'), 'hin');
  assert.equal(needsOcrForDigitalText('Hello world'), false);
  assert.equal(needsOcrForDigitalText('नमस्ते भारत'), false);
  assert.equal(needsOcrForDigitalText('ગુજરાતી લખાણ'), false);
  assert.equal(needsOcrForDigitalText('\uE123\uE456'), true);
  assert.equal(needsOcrForDigitalText(''), true);
});
