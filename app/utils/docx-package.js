const MAX_EXPANDED_SIZE = 80 * 1024 * 1024;
const MAX_ENTRIES = 10000;

// Read ZIP metadata before the document renderer expands the archive in memory.
export function validateDocxPackage(buffer) {
  const view = new DataView(buffer);
  const invalid = () => { throw new Error('Please choose a valid, undamaged .docx Word document.'); };
  if (view.byteLength < 22) invalid();
  let end = -1;
  for (let offset = view.byteLength - 22; offset >= Math.max(0, view.byteLength - 65557); offset--) {
    if (view.getUint32(offset, true) === 0x06054b50 && offset + 22 + view.getUint16(offset + 20, true) === view.byteLength) { end = offset; break; }
  }
  if (end < 0) invalid();
  const count = view.getUint16(end + 10, true);
  const directorySize = view.getUint32(end + 12, true);
  let offset = view.getUint32(end + 16, true);
  if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || view.getUint16(end + 8, true) !== count) invalid();
  if (count === 0xffff || count > MAX_ENTRIES || offset + directorySize > end) invalid();
  const directoryEnd = offset + directorySize;
  let expandedSize = 0;
  const names = new Set();
  const decoder = new TextDecoder();
  for (let index = 0; index < count; index++) {
    if (offset + 46 > directoryEnd || view.getUint32(offset, true) !== 0x02014b50) invalid();
    if (view.getUint16(offset + 8, true) & 1) throw new Error('Password-protected Word documents are not supported. Save an unlocked .docx file first.');
    const expanded = view.getUint32(offset + 24, true);
    const nameSize = view.getUint16(offset + 28, true);
    const extraSize = view.getUint16(offset + 30, true);
    const commentSize = view.getUint16(offset + 32, true);
    const next = offset + 46 + nameSize + extraSize + commentSize;
    if (next > directoryEnd || expanded === 0xffffffff) invalid();
    expandedSize += expanded;
    if (expandedSize > MAX_EXPANDED_SIZE) throw new Error('This document is too large when unpacked. Try a smaller document or reduce its images.');
    const name = decoder.decode(new Uint8Array(buffer, offset + 46, nameSize));
    if (names.has(name)) invalid();
    names.add(name);
    offset = next;
  }
  if (offset !== directoryEnd || !names.has('[Content_Types].xml') || !names.has('word/document.xml')) invalid();
}

// Keep a text line, table row, or image together when it fits on the next page.
export function pageSliceEnd(offset, capacity, totalHeight, boundaries) {
  const ideal = Math.min(offset + capacity, totalHeight);
  if (ideal === totalHeight) return ideal;
  let end = ideal;
  for (const [top, bottom] of boundaries) {
    if (top < end && bottom > end && top > offset + capacity * .55) end = Math.floor(top);
  }
  return Math.max(offset + 1, end);
}
