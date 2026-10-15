// Sample the page around an OCR word, rather than flattening all text to black.
export function wordPixels(context, box) {
  const x = Math.max(0, Math.floor(box.x0) - 1);
  const y = Math.max(0, Math.floor(box.y0) - 1);
  const width = Math.min(context.canvas.width - x, Math.ceil(box.x1) - x + 2);
  const height = Math.min(context.canvas.height - y, Math.ceil(box.y1) - y + 2);
  if (width < 1 || height < 1) return null;
  const { data } = context.getImageData(x, y, width, height);
  const colors = new Map();
  const borders = new Map();
  const add = (map, i) => {
    const key = `${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`;
    const bucket = map.get(key) || { count: 0, rgb: [0, 0, 0] };
    bucket.count++;
    for (let c = 0; c < 3; c++) bucket.rgb[c] += data[i + c];
    map.set(key, bucket);
  };
  for (let row = 0; row < height; row++) for (let col = 0; col < width; col++) {
    if (row === 0 || col === 0 || row === height - 1 || col === width - 1) add(borders, (row * width + col) * 4);
  }
  const dominant = map => {
    const bucket = [...map.values()].sort((a, b) => b.count - a.count)[0];
    return bucket?.rgb.map(c => Math.round(c / bucket.count));
  };
  const background = dominant(borders) || [255, 255, 255];
  for (let i = 0; i < data.length; i += 4) {
    if (Math.hypot(...background.map((value, c) => value - data[i + c])) > 65) add(colors, i);
  }
  const hex = rgb => rgb.map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase();
  return { x, y, width, height, color: hex(dominant(colors) || [0, 0, 0]), background: hex(background) };
}
