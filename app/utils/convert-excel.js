import JSZip from 'jszip';
import { runConversionTask } from './conversion-task.js';

function abortError() {
  return new DOMException('Conversion cancelled.', 'AbortError');
}

export function colToIndex(col) {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.toUpperCase().charCodeAt(i) - 64);
  }
  return index - 1;
}

export function indexToCol(index) {
  let col = '';
  let n = index;
  while (n >= 0) {
    col = String.fromCharCode((n % 26) + 65) + col;
    n = Math.floor(n / 26) - 1;
  }
  return col;
}

export function parseCsv(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;
  const str = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const sample = str.slice(0, 1000);
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

  return cleanRows(rows);
}

function cleanRows(rawRows) {
  if (!rawRows || !rawRows.length) return [];
  // Find max column index that has content
  let maxCol = -1;
  for (const row of rawRows) {
    for (let c = row.length - 1; c >= 0; c--) {
      if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== '') {
        if (c > maxCol) maxCol = c;
        break;
      }
    }
  }

  if (maxCol === -1) return [];

  // Find last non-empty row
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
      normalized.push(row[c] !== undefined && row[c] !== null ? String(row[c]) : '');
    }
    cleaned.push(normalized);
  }
  return cleaned;
}

export function parseSharedStringsXml(xmlText) {
  const strings = [];
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    const siElements = doc.querySelectorAll('si');
    for (const si of siElements) {
      const texts = Array.from(si.querySelectorAll('t')).map(t => t.textContent || '');
      strings.push(texts.join(''));
    }
  } else {
    // Regex fallback for non-DOM environments / tests
    const siMatches = xmlText.match(/<si\b[\s\S]*?<\/si>/g) || [];
    for (const si of siMatches) {
      const tMatches = si.match(/<t\b[^>]*>([\s\S]*?)<\/t>/g) || [];
      const text = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');
      strings.push(text);
    }
  }
  return strings;
}

export function parseWorksheetXml(xmlText, sharedStrings = []) {
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
          colIndex = colToIndex(colLetters);
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
          colIndex = colToIndex(refMatch[1]);
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

  return cleanRows(rawRows);
}

export async function openExcelWorkbook(file, { signal, onProgress = () => {} } = {}) {
  const isCsv = /\.csv$/i.test(file.name);
  let closed = false;

  const check = () => {
    if (closed || signal?.aborted) throw abortError();
  };

  try {
    check();
    onProgress('Reading spreadsheet…');

    const sheets = [];

    if (isCsv) {
      const text = await file.text();
      check();
      const rows = parseCsv(text);
      if (!rows.length) {
        throw new Error('This CSV file is empty. Please choose a spreadsheet with data.');
      }
      sheets.push({
        name: file.name.replace(/\.csv$/i, '') || 'Sheet1',
        rows,
        rowCount: rows.length,
        colCount: rows[0]?.length || 0,
      });
    } else {
      const arrayBuffer = await file.arrayBuffer();
      check();
      const zip = await JSZip.loadAsync(arrayBuffer);
      check();

      // Parse shared strings
      let sharedStrings = [];
      const sstFile = zip.file('xl/sharedStrings.xml');
      if (sstFile) {
        const sstText = await sstFile.async('text');
        sharedStrings = parseSharedStringsXml(sstText);
      }
      check();

      // Read workbook.xml to get sheet names
      const wbFile = zip.file('xl/workbook.xml');
      if (!wbFile) {
        throw new Error('Could not find workbook structure in this .xlsx file. The file may be corrupt or encrypted.');
      }
      const wbText = await wbFile.async('text');
      check();

      // Map sheet names and r:ids
      const sheetInfos = [];
      if (typeof DOMParser !== 'undefined') {
        const doc = new DOMParser().parseFromString(wbText, 'text/xml');
        const sheetEls = doc.querySelectorAll('sheet');
        sheetEls.forEach((el, i) => {
          sheetInfos.push({
            name: el.getAttribute('name') || `Sheet ${i + 1}`,
            sheetId: el.getAttribute('sheetId') || String(i + 1),
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
            sheetId: String(i + 1),
            rId: rIdMatch ? rIdMatch[1] : `rId${i + 1}`,
          });
        });
      }

      // Check relationships to find file paths
      const relsFile = zip.file('xl/_rels/workbook.xml.rels');
      const rIdPathMap = {};
      if (relsFile) {
        const relsText = await relsFile.async('text');
        if (typeof DOMParser !== 'undefined') {
          const rDoc = new DOMParser().parseFromString(relsText, 'text/xml');
          rDoc.querySelectorAll('Relationship').forEach(rel => {
            const id = rel.getAttribute('Id');
            const target = rel.getAttribute('Target');
            if (id && target) rIdPathMap[id] = target;
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
          // Fallback search
          sheetFile = zip.file(new RegExp(`worksheets/sheet${i + 1}\\.xml$`, 'i'))[0];
        }

        if (sheetFile) {
          const sheetXml = await sheetFile.async('text');
          const rows = parseWorksheetXml(sheetXml, sharedStrings);
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
          const rows = parseWorksheetXml(sheetXml, sharedStrings);
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
        throw new Error('We couldn’t find any data in this spreadsheet. Please ensure the file has at least one sheet with rows.');
      }
    }

    async function convertToPdf({
      selectedSheetIndex = null,
      orientation = 'landscape',
      gridlines = true,
      onProgress: progressCb = () => {},
    } = {}) {
      check();
      const [{ default: html2canvas }, { jsPDF }] = await runConversionTask(
        () => Promise.all([import('html2canvas'), import('jspdf')]),
        { signal, timeout: 30000, message: 'Could not load PDF converter libraries.' }
      );
      check();

      const sheetsToRender = selectedSheetIndex !== null && sheets[selectedSheetIndex]
        ? [sheets[selectedSheetIndex]]
        : sheets;

      const isLandscape = orientation === 'landscape';
      // A4 dimensions in pt: Landscape = 841.89 x 595.28, Portrait = 595.28 x 841.89
      const pdfWidth = isLandscape ? 841.89 : 595.28;
      const pdfHeight = isLandscape ? 595.28 : 841.89;
      const format = [pdfWidth, pdfHeight];

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'pt',
        format,
        compress: true,
      });
      pdf.setProperties({
        title: file.name.replace(/\.(xlsx|csv)$/i, ''),
        creator: 'Toolifybox — Excel to PDF converter',
      });

      // A4 pixel dimensions matching PDF aspect ratio 1:1 (avoids any vertical or horizontal stretching)
      const pageWidthPx = isLandscape ? 1200 : Math.round(1200 * (595.28 / 841.89)); // 1200 x 848 in landscape
      const pageHeightPx = isLandscape ? Math.round(1200 * (595.28 / 841.89)) : 1200; // 848 x 1200 in portrait

      // Rows per page chunk: landscape has less height (~20 rows), portrait (~30 rows)
      const ROWS_PER_PAGE = isLandscape ? 20 : 30;
      let totalPagesCreated = 0;

      // Container for rendering HTML
      const container = document.createElement('div');
      container.setAttribute('aria-hidden', 'true');
      container.style.position = 'fixed';
      container.style.left = '-99999px';
      container.style.top = '0';
      container.style.width = `${pageWidthPx}px`;
      container.style.height = `${pageHeightPx}px`;
      container.style.minHeight = `${pageHeightPx}px`;
      container.style.maxHeight = `${pageHeightPx}px`;
      container.style.boxSizing = 'border-box';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.justifyContent = 'space-between';
      container.style.background = '#ffffff';
      container.style.fontFamily = 'Arial, "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif';
      container.style.color = '#0f172a';
      container.style.overflow = 'hidden';
      document.body.appendChild(container);

      try {
        for (let sIdx = 0; sIdx < sheetsToRender.length; sIdx++) {
          const sheet = sheetsToRender[sIdx];
          const rows = sheet.rows;
          if (!rows.length) continue;

          const totalChunks = Math.ceil(rows.length / ROWS_PER_PAGE);

          for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
            check();
            const startRow = chunkIdx * ROWS_PER_PAGE;
            const endRow = Math.min(rows.length, startRow + ROWS_PER_PAGE);
            const chunkRows = rows.slice(startRow, endRow);

            progressCb(`Rendering sheet "${sheet.name}" page ${chunkIdx + 1} of ${totalChunks}…`);

            const colCount = Math.max(1, (chunkRows[0] || []).length);
            const fontSize = colCount > 14 ? '9px' : colCount > 9 ? '11px' : '12px';
            const cellPad = colCount > 14 ? '5px 6px' : colCount > 9 ? '7px 9px' : '9px 12px';

            // Build clean HTML page with exact A4 aspect ratio
            container.innerHTML = `
              <div style="padding: 32px 36px 20px 36px; box-sizing: border-box; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; background: #ffffff;">
                <div style="flex-shrink: 0; margin-bottom: 14px; border-bottom: 2px solid #059669; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-end;">
                  <div>
                    <h1 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: #064e3b; letter-spacing: -0.01em;">
                      ${escapeHtml(sheet.name)}
                    </h1>
                    <span style="font-size: 11px; color: #64748b; font-weight: 500;">
                      ${escapeHtml(file.name)} · Rows ${startRow + 1}–${endRow} of ${rows.length} · ${colCount} Columns
                    </span>
                  </div>
                  <div style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 9999px;">
                    Page ${chunkIdx + 1} of ${totalChunks}
                  </div>
                </div>

                <div style="flex: 1; overflow: hidden;">
                  <table style="width: 100%; border-collapse: collapse; font-size: ${fontSize}; table-layout: auto; word-break: break-word; border: ${gridlines ? '1px solid #cbd5e1' : 'none'};">
                    <thead>
                      <tr style="background: #f1f5f9; color: #1e293b; font-weight: 700;">
                        <th style="padding: ${cellPad}; border: ${gridlines ? '1px solid #cbd5e1' : 'none'}; width: 44px; text-align: center; color: #64748b; font-size: 10px; background: #f8fafc;">#</th>
                        ${(chunkRows[0] || []).map((_, colI) => `
                          <th style="padding: ${cellPad}; border: ${gridlines ? '1px solid #cbd5e1' : 'none'}; text-align: left; font-size: ${fontSize}; background: #f8fafc; color: #334155; font-weight: 700;">
                            ${indexToCol(colI)}
                          </th>
                        `).join('')}
                      </tr>
                    </thead>
                    <tbody>
                      ${chunkRows.map((r, rOffset) => {
                        const actualRowNum = startRow + rOffset + 1;
                        const isEven = rOffset % 2 === 1;
                        const bg = isEven ? '#f8fafc' : '#ffffff';
                        return `
                          <tr style="background: ${bg};">
                            <td style="padding: ${cellPad}; border: ${gridlines ? '1px solid #e2e8f0' : 'none'}; text-align: center; color: #64748b; font-size: 10px; font-weight: 600; background: ${isEven ? '#f1f5f9' : '#f8fafc'};">
                              ${actualRowNum}
                            </td>
                            ${r.map(cell => {
                              const isNumeric = /^-?\d+(\.\d+)?%?$/.test(cell.trim());
                              return `
                                <td style="padding: ${cellPad}; border: ${gridlines ? '1px solid #e2e8f0' : 'none'}; text-align: ${isNumeric ? 'right' : 'left'}; color: #0f172a; font-weight: 500; font-variant-numeric: tabular-nums;">
                                  ${escapeHtml(cell)}
                                </td>
                              `;
                            }).join('')}
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>

                <div style="flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 10px; font-size: 10px; color: #94a3b8;">
                  <span>Toolifybox · Excel to PDF Converter</span>
                  <span>Sheet: <strong>${escapeHtml(sheet.name)}</strong> · Page ${chunkIdx + 1} of ${totalChunks}</span>
                </div>
              </div>
            `;

            // Render to canvas at 2x resolution matching exact A4 dimensions
            const canvas = await runConversionTask(() => html2canvas(container, {
              backgroundColor: '#ffffff',
              scale: 2,
              logging: false,
              useCORS: true,
              allowTaint: true,
              width: pageWidthPx,
              height: pageHeightPx,
              windowWidth: pageWidthPx,
              windowHeight: pageHeightPx,
            }), { signal, timeout: 35000 });
            check();

            if (totalPagesCreated > 0) {
              pdf.addPage(format, isLandscape ? 'landscape' : 'portrait');
            }
            totalPagesCreated++;

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            canvas.width = canvas.height = 0;
          }
        }

        if (totalPagesCreated === 0) {
          throw new Error('No pages were generated from this spreadsheet.');
        }

        progressCb('Finalizing PDF document…');
        const blob = pdf.output('blob');
        return blob;
      } finally {
        container.remove();
      }
    }

    return {
      sheets,
      sheetCount: sheets.length,
      convertToPdf,
      close() {
        closed = true;
      },
    };
  } catch (err) {
    if (signal?.aborted) throw abortError();
    throw err;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

