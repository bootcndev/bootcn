import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(process.env.ROOT ?? resolve(testsDir, '..'));
const port = Number(process.env.PORT ?? 4517);
// Optional URL prefix, e.g. PREFIX=/bootcn to serve a GitHub Pages project site.
const prefix = (process.env.PREFIX ?? '').replace(/\/+$/, '');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.php': 'text/plain; charset=utf-8',
};

function isInsideRoot(filePath) {
  return filePath === root || filePath.startsWith(root + sep);
}

const server = createServer(async (request, response) => {
  try {
    let urlPath = decodeURIComponent((request.url ?? '/').split('?')[0]);
    if (urlPath === '/__health') {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('ok');
      return;
    }
    if (prefix) {
      if (urlPath !== prefix && !urlPath.startsWith(`${prefix}/`)) {
        response.writeHead(404, { 'content-type': 'text/plain' });
        response.end('Not found');
        return;
      }
      urlPath = urlPath.slice(prefix.length) || '/';
    }
    const resolved = normalize(join(root, urlPath));
    if (!isInsideRoot(resolved)) {
      response.writeHead(403, { 'content-type': 'text/plain' });
      response.end('Forbidden');
      return;
    }

    const info = await stat(resolved).catch(() => null);
    let target = info?.isDirectory() ? join(resolved, 'index.html') : resolved;
    // Clean URLs (/guide/cli -> guide/cli.html), as GitHub Pages serves them.
    if (!info && !extname(resolved)) {
      const html = `${resolved}.html`;
      if (await stat(html).catch(() => null)) target = html;
    }
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
