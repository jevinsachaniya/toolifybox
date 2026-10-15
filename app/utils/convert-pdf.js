import { runConversionTask } from './conversion-task.js';
import { editableItems, paintedCharacters, wordFont } from './pdf-text.js';
import { createPdfOcr } from './pdf-ocr.js';

const MAX_PAGES = 100;
const MAX_IMAGE_BYTES = 100 * 1024 * 1024;
const twips = value => Math.round(value * 20);

export async function convertPdf(file, { mode = 'editable', ocrLanguage = 'eng+hin', signal, onProgress = () => {} } = {}) {
  const config = useRuntimeConfig();
  const baseURL = config.app.baseURL;
  const ocr = createPdfOcr({ assetBase: new URL(`${baseURL}ocr/${config.public.ocrVersion}/`, window.location.origin).href, language: ocrLanguage, signal, onProgress });
  let loading;
  let rendering;
  let canvas;
  const check = () => { if (signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError'); };
  const task = (operation, timeout = 45000) => runConversionTask(operation, { signal, timeout });
  const abort = () => { rendering?.cancel(); void loading?.destroy().catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  try {
    check();
    onProgress('Loading the PDF converter…');
    const [pdfjs, word, { default: workerUrl }] = await task(() => Promise.all([
      import('pdfjs-dist/build/pdf.mjs'), import('docx'), import('pdfjs-dist/build/pdf.worker.mjs?url'),
    ]));
    check();
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const data = new Uint8Array(await task(() => file.arrayBuffer()));
    if (!new TextDecoder('latin1').decode(data.subarray(0, 1024)).includes('%PDF-')) {
      throw new Error('This file is not a valid PDF. Please choose the original PDF document.');
    }
    const assets = `${baseURL}pdfjs/${pdfjs.version}/`;
    loading = pdfjs.getDocument({
      data, cMapUrl: `${assets}cmaps/`, cMapPacked: true,
      standardFontDataUrl: `${assets}standard_fonts/`, wasmUrl: `${assets}wasm/`, iccUrl: `${assets}iccs/`,
      isEvalSupported: false, stopAtErrors: true, fontExtraProperties: true,
      enableXfa: true, verbosity: 0,
    });
    // Password entry is deliberately unsupported; never leave the worker waiting for it.
    let rejectPassword;
    const passwordRequired = new Promise((_resolve, reject) => { rejectPassword = reject; });
    loading.onPassword = () => rejectPassword(new Error('Password-protected PDFs are not supported. Save an unlocked copy and try again.'));
    let pdf;
    try { pdf = await task(() => Promise.race([loading.promise, passwordRequired])); }
    catch (error) {
      if (signal?.aborted) check();
      if (/password|destroyed/i.test(error.message) || error.name === 'PasswordException') {
        throw new Error('Password-protected PDFs are not supported. Save an unlocked copy and try again.');
      }
      throw error;
    }
    if (pdf.isPureXfa) throw new Error('This PDF contains a dynamic XFA form. Print or flatten it to a standard PDF before converting.');
    if (!pdf.numPages || pdf.numPages > MAX_PAGES) throw new Error('Choose a PDF with 1 to 100 pages. Split a longer PDF before converting.');
    const sections = [];
    let imageBytes = 0;
    let editablePages = 0;
    let imagePages = 0;
    let ocrPages = 0;
    let ocrCount = 0;
    for (let number = 1; number <= pdf.numPages; number++) {
      check();
      onProgress(`Converting page ${number} of ${pdf.numPages}…`);
      const page = await task(() => pdf.getPage(number));
      const viewport = page.getViewport({ scale: 1 });
      const { width, height } = viewport;
      if (![width, height].every(value => Number.isFinite(value) && value >= 72 && value <= 1584)) {
        throw new Error('This PDF has a page size outside Word’s supported range (1 to 22 inches).');
      }
      const scale = Math.min(2, 2600 / Math.max(width, height));
      const scaled = page.getViewport({ scale });
      canvas = document.createElement('canvas');
      canvas.width = Math.ceil(scaled.width);
      canvas.height = Math.ceil(scaled.height);
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('Your browser could not create a page image. Try a smaller PDF.');
      const render = async filter => {
        check();
        rendering = page.render({ canvasContext: context, viewport: scaled, background: '#ffffff',
          annotationMode: pdfjs.AnnotationMode.ENABLE_STORAGE,
          operationsFilter: filter,
        });
        await task(() => rendering.promise, 60000);
        rendering = undefined;
      };
      await render();
      let items;
      let list;
      if (mode === 'editable') {
        const [content, operators, annotations] = await task(() => Promise.all([
          page.getTextContent(), page.getOperatorList(), page.getAnnotations(),
        ]));
        list = operators;
        items = editableItems(content, paintedCharacters(list, pdfjs.OPS));
        // Ordinary graphic clipping is common in PDFs and does not make text uneditable.
        // Visible annotations need OCR as their text is outside getTextContent().
        if (annotations.some(annotation => annotation.subtype !== 'Link')) items = null;
        if (items) {
          items = items.map(item => {
            const transform = pdfjs.Util.transform(viewport.transform, item.transform);
            const font = page.commonObjs.has(item.fontName) ? page.commonObjs.get(item.fontName) : {};
            const style = content.styles[item.fontName] || {};
            const size = Math.hypot(transform[2], transform[3]);
            return { ...item, font, style, transform, size };
          });
          if (items.some(item => item.font.isType3Font || item.style.vertical || item.dir === 'ttb' ||
            Math.abs(item.transform[1]) > .01 || Math.abs(item.transform[2]) > .01 || item.transform[0] <= 0 ||
            !Number.isFinite(item.size) || item.size < 1 || item.size > 300 || item.width <= 0 ||
            item.transform[4] < 0 || item.transform[4] >= width || item.transform[5] < 0 || item.transform[5] > height)) items = null;
        }
      }
      const paragraphs = [];
      let recognized = false;
      if (mode === 'editable' && !items) {
        if (++ocrCount > 30) throw new Error('This PDF needs OCR on more than 30 pages. Split it into smaller documents before converting.');
        items = await ocr.recognize(canvas, scale, number, pdf.numPages);
        if (items) { recognized = true; ocrPages++; }
      }
      if (items) {
        // Render only graphics as the background. The same text is re-created as Word runs.
        if (!recognized) await render((index, operators) => operators.fnArray[index] !== pdfjs.OPS.showText);
        editablePages++;
        for (const item of items) {
          const [,,,, x, baseline] = item.transform;
          const font = wordFont(item.font.name, item.font.fallbackName || item.style.fontFamily);
          const fontSize = Math.round(item.size * 2) / 2;
          // Word's exact-height line box includes leading above the glyphs.
          const top = Math.max(0, baseline - fontSize * .92);
          paragraphs.push(new word.Paragraph({
            run: { font, size: fontSize * 2, color: item.runs[0].color },
            frame: { type: 'absolute', position: { x: twips(x), y: twips(top) },
              width: twips(Math.max(1, Math.min(width - x, item.width + 6))),
              anchor: { horizontal: word.FrameAnchorType.PAGE, vertical: word.FrameAnchorType.PAGE },
              wrap: word.FrameWrap.NONE, space: { horizontal: 0, vertical: 0 },
            },
            spacing: { before: 0, after: 0, line: twips(fontSize * 1.15), lineRule: word.LineRuleType.EXACT },
            bidirectional: item.dir === 'rtl',
            children: item.runs.map(run => new word.TextRun({
              text: run.text, color: run.color, size: fontSize * 2, sizeComplexScript: fontSize * 2,
              font: recognized && /[\u0900-\u097F]/u.test(run.text) ? 'Nirmala UI' : font,
              bold: item.font.bold || /bold/i.test(item.font.name || ''),
              italics: item.font.italic || /italic|oblique/i.test(item.font.name || ''),
              rightToLeft: item.dir === 'rtl',
            })),
          }));
        }
      } else imagePages++;
      const png = await task(() => new Promise((resolve, reject) => canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('A PDF page could not be rendered. Try a smaller file.')), 'image/png')));
      imageBytes += png.size;
      if (imageBytes > MAX_IMAGE_BYTES) throw new Error('The converted pages are too large for this browser. Split the PDF into smaller documents.');
      const image = new word.ImageRun({ type: 'png', data: new Uint8Array(await task(() => png.arrayBuffer())),
        transformation: { width: width * 96 / 72, height: height * 96 / 72 },
        altText: { title: `PDF page ${number}`, description: items ? 'Original PDF graphics behind editable text' : 'Original PDF page, preserved as an image', name: `Page ${number}` },
        floating: { horizontalPosition: { relative: word.HorizontalPositionRelativeFrom.PAGE, offset: 0 },
          verticalPosition: { relative: word.VerticalPositionRelativeFrom.PAGE, offset: 0 },
          behindDocument: true, allowOverlap: true, lockAnchor: true,
          wrap: { type: word.TextWrappingType.NONE },
        },
      });
      sections.push({ properties: { type: word.SectionType.NEXT_PAGE,
        page: { size: { width: twips(Math.min(width, height)), height: twips(Math.max(width, height)),
          orientation: width > height ? word.PageOrientation.LANDSCAPE : word.PageOrientation.PORTRAIT },
          margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0 },
        },
      }, children: [new word.Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: word.LineRuleType.EXACT }, children: [image] }), ...paragraphs] });
      canvas.width = canvas.height = 0;
      canvas = undefined;
      page.cleanup();
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    check();
    if (mode === 'editable' && !editablePages) throw new Error('No readable text was found, even after OCR. Try a clearer scan and check the scan language. Choose Page images only if you want pictures inside Word.');
    onProgress('Creating your Word document…');
    const wordDocument = new word.Document({ creator: 'Toolifybox', title: file.name.replace(/\.pdf$/i, ''),
      description: mode === 'appearance' ? 'PDF pages preserved as images.' : 'Editable Word text with PDF graphics. Scanned pages recognized using OCR; proofread recognized text.',
      styles: { default: { document: { run: { font: 'Arial', size: 22 }, paragraph: { spacing: { before: 0, after: 0 } } } } },
      sections,
    });
    const blob = await task(() => word.Packer.toBlob(wordDocument), 60000);
    check();
    return { blob, pageCount: pdf.numPages, editablePages, imagePages, ocrPages, mode };
  } catch (error) {
    if (signal?.aborted) check();
    if (error.name === 'InvalidPDFException') throw new Error('This PDF is damaged or unreadable. Open it in a PDF viewer and save a new copy.');
    throw error;
  } finally {
    signal?.removeEventListener('abort', abort);
    rendering?.cancel();
    if (canvas) canvas.width = canvas.height = 0;
    await ocr.dispose();
    await loading?.destroy().catch(() => {});
  }
}
