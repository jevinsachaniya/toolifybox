import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertJsonToCsv,
  escapeCsvValue,
  flattenJsonObject,
  jsonToCsvFilename,
  JSON_CSV_DELIMITERS,
  parseJsonData,
  SAMPLE_JSON_TEMPLATES,
  validateJsonInput,
} from '../app/utils/json-to-csv.js';

test('validateJsonInput validates strings and rejects empty inputs', () => {
  assert.equal(validateJsonInput('{"name": "test"}'), true);
  assert.throws(() => validateJsonInput(''), /empty/i);
  assert.throws(() => validateJsonInput('   '), /empty/i);
  assert.throws(() => validateJsonInput(null), /provide a JSON/i);
});

test('jsonToCsvFilename produces clean .csv filenames', () => {
  assert.equal(jsonToCsvFilename('users.json'), 'users.csv');
  assert.equal(jsonToCsvFilename('export-2026.ndjson'), 'export-2026.csv');
  assert.equal(jsonToCsvFilename('raw_data.txt'), 'raw_data.csv');
  assert.equal(jsonToCsvFilename(''), 'data.csv');
  assert.equal(jsonToCsvFilename('in/valid*name?.json'), 'in-valid-name-.csv');
});

test('parseJsonData parses standard JSON arrays and objects', () => {
  const arr = parseJsonData('[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]');
  assert.equal(arr.length, 2);
  assert.equal(arr[0].name, 'Alice');

  const single = parseJsonData('{"title": "Report", "views": 150}');
  assert.equal(single.length, 1);
  assert.equal(single[0].title, 'Report');
});

test('parseJsonData auto-detects wrapped arrays in objects { data: [...] }', () => {
  const wrapped = parseJsonData('{"status": 200, "data": [{"sku": "A1", "price": 10}, {"sku": "B2", "price": 20}]}');
  assert.equal(wrapped.length, 2);
  assert.equal(wrapped[0].sku, 'A1');
});

test('parseJsonData auto-detects NDJSON / JSON Lines', () => {
  const ndjson = `{"id": 10, "tag": "prod"}
{"id": 11, "tag": "dev"}
{"id": 12, "tag": "staging"}`;
  const rows = parseJsonData(ndjson);
  assert.equal(rows.length, 3);
  assert.equal(rows[1].tag, 'dev');
});

test('flattenJsonObject flattens nested objects into dot-notation', () => {
  const nested = {
    id: 1,
    user: {
      profile: {
        firstName: 'John',
        lastName: 'Doe',
      },
      contacts: ['work@corp.com', 'personal@gmail.com'],
    },
    active: true,
  };
  const flat = flattenJsonObject(nested);
  assert.equal(flat['user.profile.firstName'], 'John');
  assert.equal(flat['user.profile.lastName'], 'Doe');
  assert.equal(flat['user.contacts'], 'work@corp.com; personal@gmail.com');
  assert.equal(flat.active, true);
});

test('escapeCsvValue follows RFC 4180 standard escaping', () => {
  assert.equal(escapeCsvValue('SimpleText'), 'SimpleText');
  assert.equal(escapeCsvValue('Text, with comma'), '"Text, with comma"');
  assert.equal(escapeCsvValue('Text with "quotes"'), '"Text with ""quotes"""');
  assert.equal(escapeCsvValue('Line 1\nLine 2'), '"Line 1\nLine 2"');
  assert.equal(escapeCsvValue(null), '');
  assert.equal(escapeCsvValue(123), '123');
  assert.equal(escapeCsvValue('Force', ',', 'always'), '"Force"');
});

test('convertJsonToCsv converts JSON array to RFC 4180 CSV with BOM', () => {
  const json = JSON.stringify([
    { id: 1, name: 'Alice, Smith', city: 'London' },
    { id: 2, name: 'Bob "The Builder"', city: 'Berlin' },
  ]);

  const result = convertJsonToCsv(json, { excelBom: true });
  assert.equal(result.rowsCount, 2);
  assert.equal(result.colsCount, 3);
  assert.ok(result.csv.startsWith('\uFEFFid,name,city'));
  assert.ok(result.csv.includes('"Alice, Smith"'));
  assert.ok(result.csv.includes('"Bob ""The Builder"""'));
});

test('convertJsonToCsv supports semicolon delimiter and no BOM', () => {
  const json = JSON.stringify([
    { product: 'Phone', price: 999 },
    { product: 'Tablet', price: 599 },
  ]);

  const result = convertJsonToCsv(json, { delimiter: ';', excelBom: false });
  assert.ok(!result.csv.startsWith('\uFEFF'));
  assert.ok(result.csv.includes('product;price'));
  assert.ok(result.csv.includes('Phone;999'));
});

test('convertJsonToCsv completes in < 25ms for 500 records (ultra-fast)', () => {
  const dataset = [];
  for (let i = 0; i < 500; i++) {
    dataset.push({
      id: i,
      name: `User ${i}`,
      email: `user${i}@domain.com`,
      meta: {
        score: i * 1.5,
        status: i % 2 === 0 ? 'active' : 'idle',
      },
    });
  }

  const start = Date.now();
  const res = convertJsonToCsv(JSON.stringify(dataset));
  const diff = Date.now() - start;

  assert.equal(res.rowsCount, 500);
  assert.equal(res.colsCount, 5);
  // Verify no artificial 100 row limit on previewRows
  assert.equal(res.previewRows.length, 500);
  assert.ok(diff < 25, `Expected < 25ms, got ${diff}ms`);
});

test('convertJsonToCsv splits large datasets into multiple Excel-compatible files when exceeding limit', () => {
  const records = [];
  for (let i = 1; i <= 125; i++) {
    records.push({ id: i, sku: `SKU-${i}`, qty: i * 2 });
  }

  // Split at 50 rows per file
  const res = convertJsonToCsv(JSON.stringify(records), {
    splitMode: '50',
    baseFilename: 'products.csv',
  });

  assert.equal(res.isSplit, true);
  assert.equal(res.parts.length, 3);
  assert.equal(res.parts[0].filename, 'products_part1.csv');
  assert.equal(res.parts[0].rowsCount, 50);
  assert.equal(res.parts[1].filename, 'products_part2.csv');
  assert.equal(res.parts[1].rowsCount, 50);
  assert.equal(res.parts[2].filename, 'products_part3.csv');
  assert.equal(res.parts[2].rowsCount, 25);

  // Each part contains header line
  assert.ok(res.parts[0].csv.includes('id,sku,qty'));
  assert.ok(res.parts[1].csv.includes('id,sku,qty'));
  assert.ok(res.parts[2].csv.includes('id,sku,qty'));
});

test('packageCsvPartsZip bundles parts into valid ZIP blob', async () => {
  const { packageCsvPartsZip } = await import('../app/utils/json-to-csv.js');
  const mockParts = [
    { filename: 'data_part1.csv', csv: 'id,name\n1,Alice' },
    { filename: 'data_part2.csv', csv: 'id,name\n2,Bob' },
  ];

  const blob = await packageCsvPartsZip(mockParts, 'test.zip');
  assert.ok(blob);
  assert.ok(blob.size > 0);
});

test('SAMPLE_JSON_TEMPLATES contains valid parseable sample datasets', () => {
  assert.ok(SAMPLE_JSON_TEMPLATES.length >= 3);
  for (const t of SAMPLE_JSON_TEMPLATES) {
    const parsed = parseJsonData(t.json);
    assert.ok(parsed.length > 0);
  }
});

