import { chmod, lstat, readFile, readdir, symlink } from 'node:fs/promises';
import { resolve } from 'node:path';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { EXIT } from '../src/constants.js';
import {
  REGISTRY_SOURCE,
  builtRegistry,
  cleanupTempDirs,
  read,
  runCli,
  scriptedPrompter,
  tempDir,
  writeFiles,
} from './helpers.js';

let registry: string;
let dispose: () => Promise<void>;

beforeAll(async () => {
  ({ dir: registry, dispose } = await builtRegistry());
});

afterAll(() => dispose());

afterEach(cleanupTempDirs);

async function exists(path: string): Promise<boolean> {
  return (await lstat(path).catch(() => null)) !== null;
}

async function source(path: string): Promise<string> {
  return readFile(resolve(REGISTRY_SOURCE, path), 'utf8');
}

async function initProject(files: Record<string, string> = { 'index.html': '<!doctype html>' }) {
  const root = await tempDir();
  await writeFiles(root, files);
  const result = await runCli(['init', '--yes', '--cwd', root, '--registry', registry]);
  expect(result.code, result.output).toBe(EXIT.ok);
  return root;
}

describe('init', () => {
  it('writes bootcn.json, creates directories and installs tokens', async () => {
    const root = await initProject();
    const config = JSON.parse(await read(root, 'bootcn.json')) as {
      paths: Record<string, string>;
      registry: string;
    };
    expect(config.paths).toEqual({
      components: 'components/ui',
      css: 'assets/css',
      js: 'assets/js',
      lib: 'assets/js/lib',
    });
    expect(config.registry).toBe(registry);
    expect(await read(root, 'assets/css/tokens.css')).toBe(
      await source('themes/tokens/tokens.css'),
    );
    for (const dir of ['components/ui', 'assets/css', 'assets/js', 'assets/js/lib']) {
      expect(await exists(resolve(root, dir)), dir).toBe(true);
    }
  });

  it('detects a native PHP project with a public/ directory', async () => {
    const root = await tempDir();
    await writeFiles(root, { 'composer.json': '{}', 'public/index.php': '<?php' });
    const result = await runCli(['init', '--yes', '--cwd', root, '--registry', registry]);
    expect(result.output).toMatch(/native PHP project/);
    const config = JSON.parse(await read(root, 'bootcn.json')) as { paths: Record<string, string> };
    expect(config.paths.css).toBe('public/assets/css');
    expect(config.paths.components).toBe('components/ui');
    expect(await exists(resolve(root, 'public/assets/css/tokens.css'))).toBe(true);
  });

  it('detects Bootstrap from a CDN tag and warns when it is missing', async () => {
    const withBootstrap = await tempDir();
    await writeFiles(withBootstrap, {
      'index.html':
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.9/dist/css/bootstrap.min.css">',
    });
    const found = await runCli([
      'init',
      '--yes',
      '--dry-run',
      '--cwd',
      withBootstrap,
      '--registry',
      registry,
    ]);
    expect(found.output).toMatch(/Found Bootstrap \(index.html\)/);

    const without = await tempDir();
    await writeFiles(without, { 'index.html': '<p>hi</p>' });
    const missing = await runCli([
      'init',
      '--yes',
      '--dry-run',
      '--cwd',
      without,
      '--registry',
      registry,
    ]);
    expect(missing.output).toMatch(/Bootstrap 5.3\+ was not found/);
    expect(missing.output).toMatch(/integrity="sha384-/);
    expect(await read(without, 'index.html')).toBe('<p>hi</p>');
  });

  it('does nothing when bootcn.json exists and the run is non-interactive', async () => {
    const root = await initProject();
    const before = await read(root, 'bootcn.json');
    const result = await runCli(['init', '--yes', '--cwd', root, '--registry', '/elsewhere']);
    expect(result.code).toBe(EXIT.ok);
    expect(result.output).toMatch(/already exists/);
    expect(await read(root, 'bootcn.json')).toBe(before);
  });

  it('asks before re-initializing and keeps the config on "no"', async () => {
    const root = await initProject();
    const before = await read(root, 'bootcn.json');
    const prompt = scriptedPrompter([false]);
    const result = await runCli(['init', '--cwd', root, '--registry', registry], {
      interactive: true,
      prompt,
    });
    expect(result.code).toBe(EXIT.ok);
    expect(prompt.asked[0]).toMatch(/Re-initialize/);
    expect(await read(root, 'bootcn.json')).toBe(before);
  });

  it('lets the user edit the paths interactively', async () => {
    const root = await tempDir();
    await writeFiles(root, { 'index.html': '' });
    // components, css, js, lib, then "Install 1 file(s)?"
    const prompt = scriptedPrompter(['ui', 'static/css', 'static/js', 'static/js/lib', true]);
    const result = await runCli(['init', '--cwd', root, '--registry', registry], {
      interactive: true,
      prompt,
    });
    expect(result.code, result.output).toBe(EXIT.ok);
    expect(await exists(resolve(root, 'static/css/tokens.css'))).toBe(true);
    expect(await exists(resolve(root, 'ui'))).toBe(true);
  });

  it('writes nothing with --dry-run', async () => {
    const root = await tempDir();
    await writeFiles(root, { 'index.html': '' });
    const result = await runCli([
      'init',
      '--yes',
      '--dry-run',
      '--cwd',
      root,
      '--registry',
      registry,
    ]);
    expect(result.code).toBe(EXIT.ok);
    expect(result.output).toMatch(/Would write bootcn.json/);
    expect(await readdir(root)).toEqual(['index.html']);
  });

  it('fails cleanly when the registry is unreachable, writing nothing', async () => {
    const root = await tempDir();
    await writeFiles(root, { 'index.html': '' });
    const result = await runCli([
      'init',
      '--yes',
      '--cwd',
      root,
      '--registry',
      resolve(root, 'missing'),
    ]);
    expect(result.code).toBe(EXIT.user);
    expect(await readdir(root)).toEqual(['index.html']);
  });
});

describe('add', () => {
  it('installs items with their dependencies, byte-for-byte', async () => {
    const root = await initProject();
    const result = await runCli(['add', 'dialog', '--yes', '--cwd', root]);
    expect(result.code, result.output).toBe(EXIT.ok);
    expect(await read(root, 'components/ui/dialog.html')).toBe(
      await source('components/dialog/dialog.html'),
    );
    expect(await read(root, 'assets/css/dialog.css')).toBe(
      await source('components/dialog/dialog.css'),
    );
    expect(await read(root, 'assets/js/dialog.js')).toBe(
      await source('components/dialog/dialog.js'),
    );
    // registryDependencies: dialog -> button
    expect(await read(root, 'assets/css/button.css')).toBe(
      await source('components/button/button.css'),
    );
    expect(result.output).toMatch(/Bootstrap JS bundle/);
    expect(result.output).toMatch(/installed JavaScript runs in your application/);
    expect(result.output).toMatch(/<script src="assets\/js\/dialog.js"><\/script>/);
  });

  it('reports identical files as unchanged', async () => {
    const root = await initProject();
    await runCli(['add', 'badge', '--yes', '--cwd', root]);
    const again = await runCli(['add', 'badge', '--yes', '--cwd', root]);
    expect(again.code).toBe(EXIT.ok);
    expect(again.output).toMatch(/unchanged\s+assets\/css\/badge.css/);
    expect(again.output).not.toMatch(/wrote/);
  });

  it('never overwrites a changed file with --yes', async () => {
    const root = await initProject();
    await runCli(['add', 'button', '--yes', '--cwd', root]);
    await writeFiles(root, { 'assets/css/button.css': '/* my changes */\n' });
    const result = await runCli(['add', 'button', '--yes', '--cwd', root]);
    expect(result.code).toBe(EXIT.ok);
    expect(result.output).toMatch(/skipped assets\/css\/button.css/);
    expect(await read(root, 'assets/css/button.css')).toBe('/* my changes */\n');
  });

  it('overwrites a changed file with --overwrite', async () => {
    const root = await initProject();
    await writeFiles(root, { 'assets/css/button.css': '/* my changes */\n' });
    const result = await runCli(['add', 'button', '--yes', '--overwrite', '--cwd', root]);
    expect(result.code).toBe(EXIT.ok);
    expect(await read(root, 'assets/css/button.css')).toBe(
      await source('components/button/button.css'),
    );
  });

  it('asks skip/overwrite/diff interactively and shows a unified diff', async () => {
    const root = await initProject();
    await writeFiles(root, { 'assets/css/badge.css': '/* mine */\n' });
    const prompt = scriptedPrompter([true, 'diff', 'overwrite']);
    const result = await runCli(['add', 'badge', '--cwd', root], { interactive: true, prompt });
    expect(result.code, result.output).toBe(EXIT.ok);
    expect(prompt.asked).toEqual([
      expect.stringMatching(/Install 2 file\(s\)\?/),
      expect.stringMatching(/assets\/css\/badge.css already exists/),
      expect.stringMatching(/assets\/css\/badge.css already exists/),
    ]);
    expect(result.output).toMatch(/--- a\/assets\/css\/badge.css/);
    expect(result.output).toMatch(/-\/\* mine \*\//);
    expect(await read(root, 'assets/css/badge.css')).toBe(
      await source('components/badge/badge.css'),
    );
  });

  it('writes nothing when the user declines', async () => {
    const root = await initProject();
    const prompt = scriptedPrompter([false]);
    const result = await runCli(['add', 'card', '--cwd', root], { interactive: true, prompt });
    expect(result.code).toBe(EXIT.ok);
    expect(await exists(resolve(root, 'assets/css/card.css'))).toBe(false);
  });

  it('writes nothing with --dry-run', async () => {
    const root = await initProject();
    const result = await runCli(['add', 'dialog', '--dry-run', '--cwd', root]);
    expect(result.code).toBe(EXIT.ok);
    expect(result.output).toMatch(/create\s+assets\/js\/dialog.js/);
    expect(result.output).toMatch(/Dry run: nothing was written/);
    expect(await readdir(resolve(root, 'assets/js'))).toEqual(['lib']);
    expect(await readdir(resolve(root, 'components/ui'))).toEqual([]);
  });

  it('fails without bootcn.json', async () => {
    const root = await tempDir();
    const result = await runCli(['add', 'button', '--cwd', root, '--registry', registry]);
    expect(result.code).toBe(EXIT.user);
    expect(result.output).toMatch(/No bootcn.json found/);
    expect(result.output).toMatch(/Run "init" first/);
  });

  it('rejects unknown and malformed item names', async () => {
    const root = await initProject();
    const unknown = await runCli(['add', 'ghost', '--yes', '--cwd', root]);
    expect(unknown.code).toBe(EXIT.user);
    expect(unknown.output).toMatch(/"ghost" was not found/);
    const traversal = await runCli(['add', '../../etc/passwd', '--yes', '--cwd', root]);
    expect(traversal.code).toBe(EXIT.user);
    expect(traversal.output).toMatch(/not a valid item name/);
  });

  it('refuses a config whose paths escape the project', async () => {
    const root = await initProject();
    const config = JSON.parse(await read(root, 'bootcn.json')) as { paths: Record<string, string> };
    config.paths.css = '../outside';
    await writeFiles(root, { 'bootcn.json': JSON.stringify(config) });
    const result = await runCli(['add', 'badge', '--yes', '--cwd', root]);
    expect(result.code).toBe(EXIT.user);
    expect(result.output).toMatch(/bootcn.json is invalid/);
  });

  it('refuses to write through a symlink that leaves the project', async () => {
    const root = await initProject();
    const outside = await tempDir('bootcn-outside-');
    await symlink(outside, resolve(root, 'assets/js/evil'));
    const config = JSON.parse(await read(root, 'bootcn.json')) as { paths: Record<string, string> };
    config.paths.js = 'assets/js/evil';
    await writeFiles(root, { 'bootcn.json': JSON.stringify(config) });
    const result = await runCli(['add', 'dialog', '--yes', '--cwd', root]);
    expect(result.code).toBe(EXIT.user);
    expect(result.output).toMatch(/symlink pointing outside/);
    expect(await readdir(outside)).toEqual([]);
  });

  it.skipIf(process.getuid?.() === 0)('reports a partial install with exit code 3', async () => {
    const root = await initProject();
    await chmod(resolve(root, 'assets/js'), 0o500);
    try {
      const result = await runCli(['add', 'dialog', '--yes', '--cwd', root]);
      expect(result.code).toBe(EXIT.partial);
      expect(result.output).toMatch(/failed assets\/js\/dialog.js/);
      expect(result.output).toMatch(/wrote assets\/css\/dialog.css/);
    } finally {
      await chmod(resolve(root, 'assets/js'), 0o700);
    }
  });
});

describe('list and info', () => {
  it('lists items grouped by type and marks installed ones', async () => {
    const root = await initProject();
    await runCli(['add', 'badge', '--yes', '--cwd', root]);
    const result = await runCli(['list', '--cwd', root]);
    expect(result.code).toBe(EXIT.ok);
    expect(result.output).toMatch(/Themes:\n\s+✔ tokens/);
    expect(result.output).toMatch(/Components:/);
    expect(result.output).toMatch(/✔ badge/);
    expect(result.output).toMatch(/\n\s{4}button/);
  });

  it('works without a config when --registry is given', async () => {
    const root = await tempDir();
    const result = await runCli(['list', '--cwd', root, '--registry', registry]);
    expect(result.code).toBe(EXIT.ok);
    expect(result.output).toMatch(/dialog/);
  });

  it('shows item details', async () => {
    const root = await initProject();
    const result = await runCli(['info', 'dialog', '--cwd', root]);
    expect(result.code).toBe(EXIT.ok);
    expect(result.output).toMatch(/Depends on:\s+button/);
    expect(result.output).toMatch(/registry:script\s+assets\/js\/dialog.js/);
  });
});

describe('global flags', () => {
  it('prints the version and help', async () => {
    expect((await runCli(['--version'])).output).toMatch(/^\d+\.\d+\.\d+/);
    const help = await runCli(['--help']);
    expect(help.code).toBe(EXIT.ok);
    expect(help.output).toMatch(/--dry-run/);
  });

  it('rejects unknown commands with exit code 1', async () => {
    expect((await runCli(['explode'])).code).toBe(EXIT.user);
  });
});
