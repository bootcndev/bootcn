import { lstat, readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

import type { ProjectPaths } from './config.js';

export type ProjectType = 'php' | 'html' | 'laravel' | 'react' | 'vue';

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

/** Laravel: an `artisan` file and laravel/framework in composer.json. */
async function isLaravel(root: string): Promise<boolean> {
  if (!(await exists(join(root, 'artisan')))) return false;
  try {
    const composer = JSON.parse(await readFile(join(root, 'composer.json'), 'utf8')) as {
      require?: Record<string, string>;
    };
    return Boolean(composer.require?.['laravel/framework']);
  } catch {
    return false;
  }
}

async function readJson(path: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** React or Vue from package.json (Next.js, Vite, Nuxt and friends). */
async function jsFramework(root: string): Promise<'react' | 'vue' | null> {
  const json = await readJson(join(root, 'package.json'));
  if (!json) return null;
  const deps = { ...(json.dependencies as object), ...(json.devDependencies as object) };
  if ('vue' in deps || 'nuxt' in deps) return 'vue';
  if ('react' in deps || 'next' in deps) return 'react';
  return null;
}

export async function detectProject(root: string): Promise<ProjectInfo> {
  const hasPublicDir = await isDirectory(join(root, 'public'));
  if (await isLaravel(root)) return { type: 'laravel', hasPublicDir };
  const framework = await jsFramework(root);
  if (framework) return { type: framework, hasPublicDir };
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
  if (type === 'react' || type === 'vue') {
    // Components import their CSS and JavaScript, so everything lives in src/.
    return {
      components: 'src/components/ui',
      css: 'src/bootcn/css',
      js: 'src/bootcn/js',
      lib: 'src/bootcn/js/lib',
    };
  }
  if (type === 'laravel') {
    // Blade views under resources/views; static files under public/, so
    // asset('vendor/bootcn/...') serves them without touching Vite.
    return {
      components: 'resources/views/components/ui',
      css: 'public/vendor/bootcn/css',
      js: 'public/vendor/bootcn/js',
      lib: 'public/vendor/bootcn/js/lib',
      pages: 'resources/views/bootcn',
    };
  }
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
/** jsDelivr/unpkg (bootstrap@5.3.9/), cdnjs (twitter-bootstrap/5.3.2/) and others (/bootstrap/5.3.2/), local folders (bootstrap-5.3.3/). */
const BOOTSTRAP_VERSION_IN_URL = [
  /bootstrap@(\d+\.\d+(?:\.\d+)?(?:-[\w.]+)?)\//i,
  /[/-]bootstrap\/(\d+\.\d+(?:\.\d+)?(?:-[\w.]+)?)\//i,
  /bootstrap-(\d+\.\d+(?:\.\d+)?(?:-[\w.]+)?)(?:-dist)?\//i,
];
const VERSION = /(\d+)\.(\d+)(?:\.\d+)?(?:-[\w.]+)?/;

export interface BootstrapInfo {
  found: boolean;
  /** Where it was found: a manifest, an installed package or a markup file. */
  where?: string;
  /** The version as written there, for example "5.3.9" or "6.0.0-alpha.2". */
  version?: string;
}

/** "5.3.9" → "5.3", "^6.0.0-alpha.2" → "6.0"; undefined when there is no version. */
export function bootstrapMinor(version: string | undefined): string | undefined {
  const match = version ? VERSION.exec(version) : null;
  return match ? `${match[1]}.${match[2]}` : undefined;
}

/**
 * Finds Bootstrap and, when it can, its version: an installed copy first
 * (node_modules, vendor), then package.json/composer.json, then a CDN or
 * local tag in the project's markup.
 */
export async function detectBootstrap(root: string): Promise<BootstrapInfo> {
  for (const installed of [
    'node_modules/bootstrap/package.json',
    'vendor/twbs/bootstrap/package.json',
  ]) {
    const json = await readJson(join(root, installed));
    if (json && typeof json.version === 'string') {
      return { found: true, where: installed.split('/package.json')[0], version: json.version };
    }
  }
  for (const manifest of ['package.json', 'composer.json']) {
    const json = await readJson(join(root, manifest));
    if (!json) continue;
    for (const field of ['dependencies', 'devDependencies', 'require', 'require-dev']) {
      const deps = json[field];
      if (!deps || typeof deps !== 'object') continue;
      const name = Object.keys(deps).find((dep) => /(^|\/)bootstrap$/.test(dep));
      if (name) {
        const range = String((deps as Record<string, unknown>)[name]);
        const match = VERSION.exec(range);
        return { found: true, where: manifest, ...(match ? { version: match[0] } : {}) };
      }
    }
  }
  for (const file of await markupFiles(root)) {
    const info = await lstat(file).catch(() => null);
    if (!info || info.size > MAX_FILE_SIZE) continue;
    const text = await readFile(file, 'utf8').catch(() => '');
    if (!BOOTSTRAP_ASSET.test(text)) continue;
    const where = file.slice(root.length + 1);
    for (const pattern of BOOTSTRAP_VERSION_IN_URL) {
      const match = pattern.exec(text);
      if (match) return { found: true, where, version: match[1] };
    }
    return { found: true, where };
  }
  return { found: false };
}
