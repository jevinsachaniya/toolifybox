import { runConversionTask } from './conversion-task.js';
import { needsOcrForDigitalText, resolveOcrLanguage } from './pdf-ocr.js';

export const SUPPORTED_OCR_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const MAX_OCR_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

/**
 * Validates files chosen for the OCR text extractor.
 * @param {FileList|File[]} files 
 * @returns {string|null}
 */
export function validateOcrFile(files) {
  if (!files?.length) return 'Please choose a PDF or image file to extract text from.';
  if (files.length > 1) return 'Please select one PDF or image document at a time.';
  const file = files[0];
  const extension = (file.name.split('.').pop() || '').toLowerCase();
  const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
  
  if (!validExtensions.includes(extension) && !SUPPORTED_OCR_TYPES.includes(file.type)) {
    return 'Please choose a supported PDF or image file (.pdf, .jpg, .png, .webp).';
  }
  if (file.size <= 0) return 'This file is empty. Please choose a valid document with content.';
  if (file.size > MAX_OCR_FILE_SIZE) return 'This file exceeds the 30 MB limit. Please choose a smaller file.';
  return null;
}

/**
 * Counts words in a string accurately across English and Devanagari/Hindi scripts.
 * @param {string} text 
 * @returns {number}
 */
export function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  const matches = text.trim().match(/[\p{L}\p{M}\p{N}]+/gu);
  return matches ? matches.length : 0;
}

/**
 * Parses pdfjs getTextContent items into clean formatted text with paragraph breaks.
 * @param {object} content 
 * @returns {string}
 */
export function formatPdfTextContent(content) {
  if (!content?.items?.length) return '';
  let result = '';
  let lastY;
  for (const item of content.items) {
    if (!item.str) {
      if (item.hasEOL) result += '\n';
      continue;
    }
    const currentY = item.transform ? item.transform[5] : undefined;
    if (lastY !== undefined && Math.abs(currentY - lastY) > 5) {
      result += '\n';
    } else if (result && !result.endsWith('\n') && !result.endsWith(' ')) {
      result += ' ';
    }
    result += item.str;
    lastY = currentY;
    if (item.hasEOL) {
      result += '\n';
    }
  }
  return result.trim();
}

/**
 * Creates a clean Microsoft Word (.docx) document containing the extracted text.
 * Configures OpenXML complex script typography (Nirmala UI + Mangal) and adaptive
 * line heights so Devanagari / Hindi characters and matras render cleanly without clipping.
 *
 * @param {string} text 
 * @param {object} [options]
 * @returns {Promise<Blob>}
 */
export async function createOcrDocx(text, { title = 'Extracted Text' } = {}) {
  const { Document, Packer, Paragraph, TextRun, PageBreak, LineRuleType } = await import('docx');
  const lines = text.split(/\r?\n/);
  const hasIndic = /[\u0900-\u0D7F]/u.test(text);

  const fontDef = hasIndic
    ? { name: 'Nirmala UI', cs: 'Mangal', ascii: 'Nirmala UI', hAnsi: 'Nirmala UI' }
    : { name: 'Arial', cs: 'Mangal', ascii: 'Arial', hAnsi: 'Arial' };

  const children = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === '--- Page Break ---') {
      children.push(new Paragraph({
        children: [new PageBreak()],
        spacing: { before: 0, after: 0 },
      }));
      continue;
    }

    const lineIndic = hasIndic || /[\u0900-\u0D7F]/u.test(line);
    const lineFont = lineIndic
      ? { name: 'Nirmala UI', cs: 'Mangal', ascii: 'Nirmala UI', hAnsi: 'Nirmala UI' }
      : fontDef;

    children.push(new Paragraph({
      spacing: {
        before: 0,
        after: 140, // 7pt spacing after
        line: 340,  // 17pt line height (1.4x for 12pt font)
        lineRule: LineRuleType.AT_LEAST,
      },
      children: [
        new TextRun({
          text: rawLine,
          font: lineFont,
          size: 24, // 12pt
          sizeComplexScript: 24,
        }),
      ],
    }));
  }

  const doc = new Document({
    creator: 'Toolifybox Extract OCR Text',
    title,
    description: 'Extracted text via Toolifybox browser OCR',
    styles: {
      default: {
        document: {
          run: {
            font: fontDef,
            size: 24,
            sizeComplexScript: 24,
          },
          paragraph: {
            spacing: {
              before: 0,
              after: 140,
              line: 340,
              lineRule: LineRuleType.AT_LEAST,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch margins
          },
        },
        children: children.length ? children : [new Paragraph({ children: [new TextRun('')] })],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Extracts text from a PDF or image file directly in the browser.
 * 
 * @param {File|Blob} file 
 * @param {object} options
 * @param {'eng'|'hin'|'eng+hin'} [options.language='eng+hin']
 * @param {boolean} [options.forceOcr=false]
 * @param {AbortSignal} [options.signal]
 * @param {(message: string) => void} [options.onProgress]
 * @returns {Promise<{ text: string, pages: Array<{ pageNumber: number, text: string, type: 'digital'|'ocr', wordCount: number, charCount: number }>, wordCount: number, charCount: number, ocrPages: number, digitalPages: number, totalPages: number }>}
 */
export async function extractOcrFromFile(file, {
  language = 'auto',
  forceOcr = false,
  signal,
  onProgress = () => {},
} = {}) {
  const check = () => {
    if (signal?.aborted) throw new DOMException('Text extraction cancelled.', 'AbortError');
  };
  check();

  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
  const config = useRuntimeConfig();
  const baseURL = config.app.baseURL;
  const assetBase = new URL(`${baseURL}ocr/${config.public.ocrVersion}/`, window.location.origin).href;

  let tesseractWorker;
  const getWorker = async () => {
    if (tesseractWorker) return tesseractWorker;
    onProgress('Loading text recognition engine…');
    const { default: Tesseract } = await import('tesseract.js/dist/tesseract.esm.min.js');
    check();
    const selectedLang = resolveOcrLanguage(language);
    const instance = await Tesseract.createWorker(selectedLang, 1, {
      workerPath: `${assetBase}worker.min.js`,
      corePath: `${assetBase}core`,
      langPath: `${assetBase}languages`,
      workerBlobURL: false,
      cacheMethod: 'none',
      gzip: true,
      logger: event => {
        if (!signal?.aborted && event.status === 'recognizing text') {
          onProgress(`Recognizing text… ${Math.round((event.progress || 0) * 100)}%`);
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
    if (!isPdf) {
      // Image file OCR
      onProgress('Loading image for recognition…');
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image for OCR.'));
        img.src = url;
      });
      URL.revokeObjectURL(url);
      check();

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      onProgress('Scanning image with local OCR…');
      const worker = await getWorker();
      check();

      const { data } = await worker.recognize(canvas);
      check();

      const pageText = (data.text || '').trim();
      const pageWords = countWords(pageText);

      return {
        text: pageText,
        pages: [{ pageNumber: 1, text: pageText, type: 'ocr', wordCount: pageWords, charCount: pageText.length }],
        wordCount: pageWords,
        charCount: pageText.length,
        ocrPages: 1,
        digitalPages: 0,
        totalPages: 1,
      };
    }

    // PDF file extraction
    onProgress('Opening PDF document…');
    const [pdfjs, { default: workerUrl }] = await Promise.all([
      import('pdfjs-dist/build/pdf.mjs'),
      import('pdfjs-dist/build/pdf.worker.mjs?url'),
    ]);
    check();
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

    const data = new Uint8Array(await file.arrayBuffer());
    check();

    const assets = `${baseURL}pdfjs/${pdfjs.version}/`;
    const loading = pdfjs.getDocument({
      data,
      cMapUrl: `${assets}cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `${assets}standard_fonts/`,
      wasmUrl: `${assets}wasm/`,
      iccUrl: `${assets}iccs/`,
      isEvalSupported: false,
      stopAtErrors: true,
      verbosity: 0,
    });

    const pdf = await loading.promise;
    check();

    const totalPages = pdf.numPages;
    const pages = [];
    let ocrPages = 0;
    let digitalPages = 0;

    for (let number = 1; number <= totalPages; number++) {
      check();
      onProgress(`Processing page ${number} of ${totalPages}…`);
      const page = await pdf.getPage(number);
      let pageText = '';
      let extractionType = 'digital';

      if (!forceOcr) {
        const textContent = await page.getTextContent();
        pageText = formatPdfTextContent(textContent);
      }

      // Automatically detect corrupted legacy fonts (e.g. KrutiDev, non-Unicode CMaps, or PUA glyphs)
      const hasUnusableTextLayer = pageText ? needsOcrForDigitalText(pageText) : true;

      // If the page already contains real Unicode text, retain its native
      // script. OCR handles scans and legacy/private-use font encodings.
      if (forceOcr || pageText.length < 25 || hasUnusableTextLayer) {
        extractionType = 'ocr';
        ocrPages++;
        onProgress(`Running high-resolution OCR on page ${number} of ${totalPages}…`);

        // Render at 300 DPI for high-accuracy Devanagari recognition (matras & conjuncts)
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(4, Math.max(2.5, 2400 / Math.max(unscaledViewport.width, unscaledViewport.height)));
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d', { alpha: false });
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: context, viewport, background: '#ffffff' }).promise;
        check();

        const worker = await getWorker();
        check();

        const { data: ocrData } = await worker.recognize(canvas);
        check();

        pageText = (ocrData.text || '').trim();
        canvas.width = canvas.height = 0;
      } else {
        digitalPages++;
      }

      page.cleanup();

      const pageWords = countWords(pageText);
      pages.push({
        pageNumber: number,
        text: pageText,
        type: extractionType,
        wordCount: pageWords,
        charCount: pageText.length,
      });
    }

    const fullText = pages.map(p => p.text).filter(Boolean).join('\n\n--- Page Break ---\n\n');
    const totalWords = countWords(fullText);

    return {
      text: fullText,
      pages,
      wordCount: totalWords,
      charCount: fullText.length,
      ocrPages,
      digitalPages,
      totalPages,
    };
  } finally {
    if (tesseractWorker) {
      await tesseractWorker.terminate().catch(() => {});
    }
  }
}
