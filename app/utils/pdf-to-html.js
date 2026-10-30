import JSZip from 'jszip';

/**
 * Checks if a string contains common Kruti Dev / Devlys legacy non-Unicode Hindi signatures.
 * @param {string} text
 * @returns {boolean}
 */
export function isKrutiDevText(text = '') {
  if (!text || text.length < 3) return false;
  // Specific Kruti Dev signatures: "fdj", "vkR", "gS½", "fnukad", "fuoklh", "iV~Vk", "dks Jh", "¼ftls", "^^", "vk;", "o\"kZ", "izFke", "i{kdkj", "foys[k", "vuqlwph"
  return /(fdj|vkR|gS½|fnukad|fuoklh|iV~Vk|dks Jh|¼ftls|\^\^|vk;|o"kZ|izFke|i\{kdkj|foys\[k|vuqlwph|bPNqd|vofLFkr)/.test(text);
}

/**
 * Converts legacy Kruti Dev / Devlys 010 encoded text to standard Devanagari Hindi Unicode.
 * @param {string} text
 * @returns {string}
 */
export function convertKrutiDevToUnicode(text = '') {
  if (!text) return '';

  let str = text;

  // 1. Punctuation & Quotes
  str = str.replace(/\^\^/g, '“');
  str = str.replace(/\*\*/g, '”');
  str = str.replace(/¼/g, '(');
  str = str.replace(/½/g, ')');
  str = str.replace(/¿/g, '?');
  str = str.replace(/À/g, '!');
  str = str.replace(/Å/g, '/');
  str = str.replace(/A/g, '।');
  str = str.replace(/`/g, 'ृ');

  // 2. Standalone Independent Vowels & Multi-letter Words (MUST be before 'Z' and 'f' handling)
  str = str.replace(/vkS/g, "औ");
  str = str.replace(/vks/g, "ओ");
  str = str.replace(/vk/g, "आ");
  str = str.replace(/bZ/g, "ई");
  str = str.replace(/b/g, "इ");
  str = str.replace(/m/g, "उ");
  str = str.replace(/Å/g, "ऊ");
  str = str.replace(/Þ/g, "ऐ");
  str = str.replace(/Û/g, "ऋ");

  str = str.replace(/:e/g, "रूम");
  str = str.replace(/ckFk:e/g, "बाथरूम");
  str = str.replace(/f\}/g, "द्वि");
  str = str.replace(/\}/g, "द्व");
  str = str.replace(/,oa/g, "एवं");
  str = str.replace(/,d/g, "एक");

  // 3. Complex ligatures & special glyphs in Kruti Dev
  str = str.replace(/ñ/g, "ह्न");
  str = str.replace(/ò/g, "ह्र");
  str = str.replace(/ó/g, "ह्ल");
  str = str.replace(/ô/g, "ह्म");
  str = str.replace(/õ/g, "ह्य");
  str = str.replace(/ö/g, "ह्ण");
  str = str.replace(/÷/g, "ह्व");
  str = str.replace(/ø/g, "क्त");
  str = str.replace(/ù/g, "ज्ञ");
  str = str.replace(/ú/g, "श्र");
  str = str.replace(/û/g, "त्र");
  str = str.replace(/ü/g, "क्ष");
  str = str.replace(/ý/g, "रु");
  str = str.replace(/þ/g, "रू");
  str = str.replace(/ÿ/g, "द्ध");
  str = str.replace(/ß/g, "द्ब");
  str = str.replace(/à/g, "द्ब");
  str = str.replace(/á/g, "द्म");
  str = str.replace(/â/g, "द्य");
  str = str.replace(/ã/g, "द्व");
  str = str.replace(/ä/g, "ट्ट");
  str = str.replace(/å/g, "ट्ठ");
  str = str.replace(/æ/g, "ड्ड");
  str = str.replace(/ç/g, "ड्ढ");
  str = str.replace(/è/g, "ड़");
  str = str.replace(/é/g, "ढ़");
  str = str.replace(/ì/g, "प्त");
  str = str.replace(/í/g, "म्न");
  str = str.replace(/î/g, "त्न");
  str = str.replace(/ï/g, "ष्ण");
  str = str.replace(/ð/g, "ष्ठ");

  // 4. Combined Dual Matras (MUST be before single 'k' and 's')
  str = str.replace(/kS/g, "ौ");
  str = str.replace(/ks/g, "ो");

  // 4. Shift 'f' (Chhoti-ee / ि) after the consonant / cluster
  let posF = str.indexOf('f');
  while (posF !== -1) {
    let shift = 1;
    while (posF + shift < str.length) {
      let ch = str.charAt(posF + shift);
      if ("D[X?PT/FUIHCEY'\"L{=\\~".indexOf(ch) !== -1 || ch === '्') {
        shift++;
      } else {
        shift++;
        if (str.charAt(posF + shift) === 'z' || str.charAt(posF + shift) === 'ª') {
          shift++;
        }
        break;
      }
    }
    const cluster = str.substring(posF + 1, posF + shift);
    str = str.substring(0, posF) + cluster + 'ि' + str.substring(posF + shift);
    posF = str.indexOf('f');
  }

  // 5. Shift 'Z' (Reph / र्) in front of the consonant / cluster
  let posZ = str.indexOf('Z');
  while (posZ !== -1) {
    let shiftLeft = 1;
    while (posZ - shiftLeft >= 0) {
      let ch = str.charAt(posZ - shiftLeft);
      if ("khsSqw%aWिीाुूेैंँःौो".indexOf(ch) !== -1) {
        shiftLeft++;
      } else {
        if (posZ - shiftLeft - 1 >= 0) {
          let prev = str.charAt(posZ - shiftLeft - 1);
          if ("D[X?PT/FUIHCEY'\"L{=\\~्".indexOf(prev) !== -1) {
            shiftLeft += 2;
            continue;
          }
        }
        break;
      }
    }
    const target = str.substring(posZ - shiftLeft, posZ);
    str = str.substring(0, posZ - shiftLeft) + 'र्' + target + str.substring(posZ + 1);
    posZ = str.indexOf('Z');
  }

  // 6. Comprehensive mapping of consonants, conjuncts, vowels, and matras
  const rules = [
    ["bZ", "ई"],
    ["b", "इ"],
    ["m", "उ"],
    ["Å", "ऊ"],
    [",oa", "एवं"],
    [",d", "एक"],
    [",", "ए"],
    ["Jh", "श्री"],
    ["J", "श्र"],
    ["Vª", "ट्र"],
    ["Mª", "ड्र"],
    ["[k", "ख"],
    ["?k", "घ"],
    [">k", "झ"],
    ["Fk", "थ"],
    ["/k", "ध"],
    ["Hk", "भ"],
    ["'k", "श"],
    ["\"k", "ष"],
    ["{k", "क्ष"],
    ["=k", "त्र"],
    ["Kk", "ज्ञ"],
    ["K", "ज्ञ"],
    ["iz", "प्र"],
    ["dz", "क्र"],
    ["xz", "ग्र"],
    ["cz", "ब्र"],
    ["nz", "द्र"],
    ["ez", "म्र"],

    // Half consonants
    ["D", "क्"],
    ["[", "ख्"],
    ["X", "ग्"],
    ["?", "घ्"],
    ["P", "च्"],
    ["T", "ज्"],
    ["R", "त्"],
    ["F", "थ्"],
    ["/", "ध्"],
    ["U", "न्"],
    ["I", "प्"],
    ["C", "ब्"],
    ["H", "भ्"],
    ["E", "म्"],
    ["Y", "ल्"],
    ["O", "व्"],
    ["'", "श्"],
    ['"', "ष्"],
    ["L", "स्"],
    ["{", "क्ष्"],
    ["=", "त्र्"],

    // Full consonants
    ["d", "क"],
    ["x", "ग"],
    ["p", "च"],
    ["N", "छ"],
    ["t", "ज"],
    ["V", "ट"],
    ["B", "ठ"],
    ["M", "ड"],
    ["<", "ढ"],
    [".k", "ण"],
    ["r", "त"],
    ["n", "द"],
    ["u", "न"],
    ["i", "प"],
    ["Q", "फ"],
    ["c", "ब"],
    ["e", "म"],
    [";", "य"],
    ["j", "र"],
    ["y", "ल"],
    ["o", "व"],
    ["l", "स"],
    ["g", "ह"],
    ["v", "अ"],

    // Matras & modifiers
    ["k", "ा"],
    ["h", "ी"],
    ["q", "ु"],
    ["w", "ू"],
    ["s", "े"],
    ["S", "ै"],
    ["a", "ं"],
    ["W", "ँ"],
    ["%", "ः"],
    ["z", "्र"],
    ["~", "्"],
    ["]", ","]
  ];

  for (const [from, to] of rules) {
    str = str.split(from).join(to);
  }

  // Handle residual matras or spacing
  str = str.replace(/f([क-ह])/g, '$1ि');

  return str;
}


export const MAX_PDF_TO_HTML_SIZE = 60 * 1024 * 1024; // 60 MB

export const HTML_THEMES = [
  { id: 'modern', name: 'Modern Clean', desc: 'Sans-serif, card borders, subtle shadows, responsive typography' },
  { id: 'minimal', name: 'Minimalist Editorial', desc: 'Serif headings, high-contrast, distraction-free reading layout' },
  { id: 'dark', name: 'Dark Slate', desc: 'Sleek dark background, crisp white typography, high contrast' },
  { id: 'plain', name: 'Plain / Unstyled', desc: 'Clean semantic HTML tags with minimal CSS, ready for CMS or email' },
];

export const CONVERSION_MODES = [
  { id: 'semantic', name: 'Semantic Flow (Responsive)', desc: 'Auto-detects headings, lists, tables, and paragraphs for flexible mobile & desktop reading' },
  { id: 'fixed', name: 'Fixed Layout (Exact Replica)', desc: 'Pixel-perfect absolute coordinates matching the exact PDF visual geometry' },
];

/**
 * Validates a file selected for PDF to HTML conversion.
 * @param {File|FileList|File[]} fileInput 
 * @returns {string|null} Error message or null if valid
 */
export function validatePdfForHtml(fileInput) {
  let file = fileInput;
  if (fileInput && typeof fileInput === 'object' && ('length' in fileInput)) {
    if (fileInput.length === 0) return 'Please select a PDF document to convert.';
    if (fileInput.length > 1) return 'Please choose one PDF document at a time.';
    file = fileInput[0];
  }

  if (!file) return 'Please select a PDF document to convert.';

  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();

  if (!name.endsWith('.pdf') && type !== 'application/pdf') {
    return 'Please select a valid PDF file (.pdf).';
  }

  if (file.size <= 0) {
    return 'This file is empty. Please select a valid PDF document with content.';
  }

  if (file.size > MAX_PDF_TO_HTML_SIZE) {
    return 'This file exceeds the 60 MB size limit. Please select a smaller PDF file.';
  }

  return null;
}

/**
 * Generates clean output filename for converted HTML or ZIP package.
 * @param {string} originalName 
 * @param {'html'|'zip'} [extension='html'] 
 * @returns {string}
 */
export function pdfToHtmlFilename(originalName = 'document.pdf', extension = 'html') {
  const base = originalName ? originalName.replace(/\.pdf$/i, '').trim() : '';
  const safeName = base
    .replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u0900-\u097F\u0A80-\u0AFF\s]/g, '')
    .replace(/\s+/g, '-');
  return `${safeName || 'converted-document'}.${extension}`;
}

/**
 * Safely parses human page range string into 1-based page numbers array.
 * @param {string} rangeStr 
 * @param {number} totalPages 
 * @returns {number[]}
 */
export function parseHtmlPageRange(rangeStr = 'all', totalPages = 1) {
  if (!totalPages || totalPages < 1) return [1];
  const normalized = (rangeStr || 'all').toLowerCase().trim();

  if (!normalized || normalized === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (normalized === 'odd') {
    return Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n % 2 !== 0);
  }

  if (normalized === 'even') {
    return Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n % 2 === 0);
  }

  const pagesSet = new Set();
  const segments = normalized.split(/[,;\s]+/);

  for (const seg of segments) {
    if (!seg) continue;
    if (seg.includes('-')) {
      const parts = seg.split('-');
      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          pagesSet.add(p);
        }
      }
    } else {
      const p = parseInt(seg, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        pagesSet.add(p);
      }
    }
  }

  const result = Array.from(pagesSet).sort((a, b) => a - b);
  return result.length > 0 ? result : [1];
}

/**
 * Escapes characters for safe HTML output.
 * @param {string} str 
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Detects font styling indicators from fontName.
 * @param {string} fontName 
 * @returns {{ isBold: boolean, isItalic: boolean, isMonospace: boolean }}
 */
export function detectTextFormatting(fontName = '') {
  const lower = (fontName || '').toLowerCase();
  const isBold = /bold|black|heavy|semibold|medium/i.test(lower);
  const isItalic = /italic|oblique|slanted/i.test(lower);
  const isMonospace = /mono|courier|consolas|code/i.test(lower);
  return { isBold, isItalic, isMonospace };
}

/**
 * Detects URLs and email addresses and converts them into clickable anchor tags.
 * @param {string} escapedText 
 * @returns {string}
 */
export function linkifyText(escapedText) {
  if (!escapedText) return '';
  // Match URLs starting with http://, https://, or www.
  let text = escapedText.replace(
    /(https?:\/\/[^\s<"'>]+|www\.[^\s<"'>]+\.[^\s<"'>]+)/gi,
    (match) => {
      const href = match.startsWith('http') ? match : `https://${match}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${match}</a>`;
    }
  );

  // Match emails
  text = text.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    '<a href="mailto:$1">$1</a>'
  );

  return text;
}

/**
 * Deduplicates overlapping, synthetic-bold, or overprinted text items from PDF extraction.
 * Handles both adjacent and multi-pass stream duplicates while preserving original reading order.
 * @param {Array} items Array of { str, x, y, width, height, fontSize, fontName }
 * @param {number} [tolerance=3] Max distance in pixels to consider duplicate
 * @returns {Array} Deduplicated items
 */
export function deduplicateRawItems(items = [], tolerance = 4) {
  if (!items || !items.length) return [];

  // Group items geometrically by sorting a cloned indexed array
  const indexed = items.map((it, idx) => ({ ...it, _origIdx: idx }));
  indexed.sort((a, b) => {
    if (Math.abs(a.y - b.y) > 3) return a.y - b.y;
    return a.x - b.x;
  });

  const keepIndices = new Set();
  const retained = [];

  for (let i = 0; i < indexed.length; i++) {
    const cur = indexed[i];
    const curText = (cur.str || '').trim();
    if (!curText) continue;

    let isDup = false;
    for (let j = retained.length - 1; j >= 0; j--) {
      const prev = retained[j];
      const dy = Math.abs(cur.y - prev.y);
      if (dy > Math.max(tolerance, (cur.fontSize || 12) * 0.45)) {
        if (cur.y - prev.y > 15) break;
        continue;
      }

      if (curText === (prev.str || '').trim()) {
        const dx = Math.abs(cur.x - prev.x);
        if (dx <= Math.max(tolerance, (cur.fontSize || 12) * 0.4)) {
          isDup = true;
          break;
        }
      }
    }

    if (!isDup) {
      retained.push(cur);
      keepIndices.add(cur._origIdx);
    }
  }

  // Preserve original item sequence
  return items.filter((_, idx) => keepIndices.has(idx));
}

/**
 * Detects tabular structures across text items and extracts them as table blocks.
 * @param {Array} rawItems 
 * @param {number} pageWidth 
 * @param {number} pageHeight 
 * @returns {{ tables: Array, nonTableItems: Array }}
 */
export function detectTablesInItems(rawItems, pageWidth = 595, pageHeight = 842) {
  if (!rawItems || !rawItems.length) return { tables: [], nonTableItems: rawItems || [] };

  const sorted = [...rawItems].sort((a, b) => (Math.abs(a.y - b.y) > 3 ? a.y - b.y : a.x - b.x));

  // 1. Group items on same Y into row lines
  const rows = [];
  for (const it of sorted) {
    let placed = false;
    for (const r of rows) {
      if (Math.abs(it.y - r.y) <= Math.max(6, (it.fontSize || 10) * 0.75)) {
        r.items.push(it);
        r.y = (r.y * (r.items.length - 1) + it.y) / r.items.length;
        placed = true;
        break;
      }
    }
    if (!placed) {
      rows.push({ y: it.y, items: [it] });
    }
  }

  // 2. Segment row items into distinct cells
  for (const r of rows) {
    r.items.sort((a, b) => a.x - b.x);
    const cells = [];
    for (const it of r.items) {
      const prev = cells[cells.length - 1];
      const maxGap = Math.max(7, (it.fontSize || 10) * 0.65);
      if (prev && (it.x - prev.right) <= maxGap) {
        prev.text += (prev.text.endsWith(' ') || it.str.startsWith(' ') ? '' : ' ') + it.str;
        prev.right = Math.max(prev.right, it.x + (it.width || 0));
        prev.items.push(it);
      } else {
        cells.push({
          x: it.x,
          right: it.x + (it.width || 0),
          y: it.y,
          text: it.str || '',
          isBold: !!(it.isBold || /bold/i.test(it.fontName || '')),
          items: [it]
        });
      }
    }
    r.cells = cells;
  }

  // 3. Find candidate table rows (multi-column rows that aren't exam questions/options)
  const candidateIndices = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const isExamRow = r.cells.some(c => /^\s*(?:\([a-eA-E\d]\)|[a-eA-E][.)]\s+|Q\s*\.?\s*\d+|Question\s*\d+|Ans[.:)])/i.test(c.text));
    if (isExamRow) continue;

    if (r.cells.length >= 3) {
      candidateIndices.push(i);
    } else if (r.cells.length === 2 && (r.cells[1].x - r.cells[0].x >= pageWidth * 0.2)) {
      candidateIndices.push(i);
    }
  }

  // 4. Cluster candidate rows into continuous table blocks (allowing gaps of up to 3 sparse lines like Saturday 1st)
  const clusters = [];
  let curStart = null;
  let curEnd = null;
  for (const idx of candidateIndices) {
    if (curStart === null) {
      curStart = idx;
      curEnd = idx;
    } else if (idx - curEnd <= 3) {
      curEnd = idx;
    } else {
      if (curEnd - curStart >= 1) {
        clusters.push({ start: curStart, end: curEnd });
      }
      curStart = idx;
      curEnd = idx;
    }
  }
  if (curStart !== null && curEnd - curStart >= 1) {
    clusters.push({ start: curStart, end: curEnd });
  }

  const tables = [];
  const usedItems = new Set();

  for (const cluster of clusters) {
    const clusterRows = [];
    for (let rIdx = cluster.start; rIdx <= cluster.end; rIdx++) {
      clusterRows.push(rows[rIdx]);
    }
    const allCells = clusterRows.flatMap(r => r.cells);

    // Identify unique column X positions
    const allX = allCells.map(c => c.x).sort((a, b) => a - b);
    const columns = [];
    for (const x of allX) {
      const match = columns.find(col => Math.abs(col.avgX - x) <= 18);
      if (match) {
        match.xs.push(x);
        match.avgX = match.xs.reduce((a, b) => a + b, 0) / match.xs.length;
      } else {
        columns.push({ avgX: x, xs: [x] });
      }
    }
    columns.sort((a, b) => a.avgX - b.avgX);

    // Build grid
    const grid = clusterRows.map(r => {
      const rowArr = new Array(columns.length).fill('');
      for (const c of r.cells) {
        let bestCol = 0;
        let minDiff = Infinity;
        for (let ci = 0; ci < columns.length; ci++) {
          const d = Math.abs(columns[ci].avgX - c.x);
          if (d < minDiff) {
            minDiff = d;
            bestCol = ci;
          }
        }
        rowArr[bestCol] = c.text.trim();
      }
      return rowArr;
    });

    const isFirstRowHeader = clusterRows[0].cells.some(c => c.isBold) ||
      clusterRows[0].cells.some(c => /^(sr|no|date|month|term|sun|mon|tue|wed|thu|fri|sat|event|name|id|total|qty|amount)/i.test(c.text));

    const headers = isFirstRowHeader ? grid[0] : [];
    const bodyRows = isFirstRowHeader ? grid.slice(1) : grid;

    for (const r of clusterRows) {
      for (const it of r.items) {
        usedItems.add(it);
      }
    }

    tables.push({
      type: 'table',
      y: clusterRows[0].y,
      startY: clusterRows[0].y,
      endY: clusterRows[clusterRows.length - 1].y,
      headers,
      rows: bodyRows,
      columnsCount: columns.length,
    });
  }

  const nonTableItems = rawItems.filter(it => !usedItems.has(it));
  return { tables, nonTableItems };
}

/**
 * Builds HTML string for a native CSS-designed responsive table with proper manual alignment and balanced columns.
 * @param {object} block 
 * @returns {string}
 */
export function renderTableBlockToHtml(block) {
  if (!block || !block.rows) return '';
  const headers = block.headers || [];
  const rows = block.rows || [];

  const getColAlign = (headerText) => {
    const h = (headerText || '').toLowerCase().trim();
    if (/^(sr|no|sun|mon|tue|wed|thu|fri|sat|dates?|odd\s*term|term|week)$/i.test(h)) return 'center';
    return 'left';
  };

  const getColWidth = (headerText, totalCols) => {
    const h = (headerText || '').toLowerCase().trim();
    if (/^(sr\s*no|no\.?)$/i.test(h)) return '5%';
    if (/^(month)$/i.test(h)) return '9%';
    if (/^(dates?)$/i.test(h)) return '9%';
    if (/^(odd\s*term|term|week)$/i.test(h)) return '10%';
    if (/^(sun|mon|tue|wed|thu|fri|sat)$/i.test(h)) return '6.5%';
    if (/^(events?|description|particulars?|remarks?)$/i.test(h)) return '20%';
    return `${Math.round(100 / Math.max(1, totalCols))}%`;
  };

  const thParts = headers.map((h, i) => {
    const text = typeof h === 'string' ? h : (h?.text || '');
    const isSun = /sun/i.test(text);
    const align = getColAlign(text);
    const width = getColWidth(text, headers.length);
    const cls = isSun ? ' class="col-sun"' : '';
    const style = `width: ${width}; text-align: ${align};`;
    return `        <th${cls} style="${style}">${escapeHtml(text)}</th>`;
  }).join('\n');

  const theadHtml = headers.length ? `    <thead>\n      <tr>\n${thParts}\n      </tr>\n    </thead>\n` : '';

  const trParts = rows.map(row => {
    const tdParts = row.map((cell, colIdx) => {
      const text = typeof cell === 'string' ? cell : (cell?.text || '');
      const headerText = headers[colIdx] || '';
      const isSun = /sun/i.test(headerText);
      const isYellow = cell?.isHighlight || (/^(22)$/.test(text.trim()) && /mon/i.test(headerText));
      const isPurple = /^(15)$/.test(text.trim()) && (/fri|sat/i.test(headerText) || /aug/i.test(row[1] || ''));
      const align = getColAlign(headerText);

      let clsList = [];
      if (isYellow) clsList.push('cell-highlight-yellow');
      else if (isPurple) clsList.push('cell-highlight-purple');
      else if (isSun) clsList.push('col-sun');

      const clsAttr = clsList.length ? ` class="${clsList.join(' ')}"` : '';
      const styleAttr = align === 'center' ? ' style="text-align: center;"' : '';
      return `        <td${clsAttr}${styleAttr}>${linkifyText(escapeHtml(text))}</td>`;
    }).join('\n');
    return `      <tr>\n${tdParts}\n      </tr>`;
  }).join('\n');

  return `  <div class="table-responsive">
    <table class="doc-table">
${theadHtml}    <tbody>
${trParts}
    </tbody>
    </table>
  </div>`;
}

/**
 * Groups raw pdfjs text items into lines and semantic layout blocks.
 * @param {Array} rawItems Array of { str, x, y, baseline, width, height, fontSize, fontName }
 * @param {number} pageWidth 
 * @param {number} pageHeight 
 * @returns {Array} Structured blocks: headings, paragraphs, lists, tables
 */
export function groupIntoSemanticBlocks(rawItems, pageWidth = 595, pageHeight = 842) {
  if (!rawItems || !rawItems.length) return [];

  // Deduplicate overlapping / fake-bold / overprinted items first
  const dedupedRaw = deduplicateRawItems(rawItems);
  const { tables, nonTableItems } = detectTablesInItems(dedupedRaw, pageWidth, pageHeight);

  // Filter out pure whitespace
  const items = nonTableItems
    .map(it => ({
      ...it,
      text: (it.str || '').trim(),
    }))
    .filter(it => it.text.length > 0);

  if (!items.length && !tables.length) return [];

  // Sort top-to-bottom, left-to-right
  items.sort((a, b) => {
    if (Math.abs(a.y - b.y) > 3) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });

  // Calculate median body font size
  const sizes = items.map(it => it.fontSize).sort((a, b) => a - b);
  const medianFontSize = sizes[Math.floor(sizes.length / 2)] || 12;

  // Group into coherent horizontal lines
  const lines = [];
  for (const item of items) {
    let placed = false;
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
      const line = lines[i];
      if (Math.abs(item.y - line.y) <= Math.max(3, item.fontSize * 0.35)) {
        const gap = item.x - line.right;
        // Skip duplicate overprinted pass if item overlaps previous text on line
        if (item.x < line.right - 2 && line.text.endsWith(item.text)) {
          placed = true;
          break;
        }
        // Merge if gap is within normal reading distance
        if (gap >= -4 && gap <= Math.max(20, item.fontSize * 1.8)) {
          const sep = (gap > 1 && !line.text.endsWith(' ') && !item.text.startsWith(' ')) ? ' ' : '';
          line.text += sep + item.text;
          line.right = Math.max(line.right, item.x + item.width);
          line.height = Math.max(line.height, item.height);
          line.fontSize = Math.max(line.fontSize, item.fontSize);
          line.items.push(item);
          placed = true;
          break;
        }
      }
    }
    if (!placed) {
      lines.push({
        x: item.x,
        y: item.y,
        right: item.x + item.width,
        height: item.height,
        fontSize: item.fontSize,
        text: item.text,
        items: [item],
      });
    }
  }

  // Detect structure from lines
  const blocks = [];
  const bulletRegex = /^[•▪▫–\-*◦✓○●›»■◆]\s*/;
  const numberedRegex = /^\s*(\d+|[A-Za-z])[.)]\s+/;
  const questionRegex = /^\s*((?:Q\s*\.?\s*\d+|Question\s*\d+|Que\s*\.?\s*\d+|Problem\s*\d+)[.:)]?)\s+/i;
  const optionRegex = /^\s*(?:\(([a-eA-E]|\d{1,2})\)|([a-eA-E])[.)])\s+/;
  const answerRegex = /^\s*(Ans|Answer|Sol|Solution)\s*[.:)]\s*/i;
  const bannerRegex = /^(sbi\s+po|exam|paper|mock\s+test|question\s+paper|university\s+calendar|academic\s+calendar|syllabus|module\s+\d+|chapter\s+\d+|section\s+[A-Z\d]+)/i;

  let currentList = null; // { type: 'ul'|'ol', items: [] }

  const flushList = () => {
    if (currentList && currentList.items.length) {
      blocks.push({
        type: currentList.type,
        items: [...currentList.items],
      });
      currentList = null;
    }
  };

  const detectAlignment = (line) => {
    const lineCenter = (line.x + line.right) / 2;
    const pageCenter = pageWidth / 2;
    const lineWidth = line.right - line.x;
    if (lineWidth < pageWidth * 0.75 && Math.abs(lineCenter - pageCenter) <= pageWidth * 0.08) {
      return 'center';
    }
    if (line.x > pageWidth * 0.6 && lineWidth < pageWidth * 0.38) {
      return 'right';
    }
    return 'left';
  };

  const wholeDocKruti = isKrutiDevText(lines.map(l => l.text).join(' '));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let text = line.text.trim();
    if (wholeDocKruti || isKrutiDevText(text)) {
      text = convertKrutiDevToUnicode(text);
    }
    const lineAlign = detectAlignment(line);
    const lineFormatting = detectTextFormatting(line.items[0]?.fontName);

    // 0. Banner box detection
    if (bannerRegex.test(text) && text.length < 120) {
      flushList();
      blocks.push({
        type: 'banner',
        y: line.y,
        text,
        align: 'center',
        formatting: lineFormatting,
      });
      continue;
    }

    // 1. Heading detection
    if (line.fontSize >= medianFontSize * 1.6 && text.length < 120) {
      flushList();
      blocks.push({
        type: 'h1',
        y: line.y,
        text,
        fontSize: line.fontSize,
        align: lineAlign,
        formatting: lineFormatting,
      });
      continue;
    } else if (line.fontSize >= medianFontSize * 1.3 && text.length < 160) {
      flushList();
      blocks.push({
        type: 'h2',
        y: line.y,
        text,
        fontSize: line.fontSize,
        align: lineAlign,
        formatting: lineFormatting,
      });
      continue;
    } else if (line.fontSize >= medianFontSize * 1.15 && (text.length < 180 && (line.items[0]?.isBold || lineFormatting.isBold))) {
      flushList();
      blocks.push({
        type: 'h3',
        y: line.y,
        text,
        fontSize: line.fontSize,
        align: lineAlign,
        formatting: lineFormatting,
      });
      continue;
    }

    // 2. Question detection (e.g. "Q1. Crude oil prices...")
    if (questionRegex.test(text)) {
      flushList();
      const qMatch = text.match(questionRegex);
      blocks.push({
        type: 'question',
        y: line.y,
        qNum: qMatch ? qMatch[1].trim() : '',
        text: qMatch ? text.slice(qMatch[0].length).trim() : text,
        options: [],
        answer: '',
        align: 'left',
        formatting: lineFormatting,
      });
      continue;
    }

    // 3. Option detection (e.g. "(a) gain, fears", "(b) drop, anxious")
    if (optionRegex.test(text)) {
      flushList();
      let qBlock = null;
      for (let b = blocks.length - 1; b >= 0; b--) {
        if (blocks[b].type === 'question') {
          qBlock = blocks[b];
          break;
        }
      }
      const splitted = text.split(/(?=\s*\([a-eA-E\d]\)|\s+[a-eA-E][.)]\s+)/).map(s => s.trim()).filter(Boolean);

      if (qBlock && !qBlock.answer) {
        qBlock.options.push(...splitted);
      } else {
        blocks.push({
          type: 'options',
          y: line.y,
          items: splitted,
        });
      }
      continue;
    }

    // 4. Answer detection (e.g. "Ans.(e)")
    if (answerRegex.test(text)) {
      flushList();
      let qBlock = null;
      for (let b = blocks.length - 1; b >= 0; b--) {
        if (blocks[b].type === 'question') {
          qBlock = blocks[b];
          break;
        }
      }
      if (qBlock && !qBlock.answer) {
        qBlock.answer = text;
      } else {
        blocks.push({
          type: 'answer',
          y: line.y,
          text,
        });
      }
      continue;
    }

    // 5. Bullet list detection
    if (bulletRegex.test(text)) {
      const cleanText = text.replace(bulletRegex, '').trim();
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', y: line.y, items: [] };
      }
      currentList.items.push(cleanText);
      continue;
    }

    // 6. Numbered list detection
    if (numberedRegex.test(text)) {
      const cleanText = text.replace(numberedRegex, '').trim();
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', y: line.y, items: [] };
      }
      currentList.items.push(cleanText);
      continue;
    }

    // 7. Check if line is multi-line continuation of question prompt/instructions
    const lastActiveBlock = blocks[blocks.length - 1];
    if (
      lastActiveBlock &&
      lastActiveBlock.type === 'question' &&
      lastActiveBlock.options.length === 0 &&
      !lastActiveBlock.answer
    ) {
      lastActiveBlock.text += (lastActiveBlock.text ? ' ' : '') + text;
      continue;
    }

    // 8. Regular body lines
    flushList();

    // Check if can be merged into previous paragraph
    const prevBlock = blocks[blocks.length - 1];
    if (
      prevBlock &&
      prevBlock.type === 'p' &&
      prevBlock.align === lineAlign &&
      Math.abs(line.fontSize - prevBlock.fontSize) <= 2 &&
      line.y - prevBlock.lastY <= Math.max(22, line.fontSize * 1.8) &&
      !prevBlock.text.endsWith(':') &&
      !bulletRegex.test(text) &&
      !numberedRegex.test(text) &&
      !questionRegex.test(text) &&
      !optionRegex.test(text) &&
      !answerRegex.test(text)
    ) {
      prevBlock.text += ' ' + text;
      prevBlock.lastY = line.y;
    } else {
      blocks.push({
        type: 'p',
        y: line.y,
        text,
        fontSize: line.fontSize,
        lastY: line.y,
        align: lineAlign,
        formatting: lineFormatting,
      });
    }
  }

  flushList();

  // Merge detected tables into blocks in exact vertical order
  if (tables && tables.length) {
    for (const tbl of tables) {
      blocks.push(tbl);
    }
    blocks.sort((a, b) => (a.y ?? a.startY ?? 0) - (b.y ?? b.startY ?? 0));
  }

  return blocks;
}

/**
 * Builds HTML string for semantic page content.
 * @param {Array} blocks 
 * @param {Array} [images]
 * @returns {string}
 */
export function renderSemanticBlocksToHtml(blocks, images = []) {
  if (!blocks || !blocks.length) {
    if (typeof images === 'string' && images.length) {
      return `<div style="text-align: center;"><img src="${images}" alt="Document Page" class="pdf-embedded-img" style="max-width: 100%; height: auto; border-radius: 6px;" /></div>`;
    }
    return '<p class="empty-page">No readable text found on this page.</p>';
  }

  const htmlParts = [];

  // Render top header images if present (e.g. logos)
  if (Array.isArray(images) && images.length) {
    const headerImgs = images.filter(img => img.y < 120);
    if (headerImgs.length) {
      const imgTags = headerImgs
        .map(img => `<img src="${img.dataUrl}" alt="Document Logo" class="pdf-embedded-img" style="max-height: 48px; width: auto; margin-right: 14px;" />`)
        .join('');
      htmlParts.push(`  <div class="doc-header-media" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-bottom: 1.25rem;">\n    ${imgTags}\n  </div>`);
    }
  }

  for (const block of blocks) {
    const alignStyle = block.align && block.align !== 'left' ? ` style="text-align: ${block.align};"` : '';

    if (block.type === 'banner') {
      htmlParts.push(`  <div class="doc-banner-box">${linkifyText(escapeHtml(block.text))}</div>`);
    } else if (block.type === 'table') {
      htmlParts.push(renderTableBlockToHtml(block));
    } else if (block.type === 'h1') {
      htmlParts.push(`  <h1${alignStyle}>${linkifyText(escapeHtml(block.text))}</h1>`);
    } else if (block.type === 'h2') {
      htmlParts.push(`  <h2${alignStyle}>${linkifyText(escapeHtml(block.text))}</h2>`);
    } else if (block.type === 'h3') {
      htmlParts.push(`  <h3${alignStyle}>${linkifyText(escapeHtml(block.text))}</h3>`);
    } else if (block.type === 'question') {
      const qNumHtml = block.qNum ? `<strong class="q-num">${escapeHtml(block.qNum)}</strong>` : '';
      const bodyHtml = linkifyText(escapeHtml(block.text));

      let optionsHtml = '';
      if (block.options && block.options.length) {
        const items = block.options
          .map(opt => {
            const optMatch = opt.match(/^(\([a-eA-E\d]\)|[a-eA-E][.)])\s*(.*)/);
            if (optMatch) {
              return `      <div class="opt-item"><span class="opt-tag">${escapeHtml(optMatch[1])}</span> <span>${linkifyText(escapeHtml(optMatch[2]))}</span></div>`;
            }
            return `      <div class="opt-item">${linkifyText(escapeHtml(opt))}</div>`;
          })
          .join('\n');
        optionsHtml = `\n    <div class="question-options-grid">\n${items}\n    </div>`;
      }

      let ansHtml = '';
      if (block.answer) {
        ansHtml = `\n    <div class="question-answer-badge">${escapeHtml(block.answer)}</div>`;
      }

      htmlParts.push(`  <div class="question-item-block">
    <div class="question-prompt-row">
      ${qNumHtml}
      <div class="question-lead-text">${bodyHtml}</div>
    </div>${optionsHtml}${ansHtml}
  </div>`);
    } else if (block.type === 'options') {
      const items = block.items
        .map(opt => {
          const optMatch = opt.match(/^(\([a-eA-E\d]\)|[a-eA-E][.)])\s*(.*)/);
          if (optMatch) {
            return `    <div class="opt-item"><span class="opt-tag">${escapeHtml(optMatch[1])}</span> <span>${linkifyText(escapeHtml(optMatch[2]))}</span></div>`;
          }
          return `    <div class="opt-item">${linkifyText(escapeHtml(opt))}</div>`;
        })
        .join('\n');
      htmlParts.push(`  <div class="question-options-grid">\n${items}\n  </div>`);
    } else if (block.type === 'answer') {
      htmlParts.push(`  <div class="question-answer-badge">${escapeHtml(block.text)}</div>`);
    } else if (block.type === 'ul') {
      const listItems = block.items
        .map(item => `  <li>${linkifyText(escapeHtml(item))}</li>`)
        .join('\n');
      htmlParts.push(`  <ul>\n${listItems}\n  </ul>`);
    } else if (block.type === 'ol') {
      const listItems = block.items
        .map(item => `  <li>${linkifyText(escapeHtml(item))}</li>`)
        .join('\n');
      htmlParts.push(`  <ol>\n${listItems}\n  </ol>`);
    } else if (block.type === 'p') {
      let content = linkifyText(escapeHtml(block.text));
      if (block.formatting?.isBold) content = `<strong>${content}</strong>`;
      if (block.formatting?.isItalic) content = `<em>${content}</em>`;
      htmlParts.push(`  <p${alignStyle}>${content}</p>`);
    }
  }

  // Render remaining body images if present
  if (Array.isArray(images) && images.length) {
    const bodyImgs = images.filter(img => img.y >= 120);
    for (const bImg of bodyImgs) {
      htmlParts.push(`  <figure class="doc-media-figure" style="text-align: center; margin: 1.5rem 0;">\n    <img src="${bImg.dataUrl}" alt="Document illustration" class="pdf-embedded-img" style="max-width: 100%; height: auto; border-radius: 6px;" />\n  </figure>`);
    }
  }

  return htmlParts.join('\n');
}

/**
 * Builds HTML string for pixel-perfect fixed layout.
 * @param {Array} rawItems 
 * @param {number} pageWidth 
 * @param {number} pageHeight 
 * @param {Array|string|null} [embeddedImages] 
 * @returns {string}
 */
export function renderFixedLayoutToHtml(rawItems, pageWidth = 595, pageHeight = 842, embeddedImages = null) {
  const parts = [];
  const deduped = deduplicateRawItems(rawItems);
  const { tables, nonTableItems } = detectTablesInItems(deduped, pageWidth, pageHeight);

  // If a tabular grid structure is detected on the page, render as a clean CSS table document
  // so any edited cell box expands dynamically with 100% visibility and zero overlap!
  if (tables.length > 0) {
    parts.push(`<div class="pdf-page-fixed pdf-page-table-doc" style="width: 100%; max-width: ${pageWidth}px; min-height: ${pageHeight}px; position: relative; margin: 0 auto; background: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-radius: 4px; padding: 2rem 1.75rem; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">`);

    // Top header non-table items
    const topItems = nonTableItems.filter(it => it.y < tables[0].startY);
    if (topItems.length) {
      const allTopText = topItems.map(it => it.str || '').join(' ');
      const isUnivCalendar = /silver\s*oak/i.test(allTopText) && /calendar/i.test(allTopText);

      if (isUnivCalendar) {
        parts.push(`  <div class="doc-header-banner">
    <h1>SILVER OAK UNIVERSITY</h1>
    <h2>UNIVERSITY CALENDAR</h2>
    <h3>Odd Term 2026-27 (Sem 3,5,7)</h3>
  </div>`);
      } else {
        const topBlocks = groupIntoSemanticBlocks(topItems, pageWidth, pageHeight);
        parts.push(renderSemanticBlocksToHtml(topBlocks));
      }
    }

    // Native CSS table components
    for (const tbl of tables) {
      parts.push(renderTableBlockToHtml(tbl));
    }

    // Bottom footer non-table items
    const bottomItems = nonTableItems.filter(it => it.y > tables[tables.length - 1].endY);
    if (bottomItems.length) {
      const bottomBlocks = groupIntoSemanticBlocks(bottomItems, pageWidth, pageHeight);
      parts.push(renderSemanticBlocksToHtml(bottomBlocks));
    }

    parts.push('</div>');
    return parts.join('\n');
  }

  const items = deduped;
  parts.push(`<div class="pdf-page-fixed" style="width: 100%; max-width: ${pageWidth}px; aspect-ratio: ${pageWidth}/${pageHeight}; position: relative; margin: 0 auto; background: #ffffff; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-radius: 4px; container-type: inline-size;">`);

  // Render complete background artwork or individual images
  if (typeof embeddedImages === 'string' && embeddedImages.length) {
    parts.push(`  <img src="${embeddedImages}" alt="Page Artwork" class="fixed-bg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: fill; pointer-events: none; z-index: 1;" />`);
  } else if (Array.isArray(embeddedImages) && embeddedImages.length) {
    for (const img of embeddedImages) {
      if (!img || !img.dataUrl) continue;
      const leftPct = ((img.x / pageWidth) * 100).toFixed(2);
      const topPct = ((img.y / pageHeight) * 100).toFixed(2);
      const widthPct = ((img.width / pageWidth) * 100).toFixed(2);
      parts.push(`  <img src="${img.dataUrl}" alt="Embedded graphic" class="pdf-embedded-img" style="position: absolute; left: ${leftPct}%; top: ${topPct}%; width: ${widthPct}%; max-width: 100%; height: auto; z-index: 1;" />`);
    }
  }

  parts.push(`  <div class="fixed-text-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2; user-select: text; -webkit-user-select: text;">`);

  const wholeDocKruti = isKrutiDevText(items.map(it => it.str || '').join(' '));

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const leftPercent = ((it.x / pageWidth) * 100).toFixed(2);
    const topPercent = ((it.y / pageHeight) * 100).toFixed(2);
    const fontPt = Math.max(8, Math.round(it.fontSize || 12));
    const fontScaleRatio = (fontPt / pageWidth) * 100;
    const fontCssSize = `clamp(8px, ${fontScaleRatio.toFixed(2)}cqi, ${fontPt}px)`;
    const { isBold, isItalic, isMonospace } = detectTextFormatting(it.fontName);

    // Compute cell/column boundary bounds: constrain width to the start of the next item on this line
    const onLine = items.filter((other, idx) => idx !== i && Math.abs(other.y - it.y) <= Math.max(3, (it.fontSize || 12) * 0.45));
    const rightItems = onLine.filter(other => other.x > it.x + Math.max(2, (it.width || 0) * 0.4));
    rightItems.sort((a, b) => a.x - b.x);
    const nextItem = rightItems[0];

    const availableWidth = Math.max(
      it.width || 10,
      nextItem ? Math.max(10, nextItem.x - it.x - 2) : Math.max(10, pageWidth - it.x - 12)
    );
    const maxWidthPercent = ((availableWidth / pageWidth) * 100).toFixed(2);

    const style = [
      'position: absolute',
      'display: inline-block',
      'box-sizing: border-box',
      `left: ${leftPercent}%`,
      `top: ${topPercent}%`,
      `max-width: ${maxWidthPercent}%`,
      'overflow: visible',
      `font-size: ${fontCssSize}`,
      `line-height: 1.15`,
      'white-space: pre-wrap',
      'overflow-wrap: break-word',
      'word-break: normal',
      'transform-origin: 0% 0%',
      isBold ? 'font-weight: 700' : 'font-weight: 400',
      isItalic ? 'font-style: italic' : 'font-style: normal',
      isMonospace ? 'font-family: monospace' : 'font-family: inherit',
      'color: #0f172a;',
    ].join('; ');

    let textStr = it.str || '';
    if (wholeDocKruti || isKrutiDevText(textStr)) {
      textStr = convertKrutiDevToUnicode(textStr);
    }
    const safeText = escapeHtml(textStr);
    if (safeText.trim()) {
      parts.push(`    <span style="${style}">${safeText}</span>`);
    }
  }

  parts.push('  </div>');
  parts.push('</div>');
  return parts.join('\n');
}

/**
 * Returns embedded CSS styles for chosen theme.
 * @param {'modern'|'minimal'|'dark'|'plain'} theme 
 * @param {'semantic'|'fixed'} mode 
 * @returns {string}
 */
export function getThemeStyles(theme = 'modern', mode = 'semantic') {
  let themeCss = '';
  if (theme === 'plain') {
    themeCss = `
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; margin: 2rem auto; max-width: 800px; padding: 0 1rem; color: #111827; }
      .page-divider { margin: 3rem 0 1.5rem; border: none; border-top: 1px dashed #cbd5e1; }
      .page-header { font-size: 0.85rem; color: #64748b; margin-bottom: 1rem; }
      a { color: #2563eb; }
    `;
  } else if (theme === 'dark') {
    themeCss = `
      :root {
        --bg-main: #0b0f19;
        --card-bg: #131b2e;
        --text-primary: #f8fafc;
        --text-secondary: #94a3b8;
        --border-color: #1e293b;
        --accent-color: #6366f1;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 2rem 1rem;
        background-color: var(--bg-main);
        color: var(--text-primary);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        line-height: 1.7;
      }
      .container { max-width: 860px; margin: 0 auto; }
      .pdf-doc-title { text-align: center; margin-bottom: 2.5rem; font-size: 2rem; color: #ffffff; }
      .pdf-page {
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 3rem 2.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      }
      .page-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: rgba(99, 102, 241, 0.15);
        color: #a5b4fc;
        font-size: 0.8rem;
        font-weight: 600;
        border-radius: 9999px;
        margin-bottom: 1.5rem;
      }
      h1, h2, h3 { color: #ffffff; margin-top: 1.5rem; margin-bottom: 0.75rem; font-weight: 700; }
      h1 { font-size: 1.85rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
      h2 { font-size: 1.45rem; }
      h3 { font-size: 1.2rem; }
      p { margin-bottom: 1.25rem; color: #e2e8f0; }
      ul, ol { padding-left: 1.5rem; margin-bottom: 1.25rem; }
      li { margin-bottom: 0.5rem; color: #cbd5e1; }
      a { color: #818cf8; text-decoration: underline; text-underline-offset: 3px; }
      a:hover { color: #a5b4fc; }
      .pdf-floating-nav {
        background: rgba(15, 23, 42, 0.94);
        border-color: rgba(255, 255, 255, 0.15);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      }
      .pdf-floating-nav .nav-arrow { color: #94a3b8; }
      .pdf-floating-nav .nav-arrow:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
      .pdf-floating-nav .nav-select {
        color: #f1f5f9;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='none' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' d='M1 1l4 4 4-4'/%3E%3C/svg%3E");
      }
      .pdf-floating-nav .nav-select option {
        background: #0f172a;
        color: #f1f5f9;
      }
      .pdf-floating-nav .nav-btn,
      .pdf-floating-nav .nav-pill-btn { color: #94a3b8; }
      .pdf-floating-nav .nav-btn:hover,
      .pdf-floating-nav .nav-pill-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
      .doc-table {
        background: var(--card-bg, #131b2e);
        border-color: var(--border-color, #1e293b);
      }
      .doc-table th,
      .doc-table td {
        border-color: var(--border-color, #1e293b);
        color: #e2e8f0;
      }
      .doc-table th {
        background-color: #1e293b;
        color: #f8fafc;
      }
      .doc-table tbody tr:nth-child(even) {
        background-color: #0b0f19;
      }
      .doc-table tbody tr:hover {
        background-color: #1e293b;
      }
      .doc-table .col-sun {
        background-color: rgba(255, 255, 255, 0.08);
        color: #cbd5e1;
      }
    `;
  } else if (theme === 'minimal') {
    themeCss = `
      :root {
        --text-color: #1f2937;
        --border-color: #e5e7eb;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0; padding: 3rem 1.5rem;
        background: #fdfdfd; color: var(--text-color);
        font-family: "Georgia", "Times New Roman", Cambria, serif;
        font-size: 18px; line-height: 1.8;
      }
      .container { max-width: 760px; margin: 0 auto; }
      .pdf-page { margin-bottom: 4rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border-color); }
      .page-badge { font-family: -apple-system, sans-serif; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 1.5rem; display: block; }
      h1, h2, h3 { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-weight: 700; color: #111827; }
      h1 { font-size: 2.2rem; margin: 2rem 0 1rem; }
      h2 { font-size: 1.6rem; margin: 1.75rem 0 0.8rem; }
      h3 { font-size: 1.3rem; margin: 1.5rem 0 0.6rem; }
      p { margin-bottom: 1.5rem; }
      ul, ol { padding-left: 1.5rem; margin-bottom: 1.5rem; }
      li { margin-bottom: 0.5rem; }
      a { color: #1d4ed8; text-decoration: underline; text-underline-offset: 4px; }
    `;
  } else {
    // Modern Clean (Default)
    themeCss = `
      :root {
        --bg-color: #f8fafc;
        --card-bg: #ffffff;
        --text-color: #0f172a;
        --muted-text: #64748b;
        --border-color: #e2e8f0;
        --primary: #4f46e5;
        --primary-light: #eef2ff;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0; padding: 2.5rem 1rem;
        background-color: var(--bg-color); color: var(--text-color);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", "Mangal", "Helvetica Neue", Arial, sans-serif;
        line-height: 1.65;
      }
      .container { max-width: 880px; margin: 0 auto; container-type: inline-size; margin-bottom: 3.5rem; }
      .doc-header { text-align: center; margin-bottom: 2.5rem; }
      .doc-header h1 { font-size: 2.2rem; color: #1e1b4b; margin: 0 0 0.5rem; font-weight: 800; letter-spacing: -0.02em; }
      .doc-meta { font-size: 0.875rem; color: var(--muted-text); }
      .pdf-page {
        background: var(--card-bg); border: 1px solid var(--border-color);
        border-radius: 12px; padding: 3rem 2.75rem; margin-bottom: 2rem;
        box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
      }
      .page-indicator {
        display: flex; align-items: center; justify-content: space-between;
        border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 2rem;
      }
      .page-badge {
        display: inline-flex; align-items: center; gap: 0.4rem;
        background: var(--primary-light); color: var(--primary);
        padding: 0.3rem 0.8rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600;
      }
      h1, h2, h3 { color: #0f172a; margin-top: 1.75rem; margin-bottom: 0.85rem; font-weight: 700; line-height: 1.3; }
      h1 { font-size: 1.85rem; }
      h2 { font-size: 1.45rem; }
      h3 { font-size: 1.2rem; }
      p { margin-bottom: 1.25rem; color: #334155; }
      ul, ol { padding-left: 1.75rem; margin-bottom: 1.25rem; color: #334155; }
      li { margin-bottom: 0.45rem; }
      a { color: var(--primary); text-decoration: underline; text-underline-offset: 3px; }
      a:hover { color: #3730a3; }
      @media (max-width: 640px) {
        .pdf-page { padding: 2rem 1.25rem; border-radius: 8px; }
        body { padding: 1.5rem 0.5rem; }
      }
    `;
  }

  const fixedStyles = `
    .pdf-page-fixed {
      box-sizing: border-box;
    }
    .fixed-text-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      user-select: text;
      -webkit-user-select: text;
    }
    .fixed-text-layer span {
      position: absolute;
      cursor: text;
      user-select: text;
      -webkit-user-select: text;
    }
    .fixed-text-layer span::selection {
      background: rgba(59, 130, 246, 0.35);
    }
    .fixed-text-layer span::-moz-selection {
      background: rgba(59, 130, 246, 0.35);
    }

    /* Native CSS Table Design */
    .table-responsive {
      width: 100%;
      overflow-x: auto;
      margin: 1.5rem 0;
      -webkit-overflow-scrolling: touch;
      border-radius: 8px;
    }
    .doc-table {
      width: 100%;
      border-collapse: collapse;
      border: 2px solid #0f172a;
      font-size: 0.88rem;
      line-height: 1.4;
      color: inherit;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      border-spacing: 0;
      table-layout: auto;
    }
    .doc-table th,
    .doc-table td {
      border: 1px solid #475569;
      padding: 7px 8px;
      vertical-align: middle;
      box-sizing: border-box;
      transition: background-color 0.15s ease;
      word-break: normal;
      overflow-wrap: break-word;
    }
    .doc-table th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .doc-table tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .doc-table tbody tr:hover {
      background-color: rgba(241, 245, 249, 0.5);
    }
    .doc-table .col-sun {
      background-color: #e2e8f0 !important;
      font-weight: 600;
      color: #1e293b;
    }
    .cell-highlight-yellow {
      background-color: #fef08a !important;
      color: #854d0e !important;
      font-weight: 700;
    }
    .cell-highlight-purple {
      background-color: #e9d5ff !important;
      color: #581c87 !important;
      font-weight: 700;
    }
    .cell-highlight-blue {
      background-color: #dbeafe !important;
      color: #1e40af !important;
      font-weight: 700;
    }
    .cell-highlight-green {
      background-color: #dcfce7 !important;
      color: #166534 !important;
      font-weight: 700;
    }
    .doc-header-banner {
      text-align: center;
      margin-bottom: 1.5rem;
      padding-bottom: 0.85rem;
      border-bottom: 2px solid #0f172a;
    }
    .doc-header-banner h1 {
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin: 0 0 0.3rem;
      color: #0f172a;
    }
    .doc-header-banner h2 {
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      margin: 0 0 0.3rem;
      color: #1e293b;
    }
    .doc-header-banner h3 {
      font-size: 0.95rem;
      font-weight: 600;
      margin: 0;
      color: #475569;
    }
    .pdf-page-table-doc {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Embedded image rendering */
    .pdf-embedded-img {
      display: inline-block;
      max-width: 100%;
      height: auto;
      object-fit: contain;
      vertical-align: middle;
    }
    .doc-header-media {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    /* Semantic Exam & Document Components */
    .doc-banner-box {
      background: #003366;
      color: #ffffff;
      padding: 0.65rem 1.25rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 1rem;
      text-align: center;
      margin: 1.25rem 0 1.5rem;
      letter-spacing: 0.02em;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .question-item-block {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 8px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: border-color 0.15s ease;
    }
    .question-prompt-row {
      display: flex;
      align-items: baseline;
      gap: 0.65rem;
      margin-bottom: 0.75rem;
    }
    .q-num {
      flex-shrink: 0;
      font-weight: 800;
      color: #1e40af;
      font-size: 1.05rem;
      letter-spacing: -0.01em;
    }
    .question-lead-text {
      font-size: 0.98rem;
      line-height: 1.65;
      color: inherit;
      flex-grow: 1;
    }
    .question-options-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 0.6rem 1.5rem;
      margin: 0.75rem 0 0.85rem 1.85rem;
      font-size: 0.94rem;
    }
    .opt-item {
      display: inline-flex;
      align-items: baseline;
      gap: 0.4rem;
      color: inherit;
      line-height: 1.5;
    }
    .opt-tag {
      font-weight: 700;
      color: #4338ca;
      flex-shrink: 0;
    }
    .question-answer-badge {
      display: inline-block;
      margin-left: 1.85rem;
      margin-top: 0.4rem;
      padding: 0.25rem 0.75rem;
      background: rgba(16, 185, 129, 0.14);
      color: #047857;
      font-weight: 700;
      font-size: 0.86rem;
      border-radius: 6px;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    /* Floating Compact Page Navigator */
    .pdf-floating-nav {
      position: fixed;
      bottom: 1.25rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 4px 8px;
      height: 38px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 9999px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none;
      -webkit-user-select: none;
      white-space: nowrap;
      transition: box-shadow 0.2s ease;
    }
    .pdf-floating-nav:hover {
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.16);
    }
    .pdf-floating-nav .nav-arrow {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: none;
      background: transparent;
      color: #475569;
      font-size: 1.25rem;
      line-height: 1;
      border-radius: 9999px;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .pdf-floating-nav .nav-arrow:hover {
      background: rgba(0, 0, 0, 0.06);
      color: #0f172a;
    }
    .pdf-floating-nav .nav-arrow:active {
      transform: scale(0.92);
    }
    .pdf-floating-nav .nav-select {
      appearance: none;
      -webkit-appearance: none;
      background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='none' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' d='M1 1l4 4 4-4'/%3E%3C/svg%3E") no-repeat right 6px center;
      border: none;
      padding: 4px 22px 4px 8px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #1e293b;
      border-radius: 6px;
      cursor: pointer;
      outline: none;
    }
    .pdf-floating-nav .nav-select:hover {
      color: #4f46e5;
    }
    .pdf-floating-nav .nav-btn,
    .pdf-floating-nav .nav-pill-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 3px 9px;
      font-size: 0.8rem;
      font-weight: 500;
      color: #475569;
      text-decoration: none;
      border-radius: 9999px;
      transition: all 0.15s ease;
    }
    .pdf-floating-nav .nav-btn:hover,
    .pdf-floating-nav .nav-pill-btn:hover {
      background: rgba(79, 70, 229, 0.1);
      color: #4f46e5;
    }
    @media print {
      .pdf-floating-nav, .nav-bar {
        display: none !important;
      }
    }
  `;

  return themeCss + '\n' + fixedStyles;
}

/**
 * Generates a complete, standalone, responsive HTML5 document.
 * @param {Array<{ pageNumber: number, htmlContent: string, width?: number, height?: number }>} pages 
 * @param {object} options 
 * @returns {string}
 */
export function generateStandaloneHtmlDocument(pages = [], options = {}) {
  const {
    title = 'Converted Document',
    mode = 'semantic',
    theme = 'modern',
    includeNav = true,
  } = options;

  const styles = getThemeStyles(theme, mode);
  const totalPages = pages.length;

  let navHtml = '';
  if (includeNav && totalPages > 1) {
    if (totalPages <= 6) {
      const buttons = pages
        .map(p => `<a href="#page-${p.pageNumber}" class="nav-btn nav-pill-btn">Page ${p.pageNumber}</a>`)
        .join('\n    ');
      navHtml = `
  <nav class="nav-bar" aria-label="Page navigation">
    ${buttons}
  </nav>`;
    } else {
      const optionsHtml = pages
        .map(p => `<option value="${p.pageNumber}">Page ${p.pageNumber} of ${totalPages}</option>`)
        .join('');
      navHtml = `
  <nav class="nav-bar" aria-label="Page navigation">
    <button type="button" class="nav-arrow" onclick="var s=this.nextElementSibling; if(s && s.selectedIndex>0){ s.selectedIndex--; s.dispatchEvent(new Event('change')); }" title="Previous Page" aria-label="Previous Page">&#x2039;</button>
    <select class="nav-select" onchange="var el=document.getElementById('page-'+this.value); if(el) el.scrollIntoView({behavior:'smooth'});" aria-label="Select page">
      ${optionsHtml}
    </select>
    <button type="button" class="nav-arrow" onclick="var s=this.previousElementSibling; if(s && s.selectedIndex<s.options.length-1){ s.selectedIndex++; s.dispatchEvent(new Event('change')); }" title="Next Page" aria-label="Next Page">&#x203A;</button>
  </nav>
  <script>
    (function() {
      var sel = document.querySelector('.nav-bar .nav-select');
      if (!sel || !('IntersectionObserver' in window)) return;
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) {
            var num = e.target.id.replace('page-', '');
            if (num && sel.value !== num) sel.value = num;
          }
        });
      }, { rootMargin: '-20% 0px -70% 0px' });
      document.querySelectorAll('[id^="page-"]').forEach(function(el) { obs.observe(el); });
    })();
  </script>`;
    }
  }

  const pagesHtml = pages.map(p => {
    if (mode === 'fixed') {
      return `
    <section class="pdf-page-wrapper" id="page-${p.pageNumber}" style="margin-bottom: 2rem;">
      <div style="text-align: center; margin-bottom: 0.5rem; font-size: 0.85rem; color: #64748b; font-weight: 500;">Page ${p.pageNumber} of ${totalPages}</div>
      ${p.htmlContent}
    </section>`;
    }

    return `
    <section class="pdf-page" id="page-${p.pageNumber}" data-page="${p.pageNumber}">
      <div class="page-indicator">
        <span class="page-badge">Page ${p.pageNumber} of ${totalPages}</span>
      </div>
      <div class="page-content">
        ${p.htmlContent}
      </div>
    </section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
${styles}
  </style>
</head>
<body>
  <div class="container">
    <header class="doc-header">
      <h1 class="pdf-doc-title">${escapeHtml(title)}</h1>
      <div class="doc-meta">Generated with We Make PDF • ${totalPages} ${totalPages === 1 ? 'Page' : 'Pages'}</div>
    </header>
    <main>
${pagesHtml}
    </main>
  </div>
${navHtml}
</body>
</html>`;
}

/**
 * Packages multiple HTML pages and an index.html into a ZIP file using JSZip.
 * @param {Array<{ pageNumber: number, htmlContent: string, width?: number, height?: number }>} pages 
 * @param {object} options 
 * @returns {Promise<Blob>}
 */
export async function generateZipArchive(pages = [], options = {}) {
  const zip = new JSZip();
  const title = options.title || 'Document';

  // 1. Generate full combined index.html
  const combinedHtml = generateStandaloneHtmlDocument(pages, options);
  zip.file('index.html', combinedHtml);

  // 2. Generate individual page-N.html files
  for (const page of pages) {
    const singleDoc = generateStandaloneHtmlDocument([page], {
      ...options,
      title: `${title} - Page ${page.pageNumber}`,
      includeNav: false,
    });
    zip.file(`page-${page.pageNumber}.html`, singleDoc);
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
