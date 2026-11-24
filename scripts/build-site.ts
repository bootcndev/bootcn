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
const REGISTRY_PATHS = ['index.json', 'versions.json', 'r', 'v', 'schema'];
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

  process.stdout.write(
    `Built ${itemCount} item(s) (latest ${latest}) and ${versions.length} tagged version(s) plus the docs into ${relative(process.cwd(), OUT_DIR) || '.'}.\n`,
  );
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
