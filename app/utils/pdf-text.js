// Match PDF.js text items to painted glyphs before removing any text from a page.
// If matching is uncertain, keep the complete rendered page instead of losing content.
const characters = text => [...text.normalize('NFKC')].filter(char => !/\s/u.test(char));

export function paintedCharacters(list, OPS) {
  const output = [];
  const stack = [];
  let state = { color: '000000', mode: 0, alpha: 1, simple: true };
  for (let i = 0; i < list.fnArray.length; i++) {
    const op = list.fnArray[i];
    const args = list.argsArray[i];
    if (op === OPS.save || op === OPS.paintFormXObjectBegin) stack.push({ ...state });
    else if (op === OPS.restore || op === OPS.paintFormXObjectEnd) state = stack.pop() || state;
    else if (op === OPS.setFillRGBColor) {
      state.color = String(args[0]).replace('#', '').toUpperCase();
      state.simple = /^[\dA-F]{6}$/.test(state.color);
    } else if (op === OPS.setFillColorN || op === OPS.setFillTransparent) state.simple = false;
    else if (op === OPS.setTextRenderingMode) state.mode = args[0];
    else if (op === OPS.setGState) {
      for (const [key, value] of args[0]) if (key === 'ca') state.alpha = value;
    } else if (op === OPS.showText) {
      if (!state.simple || state.mode !== 0 || state.alpha !== 1) return null;
      for (const glyph of args[0]) {
        if (typeof glyph !== 'object' || !glyph) continue;
        for (const char of characters(glyph.unicode || '')) output.push({ char, color: state.color });
      }
    } else if (op === OPS.showSpacedText) {
      if (!state.simple || state.mode !== 0 || state.alpha !== 1) return null;
      for (const item of (args[0] || [])) {
        if (typeof item === 'number') continue;
        if (Array.isArray(item)) {
          for (const glyph of item) {
            if (typeof glyph === 'object' && glyph) {
              for (const char of characters(glyph.unicode || '')) output.push({ char, color: state.color });
            } else if (typeof glyph === 'string') {
              for (const char of characters(glyph)) output.push({ char, color: state.color });
            }
          }
        } else if (typeof item === 'object' && item) {
          for (const char of characters(item.unicode || '')) output.push({ char, color: state.color });
        } else if (typeof item === 'string') {
          for (const char of characters(item)) output.push({ char, color: state.color });
        }
      }
    } else if ([OPS.nextLineShowText, OPS.nextLineSetSpacingShowText].includes(op)) return null;
  }
  return output;
}

export function editableItems(content, painted) {
  if (!painted?.length) return null;
  const items = [];
  let cursor = 0;
  for (const item of content.items) {
    if (!item.str?.trim()) continue;
    const runs = [];
    for (const char of item.str.normalize('NFKC')) {
      const space = /\s/u.test(char);
      const ink = space ? (painted[cursor] || painted[cursor - 1]) : painted[cursor++];
      if (!ink || (!space && ink.char !== char)) return null;
      if (runs.at(-1)?.color === ink.color) runs.at(-1).text += char;
      else runs.push({ text: char, color: ink.color });
    }
    if (/\uFFFD|[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(item.str)) return null;
    items.push({ ...item, runs });
  }
  return cursor === painted.length && items.length ? items : null;
}

export function wordFont(name = '', fallback = '', text = '') {
  if (/[\u0900-\u097F\u0A80-\u0AFF]/u.test(text || '')) return 'Nirmala UI';
  const family = name.replace(/^[A-Z]{6}\+/, '');
  if (/mangal|nirmala|devanagari|gujarati|shruti|saral|kokila|aparajita|utsaah|shree|kruti|chanakya/i.test(family + fallback)) {
    return 'Nirmala UI';
  }
  if (/courier|mono/i.test(family + fallback)) return 'Courier New';
  if (/times|serif/i.test(family) || fallback === 'serif') return 'Times New Roman';
  if (/calibri/i.test(family)) return 'Calibri';
  if (/cambria/i.test(family)) return 'Cambria';
  if (/georgia/i.test(family)) return 'Georgia';
  return 'Arial';
}
