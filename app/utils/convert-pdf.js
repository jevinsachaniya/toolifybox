import { runConversionTask } from './conversion-task.js';
import { editableItems, paintedCharacters, wordFont } from './pdf-text.js';
import { createPdfOcr, needsOcrForDigitalText } from './pdf-ocr.js';

const MAX_PAGES = 100;
const MAX_IMAGE_BYTES = 100 * 1024 * 1024;
const twips = value => Math.round(value * 20);

/**
 * Consolidates fragmented text items on the same baseline into single coherent lines
 * so Microsoft Word does not generate overlapping, colliding absolute frame boxes.
 */
export function consolidateWordItems(rawItems, pageWidth = 612) {
  if (!rawItems?.length) return [];

  const mapped = rawItems.map(item => {
    const [,,,, x = 0, baseline = 0] = item.transform || [];
    const fontSize = Math.max(6, Math.min(120, Math.round((item.size || 12) * 2) / 2));
    const width = Math.max(item.width || 0, fontSize * (item.str?.length || 1) * 0.5);
    const text = (item.str || item.runs?.map(r => r.text).join('') || '').trim();
    return {
      ...item,
      x: Math.max(0, x),
      baseline: Math.max(0, baseline),
      fontSize,
      width,
      right: Math.max(0, x) + width,
      text,
      runs: item.runs?.length ? item.runs : [{ text: item.str || '', color: '000000' }],
    };
  }).filter(item => item.text.length > 0);

  if (!mapped.length) return [];

  // Sort items top-to-bottom (by baseline), then left-to-right (by x)
  mapped.sort((a, b) => {
    if (Math.abs(a.baseline - b.baseline) > 2.5) {
      return a.baseline - b.baseline;
    }
    return a.x - b.x;
  });

  // Group adjacent horizontal items into coherent lines
  const lines = [];
  for (const item of mapped) {
    let merged = false;
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 8); i--) {
      const line = lines[i];
      const baselineDiff = Math.abs(item.baseline - line.baseline);
      const fontSizeTol = Math.max(item.fontSize, line.fontSize);
      if (baselineDiff <= Math.max(3, fontSizeTol * 0.25)) {
        const gap = item.x - line.right;
        // Merge if gap is within normal word spacing or slightly overlapping
        if (gap >= -4 && gap <= Math.max(24, fontSizeTol * 1.8)) {
          if (gap > 1) {
            const lastRun = line.runs[line.runs.length - 1];
            if (lastRun && !lastRun.text.endsWith(' ') && !item.runs[0]?.text?.startsWith(' ')) {
              line.runs.push({ text: ' ', color: lastRun.color || '000000' });
            }
          }
          line.runs.push(...item.runs);
          line.right = Math.max(line.right, item.right);
          line.width = line.right - line.x;
          line.fontSize = Math.max(line.fontSize, item.fontSize);
          line.baseline = Math.max(line.baseline, item.baseline);
          line.str += (gap > 1 ? ' ' : '') + item.text;
          merged = true;
          break;
        }
      }
    }
    if (!merged) {
      lines.push({
        x: item.x,
        right: item.right,
        baseline: item.baseline,
        fontSize: item.fontSize,
        width: item.width,
        str: item.text,
        runs: [...item.runs],
        font: item.font || {},
        style: item.style || {},
        dir: item.dir || 'ltr',
      });
    }
  }

  return lines;
}

export async function convertPdf(file, { mode = 'editable', ocrLanguage = 'auto', signal, onProgress = () => {} } = {}) {
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

        // Recover original digital text when glyph matching fails on complex scripts (Hindi) or spaced text
        if (!items && content?.items?.length) {
          const textChars = content.items.reduce((sum, it) => sum + (it.str || '').trim().length, 0);
          if (textChars >= 10) {
            items = content.items
              .filter(item => item.str && item.str.trim())
              .map(item => {
                const transform = pdfjs.Util.transform(viewport.transform, item.transform);
                const font = page.commonObjs.has(item.fontName) ? page.commonObjs.get(item.fontName) : {};
                const style = content.styles[item.fontName] || {};
                const size = Math.hypot(transform[2], transform[3]) || item.height || 12;
                return {
                  ...item,
                  runs: [{ text: item.str, color: '000000' }],
                  font,
                  style,
                  transform,
                  size,
                  width: item.width || Math.max(10, size * item.str.length * 0.6),
                  dir: item.dir || 'ltr',
                };
              });
          }
        }

        // Keep a genuine Unicode text layer exactly as supplied, whatever its
        // language. OCR is only used for missing text or legacy/private-use
        // glyph encodings that Word cannot display correctly.
        if (content?.items?.length) {
          const sampleText = content.items.map(it => it.str || '').join(' ');
          const fontNames = Object.keys(content.styles || {});
          if (needsOcrForDigitalText(sampleText, fontNames)) items = null;
        }
      }

      const paragraphs = [];
      let recognized = false;
      if ((mode === 'editable' || mode === 'ocr') && !items) {
        if (++ocrCount > 30) throw new Error('This PDF needs OCR on more than 30 pages. Split it into smaller documents before converting.');
        items = await ocr.recognize(canvas, scale, number, pdf.numPages);
        if (items) { recognized = true; ocrPages++; }
      }
      if (items) {
        // Render only graphics as the background. Filter out all text operations to prevent double-text.
        const textOps = new Set([
          pdfjs.OPS.showText,
          pdfjs.OPS.showSpacedText,
          pdfjs.OPS.nextLineShowText,
          pdfjs.OPS.nextLineSetSpacingShowText,
        ]);
        await render((index, operators) => !textOps.has(operators.fnArray[index]));
        editablePages++;
        const consolidatedLines = consolidateWordItems(items, width);
        for (const line of consolidatedLines) {
          const x = line.x;
          const baseline = line.baseline;
          const fontSize = line.fontSize;
          const fullText = line.str || line.runs.map(r => r.text).join('');

          const hasIndic = /[\u0900-\u0D7F]/u.test(fullText);
          const hasArabic = /[\u0600-\u06FF\u0750-\u077F]/u.test(fullText);
          const isComplex = hasIndic || hasArabic;

          let fontDef;
          if (hasIndic) {
            fontDef = { name: 'Nirmala UI', cs: 'Nirmala UI', ascii: 'Nirmala UI', hAnsi: 'Nirmala UI' };
          } else if (hasArabic) {
            fontDef = { name: 'Traditional Arabic', cs: 'Traditional Arabic', ascii: 'Arial', hAnsi: 'Arial' };
          } else {
            const font = wordFont(line.font?.name, line.font?.fallbackName || line.style?.fontFamily, fullText);
            fontDef = { name: font, cs: 'Mangal', ascii: font, hAnsi: font };
          }

          const top = Math.max(0, baseline - fontSize * (isComplex ? 1.2 : 0.92));
          const availableWidth = width - x;
          const extraPadding = isComplex ? Math.max(28, fontSize * 2.2) : Math.max(22, fontSize * 1.6);
          const frameWidth = twips(Math.max(10, Math.min(availableWidth, line.width + extraPadding)));

          paragraphs.push(new word.Paragraph({
            run: {
              font: fontDef,
              size: fontSize * 2,
              sizeComplexScript: fontSize * 2,
              color: line.runs[0]?.color || '000000',
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
            bidirectional: line.dir === 'rtl' || hasArabic,
            children: line.runs.map(run => {
              const runText = run.text;
              const runIndic = /[\u0900-\u0D7F]/u.test(runText);
              const runArabic = /[\u0600-\u06FF\u0750-\u077F]/u.test(runText);
              let runFont = fontDef;
              if (runIndic) {
                runFont = { name: 'Nirmala UI', cs: 'Nirmala UI', ascii: 'Nirmala UI', hAnsi: 'Nirmala UI' };
              } else if (runArabic) {
                runFont = { name: 'Traditional Arabic', cs: 'Traditional Arabic', ascii: 'Arial', hAnsi: 'Arial' };
              }
              return new word.TextRun({
                text: runText,
                color: run.color || '000000',
                size: fontSize * 2,
                sizeComplexScript: fontSize * 2,
                font: runFont,
                bold: line.font?.bold || /bold/i.test(line.font?.name || ''),
                italics: line.font?.italic || /italic|oblique/i.test(line.font?.name || ''),
                rightToLeft: line.dir === 'rtl' || hasArabic,
              });
            }),
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
    if ((mode === 'editable' || mode === 'ocr') && !editablePages) throw new Error('No readable text was found, even after OCR. Try a clearer scan and check the scan language. Choose Page images only if you want pictures inside Word.');
    onProgress('Creating your Word document…');
    const wordDocument = new word.Document({ creator: 'Toolifybox', title: file.name.replace(/\.pdf$/i, ''),
      description: mode === 'appearance' ? 'PDF pages preserved as images.' : 'Editable Word text with PDF graphics. Scanned pages recognized using OCR; proofread recognized text.',
      styles: {
        default: {
          document: {
            run: {
              font: { name: 'Arial', cs: 'Mangal', ascii: 'Arial', hAnsi: 'Arial' },
              size: 22,
              sizeComplexScript: 22,
            },
            paragraph: { spacing: { before: 0, after: 0 } },
          },
        },
      },
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
