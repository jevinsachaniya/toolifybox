import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function test() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([500, 500]);
  
  // Embed a 1x1 png image
  const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const pngImage = await pdfDoc.embedPng(pngBytes);
  page.drawImage(pngImage, {
    x: 50,
    y: 350,
    width: 80,
    height: 80,
  });

  page.drawText('Sample Text next to image', {
    x: 150,
    y: 390,
    size: 16,
    font,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  const loadingTask = pdfjs.getDocument({ data: pdfBytes });
  const loadedPdf = await loadingTask.promise;
  const p1 = await loadedPdf.getPage(1);
  const opList = await p1.getOperatorList();
  const viewport = p1.getViewport({ scale: 1.0 });

  console.log('Viewport width, height:', viewport.width, viewport.height);

  let currentTransform = [1, 0, 0, 1, 0, 0];
  const transformStack = [];

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const args = opList.argsArray[i];

    if (fn === pdfjs.OPS.save) {
      transformStack.push([...currentTransform]);
    } else if (fn === pdfjs.OPS.restore) {
      if (transformStack.length) currentTransform = transformStack.pop();
    } else if (fn === pdfjs.OPS.transform) {
      currentTransform = pdfjs.Util.transform(currentTransform, args);
    } else if (fn === pdfjs.OPS.paintImageXObject) {
      const imgName = args[0];
      const viewTrans = pdfjs.Util.transform(viewport.transform, currentTransform);
      const x = Math.max(0, viewTrans[4] || 0);
      const width = Math.abs(viewTrans[0] || 0);
      const height = Math.abs(viewTrans[3] || 0);
      const y = Math.max(0, (viewTrans[5] || 0) - height);

      console.log(`Image ${imgName} calculated position:`, { x, y, width, height });
    }
  }

  const imgObj = await new Promise((resolve) => {
    p1.objs.get('img_p0_1', (obj) => {
      resolve(obj);
    });
  });
  console.log('imgObj keys:', Object.keys(imgObj || {}));
  console.log('imgObj width, height, kind:', imgObj?.width, imgObj?.height, imgObj?.kind);
}

test();
