import { decryptPDF, isEncrypted } from '@pdfsmaller/pdf-decrypt';
import { runConversionTask } from './conversion-task.js';
import { validatePdf } from './document.js';

function abortError() {
  return new DOMException('Unlocking cancelled.', 'AbortError');
}

/**
 * Checks whether a PDF file is password protected and returns its encryption algorithm.
 * @param {File} file
 * @returns {Promise<{ encrypted: boolean, algorithm?: string, version?: number }>}
 */
export async function inspectPdfLock(file) {
  if (!file || !file.size) return { encrypted: false };
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return isEncrypted(bytes);
}

/**
 * Removes password protection from an encrypted PDF.
 *
 * @param {File} file
 * @param {Object} options
 * @param {string} options.password - Password to unlock the document
 * @param {AbortSignal} [options.signal] - Abort signal
 * @param {Function} [options.onProgress] - Progress callback
 * @returns {Promise<Blob>}
 */
export async function unlockPdfFile(file, {
  password = '',
  signal,
  onProgress: progressCb = () => {},
} = {}) {
  const validationError = validatePdf([file]);
  if (validationError) throw new Error(validationError);

  if (signal?.aborted) throw abortError();

  const trimmedPassword = password.trim();
  if (!trimmedPassword) {
    throw new Error('Please enter the password to unlock this PDF.');
  }

  progressCb('Checking PDF encryption…');
  const buffer = await runConversionTask(
    () => file.arrayBuffer(),
    { signal, timeout: 20000, message: 'Could not read PDF file.' }
  );
  if (signal?.aborted) throw abortError();

  const pdfBytes = new Uint8Array(buffer);

  // Check if document is actually encrypted
  const check = await isEncrypted(pdfBytes);
  if (!check.encrypted) {
    throw new Error('This PDF is not password protected. It is already unlocked and does not require a password.');
  }

  progressCb(`Decrypting PDF (${check.algorithm || 'Encrypted'})…`);

  let decryptedBytes;
  try {
    decryptedBytes = await runConversionTask(
      () => decryptPDF(pdfBytes, trimmedPassword),
      { signal, timeout: 35000, message: 'Decryption timed out.' }
    );
  } catch (err) {
    if (signal?.aborted) throw abortError();
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('incorrect password') || msg.includes('password does not match') || msg.includes('password')) {
      throw new Error('Incorrect password. Please verify the password and try again.');
    }
    throw err;
  }

  if (signal?.aborted) throw abortError();

  progressCb('Validating decrypted document…');
  // Verify with pdf-lib to ensure clean structure
  const { PDFDocument } = await runConversionTask(
    () => import('pdf-lib'),
    { signal, timeout: 20000 }
  );
  await runConversionTask(
    () => PDFDocument.load(decryptedBytes),
    { signal, timeout: 20000, message: 'Could not parse decrypted PDF.' }
  );

  progressCb('Finalizing unlocked PDF…');
  return new Blob([decryptedBytes], { type: 'application/pdf' });
}

