import { lstat, readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

import type { ProjectPaths } from './config.js';

export type ProjectType = 'php' | 'html';

const SKIP_DIRS = new Set(['node_modules', 'vendor', '.git', 'dist', 'build', '.cache']);
const MAX_FILES = 300;
const MAX_FILE_SIZE = 512 * 1024;
const MAX_DEPTH = 3;

async function exists(path: string): Promise<boolean> {
  return (await lstat(path).catch(() => null)) !== null;
}

async function isDirectory(path: string): Promise<boolean> {
  return Boolean((await lstat(path).catch(() => null))?.isDirectory());
}

/** Lists .html/.htm/.php files (bounded depth and count, no symlinks). */
async function markupFiles(root: string): Promise<string[]> {
  const found: string[] = [];
  const visit = async (dir: string, depth: number): Promise<void> => {
    if (depth > MAX_DEPTH || found.length >= MAX_FILES) return;
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (found.length >= MAX_FILES) return;
      const full = join(dir, entry.name);
      if (entry.isDirectory() && !SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
        await visit(full, depth + 1);
      } else if (
        entry.isFile() &&
        ['.html', '.htm', '.php'].includes(extname(entry.name).toLowerCase())
      ) {
        found.push(full);
      }
    }
  };
  await visit(root, 0);
  return found;
}

export interface ProjectInfo {
  /** Detected type, or null when it cannot be inferred. */
  type: ProjectType | null;
  hasPublicDir: boolean;
}

export async function detectProject(root: string): Promise<ProjectInfo> {
  const hasPublicDir = await isDirectory(join(root, 'public'));
  const files = await markupFiles(root);
  const isPhp =
    (await exists(join(root, 'composer.json'))) ||
    files.some((file) => file.toLowerCase().endsWith('.php'));
  if (isPhp) return { type: 'php', hasPublicDir };
  if (files.length > 0) return { type: 'html', hasPublicDir };
  return { type: null, hasPublicDir };
}

/** Default install paths for a project. Pages go to the web root. */
export function defaultPaths(type: ProjectType, hasPublicDir: boolean): ProjectPaths {
  const webRoot = type === 'php' && hasPublicDir;
  const assets = webRoot ? 'public/assets' : 'assets';
  return {
    components: 'components/ui',
    css: `${assets}/css`,
    js: `${assets}/js`,
    lib: `${assets}/js/lib`,
    ...(webRoot ? { pages: 'public' } : {}),
  };
}

const BOOTSTRAP_ASSET = /bootstrap[\w.@/-]*\.(?:min\.)?(?:css|js)\b/i;

/** Looks for Bootstrap in package.json/composer.json or a CDN/local tag in markup. */
export async function detectBootstrap(root: string): Promise<{ found: boolean; where?: string }> {
  for (const manifest of ['package.json', 'composer.json']) {
    try {
      const json = JSON.parse(await readFile(join(root, manifest), 'utf8')) as Record<
        string,
        unknown
      >;
      for (const field of ['dependencies', 'devDependencies', 'require', 'require-dev']) {
        const deps = json[field];
        if (
          deps &&
          typeof deps === 'object' &&
          Object.keys(deps).some((name) => /(^|\/)bootstrap$/.test(name))
        ) {
          return { found: true, where: manifest };
        }
      }
    } catch {
      // Missing or invalid manifest: keep looking.
    }
  }
  for (const file of await markupFiles(root)) {
    const info = await lstat(file).catch(() => null);
    if (!info || info.size > MAX_FILE_SIZE) continue;
    const text = await readFile(file, 'utf8').catch(() => '');
    if (BOOTSTRAP_ASSET.test(text)) return { found: true, where: file.slice(root.length + 1) };
  }
  return { found: false };
}
