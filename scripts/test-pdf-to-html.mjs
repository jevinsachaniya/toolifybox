import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePdfForHtml,
  pdfToHtmlFilename,
  parseHtmlPageRange,
  escapeHtml,
  detectTextFormatting,
  linkifyText,
  detectTablesInItems,
  renderTableBlockToHtml,
  groupIntoSemanticBlocks,
  renderSemanticBlocksToHtml,
  renderFixedLayoutToHtml,
  generateStandaloneHtmlDocument,
  generateZipArchive,
  deduplicateRawItems,
} from '../app/utils/pdf-to-html.js';

test('validatePdfForHtml validates file inputs correctly', () => {
  assert.equal(validatePdfForHtml(null), 'Please select a PDF document to convert.');
  assert.equal(validatePdfForHtml([]), 'Please select a PDF document to convert.');
  assert.equal(validatePdfForHtml([{ name: 'a.pdf' }, { name: 'b.pdf' }]), 'Please choose one PDF document at a time.');
  assert.equal(validatePdfForHtml({ name: 'file.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 100 }), 'Please select a valid PDF file (.pdf).');
  assert.equal(validatePdfForHtml({ name: 'empty.pdf', type: 'application/pdf', size: 0 }), 'This file is empty. Please select a valid PDF document with content.');
  assert.equal(validatePdfForHtml({ name: 'huge.pdf', type: 'application/pdf', size: 65 * 1024 * 1024 }), 'This file exceeds the 60 MB size limit. Please select a smaller PDF file.');
  assert.equal(validatePdfForHtml({ name: 'contract.pdf', type: 'application/pdf', size: 1024 * 50 }), null);
});

test('pdfToHtmlFilename formats clean filenames', () => {
  assert.equal(pdfToHtmlFilename('Annual Report 2026.pdf'), 'Annual-Report-2026.html');
  assert.equal(pdfToHtmlFilename('Annual Report 2026.pdf', 'zip'), 'Annual-Report-2026.zip');
  assert.equal(pdfToHtmlFilename('', 'html'), 'converted-document.html');
  assert.equal(pdfToHtmlFilename('Document with special chars @#$%!.pdf'), 'Document-with-special-chars-.html');
});

test('parseHtmlPageRange accurately parses page ranges', () => {
  assert.deepEqual(parseHtmlPageRange('all', 5), [1, 2, 3, 4, 5]);
  assert.deepEqual(parseHtmlPageRange('odd', 5), [1, 3, 5]);
  assert.deepEqual(parseHtmlPageRange('even', 6), [2, 4, 6]);
  assert.deepEqual(parseHtmlPageRange('1-3, 5', 6), [1, 2, 3, 5]);
  assert.deepEqual(parseHtmlPageRange('4, 2, 8', 5), [2, 4]); // 8 is beyond 5
});

test('escapeHtml and detectTextFormatting work as expected', () => {
  assert.equal(escapeHtml('<script>alert("XSS & danger")</script>'), '&lt;script&gt;alert(&quot;XSS &amp; danger&quot;)&lt;/script&gt;');
  assert.deepEqual(detectTextFormatting('Helvetica-BoldItalic'), { isBold: true, isItalic: true, isMonospace: false });
  assert.deepEqual(detectTextFormatting('CourierNewPSMT'), { isBold: false, isItalic: false, isMonospace: true });
  assert.deepEqual(detectTextFormatting('Times-Roman'), { isBold: false, isItalic: false, isMonospace: false });
});

test('linkifyText converts URLs and emails to anchors', () => {
  const input = 'Visit https://toolifybox.aliveradar.com or contact support@toolifybox.com for info.';
  const output = linkifyText(input);
  assert.ok(output.includes('<a href="https://toolifybox.aliveradar.com" target="_blank" rel="noopener noreferrer">https://toolifybox.aliveradar.com</a>'));
  assert.ok(output.includes('<a href="mailto:support@toolifybox.com">support@toolifybox.com</a>'));
});

test('groupIntoSemanticBlocks and renderSemanticBlocksToHtml generate clean semantic tags', () => {
  const rawItems = [
    { str: 'Document Title', x: 50, y: 50, width: 200, height: 28, fontSize: 24, fontName: 'Arial-Bold' },
    { str: 'Subheading Overview', x: 50, y: 90, width: 160, height: 20, fontSize: 18, fontName: 'Arial-Bold' },
    { str: '• First bullet item', x: 50, y: 130, width: 120, height: 14, fontSize: 12, fontName: 'Arial' },
    { str: '• Second bullet item', x: 50, y: 150, width: 130, height: 14, fontSize: 12, fontName: 'Arial' },
    { str: 'This is a regular body paragraph explaining the concepts.', x: 50, y: 190, width: 300, height: 14, fontSize: 12, fontName: 'Arial' },
  ];

  const blocks = groupIntoSemanticBlocks(rawItems, 595, 842);
  const html = renderSemanticBlocksToHtml(blocks);

  assert.ok(html.includes('<h1>Document Title</h1>'));
  assert.ok(html.includes('<h2>Subheading Overview</h2>'));
  assert.ok(html.includes('<ul>'));
  assert.ok(html.includes('<li>First bullet item</li>'));
  assert.ok(html.includes('<li>Second bullet item</li>'));
  assert.ok(html.includes('<p>This is a regular body paragraph explaining the concepts.</p>'));
});

test('renderFixedLayoutToHtml produces visible positioned elements without clipping text', () => {
  const rawItems = [
    { str: 'Title Header', x: 100, y: 50, width: 80, height: 14, fontSize: 14 },
    { str: 'Description subtitle', x: 100, y: 75, width: 120, height: 12, fontSize: 12 },
  ];

  const html = renderFixedLayoutToHtml(rawItems, 500, 700);
  assert.ok(html.includes('class="pdf-page-fixed"'));
  assert.ok(html.includes('position: absolute'));
  assert.ok(html.includes('left: 20.00%')); // 100/500 = 20%
  assert.ok(html.includes('max-width:'));
  assert.ok(html.includes('overflow: visible'));
  assert.ok(html.includes('white-space: pre-wrap;'));
  assert.ok(html.includes('overflow-wrap: break-word;'));
  assert.ok(html.includes('Title Header'));
  assert.ok(html.includes('Description subtitle'));
});

test('detectTablesInItems detects multi-column tables and structures into rows and headers', () => {
  const mockTableItems = [
    { str: 'Sr No', x: 30, y: 95, width: 30, height: 11, fontSize: 10, isBold: true },
    { str: 'Month', x: 75, y: 95, width: 35, height: 11, fontSize: 10, isBold: true },
    { str: 'Dates', x: 125, y: 95, width: 30, height: 11, fontSize: 10, isBold: true },
    { str: 'Odd Term', x: 175, y: 95, width: 45, height: 11, fontSize: 10, isBold: true },
    { str: 'SUN', x: 240, y: 95, width: 22, height: 11, fontSize: 10, isBold: true },
    { str: 'MON', x: 275, y: 95, width: 25, height: 11, fontSize: 10, isBold: true },
    { str: 'Events', x: 490, y: 95, width: 40, height: 11, fontSize: 10, isBold: true },
    // Row 1
    { str: '1', x: 35, y: 115, width: 10, height: 11, fontSize: 10 },
    { str: '14-20', x: 125, y: 115, width: 30, height: 11, fontSize: 10 },
    { str: '14', x: 242, y: 115, width: 15, height: 11, fontSize: 10 },
    { str: '15', x: 278, y: 115, width: 15, height: 11, fontSize: 10 },
    // Row 2
    { str: '2', x: 35, y: 135, width: 10, height: 11, fontSize: 10 },
    { str: 'Jun-26', x: 75, y: 135, width: 35, height: 11, fontSize: 10 },
    { str: '21-27', x: 125, y: 135, width: 30, height: 11, fontSize: 10 },
    { str: 'Week 1', x: 175, y: 135, width: 40, height: 11, fontSize: 10 },
    { str: '21', x: 242, y: 135, width: 15, height: 11, fontSize: 10 },
    { str: '22', x: 278, y: 135, width: 15, height: 11, fontSize: 10 },
    { str: 'Commencement of Odd Term', x: 490, y: 135, width: 90, height: 11, fontSize: 10 },
  ];

  const { tables, nonTableItems } = detectTablesInItems(mockTableItems, 595, 842);
  assert.equal(tables.length, 1);
  assert.equal(nonTableItems.length, 0);
  assert.ok(tables[0].headers.includes('Sr No'));
  assert.ok(tables[0].headers.includes('SUN'));
  assert.ok(tables[0].headers.includes('Events'));
  assert.equal(tables[0].rows.length, 2);

  const tableHtml = renderTableBlockToHtml(tables[0]);
  assert.ok(tableHtml.includes('<table class="doc-table">'));
  assert.ok(tableHtml.includes('>Sr No</th>'));
  assert.ok(tableHtml.includes('class="col-sun"'));
  assert.ok(tableHtml.includes('>SUN</th>'));
  assert.ok(tableHtml.includes('Week 1</td>'));
  assert.ok(tableHtml.includes('class="cell-highlight-yellow"'));
  assert.ok(tableHtml.includes('Commencement of Odd Term</td>'));
});

test('renderFixedLayoutToHtml automatically generates native expanding CSS tables when table grid is detected', () => {
  const mockPageItems = [
    { str: 'SILVER OAK UNIVERSITY', x: 200, y: 30, width: 200, height: 16, fontSize: 16, isBold: true },
    { str: 'UNIVERSITY CALENDAR', x: 210, y: 50, width: 180, height: 14, fontSize: 14, isBold: true },
    // Table Header
    { str: 'Sr No', x: 30, y: 95, width: 30, height: 11, fontSize: 10, isBold: true },
    { str: 'Month', x: 75, y: 95, width: 35, height: 11, fontSize: 10, isBold: true },
    { str: 'Dates', x: 125, y: 95, width: 30, height: 11, fontSize: 10, isBold: true },
    { str: 'Odd Term', x: 175, y: 95, width: 45, height: 11, fontSize: 10, isBold: true },
    { str: 'SUN', x: 240, y: 95, width: 22, height: 11, fontSize: 10, isBold: true },
    // Row 1
    { str: '1', x: 35, y: 115, width: 10, height: 11, fontSize: 10 },
    { str: '14-20', x: 125, y: 115, width: 30, height: 11, fontSize: 10 },
    { str: '14', x: 242, y: 115, width: 15, height: 11, fontSize: 10 },
    // Row 2
    { str: '2', x: 35, y: 135, width: 10, height: 11, fontSize: 10 },
    { str: 'Jun-26', x: 75, y: 135, width: 35, height: 11, fontSize: 10 },
    { str: '21-27', x: 125, y: 135, width: 30, height: 11, fontSize: 10 },
    { str: 'Week 1', x: 175, y: 135, width: 40, height: 11, fontSize: 10 },
    { str: '21', x: 242, y: 135, width: 15, height: 11, fontSize: 10 },
    // Footer note
    { str: 'Note: Working days are subject to change.', x: 30, y: 200, width: 250, height: 11, fontSize: 9 }
  ];

  const html = renderFixedLayoutToHtml(mockPageItems, 595, 842);
  assert.ok(html.includes('class="pdf-page-fixed pdf-page-table-doc"'));
  assert.ok(html.includes('SILVER OAK UNIVERSITY'));
  assert.ok(html.includes('<table class="doc-table">'));
  assert.ok(html.includes('>Sr No</th>'));
  assert.ok(html.includes('Week 1</td>'));
  assert.ok(html.includes('Jun-26</td>'));
  assert.ok(html.includes('Note: Working days are subject to change.'));
  // Text is never hidden by overflow: hidden
  assert.ok(!html.includes('overflow: hidden;'));
});

test('generateStandaloneHtmlDocument builds full HTML5 with chosen themes and nav', () => {
  const pages = [
    { pageNumber: 1, htmlContent: '<h1>Page 1 Content</h1><p>Welcome</p>' },
    { pageNumber: 2, htmlContent: '<h1>Page 2 Content</h1><p>Conclusion</p>' },
  ];

  const modernHtml = generateStandaloneHtmlDocument(pages, {
    title: 'Test Document',
    theme: 'modern',
    mode: 'semantic',
    includeNav: true,
  });

  assert.ok(modernHtml.startsWith('<!DOCTYPE html>'));
  assert.ok(modernHtml.includes('<title>Test Document</title>'));
  assert.ok(modernHtml.includes('<nav class="nav-bar"'));
  assert.ok(modernHtml.includes('href="#page-1"'));
  assert.ok(modernHtml.includes('href="#page-2"'));
  assert.ok(modernHtml.includes('Page 1 Content'));
  assert.ok(modernHtml.includes('Page 2 Content'));

  const darkHtml = generateStandaloneHtmlDocument(pages, {
    title: 'Dark Document',
    theme: 'dark',
    mode: 'semantic',
  });
  assert.ok(darkHtml.includes('--bg-main: #0b0f19'));
});

test('generateStandaloneHtmlDocument generates compact dropdown navigator for multi-page (>6) documents', () => {
  const pages = Array.from({ length: 48 }, (_, i) => ({
    pageNumber: i + 1,
    htmlContent: `<p>Page ${i + 1} content</p>`,
  }));

  const html = generateStandaloneHtmlDocument(pages, {
    title: 'Large 48-Page Document',
    includeNav: true,
  });

  // Verify compact dropdown structure
  assert.ok(html.includes('<select class="nav-select"'));
  assert.ok(html.includes('<option value="1">Page 1 of 48</option>'));
  assert.ok(html.includes('<option value="48">Page 48 of 48</option>'));
  assert.ok(html.includes('class="nav-arrow"'));
  // Verify it does NOT generate 48 individual anchor tags that clutter code
  assert.ok(!html.includes('href="#page-48"'));
});

test('generateZipArchive packages files into valid zip blob', async () => {
  const pages = [
    { pageNumber: 1, htmlContent: '<p>Page 1</p>' },
    { pageNumber: 2, htmlContent: '<p>Page 2</p>' },
  ];

  const blob = await generateZipArchive(pages, { title: 'Package Test' });
  assert.ok(blob);
  assert.ok(blob.size > 0);
  assert.ok(['application/zip', 'application/x-zip-compressed', ''].includes(blob.type));
});

test('deduplicateRawItems filters out faux-bold duplicate text runs', () => {
  const items = [
    { str: 'SILVER OAK UNIVERSITY', x: 50, y: 30, fontSize: 16 },
    { str: 'SILVER OAK UNIVERSITY', x: 50.4, y: 30.1, fontSize: 16 }, // Duplicate pass
    { str: 'Academic Calendar', x: 50, y: 55, fontSize: 12 },
  ];
  const deduped = deduplicateRawItems(items);
  assert.strictEqual(deduped.length, 2);
  assert.strictEqual(deduped[0].str, 'SILVER OAK UNIVERSITY');
  assert.strictEqual(deduped[1].str, 'Academic Calendar');
});

test('renderFixedLayoutToHtml renders visible text and embeds background graphics when provided', () => {
  const items = [{ str: 'Hello World', x: 20, y: 40, fontSize: 14 }];
  const htmlWithBg = renderFixedLayoutToHtml(items, 600, 800, 'data:image/jpeg;base64,sample');
  assert.ok(htmlWithBg.includes('color: #0f172a;'));
  assert.ok(htmlWithBg.includes('class="fixed-bg"'));

  const htmlWithoutBg = renderFixedLayoutToHtml(items, 600, 800, null);
  assert.ok(htmlWithoutBg.includes('color: #0f172a;'));
  assert.ok(!htmlWithoutBg.includes('class="fixed-bg"'));

  const images = [{ dataUrl: 'data:image/png;base64,logo', x: 30, y: 40, width: 120, height: 60 }];
  const htmlWithImages = renderFixedLayoutToHtml(items, 600, 800, images);
  assert.ok(htmlWithImages.includes('class="pdf-embedded-img"'));
  assert.ok(htmlWithImages.includes('left: 5.00%'));
  assert.ok(htmlWithImages.includes('top: 5.00%'));
});

test('groupIntoSemanticBlocks accurately structures exam questions, options, and answers', () => {
  const rawItems = [
    { str: 'SBI PO Pre Memory Based Paper', x: 100, y: 30, width: 250, height: 18, fontSize: 16, fontName: 'Arial-Bold' },
    { str: 'Q1. Crude oil prices posted a weekly decline.', x: 50, y: 70, width: 300, height: 14, fontSize: 12, fontName: 'Arial' },
    { str: '(a) gain, fears (b) drop, anxious', x: 50, y: 95, width: 200, height: 14, fontSize: 12, fontName: 'Arial' },
    { str: '(c) rebound, relief (d) declined, doubts', x: 50, y: 115, width: 220, height: 14, fontSize: 12, fontName: 'Arial' },
    { str: 'Ans.(e)', x: 50, y: 140, width: 60, height: 14, fontSize: 12, fontName: 'Arial-Bold' },
  ];

  const blocks = groupIntoSemanticBlocks(rawItems, 500, 700);
  assert.equal(blocks[0].type, 'banner');
  assert.equal(blocks[1].type, 'question');
  assert.equal(blocks[1].qNum, 'Q1.');
  assert.ok(blocks[1].options.length >= 2);
  assert.equal(blocks[1].answer, 'Ans.(e)');

  const html = renderSemanticBlocksToHtml(blocks, [
    { dataUrl: 'data:image/png;base64,headerlogo', x: 50, y: 20, width: 80, height: 30 },
  ]);
  assert.ok(html.includes('class="doc-header-media"'));
  assert.ok(html.includes('class="doc-banner-box"'));
  assert.ok(html.includes('class="question-item-block"'));
  assert.ok(html.includes('class="q-num"'));
  assert.ok(html.includes('class="question-options-grid"'));
  assert.ok(html.includes('class="question-answer-badge"'));
});

test('groupIntoSemanticBlocks handles multi-line questions followed by options correctly', () => {
  const rawItems = [
    { str: 'Q2. Vehicle Scrapping Policy targets voluntary', x: 50, y: 50, width: 250, height: 14, fontSize: 12 },
    { str: 'retirement of unfit commercial and passenger vehicles', x: 50, y: 70, width: 260, height: 14, fontSize: 12 },
    { str: 'based on their fitness tests.', x: 50, y: 90, width: 150, height: 14, fontSize: 12 },
    { str: '(a) overhaul, selectively', x: 50, y: 115, width: 140, height: 14, fontSize: 12 },
    { str: '(b) retirement, swift', x: 220, y: 115, width: 130, height: 14, fontSize: 12 },
    { str: 'Ans.(b)', x: 50, y: 140, width: 60, height: 14, fontSize: 12 },
  ];

  const blocks = groupIntoSemanticBlocks(rawItems, 600, 800);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, 'question');
  assert.equal(blocks[0].qNum, 'Q2.');
  assert.ok(blocks[0].text.includes('Vehicle Scrapping Policy'));
  assert.ok(blocks[0].text.includes('commercial and passenger vehicles'));
  assert.ok(blocks[0].text.includes('based on their fitness tests.'));
  assert.equal(blocks[0].options.length, 2);
  assert.equal(blocks[0].answer, 'Ans.(b)');
});
