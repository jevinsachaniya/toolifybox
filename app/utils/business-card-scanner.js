/**
 * Business Card to Excel / Business Card Scanner Utility
 * High-Precision In-Browser Private OCR & Intelligent Contact Extraction
 * Generates OpenXML Excel (.xlsx), RFC 4180 CSV, and vCard (.vcf)
 */
import JSZip from 'jszip';
import { runConversionTask } from './conversion-task.js';
import { resolveOcrLanguage } from './pdf-ocr.js';

export const SUPPORTED_CARD_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff',
];

export const MAX_CARD_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

/**
 * Validates a single business card photo file
 */
export function validateBusinessCardFile(file) {
  if (!file) return 'Please choose an image file.';
  const name = file.name || '';
  const ext = (name.split('.').pop() || '').toLowerCase();
  const validExts = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tif', 'tiff'];

  if (!validExts.includes(ext) && !SUPPORTED_CARD_TYPES.includes(file.type)) {
    return 'Please select a valid image file (JPG, PNG, WebP, or BMP).';
  }
  if (file.size <= 0) return 'The chosen image file is empty.';
  if (file.size > MAX_CARD_FILE_SIZE) return 'Image file exceeds the 30 MB limit.';
  return null;
}

/**
 * Preprocesses a canvas image for maximum OCR sharpness:
 * - Upscales low-res card photos to optimal OCR size (~2000-2400px width)
 * - Auto-detects dark vs light cards and inverts if dark
 * - Expands contrast range (auto-levels) to remove shadows and camera noise
 * - Enhances edges so fine 6pt-9pt fonts become crisp and readable
 */
export function preprocessCardCanvas(sourceCanvas) {
  if (!sourceCanvas || !sourceCanvas.width || !sourceCanvas.height) return sourceCanvas;

  const origW = sourceCanvas.width;
  const origH = sourceCanvas.height;

  // Scale up small images so text is large enough for Tesseract (target 2000-2400px width)
  let scale = 1;
  if (origW < 1600) {
    scale = Math.min(3, 2000 / origW);
  }
  const targetW = Math.max(1, Math.round(origW * scale));
  const targetH = Math.max(1, Math.round(origH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, targetW, targetH);

  try {
    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;
    const totalPixels = targetW * targetH;

    // 1. Measure luminance distribution
    let minLum = 255;
    let maxLum = 0;
    let totalLum = 0;
    const step = 4;

    for (let i = 0; i < data.length; i += 4 * step) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
      totalLum += lum;
    }

    const avgLum = totalLum / (totalPixels / step);
    const isDarkCard = avgLum < 115; // Dark background card with light text

    // Contrast stretching range (with padding to prevent clipping)
    const lumRange = Math.max(40, maxLum - minLum);

    // 2. Grayscale & Dynamic Range Stretching
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      let gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Invert if card is dark so OCR always sees dark text on white
      if (isDarkCard) {
        gray = 255 - gray;
      }

      // Linear stretch
      let stretched = ((gray - minLum) / lumRange) * 255;
      stretched = Math.max(0, Math.min(255, stretched));

      // Sigmoid-like contrast enhancement
      let enhanced = stretched < 128
        ? (stretched * stretched) / 128
        : 255 - ((255 - stretched) * (255 - stretched)) / 128;

      data[i] = enhanced;
      data[i + 1] = enhanced;
      data[i + 2] = enhanced;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  } catch {
    return canvas;
  }
}

/**
 * Common job titles and designations
 */
const TITLE_KEYWORDS = [
  'chief executive officer', 'chief technology officer', 'chief financial officer',
  'chief operating officer', 'chief marketing officer', 'managing director', 'executive director',
  'co-founder', 'founder', 'director', 'president', 'vice president', 'proprietor', 'prop',
  'partner', 'managing partner', 'general manager', 'senior manager', 'project manager',
  'product manager', 'account manager', 'operations manager', 'sales manager', 'marketing manager',
  'branch manager', 'store manager', 'manager', 'assistant manager',
  'senior software engineer', 'software engineer', 'lead engineer', 'principal engineer',
  'frontend engineer', 'backend engineer', 'full stack engineer', 'devops engineer',
  'qa engineer', 'system engineer', 'cloud architect', 'solutions architect', 'data scientist',
  'data analyst', 'ui/ux designer', 'graphic designer', 'creative director', 'art director',
  'consultant', 'senior consultant', 'advisor', 'specialist', 'strategist', 'coordinator',
  'advocate', 'attorney', 'lawyer', 'chartered accountant', 'auditor', 'doctor', 'physician',
  'surgeon', 'cardiologist', 'dentist', 'professor', 'associate professor', 'lecturer',
  'researcher', 'scientist', 'representative', 'sales executive', 'executive', 'officer',
  'associate', 'analyst', 'intern', 'assistant', 'in-charge', 'team lead', 'supervisor',
  'ceo', 'cto', 'cfo', 'coo', 'cmo', 'md', 'vp', 'gm', 'ca', 'cs', 'adv',
];

/**
 * Common corporate indicators & suffixes
 */
const COMPANY_SUFFIXES = [
  'pvt ltd', 'private limited', 'pvt. ltd.', 'ltd.', 'ltd', 'limited', 'inc.', 'inc',
  'llc', 'llp', 'corp.', 'corp', 'corporation', 'co.', 'company', 'enterprises',
  'technologies', 'infotech', 'tech', 'solutions', 'services', 'systems', 'consulting',
  'associates', 'industries', 'group', 'studio', 'ventures', 'labs', 'holdings',
  'foundation', 'international', 'global', 'agency', 'works', 'logistics', 'traders',
  'agencies', 'hospital', 'clinic', 'care', 'jewellers', 'jewelers', 'builders',
  'developers', 'hardware', 'electricals', 'electronics', 'motors', 'foods', 'pharma',
  'textiles', 'creations', 'enterprises', 'firm',
];

/**
 * Pre-clean OCR typos for emails and web URLs
 */
function cleanOcrTypos(rawText) {
  if (!rawText) return '';
  let text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

  // Fix spaces around @ in email: 'info @ domain . com' -> 'info@domain.com'
  text = text.replace(/([a-zA-Z0-9._%+-]+)\s*[@©]\s*([a-zA-Z0-9.-]+)\s*[,.]\s*([a-zA-Z]{2,})/g, '$1@$2.$3');
  // Fix comma instead of dot in email/domains: 'info@domain,com' -> 'info@domain.com'
  text = text.replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+),([a-zA-Z]{2,})\b/g, '$1.$2');
  // Fix 'www,domain,com' -> 'www.domain.com'
  text = text.replace(/\bwww[,.][a-zA-Z0-9,.-]+/gi, m => m.replace(/,/g, '.'));
  text = text.replace(/\b([a-zA-Z0-9.-]+),(com|in|org|net|io|co|ai|edu|gov|co\.in)\b/gi, '$1.$2');

  return text;
}

/**
 * Extract email addresses from text
 */
export function extractEmails(text) {
  if (!text) return [];
  const cleanedText = cleanOcrTypos(text);
  const regex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const matches = cleanedText.match(regex) || [];
  return Array.from(new Set(matches.map(m => m.trim().toLowerCase())));
}

/**
 * Extract website URLs from text
 */
export function extractWebsites(text, foundEmails = []) {
  if (!text) return [];
  const cleanedText = cleanOcrTypos(text);
  const results = new Set();

  // URL with http/https or www
  const urlRegex = /\b(?:https?:\/\/|www\.)[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/[^\s,;]*)?/gi;
  const urlMatches = cleanedText.match(urlRegex) || [];
  for (const match of urlMatches) {
    results.add(match.trim().replace(/[.,;]+$/, ''));
  }

  // Domain-like patterns (e.g. acme.com, studio.in)
  const domainRegex = /\b[A-Za-z0-9-]+\.(?:com|org|net|io|in|co|ai|co\.in|dev|app|tech|biz|info|me)\b(?:\/[^\s,;]*)?/gi;
  const domainMatches = cleanedText.match(domainRegex) || [];
  for (const match of domainMatches) {
    if (!cleanedText.includes(`@${match}`)) {
      results.add(match.trim().replace(/[.,;]+$/, ''));
    }
  }

  const cleaned = [];
  for (const url of results) {
    if (!foundEmails.some(e => e.includes(url) || url.includes(e))) {
      cleaned.push(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.') ? url : `www.${url}`);
    }
  }

  return cleaned;
}

/**
 * Comprehensive, High-Precision Phone Number Extractor
 * - Splits compound lines (e.g. '98250 12345 / 98250 67890' or 'M: 9810123456, 9810165432')
 * - Reconstructs suffix numbers (e.g. '98250 12345 / 67890' -> '+91 98250 12345' & '+91 98250 67890')
 * - Fixes OCR digit substitutions (O/o -> 0, I/l/| -> 1) on phone lines
 * - Preserves full 10-digit, 11-digit, and international numbers with country code
 * - Filters out dates, years, and 6-digit postal PIN codes
 */
export function extractPhones(text) {
  if (!text) return [];
  const rawList = [];
  const lines = text.split('\n');

  const phoneHintRegex = /(?:tel(?:ephone)?|mob(?:ile)?|cell|phone|ph|whatsapp|call|office|fax|contact|helpline|m[\s.:]|p[\s.:]|c[\s.:])/i;

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    const hasHint = phoneHintRegex.test(line);

    // If line has phone indicators, fix common OCR digit typos in tokens
    if (hasHint) {
      line = line.replace(/[a-zA-Z0-9+()\/|.-]+/g, token => {
        const digitCount = (token.match(/\d/g) || []).length;
        if (digitCount >= 2 && !token.includes('@')) {
          return token
            .replace(/[oO]/g, '0')
            .replace(/[iIl|]/g, '1')
            .replace(/(?<=\d)[sS](?=\d)/g, '5');
        }
        return token;
      });
    }

    // Split line by separators that separate distinct phone numbers: / , | ; or multiple spaces
    const chunks = line.split(/\s*[\/,|;]\s*|\s{3,}/);
    let lastValidFullNumber = '';

    for (let chunk of chunks) {
      chunk = chunk.trim();
      if (!chunk) continue;

      // Remove phone labels from front of chunk
      chunk = chunk.replace(/^(?:tel(?:ephone)?|mob(?:ile)?|cell|phone|ph|whatsapp|call|office|fax|contact|m|p|c)\s*[:.-]?\s*/i, '').trim();

      // Check if chunk is a partial suffix (e.g. '67890' or '57') following a full phone number
      const digitsOnly = chunk.replace(/\D/g, '');
      if (lastValidFullNumber && digitsOnly.length >= 2 && digitsOnly.length <= 6 && !chunk.startsWith('+')) {
        const fullDigits = lastValidFullNumber.replace(/\D/g, '');
        if (fullDigits.length >= 8) {
          const reconstructed = fullDigits.slice(0, fullDigits.length - digitsOnly.length) + digitsOnly;
          if (isValidPhoneNumber(reconstructed)) {
            rawList.push(formatCleanPhone(reconstructed));
            continue;
          }
        }
      }

      // Match phone candidates in this chunk
      const candidates = matchPhonePatterns(chunk);
      for (const cand of candidates) {
        if (isValidPhoneNumber(cand)) {
          const cleaned = formatCleanPhone(cand);
          if (!rawList.includes(cleaned)) {
            rawList.push(cleaned);
            lastValidFullNumber = cleaned;
          }
        }
      }
    }
  }

  // Global pass on the entire text to catch any unlabelled phone numbers
  const globalCandidates = matchPhonePatterns(text);
  for (const cand of globalCandidates) {
    if (isValidPhoneNumber(cand)) {
      const cleaned = formatCleanPhone(cand);
      const candDigits = cleaned.replace(/\D/g, '');
      const alreadyHave = rawList.some(r => {
        const rd = r.replace(/\D/g, '');
        return rd === candDigits || rd.endsWith(candDigits);
      });
      if (!alreadyHave) {
        rawList.push(cleaned);
      }
    }
  }

  // Deduplicate: Keep the longest / most complete format for each number
  return deduplicatePhoneList(rawList);
}

/**
 * Internal helper to match regex phone patterns
 */
function matchPhonePatterns(text) {
  const matches = [];
  // Pattern 1: International format with country code (+91 98250 12345, +1 (415) 555-0192)
  const p1 = /(?:\+|00)\d{1,4}[-.\s]?(?:\(?\d{1,5}\)?[-.\s]?)?\d{2,5}[-.\s]?\d{3,5}(?:[-.\s]?\d{2,4})?/g;
  // Pattern 2: Indian 10-digit mobile (starts with 6, 7, 8, or 9)
  const p2 = /(?:(?:\+?91|0)[-.\s]?)?[6-9]\d{4}[-.\s]?\d{5}\b/g;
  const p2b = /(?:(?:\+?91|0)[-.\s]?)?[6-9]\d{2}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  const p2c = /(?:(?:\+?91|0)[-.\s]?)?[6-9]\d{9}\b/g;
  // Pattern 3: Landlines with STD codes (022-XXXXXXX, (079) XXXXXXXX)
  const p3 = /(?:\(0\d{2,4}\)|0\d{2,4})[-.\s]?\d{6,8}\b/g;
  // Pattern 4: US/North America standard 10-digit
  const p4 = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

  for (const regex of [p1, p2, p2b, p2c, p3, p4]) {
    const found = text.match(regex);
    if (found) {
      for (const f of found) matches.push(f);
    }
  }
  return matches;
}

/**
 * Validates whether candidate string has appropriate phone digit length and is not a date or PIN code
 */
function isValidPhoneNumber(str) {
  if (!str) return false;
  const digits = str.replace(/\D/g, '');
  // Must have between 7 and 15 digits
  if (digits.length < 7 || digits.length > 15) return false;
  // Reject 4-digit years (e.g. 2024, 2025, 1999)
  if (/^(?:19\d{2}|20\d{2})$/.test(digits)) return false;
  // Reject unformatted 6-digit postal PIN codes
  if (/^\d{6}$/.test(str.trim())) return false;
  return true;
}

/**
 * Cleans phone display formatting
 */
function formatCleanPhone(str) {
  let s = str.trim()
    .replace(/^[^\d+]+/, '')
    .replace(/[^\d)]+$/, '')
    .replace(/\s+/g, ' ');

  // Fix unmatched opening or closing parenthesis
  const openCount = (s.match(/\(/g) || []).length;
  const closeCount = (s.match(/\)/g) || []).length;
  if (closeCount > openCount && s.includes(')')) {
    s = s.replace(')', '');
  } else if (openCount > closeCount && s.includes('(')) {
    s = s.replace('(', '');
  }

  return s;
}

/**
 * Deduplicates phone list preserving complete numbers with country code
 */
function deduplicatePhoneList(phones) {
  const result = [];
  for (let i = 0; i < phones.length; i++) {
    const current = phones[i];
    const currentDigits = current.replace(/\D/g, '');

    // Check if there is another phone in the list that is a superset of current (more complete, e.g. with country code)
    const hasBetterSuperset = phones.some(other => {
      const otherDigits = other.replace(/\D/g, '');
      return otherDigits.length > currentDigits.length &&
        (otherDigits.includes(currentDigits) || (currentDigits.length >= 10 && otherDigits.endsWith(currentDigits.slice(-10))));
    });

    if (hasBetterSuperset) continue;

    // Check if we already added an identical number
    const alreadyAdded = result.some(r => r.replace(/\D/g, '') === currentDigits);
    if (!alreadyAdded) {
      result.push(current);
    }
  }

  return result;
}

/**
 * Extract social media profiles
 */
export function extractSocials(text) {
  if (!text) return [];
  const socials = [];
  const patterns = [
    /(?:linkedin\.com\/(?:in|company)\/[A-Za-z0-9_-]+)/i,
    /(?:twitter\.com|x\.com)\/[A-Za-z0-9_]+/i,
    /(?:facebook\.com|fb\.com)\/[A-Za-z0-9_.-]+/i,
    /(?:instagram\.com|instagr\.am)\/[A-Za-z0-9_.-]+/i,
    /(?:github\.com)\/[A-Za-z0-9_-]+/i,
    /@([A-Za-z0-9_]{3,25})\b/g,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const m of matches) {
        if (!socials.includes(m) && !m.includes('@gmail') && !m.includes('@yahoo')) {
          socials.push(m.trim());
        }
      }
    }
  }

  return socials;
}

/**
 * Extract GSTIN, PAN or Tax Registration IDs
 */
export function extractTaxIds(text) {
  if (!text) return { gstin: '', pan: '', taxInfo: '' };
  const gstinRegex = /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/g;
  const panRegex = /\b[A-Z]{5}\d{4}[A-Z]{1}\b/g;

  const gstinMatches = text.match(gstinRegex) || [];
  const panMatches = text.match(panRegex) || [];

  const gstin = gstinMatches[0] || '';
  const pan = panMatches[0] || '';

  const details = [];
  if (gstin) details.push(`GSTIN: ${gstin}`);
  if (pan) details.push(`PAN: ${pan}`);

  return { gstin, pan, taxInfo: details.join('; ') };
}

/**
 * Intelligent parser for full business card text
 */
export function parseBusinessCardText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return createEmptyCardData();
  }

  const clean = cleanOcrTypos(rawText).trim();

  const lines = clean
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // 1. Extract Emails
  const emails = extractEmails(clean);
  const primaryEmail = emails[0] || '';
  const secondaryEmail = emails[1] || '';

  // 2. Extract Websites
  const websites = extractWebsites(clean, emails);
  const website = websites[0] || '';

  // 3. Extract Phones
  const phones = extractPhones(clean);
  const phone = phones[0] || '';
  const phone2 = phones[1] || '';
  const phone3 = phones[2] || '';

  // 4. Extract Tax IDs (GSTIN, PAN)
  const { gstin, pan, taxInfo } = extractTaxIds(clean);

  // 5. Extract Socials
  const socials = extractSocials(clean);
  const social = socials.join(', ');

  // 6. Extract Full Name & Title
  let detectedName = '';
  let nameLineIndex = -1;
  let detectedTitle = '';
  let titleLineIndex = -1;

  // Name check: Honorifics (Dr., Er., Adv., Prof., CA, Mr., Mrs., Shri, etc.)
  const honorificRegex = /^(?:dr\.|dr|mr\.|mr|mrs\.|mrs|ms\.|ms|prof\.|prof|ca\.|ca|cs\.|cs|adv\.|adv|er\.|er|shri|smt)\s+[A-Za-z]/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check if line starts with labeled name: 'Name: Rajesh Sharma'
    const nameLabelMatch = line.match(/^(?:name|contact person)\s*[:.-]\s*(.+)$/i);
    if (nameLabelMatch) {
      detectedName = nameLabelMatch[1].trim();
      nameLineIndex = i;
      break;
    }

    if (honorificRegex.test(line)) {
      detectedName = line;
      nameLineIndex = i;
      break;
    }
  }

  // Title check: Look for title keywords
  for (let i = 0; i < lines.length; i++) {
    if (i === nameLineIndex) continue;
    const line = lines[i];

    // Check if line is combo like 'Proprietor: Ramesh Patel' or 'Director: John Doe'
    const comboMatch = line.match(/^(proprietor|prop|director|managing director|partner|owner|ceo|founder|doctor|dr|president|manager)\s*[:.-]\s*(.+)$/i);
    if (comboMatch) {
      detectedTitle = comboMatch[1].trim();
      titleLineIndex = i;
      if (!detectedName && isValidPersonName(comboMatch[2])) {
        detectedName = comboMatch[2].trim();
        nameLineIndex = i;
      }
      break;
    }

    // Check if line starts with 'Designation:' or 'Title:'
    const titleLabelMatch = line.match(/^(?:title|designation|role)\s*[:.-]\s*(.+)$/i);
    if (titleLabelMatch) {
      detectedTitle = titleLabelMatch[1].trim();
      titleLineIndex = i;
      break;
    }

    for (const kw of TITLE_KEYWORDS) {
      const kwRegex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (kwRegex.test(line)) {
        detectedTitle = line;
        titleLineIndex = i;
        break;
      }
    }
    if (detectedTitle) break;
  }

  // 7. Extract Company Name
  let detectedCompany = '';
  let companyLineIndex = -1;

  // Check lines for corporate suffixes
  for (let i = 0; i < lines.length; i++) {
    if (i === titleLineIndex || i === nameLineIndex) continue;
    const lineLower = lines[i].toLowerCase();
    for (const suffix of COMPANY_SUFFIXES) {
      const suffixRegex = new RegExp(`\\b${suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (suffixRegex.test(lineLower)) {
        detectedCompany = lines[i];
        companyLineIndex = i;
        break;
      }
    }
    if (detectedCompany) break;
  }

  // If no suffix found, match domain brand name from email or website
  if (!detectedCompany && (primaryEmail || website)) {
    const domainCandidate = (primaryEmail.split('@')[1] || website.replace(/^https?:\/\//, '').replace(/^www\./, ''))
      .split('.')[0]
      .toLowerCase();

    if (domainCandidate && domainCandidate.length >= 3 && !['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud', 'rediffmail'].includes(domainCandidate)) {
      for (let i = 0; i < lines.length; i++) {
        if (i === titleLineIndex || i === nameLineIndex) continue;
        if (lines[i].toLowerCase().includes(domainCandidate)) {
          detectedCompany = lines[i];
          companyLineIndex = i;
          break;
        }
      }
    }
  }

  // If still no company found, pick top line if it's not the person name
  if (!detectedCompany) {
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      if (i !== nameLineIndex && i !== titleLineIndex && !lines[i].includes('@') && !phones.some(p => lines[i].includes(p))) {
        detectedCompany = lines[i];
        companyLineIndex = i;
        break;
      }
    }
  }

  // 8. If Name was not found via honorific, find it now
  if (!detectedName && titleLineIndex > 0) {
    // If title was found, name is often the line immediately above it
    const candidate = lines[titleLineIndex - 1];
    if (isValidPersonName(candidate) && titleLineIndex - 1 !== companyLineIndex) {
      detectedName = candidate;
      nameLineIndex = titleLineIndex - 1;
    }
  }

  if (!detectedName) {
    // Pick first line with 2 to 4 capitalized alphabetic words
    for (let i = 0; i < lines.length; i++) {
      if (i === titleLineIndex || i === companyLineIndex) continue;
      const candidate = lines[i];
      if (isValidPersonName(candidate)) {
        detectedName = candidate;
        nameLineIndex = i;
        break;
      }
    }
  }

  // 9. Extract Address, Postal Code, City, State
  const addressLines = [];
  let detectedPostalCode = '';
  let detectedCity = '';
  let detectedState = '';
  let detectedCountry = '';

  const addressKeywords = [
    'street', 'st.', 'st', 'road', 'rd.', 'rd', 'avenue', 'ave', 'lane', 'ln', 'floor',
    'suite', 'plot', 'sector', 'block', 'bldg', 'building', 'complex', 'tower', 'nagar',
    'marg', 'near', 'opp', 'opposite', 'behind', 'beside', 'gidc', 'midc', 'industrial',
    'estate', 'po box', 'p.o. box', 'shop no', 'office no', 'phase', 'vihar', 'colony'
  ];
  const pinRegex = /\b\d{6}\b|\b\d{5}(?:-\d{4})?\b/;

  for (let i = 0; i < lines.length; i++) {
    if (i === nameLineIndex || i === titleLineIndex || i === companyLineIndex) continue;
    const line = lines[i];
    const lineLower = line.toLowerCase();

    // Skip if line is purely email, website, or phone
    if (emails.some(e => line.includes(e)) || (website && line.includes(website))) continue;
    if (phones.some(p => line.replace(/\D/g, '').length >= 7 && line.includes(p))) continue;

    const hasAddrKw = addressKeywords.some(kw => lineLower.includes(kw));
    const pinMatch = line.match(pinRegex);

    if (pinMatch && !detectedPostalCode) {
      detectedPostalCode = pinMatch[0];
    }

    if (hasAddrKw || pinMatch) {
      addressLines.push(line);
    }
  }

  // Indian States & Union Territories
  const indianStates = [
    'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh', 'delhi',
    'goa', 'gujarat', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka', 'kerala',
    'madhya pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram', 'nagaland',
    'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu', 'telangana', 'tripura',
    'uttar pradesh', 'uttarakhand', 'west bengal'
  ];

  // Major cities detection
  const majorCities = [
    'mumbai', 'delhi', 'new delhi', 'bengaluru', 'bangalore', 'hyderabad', 'ahmedabad',
    'chennai', 'kolkata', 'pune', 'jaipur', 'surat', 'lucknow', 'kanpur', 'nagpur',
    'indore', 'thane', 'bhopal', 'visakhapatnam', 'patna', 'vadodara', 'ghaziabad',
    'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'varanasi', 'srinagar',
    'aurangabad', 'dhanbad', 'amritsar', 'navi mumbai', 'allahabad', 'ranchi', 'howrah',
    'coimbatore', 'jabalpur', 'gwalior', 'vijayawada', 'jodhpur', 'madurai', 'raipur',
    'kota', 'guwahati', 'chandigarh', 'gurugram', 'gurgaon', 'noida', 'kochi', 'dehradun'
  ];

  // City to state mapping for instant intelligent state detection
  const cityStateMap = {
    'ahmedabad': 'Gujarat', 'surat': 'Gujarat', 'vadodara': 'Gujarat', 'rajkot': 'Gujarat', 'gandhinagar': 'Gujarat',
    'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nagpur': 'Maharashtra', 'nashik': 'Maharashtra', 'thane': 'Maharashtra', 'navi mumbai': 'Maharashtra', 'aurangabad': 'Maharashtra',
    'bengaluru': 'Karnataka', 'bangalore': 'Karnataka', 'mysore': 'Karnataka', 'hubballi': 'Karnataka',
    'hyderabad': 'Telangana', 'warangal': 'Telangana',
    'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu', 'madurai': 'Tamil Nadu', 'salem': 'Tamil Nadu',
    'kolkata': 'West Bengal', 'howrah': 'West Bengal',
    'jaipur': 'Rajasthan', 'jodhpur': 'Rajasthan', 'kota': 'Rajasthan', 'udaipur': 'Rajasthan',
    'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh', 'agra': 'Uttar Pradesh', 'varanasi': 'Uttar Pradesh', 'noida': 'Uttar Pradesh', 'ghaziabad': 'Uttar Pradesh', 'meerut': 'Uttar Pradesh',
    'gurugram': 'Haryana', 'gurgaon': 'Haryana', 'faridabad': 'Haryana', 'panipat': 'Haryana',
    'delhi': 'Delhi', 'new delhi': 'Delhi', 'chandigarh': 'Chandigarh',
    'patna': 'Bihar', 'indore': 'Madhya Pradesh', 'bhopal': 'Madhya Pradesh', 'gwalior': 'Madhya Pradesh', 'jabalpur': 'Madhya Pradesh',
    'kochi': 'Kerala', 'thiruvananthapuram': 'Kerala', 'guwahati': 'Assam', 'bhubaneswar': 'Odisha', 'ranchi': 'Jharkhand', 'dehradun': 'Uttarakhand', 'raipur': 'Chhattisgarh'
  };

  const gstinStateMap = {
    '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh', '05': 'Uttarakhand',
    '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar',
    '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh', '24': 'Gujarat', '27': 'Maharashtra', '29': 'Karnataka', '32': 'Kerala',
    '33': 'Tamil Nadu', '36': 'Telangana', '37': 'Andhra Pradesh'
  };

  for (const line of lines) {
    const lLower = line.toLowerCase();

    // Check states
    if (!detectedState) {
      for (const st of indianStates) {
        if (new RegExp(`\\b${st}\\b`, 'i').test(lLower)) {
          detectedState = st.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          break;
        }
      }
    }

    // Check cities
    if (!detectedCity) {
      for (const city of majorCities) {
        if (new RegExp(`\\b${city}\\b`, 'i').test(lLower)) {
          detectedCity = city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          break;
        }
      }
    }

    if (lLower.includes('india')) detectedCountry = 'India';
    if (lLower.includes('usa') || lLower.includes('united states')) detectedCountry = 'United States';
    if (lLower.includes('uk') || lLower.includes('united kingdom')) detectedCountry = 'United Kingdom';
    if (lLower.includes('uae') || lLower.includes('dubai')) detectedCountry = 'United Arab Emirates';
  }

  // Infer state from detected city or GSTIN code if not found directly in text
  if (!detectedState && detectedCity && cityStateMap[detectedCity.toLowerCase()]) {
    detectedState = cityStateMap[detectedCity.toLowerCase()];
  }
  if (!detectedState && gstin && gstinStateMap[gstin.slice(0, 2)]) {
    detectedState = gstinStateMap[gstin.slice(0, 2)];
  }

  // Default country to India if Indian state/PIN code is detected and no other country specified
  if (!detectedCountry && (detectedState || (detectedPostalCode && detectedPostalCode.length === 6))) {
    detectedCountry = 'India';
  }

  const fullAddress = addressLines.join(', ');

  // 10. Notes & Other Information
  const usedIndices = new Set([nameLineIndex, titleLineIndex, companyLineIndex]);
  const leftoverLines = [];

  if (taxInfo) leftoverLines.push(taxInfo);

  for (let i = 0; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const l = lines[i];
    if (addressLines.includes(l)) continue;
    if (emails.some(e => l.includes(e))) continue;
    if (phones.some(p => l.includes(p))) continue;
    if (website && l.includes(website)) continue;
    if (l.includes(gstin) || l.includes(pan)) continue;
    leftoverLines.push(l);
  }

  return {
    id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: cleanString(detectedName),
    title: cleanString(detectedTitle),
    company: cleanString(detectedCompany),
    phone: cleanString(phone),
    phone2: cleanString(phone2),
    phone3: cleanString(phone3),
    allPhones: phones,
    email: cleanString(primaryEmail),
    email2: cleanString(secondaryEmail),
    website: cleanString(website),
    address: cleanString(fullAddress),
    city: cleanString(detectedCity),
    state: cleanString(detectedState),
    postalCode: cleanString(detectedPostalCode),
    country: cleanString(detectedCountry),
    gstin: cleanString(gstin),
    pan: cleanString(pan),
    social: cleanString(social),
    notes: cleanString(leftoverLines.slice(0, 5).join('; ')),
    rawText: clean,
    createdAt: new Date().toISOString(),
  };
}

function isValidPersonName(str) {
  if (!str) return false;
  const trimmed = str.trim();
  if (trimmed.length < 3 || trimmed.length > 50) return false;
  // Shouldn't contain digits or email signs
  if (/\d|@|www|\.com|http/i.test(trimmed)) return false;
  // Should consist of 2 to 5 words
  const words = trimmed.split(/\s+/);
  if (words.length < 2 || words.length > 5) return false;
  return words.every(w => /^[A-Za-z.'-]+$/i.test(w));
}

function cleanString(str) {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, ' ');
}

export function createEmptyCardData() {
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: '',
    title: '',
    company: '',
    phone: '',
    phone2: '',
    phone3: '',
    allPhones: [],
    email: '',
    email2: '',
    website: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    gstin: '',
    pan: '',
    social: '',
    notes: '',
    rawText: '',
    frontPreview: '',
    backPreview: '',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Performs OCR recognition on an image file using Tesseract with preprocessed canvas
 */
async function recognizeCardImage(file, { getWorker, signal, onProgress, sideName = 'front', enhanceImage = true }) {
  if (signal?.aborted) throw new DOMException('Scanning cancelled.', 'AbortError');

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error(`Failed to load ${sideName} card image.`));
      img.src = url;
    });

    if (signal?.aborted) throw new DOMException('Scanning cancelled.', 'AbortError');

    // Create canvas
    const origCanvas = document.createElement('canvas');
    origCanvas.width = img.naturalWidth || img.width;
    origCanvas.height = img.naturalHeight || img.height;
    const origCtx = origCanvas.getContext('2d');
    if (!origCtx) throw new Error('Canvas context unavailable');
    origCtx.drawImage(img, 0, 0);

    // Apply high-contrast sharpness preprocessing if enabled
    const processedCanvas = enhanceImage ? preprocessCardCanvas(origCanvas) : origCanvas;

    const worker = await getWorker();
    if (signal?.aborted) throw new DOMException('Scanning cancelled.', 'AbortError');

    const { data } = await worker.recognize(processedCanvas);
    return (data?.text || '').trim();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Main execution function to scan Front and optional Back sides of a business card
 */
export async function scanBusinessCardImages({
  frontFile,
  backFile,
  language = 'auto',
  ocrVersion = '7.0.0',
  baseURL = '/',
  enhanceImage = true,
  signal,
  onProgress = () => {},
}) {
  if (!frontFile && !backFile) {
    throw new Error('Please provide at least one side photo of the business card.');
  }

  const check = () => {
    if (signal?.aborted) throw new DOMException('Scanning cancelled.', 'AbortError');
  };

  check();

  // Preview URLs for UI display
  const frontPreview = frontFile ? URL.createObjectURL(frontFile) : '';
  const backPreview = backFile ? URL.createObjectURL(backFile) : '';

  let tesseractWorker;
  const getWorker = async () => {
    if (tesseractWorker) return tesseractWorker;
    onProgress('Loading business card recognition engine…');
    const { default: Tesseract } = await import('tesseract.js/dist/tesseract.esm.min.js');
    check();

    const selectedLang = resolveOcrLanguage(language);
    const assetBase = new URL(`${baseURL}ocr/${ocrVersion}/`, window.location.origin).href;

    const instance = await Tesseract.createWorker(selectedLang, 1, {
      workerPath: `${assetBase}worker.min.js`,
      corePath: `${assetBase}core`,
      langPath: `${assetBase}languages`,
      workerBlobURL: false,
      cacheMethod: 'none',
      gzip: true,
      logger: event => {
        if (!signal?.aborted && event.status === 'recognizing text') {
          onProgress(`Reading card text… ${Math.round((event.progress || 0) * 100)}%`);
        }
      },
      errorHandler: () => {},
    });
    check();
    await instance.setParameters({
      tessedit_pageseg_mode: '3',
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    });
    tesseractWorker = instance;
    return instance;
  };

  try {
    let combinedText = '';

    if (frontFile) {
      onProgress('Scanning front side of business card…');
      const frontText = await recognizeCardImage(frontFile, { getWorker, signal, onProgress, sideName: 'front', enhanceImage });
      combinedText += `${frontText}\n`;
    }

    if (backFile) {
      onProgress('Scanning back side of business card…');
      const backText = await recognizeCardImage(backFile, { getWorker, signal, onProgress, sideName: 'back', enhanceImage });
      combinedText += `\n${backText}`;
    }

    onProgress('Extracting contact details and company information…');
    const parsed = parseBusinessCardText(combinedText);

    return {
      ...parsed,
      frontPreview,
      backPreview,
    };
  } finally {
    if (tesseractWorker) {
      void tesseractWorker.terminate();
    }
  }
}

/**
 * Escapes XML strings safely for OpenXML Excel Workbook
 */
function escapeXml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/**
 * Generates an authentic Microsoft Excel (.xlsx) OpenXML workbook from cards array
 */
export async function generateExcelWorkbook(cards, { filename = 'business-cards.xlsx' } = {}) {
  const zip = new JSZip();

  const columns = [
    { header: '#', width: 6, key: 'index' },
    { header: 'Full Name', width: 24, key: 'name' },
    { header: 'Job Title', width: 26, key: 'title' },
    { header: 'Company Name', width: 30, key: 'company' },
    { header: 'Primary Mobile', width: 20, key: 'phone' },
    { header: 'Office / Alternate Phone', width: 22, key: 'phone2' },
    { header: 'Extra Phone Numbers', width: 22, key: 'phone3' },
    { header: 'Email Address', width: 28, key: 'email' },
    { header: 'Secondary Email', width: 28, key: 'email2' },
    { header: 'Website', width: 26, key: 'website' },
    { header: 'Full Address', width: 40, key: 'address' },
    { header: 'City', width: 16, key: 'city' },
    { header: 'State', width: 16, key: 'state' },
    { header: 'ZIP / PIN Code', width: 14, key: 'postalCode' },
    { header: 'Country', width: 16, key: 'country' },
    { header: 'GSTIN', width: 18, key: 'gstin' },
    { header: 'Social Media', width: 26, key: 'social' },
    { header: 'Notes / Services', width: 34, key: 'notes' },
    { header: 'Scanned Date', width: 16, key: 'date' },
  ];

  // Build sheet1.xml
  let sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>`;

  columns.forEach((col, idx) => {
    sheetXml += `<col min="${idx + 1}" max="${idx + 1}" width="${col.width}" customWidth="1"/>`;
  });

  sheetXml += `</cols>
  <sheetData>
    <row r="1">`;

  // Header row (Row 1)
  columns.forEach((col, idx) => {
    const colLetter = getColumnLetter(idx + 1);
    sheetXml += `<c r="${colLetter}1" t="inlineStr" s="1"><is><t>${escapeXml(col.header)}</t></is></c>`;
  });

  sheetXml += `</row>`;

  // Data rows (Row 2..N+1)
  cards.forEach((card, rowIdx) => {
    const rowNum = rowIdx + 2;
    sheetXml += `<row r="${rowNum}">`;

    const rowData = {
      index: String(rowIdx + 1),
      name: card.name || '',
      title: card.title || '',
      company: card.company || '',
      phone: card.phone || '',
      phone2: card.phone2 || '',
      phone3: card.phone3 || '',
      email: card.email || '',
      email2: card.email2 || '',
      website: card.website || '',
      address: card.address || '',
      city: card.city || '',
      state: card.state || '',
      postalCode: card.postalCode || '',
      country: card.country || '',
      gstin: card.gstin || '',
      social: card.social || '',
      notes: card.notes || '',
      date: (card.createdAt ? new Date(card.createdAt).toLocaleDateString() : new Date().toLocaleDateString()),
    };

    columns.forEach((col, colIdx) => {
      const colLetter = getColumnLetter(colIdx + 1);
      const val = rowData[col.key] || '';
      sheetXml += `<c r="${colLetter}${rowNum}" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>`;
    });

    sheetXml += `</row>`;
  });

  sheetXml += `</sheetData>
</worksheet>`;

  // xl/styles.xml with bold header formatting
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

  // xl/workbook.xml
  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Business Cards" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  // xl/_rels/workbook.xml.rels
  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  // _rels/.rels
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  // [Content_Types].xml
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', rootRelsXml);
  zip.file('xl/_rels/workbook.xml.rels', workbookRelsXml);
  zip.file('xl/workbook.xml', workbookXml);
  zip.file('xl/styles.xml', stylesXml);
  zip.file('xl/worksheets/sheet1.xml', sheetXml);

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

function getColumnLetter(colNumber) {
  let temp;
  let letter = '';
  while (colNumber > 0) {
    temp = (colNumber - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colNumber = Math.floor((colNumber - temp) / 26);
  }
  return letter;
}

/**
 * Generates an RFC 4180 CSV Blob with UTF-8 BOM for Microsoft Excel & Google Sheets
 */
export function generateCsvData(cards, { filename = 'business-cards.csv' } = {}) {
  const headers = [
    '#', 'Full Name', 'Job Title', 'Company Name', 'Primary Mobile', 'Office / Alternate Phone',
    'Extra Phone Numbers', 'Email Address', 'Secondary Email', 'Website', 'Full Address', 'City',
    'State', 'ZIP / PIN Code', 'Country', 'GSTIN', 'Social Media', 'Notes / Services', 'Scanned Date'
  ];

  const rows = [headers.map(escapeCsvValue).join(',')];

  cards.forEach((c, idx) => {
    const row = [
      String(idx + 1),
      c.name || '',
      c.title || '',
      c.company || '',
      c.phone || '',
      c.phone2 || '',
      c.phone3 || '',
      c.email || '',
      c.email2 || '',
      c.website || '',
      c.address || '',
      c.city || '',
      c.state || '',
      c.postalCode || '',
      c.country || '',
      c.gstin || '',
      c.social || '',
      c.notes || '',
      c.createdAt ? new Date(c.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
    ];
    rows.push(row.map(escapeCsvValue).join(','));
  });

  const bom = '\uFEFF';
  const csvContent = bom + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

  return {
    blob,
    filename: filename.endsWith('.csv') ? filename : `${filename}.csv`,
    csvText: csvContent,
  };
}

function escapeCsvValue(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

/**
 * Generates standard vCard 3.0 (.vcf) format for phone and Google Contacts import
 */
export function generateVCard(cards, { filename = 'contacts.vcf' } = {}) {
  const vcards = [];

  for (const c of cards) {
    if (!c.name && !c.company && !c.email && !c.phone) continue;

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${c.name || c.company || 'Contact'}`,
    ];

    if (c.title) lines.push(`TITLE:${c.title}`);
    if (c.company) lines.push(`ORG:${c.company}`);
    if (c.phone) lines.push(`TEL;TYPE=CELL,VOICE:${c.phone}`);
    if (c.phone2) lines.push(`TEL;TYPE=WORK,VOICE:${c.phone2}`);
    if (c.phone3) lines.push(`TEL;TYPE=OTHER,VOICE:${c.phone3}`);
    if (c.email) lines.push(`EMAIL;TYPE=WORK,INTERNET:${c.email}`);
    if (c.email2) lines.push(`EMAIL;TYPE=HOME,INTERNET:${c.email2}`);
    if (c.website) lines.push(`URL:${c.website}`);
    if (c.address) {
      lines.push(`ADR;TYPE=WORK:;;${c.address};${c.city || ''};${c.state || ''};${c.postalCode || ''};${c.country || ''}`);
    }
    if (c.notes) lines.push(`NOTE:${c.notes.replaceAll('\n', ' ')}`);

    lines.push('END:VCARD');
    vcards.push(lines.join('\r\n'));
  }

  const blob = new Blob([vcards.join('\r\n\r\n')], { type: 'text/vcard;charset=utf-8' });
  return {
    blob,
    filename: filename.endsWith('.vcf') ? filename : `${filename}.vcf`,
  };
}

/**
 * Sample realistic business card datasets for instant testing & demonstration
 */
export const SAMPLE_BUSINESS_CARDS = [
  {
    id: 'sample-card-1',
    name: 'Dr. Rajesh Sharma',
    title: 'Senior Consultant Cardiologist',
    company: 'Apex Heart & Vascular Institute Pvt Ltd',
    phone: '+91 98101 23456',
    phone2: '0124-4567890',
    phone3: '',
    allPhones: ['+91 98101 23456', '0124-4567890'],
    email: 'dr.rajesh@apexheart.in',
    email2: '',
    website: 'www.apexheart.in',
    address: 'Plot 45, Sector 18, Gurugram, Haryana - 122002',
    city: 'Gurugram',
    state: 'Haryana',
    postalCode: '122002',
    country: 'India',
    gstin: '06AAACA1234A1Z5',
    pan: 'AAACA1234A',
    social: 'linkedin.com/in/dr-rajesh-sharma',
    notes: 'OPD Hours: 10 AM - 4 PM; Emergency Consultation Available',
    rawText: `Dr. Rajesh Sharma, MD\nSenior Consultant Cardiologist\nApex Heart & Vascular Institute Pvt Ltd\nPlot 45, Sector 18, Gurugram, Haryana - 122002\nMobile: +91 98101 23456 | Office: 0124-4567890\nEmail: dr.rajesh@apexheart.in\nWeb: www.apexheart.in\nGSTIN: 06AAACA1234A1Z5`,
    frontPreview: '',
    backPreview: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-card-2',
    name: 'Ramesh Patel',
    title: 'Proprietor',
    company: 'Shree Ganesh Enterprises',
    phone: '+91 98250 12345',
    phone2: '+91 98250 67890',
    phone3: '(079) 22871234',
    allPhones: ['+91 98250 12345', '+91 98250 67890', '(079) 22871234'],
    email: 'contact@shreeganesh.co.in',
    email2: '',
    website: 'www.shreeganesh.co.in',
    address: 'Plot No. 12, GIDC Industrial Estate, Odhav, Ahmedabad - 382415',
    city: 'Ahmedabad',
    state: 'Gujarat',
    postalCode: '382415',
    country: 'India',
    gstin: '24AAACG1234A1Z5',
    pan: 'AAACG1234A',
    social: '',
    notes: 'Industrial Bearings & Machinery Parts Manufacturer',
    rawText: `SHREE GANESH ENTERPRISES\nPlot No. 12, GIDC Industrial Estate, Odhav, Ahmedabad - 382415\nMob: +91 98250 12345 / 98250 67890 | Tel: (079) 22871234\nEmail: contact@shreeganesh.co.in\nWebsite: www.shreeganesh.co.in\nGSTIN: 24AAACG1234A1Z5\nProprietor: Ramesh Patel`,
    frontPreview: '',
    backPreview: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-card-3',
    name: 'Sarah Connor',
    title: 'Vice President of Product Engineering',
    company: 'Cyberdyne Systems Technologies LLC',
    phone: '+1 (415) 555-0192',
    phone2: '+1 (415) 555-0199',
    phone3: '',
    allPhones: ['+1 (415) 555-0192', '+1 (415) 555-0199'],
    email: 'sconnor@cyberdyne.io',
    email2: '',
    website: 'www.cyberdyne.io',
    address: '100 Innovation Way, Suite 400, San Francisco, CA 94107',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94107',
    country: 'United States',
    gstin: '',
    pan: '',
    social: 'linkedin.com/in/sarah-connor-tech',
    notes: 'Next-Gen Autonomous Systems & Cloud Architecture',
    rawText: `Sarah Connor\nVice President of Product Engineering\nCyberdyne Systems Technologies LLC\n100 Innovation Way, Suite 400\nSan Francisco, CA 94107\nTel: +1 (415) 555-0192\nMobile: +1 (415) 555-0199\nEmail: sconnor@cyberdyne.io\nLinkedIn: linkedin.com/in/sarah-connor-tech\nwww.cyberdyne.io`,
    frontPreview: '',
    backPreview: '',
    createdAt: new Date().toISOString(),
  },
];
