/**
 * PDF to Excel (.xlsx & .csv) Converter Engine
 * 100% In-Browser WebAssembly / Canvas coordinate extraction
 * Generates genuine Microsoft Excel OpenXML (.xlsx) and RFC 4180 CSV
 */
import JSZip from 'jszip';

export const MAX_PDF_TO_EXCEL_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
export const SUPPORTED_PDF_MIME_TYPES = ['application/pdf'];

/**
 * Validates an uploaded PDF file for the Excel converter
 * @param {File} file
 * @returns {string|null}
 */
export function validatePdfToExcelFile(file) {
  if (!file) return 'Please choose a PDF document to convert.';
  const name = file.name || '';
  const ext = (name.split('.').pop() || '').toLowerCase();

  if (ext !== 'pdf' && file.type !== 'application/pdf') {
    return `"${name}" is not a PDF file. Please select a valid .pdf document.`;
  }

  if (file.size <= 0) {
    return `"${name}" is an empty file (0 bytes).`;
  }

  if (file.size > MAX_PDF_TO_EXCEL_FILE_SIZE) {
    return `"${name}" exceeds the 50 MB file size limit. Please select a smaller PDF.`;
  }

  return null;
}

/**
 * Escapes special XML characters for OpenXML (.xlsx) output
 * @param {string} str
 * @returns {string}
 */
export function escapeXml(str = '') {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

/**
 * Converts 0-based column index to Excel column letters (0 -> 'A', 26 -> 'AA')
 * @param {number} colNumber
 * @returns {string}
 */
export function indexToColLetters(colNumber) {
  let temp;
  let letter = '';
  let n = colNumber + 1;
  while (n > 0) {
    temp = (n - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    n = Math.floor((n - temp) / 26);
  }
  return letter;
}

/**
 * Clusters 1D numbers (like Y coordinates or X coordinates) into groups within a tolerance
 * @param {number[]} values
 * @param {number} tolerance
 * @returns {number[]} Array of cluster centroids
 */
export function clusterCoordinates(values, tolerance = 3.5) {
  if (!values.length) return [];
  const sorted = [...new Set(values.map(v => Math.round(v * 10) / 10))].sort((a, b) => a - b);
  const clusters = [];
  let currentCluster = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const val = sorted[i];
    const prev = sorted[i - 1];
    if (val - prev <= tolerance) {
      currentCluster.push(val);
    } else {
      const avg = currentCluster.reduce((sum, v) => sum + v, 0) / currentCluster.length;
      clusters.push(avg);
      currentCluster = [val];
    }
  }

  if (currentCluster.length) {
    const avg = currentCluster.reduce((sum, v) => sum + v, 0) / currentCluster.length;
    clusters.push(avg);
  }

  return clusters;
}

/**
 * Reconstructs a 2D table grid from raw PDF text items with coordinates
 * @param {Array<{str: string, x: number, y: number, width: number, height: number}>} rawItems
 * @param {object} options
 * @returns {string[][]} 2D array of rows and cells
 */
export function extractTableFromTextItems(rawItems = [], options = {}) {
  const {
    mode = 'smart_table', // 'smart_table' | 'grid' | 'line_by_line'
    rowTolerance = 3.5,
    colTolerance = 12.0,
    minWordGap = 4.0,
    skipEmptyRows = true,
    cleanWhitespace = true,
  } = options;

  // Filter out whitespace-only items
  const items = rawItems
    .map(item => ({
      str: cleanWhitespace ? (item.str || '').normalize('NFKC').replace(/[\r\n\t]+/g, ' ').trim() : (item.str || '').normalize('NFKC'),
      x: Number(item.x ?? item.transform?.[4] ?? 0),
      y: Number(item.y ?? item.transform?.[5] ?? 0),
      width: Number(item.width ?? 0),
      height: Number(item.height ?? 0),
    }))
    .filter(item => item.str.length > 0);

  if (!items.length) return [];

  // 1. Sort by Y descending (PDF coordinates start at bottom: higher Y = higher on page)
  items.sort((a, b) => b.y - a.y || a.x - b.x);

  // 2. Cluster into horizontal rows
  const rows = [];
  let currentRow = [items[0]];

  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    const rowY = currentRow[0].y;

    if (Math.abs(rowY - item.y) <= rowTolerance) {
      currentRow.push(item);
    } else {
      rows.push(currentRow);
      currentRow = [item];
    }
  }
  if (currentRow.length) rows.push(currentRow);

  // 3. Within each row, sort left-to-right (X ascending) and merge adjacent text fragments
  const mergedRows = rows.map(rowItems => {
    rowItems.sort((a, b) => a.x - b.x);
    const consolidated = [];
    let curr = { ...rowItems[0] };

    for (let i = 1; i < rowItems.length; i++) {
      const next = rowItems[i];
      const gap = next.x - (curr.x + curr.width);

      // If text fragments are very close horizontally, join them into a single word / phrase
      if (gap < minWordGap) {
        const needsSpace = !curr.str.endsWith(' ') && !next.str.startsWith(' ');
        curr.str += (needsSpace ? ' ' : '') + next.str;
        curr.width = (next.x + next.width) - curr.x;
      } else {
        consolidated.push(curr);
        curr = { ...next };
      }
    }
    consolidated.push(curr);
    return consolidated;
  });

  if (mode === 'line_by_line') {
    // Each line is either split by large spaces / tabs / commas, or kept in single cell
    return mergedRows.map(row => {
      const lineText = row.map(item => item.str).join(' ');
      if (lineText.includes('\t')) return lineText.split('\t').map(s => s.trim());
      if (lineText.includes(' | ')) return lineText.split(' | ').map(s => s.trim());
      // Multi-space separation (3 or more spaces)
      if (/\s{3,}/.test(lineText)) return lineText.split(/\s{3,}/).map(s => s.trim());
      return row.map(item => item.str.trim());
    });
  }

  // 4. Smart Column Clustering: Find common horizontal column starting boundaries
  const allXCoords = mergedRows.flatMap(row => row.map(item => item.x));
  const columnCentroids = clusterCoordinates(allXCoords, colTolerance);
  columnCentroids.sort((a, b) => a - b);

  if (!columnCentroids.length) {
    return mergedRows.map(row => row.map(item => item.str));
  }

  // 5. Map each row's items into the column buckets
  const tableGrid = mergedRows.map(row => {
    const rowCells = new Array(columnCentroids.length).fill('');

    row.forEach(item => {
      // Find closest column cluster
      let bestColIdx = 0;
      let minDistance = Infinity;

      for (let c = 0; c < columnCentroids.length; c++) {
        const dist = Math.abs(columnCentroids[c] - item.x);
        if (dist < minDistance) {
          minDistance = dist;
          bestColIdx = c;
        }
      }

      if (rowCells[bestColIdx]) {
        rowCells[bestColIdx] += ' ' + item.str;
      } else {
        rowCells[bestColIdx] = item.str;
      }
    });

    return rowCells.map(c => c.trim());
  });

  // 6. Clean empty columns (if an entire column is empty across all rows)
  if (tableGrid.length > 0 && columnCentroids.length > 1) {
    const activeColIndices = [];
    for (let c = 0; c < columnCentroids.length; c++) {
      const hasContent = tableGrid.some(row => (row[c] || '').trim().length > 0);
      if (hasContent) activeColIndices.push(c);
    }

    if (activeColIndices.length > 0 && activeColIndices.length < columnCentroids.length) {
      return tableGrid.map(row => activeColIndices.map(c => row[c] || ''));
    }
  }

  // 7. Filter empty rows if requested
  if (skipEmptyRows) {
    return tableGrid.filter(row => row.some(cell => cell.trim().length > 0));
  }

  return tableGrid;
}

/**
 * Extracts tables from a PDF document using PDF.js
 * @param {File|ArrayBuffer|Uint8Array} fileOrData
 * @param {object} options
 * @returns {Promise<{sheets: Array<{name: string, rows: string[][], rowCount: number, colCount: number, headers: string[]}>, totalPages: number}>}
 */
export async function extractPdfTableData(fileOrData, options = {}) {
  const {
    signal,
    onProgress = () => {},
    mode = 'smart_table',
    mergePages = true,
    detectHeaders = true,
  } = options;

  let pdfjs;
  if (typeof window !== 'undefined') {
    const [lib, { default: workerUrl }] = await Promise.all([
      import('pdfjs-dist/build/pdf.mjs'),
      import('pdfjs-dist/build/pdf.worker.mjs?url'),
    ]);
    pdfjs = lib;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  } else {
    // Node.js test environment fallback
    pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }

  if (signal?.aborted) throw new DOMException('Conversion cancelled', 'AbortError');

  onProgress('Reading PDF structure…', 0, 100);

  let data;
  if (fileOrData instanceof Uint8Array) {
    data = fileOrData;
  } else if (fileOrData instanceof ArrayBuffer) {
    data = new Uint8Array(fileOrData);
  } else if (typeof fileOrData?.arrayBuffer === 'function') {
    data = new Uint8Array(await fileOrData.arrayBuffer());
  } else {
    throw new Error('Invalid file input. Please provide a PDF document.');
  }

  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    isEvalSupported: false,
  });

  if (signal) {
    signal.addEventListener('abort', () => void loadingTask.destroy().catch(() => {}), { once: true });
  }

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const rawSheets = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (signal?.aborted) throw new DOMException('Conversion cancelled', 'AbortError');

    onProgress(`Extracting page ${pageNum} of ${numPages}…`, pageNum, numPages);

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent({ normalizeWhitespace: true });

    const items = textContent.items.map(item => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
      width: item.width,
      height: item.height,
    }));

    const rows = extractTableFromTextItems(items, { mode });

    let headers = [];
    if (detectHeaders && rows.length > 0) {
      headers = [...rows[0]];
    }

    rawSheets.push({
      name: `Page ${pageNum}`,
      rows,
      rowCount: rows.length,
      colCount: rows.reduce((max, r) => Math.max(max, r.length), 0),
      headers,
    });
  }

  if (mergePages && rawSheets.length > 1) {
    onProgress('Merging all pages into continuous master sheet…', numPages, numPages);

    // Compute max columns across all sheets
    const maxCols = Math.max(...rawSheets.map(s => s.colCount), 1);
    const masterRows = [];

    // Master headers from first page
    const masterHeaders = rawSheets[0].headers.length
      ? rawSheets[0].headers
      : Array.from({ length: maxCols }, (_, i) => `Column ${indexToColLetters(i)}`);

    rawSheets.forEach((sheet, idx) => {
      // Normalize row width to maxCols
      sheet.rows.forEach((r, rIdx) => {
        // If it's subsequent page and first row matches page 1 headers, skip redundant header
        if (idx > 0 && rIdx === 0 && detectHeaders) {
          const isRepeatHeader = r.every((cell, cIdx) => cell === (masterHeaders[cIdx] || ''));
          if (isRepeatHeader) return;
        }

        const paddedRow = new Array(maxCols).fill('');
        r.forEach((cell, cIdx) => {
          if (cIdx < maxCols) paddedRow[cIdx] = cell;
        });
        masterRows.push(paddedRow);
      });
    });

    return {
      sheets: [
        {
          name: 'Extracted PDF Data',
          rows: masterRows,
          rowCount: masterRows.length,
          colCount: maxCols,
          headers: masterHeaders,
        },
      ],
      totalPages: numPages,
    };
  }

  return {
    sheets: rawSheets,
    totalPages: numPages,
  };
}

/**
 * Builds an authentic Microsoft Excel OpenXML (.xlsx) zip package
 * @param {Array<{name: string, rows: string[][]}>} sheets
 * @param {object} options
 * @returns {Promise<Blob|Buffer>}
 */
export async function generatePdfExcelWorkbook(sheets, { filename = 'extracted-pdf.xlsx' } = {}) {
  const zip = new JSZip();

  const validSheets = sheets && sheets.length ? sheets : [
    { name: 'Sheet1', rows: [['No Data Found']] },
  ];

  // 1. [Content_Types].xml
  let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`;

  validSheets.forEach((_, idx) => {
    contentTypesXml += `\n  <Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  });
  contentTypesXml += `\n</Types>`;
  zip.file('[Content_Types].xml', contentTypesXml);

  // 2. _rels/.rels
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
  zip.file('_rels/.rels', rootRelsXml);

  // 3. xl/_rels/workbook.xml.rels
  let workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;

  validSheets.forEach((_, idx) => {
    workbookRelsXml += `\n  <Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`;
  });
  workbookRelsXml += `\n</Relationships>`;
  zip.file('xl/_rels/workbook.xml.rels', workbookRelsXml);

  // 4. xl/workbook.xml
  let workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>`;

  validSheets.forEach((sheet, idx) => {
    const safeName = escapeXml(sheet.name || `Sheet${idx + 1}`).slice(0, 31);
    workbookXml += `\n    <sheet name="${safeName}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>`;
  });
  workbookXml += `\n  </sheets>\n</workbook>`;
  zip.file('xl/workbook.xml', workbookXml);

  // 5. xl/styles.xml (Header styling: Dark Slate #1E293B, White Bold text, Clean cell borders)
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font>
      <sz val="11"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
    <font>
      <b/>
      <sz val="11"/>
      <color rgb="FFFFFFFF"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="FF1E293B"/>
        <bgColor indexed="64"/>
      </patternFill>
    </fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFE2E8F0"/></left>
      <right style="thin"><color rgb="FFE2E8F0"/></right>
      <top style="thin"><color rgb="FFE2E8F0"/></top>
      <bottom style="thin"><color rgb="FFE2E8F0"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <!-- 0: Standard Body Cell -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>
    <!-- 1: Header Cell (Dark Slate, White Bold text, Centered) -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <!-- 2: Number / Currency Right-Aligned Cell -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`;
  zip.file('xl/styles.xml', stylesXml);

  // 6. xl/worksheets/sheet{N}.xml
  validSheets.forEach((sheet, sheetIdx) => {
    const rows = sheet.rows || [];
    const colCount = rows.reduce((max, r) => Math.max(max, r.length), 0);

    // Calculate dynamic column widths based on content length
    const colWidths = new Array(colCount).fill(12);
    rows.forEach(r => {
      r.forEach((cell, cIdx) => {
        const len = String(cell || '').length;
        if (len + 3 > colWidths[cIdx]) {
          colWidths[cIdx] = Math.min(60, len + 3);
        }
      });
    });

    let sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>`;

    colWidths.forEach((width, idx) => {
      sheetXml += `\n    <col min="${idx + 1}" max="${idx + 1}" width="${Math.max(10, width)}" customWidth="1"/>`;
    });
    sheetXml += `\n  </cols>\n  <sheetData>`;

    rows.forEach((row, rIdx) => {
      const rowNumber = rIdx + 1;
      const isHeader = rIdx === 0;
      sheetXml += `\n    <row r="${rowNumber}" customHeight="1" ht="${isHeader ? 28 : 20}">`;

      row.forEach((cellValue, cIdx) => {
        const colLetter = indexToColLetters(cIdx);
        const cellRef = `${colLetter}${rowNumber}`;
        const strVal = String(cellValue ?? '').trim();

        // Check if numeric (digits, decimals, optional negative)
        const isNumeric = !isHeader && /^-?\d+(\.\d+)?$/.test(strVal) && strVal.length < 15;
        const styleId = isHeader ? 1 : (isNumeric ? 2 : 0);

        if (isNumeric) {
          sheetXml += `<c r="${cellRef}" s="${styleId}"><v>${strVal}</v></c>`;
        } else {
          sheetXml += `<c r="${cellRef}" s="${styleId}" t="inlineStr"><is><t>${escapeXml(strVal)}</t></is></c>`;
        }
      });

      sheetXml += `</row>`;
    });

    sheetXml += `\n  </sheetData>\n</worksheet>`;
    zip.file(`xl/worksheets/sheet${sheetIdx + 1}.xml`, sheetXml);
  });

  if (typeof window !== 'undefined') {
    return await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  } else {
    return await zip.generateAsync({ type: 'nodebuffer' });
  }
}

/**
 * Generates RFC 4180 compliant CSV string with UTF-8 BOM
 * @param {Array<string[]>} rows
 * @returns {string}
 */
export function generatePdfCsvData(rows = []) {
  const BOM = '\uFEFF';
  const csvLines = rows.map(row => {
    return row.map(cell => {
      const val = String(cell ?? '');
      if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
        return `"${val.replaceAll('"', '""')}"`;
      }
      return val;
    }).join(',');
  });

  return BOM + csvLines.join('\r\n');
}

/**
 * Generates Tab-Separated Values (TSV) string for instant clipboard pasting into Excel
 * @param {Array<string[]>} rows
 * @returns {string}
 */
export function generatePdfTsvData(rows = []) {
  return rows.map(row => {
    return row.map(cell => String(cell ?? '').replaceAll('\t', ' ').replaceAll('\n', ' ')).join('\t');
  }).join('\n');
}

/**
 * Built-in realistic sample PDF table dataset for instant demonstration
 */
export const SAMPLE_PDF_TABLE_DATA = [
  ['Invoice #', 'Transaction Date', 'Client Name', 'Service Description', 'Qty', 'Unit Price ($)', 'Tax Rate', 'Total Amount ($)'],
  ['INV-2026-081', '2026-11-02', 'Acme Global Corp', 'Enterprise Cloud Architecture & Security Audit', '1', '4,500.00', '18%', '5,310.00'],
  ['INV-2026-082', '2026-11-04', 'Vertex Logistics Ltd', 'Supply Chain ERP API Integration & Migration', '35', '120.00', '18%', '4,956.00'],
  ['INV-2026-083', '2026-11-07', 'Nexus Media Studio', 'Full-Stack Web Application Development', '1', '3,200.00', '12%', '3,584.00'],
  ['INV-2026-084', '2026-11-09', 'Apex Financial Group', 'Database Optimization & Query Tuning', '12', '175.00', '18%', '2,478.00'],
  ['INV-2026-085', '2026-11-12', 'Zenith Health Systems', 'HIPAA Healthcare Data Compliance Review', '1', '6,800.00', '0%', '6,800.00'],
  ['INV-2026-086', '2026-11-14', 'Quantum Retailers', 'Automated E-Commerce Order Fulfillment System', '4', '850.00', '18%', '4,012.00'],
  ['INV-2026-087', '2026-11-16', 'Pinnacle Analytics', 'Predictive Machine Learning Pipeline Setup', '1', '5,400.00', '18%', '6,372.00'],
];
