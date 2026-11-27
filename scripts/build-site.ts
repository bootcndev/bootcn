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
    ['Translations', 'guide/i18n', 'window.Bootcn.messages and plurals for announced texts.'],
    ['Animations', 'guide/animations', 'Motion tokens, reduced motion and your own transitions.'],
    ['Laravel', 'guide/laravel', 'Blade views, asset paths, Vite and Livewire.'],
    ['AI assistants (MCP)', 'guide/mcp', 'The bootcn mcp server for Claude, Cursor and VS Code.'],
    ['Contributing', 'guide/contributing', 'Set up the repository, the conventions and the tests.'],
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
    'Each item below links to its documentation in Markdown; its machine-readable source (all files inlined) is at `r/<name>.json`. Everything in one file: ' +
      `${SITE_URL}/llms-full.txt. An agent skill for AI assistants: ${SITE_URL}/skills/bootcn/SKILL.md.`,
    '',
    '## Docs',
    '',
    ...guide.map(([title, path, text]) => `- [${title}](${SITE_URL}/${path}): ${text}`),
  ];
  for (const [title, type, dir] of sections) {
    lines.push('', `## ${title}`, '');
    for (const item of index.items.filter((entry) => entry.type === type)) {
      lines.push(
        `- [${item.title}](${SITE_URL}/${dir}/${item.name}.md): ${item.description} Source: ${SITE_URL}/r/${item.name}.json`,
      );
    }
  }
  await writeFile(resolve(OUT_DIR, 'llms.txt'), `${lines.join('\n')}\n`, 'utf8');
  await writeMarkdown(index, guide, sections);
}

/** Front matter and Vue-only lines are of no use outside the site. */
function plainMarkdown(source: string): string {
  return source
    .replace(/^---\n[\s\S]*?\n---\n+/, '')
    .replace(/<script setup>[\s\S]*?<\/script>\n*/g, '')
    .trim();
}

/**
 * Markdown for AI assistants and other tools: every guide page and item page
 * next to its HTML page (/components/dialog.md), all of them in
 * llms-full.txt, and the agent skill.
 */
async function writeMarkdown(
  index: {
    version: string;
    items: { name: string; type: string; title: string; description: string }[];
  },
  guide: string[][],
  sections: [string, string, string][],
): Promise<void> {
  const full: string[] = [
    '# Bootcn',
    '',
    `> Copy-paste UI components, blocks and templates for Bootstrap 5.3 in plain HTML, CSS and vanilla JavaScript. Registry ${index.version}. Install with \`npx bootcn@latest add <name>\`.`,
  ];
  const docs = resolve(ROOT, 'apps', 'docs');
  for (const [, path] of guide) {
    const text = plainMarkdown(await readFile(resolve(docs, `${path}.md`), 'utf8'));
    await writeFile(resolve(OUT_DIR, `${path}.md`), `${text}\n`, 'utf8');
    full.push('', '---', '', `Source: ${SITE_URL}/${path}`, '', text);
  }
  for (const [, type, dir] of sections) {
    for (const item of index.items.filter((entry) => entry.type === type)) {
      const manifest = JSON.parse(
        await readFile(resolve(REGISTRY_DIR, dir, item.name, 'manifest.json'), 'utf8'),
      ) as { files: { target: string }[]; registryDependencies?: string[] };
      const readme = await readFile(
        resolve(REGISTRY_DIR, dir, item.name, 'README.md'),
        'utf8',
      ).catch(() => '');
      // The README starts with the title and description: keep the rest.
      const body = readme.replace(/^# .*\n+(?:.*\n)*?\n/, '').trim();
      const deps = manifest.registryDependencies ?? [];
      const page = [
        `# ${item.title}`,
        '',
        `> ${item.description}`,
        '',
        `- Install: \`npx bootcn@latest add ${item.name}\``,
        `- Docs: ${SITE_URL}/${dir}/${item.name}`,
        `- Source with every file: ${SITE_URL}/r/${item.name}.json`,
        `- Files: ${manifest.files.map((file) => file.target).join(', ')}`,
        ...(deps.length ? [`- Installs too: ${deps.join(', ')}`] : []),
        '',
        body,
      ].join('\n');
      await writeFile(resolve(OUT_DIR, dir, `${item.name}.md`), `${page}\n`, 'utf8');
      full.push('', '---', '', page);
    }
  }
  await writeFile(resolve(OUT_DIR, 'llms-full.txt'), `${full.join('\n')}\n`, 'utf8');
  await cp(resolve(ROOT, 'skills'), resolve(OUT_DIR, 'skills'), { recursive: true });
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
  await noindex();
}

const NOINDEX = '<meta name="robots" content="noindex">';

/**
 * Keep search engines to the documentation pages: the live previews (shown in
 * iframes on those pages) and the 404 page get a robots noindex. Previews stay
 * crawlable, so the pages that embed them still render for search engines.
 */
async function noindex(): Promise<void> {
  const files = [resolve(OUT_DIR, '404.html')];
  const walk = async (dir: string): Promise<void> => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith('.html')) files.push(path);
    }
  };
  await walk(resolve(OUT_DIR, 'previews'));
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    if (html.includes(NOINDEX)) continue;
    // Fragments (component markup the previews include) have no <head>.
    if (!/<head[\s>]/i.test(html)) continue;
    const marked = html.replace(/<head([^>]*)>/i, `<head$1>\n    ${NOINDEX}`);
    await writeFile(file, marked, 'utf8');
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`site:build failed: ${message}\n`);
  process.exit(1);
});
