import { encryptPDF, AlreadyEncryptedError } from '@pdfsmaller/pdf-encrypt';
import { isEncrypted } from '@pdfsmaller/pdf-decrypt';
import { runConversionTask } from './conversion-task.js';
import { MAX_DOCUMENT_SIZE, validatePdf } from './document.js';

function abortError() {
  return new DOMException('Protection cancelled.', 'AbortError');
}

/**
 * Checks if a PDF file is already encrypted / password protected.
 * @param {File} file
 * @returns {Promise<{ encrypted: boolean, algorithm?: string }>}
 */
export async function checkPdfIsEncrypted(file) {
  if (!file || !file.size) return { encrypted: false };
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return isEncrypted(bytes);
}

/**
 * Protects a PDF file with a password using AES-256 or RC4-128.
 *
 * @param {File} file
 * @param {Object} options
 * @param {string} options.password - Password to encrypt with
 * @param {string} [options.confirmPassword] - Confirmation password
 * @param {'AES-256'|'RC4'} [options.algorithm='AES-256'] - Encryption algorithm
 * @param {AbortSignal} [options.signal] - Abort signal
 * @param {Function} [options.onProgress] - Progress callback
 * @returns {Promise<Blob>}
 */
export async function protectPdfFile(file, {
  password = '',
  confirmPassword = '',
  algorithm = 'AES-256',
  signal,
  onProgress: progressCb = () => {},
} = {}) {
  const validationError = validatePdf([file]);
  if (validationError) throw new Error(validationError);

  if (signal?.aborted) throw abortError();

  const trimmedPassword = password.trim();
  if (!trimmedPassword) {
    throw new Error('Please enter a password to protect your PDF.');
  }

  if (confirmPassword !== undefined && confirmPassword !== null && confirmPassword.length > 0) {
    if (trimmedPassword !== confirmPassword.trim()) {
      throw new Error('Passwords do not match. Please verify both password fields.');
    }
  }

  progressCb('Inspecting PDF document…');
  const buffer = await runConversionTask(
    () => file.arrayBuffer(),
    { signal, timeout: 20000, message: 'Could not read PDF file.' }
  );
  if (signal?.aborted) throw abortError();

  const pdfBytes = new Uint8Array(buffer);

  // Check if document is already protected
  const check = await isEncrypted(pdfBytes);
  if (check.encrypted) {
    throw new Error('This PDF is already password-protected. To change or remove protection, use the Unlock PDF tool first.');
  }

  progressCb(`Encrypting PDF with ${algorithm === 'RC4' ? 'RC4 128-bit' : 'AES-256'}…`);

  const encryptedBytes = await runConversionTask(
    () => encryptPDF(pdfBytes, trimmedPassword, {
      algorithm: algorithm === 'RC4' ? 'RC4' : 'AES-256',
    }),
    { signal, timeout: 35000, message: 'PDF encryption failed.' }
  );

  if (signal?.aborted) throw abortError();

  progressCb('Finalizing protected PDF…');
  return new Blob([encryptedBytes], { type: 'application/pdf' });
}

