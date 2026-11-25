import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const CLI_DIR = resolve(import.meta.dirname, '..');
const ROOT = resolve(CLI_DIR, '..', '..');

describe('published package', () => {
  it('ships the same LICENSE as the repository', async () => {
    const [cli, root] = await Promise.all([
      readFile(resolve(CLI_DIR, 'LICENSE'), 'utf8'),
      readFile(resolve(ROOT, 'LICENSE'), 'utf8'),
    ]);
    expect(cli).toBe(root);
  });

  it('is publishable and points at this repository', async () => {
    const pkg = JSON.parse(await readFile(resolve(CLI_DIR, 'package.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    expect(pkg.private).toBeUndefined();
    expect(pkg.name).toBe('bootcn');
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
    expect(pkg.bin).toEqual({ bootcn: 'dist/index.js' });
    expect(pkg.repository).toMatchObject({
      url: 'git+https://github.com/bootcndev/bootcn.git',
      directory: 'packages/cli',
    });
  });
});
