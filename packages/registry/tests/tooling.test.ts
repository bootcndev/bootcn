import { readdirSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { afterEach, describe, expect, it } from 'vitest';

import {
  REGISTRY_DIR,
  SCHEMA_DIR,
  buildRegistry,
  findCycles,
  unsafePathReason,
  validateRegistry,
} from '../tooling/registry.js';

type Json = Record<string, unknown>;

/** Every item in the real registry: one directory per item in each kind directory. */
const REAL_ITEMS = ['components', 'blocks', 'templates', 'themes', 'lib']
  .flatMap((kind) => {
    try {
      return readdirSync(resolve(REGISTRY_DIR, kind), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch {
      return [];
    }
  })
  .sort();

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function manifest(name: string, overrides: Json = {}): Json {
  return {
    name,
    type: 'registry:ui',
    title: name,
    description: `The ${name} component.`,
    version: '1.0.0',
    registryDependencies: [],
    files: [{ path: `${name}.css`, target: `${name}.css`, type: 'registry:style' }],
    ...overrides,
  };
}

/** Creates a temporary registry. `files` maps relative paths to contents. */
async function makeRegistry(files: Record<string, string | Json>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'bootcn-registry-'));
  tempDirs.push(root);
  const all: Record<string, string | Json> = {
    'registry.json': { name: 'test', version: '0.1.0' },
    ...files,
  };
  for (const [path, content] of Object.entries(all)) {
    const full = resolve(root, path);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(
      full,
      typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`,
    );
  }
  return root;
}

function component(name: string, overrides: Json = {}): Record<string, string | Json> {
  return {
    [`components/${name}/manifest.json`]: manifest(name, overrides),
    [`components/${name}/${name}.css`]: `.bootcn-${name} {}\n`,
  };
}

async function errorsFor(files: Record<string, string | Json>): Promise<string[]> {
  return (await validateRegistry(await makeRegistry(files))).errors;
}

describe('unsafePathReason', () => {
  it.each([
    ['', 'is empty'],
    ['/etc/passwd', 'is absolute'],
    ['C:/x.css', 'drive letter'],
    ['a\\b.css', 'backslash'],
    ['a/../b.css', '".."'],
    ['../b.css', '".."'],
    ['./b.css', '"."'],
    ['a//b.css', 'empty segment'],
    ['a\0b', 'null byte'],
  ])('rejects %j', (path, reason) => {
    expect(unsafePathReason(path)).toContain(reason);
  });

  it('accepts normal relative paths', () => {
    expect(unsafePathReason('button.css')).toBeNull();
    expect(unsafePathReason('sub/dir/file.js')).toBeNull();
  });
});

describe('findCycles', () => {
  it('reports a cycle path', () => {
    const graph = new Map([
      ['a', ['b']],
      ['b', ['c']],
      ['c', ['a']],
    ]);
    expect(findCycles(graph)).toEqual([['a', 'b', 'c', 'a']]);
  });
});

describe('validateRegistry', () => {
  it('passes on the real registry', async () => {
    const result = await validateRegistry(REGISTRY_DIR);
    expect(result.errors).toEqual([]);
    expect(result.items.map((item) => item.manifest.name)).toEqual(REAL_ITEMS);
  });

  it('says when each real item was added', async () => {
    const result = await validateRegistry(REGISTRY_DIR);
    const missing = result.items.filter((item) => !item.manifest.added);
    expect(missing.map((item) => item.relDir)).toEqual([]);
  });

  it('fails when "added" is later than the registry', async () => {
    const errors = await errorsFor(component('alpha', { added: '99.0.0' }));
    expect(errors.join('\n')).toMatch(/"added" is 99\.0\.0, later than the registry version/);
  });

  it('passes on a minimal valid registry', async () => {
    expect(await errorsFor(component('alpha'))).toEqual([]);
  });

  it('fails when "name" is missing', async () => {
    const files = component('alpha');
    const broken = { ...(files['components/alpha/manifest.json'] as Json) };
    delete broken.name;
    files['components/alpha/manifest.json'] = broken;
    expect((await errorsFor(files)).join('\n')).toMatch(/must have required property 'name'/);
  });

  it('fails on an unknown item type', async () => {
    const errors = await errorsFor(component('alpha', { type: 'registry:widget' }));
    expect(errors.join('\n')).toMatch(/\/type must be equal to one of the allowed values/);
  });

  it('fails when the type does not match the directory', async () => {
    const errors = await errorsFor(component('alpha', { type: 'registry:block' }));
    expect(errors.join('\n')).toMatch(/must have type "registry:ui"/);
  });

  it('fails on path traversal in source and target paths', async () => {
    const errors = await errorsFor(
      component('alpha', {
        files: [{ path: '../alpha.css', target: '../../evil.css', type: 'registry:style' }],
      }),
    );
    expect(errors.join('\n')).toMatch(/files\/0\/path must match pattern/);
    expect(errors.join('\n')).toMatch(/files\/0\/target must match pattern/);
  });

  it('fails on an invalid version', async () => {
    const errors = await errorsFor(component('alpha', { version: 'v1' }));
    expect(errors.join('\n')).toMatch(/\/version must match pattern/);
  });

  it('fails when the version is missing', async () => {
    const files = component('alpha');
    const broken = { ...(files['components/alpha/manifest.json'] as Json) };
    delete broken.version;
    files['components/alpha/manifest.json'] = broken;
    expect((await errorsFor(files)).join('\n')).toMatch(/"version" is required/);
  });

  it('fails when a listed file does not exist', async () => {
    const errors = await errorsFor(
      component('alpha', {
        files: [{ path: 'missing.css', target: 'missing.css', type: 'registry:style' }],
      }),
    );
    expect(errors.join('\n')).toMatch(/file "missing.css" does not exist/);
  });

  it('fails when the name does not match the directory', async () => {
    const files = {
      'components/alpha/manifest.json': manifest('beta', {
        files: [{ path: 'alpha.css', target: 'alpha.css', type: 'registry:style' }],
      }),
      'components/alpha/alpha.css': '',
    };
    expect((await errorsFor(files)).join('\n')).toMatch(/"name" is "beta" but the directory/);
  });

  it('fails on duplicate names across kinds', async () => {
    const files = {
      ...component('alpha'),
      'blocks/alpha/manifest.json': manifest('alpha', {
        type: 'registry:block',
        files: [{ path: 'block.css', target: 'alpha-block.css', type: 'registry:style' }],
      }),
      'blocks/alpha/block.css': '',
    };
    expect((await errorsFor(files)).join('\n')).toMatch(/Duplicate item name "alpha"/);
  });

  it('fails when two items install the same target', async () => {
    const files = {
      ...component('alpha'),
      'components/beta/manifest.json': manifest('beta', {
        files: [{ path: 'beta.css', target: 'alpha.css', type: 'registry:style' }],
      }),
      'components/beta/beta.css': '',
    };
    expect((await errorsFor(files)).join('\n')).toMatch(/both install registry:style "alpha.css"/);
  });

  it('fails on a missing registry dependency', async () => {
    const errors = await errorsFor(component('alpha', { registryDependencies: ['ghost'] }));
    expect(errors.join('\n')).toMatch(/registry dependency "ghost" does not exist/);
  });

  it('fails on a dependency cycle', async () => {
    const errors = await errorsFor({
      ...component('alpha', { registryDependencies: ['beta'] }),
      ...component('beta', { registryDependencies: ['alpha'] }),
    });
    expect(errors.join('\n')).toMatch(/Dependency cycle: alpha -> beta -> alpha/);
  });

  it('fails on a self dependency', async () => {
    const errors = await errorsFor(component('alpha', { registryDependencies: ['alpha'] }));
    expect(errors.join('\n')).toMatch(/depends on itself/);
  });

  it('fails on files with a disallowed extension', async () => {
    const errors = await errorsFor({
      ...component('alpha'),
      'components/alpha/install.sh': 'rm -rf /\n',
      'components/alpha/logo.png': 'binary',
    });
    expect(errors.join('\n')).toMatch(/install.sh: extension ".sh" is not allowed/);
    expect(errors.join('\n')).toMatch(/logo.png: extension ".png" is not allowed/);
  });

  it('fails when the file type does not match the extension', async () => {
    const errors = await errorsFor(
      component('alpha', {
        files: [{ path: 'alpha.css', target: 'alpha.css', type: 'registry:script' }],
      }),
    );
    expect(errors.join('\n')).toMatch(/has type registry:script, which expects .js/);
  });

  it('accepts page placeholders in a registry:page file', async () => {
    const errors = await errorsFor({
      'templates/shell/manifest.json': manifest('shell', {
        type: 'registry:template',
        files: [{ path: 'shell.html', target: 'shell.html', type: 'registry:page' }],
      }),
      'templates/shell/shell.html':
        '<link rel="stylesheet" href="{{bootcn:css}}/tokens.css"><script src="{{bootcn:js}}/a.js"></script>\n',
    });
    expect(errors).toEqual([]);
  });

  it('fails on an unknown page placeholder', async () => {
    const errors = await errorsFor({
      'templates/shell/manifest.json': manifest('shell', {
        type: 'registry:template',
        files: [{ path: 'shell.html', target: 'shell.html', type: 'registry:page' }],
      }),
      'templates/shell/shell.html': '<img src="{{bootcn:images}}/a.png" alt="">\n',
    });
    expect(errors.join('\n')).toMatch(/unknown placeholder \{\{bootcn:images\}\}/);
  });

  it('fails on placeholders outside registry:page files', async () => {
    const files = component('alpha');
    files['components/alpha/alpha.css'] = '.a { background: url({{bootcn:css}}/x.png); }\n';
    expect((await errorsFor(files)).join('\n')).toMatch(
      /placeholders are only replaced in registry:page files/,
    );
  });

  it('fails when the target changes the extension', async () => {
    const errors = await errorsFor(
      component('alpha', {
        files: [{ path: 'alpha.css', target: 'alpha.php', type: 'registry:style' }],
      }),
    );
    expect(errors.join('\n')).toMatch(/must keep the source extension ".css"/);
  });

  it('fails on symlinks inside an item', async () => {
    const root = await makeRegistry(component('alpha'));
    await symlink('/etc/hosts', resolve(root, 'components/alpha/link.css'));
    const { errors } = await validateRegistry(root);
    expect(errors.join('\n')).toMatch(/link.css: symlinks are not allowed/);
  });

  it('fails when a manifest is missing', async () => {
    const errors = await errorsFor({ 'components/alpha/alpha.css': '' });
    expect(errors.join('\n')).toMatch(/components\/alpha: missing manifest.json/);
  });

  it('fails when registry.json has no valid version', async () => {
    const errors = await errorsFor({ 'registry.json': { name: 'test' }, ...component('alpha') });
    expect(errors.join('\n')).toMatch(/registry.json: "version" must be a semantic version/);
  });
});

describe('buildRegistry', () => {
  async function compile(schemaName: string) {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const schema = JSON.parse(await readFile(resolve(SCHEMA_DIR, schemaName), 'utf8')) as object;
    return ajv.compile(schema);
  }

  it('builds a valid, deterministic registry with inlined content', async () => {
    const outA = await mkdtemp(join(tmpdir(), 'bootcn-dist-a-'));
    const outB = await mkdtemp(join(tmpdir(), 'bootcn-dist-b-'));
    tempDirs.push(outA, outB);

    await buildRegistry(REGISTRY_DIR, outA);
    await buildRegistry(REGISTRY_DIR, outB);

    // Item files only: r/react/ and r/vue/ hold the framework overlays.
    const filesA = (await readdir(resolve(outA, 'r')))
      .filter((name) => name.endsWith('.json'))
      .sort();
    // Sort the file names themselves: "alert-dialog.json" sorts before "alert.json".
    expect(filesA).toEqual(REAL_ITEMS.map((name) => `${name}.json`).sort());
    for (const name of ['index.json', ...filesA.map((file) => `r/${file}`)]) {
      expect(await readFile(resolve(outA, name), 'utf8')).toBe(
        await readFile(resolve(outB, name), 'utf8'),
      );
    }

    const validateIndex = await compile('registry-index.schema.json');
    const index = JSON.parse(await readFile(resolve(outA, 'index.json'), 'utf8')) as {
      items: { name: string }[];
    };
    expect(validateIndex(index), JSON.stringify(validateIndex.errors)).toBe(true);
    expect(index.items.map((item) => item.name)).toEqual(REAL_ITEMS);

    const validateItem = await compile('registry-item.schema.json');
    const dialog = JSON.parse(await readFile(resolve(outA, 'r/dialog.json'), 'utf8')) as {
      files: { path: string; content: string }[];
    };
    expect(validateItem(dialog), JSON.stringify(validateItem.errors)).toBe(true);
    const js = dialog.files.find((file) => file.path === 'dialog.js');
    expect(js?.content).toBe(
      await readFile(resolve(REGISTRY_DIR, 'components/dialog/dialog.js'), 'utf8'),
    );

    // Published CLIs reject unknown keys, so "added" stays out of the output.
    expect(JSON.stringify(index)).not.toContain('"added"');
    expect(dialog).not.toHaveProperty('added');
  });

  it('refuses to build an invalid registry', async () => {
    const root = await makeRegistry(component('alpha', { registryDependencies: ['ghost'] }));
    const out = await mkdtemp(join(tmpdir(), 'bootcn-dist-'));
    tempDirs.push(out);
    await expect(buildRegistry(root, out)).rejects.toThrow(/"ghost" does not exist/);
  });
});
