import { mkdir, symlink } from 'node:fs/promises';
import { resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { CliError } from '../src/errors.js';
import { isInside, resolveInsideRoot, unsafePathReason } from '../src/paths.js';
import { cleanupTempDirs, tempDir, writeFiles } from './helpers.js';

afterEach(cleanupTempDirs);

describe('unsafePathReason', () => {
  it.each([
    ['', 'empty'],
    ['/etc/passwd', 'absolute'],
    ['C:/Windows', 'drive letter'],
    ['assets\\css', 'backslash'],
    ['../outside', '".."'],
    ['assets/../../outside', '".."'],
    ['./assets', '"."'],
    ['assets//css', 'empty segment'],
    ['assets/', 'empty segment'],
    ['a\0b', 'null byte'],
  ])('rejects %j', (path, reason) => {
    expect(unsafePathReason(path)).toContain(reason);
  });

  it('accepts plain relative paths', () => {
    expect(unsafePathReason('assets/css/button.css')).toBeNull();
  });
});

describe('isInside', () => {
  it('uses path.relative rather than string prefixes', () => {
    expect(isInside('/project', '/project/assets')).toBe(true);
    expect(isInside('/project', '/project')).toBe(true);
    expect(isInside('/project', '/project-evil/file')).toBe(false);
    expect(isInside('/project', '/other')).toBe(false);
  });
});

describe('resolveInsideRoot', () => {
  it('resolves a safe path inside the root', async () => {
    const root = await tempDir();
    expect(await resolveInsideRoot(root, 'assets/css/a.css')).toBe(
      resolve(root, 'assets/css/a.css'),
    );
  });

  it('rejects traversal and absolute paths', async () => {
    const root = await tempDir();
    await expect(resolveInsideRoot(root, '../escape.css')).rejects.toBeInstanceOf(CliError);
    await expect(resolveInsideRoot(root, '/etc/passwd')).rejects.toThrow(/absolute/);
  });

  it('rejects writing through a symlinked directory that points outside the root', async () => {
    const root = await tempDir();
    const outside = await tempDir('bootcn-outside-');
    await symlink(outside, resolve(root, 'assets'));
    await expect(resolveInsideRoot(root, 'assets/css/a.css')).rejects.toThrow(
      /symlink pointing outside/,
    );
  });

  it('allows a symlinked directory that stays inside the root', async () => {
    const root = await tempDir();
    await mkdir(resolve(root, 'real'), { recursive: true });
    await symlink(resolve(root, 'real'), resolve(root, 'assets'));
    await expect(resolveInsideRoot(root, 'assets/a.css')).resolves.toBe(
      resolve(root, 'assets/a.css'),
    );
  });

  it('rejects a target file that is a symlink', async () => {
    const root = await tempDir();
    await writeFiles(root, { 'real.css': '' });
    await symlink(resolve(root, 'real.css'), resolve(root, 'link.css'));
    await expect(resolveInsideRoot(root, 'link.css')).rejects.toThrow(/is a symlink/);
  });
});
