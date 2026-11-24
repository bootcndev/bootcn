import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const registryRoot = resolve(here, '..');
const KINDS = ['components', 'blocks', 'templates'];
const schemaPath = resolve(registryRoot, 'schema/registry-item.schema.json');

interface ManifestFile {
  path: string;
}

interface Manifest {
  name: string;
  files: ManifestFile[];
}

async function itemDirs(): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  for (const kind of KINDS) {
    const kindDir = resolve(registryRoot, kind);
    const entries = await readdir(kindDir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.isDirectory()) found.set(entry.name, resolve(kindDir, entry.name));
    }
  }
  return found;
}

async function fileExists(filePath: string): Promise<boolean> {
  const info = await stat(filePath).catch(() => null);
  return Boolean(info?.isFile());
}

describe('component, block and template manifests', () => {
  it('validate against the schema and reference existing files', async () => {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const validate = ajv.compile(schema);

    const dirs = await itemDirs();
    expect([...dirs.keys()]).toEqual(
      expect.arrayContaining(['badge', 'button', 'card', 'dialog', 'input', 'login-card']),
    );

    for (const [name, dir] of dirs) {
      const manifest = JSON.parse(
        await readFile(resolve(dir, 'manifest.json'), 'utf8'),
      ) as Manifest;

      const valid = validate(manifest);
      expect(valid, `${name}: ${JSON.stringify(validate.errors)}`).toBe(true);
      expect(manifest.name).toBe(name);

      for (const file of manifest.files) {
        expect(await fileExists(resolve(dir, file.path)), `${name}/${file.path}`).toBe(true);
      }
    }
  });
});
