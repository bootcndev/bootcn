import { type Config, loadConfig } from '../config.js';
import { EXIT } from '../constants.js';
import type { Context } from '../context.js';
import { CliError } from '../errors.js';
import { targetPath } from '../installer.js';
import { clientFor } from './add.js';

export async function infoCommand(ctx: Context, name: string): Promise<number> {
  let config: Config | null = null;
  try {
    config = await loadConfig(ctx.root);
  } catch (error) {
    if (!(error instanceof CliError) || !ctx.registry) throw error;
  }
  const client = clientFor(ctx, config);
  const item = await client.getItem(name);
  const { out } = ctx;

  out.info(`${item.title} (${item.name}) ${item.version ?? ''}`.trim());
  out.info(item.description);
  out.info('');
  out.info(`Type:          ${item.type}`);
  if (item.categories?.length) out.info(`Categories:    ${item.categories.join(', ')}`);
  out.info(`Requires:      ${(item.compatibility?.platform ?? ['nothing']).join(', ')}`);
  out.info(`Depends on:    ${(item.registryDependencies ?? []).join(', ') || 'none'}`);
  if (item.dependencies?.length) out.info(`External deps: ${item.dependencies.join(', ')}`);
  if (item.license) out.info(`License:       ${item.license}`);
  out.info('Files:');
  for (const file of item.files) {
    const target = config ? targetPath(config, file) : file.target;
    out.info(`  ${file.type.padEnd(19)} ${target}`);
  }
  return EXIT.ok;
}
