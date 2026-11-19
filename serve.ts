// A tiny static server for app/ (Node 22, standard library only), so the
// guide can be tried in a browser without a build step:
//
//   node serve.ts            serves app/ on http://localhost:8080
//   node serve.ts --port 9000   another port
//
// It sends the MIME types a browser needs, refuses any path that escapes
// app/, and otherwise does nothing clever: this is a development convenience,
// not part of the entry. The guide itself is plain static files and works
// from any static host, or straight from the files with the network off.

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, normalize, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const appDir = resolve(join(here, 'app'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function portFromArgs() {
  const at = process.argv.indexOf('--port');
  if (at >= 0 && process.argv[at + 1]) {
    const n = Number(process.argv[at + 1]);
    if (Number.isInteger(n) && n > 0 && n < 65536) return n;
  }
  return 8080;
}

const port = portFromArgs();

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  // Refuse anything that escapes app/ (a request for /../ or an absolute path).
  const file = resolve(join(appDir, normalize(rel)));
  if (!file.startsWith(appDir + '/') || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found: ' + rel + '\n');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});

server.listen(port, () => {
  console.log(`Platinum Road serving app/ at http://localhost:${port}`);
});
