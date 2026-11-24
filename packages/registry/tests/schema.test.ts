import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ErrorObject, ValidateFunction } from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { beforeAll, describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const schemaDir = resolve(here, '../schema');
const fixturesDir = resolve(here, 'fixtures');

async function loadJson(filePath: string): Promise<unknown> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as unknown;
}

function createAjv(): Ajv2020 {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv;
}

async function compileSchema(name: string): Promise<ValidateFunction> {
  const schema = await loadJson(resolve(schemaDir, name));
  return createAjv().compile(schema as object);
}

function errorMessages(errors: ErrorObject[] | null | undefined): string {
  return (errors ?? [])
    .map((error) => `${error.instancePath || '/'} ${error.message ?? ''}`.trim())
    .join('; ');
}

describe('registry item schema', () => {
  let validate: ValidateFunction;

  beforeAll(async () => {
    validate = await compileSchema('registry-item.schema.json');
  });

  it('accepts a valid sample manifest', async () => {
    const sample = await loadJson(resolve(fixturesDir, 'button.valid.json'));
    const valid = validate(sample);
    expect(validate.errors, errorMessages(validate.errors)).toBeNull();
    expect(valid).toBe(true);
  });

  it('rejects a manifest that is missing "name"', async () => {
    const sample = await loadJson(resolve(fixturesDir, 'missing-name.invalid.json'));
    expect(validate(sample)).toBe(false);
    expect(errorMessages(validate.errors)).toMatch(/name/);
  });

  it('rejects a file path containing "../"', async () => {
    const sample = await loadJson(resolve(fixturesDir, 'path-traversal.invalid.json'));
    expect(validate(sample)).toBe(false);
    expect(errorMessages(validate.errors)).toMatch(/pattern|path/i);
  });

  it('rejects an unknown item type', async () => {
    const sample = await loadJson(resolve(fixturesDir, 'unknown-type.invalid.json'));
    expect(validate(sample)).toBe(false);
    expect(errorMessages(validate.errors)).toMatch(/enum|type/i);
  });
});

describe('config schema', () => {
  it('accepts a valid bootcn.json', async () => {
    const validate = await compileSchema('config.schema.json');
    const sample = await loadJson(resolve(fixturesDir, 'config.valid.json'));
    expect(validate(sample), errorMessages(validate.errors)).toBe(true);
  });

  it('rejects a "../" directory path', async () => {
    const validate = await compileSchema('config.schema.json');
    const sample = {
      registry: './registry',
      style: 'default',
      bootstrap: '5.3',
      paths: {
        components: '../components',
        css: 'assets/css',
        js: 'assets/js',
        lib: 'assets/js/lib',
      },
    };
    expect(validate(sample)).toBe(false);
    expect(errorMessages(validate.errors)).toMatch(/pattern/i);
  });
});

describe('registry index schema', () => {
  it('accepts a valid built index', async () => {
    const validate = await compileSchema('registry-index.schema.json');
    const sample = await loadJson(resolve(fixturesDir, 'index.valid.json'));
    expect(validate(sample), errorMessages(validate.errors)).toBe(true);
  });
});
