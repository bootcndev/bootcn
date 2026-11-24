/**
 * Reads the built registry (packages/registry/dist), the same JSON the CLI
 * installs from. Component prose comes from each item's README.md.
 */
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DOCS_DIR = resolve(HERE, '..');
export const REPO_DIR = resolve(DOCS_DIR, '..', '..');
export const REGISTRY_SRC = resolve(REPO_DIR, 'packages', 'registry');
const REGISTRY_DIST = resolve(REGISTRY_SRC, 'dist');

export const GITHUB_URL = 'https://github.com/tsirosgeorge/bootcn';
export const NPM_URL = 'https://www.npmjs.com/package/bootcn';
export const X_URL = 'https://x.com/bootcndev';
export const SITE_URL = 'https://bootcn.dev';
export const REGISTRY_URL = SITE_URL;

/** Default install locations written by `bootcn init` (packages/cli/src/project.ts). */
export const DEFAULT_PATHS: Record<string, string> = {
  'registry:component': 'components/ui',
  'registry:style': 'assets/css',
  'registry:script': 'assets/js',
  'registry:lib': 'assets/js/lib',
};

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
  registryDependencies?: string[];
  compatibility?: { bootstrap?: string; platform?: string[] };
  accessibility?: { notes?: string; keyboard?: string[] };
  files: RegistryFile[];
}

export interface RegistryIndex {
  name: string;
  version: string;
  items: {
    name: string;
    type: string;
    title: string;
    description: string;
    version: string;
    categories?: string[];
  }[];
}

function readJson<T>(file: string): T {
  if (!existsSync(file)) {
    throw new Error(`${file} is missing. Run "pnpm registry:build" at the repository root first.`);
  }
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

export function readIndex(): RegistryIndex {
  return readJson<RegistryIndex>(resolve(REGISTRY_DIST, 'index.json'));
}

export function readItem(name: string): RegistryItem {
  return readJson<RegistryItem>(resolve(REGISTRY_DIST, 'r', `${name}.json`));
}

/** The three kinds of documented items, each with its own section of the site. */
export const KINDS = {
  components: { type: 'registry:ui', dir: 'components', title: 'Components' },
  blocks: { type: 'registry:block', dir: 'blocks', title: 'Blocks' },
  templates: { type: 'registry:template', dir: 'templates', title: 'Templates' },
} as const;

export type Kind = keyof typeof KINDS;

export function itemsOf(kind: Kind): RegistryIndex['items'] {
  return readIndex().items.filter((item) => item.type === KINDS[kind].type);
}

/** Registry items shown as component pages. */
export function componentItems(): RegistryIndex['items'] {
  return itemsOf('components');
}

/** Directory of an item's sources inside packages/registry. */
export function sourceDir(name: string, type: string): string {
  const kind = (Object.keys(KINDS) as Kind[]).find((key) => KINDS[key].type === type);
  return resolve(REGISTRY_SRC, kind ? KINDS[kind].dir : 'themes', name);
}

export function readReadme(name: string, type: string): string {
  const file = resolve(sourceDir(name, type), 'README.md');
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
}

/** Sidebar groups per kind, chosen by an item's first category. */
const GROUPS: Record<Kind, [label: string, categories: string[]][]> = {
  components: [
    ['Actions', ['buttons', 'actions']],
    ['Forms', ['forms']],
    ['Navigation', ['navigation']],
    ['Overlays', ['overlays']],
    ['Feedback', ['feedback']],
    ['Data display', ['data-display']],
    ['Layout', ['layout']],
  ],
  blocks: [
    ['Authentication', ['authentication']],
    ['Dashboard', ['dashboard']],
    ['Navigation', ['navigation']],
    ['Marketing', ['marketing']],
    ['Charts', ['charts']],
  ],
  templates: [['Templates', []]],
};

export function groupOf(categories: string[] = [], kind: Kind = 'components'): string {
  const groups = GROUPS[kind];
  if (kind === 'templates') return groups[0]![0];
  const first = categories[0];
  const group = groups.find(([, cats]) => first !== undefined && cats.includes(first));
  return group ? group[0] : 'Other';
}

export function grouped(kind: Kind): { label: string; items: RegistryIndex['items'] }[] {
  const items = itemsOf(kind);
  const labels = [...GROUPS[kind].map(([label]) => label), 'Other'];
  return labels
    .map((label) => ({
      label,
      items: items
        .filter((item) => groupOf(item.categories, kind) === label)
        .sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .filter((group) => group.items.length > 0);
}

export function groupedComponents(): { label: string; items: RegistryIndex['items'] }[] {
  return grouped('components');
}

/** Where the docs serve a template's installed page, relative to the site base. */
export function templatePreviewPath(name: string): string {
  const page = readItem(name).files.find((file) => file.type === 'registry:page');
  if (!page) throw new Error(`Template "${name}" has no registry:page file.`);
  return `previews/templates/${name}/${page.target}`;
}

/**
 * Previews, written to public/previews:
 * - components and blocks: the registry sources as they are (preview.html
 *   plus CSS/JS, and the tokens theme), so their relative links keep working;
 * - templates: installed with the real CLI into a fresh project, so the
 *   preview is exactly what `bootcn add <template>` produces.
 */
export function copyPreviews(): void {
  const out = resolve(DOCS_DIR, 'public', 'previews');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const kind of ['components', 'blocks', 'themes']) {
    const from = resolve(REGISTRY_SRC, kind);
    if (!existsSync(from)) continue;
    cpSync(from, resolve(out, kind), {
      recursive: true,
      filter: (src) => !['.md', '.json'].includes(extname(src)),
    });
  }

  const cli = resolve(REPO_DIR, 'packages', 'cli', 'dist', 'index.js');
  if (!existsSync(cli)) {
    throw new Error(`${cli} is missing. Run "pnpm build" at the repository root first.`);
  }
  for (const item of itemsOf('templates')) {
    const project = mkdtempSync(join(tmpdir(), 'bootcn-docs-'));
    try {
      const run = (args: string[]) =>
        execFileSync(process.execPath, [cli, ...args, '--yes', '--cwd', project], {
          stdio: 'pipe',
        });
      writeFileSync(join(project, 'index.html'), '<!doctype html>\n');
      run(['init', '--registry', REGISTRY_DIST]);
      run(['add', item.name]);
      rmSync(join(project, 'index.html'));
      rmSync(join(project, 'bootcn.json'));
      cpSync(project, resolve(out, 'templates', item.name), { recursive: true });
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  }
}

/**
 * Search entry for a generated component page. VitePress's local search
 * reads page files from disk, and dynamic routes have none, so these pages
 * would otherwise not be searchable.
 */
export function componentSearchSections(
  name: string,
): { anchor: string; titles: string[]; text: string }[] {
  const entry = readIndex().items.find((item) => item.name === name);
  if (!entry) return [];
  const readme = readReadme(name, entry.type)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*`|>_-]+/g, ' ')
    .replace(/\s+/g, ' ');
  return [
    {
      anchor: '',
      titles: [entry.title],
      text: `${entry.description} npx bootcn add ${name} ${readme}`,
    },
  ];
}
