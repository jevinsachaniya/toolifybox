import { runConversionTask } from './conversion-task.js';
import { wordPixels } from './pdf-pixels.js';

export function createPdfOcr({ assetBase, language, signal, onProgress }) {
  let worker;
  let starting;
  let disposed = false;
  let currentLabel = '';
  const check = () => { if (disposed || signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError'); };
  const task = operation => runConversionTask(operation, { signal, timeout: 180000, message: 'Text recognition took too long. Try a clearer scan or a smaller PDF.' });
  const stop = () => { disposed = true; void worker?.terminate(); };
  signal?.addEventListener('abort', stop, { once: true });

  async function recognize(canvas, scale, pageNumber, pageCount) {
    check();
    const label = `Reading scanned text on page ${pageNumber} of ${pageCount}`;
    currentLabel = label;
    if (!starting) {
      onProgress('Preparing text recognition on your device…');
      starting = (async () => {
        const { default: Tesseract } = await import('tesseract.js/dist/tesseract.esm.min.js');
        check();
        const instance = await Tesseract.createWorker(language === 'eng' ? 'eng' : 'eng+hin', 1, {
          workerPath: `${assetBase}worker.min.js`, corePath: `${assetBase}core`, langPath: `${assetBase}languages`,
          workerBlobURL: false, cacheMethod: 'none', gzip: true,
          logger: event => {
            if (!disposed && !signal?.aborted) onProgress(event.status === 'recognizing text' ? `${currentLabel}… ${Math.round(event.progress * 100)}%` : 'Loading text recognition…');
          },
          errorHandler: () => {},
        });
        if (disposed || signal?.aborted) { await instance.terminate(); check(); }
        worker = instance;
        await instance.setParameters({ tessedit_pageseg_mode: '3', preserve_interword_spaces: '1', user_defined_dpi: String(Math.round(scale * 72)) });
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
    for (const block of data.blocks || []) for (const paragraph of block.paragraphs || []) for (const line of paragraph.lines || []) {
      const words = (line.words || []).filter(word => word.text.trim() && word.bbox.x1 > word.bbox.x0 && word.bbox.y1 > word.bbox.y0);
      if (!words.length) continue;
      let size = Math.max(4, Math.min(200, (line.bbox.y1 - line.bbox.y0) / scale / .75));
      const text = words.map(word => word.text.trim()).join(' ');
      context.font = `${size}px ${/[\u0900-\u097F]/u.test(text) ? '"Nirmala UI"' : 'Arial'}`;
      const measured = context.measureText(text).width;
      const width = (line.bbox.x1 - line.bbox.x0) / scale;
      // OCR line boxes can include leading; fit the font to the actual word width
      // so an original single line does not wrap over the graphics below it.
      if (measured > 0) size = Math.max(4, Math.floor(Math.min(size, size * width / measured) * 2) / 2);
      const baseline = Number.isFinite(line.baseline?.y0) ? line.baseline.y0 : line.bbox.y1;
      const runs = words.map((word, index) => {
        const pixels = wordPixels(context, word.bbox);
        if (pixels) erase.push(pixels);
        return { text: word.text.trim() + (index < words.length - 1 ? ' ' : ''), color: pixels?.color || '000000' };
      });
      items.push({ str: text, runs, size, width,
        transform: [size, 0, 0, -size, line.bbox.x0 / scale, baseline / scale],
        font: { name: 'Arial' }, style: {}, dir: paragraph.is_ltr === false ? 'rtl' : 'ltr',
      });
    }
    // Keep the page's non-text graphics behind real Word text, without duplicate scan text.
    for (const pixels of erase) {
      context.fillStyle = `#${pixels.background}`;
      context.fillRect(pixels.x, pixels.y, pixels.width, pixels.height);
    }
    return items.length ? items : null;
  }

  return { recognize, async dispose() {
    signal?.removeEventListener('abort', stop);
    stop();
    await worker?.terminate();
  } };
}
