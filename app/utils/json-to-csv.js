/**
 * Toolifybox — High-Performance JSON to CSV Engine
 * 100% Client-Side In-Browser Conversion
 * RFC 4180 Compliant with Nested Key Flattening and Excel UTF-8 BOM
 */
import JSZip from 'jszip';

/**
 * Microsoft Excel maximum worksheet capacity is 1,048,576 rows.
 * With 1 header row, maximum data rows is 1,048,575.
 */
export const EXCEL_MAX_ROWS = 1048575;

export const JSON_CSV_SPLIT_OPTIONS = [
  { id: 'auto', label: 'Auto (Split when exceeding Excel 1,048,575 rows)', value: 'auto' },
  { id: 'none', label: 'No Splitting (Single CSV file always)', value: 'none' },
  { id: '1000000', label: '1,000,000 rows per file', value: '1000000' },
  { id: '500000', label: '500,000 rows per file', value: '500000' },
  { id: '100000', label: '100,000 rows per file', value: '100000' },
  { id: '50000', label: '50,000 rows per file', value: '50000' },
];

export const JSON_CSV_DELIMITERS = [
  { id: 'comma', label: 'Comma (,)', value: ',' },
  { id: 'semicolon', label: 'Semicolon (;)', value: ';' },
  { id: 'tab', label: 'Tab (\\t) / TSV', value: '\t' },
  { id: 'pipe', label: 'Pipe (|)', value: '|' },
];

export const JSON_CSV_QUOTE_MODES = [
  { id: 'auto', label: 'Auto (RFC 4180 — Only when needed)', value: 'auto' },
  { id: 'always', label: 'Always Quote All Fields', value: 'always' },
];

export const SAMPLE_JSON_TEMPLATES = [
  {
    id: 'ecommerce',
    title: 'E-Commerce Orders',
    description: 'Customer orders with nested shipping addresses, totals, and payment status',
    json: JSON.stringify([
      {
        orderId: 'ORD-9841',
        customer: {
          name: 'Sarah Connor',
          email: 'sarah.c@cyberdyne.io',
          phone: '+1-555-0192',
        },
        shipping: {
          city: 'Los Angeles',
          state: 'CA',
          country: 'United States',
          postalCode: '90001',
        },
        itemsCount: 3,
        totalAmount: 149.99,
        currency: 'USD',
        paymentStatus: 'PAID',
        createdAt: '2026-10-24T14:32:00Z',
      },
      {
        orderId: 'ORD-9842',
        customer: {
          name: 'Alexandre Dumas',
          email: 'alex@dumas-press.fr',
          phone: '+33-1-4268-0000',
        },
        shipping: {
          city: 'Paris',
          state: 'Île-de-France',
          country: 'France',
          postalCode: '75008',
        },
        itemsCount: 1,
        totalAmount: 45.50,
        currency: 'EUR',
        paymentStatus: 'PAID',
        createdAt: '2026-10-25T09:15:30Z',
      },
      {
        orderId: 'ORD-9843',
        customer: {
          name: 'Kenji Sato',
          email: 'kenji.s@tokyo-tech.jp',
          phone: '+81-3-5555-0143',
        },
        shipping: {
          city: 'Tokyo',
          state: 'Kanto',
          country: 'Japan',
          postalCode: '100-0001',
        },
        itemsCount: 5,
        totalAmount: 389.00,
        currency: 'USD',
        paymentStatus: 'PENDING',
        createdAt: '2026-10-26T18:45:12Z',
      },
    ], null, 2),
  },
  {
    id: 'users',
    title: 'User Directory',
    description: 'Employee profiles with job title, department, skills, and status',
    json: JSON.stringify([
      {
        id: 101,
        fullName: 'Elena Rostova',
        role: 'Lead Architect',
        department: 'Engineering',
        skills: ['Vue.js', 'Nuxt', 'Node.js', 'PostgreSQL'],
        active: true,
        salary: 135000,
        startDate: '2022-03-15',
      },
      {
        id: 102,
        fullName: 'Marcus Vance',
        role: 'Product Designer',
        department: 'Design',
        skills: ['Figma', 'Design Systems', 'UI/UX', 'Prototyping'],
        active: true,
        salary: 115000,
        startDate: '2023-01-10',
      },
      {
        id: 103,
        fullName: 'Priya Sharma',
        role: 'Data Scientist',
        department: 'Analytics',
        skills: ['Python', 'Pandas', 'TensorFlow', 'SQL'],
        active: false,
        salary: 128000,
        startDate: '2021-08-01',
      },
    ], null, 2),
  },
  {
    id: 'products',
    title: 'Product Catalog',
    description: 'Inventory items with SKU, categories, pricing, and stock levels',
    json: JSON.stringify([
      {
        sku: 'TECH-KB-99',
        productName: 'Mechanical Wireless Keyboard',
        category: 'Electronics',
        price: 89.99,
        inStock: true,
        inventoryCount: 142,
        rating: 4.8,
        tags: ['gadgets', 'peripherals', 'wireless'],
      },
      {
        sku: 'TECH-MO-44',
        productName: 'Ergonomic Vertical Mouse',
        category: 'Electronics',
        price: 49.50,
        inStock: true,
        inventoryCount: 88,
        rating: 4.6,
        tags: ['office', 'ergonomic', 'peripherals'],
      },
      {
        sku: 'DESK-PAD-01',
        productName: 'Waterproof Felt Desk Mat',
        category: 'Accessories',
        price: 24.00,
        inStock: false,
        inventoryCount: 0,
        rating: 4.9,
        tags: ['workspace', 'felt', 'desk-decor'],
      },
    ], null, 2),
  },
];

const MAX_JSON_STRING_LENGTH = 50 * 1024 * 1024; // 50MB string safety limit
const MAX_JSON_FILE_BYTES = 30 * 1024 * 1024; // 30MB file size limit

/**
 * Validates raw input string or file
 */
export function validateJsonInput(input) {
  if (input === null || input === undefined) {
    throw new Error('Please provide a JSON file or enter JSON text.');
  }
  if (typeof input === 'string') {
    if (input.trim().length === 0) {
      throw new Error('JSON text is empty. Enter valid JSON or select a starter template.');
    }
    if (input.length > MAX_JSON_STRING_LENGTH) {
      throw new Error(`JSON text is too large (${(input.length / (1024 * 1024)).toFixed(1)} MB). Limit is 50 MB.`);
    }
    return true;
  }
  if (typeof File !== 'undefined' && input instanceof File) {
    if (input.size === 0) {
      throw new Error(`File "${input.name}" is empty (0 bytes).`);
    }
    if (input.size > MAX_JSON_FILE_BYTES) {
      throw new Error(`File "${input.name}" exceeds the 30 MB size limit.`);
    }
    return true;
  }
  return true;
}

/**
 * Flattens nested objects recursively into dot-notation keys
 * e.g. { customer: { name: 'Alice' } } -> { 'customer.name': 'Alice' }
 */
export function flattenJsonObject(obj, prefix = '', delimiter = '.', maxDepth = 10, currentDepth = 0) {
  if (obj === null || typeof obj !== 'object' || currentDepth >= maxDepth) {
    return { [prefix]: obj };
  }

  const result = {};

  if (Array.isArray(obj)) {
    // If it's an array of primitives, join into clean string
    const isPrimitiveArray = obj.every(
      item => item === null || typeof item !== 'object'
    );
    if (isPrimitiveArray) {
      result[prefix] = obj.map(item => (item === null || item === undefined ? '' : String(item))).join('; ');
      return result;
    }
    // Array of objects
    if (obj.length === 0) {
      result[prefix] = '';
      return result;
    }
    // Serialize nested array of objects as JSON string
    result[prefix] = JSON.stringify(obj);
    return result;
  }

  const keys = Object.keys(obj);
  if (keys.length === 0 && prefix) {
    result[prefix] = '{}';
    return result;
  }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const newPrefix = prefix ? `${prefix}${delimiter}${key}` : key;
    const val = obj[key];

    if (val !== null && typeof val === 'object') {
      if (Array.isArray(val)) {
        const isPrimitiveArray = val.every(
          item => item === null || typeof item !== 'object'
        );
        if (isPrimitiveArray) {
          result[newPrefix] = val.map(item => (item === null || item === undefined ? '' : String(item))).join('; ');
        } else {
          result[newPrefix] = JSON.stringify(val);
        }
      } else {
        const nestedFlattened = flattenJsonObject(val, newPrefix, delimiter, maxDepth, currentDepth + 1);
        Object.assign(result, nestedFlattened);
      }
    } else {
      result[newPrefix] = val;
    }
  }

  return result;
}

/**
 * Fast RFC 4180 Escaping for CSV values
 */
export function escapeCsvValue(val, delimiter = ',', quoteMode = 'auto') {
  if (val === null || val === undefined) {
    return '';
  }

  let str = typeof val === 'string' ? val : String(val);

  if (quoteMode === 'always') {
    return `"${str.replaceAll('"', '""')}"`;
  }

  // Auto RFC 4180: quote if string contains delimiter, double quote, carriage return, or newline
  const needsQuotes = str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r');

  if (needsQuotes) {
    return `"${str.replaceAll('"', '""')}"`;
  }

  return str;
}

/**
 * Resilient JSON Parser
 * Supports standard JSON, NDJSON (JSON Lines), and wrapped arrays { data: [...] }
 */
export function parseJsonData(rawText) {
  if (typeof rawText !== 'string') {
    throw new Error('Input must be a valid JSON string.');
  }

  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('Input is empty.');
  }

  let parsed = null;

  // 1. Try standard JSON.parse
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    // 2. Try parsing as NDJSON / JSON Lines (line delimited JSON)
    const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      try {
        const ndjsonItems = [];
        for (const line of lines) {
          ndjsonItems.push(JSON.parse(line));
        }
        parsed = ndjsonItems;
      } catch {
        // Fall back to original JSON parse error with friendly message
        const posMatch = err.message.match(/position\s+(\d+)/i);
        let errorDetail = err.message;
        if (posMatch) {
          const charIndex = parseInt(posMatch[1], 10);
          const linesUpToError = trimmed.slice(0, charIndex).split('\n');
          const lineNum = linesUpToError.length;
          const colNum = linesUpToError[linesUpToError.length - 1].length + 1;
          errorDetail = `Syntax error at Line ${lineNum}, Column ${colNum}: ${err.message}`;
        }
        throw new Error(`Invalid JSON: ${errorDetail}`);
      }
    } else {
      const posMatch = err.message.match(/position\s+(\d+)/i);
      let errorDetail = err.message;
      if (posMatch) {
        const charIndex = parseInt(posMatch[1], 10);
        const linesUpToError = trimmed.slice(0, charIndex).split('\n');
        const lineNum = linesUpToError.length;
        const colNum = linesUpToError[linesUpToError.length - 1].length + 1;
        errorDetail = `Syntax error at Line ${lineNum}, Column ${colNum}: ${err.message}`;
      }
      throw new Error(`Invalid JSON: ${errorDetail}`);
    }
  }

  // 3. Normalize into an array of objects
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error('JSON array is empty ([]). Please provide at least one record.');
    }

    // Check if it's an array of primitives
    const isPrimitiveArray = parsed.every(
      item => item === null || typeof item !== 'object'
    );
    if (isPrimitiveArray) {
      return parsed.map(val => ({ value: val }));
    }

    // Array of objects (or mixed)
    return parsed.map(item => {
      if (item === null || typeof item !== 'object') {
        return { value: item };
      }
      return item;
    });
  }

  if (typeof parsed === 'object' && parsed !== null) {
    // If object contains an array property like data, users, results, items, rows, find the largest array
    const keys = Object.keys(parsed);
    let bestArrayKey = null;
    let maxArrayLength = -1;

    for (const key of keys) {
      if (Array.isArray(parsed[key])) {
        if (parsed[key].length > maxArrayLength) {
          maxArrayLength = parsed[key].length;
          bestArrayKey = key;
        }
      }
    }

    // If an array property with elements was found, use it
    if (bestArrayKey && maxArrayLength > 0) {
      const items = parsed[bestArrayKey];
      return items.map(item => {
        if (item === null || typeof item !== 'object') {
          return { value: item };
        }
        return item;
      });
    }

    // Single object: return as single row
    return [parsed];
  }

  // Primitive primitive root value (e.g. just a number or string)
  throw new Error('JSON root must be an Array of records or an Object. Primitive values (numbers/strings) cannot be converted to a CSV table.');
}

/**
 * High-Performance JSON to CSV Converter
 * Converts normalized JSON array into RFC 4180 CSV string in milliseconds
 */
export function convertJsonToCsv(rawInput, options = {}) {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  validateJsonInput(rawInput);

  const rawText = typeof rawInput === 'string' ? rawInput : '';
  const rows = parseJsonData(rawText);

  const delimiter = options.delimiter || ',';
  const quoteMode = options.quoteMode || 'auto';
  const flatten = options.flatten !== false; // default true
  const includeHeaders = options.includeHeaders !== false; // default true
  const lineEnding = options.lineEnding || '\r\n'; // RFC 4180 specifies CRLF
  const excelBom = options.excelBom !== false; // default true

  // 1. Process rows & extract headers
  const processedRows = new Array(rows.length);
  const headerSet = new Set();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const flatRow = flatten ? flattenJsonObject(row, '', '.') : row;
    processedRows[i] = flatRow;

    const rowKeys = Object.keys(flatRow);
    for (let k = 0; k < rowKeys.length; k++) {
      headerSet.add(rowKeys[k]);
    }
  }

  const headers = Array.from(headerSet);

  if (headers.length === 0) {
    throw new Error('No valid fields found in JSON to generate CSV columns.');
  }

  // Helper to compile an array of rows into a CSV string
  function buildCsvString(rowSlice) {
    const lines = [];
    if (includeHeaders) {
      const headerLine = headers
        .map(h => escapeCsvValue(h, delimiter, quoteMode))
        .join(delimiter);
      lines.push(headerLine);
    }

    for (let i = 0; i < rowSlice.length; i++) {
      const row = rowSlice[i];
      const rowValues = new Array(headers.length);

      for (let h = 0; h < headers.length; h++) {
        const header = headers[h];
        const val = row[header];
        rowValues[h] = escapeCsvValue(val, delimiter, quoteMode);
      }

      lines.push(rowValues.join(delimiter));
    }

    const csvBody = lines.join(lineEnding);
    return excelBom ? `\uFEFF${csvBody}` : csvBody;
  }

  // 2. Build Full Single CSV String
  const fullCsv = buildCsvString(processedRows);

  // 3. Multi-File Chunking / Excel Row Limit Handling
  let maxRowsPerFile = 0;
  if (options.splitMode === 'none') {
    maxRowsPerFile = 0;
  } else if (options.splitMode === 'auto' || !options.splitMode) {
    if (processedRows.length > EXCEL_MAX_ROWS) {
      maxRowsPerFile = EXCEL_MAX_ROWS;
    }
  } else {
    const parsed = parseInt(options.splitMode, 10);
    if (!isNaN(parsed) && parsed > 0) {
      maxRowsPerFile = parsed;
    }
  }

  const parts = [];
  const baseName = (options.baseFilename || 'data.csv').replace(/\.csv$/i, '');

  if (maxRowsPerFile > 0 && processedRows.length > maxRowsPerFile) {
    const totalParts = Math.ceil(processedRows.length / maxRowsPerFile);
    for (let p = 0; p < totalParts; p++) {
      const startIdx = p * maxRowsPerFile;
      const endIdx = Math.min(startIdx + maxRowsPerFile, processedRows.length);
      const chunkRows = processedRows.slice(startIdx, endIdx);
      const partCsv = buildCsvString(chunkRows);
      const partFilename = `${baseName}_part${p + 1}.csv`;
      const partByteSize = new Blob([partCsv], { type: 'text/csv;charset=utf-8;' }).size;

      parts.push({
        partNumber: p + 1,
        filename: partFilename,
        rowsCount: chunkRows.length,
        startRowIndex: startIdx + 1,
        endRowIndex: endIdx,
        csv: partCsv,
        byteSize: partByteSize,
      });
    }
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const durationMs = Math.max(1, Math.round((endTime - startTime) * 10) / 10);

  const byteSize = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' }).size;

  return {
    csv: fullCsv,
    headers,
    rowsCount: processedRows.length,
    colsCount: headers.length,
    // Provide full dataset for seamless pagination without artificial 100 row cutoff
    previewRows: processedRows,
    durationMs,
    byteSize,
    isSplit: parts.length > 1,
    parts,
    excelRowLimit: EXCEL_MAX_ROWS,
    exceedsExcelLimit: processedRows.length > EXCEL_MAX_ROWS,
  };
}

/**
 * Packages multiple CSV part files into a downloadable ZIP archive using JSZip
 */
export async function packageCsvPartsZip(parts = [], zipFilename = 'converted_csv_parts.zip') {
  if (!parts || !parts.length) {
    throw new Error('No CSV parts to package.');
  }

  const zip = new JSZip();
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const name = part.filename || `data_part${i + 1}.csv`;
    zip.file(name, part.csv);
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Creates safe output CSV filename from original JSON filename
 */
export function jsonToCsvFilename(originalName = 'data.json') {
  if (!originalName || typeof originalName !== 'string') {
    return 'data.csv';
  }
  const clean = originalName.trim().replace(/[\\/:*?"<>|]/g, '-');
  const base = clean.replace(/\.(json|jsonl|ndjson|txt)$/i, '');
  return `${base || 'export'}.csv`;
}
