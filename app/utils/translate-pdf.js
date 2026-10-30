import { countWords, formatPdfTextContent } from './extract-ocr.js';
import { applyWatermarkToPdf } from './watermark-pdf.js';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
];

export const SOURCE_LANGUAGES = [
  { code: 'auto', name: 'Auto Detect', native: 'Auto Detect', flag: '🌐' },
  ...SUPPORTED_LANGUAGES,
];

export const MAX_TRANSLATION_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

/**
 * Returns language metadata by code.
 */
export function getLanguageInfo(code) {
  if (!code) return SUPPORTED_LANGUAGES[0];
  const normalized = code.toLowerCase().trim();
  if (normalized === 'auto') {
    return SOURCE_LANGUAGES[0];
  }
  return SUPPORTED_LANGUAGES.find(l => l.code === normalized) || {
    code: normalized,
    name: normalized.toUpperCase(),
    native: normalized.toUpperCase(),
    flag: '🌐',
  };
}

/**
 * Validates a file for PDF translation.
 */
export function validatePdfForTranslation(files) {
  if (!files?.length) return 'Please choose a PDF document to translate.';
  if (files.length > 1) return 'Please select one PDF document at a time.';
  const file = files[0];
  const extension = (file.name.split('.').pop() || '').toLowerCase();

  if (extension !== 'pdf' && file.type !== 'application/pdf') {
    return 'Please choose a valid PDF file (.pdf).';
  }
  if (file.size <= 0) return 'This file is empty. Please choose a valid PDF document with content.';
  if (file.size > MAX_TRANSLATION_FILE_SIZE) {
    return 'This file exceeds the 30 MB limit. Please choose a smaller PDF file.';
  }
  return null;
}

/**
 * Splits long text into chunks that fit comfortably within translation query boundaries.
 */
export function chunkTextForTranslation(text, maxChunkSize = 1400) {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  if (trimmed.length <= maxChunkSize) return [trimmed];

  const paragraphs = trimmed.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length <= maxChunkSize) {
      currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      if (para.length <= maxChunkSize) {
        currentChunk = para;
      } else {
        const sentences = para.split(/(?<=[.?!।\n])\s+/);
        for (const sentence of sentences) {
          if ((currentChunk + ' ' + sentence).length <= maxChunkSize) {
            currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
          } else {
            if (currentChunk) chunks.push(currentChunk);
            if (sentence.length <= maxChunkSize) {
              currentChunk = sentence;
            } else {
              const words = sentence.split(/\s+/);
              for (const word of words) {
                if ((currentChunk + ' ' + word).length <= maxChunkSize) {
                  currentChunk = currentChunk ? currentChunk + ' ' + word : word;
                } else {
                  if (currentChunk) chunks.push(currentChunk);
                  currentChunk = word;
                }
              }
            }
          }
        }
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Translates a single text chunk using redundant translation endpoints:
 * 1. Google Translate Client (gtx)
 * 2. Google Translate Client (dict-chrome-ex)
 * 3. MyMemory Public Translation API
 * Includes graceful offline/mock handling for unit tests and rate limits.
 */
export async function translateTextChunk(text, sourceLang = 'auto', targetLang = 'en', options = {}) {
  if (!text || !text.trim()) return '';
  const sl = sourceLang === 'auto' ? 'auto' : sourceLang.toLowerCase();
  const tl = targetLang.toLowerCase();

  // If source and target are identical and not auto, return source directly
  if (sl !== 'auto' && sl === tl) {
    return text;
  }

  // Allow explicit mock translation for unit tests or offline runners
  if (options.mock) {
    return `[${tl.toUpperCase()}] ${text}`;
  }

  // 1. Primary: Google gtx endpoint
  try {
    const primaryUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(primaryUrl, {
      signal: options.signal,
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map(segment => (segment && segment[0] ? segment[0] : ''))
          .join('');
        if (translated && translated.trim()) {
          return translated;
        }
      }
    }
  } catch (err) {
    if (options.signal?.aborted) throw err;
  }

  // 2. Secondary: Google dict-chrome-ex endpoint
  try {
    const secondaryUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(text)}`;
    const res = await fetch(secondaryUrl, {
      signal: options.signal,
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && typeof data[0] === 'string' && data[0].trim()) {
        return data[0];
      }
    }
  } catch (err) {
    if (options.signal?.aborted) throw err;
  }

  // 3. Tertiary: MyMemory public translation API
  try {
    const fromLang = sl === 'auto' ? 'en' : sl;
    const memUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${encodeURIComponent(fromLang)}|${encodeURIComponent(tl)}`;
    const res = await fetch(memUrl, {
      signal: options.signal,
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText && data.responseData.translatedText.trim()) {
        return data.responseData.translatedText;
      }
    }
  } catch (err) {
    if (options.signal?.aborted) throw err;
  }

  if (options.fallbackOnFail) {
    return `[${tl.toUpperCase()}] ${text}`;
  }
  return text;
}

/**
 * Translates an array of text strings as a single indexed batch, preventing rate-limiting
 * and preserving 1:1 mapping between items.
 */
export async function translateBatch(items, sourceLang = 'auto', targetLang = 'en', options = {}) {
  if (!items || !items.length) return [];
  const sl = sourceLang === 'auto' ? 'auto' : sourceLang.toLowerCase();
  const tl = targetLang.toLowerCase();

  if (sl !== 'auto' && sl === tl) {
    return [...items];
  }

  if (options.mock) {
    return items.map(t => `[${tl.toUpperCase()}] ${t}`);
  }

  // Build indexed batch text: <<<T0>>> First line\n<<<T1>>> Second line
  const indexedText = items.map((t, idx) => `<<<T${idx}>>> ${t}`).join('\n');
  const translatedCombined = await translateTextChunk(indexedText, sl, tl, options);

  const regex = /<<<T(\d+)>>>\s*([\s\S]*?)(?=(?:<<<T\d+>>>|$))/gi;
  const results = [...items];
  let match;
  let matchesFound = 0;

  while ((match = regex.exec(translatedCombined)) !== null) {
    const idx = parseInt(match[1], 10);
    const content = match[2].trim();
    if (!isNaN(idx) && idx >= 0 && idx < items.length) {
      results[idx] = content;
      matchesFound++;
    }
  }

  // If at least 80% of items were cleanly parsed from indexed markers
  if (matchesFound >= items.length * 0.8) {
    // If any item was missed, translate individually
    for (let i = 0; i < items.length; i++) {
      if (results[i] === items[i] && items[i].trim()) {
        try {
          results[i] = await translateTextChunk(items[i], sl, tl, options);
        } catch {}
      }
    }
    return results;
  }

  // Fallback: translate items individually if indexed parsing failed
  const fallbackResults = [];
  for (let i = 0; i < items.length; i++) {
    const t = await translateTextChunk(items[i], sl, tl, options);
    fallbackResults.push(t);
  }
  return fallbackResults;
}

/**
 * Extracts position-aware layout blocks from PDF.js text content.
 * Groups items into coherent visual lines and paragraphs with bounding boxes.
 */
export function extractPageLayoutBlocks(textContent, viewport, pdfjs) {
  if (!textContent?.items?.length) return [];
  const rawItems = [];

  for (const item of textContent.items) {
    if (!item.str || !item.str.trim()) continue;
    let x = 0;
    let baseline = 0;
    let fontSize = 12;

    if (item.transform && pdfjs?.Util?.transform && viewport?.transform) {
      const transform = pdfjs.Util.transform(viewport.transform, item.transform);
      x = Math.max(0, transform[4]);
      baseline = Math.max(0, transform[5]);
      fontSize = Math.max(8, Math.round(Math.hypot(transform[2], transform[3])));
    } else if (item.transform) {
      x = item.transform[4] || 0;
      const rawY = item.transform[5] || 0;
      baseline = viewport?.height ? Math.max(0, viewport.height - rawY) : rawY;
      fontSize = Math.max(8, Math.round(item.transform[0] || 12));
    }

    const top = Math.max(0, baseline - fontSize * 0.85);
    const width = Math.max(item.width || 0, fontSize * 0.5);
    const height = Math.max(item.height || fontSize, fontSize);
    const bottom = top + height;

    rawItems.push({
      str: item.str,
      x,
      baseline,
      top,
      bottom,
      width,
      height,
      fontSize,
      fontName: item.fontName || '',
    });
  }

  if (!rawItems.length) return [];

  // Sort rawItems: top to bottom (by baseline), then left to right
  rawItems.sort((a, b) => {
    if (Math.abs(a.baseline - b.baseline) > 2.5) {
      return a.baseline - b.baseline;
    }
    return a.x - b.x;
  });

  // Group raw items into horizontal line segments (respecting column boundaries, word spacing, and bullet symbols)
  const isBulletOrSymbol = (text) => /^[•▪▫–\-*◦✓○●›»■◆]\s*$/.test((text || '').trim());
  const lines = [];
  for (const item of rawItems) {
    let placed = false;
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 12); i--) {
      const line = lines[i];
      if (Math.abs(item.baseline - line.baseline) <= Math.max(2.5, item.fontSize * 0.25)) {
        const gap = item.x - line.right;
        const maxGap = isBulletOrSymbol(line.text) ? 36 : Math.max(14, line.fontSize * 1.6);
        // Only merge if gap is within normal word spacing or bullet indent (not a separate column or table column)
        if (gap >= -3 && gap <= maxGap) {
          line.text += (gap > 1 && !line.text.endsWith(' ') && !item.str.startsWith(' ') ? ' ' : '') + item.str;
          line.right = Math.max(line.right, item.x + item.width);
          line.height = Math.max(line.height, item.height);
          line.fontSize = Math.max(line.fontSize, item.fontSize);
          line.baseline = Math.max(line.baseline, item.baseline);
          line.top = Math.min(line.top, item.top);
          line.bottom = Math.max(line.bottom, item.bottom || (item.top + item.height));
          placed = true;
          break;
        }
      }
    }
    if (!placed) {
      lines.push({
        top: item.top,
        bottom: item.top + item.height,
        baseline: item.baseline,
        x: item.x,
        right: item.x + item.width,
        height: item.height,
        fontSize: item.fontSize,
        fontName: item.fontName,
        text: item.str,
      });
    }
  }

  // Group lines into column-aware semantic blocks (paragraphs and bullet continuations)
  const blocks = [];
  const isNumberedListLine = text => /^\s*(?:\d+[.)]|[A-Za-z][.)])\s+/.test(text || '');
  for (const line of lines) {
    let attached = false;
    const isBulletLine = isNumberedListLine(line.text) || isBulletOrSymbol(line.text) || /^[•▪▫–\-*◦✓○●›»■◆]/.test(line.text.trim());

    for (let b = blocks.length - 1; b >= 0; b--) {
      const block = blocks[b];
      const isBlockBullet = /^[•▪▫–\-*◦✓○●›»■◆]/.test(block.text.trim());

      // Never attach a new bullet line to an existing block (each bullet item is distinct)
      if (isBulletLine) break;

      // Font size must be virtually identical (never merge heading with body or subhead)
      const fontSizeMatch = Math.abs(line.fontSize - block.fontSize) <= 1.5;
      if (!fontSizeMatch) continue;

      // Robust baseline-to-baseline vertical leading (typically 0.75x to 1.85x fontSize)
      const prevBaseline = block.lastBaseline || block.baseline;
      const baselineGap = line.baseline - prevBaseline;
      const isParagraphLeading = baselineGap >= block.fontSize * 0.75 && baselineGap <= Math.max(20, block.fontSize * 1.85);
      if (!isParagraphLeading) continue;

      // Both lines must belong to continuous body text (not short labels ending in colon or dates)
      const isColonLabel = /:\s*$/.test(block.text.trim()) || /:\s*$/.test(line.text.trim());
      const isPreservedData = shouldPreserveAsIs(block.text) || shouldPreserveAsIs(line.text);
      if (isColonLabel || isPreservedData) continue;

      // Horizontal alignment: matching left alignment or hanging indent for bullet continuations
      const isLeftAligned = Math.abs(line.x - block.x) <= Math.max(8, block.fontSize * 0.6);
      const isHangingIndent = isBlockBullet && line.x >= block.x && line.x - block.x <= 36;

      if (isLeftAligned || isHangingIndent) {
        block.text += '\n' + line.text;
        block.x = Math.min(block.x, line.x);
        block.top = Math.min(Number.isFinite(block.top) ? block.top : block.y, line.top);
        block.y = block.top;
        block.lastBaseline = line.baseline;
        block.right = Math.max(block.right, line.right);
        block.bottom = Math.max(block.bottom, line.bottom);
        block.width = Math.max(20, block.right - block.x);
        block.height = Math.max(14, block.bottom - block.top);
        block.linesCount = (block.linesCount || 1) + 1;
        block.originalLines.push({
          x: line.x,
          top: line.top,
          right: line.right,
          bottom: line.bottom,
          baseline: line.baseline,
          width: Math.max(1, line.right - line.x),
          height: Math.max(1, line.bottom - line.top),
        });
        attached = true;
        break;
      }
    }
    if (!attached) {
      blocks.push({
        id: `b_${blocks.length + 1}`,
        x: line.x,
        y: line.top,
        top: line.top,
        baseline: line.baseline,
        lastBaseline: line.baseline,
        linesCount: 1,
        right: line.right,
        bottom: line.bottom,
        width: Math.max(20, line.right - line.x),
        height: Math.max(14, line.bottom - line.top),
        fontSize: line.fontSize,
        fontName: line.fontName || '',
        originalLines: [{
          x: line.x,
          top: line.top,
          right: line.right,
          bottom: line.bottom,
          baseline: line.baseline,
          width: Math.max(1, line.right - line.x),
          height: Math.max(1, line.bottom - line.top),
        }],
        text: line.text,
        translatedText: '',
      });
    }
  }

  const pageWidth = viewport?.width || 612;

  // Detect alignment (left, center, right) and true available horizontal space (maxWidth)
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const center = (block.x + block.right) / 2;
    const pageMargin = Math.max(24, pageWidth * 0.06);
    const hasBalancedSideSpace = block.x > pageMargin * 1.45 && block.right < pageWidth - pageMargin * 1.45;
    const sideSpaceDifference = Math.abs(block.x - (pageWidth - block.right));
    const isTrulyPageCentered = sideSpaceDifference <= Math.max(14, pageWidth * 0.025);
    if (hasBalancedSideSpace && isTrulyPageCentered) {
      block.align = 'center';
    } else if (block.right >= pageWidth - 72 && block.x > pageWidth * 0.45) {
      block.align = 'right';
    } else {
      block.align = 'left';
    }

    // Helper: is 'other' on the same horizontal band?
    const onSameBand = (other) => {
      const baselineDiff = Math.abs((block.baseline || block.top) - (other.baseline || other.top));
      const maxFs = Math.max(block.fontSize || 12, other.fontSize || 12);
      if (baselineDiff <= maxFs * 1.2) return true;
      const vertOverlap = Math.min(block.bottom, other.bottom) - Math.max(block.top, other.top);
      return vertOverlap > -2;
    };

    if (block.align === 'center') {
      let maxRadius = Math.min(center - 36, pageWidth - 36 - center);
      for (let j = 0; j < blocks.length; j++) {
        if (i === j) continue;
        const other = blocks[j];
        if (onSameBand(other)) {
          if (other.right < center) {
            maxRadius = Math.min(maxRadius, center - other.right - 8);
          } else if (other.x > center) {
            maxRadius = Math.min(maxRadius, other.x - center - 8);
          }
        }
      }
      block.maxWidth = Math.max(block.width, Math.max(20, maxRadius * 2));
    } else if (block.align === 'right') {
      let prevLeft = 36;
      for (let j = 0; j < blocks.length; j++) {
        if (i === j) continue;
        const other = blocks[j];
        if (onSameBand(other)) {
          if (other.right < block.x + 2 && other.right > prevLeft) {
            prevLeft = other.right + 8;
          }
        }
      }
      block.maxWidth = Math.max(block.width, block.right - prevLeft);
    } else {
      let nextRight = pageWidth - 36;
      for (let j = 0; j < blocks.length; j++) {
        if (i === j) continue;
        const other = blocks[j];
        if (onSameBand(other)) {
          if (other.x > block.right - 2 && other.x < nextRight) {
            nextRight = other.x - 8;
          }
        }
      }
      block.maxWidth = Math.max(block.width, nextRight - block.x);
    }

    // Give translated paragraphs the free vertical room before the next item in
    // the same column. Translations commonly need more lines than the source.
    let nextTop = (viewport?.height || 792) - pageMargin;
    for (let j = 0; j < blocks.length; j++) {
      if (i === j) continue;
      const other = blocks[j];
      if (other.top <= block.bottom + 2) continue;
      const overlap = Math.min(block.x + block.maxWidth, other.right) - Math.max(block.x, other.x);
      const sameColumn = overlap > Math.min(block.width, other.width) * 0.2
        || Math.abs(other.x - block.x) <= Math.max(10, block.fontSize);
      if (sameColumn) nextTop = Math.min(nextTop, other.top - 3);
    }
    block.maxHeight = Math.max(block.height, nextTop - block.top);
  }

  return blocks;
}

/**
 * Checks whether text should be preserved verbatim (e.g. emails, phone numbers,
 * dates, scores, or recognized technical keywords like Python, Flask, MySQL, CSS).
 */
export function shouldPreserveAsIs(text) {
  if (!text) return true;
  const clean = text.trim();
  const withoutBullet = clean.replace(/^[•▪▫–\-*◦✓○●›»■◆]\s*/, '').trim();

  // Email address
  if (/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(clean) || /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(withoutBullet)) {
    return true;
  }
  // Phone numbers, numeric scores, dates, or pure symbol/number combinations
  if (/^[\d\s+\-.,/():|%–—]+$/.test(clean) || /^\d{4}\s*[-–—]\s*\d{4}$/.test(clean)) {
    return true;
  }
  // Preserved programming languages and technical terms
  const techTerms = new Set([
    'python', 'flask', 'mysql', 'sql', 'html', 'css', 'javascript', 'js',
    'b.voc', 'bvoc', 'it', 'php', 'java', 'c++', 'c#', 'react', 'node', 'nodejs',
    'express', 'mongodb', 'git', 'github', 'linux', 'aws', 'docker', 'api', 'rest',
    'vue', 'vuejs', 'angular', 'django', 'jquery', 'bootstrap', 'tailwind', 'sass',
    'json', 'xml', 'ajax', 'sqlite', 'postgresql', 'typescript', 'ts'
  ]);
  if (techTerms.has(withoutBullet.toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Translates full document text or page list with block-level position mapping.
 */
export async function translateDocumentPages(pages, sourceLang = 'auto', targetLang = 'en', onProgress = () => {}, options = {}) {
  if (!pages?.length) return [];
  const total = pages.length;
  const translatedPages = [];

  for (let i = 0; i < total; i++) {
    const page = pages[i];
    onProgress(`Translating page ${i + 1} of ${total} to ${getLanguageInfo(targetLang).name}…`, i + 1, total);

    const blocks = page.blocks && page.blocks.length ? page.blocks : [];

    if (!blocks.length) {
      const chunks = chunkTextForTranslation(page.text || '');
      if (!chunks.length) {
        translatedPages.push({
          ...page,
          translatedText: '',
          translatedWordCount: 0,
        });
        continue;
      }

      const translatedChunks = [];
      for (let c = 0; c < chunks.length; c++) {
        const chunk = chunks[c];
        const translated = await translateTextChunk(chunk, sourceLang, targetLang, options);
        translatedChunks.push(translated);
      }

      const fullTranslatedText = translatedChunks.join('\n\n');
      translatedPages.push({
        ...page,
        translatedText: fullTranslatedText,
        translatedWordCount: countWords(fullTranslatedText),
      });
      continue;
    }

    // Identify blocks that should be preserved verbatim (tech keywords, emails, phone numbers, dates)
    const blocksToTranslate = [];
    for (const block of blocks) {
      if (shouldPreserveAsIs(block.text)) {
        block.translatedText = block.text;
      } else {
        blocksToTranslate.push(block);
      }
    }

    if (blocksToTranslate.length) {
      // Batch translate only blocks that actually need translation using indexed markers
      let currentBatch = [];
      let currentBatchLen = 0;
      const batches = [];

      for (const block of blocksToTranslate) {
        const blockLen = (block.text || '').length + 15;
        if (currentBatch.length && currentBatchLen + blockLen > 1400) {
          batches.push(currentBatch);
          currentBatch = [block];
          currentBatchLen = blockLen;
        } else {
          currentBatch.push(block);
          currentBatchLen += blockLen;
        }
      }
      if (currentBatch.length) batches.push(currentBatch);

      for (const batch of batches) {
        const texts = batch.map(b => b.text);
        const translatedTexts = await translateBatch(texts, sourceLang, targetLang, options);
        batch.forEach((b, idx) => {
          b.translatedText = (translatedTexts[idx] || '').trim() || b.text;
        });
      }
    }

    const fullTranslatedText = blocks.map(b => b.translatedText || b.text).join('\n\n');

    translatedPages.push({
      ...page,
      blocks,
      translatedText: fullTranslatedText,
      translatedWordCount: countWords(fullTranslatedText),
    });
  }

  return translatedPages;
}

/**
 * Generates an output filename for the translated file.
 */
export function translatedOutputFilename(originalName, targetLang, format = 'txt') {
  const baseName = (originalName || 'document')
    .replace(/\.pdf$/i, '')
    .replace(/[^\w.-]/g, '_');
  const langCode = (targetLang || 'translated').toLowerCase();
  const ext = format.toLowerCase().replace(/^\./, '');
  return `${baseName}_translated_${langCode}.${ext}`;
}

/**
 * Creates a Microsoft Word (.docx) document containing translated content,
 * faithfully preserving the original PDF page geometry, coordinates, and typography (just like PDF to Word).
 */
export async function createTranslatedDocx(pages, { sourceLang = 'auto', targetLang = 'en', originalName = 'document.pdf' } = {}) {
  const word = await import('docx');
  const twips = value => Math.round(value * 20);
  const srcInfo = getLanguageInfo(sourceLang);
  const tgtInfo = getLanguageInfo(targetLang);

  const sections = [];
  const hasBlocks = pages.some(p => p.blocks && p.blocks.length > 0);

  if (hasBlocks) {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const width = page.pageWidth || 612;
      const height = page.pageHeight || 792;
      const blocks = page.blocks && page.blocks.length ? page.blocks : [];
      const paragraphs = [];

      if (blocks.length > 0) {
        for (const block of blocks) {
          const text = (block.translatedText || block.text || '').trim();
          if (!text) continue;

          const isIndic = /[\u0900-\u0D7F]/u.test(text);
          const hasArabic = /[\u0600-\u06FF\u0750-\u077F]/u.test(text);
          const isComplex = isIndic || hasArabic;
          const fontDef = isIndic
            ? { name: 'Nirmala UI', cs: 'Nirmala UI', ascii: 'Nirmala UI', hAnsi: 'Nirmala UI' }
            : hasArabic
            ? { name: 'Traditional Arabic', cs: 'Traditional Arabic', ascii: 'Arial', hAnsi: 'Arial' }
            : { name: 'Arial', cs: 'Arial', ascii: 'Arial', hAnsi: 'Arial' };

          const fontSize = Math.max(8, Math.min(72, block.fontSize || 12));
          const x = Math.max(0, Number.isFinite(block.x) ? block.x : 36);
          const baseline = Number.isFinite(block.baseline)
            ? block.baseline
            : ((Number.isFinite(block.y) ? block.y : 36) + fontSize * 0.85);
          const top = Math.max(0, baseline - fontSize * (isComplex ? 1.2 : 0.92));
          const availableWidth = Math.max(20, width - x);
          const extraPadding = isComplex ? Math.max(28, fontSize * 2.2) : Math.max(20, fontSize * 1.5);
          const blockW = Number.isFinite(block.width) && block.width > 0 ? block.width : 100;
          const frameWidth = twips(Math.max(10, Math.min(availableWidth, blockW + extraPadding)));

          const isBold = /bold|black|heavy|semibold/i.test(block.fontName || '');
          const isItalic = /italic|oblique/i.test(block.fontName || '');

          paragraphs.push(
            new word.Paragraph({
              run: {
                font: fontDef,
                size: fontSize * 2,
                sizeComplexScript: fontSize * 2,
                color: '000000',
              },
              frame: {
                type: 'absolute',
                position: { x: twips(x), y: twips(top) },
                width: frameWidth,
                anchor: { horizontal: word.FrameAnchorType.PAGE, vertical: word.FrameAnchorType.PAGE },
                wrap: word.FrameWrap.NONE,
                space: { horizontal: 0, vertical: 0 },
              },
              spacing: {
                before: 0,
                after: 0,
                line: twips(fontSize * (isComplex ? 1.45 : 1.15)),
                lineRule: isComplex ? word.LineRuleType.AT_LEAST : word.LineRuleType.EXACT,
              },
              bidirectional: block.dir === 'rtl' || hasArabic,
              children: [
                new word.TextRun({
                  text,
                  color: '000000',
                  size: fontSize * 2,
                  sizeComplexScript: fontSize * 2,
                  font: fontDef,
                  bold: isBold,
                  italics: isItalic,
                  rightToLeft: block.dir === 'rtl' || hasArabic,
                }),
              ],
            })
          );
        }
      } else {
        // Fallback for page with no blocks
        const pageText = page.translatedText || page.text || '';
        const lines = pageText.split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
          paragraphs.push(
            new word.Paragraph({
              spacing: { before: 40, after: 80 },
              children: [
                new word.TextRun({
                  text: line,
                  size: 22,
                  sizeComplexScript: 22,
                  font: /[\u0900-\u0D7F]/u.test(line) ? 'Nirmala UI' : 'Arial',
                }),
              ],
            })
          );
        }
      }

      sections.push({
        properties: {
          type: word.SectionType.NEXT_PAGE,
          page: {
            size: {
              width: twips(Math.min(width, height)),
              height: twips(Math.max(width, height)),
              orientation: width > height ? word.PageOrientation.LANDSCAPE : word.PageOrientation.PORTRAIT,
            },
            margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0 },
          },
        },
        children: paragraphs,
      });
    }
  } else {
    // Flow mode (clean sequential paragraphs for tests or pure text docs)
    const children = [];
    children.push(
      new word.Paragraph({
        heading: word.HeadingLevel.HEADING_1,
        spacing: { before: 0, after: 120 },
        children: [
          new word.TextRun({
            text: `Translated Document — ${tgtInfo.name} (${tgtInfo.native})`,
            bold: true,
            size: 32,
            sizeComplexScript: 32,
            font: /[\u0900-\u0D7F]/u.test(tgtInfo.native) ? 'Nirmala UI' : 'Arial',
            color: '4F46E5',
          }),
        ],
      })
    );

    children.push(
      new word.Paragraph({
        spacing: { before: 0, after: 240 },
        children: [
          new word.TextRun({
            text: `Original: ${originalName} | Language: ${srcInfo.name} → ${tgtInfo.name} | Generated by We Make PDF`,
            size: 18,
            color: '64748B',
            italics: true,
          }),
        ],
      })
    );

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (pages.length > 1) {
        children.push(
          new word.Paragraph({
            heading: word.HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            children: [
              new word.TextRun({
                text: `Page ${page.pageNumber || i + 1}`,
                bold: true,
                size: 24,
                color: '1E293B',
              }),
            ],
          })
        );
      }

      const lines = (page.translatedText || page.text || '').split(/\r?\n/);
      for (const line of lines) {
        if (!line.trim()) {
          children.push(new word.Paragraph({ spacing: { before: 60, after: 60 } }));
        } else {
          const isIndic = /[\u0900-\u0D7F]/u.test(line);
          children.push(
            new word.Paragraph({
              spacing: { before: 40, after: 100 },
              children: [
                new word.TextRun({
                  text: line,
                  size: 22,
                  sizeComplexScript: 22,
                  font: isIndic ? 'Nirmala UI' : 'Arial',
                }),
              ],
            })
          );
        }
      }
    }

    sections.push({ children });
  }

  const doc = new word.Document({
    creator: 'We Make PDF Language Translator',
    title: `Translated - ${originalName}`,
    description: `Translated from ${srcInfo.name} to ${tgtInfo.name} using We Make PDF`,
    styles: {
      default: {
        document: {
          run: {
            font: { name: 'Arial', cs: 'Nirmala UI', ascii: 'Arial', hAnsi: 'Arial' },
            size: 22,
            sizeComplexScript: 22,
          },
          paragraph: { spacing: { before: 0, after: 0 } },
        },
      },
    },
    sections,
  });

  return await word.Packer.toBlob(doc);
}

/**
 * Creates a plain text (.txt) file blob containing translated text.
 */
export function createTranslatedTxtBlob(pages, { sourceLang = 'auto', targetLang = 'en', originalName = 'document.pdf' } = {}) {
  const srcInfo = getLanguageInfo(sourceLang);
  const tgtInfo = getLanguageInfo(targetLang);

  let output = `=======================================================\n`;
  output += `TRANSLATED DOCUMENT (${tgtInfo.name} / ${tgtInfo.native})\n`;
  output += `Original: ${originalName}\n`;
  output += `Language: ${srcInfo.name} -> ${tgtInfo.name}\n`;
  output += `Processed by We Make PDF PDF Language Translator\n`;
  output += `=======================================================\n\n`;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (pages.length > 1) {
      output += `--- Page ${page.pageNumber || i + 1} ---\n\n`;
    }
    output += (page.translatedText || page.text || '') + '\n\n';
  }

  return new Blob([output], { type: 'text/plain;charset=utf-8' });
}

/**
 * Helper to render wrapped text inside a bounding box on Canvas with zero overflow.
 * Adapts font size dynamically so text fits both horizontally and vertically.
 * Uses font alphabetic baseline for pixel-perfect vertical alignment with original PDF elements.
 */
export function drawBlockTextInBox(ctx, text, x, y, width, height, baseFontSize, baseline, align = 'left', maxWidth = width, maxLines = 1, fontName = '') {
  if (!text || !text.trim()) return;
  const fontStack = 'system-ui, "Nirmala UI", "Shruti", "Gujarati Sangam MN", "Kohinoor Gujarati", "Noto Sans Gujarati", "Noto Sans Devanagari", "Segoe UI", Roboto, Arial, sans-serif';
  const safeBaseFs = Number.isFinite(baseFontSize) && baseFontSize > 0 ? baseFontSize : 12;
  const minFontSize = Math.max(7, Math.round(safeBaseFs * 0.58));
  const fontWeight = /bold|black|heavy|semibold|demi/i.test(fontName) ? 700 : /light|thin/i.test(fontName) ? 400 : 500;
  const fontStyle = /italic|oblique/i.test(fontName) ? 'italic ' : '';
  const setFont = (size) => { ctx.font = `${fontStyle}${fontWeight} ${size}px ${fontStack}`; };

  const safeWidth = Number.isFinite(maxWidth) && maxWidth > 0 ? maxWidth : (Number.isFinite(width) && width > 0 ? width : 120);
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 24;
  const drawBaseline = Number.isFinite(baseline) ? baseline : y + Math.round(safeBaseFs * 0.85);

  ctx.textBaseline = 'alphabetic';

  // Case 1: Single-line item (headings, contact info, skills, education fields, dates, short labels)
  // Keeps items strictly on their original baseline without wrapping onto other fields
  if (maxLines <= 1) {
    const cleanText = text.replace(/[\r\n]+/g, ' ').trim();
    let fs = safeBaseFs;
    setFont(fs);
    let m = ctx.measureText(cleanText);
    if (m.width > safeWidth) {
      fs = Math.max(minFontSize, Math.floor(fs * (safeWidth / m.width)));
      setFont(fs);
    }

    ctx.save();
    let drawX = x;
    let clipX = x - 2;
    const clipW = safeWidth + 4;
    const clipH = Math.round(fs * 1.55);
    const clipY = drawBaseline - Math.round(fs * 1.15);

    if (align === 'center') {
      ctx.textAlign = 'center';
      drawX = x + width / 2;
      clipX = drawX - safeWidth / 2 - 2;
    } else if (align === 'right') {
      ctx.textAlign = 'right';
      drawX = x + width;
      clipX = drawX - safeWidth - 2;
    } else {
      ctx.textAlign = 'left';
      drawX = x;
      clipX = x - 2;
    }

    ctx.beginPath();
    ctx.rect(clipX, clipY, clipW, clipH);
    ctx.clip();
    ctx.fillText(cleanText, drawX, drawBaseline);
    ctx.restore();
    return;
  }

  // Case 2: Multi-line paragraph or bullet block
  const wrapText = (fs) => {
    setFont(fs);
    const lineHeight = Math.max(12, Math.round(fs * 1.35));
    const lines = [];
    const paragraphs = text.split(/\r?\n/).filter(p => p.trim());

    for (const para of paragraphs) {
      const words = para.split(/\s+/);
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
        const metrics = ctx.measureText(testLine);

        if (metrics.width > safeWidth && currentLine) {
          lines.push(currentLine);
          currentLine = words[i];
          // Break a single unspaced word only when it cannot fit even by itself.
          if (ctx.measureText(currentLine).width > safeWidth) {
            let segment = '';
            for (const character of Array.from(currentLine)) {
              const candidate = segment + character;
              if (segment && ctx.measureText(candidate).width > safeWidth) {
                lines.push(segment);
                segment = character;
              } else segment = candidate;
            }
            currentLine = segment;
          }
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    }

    const totalHeight = Math.max(lineHeight, lines.length * lineHeight);
    return { lines, lineHeight, totalHeight };
  };

  let currentFontSize = safeBaseFs;
  let layout = wrapText(currentFontSize);
  let allowedLines = Math.max(maxLines, Math.floor((safeHeight + safeBaseFs * 0.25) / layout.lineHeight));

  // Step down font size if line count or height exceeds bounding box
  while ((layout.lines.length > allowedLines || layout.totalHeight > safeHeight * 1.2) && currentFontSize > minFontSize) {
    currentFontSize = Math.max(minFontSize, currentFontSize - 1);
    layout = wrapText(currentFontSize);
    allowedLines = Math.max(maxLines, Math.floor((safeHeight + currentFontSize * 0.25) / layout.lineHeight));
  }

  // Draw lines with strict bounding clip
  ctx.save();
  let drawX = x;
  let clipX = x - 2;
  const clipW = safeWidth + 4;
  const clipH = safeHeight + Math.round(currentFontSize * 0.55);
  const clipY = drawBaseline - Math.round(currentFontSize * 1.15);

  if (align === 'center') {
    ctx.textAlign = 'center';
    drawX = x + width / 2;
    clipX = drawX - safeWidth / 2 - 2;
  } else if (align === 'right') {
    ctx.textAlign = 'right';
    drawX = x + width;
    clipX = drawX - safeWidth - 2;
  } else {
    ctx.textAlign = 'left';
    drawX = x;
    clipX = x - 2;
  }

  ctx.beginPath();
  ctx.rect(clipX, clipY, clipW, clipH);
  ctx.clip();

  let curY = drawBaseline;
  const linesToRender = Math.min(layout.lines.length, allowedLines);
  for (let i = 0; i < linesToRender; i++) {
    ctx.fillText(layout.lines[i], drawX, curY);
    curY += layout.lineHeight;
  }

  ctx.restore();
}

/**
 * Detects the background color and contrasting text color for a block by sampling
 * perimeter pixels outside the text glyph boundaries.
 */
function detectBlockBackgroundAndTextColors(ctx, bx, by, bw, bh, canvasWidth, canvasHeight) {
  const samples = [
    [Math.max(0, bx - 3), Math.min(canvasHeight - 1, Math.max(0, by + Math.round(bh / 2)))], // Left
    [Math.min(canvasWidth - 1, bx + bw + 3), Math.min(canvasHeight - 1, Math.max(0, by + Math.round(bh / 2)))], // Right
    [Math.min(canvasWidth - 1, Math.max(0, bx + Math.round(bw / 2))), Math.max(0, by - 3)], // Top
    [Math.min(canvasWidth - 1, Math.max(0, bx + Math.round(bw / 2))), Math.min(canvasHeight - 1, by + bh + 3)], // Bottom
  ];

  const colors = [];
  for (const [sx, sy] of samples) {
    try {
      const d = ctx.getImageData(sx, sy, 1, 1).data;
      if (d[3] > 180) {
        colors.push([d[0], d[1], d[2]]);
      }
    } catch {}
  }

  if (colors.length) {
    const avgLum = colors.reduce((acc, c) => acc + (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]), 0) / colors.length;
    if (avgLum < 120) {
      // Dark background banner / shape
      const darkColor = colors.find(c => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) < 120) || colors[0];
      return {
        bg: `rgb(${darkColor[0]}, ${darkColor[1]}, ${darkColor[2]})`,
        text: '#ffffff',
      };
    }
    // Light background
    const lightColor = colors.find(c => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) >= 120) || [255, 255, 255];
    return {
      bg: `rgb(${lightColor[0]}, ${lightColor[1]}, ${lightColor[2]})`,
      text: '#0f172a',
    };
  }

  return { bg: '#ffffff', text: '#0f172a' };
}

/**
 * Renders a single page with its original background graphics, layout, borders, and colors,
 * overlaying the translated text in the exact positions of the original text.
 */
export async function renderLayoutPreservedPageToCanvas(pdf, pageNumber, pageData, pdfjs) {
  const page = await pdf.getPage(pageNumber);
  const scale = 2; // 144 DPI for sharp rendering
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 1. Render page graphics, background vectors, images, tables, logos
  await page.render({
    canvasContext: ctx,
    viewport,
    background: '#ffffff',
  }).promise;

  // 2. Erase each original block's text bounding box and draw translated text
  if (pageData.blocks && pageData.blocks.length) {
    for (const block of pageData.blocks) {
      const text = block.translatedText || block.text;
      if (!text || !text.trim()) continue;

      const safeBlockX = Number.isFinite(block.x) ? block.x : 0;
      const safeBlockY = Number.isFinite(block.y) ? block.y : (Number.isFinite(block.top) ? block.top : 0);
      const safeBlockBaseline = Number.isFinite(block.baseline)
        ? block.baseline
        : (safeBlockY + (block.fontSize || 12) * 0.85);
      const safeBlockW = Number.isFinite(block.width) && block.width > 0 ? block.width : 100;
      const safeBlockMaxW = Number.isFinite(block.maxWidth) && block.maxWidth > 0 ? block.maxWidth : safeBlockW;
      const safeBlockH = Number.isFinite(block.height) && block.height > 0 ? block.height : 18;
      const safeBlockMaxH = Number.isFinite(block.maxHeight) && block.maxHeight > 0
        ? Math.max(safeBlockH, block.maxHeight)
        : safeBlockH;

      const bx = Math.round(safeBlockX * scale);
      const by = Math.round(safeBlockY * scale);
      const bBaseline = Math.round(safeBlockBaseline * scale);
      const bw = Math.max(20, Math.round(safeBlockW * scale));
      const bMaxW = Math.max(bw, Math.round(safeBlockMaxW * scale));
      const bh = Math.max(16, Math.round(safeBlockH * scale));
      const bMaxH = Math.max(bh, Math.round(safeBlockMaxH * scale));
      const bfs = Math.max(10, Math.round((block.fontSize || 12) * scale));
      const align = block.align || 'left';
      const linesCount = block.linesCount || (block.text && block.text.includes('\n') ? 2 : 1);

      // Erase every original line separately. A single large paragraph rectangle
      // can remove nearby rules, icons and column decorations from the PDF.
      const eraseLines = block.originalLines?.length ? block.originalLines : [{
        x: safeBlockX,
        top: safeBlockY,
        width: safeBlockW,
        height: safeBlockH,
      }];
      let textColor = '#0f172a';
      eraseLines.forEach((line, index) => {
        const lineX = Math.round((Number.isFinite(line.x) ? line.x : safeBlockX) * scale);
        const lineY = Math.round((Number.isFinite(line.top) ? line.top : safeBlockY) * scale);
        const lineW = Math.max(2, Math.round((Number.isFinite(line.width) ? line.width : safeBlockW) * scale));
        const lineH = Math.max(2, Math.round((Number.isFinite(line.height) ? line.height : safeBlockH) * scale));
        const colors = detectBlockBackgroundAndTextColors(ctx, lineX, lineY, lineW, lineH, canvas.width, canvas.height);
        if (index === 0) textColor = colors.text;
        ctx.fillStyle = colors.bg;
        const wipePadX = Math.max(2, Math.round(scale * 1.5));
        const wipePadY = Math.max(2, Math.round(scale * 1.25));
        const wipeX = Math.max(0, lineX - wipePadX);
        const wipeY = Math.max(0, lineY - wipePadY);
        const wipeW = Math.min(canvas.width - wipeX, lineW + wipePadX * 2);
        const wipeH = Math.min(canvas.height - wipeY, lineH + wipePadY * 2);
        ctx.fillRect(wipeX, wipeY, wipeW, wipeH);
      });

      // Render translated text in position
      ctx.fillStyle = textColor;
      drawBlockTextInBox(ctx, text, bx, by, bw, bMaxH, bfs, bBaseline, align, bMaxW, linesCount, block.fontName || '');
    }
  }

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.95);
  });
}

/**
 * Fallback canvas renderer for plain text rendering when original PDF buffer is unavailable.
 */
export async function renderTextToCanvasBlob(text, { title = 'Translated Page', pageNumber = 1, totalPages = 1 } = {}) {
  const width = 1240;
  const height = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#4f46e5';
  ctx.fillRect(0, 0, width, 12);

  ctx.fillStyle = '#64748b';
  ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Gujarati", "Noto Sans Devanagari", sans-serif';
  ctx.fillText(`We Make PDF Translator  ·  ${title}`, 60, 50);

  ctx.textAlign = 'right';
  ctx.fillText(`Page ${pageNumber} of ${totalPages}`, width - 60, 50);
  ctx.textAlign = 'left';

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 65);
  ctx.lineTo(width - 60, 65);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  const fontSize = 18;
  const lineHeight = 30;
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Gujarati", "Noto Sans Devanagari", sans-serif`;

  const maxWidth = width - 120;
  let curY = 110;
  const maxY = height - 70;

  const paragraphs = (text || '').split(/\r?\n/);
  for (const para of paragraphs) {
    if (!para.trim()) {
      curY += lineHeight * 0.7;
      continue;
    }
    const words = para.split(/\s+/);
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line ? line + ' ' + words[n] : words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, 60, curY);
        line = words[n];
        curY += lineHeight;
        if (curY > maxY) break;
      } else {
        line = testLine;
      }
    }
    if (line && curY <= maxY) {
      ctx.fillText(line, 60, curY);
      curY += lineHeight * 1.2;
    }
    if (curY > maxY) break;
  }

  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(60, height - 45);
  ctx.lineTo(width - 60, height - 45);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px sans-serif';
  ctx.fillText('Translated locally with We Make PDF  ·  100% In-Browser Privacy', 60, height - 25);

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92);
  });
}

/**
 * Creates a translated PDF document preserving the original page layout, background graphics,
 * dimensions, and text positioning.
 */
export async function createTranslatedPdf(pages, { sourceLang = 'auto', targetLang = 'en', originalName = 'document.pdf', pdfBytes, file, watermark, onProgress = () => {} } = {}) {
  const { PDFDocument } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();

  async function finalizePdf(doc) {
    const savedBytes = await doc.save();
    if (watermark && watermark.enabled && watermark.text && watermark.text.trim()) {
      return await applyWatermarkToPdf(savedBytes, watermark, { onProgress });
    }
    return new Blob([savedBytes], { type: 'application/pdf' });
  }

  // If pdfBytes or file is provided and we are in a browser environment with document canvas:
  if (typeof document !== 'undefined' && (pdfBytes || file)) {
    try {
      const [pdfjs, { default: workerUrl }] = await Promise.all([
        import('pdfjs-dist/build/pdf.mjs'),
        import('pdfjs-dist/build/pdf.worker.mjs?url'),
      ]);
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

      let data = null;
      if (file && typeof file.arrayBuffer === 'function') {
        data = new Uint8Array(await file.arrayBuffer());
      } else if (pdfBytes && pdfBytes.byteLength > 0) {
        data = pdfBytes.slice();
      }

      if (!data || data.byteLength === 0) {
        throw new Error('Original PDF document data is unavailable.');
      }

      const sourcePdf = await pdfjs.getDocument({
        data: data.slice(),
        isEvalSupported: false,
        stopAtErrors: true,
        verbosity: 0,
      }).promise;

      const total = Math.min(pages.length, sourcePdf.numPages);

      for (let i = 1; i <= total; i++) {
        onProgress(`Rendering page ${i} of ${total} with original layout…`, i, total);
        const pageData = pages[i - 1];

        let embeddedImg;
        try {
          const imgBlob = await renderLayoutPreservedPageToCanvas(sourcePdf, i, pageData, pdfjs);
          const imgBytes = new Uint8Array(await imgBlob.arrayBuffer());
          embeddedImg = await pdfDoc.embedJpg(imgBytes);
        } catch (pageErr) {
          console.warn(`Page ${i} layout render error, falling back to clean text canvas:`, pageErr);
          const imgBlob = await renderTextToCanvasBlob(pageData.translatedText || pageData.text || '', {
            title: `${originalName} (${getLanguageInfo(targetLang).name})`,
            pageNumber: i,
            totalPages: total,
          });
          const imgBytes = new Uint8Array(await imgBlob.arrayBuffer());
          embeddedImg = await pdfDoc.embedJpg(imgBytes);
        }

        const pageWidth = pageData.pageWidth || 595.28;
        const pageHeight = pageData.pageHeight || 841.89;

        const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);
        pdfPage.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      }

      return await finalizePdf(pdfDoc);
    } catch (err) {
      console.warn('Layout-preserved PDF generation failed, falling back to clean text canvas:', err);
    }
  }

  // Fallback for non-DOM environments (Node.js test runners where document is not defined)
  if (typeof document === 'undefined') {
    const total = pages.length;
    for (let i = 0; i < total; i++) {
      const page = pages[i];
      const width = page.pageWidth || 595.28;
      const height = page.pageHeight || 841.89;
      pdfDoc.addPage([width, height]);
    }
    return await finalizePdf(pdfDoc);
  }

  // Fallback for browser canvas when original PDF buffer is unavailable
  const total = pages.length;
  for (let i = 0; i < total; i++) {
    const page = pages[i];
    const imgBlob = await renderTextToCanvasBlob(page.translatedText || page.text || '', {
      title: `${originalName} (${getLanguageInfo(targetLang).name})`,
      pageNumber: i + 1,
      totalPages: total,
    });
    const imgBytes = new Uint8Array(await imgBlob.arrayBuffer());
    const embeddedImg = await pdfDoc.embedJpg(imgBytes);

    const pdfPage = pdfDoc.addPage([595.28, 841.89]);
    pdfPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: 595.28,
      height: 841.89,
    });
  }

  return await finalizePdf(pdfDoc);
}

/**
 * Extracts digital text and position-aware layout blocks from a PDF file page by page using PDF.js.
 */
export async function extractTextFromPdf(file, { onProgress = () => {}, signal } = {}) {
  const check = () => {
    if (signal?.aborted) throw new DOMException('Text extraction cancelled.', 'AbortError');
  };
  check();

  onProgress('Loading PDF document…');
  const [pdfjs, { default: workerUrl }] = await Promise.all([
    import('pdfjs-dist/build/pdf.mjs'),
    import('pdfjs-dist/build/pdf.worker.mjs?url'),
  ]);
  check();
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const pdfBytes = new Uint8Array(arrayBuffer);
  check();

  const loading = pdfjs.getDocument({
    data: pdfBytes.slice(),
    isEvalSupported: false,
    stopAtErrors: true,
    verbosity: 0,
  });

  const pdf = await loading.promise;
  check();

  const totalPages = pdf.numPages;
  const pages = [];
  let totalWordCount = 0;

  for (let num = 1; num <= totalPages; num++) {
    check();
    onProgress(`Extracting text and page layout from page ${num} of ${totalPages}…`);
    const page = await pdf.getPage(num);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    let blocks = extractPageLayoutBlocks(textContent, viewport, pdfjs);
    let pageText = blocks.length ? blocks.map(b => b.text).join('\n\n') : formatPdfTextContent(textContent);
    let words = countWords(pageText);

    // OCR fallback for scanned or non-Unicode Indian PDFs with 0 digital text
    if (words === 0 && typeof document !== 'undefined') {
      try {
        const { createPdfOcr } = await import('./pdf-ocr.js');
        const config = typeof useRuntimeConfig === 'function' ? useRuntimeConfig() : null;
        const baseURL = config?.app?.baseURL || '/';
        const ocrVer = config?.public?.ocrVersion || 'v1';
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
        const assetBase = new URL(`${baseURL}ocr/${ocrVer}/`, origin).href;
        const ocr = createPdfOcr({
          assetBase,
          language: 'auto',
          signal,
          onProgress: (m) => onProgress(`OCR Page ${num}: ${m}`),
        });

        const scale = 1.5;
        const scaledViewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(scaledViewport.width);
        canvas.height = Math.ceil(scaledViewport.height);
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({
          canvasContext: ctx,
          viewport: scaledViewport,
          background: '#ffffff',
        }).promise;

        const ocrItems = await ocr.recognize(canvas, scale, num, totalPages);
        if (ocrItems?.length) {
          blocks = ocrItems.map((item, idx) => ({
            id: `b_ocr_${idx}`,
            x: item.x,
            y: Math.max(0, item.baseline - (item.fontSize || 12)),
            top: Math.max(0, item.baseline - (item.fontSize || 12)),
            baseline: item.baseline,
            width: item.width || 100,
            height: item.height || 16,
            fontSize: item.fontSize || 12,
            fontName: 'Nirmala UI',
            text: item.str || item.runs?.map(r => r.text).join('') || '',
            translatedText: '',
            originalLines: [{
              x: item.x,
              top: Math.max(0, item.baseline - (item.fontSize || 12)),
              width: item.width || 100,
              height: item.height || 16,
              baseline: item.baseline,
            }],
          }));
          pageText = blocks.map(b => b.text).join('\n\n');
          words = countWords(pageText);
        }
      } catch (ocrErr) {
        console.warn('OCR fallback failed for page ' + num, ocrErr);
      }
    }

    totalWordCount += words;

    pages.push({
      pageNumber: num,
      pageWidth: viewport.width,
      pageHeight: viewport.height,
      blocks,
      text: pageText,
      wordCount: words,
      charCount: pageText.length,
      translatedText: '',
      translatedWordCount: 0,
    });
  }

  return {
    totalPages,
    totalWordCount,
    pages,
    pdfBytes: pdfBytes.slice(),
  };
}
