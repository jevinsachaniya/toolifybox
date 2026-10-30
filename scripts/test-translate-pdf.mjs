import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countWords,
  formatPdfTextContent,
} from '../app/utils/extract-ocr.js';
import {
  SUPPORTED_LANGUAGES,
  SOURCE_LANGUAGES,
  getLanguageInfo,
  validatePdfForTranslation,
  chunkTextForTranslation,
  translateTextChunk,
  translateBatch,
  translatedOutputFilename,
  createTranslatedDocx,
  createTranslatedTxtBlob,
  createTranslatedPdf,
  drawBlockTextInBox,
  extractPageLayoutBlocks,
  shouldPreserveAsIs,
} from '../app/utils/translate-pdf.js';

test('Languages list contains English, Hindi, Spanish, French, and Gujarati', () => {
  const codes = SUPPORTED_LANGUAGES.map(l => l.code);
  assert.ok(codes.includes('en'), 'Must include English');
  assert.ok(codes.includes('hi'), 'Must include Hindi');
  assert.ok(codes.includes('es'), 'Must include Spanish');
  assert.ok(codes.includes('fr'), 'Must include French');
  assert.ok(codes.includes('gu'), 'Must include Gujarati');
  assert.equal(SUPPORTED_LANGUAGES.length, 5);

  const autoLang = SOURCE_LANGUAGES.find(l => l.code === 'auto');
  assert.ok(autoLang, 'Source languages must include auto-detect');
});

test('getLanguageInfo returns correct names and flags', () => {
  const gu = getLanguageInfo('gu');
  assert.equal(gu.name, 'Gujarati');
  assert.equal(gu.native, 'ગુજરાતી');

  const hi = getLanguageInfo('hi');
  assert.equal(hi.name, 'Hindi');
  assert.equal(hi.native, 'हिन्दी');

  const es = getLanguageInfo('es');
  assert.equal(es.name, 'Spanish');

  const fr = getLanguageInfo('fr');
  assert.equal(fr.name, 'French');

  const auto = getLanguageInfo('auto');
  assert.equal(auto.code, 'auto');
});

test('validatePdfForTranslation validates PDF files accurately', () => {
  assert.ok(validatePdfForTranslation([]) !== null, 'Rejects empty array');
  assert.ok(validatePdfForTranslation([{ name: 'test.docx', type: 'application/docx', size: 100 }]) !== null, 'Rejects docx');
  assert.ok(validatePdfForTranslation([{ name: 'empty.pdf', type: 'application/pdf', size: 0 }]) !== null, 'Rejects 0 byte PDF');
  assert.ok(validatePdfForTranslation([{ name: 'huge.pdf', type: 'application/pdf', size: 35 * 1024 * 1024 }]) !== null, 'Rejects oversized PDF');

  assert.equal(validatePdfForTranslation([{ name: 'document.pdf', type: 'application/pdf', size: 1024 * 50 }]), null, 'Accepts valid PDF');
});

test('countWords accurately counts English, Hindi, and Gujarati words', () => {
  assert.equal(countWords('Hello world from Toolifybox'), 4);
  assert.equal(countWords('नमस्ते दुनिया टूलिफ़ाइबॉक्स में स्वागत है'), 6);
  assert.equal(countWords('નમસ્તે વિશ્વ ટૂલીફાયબોક્સમાં આપનું સ્વાગત છે'), 6);
  assert.equal(countWords(''), 0);
  assert.equal(countWords(null), 0);
});

test('formatPdfTextContent joins items with correct line and word spacing', () => {
  const sampleContent = {
    items: [
      { str: 'First', transform: [1, 0, 0, 1, 10, 100] },
      { str: 'paragraph', transform: [1, 0, 0, 1, 50, 100], hasEOL: true },
      { str: 'Second', transform: [1, 0, 0, 1, 10, 80] },
      { str: 'line', transform: [1, 0, 0, 1, 60, 80] },
    ],
  };
  const formatted = formatPdfTextContent(sampleContent);
  assert.ok(formatted.includes('First paragraph'));
  assert.ok(formatted.includes('Second line'));
});

test('chunkTextForTranslation keeps chunks within size limit and preserves paragraphs', () => {
  const shortText = 'Short paragraph.\n\nAnother paragraph.';
  const chunks = chunkTextForTranslation(shortText, 500);
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0], shortText);

  const longText = Array.from({ length: 20 }, (_, i) => `Paragraph number ${i + 1} with some text content.`).join('\n\n');
  const maxChunk = 200;
  const splitChunks = chunkTextForTranslation(longText, maxChunk);
  assert.ok(splitChunks.length > 1);
  for (const c of splitChunks) {
    assert.ok(c.length <= maxChunk + 60, `Chunk exceeds expected size: ${c.length}`);
  }
});

test('translateTextChunk translates with mock or identical source/target return', async () => {
  // Same source and target
  const identity = await translateTextChunk('Hello world', 'en', 'en');
  assert.equal(identity, 'Hello world');

  // Mock translation mode
  const mockTranslated = await translateTextChunk('Hello world', 'en', 'gu', { mock: true });
  assert.equal(mockTranslated, '[GU] Hello world');

  const mockHi = await translateTextChunk('Welcome', 'en', 'hi', { mock: true });
  assert.equal(mockHi, '[HI] Welcome');
});

test('translatedOutputFilename formats clean and correct filenames', () => {
  assert.equal(translatedOutputFilename('contract.pdf', 'gu', 'docx'), 'contract_translated_gu.docx');
  assert.equal(translatedOutputFilename('Invoice_2026.pdf', 'hi', 'txt'), 'Invoice_2026_translated_hi.txt');
  assert.equal(translatedOutputFilename('Report File!.pdf', 'es', 'pdf'), 'Report_File__translated_es.pdf');
});

test('createTranslatedDocx and createTranslatedTxtBlob produce valid files', async () => {
  const pages = [
    { pageNumber: 1, text: 'Hello', translatedText: 'નમસ્તે (Hello in Gujarati)' },
    { pageNumber: 2, text: 'World', translatedText: 'વિશ્વ (World in Gujarati)' },
  ];

  const docxBlob = await createTranslatedDocx(pages, {
    sourceLang: 'en',
    targetLang: 'gu',
    originalName: 'test.pdf',
  });
  assert.ok(docxBlob instanceof Blob);
  assert.ok(docxBlob.size > 100);

  const txtBlob = createTranslatedTxtBlob(pages, {
    sourceLang: 'en',
    targetLang: 'gu',
    originalName: 'test.pdf',
  });
  assert.ok(txtBlob instanceof Blob);
  const textContent = await txtBlob.text();
  assert.ok(textContent.includes('TRANSLATED DOCUMENT'));
  assert.ok(textContent.includes('નમસ્તે'));
});

test('extractPageLayoutBlocks extracts positions and groups items into layout blocks', () => {
  const textContent = {
    items: [
      { str: 'Invoice #1042', transform: [14, 0, 0, 14, 50, 750], width: 100, height: 14 },
      { str: 'Bill To:', transform: [12, 0, 0, 12, 50, 700], width: 45, height: 12 },
      { str: 'Acme Corp', transform: [12, 0, 0, 12, 100, 700], width: 60, height: 12 },
      { str: 'Amount Due:', transform: [12, 0, 0, 12, 50, 600], width: 80, height: 12 },
      { str: '$1,250.00', transform: [12, 0, 0, 12, 140, 600], width: 50, height: 12 },
    ],
  };
  const viewport = {
    width: 612,
    height: 792,
    transform: [1, 0, 0, -1, 0, 792],
  };

  const blocks = extractPageLayoutBlocks(textContent, viewport);
  assert.ok(blocks.length >= 2, 'Should extract layout blocks');
  assert.ok(blocks[0].text.includes('Invoice'));
  assert.ok(Number.isFinite(blocks[0].x));
  assert.ok(Number.isFinite(blocks[0].y));
  assert.ok(blocks[0].width > 0);
  assert.ok(blocks[0].height > 0);
});

test('extractPageLayoutBlocks isolates side-by-side columns without fusing them', () => {
  // Sidebar column at x=50, main column at x=300, both at y=700 (top ~ 92)
  const textContent = {
    items: [
      { str: 'SKILLS: Node.js, Vue', transform: [11, 0, 0, 11, 50, 700], width: 140, height: 11 },
      { str: 'EXPERIENCE: Senior Architect', transform: [11, 0, 0, 11, 300, 700], width: 180, height: 11 },
    ],
  };
  const viewport = {
    width: 612,
    height: 792,
    transform: [1, 0, 0, -1, 0, 792],
  };

  const blocks = extractPageLayoutBlocks(textContent, viewport);
  assert.equal(blocks.length, 2, 'Sidebar and main content at the same vertical offset must be separate blocks');
  const leftBlock = blocks.find((b) => b.text.includes('SKILLS'));
  const rightBlock = blocks.find((b) => b.text.includes('EXPERIENCE'));
  assert.ok(leftBlock, 'Left column block must exist');
  assert.ok(rightBlock, 'Right column block must exist');
  assert.ok(leftBlock.x + leftBlock.width <= rightBlock.x, 'Columns must not overlap horizontally');
});

test('extractPageLayoutBlocks properly calculates height for multi-line paragraphs and bullet descriptions', () => {
  // Multi-line bullet with bullet symbol at x=50, text at x=72, line 2 at x=72
  const textContent = {
    items: [
      { str: '•', transform: [10, 0, 0, 10, 50, 700], width: 5, height: 10 },
      { str: 'Engineered high-performance web applications using Python and Flask.', transform: [10, 0, 0, 10, 72, 700], width: 320, height: 10 },
      { str: 'Improved query response latency by 35% across all endpoints.', transform: [10, 0, 0, 10, 72, 686], width: 280, height: 10 },
    ],
  };
  const viewport = {
    width: 612,
    height: 792,
    transform: [1, 0, 0, -1, 0, 792],
  };

  const blocks = extractPageLayoutBlocks(textContent, viewport);
  assert.equal(blocks.length, 1, 'Bullet symbol, first line, and second line must merge into a single cohesive block');
  const block = blocks[0];
  assert.ok(block.text.startsWith('• Engineered'), 'Bullet must be merged with line text');
  assert.ok(block.text.includes('Improved query'), 'Second line must be attached to the block');
  assert.ok(Number.isFinite(block.top), 'Block top must be a finite number');
  assert.ok(Number.isFinite(block.y), 'Block y must be a finite number');
  assert.ok(Number.isFinite(block.height), 'Block height must be a finite number');
  assert.ok(!Number.isNaN(block.height), 'Block height must NOT be NaN');
  assert.ok(block.height >= 20, 'Multi-line block height must be >= 20');
  assert.ok(block.width > 300, 'Block width must span the line content');
  assert.equal(block.originalLines.length, 2, 'Original line geometry must be retained for precise text removal');
  assert.ok(block.maxHeight >= block.height, 'Translated text must receive at least the original block height');
});

test('drawBlockTextInBox wraps translated paragraphs even when translation removed source newlines', () => {
  const drawn = [];
  const context = {
    font: '', textBaseline: '', textAlign: '', fillStyle: '',
    measureText(value) { return { width: Array.from(value).length * 6 }; },
    save() {}, restore() {}, beginPath() {}, rect() {}, clip() {},
    fillText(value, x, y) { drawn.push({ value, x, y }); },
  };
  drawBlockTextInBox(
    context,
    'This translated paragraph has no newline but still needs to follow the original multi line column width.',
    40, 60, 120, 72, 12, 72, 'left', 120, 2, 'Arial',
  );
  assert.ok(drawn.length >= 2, `Expected wrapped translated lines, received ${drawn.length}`);
  assert.equal(drawn[0].x, 40, 'Wrapped text must retain the original left edge');
  assert.equal(drawn[0].y, 72, 'Wrapped text must retain the original first baseline');
  assert.ok(drawn.every((line, index) => index === 0 || line.y > drawn[index - 1].y), 'Wrapped baselines must flow downward in order');
});

test('createTranslatedPdf creates valid multi-page PDF blob', async () => {
  const pages = [
    {
      pageNumber: 1,
      pageWidth: 595.28,
      pageHeight: 841.89,
      text: 'Invoice #1042\nTotal: $500',
      translatedText: 'चालान #1042\nकुल: $500',
      blocks: [
        { x: 50, y: 100, width: 200, height: 20, fontSize: 14, text: 'Invoice #1042', translatedText: 'चालान #1042' },
        { x: 50, y: 140, width: 200, height: 20, fontSize: 12, text: 'Total: $500', translatedText: 'कुल: $500' },
      ],
    },
  ];

  const pdfBlob = await createTranslatedPdf(pages, {
    sourceLang: 'en',
    targetLang: 'hi',
    originalName: 'invoice.pdf',
  });

  assert.ok(pdfBlob instanceof Blob);
  assert.equal(pdfBlob.type, 'application/pdf');
  assert.ok(pdfBlob.size > 200);
});

test('shouldPreserveAsIs correctly identifies technical terms, emails, phone numbers, and dates', () => {
  assert.equal(shouldPreserveAsIs('jevinsachaniya1@gmail.com'), true);
  assert.equal(shouldPreserveAsIs('+91 9016097957'), true);
  assert.equal(shouldPreserveAsIs('2025 - 2028'), true);
  assert.equal(shouldPreserveAsIs('73%'), true);
  assert.equal(shouldPreserveAsIs('• Python'), true);
  assert.equal(shouldPreserveAsIs('MySQL'), true);
  assert.equal(shouldPreserveAsIs('HTML'), true);
  assert.equal(shouldPreserveAsIs('B.VOC'), true);
  assert.equal(shouldPreserveAsIs('Profile Summary'), false);
  assert.equal(shouldPreserveAsIs('Technical Skills'), false);
  assert.equal(shouldPreserveAsIs('Experience'), false);
});

test('extractPageLayoutBlocks never fuses headings with subsequent body text or contact fields', () => {
  // Heading: "JEVIN SACHANIYA" at fs=24, y=740
  // Email: "jevinsachaniya1@gmail.com" at fs=10, y=715
  const textContent = {
    items: [
      { str: 'JEVIN SACHANIYA', transform: [24, 0, 0, 24, 50, 740], width: 220, height: 24 },
      { str: 'jevinsachaniya1@gmail.com', transform: [10, 0, 0, 10, 50, 715], width: 150, height: 10 },
      { str: '+91 9016097957', transform: [10, 0, 0, 10, 230, 715], width: 90, height: 10 },
    ],
  };
  const viewport = {
    width: 612,
    height: 792,
    transform: [1, 0, 0, -1, 0, 792],
  };

  const blocks = extractPageLayoutBlocks(textContent, viewport);
  assert.equal(blocks.length, 3, 'Name, email, and phone must each be their own independent block');
  assert.ok(blocks.find(b => b.text === 'JEVIN SACHANIYA'));
  assert.ok(blocks.find(b => b.text === 'jevinsachaniya1@gmail.com'));
  assert.ok(blocks.find(b => b.text === '+91 9016097957'));
});

test('extractPageLayoutBlocks detects center, right, and left alignments and computes maxWidth', () => {
  const viewport = {
    width: 600,
    height: 800,
    transform: [1, 0, 0, -1, 0, 800],
  };
  const textContent = {
    items: [
      // Centered title: width 200, placed at x=200 -> center is 300 (page center is 300)
      { str: 'CERTIFICATE OF ACHIEVEMENT', transform: [20, 0, 0, 20, 200, 750], width: 200, height: 20 },
      // Left label: "Total Due:" at x=50, width 60, y=500
      { str: 'Total Due:', transform: [12, 0, 0, 12, 50, 500], width: 60, height: 12 },
      // Right-aligned amount at x=480, width 70 -> right is 550 (near right margin 600-50)
      { str: '$1,250.00', transform: [12, 0, 0, 12, 480, 500], width: 70, height: 12 },
    ],
  };

  const blocks = extractPageLayoutBlocks(textContent, viewport);
  assert.equal(blocks.length, 3);

  const titleBlock = blocks.find(b => b.text.includes('CERTIFICATE'));
  assert.ok(titleBlock);
  assert.equal(titleBlock.align, 'center', 'Certificate title centered around page midpoint must have align="center"');

  const amountBlock = blocks.find(b => b.text === '$1,250.00');
  assert.ok(amountBlock);
  assert.equal(amountBlock.align, 'right', 'Right margin invoice amount must have align="right"');

  const labelBlock = blocks.find(b => b.text === 'Total Due:');
  assert.ok(labelBlock);
  assert.equal(labelBlock.align, 'left');
  // Since label is at x=50 and amount is at x=480 on the same row, maxWidth for label should extend up to near amountBlock.x (480 - 8 = 472 - 50 = 422)
  assert.ok(labelBlock.maxWidth > 200, `Label maxWidth (${labelBlock.maxWidth}) must expand across available space instead of being clamped to 60`);
});

test('extractPageLayoutBlocks does not mistake a full-width left paragraph for centered text', () => {
  const viewport = { width: 600, height: 800, transform: [1, 0, 0, -1, 0, 800] };
  const blocks = extractPageLayoutBlocks({ items: [
    { str: 'A full width paragraph starts at the normal left page margin.', transform: [12, 0, 0, 12, 50, 700], width: 500, height: 12 },
  ] }, viewport);
  assert.equal(blocks[0].align, 'left');
});

test('extractPageLayoutBlocks keeps an offset column heading left aligned', () => {
  const viewport = { width: 600, height: 800, transform: [1, 0, 0, -1, 0, 800] };
  const blocks = extractPageLayoutBlocks({ items: [
    { str: 'DELIVERABLES', transform: [14, 0, 0, 14, 224, 600], width: 104, height: 14 },
  ] }, viewport);
  assert.equal(blocks[0].align, 'left', 'A heading inside the main content column must keep its original left edge');
});

test('extractPageLayoutBlocks keeps numbered list rows as separate blocks', () => {
  const viewport = { width: 600, height: 800, transform: [1, 0, 0, -1, 0, 800] };
  const blocks = extractPageLayoutBlocks({ items: [
    { str: '1. Preserve the first baseline.', transform: [11, 0, 0, 11, 224, 600], width: 170, height: 11 },
    { str: '2. Keep text inside its column.', transform: [11, 0, 0, 11, 224, 584], width: 180, height: 11 },
    { str: '3. Leave space before the next section.', transform: [11, 0, 0, 11, 224, 568], width: 210, height: 11 },
  ] }, viewport);
  assert.equal(blocks.length, 3, 'Numbered list items need independent baselines and wrapping boxes');
});

test('translateBatch handles mock batches and preserves length', async () => {
  const items = ['Hello', 'World', 'Invoice Report'];
  const res = await translateBatch(items, 'en', 'gu', { mock: true });
  assert.equal(res.length, 3);
  assert.equal(res[0], '[GU] Hello');
  assert.equal(res[1], '[GU] World');
  assert.equal(res[2], '[GU] Invoice Report');
});

test('createTranslatedDocx faithfully generates layout-preserved docx when blocks are present', async () => {
  const pages = [
    {
      pageNumber: 1,
      pageWidth: 612,
      pageHeight: 792,
      blocks: [
        {
          x: 54,
          y: 72,
          baseline: 84,
          width: 250,
          height: 24,
          fontSize: 16,
          fontName: 'Helvetica-Bold',
          text: 'Annual Progress Report 2026',
          translatedText: 'વાર્ષિક પ્રગતિ અહેવાલ 2026',
        },
        {
          x: 54,
          y: 110,
          baseline: 122,
          width: 400,
          height: 36,
          fontSize: 12,
          fontName: 'Helvetica',
          text: 'This document certifies the successful completion of the coursework.',
          translatedText: 'આ દસ્તાવેજ અભ્યાસક્રમ સફળતાપૂર્વક પૂર્ણ કર્યાનું પ્રમાણિત કરે છે.',
        },
      ],
    },
  ];

  const blob = await createTranslatedDocx(pages, {
    sourceLang: 'en',
    targetLang: 'gu',
    originalName: 'progress-report.pdf',
  });

  assert.ok(blob instanceof Blob);
  assert.ok(blob.size > 200, 'DOCX blob must contain document sections and styles');
});

