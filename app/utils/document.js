export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

export function validateDocument(files) {
  if (files.length !== 1) return 'Choose one Word document at a time.';
  const file = files[0];
  if (!/\.docx$/i.test(file.name)) return 'Please choose a .docx Word document. Older .doc files aren’t supported.';
  if (!file.size) return 'This document is empty. Please choose another file.';
  if (file.size > MAX_DOCUMENT_SIZE) return 'This document is larger than 20 MB. Please choose a smaller file.';
  return '';
}

export function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function pdfFilename(name) { return name.replace(/\.docx$/i, '') + '.pdf'; }

export function validatePdf(files) {
  if (files.length !== 1) return 'Choose one PDF at a time.';
  const file = files[0];
  if (!/\.pdf$/i.test(file.name)) return 'Please choose a .pdf document.';
  if (!file.size) return 'This PDF is empty. Please choose another file.';
  if (file.size > MAX_DOCUMENT_SIZE) return 'This PDF is larger than 20 MB. Please choose a smaller file.';
  return '';
}

export function wordFilename(name) { return name.replace(/\.pdf$/i, '') + '.docx'; }

export function validatePowerpoint(files) {
  if (files.length !== 1) return 'Choose one PowerPoint presentation at a time.';
  const file = files[0];
  if (!/\.pptx$/i.test(file.name)) return 'Please choose a .pptx PowerPoint presentation. Older .ppt files aren’t supported.';
  if (!file.size) return 'This presentation is empty. Please choose another file.';
  if (file.size > MAX_DOCUMENT_SIZE) return 'This presentation is larger than 20 MB. Please choose a smaller file.';
  return '';
}

export function powerpointPdfFilename(name) {
  return name.replace(/\.pptx$/i, '') + '.pdf';
}

export function validateExcel(files) {
  if (files.length !== 1) return 'Choose one Excel spreadsheet at a time.';
  const file = files[0];
  if (!/\.(xlsx|csv)$/i.test(file.name)) return 'Please choose a .xlsx or .csv Excel spreadsheet. Older .xls files aren’t supported.';
  if (!file.size) return 'This spreadsheet is empty. Please choose another file.';
  if (file.size > MAX_DOCUMENT_SIZE) return 'This spreadsheet is larger than 20 MB. Please choose a smaller file.';
  return '';
}

export function excelPdfFilename(name) {
  return name.replace(/\.(xlsx|csv)$/i, '') + '.pdf';
}

export function protectedPdfFilename(name) {
  return name.replace(/\.pdf$/i, '') + '-protected.pdf';
}

export function unlockedPdfFilename(name) {
  return name.replace(/\.pdf$/i, '') + '-unlocked.pdf';
}


