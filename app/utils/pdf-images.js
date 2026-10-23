import { runConversionTask } from './conversion-task.js';

const MAX_PAGES = 450;
const MAX_RENDER_PIXELS = 40_000_000;

function abortError() {
  return new DOMException('Conversion cancelled.', 'AbortError');
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => canvas.toBlob(
    blob => blob ? resolve(blob) : reject(new Error('The browser could not create this page image. Try a lower resolution.')),
    type,
    quality,
  ));
}

export async function openPdfForImages(file, { signal, onProgress = () => {} } = {}) {
  const config = useRuntimeConfig();
  const baseURL = config.app.baseURL;
  const task = (operation, timeout = 45_000) => runConversionTask(operation, { signal, timeout });
  let loading;
  let closed = false;

  const check = () => {
    if (closed || signal?.aborted) throw abortError();
  };
  const abort = () => { void loading?.destroy().catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });

  try {
    onProgress('Opening your PDF…');
    const [pdfjs, { default: workerUrl }] = await task(() => Promise.all([
      import('pdfjs-dist/build/pdf.mjs'),
      import('pdfjs-dist/build/pdf.worker.mjs?url'),
    ]));
    check();
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const data = new Uint8Array(await task(() => file.arrayBuffer()));
    if (!new TextDecoder('latin1').decode(data.subarray(0, 1024)).includes('%PDF-')) {
      throw new Error('This file is not a valid PDF. Please choose the original PDF document.');
    }
    const assets = `${baseURL}pdfjs/${pdfjs.version}/`;
    loading = pdfjs.getDocument({
      data,
      cMapUrl: `${assets}cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `${assets}standard_fonts/`,
      wasmUrl: `${assets}wasm/`,
      iccUrl: `${assets}iccs/`,
      isEvalSupported: false,
      stopAtErrors: true,
      enableXfa: true,
      verbosity: 0,
    });
    let rejectPassword;
    const passwordRequired = new Promise((_resolve, reject) => { rejectPassword = reject; });
    loading.onPassword = () => rejectPassword(new Error('Password-protected PDFs are not supported. Save an unlocked copy and try again.'));
    let pdf;
    try {
      pdf = await task(() => Promise.race([loading.promise, passwordRequired]));
    } catch (error) {
      if (signal?.aborted) throw abortError();
      if (/password|destroyed/i.test(error.message) || error.name === 'PasswordException') {
        throw new Error('Password-protected PDFs are not supported. Save an unlocked copy and try again.');
      }
      throw error;
    }
    if (pdf.isPureXfa) throw new Error('This PDF contains a dynamic XFA form. Print or flatten it before converting.');
    if (!pdf.numPages || pdf.numPages > MAX_PAGES) throw new Error('Choose a PDF with 1 to 450 pages. Split a longer PDF before converting.');

    async function renderPage(number, { scale = 2, maxDimension, format = 'png', quality = 0.92, renderSignal } = {}) {
      check();
      if (renderSignal?.aborted) throw abortError();
      const page = await task(() => pdf.getPage(number));
      let canvas;
      let rendering;
      const cancelRender = () => rendering?.cancel();
      renderSignal?.addEventListener('abort', cancelRender, { once: true });
      try {
        const baseViewport = page.getViewport({ scale: 1 });
        const renderScale = maxDimension
          ? Math.min(1, maxDimension / Math.max(baseViewport.width, baseViewport.height))
          : Number(scale);
        const viewport = page.getViewport({ scale: renderScale });
        const width = Math.ceil(viewport.width);
        const height = Math.ceil(viewport.height);
        if (!Number.isFinite(width * height) || width * height > MAX_RENDER_PIXELS) {
          throw new Error('This page is too large at the selected resolution. Choose Standard or High resolution.');
        }
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('Your browser could not create a page image. Try a smaller PDF.');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        rendering = page.render({ canvasContext: context, viewport, background: '#ffffff' });
        await task(() => rendering.promise, 60_000);
        if (renderSignal?.aborted) throw abortError();
        const type = format === 'jpg' ? 'image/jpeg' : 'image/png';
        const blob = await task(() => canvasBlob(canvas, type, quality));
        return { blob, width, height };
      } catch (error) {
        if (renderSignal?.aborted || error?.name === 'RenderingCancelledException') throw abortError();
        throw error;
      } finally {
        renderSignal?.removeEventListener('abort', cancelRender);
        if (canvas) canvas.width = canvas.height = 0;
        page.cleanup();
      }
    }

    return {
      pageCount: pdf.numPages,
      renderPage,
      async close() {
        if (closed) return;
        closed = true;
        signal?.removeEventListener('abort', abort);
        await loading.destroy().catch(() => {});
      },
    };
  } catch (error) {
    signal?.removeEventListener('abort', abort);
    await loading?.destroy().catch(() => {});
    if (signal?.aborted) throw abortError();
    if (error.name === 'InvalidPDFException') throw new Error('This PDF is damaged or unreadable. Open it in a PDF viewer and save a new copy.');
    throw error;
  }
}

export function pdfPageImageFilename(name, page, total, format) {
  const base = name.replace(/\.pdf$/i, '') || 'document';
  const digits = Math.max(2, String(total).length);
  return `${base}-page-${String(page).padStart(digits, '0')}.${format === 'jpg' ? 'jpg' : 'png'}`;
}

export function pdfImagesArchiveFilename(name) {
  return `${name.replace(/\.pdf$/i, '') || 'document'}-images.zip`;
}

export function pdfJpgArchiveFilename(name) {
  return `${name.replace(/\.pdf$/i, '') || 'document'}-jpg.zip`;
}

