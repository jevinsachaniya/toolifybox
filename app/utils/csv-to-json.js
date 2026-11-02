/**
 * We Make PDF – High-Performance CSV to JSON Engine
 * 100% Client-Side In-Browser Conversion
 * RFC 4180 Compliant with Auto-Delimiter Detection, Type Inference,
 * Nested Key Unflattening, and Multiple JSON Output Modes.
 */

export const CSV_JSON_DELIMITERS = [
  { id: 'auto', label: 'Auto Detect (Comma, Tab, Semicolon, Pipe)', value: 'auto' },
  { id: 'comma', label: 'Comma (,)', value: ',' },
  { id: 'semicolon', label: 'Semicolon (;)', value: ';' },
  { id: 'tab', label: 'Tab (\\t) / TSV', value: '\t' },
  { id: 'pipe', label: 'Pipe (|)', value: '|' },
];

export const CSV_JSON_OUTPUT_MODES = [
  { id: 'array', label: 'Array of Objects [ { ... }, { ... } ]', value: 'array' },
  { id: 'keyed', label: 'Object Keyed by First Column { "ID": { ... } }', value: 'keyed' },
  { id: '2d', label: '2D Matrix { headers: [...], rows: [[...]] }', value: '2d' },
  { id: 'ndjson', label: 'NDJSON / JSON Lines (1 object per row)', value: 'ndjson' },
];

export const CSV_JSON_INDENT_OPTIONS = [
  { id: '2', label: '2 Spaces (Pretty)', value: 2 },
  { id: '4', label: '4 Spaces (Readable)', value: 4 },
  { id: 'minified', label: 'Minified (Compact single line)', value: 0 },
];

export const SAMPLE_CSV_TEMPLATES = [
  {
    id: 'ecommerce',
    title: 'E-Commerce Orders',
    description: 'Orders with nested customer info, shipping addresses, totals, and payment status',
    csv: `orderId,customer.name,customer.email,shipping.city,shipping.country,itemsCount,totalAmount,currency,paymentStatus
ORD-9841,"Sarah Connor",sarah.c@cyberdyne.io,"Los Angeles",USA,3,149.99,USD,PAID
ORD-9842,"Alexandre Dumas",alex@dumas-press.fr,Paris,France,1,45.50,EUR,PAID
ORD-9843,"Kenji Sato",kenji.s@tokyo-tech.jp,Tokyo,Japan,5,389.00,USD,PENDING
ORD-9844,"Elena Rostova",elena.r@nordic.se,Stockholm,Sweden,2,89.00,EUR,PAID
ORD-9845,"Mateo Silva",mateo@rio-trade.br,"Rio de Janeiro",Brazil,4,210.75,USD,REFUNDED`,
  },
  {
    id: 'users',
    title: 'User Directory',
    description: 'Employee profiles with job roles, departments, salaries, and employment status',
    csv: `id,fullName,role,department,salary,active,startDate
101,"Elena Rostova","Lead Architect",Engineering,135000,true,2022-03-15
102,"Marcus Vance","Product Designer",Design,115000,true,2023-01-10
103,"Priya Sharma","Data Scientist",Analytics,128000,false,2021-08-01
104,"Liam O'Connor","DevOps Engineer",Infrastructure,122000,true,2022-11-20
105,"Amara Diallo","Frontend Engineer",Engineering,110000,true,2023-06-01`,
  },
  {
    id: 'products',
    title: 'Product Catalog',
    description: 'Inventory items with SKU, pricing, category, ratings, and stock status',
    csv: `sku,productName,category,price,inStock,inventoryCount,rating
TECH-KB-99,"Mechanical Wireless Keyboard",Electronics,89.99,true,142,4.8
TECH-MO-44,"Ergonomic Vertical Mouse",Electronics,49.50,true,88,4.6
OFFC-DSK-01,"Dual Motor Standing Desk",Furniture,399.00,true,24,4.9
TECH-MN-27,"27-inch 4K IPS Monitor",Electronics,329.99,false,0,4.7
ACC-USB-C,"10-in-1 USB-C Docking Hub",Accessories,59.95,true,215,4.5`,
  },
  {
    id: 'finance',
    title: 'Financial Transactions',
    description: 'Bank ledger records with dates, descriptions, categories, amounts, and tax',
    csv: `txnId,date,description,category,amount,taxDeductible,status
TXN-1001,2026-10-01,"AWS Cloud Hosting",Infrastructure,-342.50,true,COMPLETED
TXN-1002,2026-10-04,"Client Retainer - Acme Corp",Revenue,4500.00,false,COMPLETED
TXN-1003,2026-10-12,"GitHub Enterprise Seats",Software,-84.00,true,COMPLETED
TXN-1004,2026-10-18,"Office Supplies & Ergonomics",Operations,-189.20,true,COMPLETED
TXN-1005,2026-10-25,"Domain Renewals",Infrastructure,-45.00,true,COMPLETED`,
  },
];

/**
 * Validates raw input string
 */
export function validateCsvInput(input) {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Input must be a valid text string.' };
  }
  const clean = input.replace(/^\uFEFF/, '').trim();
  if (!clean) {
    return { valid: false, error: 'CSV data is empty. Please provide CSV rows or upload a file.' };
  }
  return { valid: true, error: null };
}

/**
 * Detects the most probable delimiter from a CSV sample string
 * Checks commas, semicolons, tabs, and pipes across non-empty lines.
 */
export function detectDelimiter(csvString) {
  if (!csvString || typeof csvString !== 'string') return ',';

  // Sample up to first 25 lines
  const lines = csvString
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 25);

  if (lines.length === 0) return ',';

  const candidates = [',', ';', '\t', '|'];
  const scores = { ',': 0, ';': 0, '\t': 0, '|': 0 };

  for (const delim of candidates) {
    let consistentCount = null;
    let totalCount = 0;
    let isConsistent = true;

    for (const line of lines) {
      // Count delimiters outside of quotes
      let inQuotes = false;
      let count = 0;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delim && !inQuotes) {
          count++;
        }
      }

      totalCount += count;
      if (consistentCount === null) {
        consistentCount = count;
      } else if (count !== consistentCount) {
        isConsistent = false;
      }
    }

    if (totalCount > 0) {
      // Bonus for consistency across all rows
      scores[delim] = totalCount + (isConsistent && consistentCount > 0 ? lines.length * 5 : 0);
    }
  }

  // Find candidate with highest score
  let bestDelim = ',';
  let highestScore = -1;
  for (const delim of candidates) {
    if (scores[delim] > highestScore) {
      highestScore = scores[delim];
      bestDelim = delim;
    }
  }

  return highestScore > 0 ? bestDelim : ',';
}

/**
 * Robust RFC 4180 CSV parser supporting quotes, commas, escapes (""),
 * and multiline values inside quotes.
 */
export function parseCsvRows(csvString, delimiter = ',') {
  if (!csvString) return [];

  // Strip UTF-8 BOM
  const text = csvString.replace(/^\uFEFF/, '');
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  const length = text.length;

  for (let i = 0; i < length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote: "" -> "
        currentField += '"';
        i++; // skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      // End of field
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      // End of row
      currentRow.push(currentField);
      currentField = '';

      // Skip \n if this was \r\n
      if (char === '\r' && nextChar === '\n') {
        i++;
      }

      // Add row if it has content (or if it's not a trailing empty line)
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  // Push final field & row if pending
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Infers data types for string values: booleans, numbers, null
 */
export function inferValueType(str, autoTypes = true) {
  if (!autoTypes || typeof str !== 'string') return str;

  const trimmed = str.trim();
  if (trimmed === '') return '';

  // Boolean
  const lower = trimmed.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;

  // Null
  if (lower === 'null') return null;

  // Preserve leading zeros in numeric strings like "01234" (zip codes, phone codes)
  if (/^0\d+$/.test(trimmed)) {
    return trimmed;
  }

  // Standard numbers (integer or float)
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    const num = Number(trimmed);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }
  }

  return str;
}

/**
 * Unflattens flat dot-notation keys into nested objects/arrays:
 * e.g. { "customer.name": "Alice", "customer.age": 30 }
 * -> { customer: { name: "Alice", age: 30 } }
 */
export function unflattenObject(flatObj) {
  if (!flatObj || typeof flatObj !== 'object') return flatObj;

  const result = {};

  for (const [key, value] of Object.entries(flatObj)) {
    if (!key.includes('.')) {
      result[key] = value;
      continue;
    }

    const parts = key.split('.');
    let current = result;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        current[part] = value;
      } else {
        const nextPart = parts[i + 1];
        const nextIsNumeric = /^\d+$/.test(nextPart);

        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = nextIsNumeric ? [] : {};
        }
        current = current[part];
      }
    }
  }

  return result;
}

/**
 * Formats output filename based on uploaded or default name
 */
export function csvToJsonFilename(inputFilename = 'data.csv', isNdjson = false) {
  const base = inputFilename.replace(/\.[^/.]+$/, '').trim() || 'data';
  const ext = isNdjson ? 'ndjson' : 'json';
  return `${base}.${ext}`;
}

/**
 * Main CSV to JSON conversion function
 */
export function convertCsvToJson(csvString, options = {}) {
  const startTime = performance.now();
  const validation = validateCsvInput(csvString);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const {
    delimiter: requestedDelimiter = 'auto',
    hasHeaders = true,
    parseNumbersAndBooleans = true,
    unflattenNested = true,
    outputFormat = 'array', // 'array' | 'keyed' | '2d' | 'ndjson'
    indent = 2,
    trimValues = true,
  } = options;

  // Resolve delimiter
  const resolvedDelimiter =
    requestedDelimiter === 'auto'
      ? detectDelimiter(csvString)
      : requestedDelimiter;

  // Parse rows
  const rawRows = parseCsvRows(csvString, resolvedDelimiter);
  if (rawRows.length === 0) {
    throw new Error('No valid CSV rows could be parsed.');
  }

  let headers = [];
  let dataRows = [];

  if (hasHeaders) {
    headers = rawRows[0].map((h, idx) => (trimValues ? h.trim() : h) || `column_${idx + 1}`);
    dataRows = rawRows.slice(1);
  } else {
    // Generate column_1, column_2, etc.
    const maxCols = Math.max(...rawRows.map(r => r.length), 0);
    headers = Array.from({ length: maxCols }, (_, idx) => `column_${idx + 1}`);
    dataRows = rawRows;
  }

  const rowsCount = dataRows.length;
  const colsCount = headers.length;

  // Parse each row
  let parsedResult = null;

  if (outputFormat === '2d') {
    // 2D Array format: { headers: [...], rows: [[...], [...]] }
    const parsedRows = dataRows.map(row => {
      return headers.map((_, colIdx) => {
        const val = row[colIdx] !== undefined ? (trimValues ? row[colIdx].trim() : row[colIdx]) : '';
        return inferValueType(val, parseNumbersAndBooleans);
      });
    });

    parsedResult = {
      headers,
      rows: parsedRows,
    };
  } else if (outputFormat === 'keyed') {
    // Object keyed by first column value
    const keyedObj = {};
    const keyHeader = headers[0] || 'id';

    dataRows.forEach((row, rowIdx) => {
      const rowKeyRaw = row[0] !== undefined ? (trimValues ? row[0].trim() : row[0]) : '';
      const rowKey = rowKeyRaw || `row_${rowIdx + 1}`;

      const itemObj = {};
      for (let i = 1; i < headers.length; i++) {
        const header = headers[i];
        const val = row[i] !== undefined ? (trimValues ? row[i].trim() : row[i]) : '';
        itemObj[header] = inferValueType(val, parseNumbersAndBooleans);
      }

      keyedObj[rowKey] = unflattenNested ? unflattenObject(itemObj) : itemObj;
    });

    parsedResult = keyedObj;
  } else {
    // Standard Array of Objects (also used as basis for ndjson)
    const objectList = dataRows.map(row => {
      const itemObj = {};
      headers.forEach((header, colIdx) => {
        const val = row[colIdx] !== undefined ? (trimValues ? row[colIdx].trim() : row[colIdx]) : '';
        itemObj[header] = inferValueType(val, parseNumbersAndBooleans);
      });
      return unflattenNested ? unflattenObject(itemObj) : itemObj;
    });

    parsedResult = objectList;
  }

  // Format JSON text
  let jsonString = '';
  if (outputFormat === 'ndjson') {
    const list = Array.isArray(parsedResult) ? parsedResult : [parsedResult];
    jsonString = list.map(item => JSON.stringify(item)).join('\n');
  } else {
    jsonString = indent === 0
      ? JSON.stringify(parsedResult)
      : JSON.stringify(parsedResult, null, indent);
  }

  const durationMs = Math.round((performance.now() - startTime) * 10) / 10;
  const byteSize = new Blob([jsonString]).size;

  // Preview data (first 50 items for table or code preview)
  const previewRows = Array.isArray(parsedResult)
    ? parsedResult.slice(0, 50)
    : outputFormat === '2d'
      ? parsedResult.rows.slice(0, 50).map(r => {
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = r[idx];
          });
          return rowObj;
        })
      : Object.entries(parsedResult).slice(0, 50).map(([k, v]) => ({ _key: k, ...(typeof v === 'object' ? v : { value: v }) }));

  return {
    json: jsonString,
    parsedData: parsedResult,
    headers,
    rowsCount,
    colsCount,
    detectedDelimiter: resolvedDelimiter,
    durationMs,
    byteSize,
    previewRows,
  };
}

