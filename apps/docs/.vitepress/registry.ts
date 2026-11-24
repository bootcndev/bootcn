/**
 * Reads the built registry (packages/registry/dist), the same JSON the CLI
 * installs from. Component prose comes from each item's README.md.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DOCS_DIR = resolve(HERE, '..');
export const REPO_DIR = resolve(DOCS_DIR, '..', '..');
export const REGISTRY_SRC = resolve(REPO_DIR, 'packages', 'registry');
const REGISTRY_DIST = resolve(REGISTRY_SRC, 'dist');

export const GITHUB_URL = 'https://github.com/tsirosgeorge/bootcn';
export const NPM_URL = 'https://www.npmjs.com/package/bootcn';
export const REGISTRY_URL = 'https://tsirosgeorge.github.io/bootcn';

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

/** Registry items shown as component pages (everything except themes). */
export function componentItems(): RegistryIndex['items'] {
  return readIndex().items.filter((item) => item.type === 'registry:ui');
}

/** Directory of an item's sources inside packages/registry. */
export function sourceDir(name: string, type: string): string {
  return resolve(REGISTRY_SRC, type === 'registry:theme' ? 'themes' : 'components', name);
}

export function readReadme(name: string, type: string): string {
  const file = resolve(sourceDir(name, type), 'README.md');
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
}

/** Sidebar groups, chosen by an item's first category. */
const GROUPS: [label: string, categories: string[]][] = [
  ['Actions', ['buttons', 'actions']],
  ['Forms', ['forms']],
  ['Navigation', ['navigation']],
  ['Overlays', ['overlays']],
  ['Feedback', ['feedback']],
  ['Data display', ['data-display']],
  ['Layout', ['layout']],
];

export function groupOf(categories: string[] = []): string {
  const first = categories[0];
  const group = GROUPS.find(([, cats]) => first !== undefined && cats.includes(first));
  return group ? group[0] : 'Other';
}

export function groupedComponents(): { label: string; items: RegistryIndex['items'] }[] {
  const items = componentItems();
  const labels = [...GROUPS.map(([label]) => label), 'Other'];
  return labels
    .map((label) => ({
      label,
      items: items
        .filter((item) => groupOf(item.categories) === label)
        .sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * Copies the registry sources the previews load (preview.html plus CSS/JS,
 * and the tokens theme) into public/previews, keeping the relative paths
 * preview.html files use (../../themes/tokens/tokens.css, ../button/button.css).
 */
export function copyPreviews(): void {
  const out = resolve(DOCS_DIR, 'public', 'previews');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const kind of ['components', 'themes']) {
    cpSync(resolve(REGISTRY_SRC, kind), resolve(out, kind), {
      recursive: true,
      filter: (src) => !['.md', '.json'].includes(extname(src)),
    });
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
  const entry = componentItems().find((item) => item.name === name);
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
