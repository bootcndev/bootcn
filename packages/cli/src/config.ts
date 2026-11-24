import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { CONFIG_FILE, CONFIG_SCHEMA_URL } from './constants.js';
import { userError } from './errors.js';
import { assertSafeRelativePath } from './paths.js';
import { formatSchemaErrors, validateConfigSchema } from './schemas.js';

export type PathKey = 'components' | 'css' | 'js' | 'lib';

export interface Config {
  $schema?: string;
  registry: string;
  style: string;
  bootstrap: string;
  paths: Record<PathKey, string>;
}

/** Maps a registry file type to the bootcn.json path key it installs into. */
export const FILE_TYPE_TO_PATH: Record<string, PathKey> = {
  'registry:component': 'components',
  'registry:style': 'css',
  'registry:script': 'js',
  'registry:lib': 'lib',
};

export function configPath(root: string): string {
  return resolve(root, CONFIG_FILE);
}

/** Validates an already-parsed config object. Throws a CliError when invalid. */
export function parseConfig(value: unknown): Config {
  if (!validateConfigSchema(value)) {
    throw userError(
      `${CONFIG_FILE} is invalid: ${formatSchemaErrors(validateConfigSchema.errors)}.`,
      `Fix ${CONFIG_FILE} or run "init" again to recreate it.`,
    );
  }
  const config = value as Config;
  for (const [key, path] of Object.entries(config.paths)) {
    assertSafeRelativePath(path, `${CONFIG_FILE} paths.${key}`);
  }
  return config;
}

export async function loadConfig(root: string): Promise<Config> {
  let raw: string;
  try {
    raw = await readFile(configPath(root), 'utf8');
  } catch {
    throw userError(`No ${CONFIG_FILE} found in ${root}.`, 'Run "init" first.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw userError(`${CONFIG_FILE} is not valid JSON: ${(error as Error).message}`);
  }
  return parseConfig(parsed);
}

export function createConfig(
  registry: string,
  bootstrap: string,
  paths: Record<PathKey, string>,
): Config {
  return {
    $schema: CONFIG_SCHEMA_URL,
    registry,
    style: 'default',
    bootstrap,
    paths: { components: paths.components, css: paths.css, js: paths.js, lib: paths.lib },
  };
}

export function serializeConfig(config: Config): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}
