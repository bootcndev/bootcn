/**
 * Registry tooling: discovery, validation and build of the Bootcn registry.
 *
 * Used by scripts/validate-registry.ts, scripts/build-registry.ts and the
 * registry tests. This file is development tooling; it is never installed into
 * a user's project.
 */
import { lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ErrorObject, ValidateFunction } from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const here = dirname(fileURLToPath(import.meta.url));

/** Directory of the canonical JSON schemas. */
export const SCHEMA_DIR = resolve(here, '../schema');

/** Directory of the real registry source (packages/registry). */
export const REGISTRY_DIR = resolve(here, '..');

/** Item directories and the item type each one must contain. */
export const KIND_DIRS = {
  components: 'registry:ui',
  blocks: 'registry:block',
  templates: 'registry:template',
  themes: 'registry:theme',
  lib: 'registry:lib',
} as const;

/** File extensions allowed anywhere inside an item directory. */
export const ALLOWED_EXTENSIONS = new Set(['.html', '.css', '.js', '.md', '.json', '.php']);

/** Allowed source extensions per registry file type. */
export const FILE_TYPE_EXTENSIONS: Record<string, readonly string[]> = {
  'registry:component': ['.html', '.php'],
  'registry:style': ['.css'],
  'registry:script': ['.js'],
  'registry:lib': ['.js'],
  'registry:page': ['.html', '.php'],
};

/** Placeholders a registry:page may use; the CLI replaces them on install. */
export const PAGE_PLACEHOLDERS = ['components', 'css', 'js', 'lib'] as const;

const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;

/** True when semantic version `a` is later than `b` (release parts only). */
export function newer(a: string, b: string): boolean {
  const pa = a.split(/[-+]/)[0]!.split('.').map(Number);
  const pb = b.split(/[-+]/)[0]!.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i]! > pb[i]!;
  }
  return false;
}

export interface ManifestFile {
  path: string;
  target: string;
  type: string;
  content?: string;
}

export interface Manifest {
  $schema?: string;
  name: string;
  type: string;
  title: string;
  description: string;
  version?: string;
  /** Registry version that first shipped the item. */
  added?: string;
  categories?: string[];
  dependencies?: string[];
  registryDependencies?: string[];
  files: ManifestFile[];
  [key: string]: unknown;
}

export interface LoadedItem {
  /** Absolute path of the item directory. */
  dir: string;
  /** Item directory relative to the registry root, POSIX separators. */
  relDir: string;
  manifest: Manifest;
}

export interface RegistryMeta {
  name: string;
  version: string;
}

export interface ValidationResult {
  meta: RegistryMeta | null;
  items: LoadedItem[];
  errors: string[];
}

function toPosix(path: string): string {
  return path.split('\\').join('/');
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map((error) => {
    const where = error.instancePath || '/';
    const extra =
      error.keyword === 'additionalProperties'
        ? ` ("${String((error.params as { additionalProperty?: string }).additionalProperty)}")`
        : error.keyword === 'enum'
          ? ` (${JSON.stringify((error.params as { allowedValues?: unknown }).allowedValues)})`
          : '';
    return `${where} ${error.message ?? 'is invalid'}${extra}`;
  });
}

let itemValidator: ValidateFunction | null = null;

async function getItemValidator(): Promise<ValidateFunction> {
  if (itemValidator) return itemValidator;
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const schema = JSON.parse(
    await readFile(resolve(SCHEMA_DIR, 'registry-item.schema.json'), 'utf8'),
  ) as object;
  itemValidator = ajv.compile(schema);
  return itemValidator;
}

/**
 * Returns a reason string when `path` is not a safe, normalized, relative
 * POSIX path, or null when it is safe.
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

async function exists(path: string): Promise<boolean> {
  return (await lstat(path).catch(() => null)) !== null;
}

/** Lists every file under `dir` (recursively), reporting symlinks separately. */
async function walk(dir: string): Promise<{ files: string[]; symlinks: string[] }> {
  const files: string[] = [];
  const symlinks: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isSymbolicLink()) symlinks.push(full);
    else if (entry.isDirectory()) {
      const nested = await walk(full);
      files.push(...nested.files);
      symlinks.push(...nested.symlinks);
    } else files.push(full);
  }
  return { files, symlinks };
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

/** Finds the cycles in the registryDependencies graph. */
export function findCycles(graph: Map<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];

  const visit = (node: string): void => {
    state.set(node, 'visiting');
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      if (!graph.has(next)) continue;
      const nextState = state.get(next);
      if (nextState === 'visiting') {
        cycles.push([...stack.slice(stack.indexOf(next)), next]);
      } else if (nextState === undefined) {
        visit(next);
      }
    }
    stack.pop();
    state.set(node, 'done');
  };

  for (const node of [...graph.keys()].sort()) {
    if (!state.has(node)) visit(node);
  }
  return cycles;
}

/**
 * Validates a registry directory against everything in spec section 9.5.
 * Never throws for content problems; they are returned in `errors`.
 */
export async function validateRegistry(registryDir: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const items: LoadedItem[] = [];
  let meta: RegistryMeta | null = null;

  // registry.json
  const metaPath = resolve(registryDir, 'registry.json');
  try {
    const raw = (await readJson(metaPath)) as Partial<RegistryMeta>;
    if (typeof raw.name !== 'string' || raw.name.length === 0) {
      errors.push('registry.json: "name" must be a non-empty string.');
    } else if (typeof raw.version !== 'string' || !SEMVER.test(raw.version)) {
      errors.push('registry.json: "version" must be a semantic version (for example "0.1.0").');
    } else {
      meta = { name: raw.name, version: raw.version };
    }
  } catch (error) {
    errors.push(`registry.json: cannot be read as JSON (${(error as Error).message}).`);
  }

  const validate = await getItemValidator();

  // Discover and validate each item directory.
  for (const [kindDir, expectedType] of Object.entries(KIND_DIRS)) {
    const kindPath = resolve(registryDir, kindDir);
    if (!(await exists(kindPath))) continue;

    const entries = await readdir(kindPath, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const relDir = `${kindDir}/${entry.name}`;
      const dir = resolve(kindPath, entry.name);

      if (entry.isSymbolicLink()) {
        errors.push(`${relDir}: item directories must not be symlinks.`);
        continue;
      }
      if (!entry.isDirectory()) {
        if (entry.name !== '.gitkeep') {
          errors.push(`${relDir}: unexpected file; put item files inside an item directory.`);
        }
        continue;
      }

      // File allow-list and symlinks.
      const { files, symlinks } = await walk(dir);
      for (const link of symlinks) {
        errors.push(`${toPosix(relative(registryDir, link))}: symlinks are not allowed.`);
      }
      for (const file of files) {
        const ext = extname(file).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          errors.push(
            `${toPosix(relative(registryDir, file))}: extension "${ext || '(none)'}" is not allowed (allowed: ${[...ALLOWED_EXTENSIONS].join(' ')}).`,
          );
        }
      }

      const manifestPath = resolve(dir, 'manifest.json');
      if (!(await exists(manifestPath))) {
        errors.push(`${relDir}: missing manifest.json.`);
        continue;
      }

      let manifest: Manifest;
      try {
        manifest = (await readJson(manifestPath)) as Manifest;
      } catch (error) {
        errors.push(`${relDir}/manifest.json: invalid JSON (${(error as Error).message}).`);
        continue;
      }

      if (!validate(manifest)) {
        for (const message of formatAjvErrors(validate.errors)) {
          errors.push(`${relDir}/manifest.json: ${message}`);
        }
        continue;
      }

      const label = `${relDir}/manifest.json`;
      if (manifest.name !== entry.name) {
        errors.push(`${label}: "name" is "${manifest.name}" but the directory is "${entry.name}".`);
      }
      if (manifest.type !== expectedType) {
        errors.push(
          `${label}: items in "${kindDir}/" must have type "${expectedType}", found "${manifest.type}".`,
        );
      }
      if (manifest.version === undefined) {
        errors.push(`${label}: "version" is required.`);
      }
      if (manifest.added !== undefined && meta && newer(manifest.added, meta.version)) {
        errors.push(
          `${label}: "added" is ${manifest.added}, later than the registry version ${meta.version}.`,
        );
      }

      const seenPaths = new Set<string>();
      const seenTargets = new Set<string>();
      for (const file of manifest.files) {
        for (const [field, value] of [
          ['path', file.path],
          ['target', file.target],
        ] as const) {
          const reason = unsafePathReason(value);
          if (reason) errors.push(`${label}: file ${field} "${value}" ${reason}.`);
        }
        if (file.content !== undefined) {
          errors.push(`${label}: "content" is generated by the build; remove it from the source.`);
        }
        if (seenPaths.has(file.path)) errors.push(`${label}: duplicate file path "${file.path}".`);
        seenPaths.add(file.path);
        const targetKey = `${file.type}:${file.target}`;
        if (seenTargets.has(targetKey)) {
          errors.push(`${label}: duplicate target "${file.target}" for ${file.type}.`);
        }
        seenTargets.add(targetKey);

        const allowed = FILE_TYPE_EXTENSIONS[file.type] ?? [];
        const sourceExt = posix.extname(file.path).toLowerCase();
        const targetExt = posix.extname(file.target).toLowerCase();
        if (!allowed.includes(sourceExt)) {
          errors.push(
            `${label}: "${file.path}" has type ${file.type}, which expects ${allowed.join(' or ')}.`,
          );
        }
        if (sourceExt !== targetExt) {
          errors.push(
            `${label}: target "${file.target}" must keep the source extension "${sourceExt}".`,
          );
        }

        if (unsafePathReason(file.path) === null) {
          const source = resolve(dir, file.path);
          const info = await lstat(source).catch(() => null);
          if (!info) errors.push(`${label}: file "${file.path}" does not exist.`);
          else if (!info.isFile()) errors.push(`${label}: "${file.path}" is not a regular file.`);
          else {
            const text = await readFile(source, 'utf8');
            for (const match of text.matchAll(/\{\{\s*bootcn:([^}]*)\}\}/g)) {
              const key = match[1] ?? '';
              if (file.type !== 'registry:page') {
                errors.push(
                  `${label}: "${file.path}" uses ${match[0]}, but placeholders are only replaced in registry:page files.`,
                );
              } else if (!(PAGE_PLACEHOLDERS as readonly string[]).includes(key)) {
                errors.push(
                  `${label}: "${file.path}" uses unknown placeholder ${match[0]} (use ${PAGE_PLACEHOLDERS.map((k) => `{{bootcn:${k}}}`).join(', ')}).`,
                );
              }
            }
          }
        }
      }

      items.push({ dir, relDir, manifest });
    }
  }

  // Unique names.
  const byName = new Map<string, LoadedItem>();
  for (const item of items) {
    const previous = byName.get(item.manifest.name);
    if (previous) {
      errors.push(
        `Duplicate item name "${item.manifest.name}" in ${previous.relDir} and ${item.relDir}.`,
      );
    } else byName.set(item.manifest.name, item);
  }

  // Targets must not collide across items (two items writing the same file).
  const targetOwners = new Map<string, string>();
  for (const item of items) {
    for (const file of item.manifest.files) {
      const key = `${file.type}:${file.target}`;
      const owner = targetOwners.get(key);
      if (owner && owner !== item.manifest.name) {
        errors.push(
          `Items "${owner}" and "${item.manifest.name}" both install ${file.type} "${file.target}".`,
        );
      } else targetOwners.set(key, item.manifest.name);
    }
  }

  // Registry dependencies exist, are not self-references, and have no cycles.
  const graph = new Map<string, string[]>();
  for (const item of items) {
    const deps = item.manifest.registryDependencies ?? [];
    graph.set(item.manifest.name, deps);
    for (const dep of deps) {
      if (dep === item.manifest.name) {
        errors.push(`${item.relDir}/manifest.json: item depends on itself.`);
      } else if (!byName.has(dep)) {
        errors.push(`${item.relDir}/manifest.json: registry dependency "${dep}" does not exist.`);
      }
    }
  }
  for (const cycle of findCycles(graph)) {
    if (cycle.length > 2) errors.push(`Dependency cycle: ${cycle.join(' -> ')}.`);
  }

  items.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
  return { meta, items, errors };
}

/** Recursively sorts object keys so JSON output is deterministic. */
export function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

function toJson(value: unknown): string {
  return `${JSON.stringify(sortKeys(value), null, 2)}\n`;
}

export interface BuildResult {
  outDir: string;
  itemCount: number;
}

/**
 * Validates and builds the registry into `outDir`:
 * - index.json: every item's summary, sorted by name;
 * - r/<name>.json: the full item with file contents inlined;
 * - schema/*.json: copies of the schemas, for hosting.
 * Throws with every validation error when the registry is invalid.
 */
export async function buildRegistry(registryDir: string, outDir: string): Promise<BuildResult> {
  const result = await validateRegistry(registryDir);
  if (result.errors.length > 0 || !result.meta) {
    throw new Error(
      `Registry is invalid:\n${result.errors.map((error) => `  - ${error}`).join('\n')}`,
    );
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(resolve(outDir, 'r'), { recursive: true });
  await mkdir(resolve(outDir, 'schema'), { recursive: true });

  const index = {
    name: result.meta.name,
    version: result.meta.version,
    items: result.items.map(({ manifest }) => ({
      name: manifest.name,
      type: manifest.type,
      title: manifest.title,
      description: manifest.description,
      version: manifest.version,
      ...(manifest.categories ? { categories: manifest.categories } : {}),
      files: manifest.files.map((file) => ({ type: file.type, target: file.target })),
    })),
  };
  await writeFile(resolve(outDir, 'index.json'), toJson(index), 'utf8');

  for (const { dir, manifest } of result.items) {
    // "added" is for the docs site only: CLIs up to 0.6 reject unknown keys.
    const { $schema: _schema, added: _added, ...rest } = manifest;
    void _schema;
    void _added;
    const files = await Promise.all(
      manifest.files.map(async (file) => ({
        ...file,
        content: (await readFile(resolve(dir, file.path), 'utf8')).replace(/\r\n/g, '\n'),
      })),
    );
    await writeFile(
      resolve(outDir, 'r', `${manifest.name}.json`),
      toJson({ ...rest, files }),
      'utf8',
    );
  }

  for (const name of (await readdir(SCHEMA_DIR)).sort()) {
    if (name.endsWith('.json')) {
      await writeFile(
        resolve(outDir, 'schema', name),
        await readFile(resolve(SCHEMA_DIR, name), 'utf8'),
        'utf8',
      );
    }
  }

  return { outDir, itemCount: result.items.length };
}
