import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clusterCoordinates,
  escapeXml,
  extractTableFromTextItems,
  generatePdfCsvData,
  generatePdfExcelWorkbook,
  generatePdfTsvData,
  indexToColLetters,
  SAMPLE_PDF_TABLE_DATA,
  validatePdfToExcelFile,
} from '../app/utils/pdf-to-excel.js';
import JSZip from 'jszip';

test('validatePdfToExcelFile validates file type, presence, and limits', () => {
  assert.equal(validatePdfToExcelFile(null), 'Please choose a PDF document to convert.');
  assert.equal(validatePdfToExcelFile({ name: 'notes.txt', size: 100, type: 'text/plain' }), '"notes.txt" is not a PDF file. Please select a valid .pdf document.');
  assert.equal(validatePdfToExcelFile({ name: 'empty.pdf', size: 0, type: 'application/pdf' }), '"empty.pdf" is an empty file (0 bytes).');
  assert.equal(validatePdfToExcelFile({ name: 'huge.pdf', size: 60 * 1024 * 1024, type: 'application/pdf' }), '"huge.pdf" exceeds the 50 MB file size limit. Please select a smaller PDF.');
  assert.equal(validatePdfToExcelFile({ name: 'sample.pdf', size: 1024, type: 'application/pdf' }), null);
});

test('indexToColLetters converts 0-based column indices to Excel column letters', () => {
  assert.equal(indexToColLetters(0), 'A');
  assert.equal(indexToColLetters(1), 'B');
  assert.equal(indexToColLetters(25), 'Z');
  assert.equal(indexToColLetters(26), 'AA');
  assert.equal(indexToColLetters(27), 'AB');
});

test('escapeXml escapes dangerous characters and removes control characters', () => {
  assert.equal(escapeXml('Sales & "Revenue" < 2026 >'), 'Sales &amp; &quot;Revenue&quot; &lt; 2026 &gt;');
  assert.equal(escapeXml('Clean\u0000Text'), 'CleanText');
});

test('clusterCoordinates groups nearby coordinate points into centroids', () => {
  const points = [10.1, 10.4, 11.0, 50.2, 50.8, 100.5];
  const centroids = clusterCoordinates(points, 3.5);
  assert.equal(centroids.length, 3);
  assert.ok(Math.abs(centroids[0] - 10.5) < 1.0);
  assert.ok(Math.abs(centroids[1] - 50.5) < 1.0);
  assert.ok(Math.abs(centroids[2] - 100.5) < 1.0);
});

test('extractTableFromTextItems clusters rows and columns correctly', () => {
  // Simulating 2 table rows extracted from PDF with slight coordinate jitters
  // Row 1 (Header): Item (x:50, y:700), Qty (x:200, y:700.5), Price (x:350, y:699.8)
  // Row 2 (Data): Widget (x:50.2, y:680), 5 (x:200.1, y:680.2), $25.00 (x:349.5, y:679.9)
  const items = [
    { str: 'Item', x: 50, y: 700, width: 20, height: 10 },
    { str: 'Qty', x: 200, y: 700.5, width: 15, height: 10 },
    { str: 'Price', x: 350, y: 699.8, width: 25, height: 10 },
    { str: 'Widget A', x: 50.2, y: 680, width: 35, height: 10 },
    { str: '5', x: 200.1, y: 680.2, width: 8, height: 10 },
    { str: '$25.00', x: 349.5, y: 679.9, width: 30, height: 10 },
  ];

  const table = extractTableFromTextItems(items, { mode: 'smart_table' });
  assert.equal(table.length, 2, 'Should detect exactly 2 rows');
  assert.equal(table[0].length, 3, 'Should detect 3 columns');
  assert.deepEqual(table[0], ['Item', 'Qty', 'Price']);
  assert.deepEqual(table[1], ['Widget A', '5', '$25.00']);
});

test('extractTableFromTextItems joins close horizontal text tokens into words', () => {
  const items = [
    { str: 'Acme', x: 50, y: 700, width: 25, height: 10 },
    { str: 'Global', x: 77, y: 700, width: 30, height: 10 }, // gap is 2px, should merge
    { str: '100', x: 250, y: 700, width: 15, height: 10 },
  ];

  const table = extractTableFromTextItems(items);
  assert.equal(table.length, 1);
  assert.equal(table[0][0], 'Acme Global');
  assert.equal(table[0][1], '100');
});

test('generatePdfCsvData produces compliant RFC 4180 CSV with UTF-8 BOM', () => {
  const rows = [
    ['Name', 'Title, Role', 'Description with "Quotes"'],
    ['Jevin', 'Engineer, Lead', 'Handles "Core" features'],
  ];

  const csv = generatePdfCsvData(rows);
  assert.ok(csv.startsWith('\uFEFF'), 'Must contain UTF-8 BOM');
  assert.ok(csv.includes('"Title, Role"'), 'Must escape cells containing commas');
  assert.ok(csv.includes('"Description with ""Quotes"""'), 'Must escape internal quotes as doubled quotes');
});

test('generatePdfTsvData creates clean tab-delimited string for clipboard copy', () => {
  const rows = [
    ['Header1', 'Header2'],
    ['Val1', 'Val2'],
  ];
  const tsv = generatePdfTsvData(rows);
  assert.equal(tsv, 'Header1\tHeader2\nVal1\tVal2');
});

test('generatePdfExcelWorkbook creates valid OpenXML XLSX archive with multiple sheets', async () => {
  const sheets = [
    {
      name: 'Summary',
      rows: SAMPLE_PDF_TABLE_DATA,
    },
    {
      name: 'Secondary',
      rows: [['ID', 'Score'], ['A1', '98']],
    },
  ];

  const buffer = await generatePdfExcelWorkbook(sheets);
  assert.ok(buffer && buffer.length > 0, 'Buffer must not be empty');

  // Verify internal OpenXML zip contents
  const zip = await JSZip.loadAsync(buffer);
  assert.ok(zip.file('[Content_Types].xml'), 'Missing [Content_Types].xml');
  assert.ok(zip.file('xl/workbook.xml'), 'Missing xl/workbook.xml');
  assert.ok(zip.file('xl/styles.xml'), 'Missing xl/styles.xml');
  assert.ok(zip.file('xl/worksheets/sheet1.xml'), 'Missing xl/worksheets/sheet1.xml');
  assert.ok(zip.file('xl/worksheets/sheet2.xml'), 'Missing xl/worksheets/sheet2.xml');

  const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml').async('text');
  assert.ok(sheet1Xml.includes('INV-2026-081'), 'Sheet 1 should contain invoice data');
  assert.ok(sheet1Xml.includes('<col min="1"'), 'Sheet 1 should include column width specifications');
});
