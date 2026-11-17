/**
 * Bulk File Renamer Engine
 * 100% In-Browser Client-Side Batch File Renamer
 * Supports Prefix, Suffix, Find & Replace, Numbering, Date Stamping, Case Conversion,
 * Script Generation (.bat, .ps1, .sh), and Instant ZIP Packaging
 */
import JSZip from 'jszip';

export const MAX_RENAME_FILES_COUNT = 500;
export const MAX_TOTAL_RENAME_SIZE = 500 * 1024 * 1024; // 500 MB

/**
 * Splits a filename into base name and extension
 * @param {string} filename
 * @returns {{baseName: string, ext: string}}
 */
export function splitFilename(filename = '') {
  const safeName = String(filename || '').trim();
  const lastDot = safeName.lastIndexOf('.');
  if (lastDot <= 0) {
    return { baseName: safeName, ext: '' };
  }
  return {
    baseName: safeName.slice(0, lastDot),
    ext: safeName.slice(lastDot), // includes leading dot, e.g. '.pdf'
  };
}

/**
 * Changes letter casing of a string
 * @param {string} text
 * @param {'none'|'lower'|'upper'|'title'|'camel'|'kebab'|'snake'} caseMode
 * @returns {string}
 */
export function changeCase(text = '', caseMode = 'none') {
  if (!text || caseMode === 'none') return text;

  switch (caseMode) {
    case 'lower':
      return text.toLowerCase();
    case 'upper':
      return text.toUpperCase();
    case 'title':
      return text
        .replace(/[_\-]+/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
    case 'camel': {
      const words = text.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(/\s+/);
      if (!words.length || !words[0]) return text;
      return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }
    case 'kebab':
      return text
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-zA-Z0-9\-]+/g, '')
        .replace(/--+/g, '-')
        .toLowerCase();
    case 'snake':
      return text
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s\-]+/g, '_')
        .replace(/[^a-zA-Z0-9_]+/g, '')
        .replace(/__+/g, '_')
        .toLowerCase();
    default:
      return text;
  }
}

/**
 * Formats a sequential number with padding and style
 * @param {number} num
 * @param {object} options
 * @returns {string}
 */
export function formatSequenceNumber(num, { padDigits = 2, format = 'num' } = {}) {
  const padded = String(num).padStart(padDigits, '0');
  switch (format) {
    case 'paren':
      return `(${padded})`;
    case 'bracket':
      return `[${padded}]`;
    case 'dash':
      return `-${padded}-`;
    case 'hash':
      return `#${padded}`;
    default:
      return padded;
  }
}

/**
 * Formats a date string according to chosen pattern
 * @param {Date} date
 * @param {string} pattern
 * @returns {string}
 */
export function formatDateStamp(date = new Date(), pattern = 'YYYY-MM-DD') {
  const d = date instanceof Date && !isNaN(date) ? date : new Date();
  const year = String(d.getFullYear());
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  switch (pattern) {
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'YYYYMMDD':
      return `${year}${month}${day}`;
    case 'YYYY-MM-DD_HHmmss':
      return `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
    case 'YYYY.MM.DD':
      return `${year}.${month}.${day}`;
    case 'YYYY-MM-DD':
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Applies full renaming rules pipeline to a single filename
 * @param {string} originalName
 * @param {number} index 0-based
 * @param {number} totalCount
 * @param {object} options
 * @returns {string} New filename with extension
 */
export function applyRenameRule(originalName = '', index = 0, totalCount = 1, options = {}) {
  const {
    prefix = '',
    suffix = '',
    findText = '',
    replaceText = '',
    useRegex = false,
    caseSensitive = false,
    caseMode = 'none',
    numbering = { enabled: false, start: 1, step: 1, padDigits: 2, position: 'suffix', format: 'num' },
    dateStamp = { enabled: false, format: 'YYYY-MM-DD', position: 'prefix' },
    extensionMode = 'original',
    customExtension = '',
    customTemplate = '',
  } = options;

  const { baseName, ext } = splitFilename(originalName);
  let name = baseName;

  // 1. Find & Replace
  if (findText) {
    try {
      if (useRegex) {
        const flags = caseSensitive ? 'g' : 'gi';
        const re = new RegExp(findText, flags);
        name = name.replace(re, replaceText);
      } else {
        if (caseSensitive) {
          name = name.replaceAll(findText, replaceText);
        } else {
          // Case-insensitive literal replace
          const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          name = name.replace(new RegExp(escaped, 'gi'), replaceText);
        }
      }
    } catch {
      // Keep name intact on regex parse error
    }
  }

  // 2. Case Conversion on Base Name
  if (caseMode && caseMode !== 'none') {
    name = changeCase(name, caseMode);
  }

  // 3. Sequential Numbering
  let numberStr = '';
  if (numbering?.enabled) {
    const start = Number(numbering.start ?? 1);
    const step = Number(numbering.step ?? 1);
    const currentNum = start + (index * step);
    numberStr = formatSequenceNumber(currentNum, {
      padDigits: numbering.padDigits ?? 2,
      format: numbering.format ?? 'num',
    });

    if (numbering.position === 'replace') {
      name = numberStr;
    } else if (numbering.position === 'prefix') {
      name = `${numberStr}_${name}`;
    } else {
      // suffix
      name = `${name}_${numberStr}`;
    }
  }

  // 4. Date Stamping
  if (dateStamp?.enabled) {
    const dStr = formatDateStamp(new Date(), dateStamp.format || 'YYYY-MM-DD');
    if (dateStamp.position === 'prefix') {
      name = `${dStr}_${name}`;
    } else {
      name = `${name}_${dStr}`;
    }
  }

  // 5. Prefix & Suffix
  if (prefix) {
    name = `${prefix}${name}`;
  }
  if (suffix) {
    name = `${name}${suffix}`;
  }

  // 6. Custom Template override if provided (e.g. "{prefix}_{name}_{num}")
  if (customTemplate && customTemplate.includes('{')) {
    const numVal = numbering?.enabled ? numberStr : String(index + 1);
    const dVal = formatDateStamp(new Date(), dateStamp?.format || 'YYYY-MM-DD');
    name = customTemplate
      .replaceAll('{name}', baseName)
      .replaceAll('{prefix}', prefix)
      .replaceAll('{suffix}', suffix)
      .replaceAll('{num}', numVal)
      .replaceAll('{date}', dVal)
      .replaceAll('{total}', String(totalCount));
  }

  // 7. Extension formatting
  let finalExt = ext;
  if (extensionMode === 'lower') {
    finalExt = ext.toLowerCase();
  } else if (extensionMode === 'upper') {
    finalExt = ext.toUpperCase();
  } else if (extensionMode === 'custom' && customExtension) {
    finalExt = customExtension.startsWith('.') ? customExtension : `.${customExtension}`;
  }

  // Clean illegal Windows / Unix filename characters
  name = name.replace(/[<>:"/\\|?*]/g, '-').trim();
  if (!name) name = `file_${index + 1}`;

  return `${name}${finalExt}`;
}

/**
 * Resolves duplicate filenames by appending _1, _2
 * @param {string[]} filenames
 * @returns {Array<{name: string, isDuplicate: boolean}>}
 */
export function resolveDuplicateFilenames(filenames = []) {
  const seen = new Map();
  const results = [];

  for (const filename of filenames) {
    const count = seen.get(filename) || 0;
    if (count === 0) {
      seen.set(filename, 1);
      results.push({ name: filename, isDuplicate: false });
    } else {
      seen.set(filename, count + 1);
      const { baseName, ext } = splitFilename(filename);
      const uniqueName = `${baseName}_${count}${ext}`;
      results.push({ name: uniqueName, isDuplicate: true });
    }
  }

  return results;
}

/**
 * Generates a Windows Batch (.bat) file for renaming files locally
 * @param {Array<{original: string, renamed: string}>} filePairs
 * @returns {string}
 */
export function generateWindowsBatScript(filePairs = []) {
  const lines = [
    '@echo off',
    'chcp 65001 > nul',
    'echo =========================================',
    'echo We Make PDF - Bulk File Renamer Batch Tool',
    'echo =========================================',
    'echo Renaming files...',
    '',
  ];

  filePairs.forEach(({ original, renamed }) => {
    if (original !== renamed) {
      lines.push(`if exist "${original}" ren "${original}" "${renamed}"`);
    }
  });

  lines.push('', 'echo.', 'echo Successfully renamed all files!', 'echo.', 'pause');
  return lines.join('\r\n');
}

/**
 * Generates a PowerShell (.ps1) script for renaming files locally
 * @param {Array<{original: string, renamed: string}>} filePairs
 * @returns {string}
 */
export function generatePowerShellScript(filePairs = []) {
  const lines = [
    '# We Make PDF - Bulk File Renamer PowerShell Script',
    '# Run with: powershell -ExecutionPolicy Bypass -File .\\rename.ps1',
    'Write-Host "Renaming files with We Make PDF..." -ForegroundColor Cyan',
    '',
  ];

  filePairs.forEach(({ original, renamed }) => {
    if (original !== renamed) {
      lines.push(`if (Test-Path -LiteralPath "${original}") { Rename-Item -LiteralPath "${original}" -NewName "${renamed}" -Force }`);
    }
  });

  lines.push('', 'Write-Host "Renaming completed successfully!" -ForegroundColor Green');
  return lines.join('\r\n');
}

/**
 * Generates a Bash (.sh) script for macOS and Linux
 * @param {Array<{original: string, renamed: string}>} filePairs
 * @returns {string}
 */
export function generateBashScript(filePairs = []) {
  const lines = [
    '#!/usr/bin/env bash',
    '# We Make PDF - Bulk File Renamer Shell Script',
    'echo "Renaming files..."',
    '',
  ];

  filePairs.forEach(({ original, renamed }) => {
    if (original !== renamed) {
      lines.push(`[ -f "${original}" ] && mv "${original}" "${renamed}"`);
    }
  });

  lines.push('', 'echo "All files successfully renamed!"');
  return lines.join('\n');
}

/**
 * Generates CSV mapping table of Old Name -> New Name
 * @param {Array<{original: string, renamed: string}>} filePairs
 * @returns {string}
 */
export function generateRenameCsv(filePairs = []) {
  const BOM = '\uFEFF';
  const rows = [
    ['Index', 'Original Filename', 'New Filename', 'Status'],
    ...filePairs.map(({ original, renamed }, idx) => [
      String(idx + 1),
      original,
      renamed,
      original === renamed ? 'Unchanged' : 'Renamed',
    ]),
  ];

  const lines = rows.map(r => r.map(c => `"${String(c).replaceAll('"', '""')}"`).join(','));
  return BOM + lines.join('\r\n');
}

/**
 * Creates a ZIP file containing all renamed files
 * @param {File[]} files
 * @param {string[]} newNames
 * @param {Function} onProgress
 * @returns {Promise<Blob>}
 */
export async function generateRenamedZip(files = [], newNames = [], onProgress = () => {}) {
  const zip = new JSZip();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const renamed = newNames[i] || file.name;
    onProgress(`Adding file ${i + 1} of ${files.length} to ZIP…`, i + 1, files.length);

    if (file instanceof File || file instanceof Blob) {
      zip.file(renamed, file);
    } else if (file.data) {
      zip.file(renamed, file.data);
    }
  }

  onProgress('Compressing ZIP archive…', files.length, files.length);
  return await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress(`Compressing ZIP: ${Math.round(metadata.percent)}%`, metadata.percent, 100);
    }
  );
}

/**
 * Sample test files for instant 1-click preview
 */
export const SAMPLE_RENAME_FILES = [
  { name: 'IMG_4021.JPG', size: 2.4 * 1024 * 1024, type: 'image/jpeg' },
  { name: 'IMG_4022.JPG', size: 2.8 * 1024 * 1024, type: 'image/jpeg' },
  { name: 'scan_contract_final_v1.pdf', size: 450 * 1024, type: 'application/pdf' },
  { name: 'receipt_nov_02_acme.png', size: 1.1 * 1024 * 1024, type: 'image/png' },
  { name: 'monthly_financial_report (2).xlsx', size: 85 * 1024, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { name: 'Screenshot_20261102_142311.png', size: 920 * 1024, type: 'image/png' },
  { name: 'PROJECT_PROPOSAL_DRAFT.DOCX', size: 340 * 1024, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
];
