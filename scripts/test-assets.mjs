import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { syncDirectory, withAssetLock } from '../modules/pdf-assets.ts';

const workspace = await mkdtemp(join(tmpdir(), 'wemakepdf-assets-'));
assert.ok(resolve(workspace).startsWith(resolve(tmpdir())), 'Temporary test directory escaped the OS temp directory');

try {
  const source = join(workspace, 'source');
  const target = join(workspace, 'public', 'pdfjs', 'test');
  const publicDirectory = join(workspace, 'public');
  await mkdir(join(source, 'nested'), { recursive: true });
  const expected = new Map();
  for (let index = 0; index < 40; index++) {
    const relative = index % 2 ? `asset-${index}.bin` : join('nested', `asset-${index}.bin`);
    const contents = `immutable-pdf-asset-${index}-${'x'.repeat(index * 11)}`;
    expected.set(relative, contents);
    await writeFile(join(source, relative), contents);
  }

  let activeCopies = 0;
  let maximumCopies = 0;
  await Promise.all(Array.from({ length: 5 }, () => withAssetLock(publicDirectory, async () => {
    activeCopies++;
    maximumCopies = Math.max(maximumCopies, activeCopies);
    try {
      await syncDirectory(source, target);
    } finally {
      activeCopies--;
    }
  })));

  assert.equal(maximumCopies, 1, 'Asset preparation was not serialized');
  for (const [relative, contents] of expected) {
    assert.equal(await readFile(join(target, relative), 'utf8'), contents);
  }
  await assert.rejects(stat(join(publicDirectory, '.wemakepdf-assets.lock')), { code: 'ENOENT' });
  console.log('Concurrent local asset preparation passes: one writer, complete files, and clean lock release.');
} finally {
  await rm(workspace, { recursive: true, force: true });
}
