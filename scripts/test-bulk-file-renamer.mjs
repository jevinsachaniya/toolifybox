import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyRenameRule,
  changeCase,
  formatDateStamp,
  formatSequenceNumber,
  generateBashScript,
  generatePowerShellScript,
  generateRenameCsv,
  generateWindowsBatScript,
  resolveDuplicateFilenames,
  splitFilename,
} from '../app/utils/bulk-file-renamer.js';

test('splitFilename splits base name and extension correctly', () => {
  assert.deepEqual(splitFilename('photo.jpg'), { baseName: 'photo', ext: '.jpg' });
  assert.deepEqual(splitFilename('report.2026.final.pdf'), { baseName: 'report.2026.final', ext: '.pdf' });
  assert.deepEqual(splitFilename('Makefile'), { baseName: 'Makefile', ext: '' });
  assert.deepEqual(splitFilename('.gitignore'), { baseName: '.gitignore', ext: '' });
});

test('changeCase converts cases accurately', () => {
  assert.equal(changeCase('Hello World', 'lower'), 'hello world');
  assert.equal(changeCase('hello world', 'upper'), 'HELLO WORLD');
  assert.equal(changeCase('hello_world_test', 'title'), 'Hello World Test');
  assert.equal(changeCase('hello_world_test', 'camel'), 'helloWorldTest');
  assert.equal(changeCase('Hello World Test', 'kebab'), 'hello-world-test');
  assert.equal(changeCase('HelloWorldTest', 'snake'), 'hello_world_test');
});

test('formatSequenceNumber formats numbers with padding and brackets', () => {
  assert.equal(formatSequenceNumber(5, { padDigits: 2, format: 'num' }), '05');
  assert.equal(formatSequenceNumber(5, { padDigits: 3, format: 'num' }), '005');
  assert.equal(formatSequenceNumber(5, { padDigits: 2, format: 'paren' }), '(05)');
  assert.equal(formatSequenceNumber(5, { padDigits: 2, format: 'bracket' }), '[05]');
  assert.equal(formatSequenceNumber(5, { padDigits: 2, format: 'dash' }), '-05-');
});

test('applyRenameRule handles prefix, suffix and find & replace', () => {
  const renamed = applyRenameRule('IMG_4021.JPG', 0, 10, {
    prefix: 'Vacation_',
    suffix: '_Edited',
    findText: '4021',
    replaceText: 'Beach',
  });
  assert.equal(renamed, 'Vacation_IMG_Beach_Edited.JPG');
});

test('applyRenameRule handles sequential numbering and extension casing', () => {
  const renamed = applyRenameRule('document.PDF', 2, 5, {
    prefix: 'Invoice_',
    numbering: { enabled: true, start: 1, step: 1, padDigits: 3, position: 'suffix', format: 'num' },
    extensionMode: 'lower',
  });
  assert.equal(renamed, 'Invoice_document_003.pdf');
});

test('applyRenameRule regex replacement works as expected', () => {
  const renamed = applyRenameRule('invoice_2026-11-02_v1.pdf', 0, 1, {
    findText: '_v\\d+',
    replaceText: '_FINAL',
    useRegex: true,
  });
  assert.equal(renamed, 'invoice_2026-11-02_FINAL.pdf');
});

test('resolveDuplicateFilenames prevents collisions', () => {
  const names = ['report.pdf', 'report.pdf', 'report.pdf', 'data.csv'];
  const resolved = resolveDuplicateFilenames(names);
  assert.deepEqual(resolved.map(r => r.name), ['report.pdf', 'report_1.pdf', 'report_2.pdf', 'data.csv']);
  assert.equal(resolved[0].isDuplicate, false);
  assert.equal(resolved[1].isDuplicate, true);
  assert.equal(resolved[2].isDuplicate, true);
});

test('generateWindowsBatScript produces valid batch script', () => {
  const pairs = [{ original: 'old.txt', renamed: 'new.txt' }];
  const script = generateWindowsBatScript(pairs);
  assert.ok(script.includes('@echo off'));
  assert.ok(script.includes('ren "old.txt" "new.txt"'));
});

test('generatePowerShellScript produces valid powershell script', () => {
  const pairs = [{ original: 'old.txt', renamed: 'new.txt' }];
  const script = generatePowerShellScript(pairs);
  assert.ok(script.includes('Rename-Item -LiteralPath "old.txt" -NewName "new.txt"'));
});

test('generateBashScript produces valid shell script', () => {
  const pairs = [{ original: 'old.txt', renamed: 'new.txt' }];
  const script = generateBashScript(pairs);
  assert.ok(script.includes('#!/usr/bin/env bash'));
  assert.ok(script.includes('mv "old.txt" "new.txt"'));
});

test('generateRenameCsv produces CSV with BOM and escaping', () => {
  const pairs = [{ original: 'photo, 2026.jpg', renamed: 'photo "renamed".jpg' }];
  const csv = generateRenameCsv(pairs);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"photo, 2026.jpg"'));
  assert.ok(csv.includes('"photo ""renamed"".jpg"'));
});
