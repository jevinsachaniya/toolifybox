import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HTML_IMAGE_FORMATS,
  HTML_IMAGE_SCALES,
  HTML_IMAGE_VIEWPORTS,
  HTML_IMAGE_TEMPLATES,
  combineHtmlAndCss,
  htmlToImageFilename,
  validateHtmlInput,
} from '../app/utils/html-to-image.js';

test('validateHtmlInput validates HTML strings correctly', () => {
  assert.equal(validateHtmlInput('').valid, false);
  assert.equal(validateHtmlInput('   \n  \t ').valid, false);
  assert.equal(validateHtmlInput(null).valid, false);
  assert.equal(validateHtmlInput('<div>Hello World</div>').valid, true);
});

test('htmlToImageFilename creates clean, safe filenames for PNG, JPG, WebP', () => {
  assert.equal(htmlToImageFilename('my page.html', 'png'), 'my_page.png');
  assert.equal(htmlToImageFilename('banner:test?.htm', 'jpg'), 'banner_test_.jpg');
  assert.equal(htmlToImageFilename('invoice', 'webp'), 'invoice.webp');
  assert.equal(htmlToImageFilename('', 'png'), 'document.png');
});

test('HTML_IMAGE_FORMATS defines PNG, JPG, WebP with correct MIME types', () => {
  assert.equal(HTML_IMAGE_FORMATS.length, 3);
  const png = HTML_IMAGE_FORMATS.find(f => f.id === 'png');
  assert.ok(png);
  assert.equal(png.mime, 'image/png');
  assert.equal(png.supportsAlpha, true);

  const jpg = HTML_IMAGE_FORMATS.find(f => f.id === 'jpg');
  assert.ok(jpg);
  assert.equal(jpg.mime, 'image/jpeg');
  assert.equal(jpg.supportsAlpha, false);

  const webp = HTML_IMAGE_FORMATS.find(f => f.id === 'webp');
  assert.ok(webp);
  assert.equal(webp.mime, 'image/webp');
  assert.equal(webp.supportsAlpha, true);
});

test('HTML_IMAGE_TEMPLATES contains 4 rich pre-built templates', () => {
  assert.equal(HTML_IMAGE_TEMPLATES.length, 4);
  for (const tmpl of HTML_IMAGE_TEMPLATES) {
    assert.ok(tmpl.id);
    assert.ok(tmpl.name);
    assert.ok(tmpl.html.length > 50);
    assert.ok(tmpl.css.length > 50);
  }
});

test('combineHtmlAndCss wraps partial HTML in HTML5 boilerplate with style tag', () => {
  const html = '<div class="card"><h1>Title</h1></div>';
  const css = '.card { color: red; }';
  const result = combineHtmlAndCss(html, css, {
    title: 'Test Image',
    backgroundColor: '#ffffff',
    viewportWidth: 800,
  });

  assert.ok(result.includes('<!DOCTYPE html>'));
  assert.ok(result.includes('<title>Test Image</title>'));
  assert.ok(result.includes('<style id="wemakepdf-custom-css">'));
  assert.ok(result.includes('.card { color: red; }'));
  assert.ok(result.includes('width: 800px;'));
  assert.ok(result.includes('background-color: #ffffff;'));
  assert.ok(result.includes('<div class="card"><h1>Title</h1></div>'));
});

test('combineHtmlAndCss preserves full HTML documents and injects CSS into head', () => {
  const fullDoc = '<!DOCTYPE html><html><head><title>Old</title></head><body><p>Test</p></body></html>';
  const css = 'p { font-size: 20px; }';
  const result = combineHtmlAndCss(fullDoc, css);

  assert.ok(result.includes('<style id="wemakepdf-custom-css">'));
  assert.ok(result.includes('p { font-size: 20px; }'));
  assert.ok(result.includes('</head>'));
  assert.ok(result.includes('<p>Test</p>'));
});

