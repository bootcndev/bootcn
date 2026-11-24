import { lstat } from 'node:fs/promises';

import { type Config, loadConfig } from '../config.js';
import { EXIT } from '../constants.js';
import type { Context } from '../context.js';
import { CliError } from '../errors.js';
import { targetPath } from '../installer.js';
import { resolveInsideRoot } from '../paths.js';
import type { IndexItem } from '../registry.js';
import { clientFor } from './add.js';

const TYPE_TITLES: Record<string, string> = {
  'registry:theme': 'Themes',
  'registry:ui': 'Components',
  'registry:block': 'Blocks',
  'registry:template': 'Templates',
  'registry:lib': 'Libraries',
};

export type InstallState = 'installed' | 'partial' | 'missing';

export async function installState(
  root: string,
  config: Config,
  item: IndexItem,
): Promise<InstallState> {
  const files = item.files ?? [];
  if (files.length === 0) return 'missing';
  let present = 0;
  for (const file of files) {
    try {
      const abs = await resolveInsideRoot(root, targetPath(config, file));
      if (await lstat(abs).catch(() => null)) present += 1;
    } catch {
      // An unsafe or unknown path counts as not installed.
    }
  }
  if (present === files.length) return 'installed';
  return present === 0 ? 'missing' : 'partial';
}

async function loadOptionalConfig(ctx: Context): Promise<Config | null> {
  try {
    return await loadConfig(ctx.root);
  } catch (error) {
    if (error instanceof CliError && ctx.registry) return null;
    throw error;
  }
}

export async function listCommand(ctx: Context): Promise<number> {
  const config = await loadOptionalConfig(ctx);
  const client = clientFor(ctx, config);
  const index = await client.getIndex();

  ctx.out.info(`Registry: ${index.name} ${index.version} (${client.location.display})`);
  const types = [
    ...new Set([...Object.keys(TYPE_TITLES), ...index.items.map((item) => item.type)]),
  ];
  for (const type of types) {
    const items = index.items
      .filter((item) => item.type === type)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (items.length === 0) continue;
    ctx.out.info('');
    ctx.out.info(`${TYPE_TITLES[type] ?? type}:`);
    const width = Math.max(...items.map((item) => item.name.length));
    for (const item of items) {
      const state = config ? await installState(ctx.root, config, item) : 'missing';
      const mark = state === 'installed' ? '✔' : state === 'partial' ? '◐' : ' ';
      const suffix = state === 'partial' ? ' (partially installed)' : '';
      ctx.out.info(`  ${mark} ${item.name.padEnd(width)}  ${item.description}${suffix}`);
    }
  }
  if (config) {
    ctx.out.info('');
    ctx.out.info('✔ installed in this project');
  }
  return EXIT.ok;
}
