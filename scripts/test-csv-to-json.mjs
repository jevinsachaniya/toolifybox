import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectDelimiter,
  parseCsvRows,
  inferValueType,
  unflattenObject,
  csvToJsonFilename,
  convertCsvToJson,
  validateCsvInput,
  CSV_JSON_DELIMITERS,
  CSV_JSON_OUTPUT_MODES,
  SAMPLE_CSV_TEMPLATES,
} from '../app/utils/csv-to-json.js';

test('detectDelimiter accurately identifies comma, semicolon, tab, and pipe', () => {
  const commaCsv = 'name,age,city\nAlice,30,London\nBob,25,Paris';
  assert.equal(detectDelimiter(commaCsv), ',');

  const semiCsv = 'name;age;city\nAlice;30;London\nBob;25;Paris';
  assert.equal(detectDelimiter(semiCsv), ';');

  const tabCsv = 'name\tage\tcity\nAlice\t30\tLondon\nBob\t25\tParis';
  assert.equal(detectDelimiter(tabCsv), '\t');

  const pipeCsv = 'name|age|city\nAlice|30|London\nBob|25|Paris';
  assert.equal(detectDelimiter(pipeCsv), '|');
});

test('parseCsvRows handles RFC 4180 quotes, commas inside quotes, and escaped quotes', () => {
  const csv = 'id,name,bio\n1,"Sarah, Connor","She said, ""I\'ll be back!"""\n2,John,"Normal bio"';
  const rows = parseCsvRows(csv, ',');

  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], ['id', 'name', 'bio']);
  assert.deepEqual(rows[1], ['1', 'Sarah, Connor', 'She said, "I\'ll be back!"']);
  assert.deepEqual(rows[2], ['2', 'John', 'Normal bio']);
});

test('parseCsvRows handles multiline fields within quotes and CRLF', () => {
  const csv = "id,notes\r\n1,\"Line 1\nLine 2\nLine 3\"\r\n2,\"Done\"\r\n";
  const rows = parseCsvRows(csv, ',');

  assert.equal(rows.length, 3);
  assert.equal(rows[1][1], 'Line 1\nLine 2\nLine 3');
  assert.equal(rows[2][1], 'Done');
});

test('inferValueType properly parses numbers, booleans, and preserves special strings', () => {
  assert.equal(inferValueType('true', true), true);
  assert.equal(inferValueType('false', true), false);
  assert.equal(inferValueType('null', true), null);
  assert.equal(inferValueType('42', true), 42);
  assert.equal(inferValueType('-15.75', true), -15.75);
  // Preserves leading zero strings
  assert.equal(inferValueType('01234', true), '01234');
  // Regular text remains string
  assert.equal(inferValueType('hello world', true), 'hello world');
  // Disabled autoTypes keeps string
  assert.equal(inferValueType('42', false), '42');
});

test('unflattenObject correctly nests dot-notated keys into deep objects', () => {
  const flat = {
    orderId: 'ORD-101',
    'customer.name': 'Alice',
    'customer.address.city': 'New York',
    'customer.address.zip': 10001,
  };

  const nested = unflattenObject(flat);
  assert.deepEqual(nested, {
    orderId: 'ORD-101',
    customer: {
      name: 'Alice',
      address: {
        city: 'New York',
        zip: 10001,
      },
    },
  });
});

test('convertCsvToJson produces valid Array of Objects JSON', () => {
  const csv = `id,name,score,active\n101,Alice,95.5,true\n102,Bob,88,false`;
  const result = convertCsvToJson(csv, { outputFormat: 'array' });

  assert.equal(result.rowsCount, 2);
  assert.equal(result.colsCount, 4);
  assert.deepEqual(result.headers, ['id', 'name', 'score', 'active']);

  const parsed = JSON.parse(result.json);
  assert.equal(Array.isArray(parsed), true);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].name, 'Alice');
  assert.equal(parsed[0].score, 95.5);
  assert.equal(parsed[0].active, true);
});

test('convertCsvToJson supports Keyed Object, 2D Matrix, and NDJSON modes', () => {
  const csv = `sku,name,price\nK-1,Keyboard,89\nM-1,Mouse,45`;

  // Keyed
  const keyedResult = convertCsvToJson(csv, { outputFormat: 'keyed' });
  const keyed = JSON.parse(keyedResult.json);
  assert.equal(keyed['K-1'].name, 'Keyboard');
  assert.equal(keyed['M-1'].price, 45);

  // 2D Matrix
  const matrixResult = convertCsvToJson(csv, { outputFormat: '2d' });
  const matrix = JSON.parse(matrixResult.json);
  assert.deepEqual(matrix.headers, ['sku', 'name', 'price']);
  assert.deepEqual(matrix.rows[0], ['K-1', 'Keyboard', 89]);

  // NDJSON
  const ndjsonResult = convertCsvToJson(csv, { outputFormat: 'ndjson' });
  const lines = ndjsonResult.json.trim().split('\n');
  assert.equal(lines.length, 2);
  assert.equal(JSON.parse(lines[0]).name, 'Keyboard');
  assert.equal(JSON.parse(lines[1]).name, 'Mouse');
});

test('csvToJsonFilename produces clean .json and .ndjson filenames', () => {
  assert.equal(csvToJsonFilename('inventory.csv'), 'inventory.json');
  assert.equal(csvToJsonFilename('orders.tsv', true), 'orders.ndjson');
  assert.equal(csvToJsonFilename(''), 'data.json');
});

test('SAMPLE_CSV_TEMPLATES contains valid parseable datasets', () => {
  for (const template of SAMPLE_CSV_TEMPLATES) {
    const res = convertCsvToJson(template.csv);
    assert.ok(res.rowsCount > 0);
    assert.ok(res.colsCount > 0);
    assert.ok(res.json.length > 50);
  }
});

