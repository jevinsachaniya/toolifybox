import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {
  colLettersToIndex,
  indexToColLetters,
  parseCsvData,
  cleanMatrix,
  sanitizeSheetName,
  validateExcelMergeFile,
  mergeExcelWorkbooks,
  generateMergedExcelWorkbook,
  generateMergedCsv,
  SAMPLE_EXCEL_DATASETS,
} from '../app/utils/merge-excel.js';

test('validateExcelMergeFile validates extensions and file limits', () => {
  assert.equal(validateExcelMergeFile(null), 'Please choose a file to merge.');
  assert.match(
    validateExcelMergeFile({ name: 'old.xls', size: 1024, type: 'application/vnd.ms-excel' }),
    /older binary Excel 97-2003/i
  );
  assert.match(
    validateExcelMergeFile({ name: 'doc.pdf', size: 1024, type: 'application/pdf' }),
    /not a supported spreadsheet/i
  );
  assert.match(
    validateExcelMergeFile({ name: 'empty.xlsx', size: 0, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    /empty file/i
  );
  assert.match(
    validateExcelMergeFile({ name: 'huge.xlsx', size: 40 * 1024 * 1024, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    /exceeds the 35 MB/i
  );
  assert.equal(
    validateExcelMergeFile({ name: 'valid.xlsx', size: 1024, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    null
  );
  assert.equal(
    validateExcelMergeFile({ name: 'data.csv', size: 500, type: 'text/csv' }),
    null
  );
});

test('colLettersToIndex and indexToColLetters convert back and forth correctly', () => {
  assert.equal(colLettersToIndex('A'), 0);
  assert.equal(colLettersToIndex('B'), 1);
  assert.equal(colLettersToIndex('Z'), 25);
  assert.equal(colLettersToIndex('AA'), 26);
  assert.equal(colLettersToIndex('AB'), 27);
  assert.equal(colLettersToIndex('AZ'), 51);
  assert.equal(colLettersToIndex('BA'), 52);

  assert.equal(indexToColLetters(0), 'A');
  assert.equal(indexToColLetters(1), 'B');
  assert.equal(indexToColLetters(25), 'Z');
  assert.equal(indexToColLetters(26), 'AA');
  assert.equal(indexToColLetters(27), 'AB');
  assert.equal(indexToColLetters(51), 'AZ');
  assert.equal(indexToColLetters(52), 'BA');
});

test('parseCsvData handles quotes, delimiters, and trimmed empty rows', () => {
  const csv = `"Name","Email","City"\r\n"Dr. Rajesh, Sharma","rajesh@example.com","Mumbai"\r\n"Ramesh Patel","ramesh@example.com","Ahmedabad"\r\n\r\n`;
  const rows = parseCsvData(csv);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], ['Name', 'Email', 'City']);
  assert.deepEqual(rows[1], ['Dr. Rajesh, Sharma', 'rajesh@example.com', 'Mumbai']);
  assert.deepEqual(rows[2], ['Ramesh Patel', 'ramesh@example.com', 'Ahmedabad']);
});

test('sanitizeSheetName removes illegal characters and limits length to 31 chars', () => {
  assert.equal(sanitizeSheetName('Sales [2026]: Report / Q1*?'), 'Sales _2026_ Report _ Q1_');
  assert.equal(sanitizeSheetName('A'.repeat(50)).length, 31);
  assert.equal(sanitizeSheetName(''), 'Sheet');
});

test('mergeExcelWorkbooks in single_sheet mode aligns columns by header name', () => {
  const wb1 = {
    name: 'East.xlsx',
    selectedSheetIndex: 'all',
    sheets: [
      {
        name: 'Sheet1',
        rows: [
          ['ID', 'Name', 'Sales'],
          ['1', 'Alpha', '100'],
          ['2', 'Beta', '200'],
        ],
      },
    ],
  };

  const wb2 = {
    name: 'West.xlsx',
    selectedSheetIndex: 'all',
    sheets: [
      {
        name: 'Sheet1',
        rows: [
          // Order is different: Sales before Name, plus has extra column "Region"
          ['ID', 'Sales', 'Name', 'Region'],
          ['3', '350', 'Gamma', 'West'],
          ['4', '420', 'Delta', 'West'],
        ],
      },
    ],
  };

  const merged = mergeExcelWorkbooks([wb1, wb2], {
    mode: 'single_sheet',
    headerMode: 'header_match',
    firstRowIsHeader: true,
    addSourceColumn: false,
  });

  assert.equal(merged.mode, 'single_sheet');
  assert.equal(merged.sheets.length, 1);
  const rows = merged.sheets[0].rows;

  // Header should contain ID, Name, Sales, Region
  assert.deepEqual(rows[0], ['ID', 'Name', 'Sales', 'Region']);
  // Row 1 (from East): Region should be empty
  assert.deepEqual(rows[1], ['1', 'Alpha', '100', '']);
  assert.deepEqual(rows[2], ['2', 'Beta', '200', '']);
  // Row 3 (from West): correctly mapped by header name!
  assert.deepEqual(rows[3], ['3', 'Gamma', '350', 'West']);
  assert.deepEqual(rows[4], ['4', 'Delta', '420', 'West']);
});

test('mergeExcelWorkbooks with addSourceColumn prepends source filename', () => {
  const wb1 = {
    name: 'January.xlsx',
    selectedSheetIndex: 'all',
    sheets: [
      {
        name: 'Sheet1',
        rows: [
          ['Name', 'Score'],
          ['Alice', '95'],
        ],
      },
    ],
  };

  const wb2 = {
    name: 'February.xlsx',
    selectedSheetIndex: 'all',
    sheets: [
      {
        name: 'Sheet1',
        rows: [
          ['Name', 'Score'],
          ['Bob', '88'],
        ],
      },
    ],
  };

  const merged = mergeExcelWorkbooks([wb1, wb2], {
    mode: 'single_sheet',
    headerMode: 'header_match',
    firstRowIsHeader: true,
    addSourceColumn: true,
    sourceColumnName: 'Workbook File',
  });

  const rows = merged.sheets[0].rows;
  assert.deepEqual(rows[0], ['Workbook File', 'Name', 'Score']);
  assert.deepEqual(rows[1], ['January.xlsx', 'Alice', '95']);
  assert.deepEqual(rows[2], ['February.xlsx', 'Bob', '88']);
});

test('mergeExcelWorkbooks in multiple_sheets mode resolves colliding sheet names', () => {
  const wb1 = {
    name: 'File1.xlsx',
    selectedSheetIndex: 'all',
    sheets: [
      {
        name: 'Summary',
        rows: [['A', 'B'], ['1', '2']],
      },
      {
        name: 'Details',
        rows: [['X', 'Y'], ['7', '8']],
      },
    ],
  };

  const wb2 = {
    name: 'File2.xlsx',
    selectedSheetIndex: 'all',
    sheets: [
      {
        name: 'Summary', // Duplicate sheet name!
        rows: [['A', 'B'], ['3', '4']],
      },
      {
        name: 'Extra',
        rows: [['M', 'N'], ['9', '10']],
      },
    ],
  };

  const merged = mergeExcelWorkbooks([wb1, wb2], {
    mode: 'multiple_sheets',
  });

  assert.equal(merged.mode, 'multiple_sheets');
  assert.equal(merged.sheets.length, 4);
  assert.equal(merged.sheets[0].name, 'Summary');
  assert.equal(merged.sheets[1].name, 'Details');
  assert.equal(merged.sheets[2].name, 'Summary (2)'); // Auto-disambiguated!
  assert.equal(merged.sheets[3].name, 'Extra');
});

test('generateMergedExcelWorkbook creates valid OpenXML zip archive', async () => {
  const wb1 = {
    name: 'A.xlsx',
    selectedSheetIndex: 'all',
    sheets: [
      {
        name: 'Sheet1',
        rows: [
          ['ID', 'Name', 'Amount'],
          ['101', 'Acme Corp', '1500.50'],
          ['102', 'Beta LLC', '3200'],
        ],
      },
    ],
  };

  const wb2 = {
    name: 'B.xlsx',
    selectedSheetIndex: 'all',
    sheets: [
      {
        name: 'Sheet1',
        rows: [
          ['ID', 'Name', 'Amount'],
          ['103', 'Gamma Inc', '900'],
        ],
      },
    ],
  };

  const merged = mergeExcelWorkbooks([wb1, wb2], {
    mode: 'single_sheet',
    headerMode: 'header_match',
    firstRowIsHeader: true,
  });

  const { blob, filename } = await generateMergedExcelWorkbook(merged, { filename: 'consolidated.xlsx' });
  assert.equal(filename, 'consolidated.xlsx');
  assert.ok(blob.size > 1000);

  // Read back with JSZip to verify OpenXML structure
  const arrayBuffer = await blob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  assert.ok(zip.file('[Content_Types].xml'));
  assert.ok(zip.file('xl/workbook.xml'));
  assert.ok(zip.file('xl/styles.xml'));
  assert.ok(zip.file('xl/worksheets/sheet1.xml'));

  const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml').async('text');
  assert.match(sheet1Xml, /Acme Corp/);
  assert.match(sheet1Xml, /Gamma Inc/);
});

test('generateMergedCsv creates RFC 4180 CSV with UTF-8 BOM', () => {
  const merged = {
    sheets: [
      {
        name: 'Sheet1',
        rows: [
          ['Name', 'Company', 'Revenue'],
          ['Alice', 'Tech, Inc.', '5000'],
          ['Bob', 'Global "Logistics"', '7500'],
        ],
      },
    ],
  };

  const { blob, filename, csvText } = generateMergedCsv(merged, { filename: 'data.csv' });
  assert.equal(filename, 'data.csv');
  assert.ok(csvText.startsWith('\uFEFF'));
  assert.match(csvText, /"Tech, Inc\."/);
  assert.match(csvText, /"Global ""Logistics"""/);
});
