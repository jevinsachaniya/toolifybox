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
 * - Adaptive Local Background Division (Shadow Neutralizer):
 *   Removes phone shadows, hand shadows, vignette, and uneven room lighting
 *   by dividing each pixel by its smoothly interpolated local background illumination.
 * - Enhances contrast and sharpens edges so fine 6pt-9pt fonts become razor-sharp.
 */
export function preprocessCardCanvas(sourceCanvas) {
  if (typeof document === 'undefined' || !sourceCanvas || !sourceCanvas.width || !sourceCanvas.height) return sourceCanvas;

  const origW = sourceCanvas.width;
  const origH = sourceCanvas.height;

  // Scale to optimal OCR dimensions (~2000 - 2400px width)
  let scale = 1;
  if (origW < 1600) {
    scale = Math.min(3, 2000 / origW);
  } else if (origW > 2800) {
    scale = 2400 / origW;
  }
  const targetW = Math.max(1, Math.round(origW * scale));
  const targetH = Math.max(1, Math.round(origH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, targetW, targetH);

  try {
    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;
    const totalPixels = targetW * targetH;

    // 1. Convert to grayscale array and measure overall luminance distribution
    const gray = new Uint8Array(totalPixels);
    let totalLum = 0;
    const sampleStep = 8;
    let sampledCount = 0;
    let darkPixelCount = 0;

    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const g = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      gray[p] = g;
      if (p % sampleStep === 0) {
        totalLum += g;
        sampledCount++;
        if (g < 110) darkPixelCount++;
      }
    }

    const avgLum = totalLum / Math.max(1, sampledCount);
    // Dark card detection: majority of the card is dark background with light lettering
    const isDarkCard = (darkPixelCount / Math.max(1, sampledCount)) > 0.65 || avgLum < 95;

    // Invert dark cards so OCR consistently operates on dark text over light background
    if (isDarkCard) {
      for (let p = 0; p < totalPixels; p++) {
        gray[p] = 255 - gray[p];
      }
    }

    // 2. Adaptive Local Illumination Normalization (Shadow Neutralizer)
    // Eliminates cast shadows (phone body, fingers, uneven overhead lighting)
    // by sampling true background paper luminance in local tiles and dividing.
    const tileSize = Math.max(24, Math.round(targetW / 40)); // ~40-60px tiles
    const gridCols = Math.ceil(targetW / tileSize);
    const gridRows = Math.ceil(targetH / tileSize);
    const bgGrid = new Float32Array(gridCols * gridRows);

    // For each tile, determine the 88th percentile luminance (paper brightness in that tile)
    const hist = new Int32Array(256);
    for (let gy = 0; gy < gridRows; gy++) {
      const y0 = gy * tileSize;
      const y1 = Math.min(targetH, y0 + tileSize);
      for (let gx = 0; gx < gridCols; gx++) {
        const x0 = gx * tileSize;
        const x1 = Math.min(targetW, x0 + tileSize);

        hist.fill(0);
        let count = 0;
        for (let y = y0; y < y1; y += 2) {
          const rowOffset = y * targetW;
          for (let x = x0; x < x1; x += 2) {
            hist[gray[rowOffset + x]]++;
            count++;
          }
        }

        // 88th percentile represents the background paper, ignoring thin dark text strokes
        const targetCount = Math.floor(count * 0.88);
        let accum = 0;
        let bgVal = 200;
        for (let b = 0; b < 256; b++) {
          accum += hist[b];
          if (accum >= targetCount) {
            bgVal = b;
            break;
          }
        }
        bgGrid[gy * gridCols + gx] = Math.max(35, bgVal);
      }
    }

    // 3. Smooth the tile grid with a 3x3 box blur to avoid hard tile borders
    const smoothGrid = new Float32Array(gridCols * gridRows);
    for (let gy = 0; gy < gridRows; gy++) {
      for (let gx = 0; gx < gridCols; gx++) {
        let sum = 0;
        let c = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const ny = gy + dy;
          if (ny < 0 || ny >= gridRows) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = gx + dx;
            if (nx < 0 || nx >= gridCols) continue;
            sum += bgGrid[ny * gridCols + nx];
            c++;
          }
        }
        smoothGrid[gy * gridCols + gx] = sum / c;
      }
    }

    // 4. Divide each pixel by its bilinearly interpolated local background
    // In shadowed zones, background paper is smoothly normalized to bright white (~225)
    // while preserving dark text contrast everywhere!
    const norm = new Uint8Array(totalPixels);
    for (let y = 0; y < targetH; y++) {
      const gy = (y / tileSize);
      const iy = Math.floor(gy);
      const fy = gy - iy;
      const iyNext = Math.min(gridRows - 1, iy + 1);
      const rowOffset = y * targetW;

      for (let x = 0; x < targetW; x++) {
        const gx = (x / tileSize);
        const ix = Math.floor(gx);
        const fx = gx - ix;
        const ixNext = Math.min(gridCols - 1, ix + 1);

        const top = (1 - fx) * smoothGrid[iy * gridCols + ix] + fx * smoothGrid[iy * gridCols + ixNext];
        const bottom = (1 - fx) * smoothGrid[iyNext * gridCols + ix] + fx * smoothGrid[iyNext * gridCols + ixNext];
        const localBg = Math.max(35, (1 - fy) * top + fy * bottom);

        const p = rowOffset + x;
        let val = Math.round((gray[p] / localBg) * 225);
        if (val > 255) val = 255;
        norm[p] = val;
      }
    }

    // 5. Mild Contrast Stretch & High-Pass Edge Sharpening for OCR Crispness
    for (let y = 0; y < targetH; y++) {
      const rowOffset = y * targetW;
      const yPrev = Math.max(0, y - 1) * targetW;
      const yNext = Math.min(targetH - 1, y + 1) * targetW;

      for (let x = 0; x < targetW; x++) {
        const p = rowOffset + x;
        const xPrev = Math.max(0, x - 1);
        const xNext = Math.min(targetW - 1, x + 1);

        // Linear stretch: values near background (>=210) become crisp white (255)
        let v = norm[p];
        let stretched = ((v - 50) / 165) * 255;
        if (stretched < 0) stretched = 0;
        if (stretched > 255) stretched = 255;

        // Mild Laplacian edge sharpening on text contours
        const center = stretched;
        const north = ((norm[yPrev + x] - 50) / 165) * 255;
        const south = ((norm[yNext + x] - 50) / 165) * 255;
        const west = ((norm[rowOffset + xPrev] - 50) / 165) * 255;
        const east = ((norm[rowOffset + xNext] - 50) / 165) * 255;

        let sharp = center + 0.35 * (4 * center - north - south - west - east);
        sharp = Math.max(0, Math.min(255, Math.round(sharp)));

        const idx = p * 4;
        data[idx] = sharp;
        data[idx + 1] = sharp;
        data[idx + 2] = sharp;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  } catch {
    return canvas;
  }
}

/**
 * Words that indicate corporate entities or non-person business names
 */
export const COMPANY_WORDS_DISQUALIFIERS = [
  'ltd', 'limited', 'pvt', 'private', 'inc', 'corp', 'corporation', 'llc', 'llp', 'co.',
  'company', 'enterprises', 'industries', 'solutions', 'technologies', 'services', 'systems',
  'associates', 'traders', 'trading', 'agency', 'agencies', 'group', 'studio', 'holdings',
  'ventures', 'international', 'global', 'logistics', 'hardware', 'electricals', 'electronics',
  'pharma', 'chemicals', 'textiles', 'motors', 'foods', 'builders', 'developers', 'jewellers',
  'jewelers', 'hospital', 'clinic', 'opticians', 'bazaar', 'store', 'mart', 'institute',
  'school', 'college', 'trust', 'foundation', 'works', 'security', 'solar', 'power', 'energy',
  'deals in', 'manufacturer', 'distributor', 'wholesaler', 'retailer', 'iso certified',
  'street', 'road', 'plot', 'floor', 'bldg', 'complex', 'tower', 'nagar', 'opp', 'near',
  'gidc', 'midc', 'estate', 'san francisco', 'new york', 'los angeles', 'chicago', 'london',
  'singapore', 'dubai', 'ahmedabad', 'mumbai', 'delhi', 'bengaluru', 'bangalore', 'hyderabad',
  'chennai', 'kolkata', 'pune', 'jaipur', 'surat', 'lucknow', 'rajkot', 'vadodara', 'california',
  'gujarat', 'maharashtra'
];

/**
 * Validates whether candidate string is a real person name and not a company, address, or slogan
 */
export function isCleanPersonName(candidate) {
  if (!candidate || typeof candidate !== 'string') return false;
  let str = candidate.trim();

  // Strip honorific prefixes: Dr., Er., Adv., CA, Mr., etc.
  const withoutHonorific = str.replace(/^(?:dr\.|dr|mr\.|mr|mrs\.|mrs|ms\.|ms|prof\.|prof|ca\.|ca|cs\.|cs|adv\.|adv|er\.|er|shri|smt)\s+/i, '').trim();

  if (withoutHonorific.length < 3 || withoutHonorific.length > 40) return false;
  if (/\d|@|www|\.com|http|[\\/|;:<>_=+*#]/i.test(withoutHonorific)) return false;

  const lower = withoutHonorific.toLowerCase();
  for (const bad of COMPANY_WORDS_DISQUALIFIERS) {
    if (new RegExp(`\\b${bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower)) {
      return false;
    }
  }

  // Must consist of 1 to 5 alphabetic/punctuation name words
  const words = withoutHonorific.split(/\s+/);
  if (words.length < 1 || words.length > 5) return false;

  return words.every(w => /^[A-Za-z.'-]+$/i.test(w));
}

/**
 * Checks if a single line contains both a person's name and title (e.g. 'Ramesh Patel (Proprietor)' or 'Sarah Connor - VP')
 */
function extractComboNameAndTitle(line) {
  if (!line) return null;
  const l = line.trim();
  // Reject lines containing digits (addresses, ZIP codes, and phone numbers are not names or job titles)
  if (/\d/.test(l)) return null;

  // Pattern 1: 'Ramesh Patel (Proprietor)' or 'Sarah Connor (Vice President)'
  const parenMatch = l.match(/^([A-Za-z.'\s-]+)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    const left = parenMatch[1].trim();
    const right = parenMatch[2].trim();
    const rightIsTitle = TITLE_KEYWORDS.some(k => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(right));
    if (rightIsTitle && isCleanPersonName(left)) {
      return { name: left, title: right };
    }
  }

  // Pattern 2: 'Proprietor: Ramesh Patel' or 'Director - John Doe'
  const colonMatch = l.match(/^(proprietor|prop|director|managing director|partner|owner|ceo|founder|doctor|dr|president|manager|vp|general manager)\s*[:.-]\s*(.+)$/i);
  if (colonMatch) {
    const t = colonMatch[1].trim();
    const n = colonMatch[2].trim();
    if (isCleanPersonName(n)) {
      return { name: n, title: t };
    }
  }

  // Pattern 3: 'Ramesh Patel - Proprietor' or 'Ramesh Patel | Proprietor' or 'Dr. Rajesh Sharma, MD (Cardiologist)'
  const sepMatch = l.match(/^(.+?)\s*[-|/,]\s*(.+)$/);
  if (sepMatch) {
    const p1 = sepMatch[1].trim();
    const p2 = sepMatch[2].trim();
    const p1IsTitle = TITLE_KEYWORDS.some(k => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(p1));
    const p2IsTitle = TITLE_KEYWORDS.some(k => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(p2));

    if (p2IsTitle && isCleanPersonName(p1)) {
      return { name: p1, title: p2 };
    } else if (p1IsTitle && isCleanPersonName(p2)) {
      return { name: p2, title: p1 };
    }
  }

  return null;
}

/**
 * Intelligently classifies phone numbers into Mobile vs Landline/Office numbers
 */
export function categorizePhones(phones, rawText = '') {
  const mobiles = [];
  const landlines = [];
  const others = [];

  const textLines = (rawText || '').split('\n').map(l => l.trim());

  for (const p of phones) {
    const digits = p.replace(/\D/g, '');
    let isMobile = false;
    let isLandline = false;

    // Check surrounding line label for this phone
    const lineWithPhone = textLines.find(l => l.includes(p) || (digits.length >= 8 && l.replace(/\D/g, '').includes(digits)));
    if (lineWithPhone) {
      if (/(?:mob(?:ile)?|cell|whatsapp|m[\s.:]|w[\s.:]|c[\s.:])/i.test(lineWithPhone)) {
        isMobile = true;
      } else if (/(?:tel(?:ephone)?|landline|office|off|fax|desk|o[\s.:]|t[\s.:]|f[\s.:])/i.test(lineWithPhone)) {
        isLandline = true;
      }
    }

    // Format heuristic
    if (!isMobile && !isLandline) {
      if (digits.length >= 10 && /^[6-9]\d{9}$/.test(digits.slice(-10))) {
        isMobile = true;
      } else if (p.startsWith('0') || p.startsWith('(0') || /^\(?0\d{2,4}\)?[-.\s]?\d{6,8}/.test(p)) {
        isLandline = true;
      } else if (digits.length === 10 && /^[6-9]/.test(digits)) {
        isMobile = true;
      } else {
        isMobile = true;
      }
    }

    if (isMobile) {
      mobiles.push(p);
    } else if (isLandline) {
      landlines.push(p);
    } else {
      others.push(p);
    }
  }

  const primaryMobile = mobiles[0] || landlines[0] || others[0] || '';
  let officePhone = landlines[0] || '';
  if (!officePhone || officePhone === primaryMobile) {
    officePhone = mobiles[1] || others[0] || '';
  }

  const used = new Set([primaryMobile, officePhone]);
  const extraPhones = phones.filter(p => !used.has(p));

  return {
    primaryMobile,
    officePhone,
    extraPhones: extraPhones.join(', '),
    allPhones: phones,
  };
}
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

  const knownTlds = 'com|in|org|net|io|co|ai|edu|gov|co\\.in|dev|app|tech|biz|info|me|online|store';

  // Fix spaces around @ in email on the same line without eating newlines or subsequent lines
  text = text.replace(new RegExp(`([a-zA-Z0-9._%+-]+)[^\\S\\r\\n]*[@©][^\\S\\r\\n]*([a-zA-Z0-9.-]+)[^\\S\\r\\n]*[,.][^\\S\\r\\n]*(${knownTlds})\\b`, 'gi'), '$1@$2.$3');

  // Fix comma instead of dot before known TLD
  text = text.replace(new RegExp(`\\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+),(${knownTlds})\\b`, 'gi'), '$1.$2');

  // Fix 'www,domain,com' -> 'www.domain.com'
  text = text.replace(/\bwww[,.][a-zA-Z0-9,.-]+/gi, m => m.replace(/,/g, '.'));
  text = text.replace(new RegExp(`\\b([a-zA-Z0-9.-]+),(${knownTlds})\\b`, 'gi'), '$1.$2');

  return text;
}

/**
 * Validates candidate email address string
 */
function isValidEmailAddress(em) {
  if (!em || em.length < 6 || em.length > 80) return false;
  if (!em.includes('@') || !em.includes('.')) return false;
  const parts = em.split('@');
  if (parts.length !== 2) return false;
  const [user, domain] = parts;
  if (!user || !domain || user.length < 1 || domain.length < 3) return false;
  // Ignore image or document extensions mistakenly parsed as TLDs
  if (/\.(?:jpg|jpeg|png|webp|bmp|tif|gif|svg|pdf)$/i.test(domain)) return false;
  return true;
}

/**
 * Extract email addresses from text with strict delimiter boundaries
 */
export function extractEmails(text) {
  if (!text) return [];
  const cleanedText = cleanOcrTypos(text);
  const emails = new Set();

  // Pattern 1: Matches emails with labeled or delimited boundaries
  const emailRegex = /(?:^|[\s,;:|/()<>[\]{}"'])(?:e-?mail|mail|gmail|email\s*id|e-mail\s*id|id|contact|to)?\s*[:=-]?\s*([A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,})(?=[\s,;:|/()<>[\]{}"']|$)/gi;
  let match;
  while ((match = emailRegex.exec(cleanedText)) !== null) {
    let email = (match[1] || '').trim();
    email = email.replace(/[.,;:!?/\\)>"'\]]+$/, '').trim().toLowerCase();
    if (isValidEmailAddress(email)) {
      emails.add(email);
    }
  }

  // Pattern 2: Fallback standard RFC regex
  const fallbackRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const fallbacks = cleanedText.match(fallbackRegex) || [];
  for (let em of fallbacks) {
    em = em
      .replace(/^(?:e-?mail|mail|gmail|id|to|contact)\s*[:=-]?\s*/i, '')
      .replace(/[.,;:!?/\\)>"'\]]+$/, '')
      .trim()
      .toLowerCase();
    if (isValidEmailAddress(em)) {
      emails.add(em);
    }
  }

  return Array.from(emails);
}

/**
 * Validates candidate web URL
 */
function isValidWebUrl(url, foundEmails = []) {
  if (!url || url.length < 4 || url.length > 120) return false;
  if (/\.(?:jpg|jpeg|png|webp|bmp|tif|gif|svg|pdf|docx|xlsx)$/i.test(url)) return false;
  // Ignore if it's the domain portion of an email unless it explicitly had www or http
  const isEmailDomain = foundEmails.some(e => {
    const d = (e.split('@')[1] || '').toLowerCase();
    const u = url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    return d === u && !url.startsWith('www.') && !url.startsWith('http');
  });
  if (isEmailDomain) return false;
  return true;
}

/**
 * Extract website URLs from text with strict boundaries
 */
export function extractWebsites(text, foundEmails = []) {
  if (!text) return [];
  const cleanedText = cleanOcrTypos(text);
  const results = new Set();

  // 1. Matches URLs starting with http://, https://, or www.
  const urlRegex = /(?:^|[\s,;:|/()<>[\]{}"'])(?:website|web|url|site|visit(?:\s+us)?(?:\s+at)?)?\s*[:=-]?\s*((?:https?:\/\/|www\.)[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/[A-Za-z0-9_.-]*)*)(?=[\s,;:|/()<>[\]{}"']|$)/gi;
  let match;
  while ((match = urlRegex.exec(cleanedText)) !== null) {
    let url = (match[1] || '').trim().replace(/[.,;:!?/\\)>"'\]]+$/, '');
    if (url && isValidWebUrl(url, foundEmails)) {
      results.add(url);
    }
  }

  // 2. Domain-like patterns (e.g. shreeganesh.co.in, cyberdyne.io, company.com)
  const domainRegex = /\b([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.(?:com|org|net|io|in|co|ai|co\.in|dev|app|tech|biz|info|me|online|store|global))\b(?:\/[A-Za-z0-9_.-]*)?/gi;
  const domainMatches = cleanedText.match(domainRegex) || [];
  for (let dom of domainMatches) {
    dom = dom.trim().replace(/[.,;:!?/\\)>"'\]]+$/, '');
    if (isValidWebUrl(dom, foundEmails) && !cleanedText.includes(`@${dom}`)) {
      results.add(dom);
    }
  }

  const cleaned = [];
  for (const url of results) {
    const formatted = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.')
      ? url
      : `www.${url}`;
    if (!cleaned.includes(formatted)) {
      cleaned.push(formatted);
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
 * Strips phone numbers, email addresses, website URLs, tax IDs, and label prefixes
 * from an address line so the address is isolated cleanly without merged field artifacts.
 */
function sanitizeLineForAddress(line, { foundWebsites = [], foundEmails = [], foundPhones = [], gstin = '', pan = '' } = {}) {
  if (!line) return '';
  let cleaned = line;

  // 1. Strip explicit address label prefix at the start of the line
  cleaned = cleaned.replace(/^(?:address|office|regd(?:\.|\s+)?off(?:ice)?|works|plant|factory|branch|head\s+office|corp(?:\.|\s+)?off(?:ice)?|add(?:r)?|location|site)\s*[:.-]\s*/i, '');

  // 2. Strip any email addresses
  cleaned = cleaned.replace(/(?:e-?mail|mail|gmail|id)?\s*[:=-]?\s*\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi, ' ');
  for (const em of foundEmails) {
    if (em) {
      cleaned = cleaned.replace(new RegExp(em.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
    }
  }

  // 3. Strip any website URLs or domains
  cleaned = cleaned.replace(/(?:website|web|url|site|visit)?\s*[:=-]?\s*(?:https?:\/\/|www\.)[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/[A-Za-z0-9_.-]*)*\b/gi, ' ');
  for (const site of foundWebsites) {
    if (site) {
      const bare = site.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
      cleaned = cleaned.replace(new RegExp(`(?:website|web|url|site)?\\s*[:=-]?\\s*(?:https?:\\/\\/)?(?:www\\.)?${bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\/[^\\s,;|]*)?`, 'gi'), ' ');
    }
  }

  // 4. Strip phone numbers
  cleaned = cleaned.replace(/(?:mob(?:ile)?|cell|tel(?:ephone)?|ph|phone|contact|fax|m|p)\s*[:.-]?\s*(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/gi, ' ');
  for (const ph of foundPhones) {
    if (ph) {
      cleaned = cleaned.replace(new RegExp(ph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), ' ');
    }
  }

  // 5. Strip tax IDs
  if (gstin) cleaned = cleaned.replace(new RegExp(`\\b(?:GSTIN\\s*[:.-]?\\s*)?${gstin}\\b`, 'gi'), ' ');
  if (pan) cleaned = cleaned.replace(new RegExp(`\\b(?:PAN\\s*[:.-]?\\s*)?${pan}\\b`, 'gi'), ' ');

  // 6. Clean dangling delimiters & excessive whitespace
  cleaned = cleaned
    .replace(/\b(?:e-?mail|website|web|url|phone|mob|tel)\s*[:.-]?\s*/gi, ' ')
    .replace(/[|/\\;,:-]+$/, '')
    .replace(/^[|/\\;,:-]+/, '')
    .trim()
    .replace(/\s+/g, ' ');

  return cleaned;
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

  // 3. Extract & Categorize Phones (Mobile vs Office/Landline)
  const rawPhones = extractPhones(clean);
  const { primaryMobile, officePhone, extraPhones, allPhones } = categorizePhones(rawPhones, clean);

  // 4. Extract Tax IDs (GSTIN, PAN)
  const { gstin, pan, taxInfo } = extractTaxIds(clean);

  // 5. Extract Socials
  const socials = extractSocials(clean);
  const social = socials.join(', ');

  // 6. Extract Company Name FIRST (so company line is locked and never confused with person name)
  let detectedCompany = '';
  let companyLineIndex = -1;

  // 6a. Check for explicit firm/company prefixes like 'M/s.' or 'Company:'
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const prefixMatch = l.match(/^(?:m\/s\.?|company|firm|organization|org)\s*[:.-]?\s*(.+)$/i);
    if (prefixMatch) {
      detectedCompany = prefixMatch[1].trim();
      companyLineIndex = i;
      break;
    }
  }

  // 6b. Check lines for corporate suffixes (e.g. Pvt Ltd, Ltd, Enterprises, Solutions, Trading Co., etc.)
  if (!detectedCompany) {
    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();
      if (/^(?:address|office|regd|works|plant|branch|add|loc|tel|mob|phone|email)/i.test(lines[i])) continue;
      if (lines[i].includes('@') || lines[i].includes('www.') || lines[i].startsWith('http')) continue;

      for (const suffix of COMPANY_SUFFIXES) {
        const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const endBoundary = /[a-zA-Z0-9]/.test(suffix.slice(-1)) ? '\\b' : '(?=\\s|$|[;,|.])';
        const suffixRegex = new RegExp(`\\b${escaped}${endBoundary}`, 'i');
        if (suffixRegex.test(lineLower)) {
          detectedCompany = lines[i];
          companyLineIndex = i;
          break;
        }
      }
      if (detectedCompany) break;
    }
  }

  // 6c. If no suffix found, match domain brand name from email or website
  if (!detectedCompany && (primaryEmail || website)) {
    const domainCandidate = (primaryEmail.split('@')[1] || website.replace(/^https?:\/\//, '').replace(/^www\./, ''))
      .split('.')[0]
      .toLowerCase();

    if (domainCandidate && domainCandidate.length >= 3 && !['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud', 'rediffmail'].includes(domainCandidate)) {
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (/^(?:address|office|regd|works|plant|branch|add|loc|tel|mob|phone|email)/i.test(l)) continue;
        if (l.includes('@') || l.includes('www.') || l.startsWith('http')) continue;

        const collapsedLine = l.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (collapsedLine.includes(domainCandidate) || domainCandidate.includes(collapsedLine)) {
          detectedCompany = l;
          companyLineIndex = i;
          break;
        }
      }
    }
  }

  // 6d. If still no company found, check top lines (Line 0 or 1) that are not person names or address lines
  if (!detectedCompany) {
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const candidate = lines[i];
      if (/^(?:address|office|regd|works|plant|branch|add|loc|tel|mob|phone|email)/i.test(candidate)) continue;
      if (candidate.includes('@') || candidate.startsWith('http') || candidate.includes('www.')) continue;
      if (rawPhones.some(p => candidate.includes(p))) continue;
      if (isCleanPersonName(candidate)) continue;

      detectedCompany = candidate;
      companyLineIndex = i;
      break;
    }
  }

  // 7. Extract Full Name & Title
  let detectedName = '';
  let nameLineIndex = -1;
  let detectedTitle = '';
  let titleLineIndex = -1;

  // 7a. Check for Combo Lines (Name + Title together on the same line, e.g. 'Ramesh Patel (Proprietor)')
  for (let i = 0; i < lines.length; i++) {
    if (i === companyLineIndex) continue;
    const combo = extractComboNameAndTitle(lines[i]);
    if (combo) {
      detectedName = combo.name;
      detectedTitle = combo.title;
      nameLineIndex = i;
      titleLineIndex = i;
      break;
    }
  }

  // 7b. Check for explicit Name labels: 'Name: Rajesh Sharma' or 'Contact Person: ...'
  if (!detectedName) {
    for (let i = 0; i < lines.length; i++) {
      if (i === companyLineIndex) continue;
      const nameLabelMatch = lines[i].match(/^(?:name|contact person)\s*[:.-]\s*(.+)$/i);
      if (nameLabelMatch && isCleanPersonName(nameLabelMatch[1])) {
        detectedName = nameLabelMatch[1].trim();
        nameLineIndex = i;
        break;
      }
    }
  }

  // 7c. Check for Honorifics (Dr., Er., Adv., Prof., CA, Mr., Mrs., Shri, etc.)
  if (!detectedName) {
    const honorificRegex = /^(?:dr\.|dr|mr\.|mr|mrs\.|mrs|ms\.|ms|prof\.|prof|ca\.|ca|cs\.|cs|adv\.|adv|er\.|er|shri|smt)\s+[A-Za-z]/i;
    for (let i = 0; i < lines.length; i++) {
      if (i === companyLineIndex) continue;
      if (honorificRegex.test(lines[i]) && isCleanPersonName(lines[i])) {
        detectedName = lines[i];
        nameLineIndex = i;
        break;
      }
    }
  }

  // 7d. Check for Title / Designation if not yet found from combo line
  if (!detectedTitle) {
    for (let i = 0; i < lines.length; i++) {
      if (i === companyLineIndex || i === nameLineIndex) continue;
      const line = lines[i];

      // Explicit title label: 'Title: Senior Manager' or 'Designation: ...'
      const titleLabelMatch = line.match(/^(?:title|designation|role)\s*[:.-]\s*(.+)$/i);
      if (titleLabelMatch) {
        detectedTitle = titleLabelMatch[1].trim();
        titleLineIndex = i;
        break;
      }

      // Check keywords
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
  }

  // 7e. If Title was found on its own line and Name is not yet found, check adjacent lines
  if (!detectedName && titleLineIndex > 0) {
    const candidateAbove = lines[titleLineIndex - 1];
    if (isCleanPersonName(candidateAbove) && titleLineIndex - 1 !== companyLineIndex) {
      detectedName = candidateAbove;
      nameLineIndex = titleLineIndex - 1;
    } else if (titleLineIndex + 1 < lines.length) {
      const candidateBelow = lines[titleLineIndex + 1];
      if (isCleanPersonName(candidateBelow) && titleLineIndex + 1 !== companyLineIndex) {
        detectedName = candidateBelow;
        nameLineIndex = titleLineIndex + 1;
      }
    }
  }

  // 7f. Fallback Name search: pick first clean person name line that is not company or title
  if (!detectedName) {
    for (let i = 0; i < lines.length; i++) {
      if (i === titleLineIndex || i === companyLineIndex) continue;
      const candidate = lines[i];
      if (isCleanPersonName(candidate)) {
        detectedName = candidate;
        nameLineIndex = i;
        break;
      }
    }
  }

  // 9. Extract Address, Postal Code, City, State
  const addressLines = [];
  const addressIndices = new Set();
  let detectedPostalCode = '';
  let detectedCity = '';
  let detectedState = '';
  let detectedCountry = '';

  // Strict word-boundary regex for address keywords to prevent substring false-positives
  const ADDRESS_INDICATOR_REGEX = /\b(?:street|road|rd|st|avenue|ave|lane|ln|floor|flr|suite|ste|plot|sector|sec|block|blk|bldg|building|complex|tower|towers|nagar|marg|near|nr|opp|opposite|behind|beside|gidc|midc|industrial\s+(?:area|estate)?|estate|po\s*box|p\.?o\.?\s*box|shop\s*(?:no\.?)?|office\s*(?:no\.?)?|flat\s*(?:no\.?)?|unit\s*(?:no\.?)?|phase|vihar|colony|rasta|circle|cross\s*road|highway|bypass|chowk|bazaar|market|society|soc|apartment|apartments|apt|crossroad|arcade|hub|center|centre|park|square|enclave|layout|residency)\b/i;

  // Keywords that identify marketing slogans, services, trade, timing or product lines (NOT address)
  const MARKETING_OR_SERVICE_KEYWORDS = [
    'deals in', 'dealing in', 'dealer', 'dealers', 'distributor', 'distributors',
    'stockist', 'stockists', 'wholesaler', 'wholesalers', 'retailer', 'retailers',
    'trader', 'traders', 'manufacturer', 'manufacturers', 'manufacturing',
    'supplier', 'suppliers', 'importer', 'importers', 'exporter', 'exporters',
    'specialist', 'specialists', 'specialise', 'specialised in', 'specialized in',
    'services', 'solutions', 'products', 'our products', 'we specialize', 'we offer',
    'timing', 'timings', 'working hours', 'sunday closed', 'open all days',
    'all types of', 'authorised dealer', 'authorized dealer', 'authorised distributor',
    'authorized distributor', 'service center', 'repairing', 'maintenance',
    'iso certified', 'certified by', 'consultancy', 'we undertake',
    'exclusive showroom', 'quality assured', 'since 19', 'since 20', 'estd'
  ];

  const pinRegex = /\b\d{6}\b|\b\d{5}(?:-\d{4})?\b/;

  for (let i = 0; i < lines.length; i++) {
    if (i === nameLineIndex || i === titleLineIndex || i === companyLineIndex) continue;
    const rawLine = lines[i];
    const lineLower = rawLine.toLowerCase();

    // Check if line contains postal PIN code (prioritize 6-digit Indian PIN, avoid 5-digit phone fragments)
    const isPhoneLine = /(?:mob|tel|cell|phone|call|contact|\+91)\b/i.test(rawLine);
    const pin6Match = rawLine.match(/\b[1-9]\d{5}\b/);
    const zip5Match = rawLine.match(/\b\d{5}(?:-\d{4})?\b/);
    const pinMatch = pin6Match || (!isPhoneLine ? zip5Match : null);

    if (pin6Match && !detectedPostalCode) {
      detectedPostalCode = pin6Match[0];
    } else if (zip5Match && !detectedPostalCode && !isPhoneLine) {
      detectedPostalCode = zip5Match[0];
    }

    // Check if this line is promotional, tagline, services or business hours
    const isMarketingOrService = MARKETING_OR_SERVICE_KEYWORDS.some(kw => lineLower.includes(kw));
    if (isMarketingOrService) {
      // Keep for notes, do NOT merge into address!
      continue;
    }

    // Sanitize line for address: strips any email, website URL, phone number, GSTIN/PAN and leading labels
    const sanitizedAddr = sanitizeLineForAddress(rawLine, {
      foundWebsites: websites,
      foundEmails: emails,
      foundPhones: allPhones,
      gstin,
      pan,
    });

    if (!sanitizedAddr || sanitizedAddr.length < 3) continue;

    // Check if line starts with an explicit address label
    const hasAddressLabel = /^(?:address|office|regd(?:\.|\s+)?off(?:ice)?|works|plant|factory|branch|head\s+office|corp(?:\.|\s+)?off(?:ice)?|add(?:r)?|location|site)\s*[:.-]/i.test(rawLine);

    // Check if sanitized text contains valid address indicators
    const hasAddrIndicator = ADDRESS_INDICATOR_REGEX.test(sanitizedAddr);

    if (hasAddressLabel || hasAddrIndicator || (pinMatch && sanitizedAddr.length > 6)) {
      addressLines.push(sanitizedAddr);
      addressIndices.add(i);
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
  const usedIndices = new Set([nameLineIndex, titleLineIndex, companyLineIndex, ...addressIndices]);
  const leftoverLines = [];

  if (taxInfo) leftoverLines.push(taxInfo);

  for (let i = 0; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const l = lines[i].trim();
    if (!l) continue;
    if (addressLines.includes(l)) continue;

    // Check if line is purely an email, phone, or website that was already extracted
    const isPureEmail = emails.some(e => l.toLowerCase().includes(e) && l.length <= e.length + 12);
    const isPurePhone = allPhones.some(p => l.includes(p) && l.length <= p.length + 15);
    const isPureWebsite = websites.some(w => l.toLowerCase().includes(w.toLowerCase().replace(/^www\./, '')) && l.length <= w.length + 15);
    if (isPureEmail || isPurePhone || isPureWebsite) continue;
    if (gstin && l.includes(gstin) && l.length < 30) continue;
    if (pan && l.includes(pan) && l.length < 25) continue;

    leftoverLines.push(l);
  }

  return {
    id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: cleanString(detectedName),
    title: cleanString(detectedTitle),
    company: cleanString(detectedCompany),
    phone: cleanString(primaryMobile),
    phone2: cleanString(officePhone),
    phone3: cleanString(extraPhones),
    allPhones: allPhones,
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
