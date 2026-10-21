import { runConversionTask } from './conversion-task.js';
import { wordPixels } from './pdf-pixels.js';

// 1. Sanitize text to strip invalid control characters that corrupt Word (.docx) XML
function sanitizeText(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    .replace(/[\uFFFE\uFFFF]/g, '');
}

const SUPPORTED_OCR_LANGUAGES = new Set([
  'hin', 'guj', 'mar', 'ben', 'tam', 'tel', 'kan', 'mal', 'pan', 'urd', 'san',
  'eng', 'spa', 'fra', 'deu', 'ara', 'rus',
  'eng+guj', 'eng+hin'
]);

// 2. Universal Language Resolver for Indian and International languages
export function resolveOcrLanguage(language = 'auto') {
  if (!language || language === 'auto') return 'eng+hin';
  if (language === 'guj+eng') return 'eng+guj';
  if (language === 'hin+eng') return 'eng+hin';
  if (SUPPORTED_OCR_LANGUAGES.has(language)) return language;
  return 'eng+hin'; // Universal multi-language fallback
}

// 3. Comprehensive check for digital text versus legacy/corrupted fonts
export function needsOcrForDigitalText(text, fontNames = []) {
  if (!text || !text.trim()) return true;
  if (/[\uE000-\uF8FF\uFFF0-\uFFFF]/u.test(text)) return true;
  
  if (Array.isArray(fontNames) && fontNames.some(name => /kruti|devlys|chanakya|walkman|shusha|shivaji|shree|akruti|aps|dvb-|shruti|speed/i.test(name))) {
    return true;
  }
  
  const legacyPattern = /\b[a-z]+;[a-z]*\b|iV~Vk|fnukad|vkRet|fuoklh/i;
  if (legacyPattern.test(text)) return true;

  return false;
}

// 4. Main OCR & Layout Processing Engine with Strict Number Safety
export function createPdfOcr({ assetBase, language, signal, onProgress }) {
  let worker;
  let starting;
  let disposed = false;
  let currentLabel = '';
  
  const check = () => { 
    if (disposed || signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError'); 
  };
  
  const task = operation => runConversionTask(operation, { 
    signal, 
    timeout: 180000, 
    message: 'Text recognition took too long. Try a clearer scan or a smaller PDF.' 
  });
  
  const stop = () => { 
    disposed = true; 
    void worker?.terminate(); 
  };
  
  signal?.addEventListener('abort', stop, { once: true });

  async function recognize(canvas, scale, pageNumber, pageCount) {
    check();
    const label = `Reading scanned text on page ${pageNumber} of ${pageCount}`;
    currentLabel = label;
    
    const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;

    if (!starting) {
      onProgress('Preparing text recognition on your device…');
      starting = (async () => {
        const { default: Tesseract } = await import('tesseract.js/dist/tesseract.esm.min.js');
        const lang = resolveOcrLanguage(language);
        
        const instance = await Tesseract.createWorker(lang, 1, {
          workerPath: `${assetBase}worker.min.js`, 
          corePath: `${assetBase}core`, 
          langPath: `${assetBase}languages`,
          workerBlobURL: false, 
          cacheMethod: 'none', 
          gzip: true,
          logger: event => {
            if (!disposed && !signal?.aborted) {
              onProgress(event.status === 'recognizing text' ? `${currentLabel}… ${Math.round(event.progress * 100)}%` : 'Loading text recognition…');
            }
          },
          errorHandler: () => {},
        });
        
        if (disposed || signal?.aborted) { 
          await instance.terminate(); 
          check(); 
        }
        
        worker = instance;
        await instance.setParameters({ 
          tessedit_pageseg_mode: '3', 
          preserve_interword_spaces: '1', 
          user_defined_dpi: String(Math.round(safeScale * 72)) 
        });
        
        return instance;
      })();
    }

    const instance = await task(() => starting);
    onProgress(`${label}…`);
    
    const { data } = await task(() => instance.recognize(canvas, {}, { text: true, blocks: true }));
    check();
    
    const items = [];
    const erase = [];
    const context = canvas.getContext('2d');
    
    for (const block of data.blocks || []) {
      for (const paragraph of block.paragraphs || []) {
        for (const line of paragraph.lines || []) {
          let rawWords = (line.words || []).filter(word => 
            word && word.text && word.text.trim() && 
            Number.isFinite(word.bbox?.x1) && Number.isFinite(word.bbox?.x0) && 
            word.bbox.x1 > word.bbox.x0 && word.bbox.y1 > word.bbox.y0
          );
          if (!rawWords.length) continue;

          rawWords.sort((a, b) => a.bbox.x0 - b.bbox.x0);

          const words = [];
          let lastRight = -1;
          for (const w of rawWords) {
            if (w.bbox.x0 >= lastRight - 2) { 
              words.push(w);
              lastRight = w.bbox.x1;
            }
          }
          if (!words.length) continue;

          // Safe size calculations with fail-safes against NaN/Infinity
          const lineY0 = Number.isFinite(line.bbox?.y0) ? line.bbox.y0 : 0;
          const lineY1 = Number.isFinite(line.bbox?.y1) ? line.bbox.y1 : lineY0 + 20;
          let rawSize = (lineY1 - lineY0) / safeScale / 0.75;
          let size = Number.isFinite(rawSize) ? Math.max(8, Math.min(14, rawSize)) : 10; 

          const text = sanitizeText(words.map(word => word.text.trim()).join(' '));
          if (!text) continue;

          const isIndicScript = /[\u0900-\u0D7F]/u.test(text);
          context.font = `${size}px ${isIndicScript ? '"Nirmala UI", "Shruti", "Arial"' : 'Arial'}`;

          const measured = context.measureText(text).width;
          const lineX0 = Number.isFinite(line.bbox?.x0) ? line.bbox.x0 : words[0].bbox.x0;
          const lineX1 = Number.isFinite(line.bbox?.x1) ? line.bbox.x1 : words[words.length - 1].bbox.x1;
          const width = (lineX1 - lineX0) / safeScale;
          
          if (Number.isFinite(measured) && measured > 0 && Number.isFinite(width) && width > 0) {
            const calculatedSize = (size * width) / measured;
            if (Number.isFinite(calculatedSize)) {
              size = Math.max(8, Math.min(14, calculatedSize));
            }
          }

          const baselineVal = Number.isFinite(line.baseline?.y0) ? line.baseline.y0 : lineY1;
          const startX = Number.isFinite(words[0].bbox?.x0) ? words[0].bbox.x0 : lineX0;
          
          const safeX = Number.isFinite(startX / safeScale) ? startX / safeScale : 0;
          const safeBaseline = Number.isFinite(baselineVal / safeScale) ? baselineVal / safeScale : 10;

          const runs = words.map((word, index) => {
            const pixels = wordPixels(context, word.bbox);
            if (pixels) erase.push(pixels);
            return { 
              text: sanitizeText(word.text.trim()) + (index < words.length - 1 ? ' ' : ''), 
              color: pixels?.color || '000000' 
            };
          });

          items.push({
            str: text,
            runs,
            size,
            width: Number.isFinite(width) ? width : 100,
            transform: [size, 0, 0, -size, safeX, safeBaseline],
            font: { name: isIndicScript ? 'Nirmala UI' : 'Arial' },
            style: {},
            dir: paragraph.is_ltr === false ? 'rtl' : 'ltr',
          });
        }
      }
    }

    for (const pixels of erase) {
      if (Number.isFinite(pixels.x) && Number.isFinite(pixels.y) && Number.isFinite(pixels.width) && Number.isFinite(pixels.height)) {
        context.fillStyle = `#${pixels.background}`;
        context.fillRect(pixels.x, pixels.y, pixels.width, pixels.height);
      }
    }
    
    return items.length ? items : null;
  }

  return { 
    recognize, 
    async dispose() {
      signal?.removeEventListener('abort', stop);
      stop();
      await worker?.terminate();
    } 
  };
}