import { constants } from 'node:fs';
import { copyFile, mkdir, open, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { defineNuxtModule } from '@nuxt/kit';

const ASSET_SCHEMA = '2';
const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

async function sameSize(source: string, target: string) {
  try {
    const [sourceInfo, targetInfo] = await Promise.all([stat(source), stat(target)]);
    return sourceInfo.size === targetInfo.size;
  } catch (error: any) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function replaceFile(source: string, target: string) {
  if (await sameSize(source, target)) return;
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await copyFile(source, temporary, constants.COPYFILE_EXCL);
    await unlink(target).catch((error: any) => {
      if (error?.code !== 'ENOENT') throw error;
    });
    await rename(temporary, target);
  } finally {
    await unlink(temporary).catch((error: any) => {
      if (error?.code !== 'ENOENT') throw error;
    });
  }
}

export async function syncDirectory(source: string, target: string) {
  await mkdir(target, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const sourcePath = join(source, entry.name);
    const targetPath = join(target, entry.name);
    if (entry.isDirectory()) await syncDirectory(sourcePath, targetPath);
    else if (entry.isFile()) await replaceFile(sourcePath, targetPath);
  }
}

async function markerMatches(marker: string, identity: string) {
  try {
    return (await readFile(marker, 'utf8')) === identity;
  } catch (error: any) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function writeMarker(marker: string, identity: string) {
  const temporary = `${marker}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, identity, 'utf8');
  await unlink(marker).catch((error: any) => {
    if (error?.code !== 'ENOENT') throw error;
  });
  await rename(temporary, marker);
}

export async function withAssetLock(publicDirectory: string, callback: () => Promise<void>) {
  await mkdir(publicDirectory, { recursive: true });
  const lockPath = join(publicDirectory, '.toolifybox-assets.lock');
  let handle;

  for (let attempt = 0; attempt < 1200; attempt++) {
    try {
      handle = await open(lockPath, 'wx');
      await handle.writeFile(`${process.pid}\n${new Date().toISOString()}\n`, 'utf8');
      break;
    } catch (error: any) {
      if (error?.code !== 'EEXIST') throw error;
      try {
        const lockInfo = await stat(lockPath);
        if (Date.now() - lockInfo.mtimeMs > 120_000) {
          await unlink(lockPath).catch((unlinkError: any) => {
            if (unlinkError?.code !== 'ENOENT') throw unlinkError;
          });
          continue;
        }
      } catch (statError: any) {
        if (statError?.code !== 'ENOENT') throw statError;
      }
      await wait(100);
    }
  }

  if (!handle) throw new Error('Timed out while preparing local PDF and OCR assets. Close duplicate build processes and try again.');
  try {
    await callback();
  } finally {
    await handle.close();
    await unlink(lockPath).catch((error: any) => {
      if (error?.code !== 'ENOENT') throw error;
    });
  }
}

// PDF fonts, character maps, image decoders, OCR workers and language models
// are served by this site. Versioned completion markers make repeat and
// concurrent Nuxt starts safe, including inside OneDrive-synced workspaces.
export default defineNuxtModule({
  meta: { name: 'local-pdf-assets' },
  async setup(_options, nuxt) {
    const require = createRequire(import.meta.url);
    const pdfSource = dirname(require.resolve('pdfjs-dist/package.json'));
    const pdfVersion = require('pdfjs-dist/package.json').version;
    const ocrSource = dirname(require.resolve('tesseract.js/package.json'));
    const ocrVersion = require('tesseract.js/package.json').version;
    const publicDirectory = join(nuxt.options.rootDir, 'public');
    const pdfTarget = join(publicDirectory, 'pdfjs', pdfVersion);
    const ocrTarget = join(publicDirectory, 'ocr', ocrVersion);
    const pdfIdentity = `pdfjs-${pdfVersion}-schema-${ASSET_SCHEMA}`;
    const ocrIdentity = `ocr-${ocrVersion}-eng-hin-guj-schema-${ASSET_SCHEMA}`;
    nuxt.options.runtimeConfig.public.ocrVersion = ocrVersion;

    await withAssetLock(publicDirectory, async () => {
      const pdfMarker = join(pdfTarget, '.complete');
      if (!await markerMatches(pdfMarker, pdfIdentity)) {
        for (const directory of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
          await syncDirectory(join(pdfSource, directory), join(pdfTarget, directory));
        }
        await writeMarker(pdfMarker, pdfIdentity);
      }

      const ocrMarker = join(ocrTarget, '.complete');
      if (!await markerMatches(ocrMarker, ocrIdentity)) {
        await replaceFile(join(ocrSource, 'dist', 'worker.min.js'), join(ocrTarget, 'worker.min.js'));
        await replaceFile(join(ocrSource, 'dist', 'worker.min.js.LICENSE.txt'), join(ocrTarget, 'worker.min.js.LICENSE.txt'));

        const core = dirname(require.resolve('tesseract.js-core/package.json'));
        for (const file of await readdir(core)) {
          if (/^tesseract-core.*-lstm\.(?:wasm|wasm\.js)$/.test(file) || file === 'LICENSE') {
            await replaceFile(join(core, file), join(ocrTarget, 'core', file));
          }
        }
        for (const language of ['eng', 'hin', 'guj']) {
          const model = dirname(require.resolve(`@tesseract.js-data/${language}/package.json`));
          await replaceFile(join(model, '4.0.0_best_int', `${language}.traineddata.gz`), join(ocrTarget, 'languages', `${language}.traineddata.gz`));
        }
        await writeMarker(ocrMarker, ocrIdentity);
      }
    });
  },
});
