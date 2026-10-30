export const COMPRESSION_PRESETS = {
  exact: {
    id: 'exact',
    label: 'Exact quality',
    description: 'Keeps selectable text, links, vectors and original page content.',
    detail: 'Best quality · modest reduction',
    preservesStructure: true,
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    description: 'Keeps pages crisp for screens and everyday sharing.',
    detail: 'Clear quality · smaller file',
    scale: 1.75,
    quality: 0.86,
    preservesStructure: false,
  },
  smallest: {
    id: 'smallest',
    label: 'Smallest file',
    description: 'Uses stronger image compression for email and storage.',
    detail: 'Good quality · strongest reduction',
    scale: 1.25,
    quality: 0.68,
    preservesStructure: false,
  },
  target: {
    id: 'target',
    label: 'Custom target size',
    description: 'Enter the approximate KB or MB size you need.',
    detail: 'Best quality that fits your target',
    preservesStructure: false,
  },
};

const TARGET_PROFILES = [
  { scale: 2, quality: 0.9 },
  { scale: 1.75, quality: 0.84 },
  { scale: 1.5, quality: 0.76 },
  { scale: 1.25, quality: 0.66 },
  { scale: 1, quality: 0.55 },
  { scale: 0.8, quality: 0.42 },
  { scale: 0.65, quality: 0.32 },
];

function abortError() {
  return new DOMException('Compression cancelled.', 'AbortError');
}

function baseName(name) {
  return name.replace(/\.pdf$/i, '').trim() || 'document';
}

export function compressedPdfFilename(name) {
  return `${baseName(name)}-compressed.pdf`;
}

export function reductionPercent(originalSize, outputSize) {
  if (!originalSize || outputSize >= originalSize) return 0;
  return Math.max(1, Math.round((1 - outputSize / originalSize) * 100));
}

async function createRasterPdf(PDFDocument, pageCount, renderPage, profile, { signal, onProgress, attempt }) {
  const output = await PDFDocument.create();
  output.setProducer('We Make PDF');
  output.setCreator('We Make PDF Compress PDF');
  for (let number = 1; number <= pageCount; number++) {
    if (signal?.aborted) throw abortError();
    onProgress(`${attempt ? `${attempt}: ` : ''}compressing page ${number} of ${pageCount}...`);
    const rendered = await renderPage(number, {
      scale: profile.scale,
      format: 'jpg',
      quality: profile.quality,
      renderSignal: signal,
    });
    const image = await output.embedJpg(await rendered.blob.arrayBuffer());
    const page = output.addPage([rendered.width / profile.scale, rendered.height / profile.scale]);
    page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  return output.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 20 });
}

export async function compressPdfFile(file, presetId, { pageCount, renderPage, targetBytes, onProgress = () => {}, signal } = {}) {
  const preset = COMPRESSION_PRESETS[presetId];
  if (!preset) throw new Error('Choose a valid compression quality.');
  const sourceBytes = new Uint8Array(await file.arrayBuffer());
  if (signal?.aborted) throw abortError();
  const { PDFDocument } = await import('pdf-lib');

  let candidateBytes;
  if (preset.preservesStructure) {
    onProgress('Optimizing PDF objects without changing page content...');
    const source = await PDFDocument.load(sourceBytes, { ignoreEncryption: false, updateMetadata: false });
    candidateBytes = await source.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 20 });
  } else if (presetId === 'target') {
    if (!Number.isFinite(targetBytes) || targetBytes < 50 * 1024) throw new Error('Enter a target size of at least 50 KB.');
    if (!pageCount || typeof renderPage !== 'function') throw new Error('Open the PDF preview before compressing it.');
    if (sourceBytes.length <= targetBytes) {
      candidateBytes = sourceBytes;
    } else {
      let low = 0;
      let high = TARGET_PROFILES.length - 1;
      let bestUnder;
      let smallest;
      let attemptNumber = 0;
      while (low <= high) {
        const index = Math.floor((low + high) / 2);
        attemptNumber++;
        const bytes = await createRasterPdf(PDFDocument, pageCount, renderPage, TARGET_PROFILES[index], {
          signal,
          onProgress,
          attempt: `Target-size pass ${attemptNumber}`,
        });
        if (!smallest || bytes.length < smallest.length) smallest = bytes;
        if (bytes.length <= targetBytes) {
          bestUnder = bytes;
          high = index - 1;
        } else {
          low = index + 1;
        }
      }
      candidateBytes = bestUnder || smallest;
    }
  } else {
    if (!pageCount || typeof renderPage !== 'function') throw new Error('Open the PDF preview before compressing it.');
    candidateBytes = await createRasterPdf(PDFDocument, pageCount, renderPage, preset, { signal, onProgress });
    onProgress('Finishing your compressed PDF...');
  }

  if (signal?.aborted) throw abortError();
  const changed = candidateBytes.length < sourceBytes.length;
  const finalBytes = changed ? candidateBytes : sourceBytes;
  return {
    blob: new Blob([finalBytes], { type: 'application/pdf' }),
    originalSize: sourceBytes.length,
    outputSize: finalBytes.length,
    pageCount,
    reduction: reductionPercent(sourceBytes.length, finalBytes.length),
    changed,
    preservesStructure: changed ? preset.preservesStructure : true,
    targetBytes: presetId === 'target' ? targetBytes : undefined,
    metTarget: presetId === 'target' ? finalBytes.length <= targetBytes : undefined,
  };
}
