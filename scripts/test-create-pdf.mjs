import test from 'node:test';
import assert from 'node:assert/strict';
import { createPdf, createdPdfFilename, wrapText, PAGE_SIZES, TEMPLATES, COLOR_THEMES } from '../app/utils/create-pdf.js';

test('createdPdfFilename formats clean names from title or template', () => {
  assert.equal(createdPdfFilename('My Project Notes'), 'my-project-notes.pdf');
  assert.equal(createdPdfFilename('Study Guide 2026!'), 'study-guide-2026.pdf');
  assert.equal(createdPdfFilename('', 'lined-college'), 'lined-college-created.pdf');
  assert.equal(createdPdfFilename('', 'grid-5mm'), 'grid-5mm-created.pdf');
});

test('PAGE_SIZES contains standard dimensions', () => {
  assert.ok(PAGE_SIZES.a4.width > 500 && PAGE_SIZES.a4.height > 800);
  assert.ok(PAGE_SIZES.letter.width > 600 && PAGE_SIZES.letter.height > 750);
  assert.ok(TEMPLATES.length >= 7);
});

test('createPdf generates valid blank and template PDFs', async () => {
  const result = await createPdf({
    mode: 'template',
    template: 'lined-college',
    pageSize: 'a4',
    orientation: 'portrait',
    pageCount: 3,
    theme: 'classic',
    headerText: 'Math 101 Lecture Notes',
    includePageNumbers: true,
  });

  assert.equal(result.pageCount, 3);
  assert.ok(result.blob.size > 500, 'Generated PDF should have content');
  assert.equal(result.filename, 'lined-college-created.pdf');
});

test('createPdf supports grid, dot, checklist, and cornell templates', async () => {
  for (const tpl of ['grid-5mm', 'grid-dot', 'checklist', 'cornell', 'music']) {
    const res = await createPdf({
      mode: 'template',
      template: tpl,
      pageCount: 1,
    });
    assert.equal(res.pageCount, 1);
    assert.ok(res.blob.size > 300, `Template ${tpl} failed to generate`);
  }
});

test('createPdf typesets text mode and auto-paginates long content', async () => {
  const sampleParagraph = 'We Make PDF empowers users with in-browser privacy-first document utilities. Everything runs locally on device without cloud uploads. '.repeat(40);
  const result = await createPdf({
    mode: 'text',
    title: 'Executive Summary',
    subtitle: 'Confidential Report',
    author: 'We Make PDF Team',
    bodyText: sampleParagraph,
    pageSize: 'a4',
    fontSize: 12,
  });

  assert.ok(result.pageCount >= 2, 'Long text should paginate across at least 2 pages');
  assert.equal(result.filename, 'executive-summary.pdf');
  assert.ok(result.blob.size > 1000);
});

test('createPdf cancellation aborts cleanly', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    createPdf({ signal: controller.signal }),
    { name: 'AbortError' }
  );
});

