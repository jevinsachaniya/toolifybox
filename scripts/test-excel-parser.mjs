import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import { colToIndex, indexToCol, parseCsv, parseSharedStringsXml, parseWorksheetXml } from '../app/utils/convert-excel.js';

test('colToIndex and indexToCol correctly convert Excel column names and indexes', () => {
  assert.equal(colToIndex('A'), 0);
  assert.equal(colToIndex('B'), 1);
  assert.equal(colToIndex('Z'), 25);
  assert.equal(colToIndex('AA'), 26);
  assert.equal(colToIndex('AB'), 27);
  assert.equal(colToIndex('AZ'), 51);
  assert.equal(colToIndex('BA'), 52);

  assert.equal(indexToCol(0), 'A');
  assert.equal(indexToCol(1), 'B');
  assert.equal(indexToCol(25), 'Z');
  assert.equal(indexToCol(26), 'AA');
  assert.equal(indexToCol(27), 'AB');
  assert.equal(indexToCol(51), 'AZ');
  assert.equal(indexToCol(52), 'BA');
});

test('parseCsv handles simple, quoted, and delimiter variants', () => {
  const csv = 'Name,Age,City\nAlice,30,New York\nBob,25,San Francisco';
  const rows = parseCsv(csv);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], ['Name', 'Age', 'City']);
  assert.deepEqual(rows[1], ['Alice', '30', 'New York']);
  assert.deepEqual(rows[2], ['Bob', '25', 'San Francisco']);

  const quotedCsv = 'Item,Description,Price\nLaptop,"15-inch, 16GB RAM",1200\nPhone,"6.1"" OLED",800';
  const qRows = parseCsv(quotedCsv);
  assert.equal(qRows.length, 3);
  assert.equal(qRows[1][1], '15-inch, 16GB RAM');
  assert.equal(qRows[2][1], '6.1" OLED');
});

test('Parse simulated XLSX archive with sheets and shared strings', async () => {
  const sstXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="3" uniqueCount="3">
  <si><t>Item</t></si>
  <si><t>Category</t></si>
  <si><t>Laptop</t></si>
</sst>`;

  const sharedStrings = parseSharedStringsXml(sstXml);
  assert.deepEqual(sharedStrings, ['Item', 'Category', 'Laptop']);

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="s"><v>0</v></c>
      <c r="B1" t="s"><v>1</v></c>
      <c r="C1"><v>Price</v></c>
    </row>
    <row r="2">
      <c r="A2" t="s"><v>2</v></c>
      <c r="B2" t="inlineStr"><is><t>Electronics</t></is></c>
      <c r="C2"><v>999.99</v></c>
    </row>
  </sheetData>
</worksheet>`;

  const rows = parseWorksheetXml(sheet1Xml, sharedStrings);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], ['Item', 'Category', 'Price']);
  assert.deepEqual(rows[1], ['Laptop', 'Electronics', '999.99']);
});

