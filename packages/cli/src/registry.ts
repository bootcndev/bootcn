import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

import { registryError, userError } from './errors.js';
import { unsafePathReason } from './paths.js';
import { formatSchemaErrors, validateIndexSchema, validateItemSchema } from './schemas.js';

export interface RegistryFile {
  path: string;
  target: string;
  type: string;
  content: string;
}

export interface RegistryItem {
  name: string;
  type: string;
  title: string;
  description: string;
  version?: string;
  categories?: string[];
  dependencies?: string[];
  registryDependencies?: string[];
  compatibility?: { bootstrap?: string; platform?: string[] };
  accessibility?: { notes?: string; keyboard?: string[] };
  license?: string;
  files: RegistryFile[];
}

export interface IndexItem {
  name: string;
  type: string;
  title: string;
  description: string;
  version: string;
  categories?: string[];
  files?: { type: string; target: string }[];
}

export interface RegistryIndex {
  name: string;
  version: string;
  items: IndexItem[];
}

export type RegistryLocation =
  { kind: 'url'; base: URL; display: string } | { kind: 'local'; dir: string; display: string };

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const ITEM_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 15_000;

/**
 * Parses a registry location. Strings with a URL scheme must be https URLs;
 * anything else is a local directory, resolved against `baseDir`.
 */
export function parseRegistryLocation(value: string, baseDir: string): RegistryLocation {
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[A-Za-z]:[\\/]/.test(value)) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw userError(`Registry URL "${value}" is not a valid URL.`);
    }
    if (url.protocol !== 'https:') {
      throw userError(
        `Registry URL "${value}" must use https.`,
        'Use an https:// URL or a local directory path.',
      );
    }
    if (url.username || url.password) {
      throw userError('Registry URLs must not contain credentials.');
    }
    url.search = '';
    url.hash = '';
    if (!url.pathname.endsWith('/')) url.pathname = `${url.pathname}/`;
    return { kind: 'url', base: url, display: url.href };
  }
  const dir = resolve(baseDir, value);
  return { kind: 'local', dir, display: dir };
}

/** Value to store in bootcn.json for a location, relative to the project root when local. */
export function registryConfigValue(location: RegistryLocation, projectRoot: string): string {
  if (location.kind === 'url') return location.base.href.replace(/\/$/, '');
  const rel = relative(projectRoot, location.dir);
  if (rel === '') return '.';
  // Inside the project: store a portable relative path. Elsewhere: absolute.
  if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)) return location.dir;
  return rel.split(sep).join('/');
}

class NotFoundError extends Error {}

async function fetchHttps(base: URL, relPath: string, fetchImpl: FetchLike): Promise<string> {
  let url = new URL(relPath, base);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    let response: Response;
    try {
      response = await fetchImpl(url.href, {
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { accept: 'application/json' },
      });
    } catch (error) {
      throw registryError(
        `Could not reach the registry at ${url.href} (${(error as Error).message}).`,
        'Check your network connection or pass --registry <path-or-https-url>.',
        error,
      );
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw registryError(`Registry redirect from ${url.href} has no location.`);
      const next = new URL(location, url);
      if (next.protocol !== 'https:' || next.host !== base.host) {
        throw registryError(
          `Registry redirected to ${next.href}, which is not on ${base.host} over https; refusing to follow.`,
        );
      }
      url = next;
      continue;
    }
    if (response.status === 404) throw new NotFoundError(url.href);
    if (!response.ok) {
      throw registryError(`Registry request ${url.href} failed with HTTP ${response.status}.`);
    }
    return await response.text();
  }
  throw registryError(`Too many redirects while fetching ${relPath} from the registry.`);
}

async function readLocal(dir: string, relPath: string): Promise<string> {
  try {
    return await readFile(resolve(dir, ...relPath.split('/')), 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new NotFoundError(relPath);
    throw registryError(
      `Could not read ${relPath} from the local registry ${dir}.`,
      undefined,
      error,
    );
  }
}

function parseJson(text: string, what: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw registryError(`The registry returned invalid JSON for ${what}.`);
  }
}

/** Checks a fetched item before anything is planned or written. */
export function validateRegistryItem(value: unknown, expectedName: string): RegistryItem {
  if (!validateItemSchema(value)) {
    throw registryError(
      `Registry item "${expectedName}" is invalid: ${formatSchemaErrors(validateItemSchema.errors)}.`,
    );
  }
  const item = value as RegistryItem;
  if (item.name !== expectedName) {
    throw registryError(
      `Registry returned item "${item.name}" when "${expectedName}" was requested.`,
    );
  }
  for (const file of item.files) {
    for (const path of [file.path, file.target]) {
      const reason = unsafePathReason(path);
      if (reason)
        throw registryError(
          `Registry item "${item.name}" has an unsafe path "${path}" (${reason}).`,
        );
    }
    if (typeof file.content !== 'string') {
      throw registryError(
        `Registry item "${item.name}" file "${file.path}" has no content.`,
        'Point --registry at a built registry (the dist/ directory).',
      );
    }
  }
  return item;
}

export class RegistryClient {
  readonly location: RegistryLocation;
  private readonly fetchImpl: FetchLike;
  private readonly cache = new Map<string, RegistryItem>();

  constructor(location: RegistryLocation, fetchImpl: FetchLike = fetch) {
    this.location = location;
    this.fetchImpl = fetchImpl;
  }

  private async read(relPath: string): Promise<string> {
    return this.location.kind === 'url'
      ? fetchHttps(this.location.base, relPath, this.fetchImpl)
      : readLocal(this.location.dir, relPath);
  }

  async getIndex(): Promise<RegistryIndex> {
    let text: string;
    try {
      text = await this.read('index.json');
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw registryError(
          `No index.json found in the registry at ${this.location.display}.`,
          'For a local registry, point to the built dist/ directory (run "pnpm registry:build").',
        );
      }
      throw error;
    }
    const value = parseJson(text, 'index.json');
    if (!validateIndexSchema(value)) {
      throw registryError(
        `Registry index is invalid: ${formatSchemaErrors(validateIndexSchema.errors)}.`,
      );
    }
    return value as RegistryIndex;
  }

  /**
   * The React or Vue component for an item (r/react/<name>.json), or null
   * when the item has none yet.
   */
  async getOverlay(framework: 'react' | 'vue', name: string): Promise<RegistryItem | null> {
    const key = `${framework}/${name}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    let text: string;
    try {
      text = await this.read(`r/${framework}/${name}.json`);
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
    const overlay = validateRegistryItem(parseJson(text, `"${key}"`), name);
    const fileType = `registry:${framework}`;
    if (overlay.files.some((file) => file.type !== fileType)) {
      throw registryError(`Registry overlay "${key}" may only contain ${fileType} files.`);
    }
    this.cache.set(key, overlay);
    return overlay;
  }

  async getItem(name: string): Promise<RegistryItem> {
    const cached = this.cache.get(name);
    if (cached) return cached;
    if (!ITEM_NAME.test(name)) {
      throw userError(
        `"${name}" is not a valid item name.`,
        'Item names are lowercase kebab-case, e.g. "button".',
      );
    }
    let text: string;
    try {
      text = await this.read(`r/${name}.json`);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw userError(
          `Item "${name}" was not found in the registry.`,
          'Run "list" to see available items.',
        );
      }
      throw error;
    }
    const item = validateRegistryItem(parseJson(text, `"${name}"`), name);
    this.cache.set(name, item);
    return item;
  }
}
