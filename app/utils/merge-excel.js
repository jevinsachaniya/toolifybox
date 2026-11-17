/**
 * Merge Excel Workbooks & Spreadsheets Utility
 * High-performance in-browser Excel (.xlsx & .csv) parser and merger
 * Generates authentic Microsoft Excel OpenXML (.xlsx) and RFC 4180 CSV
 */
import JSZip from 'jszip';

export const SUPPORTED_EXCEL_EXTENSIONS = ['xlsx', 'csv'];
export const MAX_EXCEL_FILE_SIZE = 35 * 1024 * 1024; // 35 MB per file
export const MAX_TOTAL_FILES = 50;

/**
 * Validates an uploaded Excel or CSV file
 */
export function validateExcelMergeFile(file) {
  if (!file) return 'Please choose a file to merge.';
  const name = file.name || '';
  const ext = (name.split('.').pop() || '').toLowerCase();

  if (ext === 'xls') {
    return `"${name}" is an older binary Excel 97-2003 (.xls) file. Please open it in Excel and save as modern .xlsx or .csv before merging.`;
  }

  if (!['xlsx', 'csv'].includes(ext) && file.type !== 'text/csv' && !file.type.includes('spreadsheetml')) {
    return `"${name}" is not a supported spreadsheet. Please select modern .xlsx or .csv files.`;
  }

  if (file.size <= 0) {
    return `"${name}" is an empty file (0 bytes).`;
  }

  if (file.size > MAX_EXCEL_FILE_SIZE) {
    return `"${name}" exceeds the 35 MB per-file size limit.`;
  }

  return null;
}

/**
 * Converts Excel column letter (e.g., 'A', 'Z', 'AA') to 0-based index
 */
export function colLettersToIndex(col) {
  let index = 0;
  const upper = (col || '').toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Converts 0-based column index to Excel column letters (0 -> 'A', 26 -> 'AA')
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
 * Parses shared strings XML from an .xlsx file
 */
export function parseSharedStrings(xmlText) {
  const strings = [];
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    const siElements = doc.querySelectorAll('si');
    for (const si of siElements) {
      const texts = Array.from(si.querySelectorAll('t')).map(t => t.textContent || '');
      strings.push(texts.join(''));
    }
  } else {
    // Fast regex fallback for Node.js / unit test environments
    const siMatches = xmlText.match(/<si\b[\s\S]*?<\/si>/g) || [];
    for (const si of siMatches) {
      const tMatches = si.match(/<t\b[^>]*>([\s\S]*?)<\/t>/g) || [];
      const text = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');
      strings.push(text);
    }
  }
  return strings;
}

/**
 * Parses worksheet XML and returns 2D array of string rows
 */
export function parseWorksheet(xmlText, sharedStrings = []) {
  const rawRows = [];

  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    const rowElements = doc.querySelectorAll('row');

    for (const rowEl of rowElements) {
      const rowNumAttr = rowEl.getAttribute('r');
      const rowIndex = rowNumAttr ? parseInt(rowNumAttr, 10) - 1 : rawRows.length;
      if (!rawRows[rowIndex]) rawRows[rowIndex] = [];

      const cellElements = rowEl.querySelectorAll(':scope > c, c');
      let autoCol = 0;
      for (const cellEl of cellElements) {
        const ref = cellEl.getAttribute('r');
        let colIndex = autoCol;
        if (ref) {
          const colLetters = ref.replace(/[0-9]/g, '');
          colIndex = colLettersToIndex(colLetters);
          autoCol = colIndex + 1;
        } else {
          autoCol++;
        }

        const type = cellEl.getAttribute('t');
        let val = '';

        if (type === 's') {
          const v = cellEl.querySelector('v')?.textContent?.trim();
          if (v !== undefined && v !== '') {
            const idx = parseInt(v, 10);
            val = sharedStrings[idx] !== undefined ? sharedStrings[idx] : v;
          }
        } else if (type === 'inlineStr') {
          const isT = cellEl.querySelector('is > t, t')?.textContent;
          val = isT || '';
        } else if (type === 'b') {
          const v = cellEl.querySelector('v')?.textContent?.trim();
          val = v === '1' ? 'TRUE' : 'FALSE';
        } else {
          const v = cellEl.querySelector('v')?.textContent;
          val = v !== undefined && v !== null ? v.trim() : '';
        }

        rawRows[rowIndex][colIndex] = val;
      }
    }
  } else {
    // Regex fallback
    const rowMatches = xmlText.match(/<row\b[\s\S]*?<\/row>/g) || [];
    for (const rowXml of rowMatches) {
      const rMatch = rowXml.match(/<row[^>]*\br="(\d+)"/);
      const rowIndex = rMatch ? parseInt(rMatch[1], 10) - 1 : rawRows.length;
      if (!rawRows[rowIndex]) rawRows[rowIndex] = [];

      const cellMatches = rowXml.match(/<c\b[\s\S]*?<\/c>/g) || [];
      let autoCol = 0;
      for (const cellXml of cellMatches) {
        const refMatch = cellXml.match(/<c[^>]*\br="([A-Z]+)\d+"/);
        let colIndex = autoCol;
        if (refMatch) {
          colIndex = colLettersToIndex(refMatch[1]);
          autoCol = colIndex + 1;
        } else {
          autoCol++;
        }

        const typeMatch = cellXml.match(/<c[^>]*\bt="([^"]+)"/);
        const type = typeMatch ? typeMatch[1] : '';
        const vMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/);
        const v = vMatch ? vMatch[1].trim() : '';

        let val = '';
        if (type === 's') {
          const idx = parseInt(v, 10);
          val = sharedStrings[idx] !== undefined ? sharedStrings[idx] : v;
        } else if (type === 'inlineStr') {
          const isMatch = cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/);
          val = isMatch ? isMatch[1] : '';
        } else if (type === 'b') {
          val = v === '1' ? 'TRUE' : 'FALSE';
        } else {
          val = v;
        }

        rawRows[rowIndex][colIndex] = val;
      }
    }
  }

  return cleanMatrix(rawRows);
}

/**
 * Trims empty trailing rows and empty columns from a 2D matrix
 */
export function cleanMatrix(rawRows) {
  if (!rawRows || !rawRows.length) return [];

  // Determine max populated column index
  let maxCol = -1;
  for (const row of rawRows) {
    if (!row) continue;
    for (let c = row.length - 1; c >= 0; c--) {
      if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== '') {
        if (c > maxCol) maxCol = c;
        break;
      }
    }
  }

  if (maxCol === -1) return [];

  // Determine last populated row index
  let lastRow = -1;
  for (let r = rawRows.length - 1; r >= 0; r--) {
    const row = rawRows[r] || [];
    const hasContent = row.slice(0, maxCol + 1).some(c => c !== undefined && c !== null && String(c).trim() !== '');
    if (hasContent) {
      lastRow = r;
      break;
    }
  }

  if (lastRow === -1) return [];

  const cleaned = [];
  for (let r = 0; r <= lastRow; r++) {
    const row = rawRows[r] || [];
    const normalized = [];
    for (let c = 0; c <= maxCol; c++) {
      normalized.push(row[c] !== undefined && row[c] !== null ? String(row[c]).trim() : '');
    }
    cleaned.push(normalized);
  }
  return cleaned;
}

/**
 * RFC 4180 CSV parser supporting quotes, commas, tabs, and semicolons
 */
export function parseCsvData(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;
  const str = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Detect delimiter from sample
  const sample = str.slice(0, 2000);
  const commaCount = (sample.match(/,/g) || []).length;
  const tabCount = (sample.match(/\t/g) || []).length;
  const semicolonCount = (sample.match(/;/g) || []).length;
  let delimiter = ',';
  if (tabCount > commaCount && tabCount > semicolonCount) delimiter = '\t';
  else if (semicolonCount > commaCount) delimiter = ';';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const nextChar = str[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\n') {
        currentRow.push(currentVal.trim());
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return cleanMatrix(rows);
}

/**
 * Parses an uploaded .xlsx or .csv File/Blob into structured workbook data
 */
export async function parseUploadedWorkbook(file, { signal } = {}) {
  const isCsv = /\.csv$/i.test(file.name);
  const id = `wb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  if (isCsv) {
    const text = await file.text();
    if (signal?.aborted) throw new DOMException('Parsing aborted', 'AbortError');
    const rows = parseCsvData(text);
    if (!rows.length) {
      throw new Error(`"${file.name}" is empty or has no readable rows.`);
    }

    const baseName = file.name.replace(/\.csv$/i, '') || 'Sheet1';
    return {
      id,
      name: file.name,
      size: file.size,
      isCsv: true,
      sheets: [
        {
          name: baseName,
          rows,
          rowCount: rows.length,
          colCount: rows[0]?.length || 0,
        },
      ],
      selectedSheetIndex: 'all',
      totalRows: rows.length,
    };
  }

  // Parse OpenXML .xlsx
  const arrayBuffer = await file.arrayBuffer();
  if (signal?.aborted) throw new DOMException('Parsing aborted', 'AbortError');

  const zip = await JSZip.loadAsync(arrayBuffer);
  if (signal?.aborted) throw new DOMException('Parsing aborted', 'AbortError');

  // Shared strings
  let sharedStrings = [];
  const sstFile = zip.file('xl/sharedStrings.xml');
  if (sstFile) {
    const sstText = await sstFile.async('text');
    sharedStrings = parseSharedStrings(sstText);
  }

  // Workbook metadata
  const wbFile = zip.file('xl/workbook.xml');
  if (!wbFile) {
    throw new Error(`Could not find workbook structure in "${file.name}". File may be corrupt or encrypted.`);
  }
  const wbText = await wbFile.async('text');

  // Sheet names and IDs
  const sheetInfos = [];
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(wbText, 'text/xml');
    const sheetEls = doc.querySelectorAll('sheet');
    sheetEls.forEach((el, i) => {
      sheetInfos.push({
        name: el.getAttribute('name') || `Sheet ${i + 1}`,
        rId: el.getAttribute('r:id') || el.getAttribute('id') || `rId${i + 1}`,
      });
    });
  } else {
    const matches = wbText.match(/<sheet\b[^>]*\/>/g) || [];
    matches.forEach((m, i) => {
      const nameMatch = m.match(/name="([^"]+)"/);
      const rIdMatch = m.match(/r:id="([^"]+)"/);
      sheetInfos.push({
        name: nameMatch ? nameMatch[1] : `Sheet ${i + 1}`,
        rId: rIdMatch ? rIdMatch[1] : `rId${i + 1}`,
      });
    });
  }

  // Relationships
  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  const rIdPathMap = {};
  if (relsFile) {
    const relsText = await relsFile.async('text');
    if (typeof DOMParser !== 'undefined') {
      const rDoc = new DOMParser().parseFromString(relsText, 'text/xml');
      rDoc.querySelectorAll('Relationship').forEach(rel => {
        const rId = rel.getAttribute('Id');
        const target = rel.getAttribute('Target');
        if (rId && target) rIdPathMap[rId] = target;
      });
    } else {
      const relMatches = relsText.match(/<Relationship\b[^>]*\/>/g) || [];
      relMatches.forEach(rel => {
        const idM = rel.match(/Id="([^"]+)"/);
        const targetM = rel.match(/Target="([^"]+)"/);
        if (idM && targetM) rIdPathMap[idM[1]] = targetM[1];
      });
    }
  }

  const sheets = [];
  for (let i = 0; i < sheetInfos.length; i++) {
    const info = sheetInfos[i];
    let path = rIdPathMap[info.rId];
    if (path) {
      if (!path.startsWith('xl/')) {
        path = path.startsWith('/') ? path.slice(1) : `xl/${path.replace(/^\.\//, '')}`;
      }
    } else {
      path = `xl/worksheets/sheet${i + 1}.xml`;
    }

    let sheetFile = zip.file(path);
    if (!sheetFile) {
      sheetFile = zip.file(new RegExp(`worksheets/sheet${i + 1}\\.xml$`, 'i'))[0];
    }

    if (sheetFile) {
      const sheetXml = await sheetFile.async('text');
      const rows = parseWorksheet(sheetXml, sharedStrings);
      if (rows.length > 0) {
        sheets.push({
          name: info.name,
          rows,
          rowCount: rows.length,
          colCount: rows[0]?.length || 0,
        });
      }
    }
  }

  if (!sheets.length) {
    // Fallback: search all files in xl/worksheets
    const wsFiles = zip.file(/^xl\/worksheets\/sheet.*\.xml$/i);
    for (let i = 0; i < wsFiles.length; i++) {
      const sheetXml = await wsFiles[i].async('text');
      const rows = parseWorksheet(sheetXml, sharedStrings);
      if (rows.length > 0) {
        sheets.push({
          name: `Sheet ${i + 1}`,
          rows,
          rowCount: rows.length,
          colCount: rows[0]?.length || 0,
        });
      }
    }
  }

  if (!sheets.length) {
    throw new Error(`"${file.name}" has no sheets with readable data rows.`);
  }

  const totalRows = sheets.reduce((sum, s) => sum + s.rowCount, 0);

  return {
    id,
    name: file.name,
    size: file.size,
    isCsv: false,
    sheets,
    selectedSheetIndex: 'all',
    totalRows,
  };
}

/**
 * Merges multiple parsed workbooks based on selected mode and configuration
 */
export function mergeExcelWorkbooks(workbooks, {
  mode = 'single_sheet', // 'single_sheet' | 'multiple_sheets'
  headerMode = 'header_match', // 'header_match' | 'position_match' | 'none'
  firstRowIsHeader = true,
  addSourceColumn = false,
  sourceColumnName = 'Source File',
} = {}) {
  if (!workbooks || !workbooks.length) {
    return {
      mode,
      sheets: [],
      totalRows: 0,
      totalCols: 0,
    };
  }

  // Collect the active sheets from each workbook
  const sheetsToProcess = [];
  for (const wb of workbooks) {
    if (wb.selectedSheetIndex === 'all') {
      for (const s of wb.sheets) {
        sheetsToProcess.push({
          workbookName: wb.name,
          sheetName: s.name,
          rows: s.rows,
        });
      }
    } else {
      const idx = Number(wb.selectedSheetIndex);
      const s = wb.sheets[idx] || wb.sheets[0];
      if (s) {
        sheetsToProcess.push({
          workbookName: wb.name,
          sheetName: s.name,
          rows: s.rows,
        });
      }
    }
  }

  if (!sheetsToProcess.length) {
    return { mode, sheets: [], totalRows: 0, totalCols: 0 };
  }

  // -------------------------------------------------------------
  // Mode 1: Merge all rows into a SINGLE master sheet
  // -------------------------------------------------------------
  if (mode === 'single_sheet') {
    const mergedRows = [];

    if (firstRowIsHeader && headerMode === 'header_match') {
      // SMART COLUMN HEADER MATCHING
      // Collect unique headers across all sheets in appearance order
      const masterHeaders = [];
      const headerIndexMap = new Map(); // normalizedHeader -> masterIndex

      const getNormalized = h => String(h || '').trim().toLowerCase();

      // First pass: build the master headers
      for (const item of sheetsToProcess) {
        const fileHeaders = item.rows[0] || [];
        for (const h of fileHeaders) {
          const norm = getNormalized(h);
          if (norm && !headerIndexMap.has(norm)) {
            headerIndexMap.set(norm, masterHeaders.length);
            masterHeaders.push(String(h).trim());
          }
        }
      }

      // If no headers found at all, fallback to position matching
      if (!masterHeaders.length) {
        return mergeExcelWorkbooks(workbooks, {
          mode: 'single_sheet',
          headerMode: 'position_match',
          firstRowIsHeader: false,
          addSourceColumn,
          sourceColumnName,
        });
      }

      // Add Master Header Row
      const finalHeaderRow = addSourceColumn ? [sourceColumnName, ...masterHeaders] : [...masterHeaders];
      mergedRows.push(finalHeaderRow);

      // Second pass: map each sheet's data rows
      for (const item of sheetsToProcess) {
        const fileHeaders = item.rows[0] || [];
        // Map local column index to master column index
        const localToMaster = [];
        for (let c = 0; c < fileHeaders.length; c++) {
          const norm = getNormalized(fileHeaders[c]);
          localToMaster[c] = headerIndexMap.has(norm) ? headerIndexMap.get(norm) : -1;
        }

        // Data rows (start from row index 1)
        for (let r = 1; r < item.rows.length; r++) {
          const row = item.rows[r];
          // Check if row has any non-empty value
          if (!row.some(val => val !== undefined && val !== null && String(val).trim() !== '')) {
            continue;
          }

          const mappedRow = new Array(masterHeaders.length).fill('');
          for (let c = 0; c < row.length; c++) {
            const masterIdx = localToMaster[c];
            if (masterIdx >= 0) {
              mappedRow[masterIdx] = row[c] !== undefined ? String(row[c]) : '';
            }
          }

          if (addSourceColumn) {
            mergedRows.push([item.workbookName, ...mappedRow]);
          } else {
            mergedRows.push(mappedRow);
          }
        }
      }
    } else {
      // POSITION-BASED APPENDING (or no headers)
      let maxCols = 0;
      for (const item of sheetsToProcess) {
        for (const row of item.rows) {
          if (row.length > maxCols) maxCols = row.length;
        }
      }

      let isFirstSheet = true;
      for (const item of sheetsToProcess) {
        const startRow = (firstRowIsHeader && !isFirstSheet) ? 1 : 0;

        for (let r = startRow; r < item.rows.length; r++) {
          const row = item.rows[r];
          if (!row.some(val => val !== undefined && val !== null && String(val).trim() !== '')) {
            continue;
          }

          const paddedRow = new Array(maxCols).fill('');
          for (let c = 0; c < row.length; c++) {
            paddedRow[c] = row[c] !== undefined ? String(row[c]) : '';
          }

          if (addSourceColumn) {
            if (firstRowIsHeader && r === 0 && isFirstSheet) {
              mergedRows.push([sourceColumnName, ...paddedRow]);
            } else {
              mergedRows.push([item.workbookName, ...paddedRow]);
            }
          } else {
            mergedRows.push(paddedRow);
          }
        }
        isFirstSheet = false;
      }
    }

    return {
      mode: 'single_sheet',
      sheets: [
        {
          name: 'Merged Data',
          rows: mergedRows,
          rowCount: mergedRows.length,
          colCount: mergedRows[0]?.length || 0,
        },
      ],
      totalRows: mergedRows.length,
      totalCols: mergedRows[0]?.length || 0,
    };
  }

  // -------------------------------------------------------------
  // Mode 2: Consolidate as MULTIPLE SHEETS (Separate tabs in 1 file)
  // -------------------------------------------------------------
  const mergedSheets = [];
  const existingSheetNames = new Set();

  for (const item of sheetsToProcess) {
    // Generate valid unique Excel sheet name (max 31 chars, no forbidden chars)
    let candidateName = sanitizeSheetName(item.sheetName);
    if (!candidateName) {
      candidateName = sanitizeSheetName(item.workbookName.replace(/\.(xlsx|csv)$/i, ''));
    }

    // Disambiguate if duplicate sheet name
    let finalName = candidateName;
    let counter = 2;
    while (existingSheetNames.has(finalName.toLowerCase())) {
      const suffix = ` (${counter})`;
      const maxBaseLen = 31 - suffix.length;
      finalName = candidateName.slice(0, maxBaseLen) + suffix;
      counter++;
    }
    existingSheetNames.add(finalName.toLowerCase());

    mergedSheets.push({
      name: finalName,
      rows: item.rows,
      rowCount: item.rows.length,
      colCount: item.rows[0]?.length || 0,
      originalWorkbook: item.workbookName,
    });
  }

  const totalRows = mergedSheets.reduce((sum, s) => sum + s.rowCount, 0);
  const maxCols = Math.max(...mergedSheets.map(s => s.colCount), 0);

  return {
    mode: 'multiple_sheets',
    sheets: mergedSheets,
    totalRows,
    totalCols: maxCols,
  };
}

/**
 * Sanitizes sheet name to conform to Microsoft Excel rules
 */
export function sanitizeSheetName(name) {
  if (!name) return 'Sheet';
  // Excel forbidden characters: \ / ? * [ ] :
  let clean = String(name).replace(/[\\/?*[\]:]+/g, '_').trim();
  if (clean.startsWith("'")) clean = clean.slice(1);
  if (clean.endsWith("'")) clean = clean.slice(0, -1);
  clean = clean.trim() || 'Sheet';
  return clean.slice(0, 31);
}

/**
 * Escapes XML strings safely for OpenXML Excel sheets
 */
export function escapeXmlString(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/**
 * Generates an authentic Microsoft Excel (.xlsx) OpenXML workbook from merged sheets
 */
export async function generateMergedExcelWorkbook(mergedData, { filename = 'merged-excel.xlsx' } = {}) {
  const zip = new JSZip();
  const sheets = mergedData?.sheets || [];

  if (!sheets.length) {
    throw new Error('No sheets or data available to generate Excel workbook.');
  }

  // 1. Generate XML for each worksheet
  for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
    const sheet = sheets[sIdx];
    const sheetNum = sIdx + 1;
    const rows = sheet.rows || [];

    // Calculate column widths
    const colMaxLens = [];
    const sampleRows = rows.slice(0, 100);
    for (const r of sampleRows) {
      for (let c = 0; c < r.length; c++) {
        const len = String(r[c] || '').length;
        if (!colMaxLens[c] || len > colMaxLens[c]) {
          colMaxLens[c] = len;
        }
      }
    }

    let sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>`;

    for (let c = 0; c < colMaxLens.length; c++) {
      const width = Math.min(45, Math.max(10, (colMaxLens[c] || 8) + 3));
      sheetXml += `<col min="${c + 1}" max="${c + 1}" width="${width}" customWidth="1"/>`;
    }

    sheetXml += `</cols>
  <sheetData>`;

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      const rowNum = rIdx + 1;
      const isHeader = rIdx === 0;

      sheetXml += `<row r="${rowNum}">`;
      for (let cIdx = 0; cIdx < row.length; cIdx++) {
        const colLetter = indexToColLetters(cIdx);
        const val = row[cIdx] !== undefined ? String(row[cIdx]) : '';
        const styleAttr = isHeader ? ' s="1"' : '';

        // Check if value is cleanly numeric (without leading zero unless 0)
        const isNumeric = val !== '' && !isNaN(Number(val)) && !/^0[0-9]+/.test(val) && isFinite(Number(val));

        if (isNumeric && !isHeader) {
          sheetXml += `<c r="${colLetter}${rowNum}"${styleAttr}><v>${escapeXmlString(val)}</v></c>`;
        } else {
          sheetXml += `<c r="${colLetter}${rowNum}" t="inlineStr"${styleAttr}><is><t>${escapeXmlString(val)}</t></is></c>`;
        }
      }
      sheetXml += `</row>`;
    }

    sheetXml += `</sheetData>
</worksheet>`;

    zip.file(`xl/worksheets/sheet${sheetNum}.xml`, sheetXml);
  }

  // 2. xl/styles.xml with bold header formatting & green brand theme
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><name val="Calibri"/><sz val="11"/></font>
    <font><b/><color rgb="FFFFFFFF"/><name val="Calibri"/><sz val="11"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF047857"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/></border>
  </borders>
  <cellStyleXfs count="1"><xf/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>`;

  // 3. xl/workbook.xml
  let workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>`;

  for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
    const sheetNum = sIdx + 1;
    workbookXml += `<sheet name="${escapeXmlString(sheets[sIdx].name)}" sheetId="${sheetNum}" r:id="rId${sheetNum}"/>`;
  }
  workbookXml += `</sheets>
</workbook>`;

  // 4. xl/_rels/workbook.xml.rels
  let workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`;

  for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
    const sheetNum = sIdx + 1;
    workbookRelsXml += `<Relationship Id="rId${sheetNum}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheetNum}.xml"/>`;
  }
  workbookRelsXml += `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  // 5. _rels/.rels
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  // 6. [Content_Types].xml
  let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`;

  for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
    contentTypesXml += `<Override PartName="/xl/worksheets/sheet${sIdx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  }
  contentTypesXml += `</Types>`;

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', rootRelsXml);
  zip.file('xl/_rels/workbook.xml.rels', workbookRelsXml);
  zip.file('xl/workbook.xml', workbookXml);
  zip.file('xl/styles.xml', stylesXml);

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    compression: 'DEFLATE',
  });

  return {
    blob,
    filename: filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`,
  };
}

/**
 * Generates an RFC 4180 CSV Blob with UTF-8 BOM
 */
export function generateMergedCsv(mergedData, { filename = 'merged-excel.csv' } = {}) {
  const sheet = mergedData?.sheets?.[0];
  const rows = sheet?.rows || [];

  const escapeCsvVal = val => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replaceAll('"', '""')}"`;
    }
    return str;
  };

  const csvRows = rows.map(r => r.map(escapeCsvVal).join(','));
  const bom = '\uFEFF';
  const csvContent = bom + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

  return {
    blob,
    filename: filename.endsWith('.csv') ? filename : `${filename}.csv`,
    csvText: csvContent,
  };
}

/**
 * Realistic Sample Excel Workbooks for instant demonstration & testing
 */
export const SAMPLE_EXCEL_DATASETS = [
  {
    name: 'North_Region_Sales.xlsx',
    sheets: [
      {
        name: 'Sales Data',
        rows: [
          ['Order ID', 'Date', 'Customer Name', 'Product Category', 'Units Sold', 'Revenue ($)'],
          ['ORD-101', '2026-01-12', 'Apex Logistics Pvt Ltd', 'Industrial Bearings', '45', '5400'],
          ['ORD-102', '2026-01-15', 'BlueStar Technologies', 'Electric Motors', '12', '3600'],
          ['ORD-103', '2026-01-20', 'Horizon Infra Corp', 'Hydraulic Pumps', '8', '6200'],
          ['ORD-104', '2026-01-25', 'Pinnacle Automations', 'Sensors & Relays', '90', '4150'],
          ['ORD-105', '2026-02-02', 'Sterling Enterprises', 'Drive Inverters', '15', '7800'],
        ],
      },
    ],
  },
  {
    name: 'South_Region_Sales.xlsx',
    sheets: [
      {
        name: 'Sales Data',
        rows: [
          // Notice: Slightly different column ordering to demonstrate intelligent column header matching!
          ['Order ID', 'Product Category', 'Customer Name', 'Revenue ($)', 'Units Sold', 'Date'],
          ['ORD-201', 'Electric Motors', 'Sunlight Solar Systems', '4200', '14', '2026-01-14'],
          ['ORD-202', 'Hydraulic Pumps', 'Titan Heavy Engineering', '9100', '11', '2026-01-19'],
          ['ORD-203', 'Industrial Bearings', 'Zenith Machinery Works', '3100', '28', '2026-01-26'],
          ['ORD-204', 'Drive Inverters', 'Delta Power Controls', '5600', '10', '2026-02-04'],
        ],
      },
    ],
  },
  {
    name: 'West_Region_Sales.xlsx',
    sheets: [
      {
        name: 'Sales Data',
        rows: [
          // Notice: Has an extra column "Sales Rep" to demonstrate smart schema union!
          ['Order ID', 'Date', 'Customer Name', 'Product Category', 'Units Sold', 'Revenue ($)', 'Sales Rep'],
          ['ORD-301', '2026-01-18', 'Western Freightways LLC', 'Sensors & Relays', '60', '2800', 'Karan Verma'],
          ['ORD-302', '2026-01-22', 'Gujarat Metalcraft Corp', 'Industrial Bearings', '75', '8900', 'Priya Sharma'],
          ['ORD-303', '2026-02-05', 'Metro Electrical Supplies', 'Electric Motors', '22', '6600', 'Karan Verma'],
        ],
      },
    ],
  },
];
