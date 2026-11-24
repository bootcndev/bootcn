import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(process.env.ROOT ?? resolve(testsDir, '..'));
const port = Number(process.env.PORT ?? 4517);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.php': 'text/plain; charset=utf-8',
};

function isInsideRoot(filePath) {
  return filePath === root || filePath.startsWith(root + sep);
}

const server = createServer(async (request, response) => {
  try {
    const urlPath = decodeURIComponent((request.url ?? '/').split('?')[0]);
    if (urlPath === '/__health') {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('ok');
      return;
    }
    const resolved = normalize(join(root, urlPath));
    if (!isInsideRoot(resolved)) {
      response.writeHead(403, { 'content-type': 'text/plain' });
      response.end('Forbidden');
      return;
    }

    const info = await stat(resolved).catch(() => null);
    const target = info?.isDirectory() ? join(resolved, 'index.html') : resolved;
    const body = await readFile(target);

    response.writeHead(200, {
      'content-type': contentTypes[extname(target).toLowerCase()] ?? 'application/octet-stream',
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Static server listening on http://127.0.0.1:${port}\n`);
});
