import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_DOCUMENT_SIZE, validateDocument, validatePdf, pdfFilename, wordFilename, formatSize } from '../app/utils/document.js';
import { paintedCharacters, editableItems, wordFont } from '../app/utils/pdf-text.js';
import JSZip from 'jszip';
import { validateDocxPackage, pageSliceEnd } from '../app/utils/docx-package.js';
import { runConversionTask } from '../app/utils/conversion-task.js';
import { wordPixels } from '../app/utils/pdf-pixels.js';
import { pdfImagesArchiveFilename, pdfPageImageFilename } from '../app/utils/pdf-images.js';

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
});

test('PDF page images use ordered, Unicode-safe download names', () => {
  assert.equal(pdfPageImageFilename('Résumé.final.PDF', 3, 12, 'png'), 'Résumé.final-page-03.png');
  assert.equal(pdfPageImageFilename('report.pdf', 100, 100, 'jpg'), 'report-page-100.jpg');
  assert.equal(pdfImagesArchiveFilename('Résumé.final.PDF'), 'Résumé.final-images.zip');
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
