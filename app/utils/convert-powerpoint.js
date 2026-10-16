import { runConversionTask } from './conversion-task.js';

const MAX_SLIDES = 100;

function abortError() {
  return new DOMException('Conversion cancelled.', 'AbortError');
}

export async function openPowerpointPresentation(file, { signal, onProgress = () => {} } = {}) {
  const task = (operation, timeout = 45_000) => runConversionTask(operation, { signal, timeout });
  let renderer;
  let closed = false;

  const check = () => {
    if (closed || signal?.aborted) throw abortError();
  };

  try {
    onProgress('Reading PowerPoint presentation…');
    const { PptxRenderer, exportToPdf } = await task(() => import('pptx-browser'), 30_000);
    check();

    const data = await task(() => file.arrayBuffer(), 20_000);
    check();

    renderer = new PptxRenderer();
    await task(() => renderer.load(data, (pct, msg) => {
      if (!closed && !signal?.aborted) {
        onProgress(msg || `Loading presentation… ${Math.round(pct * 100)}%`);
      }
    }), 45_000);
    check();

    const slideCount = renderer.slideCount;
    if (!slideCount || slideCount < 1) {
      throw new Error('We couldn’t find any slides in this presentation. Please choose a valid .pptx file.');
    }
    if (slideCount > MAX_SLIDES) {
      throw new Error(`This presentation has ${slideCount} slides. Please choose a presentation with up to 100 slides.`);
    }

    async function renderSlidePreview(slideIndex, { maxDimension = 360, renderSignal } = {}) {
      check();
      if (renderSignal?.aborted) throw abortError();

      const { cx, cy } = renderer.slideSize;
      const aspect = cy / cx;
      const width = Math.min(maxDimension, 480);
      const height = Math.round(width * aspect);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      await task(() => renderer.renderSlide(slideIndex, canvas, width), 25_000);
      if (renderSignal?.aborted) throw abortError();

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Slide preview generation failed.')), 'image/jpeg', 0.85);
      });
      canvas.width = canvas.height = 0;
      return { blob, width, height };
    }

    async function convertToPdf({ dpi = 150, quality = 0.92, slides = null, onProgress: progressCb } = {}) {
      check();
      const bytes = await task(() => exportToPdf(renderer, {
        dpi,
        quality,
        slides,
        onProgress: progressCb,
      }), 120_000);
      check();
      return new Blob([bytes], { type: 'application/pdf' });
    }

    return {
      slideCount,
      slideSize: renderer.slideSize,
      renderSlidePreview,
      convertToPdf,
      close() {
        if (closed) return;
        closed = true;
        try {
          renderer.destroy();
        } catch {}
      },
    };
  } catch (err) {
    if (renderer) {
      try { renderer.destroy(); } catch {}
    }
    if (signal?.aborted) throw abortError();
    throw err;
  }
}

