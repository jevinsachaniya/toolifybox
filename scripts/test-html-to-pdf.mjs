import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HTML_PAGE_SIZES,
  HTML_PAGE_MARGINS,
  HTML_TEMPLATES,
  validateHtmlInput,
  htmlToPdfFilename,
  combineHtmlAndCss,
  convertHtmlToPdf,
} from '../app/utils/html-to-pdf.js';

test('validateHtmlInput validates HTML and CSS strings correctly', () => {
  assert.equal(validateHtmlInput(''), 'Please enter HTML code to convert to PDF.');
  assert.equal(validateHtmlInput('   '), 'Please enter HTML code to convert to PDF.');
  assert.equal(validateHtmlInput(null), 'Please enter HTML code to convert to PDF.');
  assert.equal(validateHtmlInput('<h1>Hello</h1>', ''), '');
  assert.equal(validateHtmlInput('<h1>Hello</h1>', 'h1 { color: red; }'), '');
});

test('htmlToPdfFilename creates clean, safe filenames', () => {
  assert.equal(htmlToPdfFilename('my-report.html'), 'my-report.pdf');
  assert.equal(htmlToPdfFilename('Quarterly Earnings 2026!'), 'quarterly-earnings-2026.pdf');
  assert.equal(htmlToPdfFilename('', 'custom-doc'), 'custom-doc.pdf');
  assert.equal(htmlToPdfFilename('invoice.pdf'), 'invoice.pdf');
});

test('HTML_PAGE_SIZES and HTML_PAGE_MARGINS contain standard paper formats', () => {
  assert.ok(HTML_PAGE_SIZES.a4 && HTML_PAGE_SIZES.a4.width > 500);
  assert.ok(HTML_PAGE_SIZES.letter && HTML_PAGE_SIZES.letter.width > 600);
  assert.ok(HTML_PAGE_SIZES.legal && HTML_PAGE_SIZES.legal.height > 1000);
  assert.ok(HTML_PAGE_SIZES.a3 && HTML_PAGE_SIZES.a5);

  assert.ok(HTML_PAGE_MARGINS.none && HTML_PAGE_MARGINS.none.pt === 0);
  assert.ok(HTML_PAGE_MARGINS.standard && HTML_PAGE_MARGINS.standard.pt > 20);
});

test('HTML_TEMPLATES contains 5 rich pre-built templates', () => {
  assert.equal(HTML_TEMPLATES.length, 5);
  const ids = HTML_TEMPLATES.map(t => t.id);
  assert.ok(ids.includes('invoice'));
  assert.ok(ids.includes('resume'));
  assert.ok(ids.includes('report'));
  assert.ok(ids.includes('certificate'));
  assert.ok(ids.includes('blank'));

  for (const tpl of HTML_TEMPLATES) {
    assert.ok(tpl.html && tpl.html.length > 50, `Template ${tpl.id} has empty HTML`);
    assert.ok(tpl.css && tpl.css.length > 30, `Template ${tpl.id} has empty CSS`);
    assert.ok(tpl.name && tpl.orientation && tpl.pageSize);
  }
});

test('combineHtmlAndCss merges style block into full document head', () => {
  const fullHtml = '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hi</h1></body></html>';
  const customCss = 'h1 { color: blue; }';
  const combined = combineHtmlAndCss(fullHtml, customCss, { pageSize: 'a4', orientation: 'portrait' });
  assert.ok(combined.includes('<style id="toolifybox-custom-css">'));
  assert.ok(combined.includes('h1 { color: blue; }'));
  assert.ok(combined.includes('@page'));
});

test('combineHtmlAndCss wraps partial HTML in HTML5 boilerplate', () => {
  const snippet = '<div class="card"><h2>Card Title</h2></div>';
  const css = '.card { border: 1px solid #ccc; }';
  const combined = combineHtmlAndCss(snippet, css, { title: 'Card Demo' });
  assert.ok(combined.includes('<!DOCTYPE html>'));
  assert.ok(combined.includes('<title>Card Demo</title>'));
  assert.ok(combined.includes('.card { border: 1px solid #ccc; }'));
  assert.ok(combined.includes('<div class="card"><h2>Card Title</h2></div>'));
});

test('convertHtmlToPdf generates valid PDF blob in test environment', async () => {
  const result = await convertHtmlToPdf({
    html: '<h1>Annual Summary</h1><p>Processed completely in memory.</p>',
    css: 'h1 { color: #0875fb; }',
    pageSize: 'a4',
    orientation: 'portrait',
    filename: 'annual-summary.pdf',
  });

  assert.ok(result);
  assert.equal(result.filename, 'annual-summary.pdf');
  assert.equal(result.pageCount, 1);
  assert.ok(result.blob && result.blob.size > 200, 'PDF blob must have content');
});

test('convertHtmlToPdf handles cancellation with AbortController cleanly', async () => {
  const controller = new AbortController();
  controller.abort();

  await assert.rejects(
    convertHtmlToPdf({
      html: '<h1>Will Cancel</h1>',
      signal: controller.signal,
    }),
    { name: 'AbortError' }
  );
});
