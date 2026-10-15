import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../.output/public/', import.meta.url)));
const portOption = process.argv.indexOf('--port');
const port = Number(portOption >= 0 ? process.argv[portOption + 1] : process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Choose a valid preview port.');
await stat(path.join(root, 'index.html')).catch(() => { throw new Error('Build the site first with npm run build.'); });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400); response.end(); return; }
  let target = path.resolve(root, `.${pathname}`);
  if (target !== root && !target.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
  let info = await stat(target).catch(() => null);
  if (info?.isDirectory()) { target = path.join(target, 'index.html'); info = await stat(target).catch(() => null); }
  if (!info?.isFile()) {
    if (path.extname(pathname) || pathname.startsWith('/_nuxt/')) { response.writeHead(404); response.end(); return; }
    target = path.join(root, '200.html');
    info = await stat(target).catch(() => null);
    if (!info) { response.writeHead(404); response.end(); return; }
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Content-Length': info.size, 'X-Content-Type-Options': 'nosniff' });
  if (request.method === 'HEAD') { response.end(); return; }
  createReadStream(target).on('error', () => response.destroy()).pipe(response);
});
server.listen(port, '127.0.0.1', () => console.log(`Static Nuxt preview: http://127.0.0.1:${port}`));
