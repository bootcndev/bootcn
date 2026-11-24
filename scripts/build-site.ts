/**
 * Builds the hosted registry site into `_site/`:
 *
 *   _site/index.json, r/*.json, schema/*   latest (the current checkout)
 *   _site/v/<version>/...                  one frozen copy per `registry-v<version>` git tag
 *   _site/versions.json                    { latest, versions }
 *
 * Tagged versions are rebuilt from the tag's own registry sources on every
 * deploy, so a published version never changes and never disappears.
 */
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

import { REGISTRY_DIR, buildRegistry } from '../packages/registry/tooling/registry.js';

const ROOT = resolve(REGISTRY_DIR, '..', '..');
const OUT_DIR = resolve(ROOT, '_site');
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
  await writeFile(resolve(OUT_DIR, 'index.html'), landingPage(latest), 'utf8');

  process.stdout.write(
    `Built ${itemCount} item(s) (latest ${latest}) and ${versions.length} tagged version(s) into ${relative(process.cwd(), OUT_DIR) || '.'}.\n`,
  );
}

function landingPage(latest: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bootcn registry</title>
  </head>
  <body>
    <main>
      <h1>Bootcn registry</h1>
      <p>Machine-readable component registry for the <code>bootcn</code> CLI (latest ${latest}).</p>
      <ul>
        <li><a href="index.json">index.json</a>: every item</li>
        <li><a href="versions.json">versions.json</a>: published versions, each under <code>v/&lt;version&gt;/</code></li>
        <li><a href="https://github.com/tsirosgeorge/bootcn">Source and documentation</a></li>
      </ul>
    </main>
  </body>
</html>
`;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`site:build failed: ${message}\n`);
  process.exit(1);
});
