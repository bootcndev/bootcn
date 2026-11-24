/**
 * Builds the hosted registry site into `_site/`:
 *
 *   _site/index.json, r/*.json, schema/*   latest (the current checkout)
 *   _site/v/<version>/...                  one frozen copy per `registry-v<version>` git tag
 *   _site/versions.json                    { latest, versions }
 *   _site/*.html, assets/, previews/ ...   the docs site (apps/docs build)
 *
 * Tagged versions are rebuilt from the tag's own registry sources on every
 * deploy, so a published version never changes and never disappears.
 */
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

import { REGISTRY_DIR, buildRegistry } from '../packages/registry/tooling/registry.js';

const ROOT = resolve(REGISTRY_DIR, '..', '..');
const OUT_DIR = resolve(ROOT, '_site');
const DOCS_DIST = resolve(ROOT, 'apps', 'docs', '.vitepress', 'dist');
/** Paths the registry owns at the site root; the docs build must not contain them. */
const REGISTRY_PATHS = ['index.json', 'versions.json', 'r', 'v', 'schema', 'llms.txt'];
const TAG_PREFIX = 'registry-v';
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
}

function compareVersions(a: string, b: string): number {
  return a.localeCompare(b, 'en', { numeric: true });
}

async function buildTag(tag: string, version: string): Promise<void> {
  const tmp = await mkdtemp(join(tmpdir(), 'bootcn-site-'));
  try {
    // Extract only the registry sources of that tag.
    const archive = join(tmp, 'registry.tar');
    git(['archive', '--format=tar', `--output=${archive}`, tag, 'packages/registry']);
    execFileSync('tar', ['-xf', archive, '-C', tmp]);
    const dir = join(tmp, 'packages', 'registry');
    const meta = JSON.parse(await readFile(join(dir, 'registry.json'), 'utf8')) as {
      version?: string;
    };
    if (meta.version !== version) {
      throw new Error(
        `Tag ${tag} has registry.json version "${meta.version}", expected "${version}".`,
      );
    }
    await buildRegistry(dir, resolve(OUT_DIR, 'v', version));
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  // Latest first: buildRegistry empties its output directory.
  const { itemCount } = await buildRegistry(REGISTRY_DIR, OUT_DIR);
  const latest = (
    JSON.parse(await readFile(resolve(REGISTRY_DIR, 'registry.json'), 'utf8')) as {
      version: string;
    }
  ).version;

  const versions = git(['tag', '--list', `${TAG_PREFIX}*`])
    .split('\n')
    .map((tag) => tag.trim())
    .filter((tag) => tag !== '')
    .map((tag) => ({ tag, version: tag.slice(TAG_PREFIX.length) }))
    .filter(({ tag, version }) => {
      if (SEMVER.test(version)) return true;
      process.stderr.write(`Skipping tag ${tag}: not a semantic version.\n`);
      return false;
    })
    .sort((a, b) => compareVersions(a.version, b.version));

  for (const { tag, version } of versions) await buildTag(tag, version);

  await writeFile(
    resolve(OUT_DIR, 'versions.json'),
    `${JSON.stringify({ latest, versions: versions.map((v) => v.version) }, null, 2)}\n`,
    'utf8',
  );
  // Serve files as they are (no Jekyll processing on GitHub Pages).
  await writeFile(resolve(OUT_DIR, '.nojekyll'), '', 'utf8');
  await copyDocs();
  await writeLlmsTxt();

  process.stdout.write(
    `Built ${itemCount} item(s) (latest ${latest}) and ${versions.length} tagged version(s) plus the docs into ${relative(process.cwd(), OUT_DIR) || '.'}.\n`,
  );
}

const SITE_URL = 'https://bootcn.dev';

/** llms.txt (https://llmstxt.org): the docs and every item, for AI tools. */
async function writeLlmsTxt(): Promise<void> {
  const index = JSON.parse(await readFile(resolve(OUT_DIR, 'index.json'), 'utf8')) as {
    version: string;
    items: { name: string; type: string; title: string; description: string }[];
  };
  const sections: [string, string, string][] = [
    ['Components', 'registry:ui', 'components'],
    ['Blocks', 'registry:block', 'blocks'],
    ['Templates', 'registry:template', 'templates'],
  ];
  const guide = [
    ['Introduction', 'guide/introduction', 'What Bootcn is and how the registry works.'],
    ['Installation', 'guide/installation', 'Install components into a PHP or plain HTML project.'],
    ['CLI', 'guide/cli', 'Commands, options, updating and exit codes.'],
    ['Configuration', 'guide/configuration', 'bootcn.json, paths and pinning a registry version.'],
    ['Theming', 'guide/theming', 'Design tokens and how to change them.'],
    ['Dark mode', 'guide/dark-mode', 'Color modes, saving the choice and a toggle.'],
    ['Laravel', 'guide/laravel', 'Blade views, asset paths, Vite and Livewire.'],
    ['AI assistants (MCP)', 'guide/mcp', 'The bootcn mcp server for Claude, Cursor and VS Code.'],
    [
      'Right to left',
      'guide/rtl',
      'dir="rtl", Bootstrap\'s RTL CSS, logical properties and mirrored icons.',
    ],
  ];
  const lines = [
    '# Bootcn',
    '',
    `> Copy-paste UI components, blocks and templates for Bootstrap 5.3 and vanilla JavaScript, with a Tailwind-like look. Install with \`npx bootcn add <name>\`. Registry ${index.version}.`,
    '',
    'Each item below links to its documentation; its machine-readable source (all files inlined) is at `r/<name>.json`.',
    '',
    '## Docs',
    '',
    ...guide.map(([title, path, text]) => `- [${title}](${SITE_URL}/${path}): ${text}`),
  ];
  for (const [title, type, dir] of sections) {
    lines.push('', `## ${title}`, '');
    for (const item of index.items.filter((entry) => entry.type === type)) {
      lines.push(
        `- [${item.title}](${SITE_URL}/${dir}/${item.name}): ${item.description} Source: ${SITE_URL}/r/${item.name}.json`,
      );
    }
  }
  await writeFile(resolve(OUT_DIR, 'llms.txt'), `${lines.join('\n')}\n`, 'utf8');
}

async function copyDocs(): Promise<void> {
  const exists = await stat(DOCS_DIST).catch(() => null);
  if (!exists) {
    throw new Error(
      `Docs build not found at ${relative(ROOT, DOCS_DIST)}. Run "pnpm build" first.`,
    );
  }
  const clashes = (await readdir(DOCS_DIST)).filter((name) => REGISTRY_PATHS.includes(name));
  if (clashes.length > 0) {
    throw new Error(`The docs build contains registry paths: ${clashes.join(', ')}.`);
  }
  await cp(DOCS_DIST, OUT_DIR, { recursive: true });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`site:build failed: ${message}\n`);
  process.exit(1);
});
