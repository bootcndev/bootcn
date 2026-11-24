import { afterEach, describe, expect, it } from 'vitest';

import { createConfig, loadConfig, parseConfig } from '../src/config.js';
import { cleanupTempDirs, tempDir, writeFiles } from './helpers.js';

afterEach(cleanupTempDirs);

const PATHS = {
  components: 'components/ui',
  css: 'assets/css',
  js: 'assets/js',
  lib: 'assets/js/lib',
};

describe('config', () => {
  it('loads a valid bootcn.json', async () => {
    const root = await tempDir();
    await writeFiles(root, {
      'bootcn.json': JSON.stringify(createConfig('./registry', '5.3', PATHS)),
    });
    const config = await loadConfig(root);
    expect(config.paths.css).toBe('assets/css');
    expect(config.registry).toBe('./registry');
  });

  it('explains how to fix a missing config', async () => {
    const root = await tempDir();
    await expect(loadConfig(root)).rejects.toMatchObject({
      message: expect.stringMatching(/No bootcn.json found/),
      hint: expect.stringMatching(/init/),
      exitCode: 1,
    });
  });

  it('rejects invalid JSON', async () => {
    const root = await tempDir();
    await writeFiles(root, { 'bootcn.json': '{ nope' });
    await expect(loadConfig(root)).rejects.toThrow(/not valid JSON/);
  });

  it('rejects unknown fields and missing paths', () => {
    expect(() => parseConfig({ ...createConfig('x', '5.3', PATHS), extra: true })).toThrow(
      /"extra"/,
    );
    expect(() =>
      parseConfig({ registry: 'x', style: 'default', bootstrap: '5.3', paths: { css: 'a' } }),
    ).toThrow(/components/);
  });

  it('rejects unsafe directory paths', () => {
    expect(() => parseConfig(createConfig('x', '5.3', { ...PATHS, css: '../outside' }))).toThrow(
      /bootcn.json is invalid/,
    );
    expect(() => parseConfig(createConfig('x', '5.3', { ...PATHS, js: '/abs/js' }))).toThrow();
  });

  it('rejects unsupported Bootstrap versions', () => {
    expect(() => parseConfig(createConfig('x', '4.6', PATHS))).toThrow(/bootstrap/);
  });
});
