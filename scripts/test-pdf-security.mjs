import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { protectPdfFile, checkPdfIsEncrypted } from '../app/utils/protect-pdf.js';
import { unlockPdfFile, inspectPdfLock } from '../app/utils/unlock-pdf.js';
import { protectedPdfFilename, unlockedPdfFilename } from '../app/utils/document.js';

function makeMockFile(bytes, name = 'test-doc.pdf', type = 'application/pdf') {
  return {
    name,
    size: bytes.length,
    type,
    async arrayBuffer() {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    },
  };
}

test('filename helpers append correct suffix', () => {
  assert.equal(protectedPdfFilename('annual-report.pdf'), 'annual-report-protected.pdf');
  assert.equal(protectedPdfFilename('contract.PDF'), 'contract-protected.pdf');
  assert.equal(unlockedPdfFilename('secret-statement.pdf'), 'secret-statement-unlocked.pdf');
  assert.equal(unlockedPdfFilename('invoice.PDF'), 'invoice-unlocked.pdf');
});

test('protect and unlock PDF roundtrip works seamlessly', async () => {
  // 1. Create a simple PDF document with pdf-lib
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 400]);
  page.drawText('Confidential Toolifybox Document', { x: 50, y: 350, size: 18 });
  const rawBytes = await doc.save();

  const plainFile = makeMockFile(rawBytes, 'confidential.pdf');

  // Verify it is not encrypted
  const initialCheck = await checkPdfIsEncrypted(plainFile);
  assert.equal(initialCheck.encrypted, false);

  // 2. Protect the PDF with a password
  const password = 'SuperSecret123!';
  const protectedBlob = await protectPdfFile(plainFile, {
    password,
    confirmPassword: password,
    algorithm: 'AES-256',
  });

  assert.ok(protectedBlob instanceof Blob);
  assert.equal(protectedBlob.type, 'application/pdf');

  const protectedBuffer = await protectedBlob.arrayBuffer();
  const protectedBytes = new Uint8Array(protectedBuffer);
  const protectedFile = makeMockFile(protectedBytes, 'confidential-protected.pdf');

  // Check it is now encrypted
  const protectedCheck = await inspectPdfLock(protectedFile);
  assert.equal(protectedCheck.encrypted, true);
  assert.equal(protectedCheck.algorithm, 'AES-256');

  // 3. Reject wrong password
  await assert.rejects(
    () => unlockPdfFile(protectedFile, { password: 'WrongPassword999' }),
    /Incorrect password/i
  );

  // 4. Reject protecting an already protected PDF
  await assert.rejects(
    () => protectPdfFile(protectedFile, { password: 'AnotherPassword' }),
    /already password-protected/i
  );

  // 5. Unlock the PDF with the correct password
  const unlockedBlob = await unlockPdfFile(protectedFile, { password });
  assert.ok(unlockedBlob instanceof Blob);

  const unlockedBuffer = await unlockedBlob.arrayBuffer();
  const unlockedBytes = new Uint8Array(unlockedBuffer);
  const unlockedFile = makeMockFile(unlockedBytes, 'confidential-unlocked.pdf');

  // Check it is now unencrypted
  const unlockedCheck = await inspectPdfLock(unlockedFile);
  assert.equal(unlockedCheck.encrypted, false);

  // Verify the unlocked PDF can be parsed cleanly by pdf-lib
  const finalDoc = await PDFDocument.load(unlockedBytes);
  assert.equal(finalDoc.getPageCount(), 1);
});

test('rejects empty password and mismatched confirmation', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  const rawBytes = await doc.save();
  const file = makeMockFile(rawBytes, 'sample.pdf');

  await assert.rejects(
    () => protectPdfFile(file, { password: '  ' }),
    /Please enter a password/i
  );

  await assert.rejects(
    () => protectPdfFile(file, { password: 'pass1', confirmPassword: 'pass2' }),
    /Passwords do not match/i
  );
});

test('unlocking an already unlocked PDF reports appropriate error', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  const rawBytes = await doc.save();
  const file = makeMockFile(rawBytes, 'plain.pdf');

  await assert.rejects(
    () => unlockPdfFile(file, { password: 'somestring' }),
    /not password protected/i
  );
});

