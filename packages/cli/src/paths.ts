import { lstat, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

import { userError } from './errors.js';

/**
 * Returns why `path` is not a safe, normalized, relative POSIX path, or null
 * when it is safe. Used for registry file paths and bootcn.json directories.
 */
export function unsafePathReason(path: string): string | null {
  if (path.length === 0) return 'is empty';
  if (path.includes('\0')) return 'contains a null byte';
  if (path.includes('\\')) return 'contains a backslash';
  if (path.startsWith('/')) return 'is absolute';
  if (/^[A-Za-z]:/.test(path)) return 'starts with a drive letter';
  const segments = path.split('/');
  if (segments.some((segment) => segment === '')) return 'contains an empty segment';
  if (segments.some((segment) => segment === '..')) return 'contains a ".." segment';
  if (segments.some((segment) => segment === '.')) return 'contains a "." segment';
  return null;
}

export function assertSafeRelativePath(path: string, what: string): void {
  const reason = unsafePathReason(path);
  if (reason)
    throw userError(
      `${what} "${path}" ${reason}.`,
      'Use a plain relative path such as "assets/css".',
    );
}

/** True when `child` is `parent` itself or inside it (uses path.relative). */
export function isInside(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel));
}

async function nearestExisting(path: string): Promise<string> {
  let current = path;
  for (;;) {
    if (await lstat(current).catch(() => null)) return current;
    const parent = dirname(current);
    if (parent === current) return current;
    current = parent;
  }
}

/**
 * Resolves a project-relative POSIX path to an absolute path that is
 * guaranteed to stay inside `root`, including through symlinks.
 * Throws a CliError otherwise.
 */
export async function resolveInsideRoot(root: string, relPath: string): Promise<string> {
  assertSafeRelativePath(relPath, 'Path');
  const absRoot = resolve(root);
  const target = resolve(absRoot, ...relPath.split('/'));
  if (!isInside(absRoot, target) || target === absRoot) {
    throw userError(`Refusing to write "${relPath}": it resolves outside the project root.`);
  }

  const info = await lstat(target).catch(() => null);
  if (info?.isSymbolicLink()) {
    throw userError(
      `Refusing to write "${relPath}": the file is a symlink.`,
      'Replace the symlink with a regular file or remove it.',
    );
  }

  const realRoot = await realpath(absRoot);
  const existing = await nearestExisting(dirname(target));
  const realExisting = await realpath(existing);
  if (!isInside(realRoot, realExisting)) {
    throw userError(
      `Refusing to write "${relPath}": a directory on its path is a symlink pointing outside the project root.`,
    );
  }
  return target;
}
