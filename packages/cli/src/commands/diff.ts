import { lstat, readFile } from 'node:fs/promises';

import { createTwoFilesPatch } from 'diff';

import { BRAND, EXIT, TOKENS_ITEM } from '../constants.js';
import { loadConfig } from '../config.js';
import type { Context } from '../context.js';
import { renderContent, targetPath } from '../installer.js';
import { resolveInsideRoot } from '../paths.js';
import { clientFor } from './add.js';
import { installState } from './list.js';

/**
 * Compares installed files with the registry. With no names, checks every
 * item that has at least one file installed. Never writes anything.
 */
export async function diffCommand(ctx: Context, names: readonly string[]): Promise<number> {
  const { out } = ctx;
  const config = await loadConfig(ctx.root);
  const client = clientFor(ctx, config);

  let selected = [...new Set(names)];
  if (selected.length === 0) {
    const index = await client.getIndex();
    for (const item of index.items) {
      if ((await installState(ctx.root, config, item)) !== 'missing') selected.push(item.name);
    }
    if (selected.length === 0) {
      out.info(`Nothing from the registry is installed yet. Run "${BRAND} add <item>".`);
      return EXIT.ok;
    }
    selected = selected.sort((a, b) =>
      a === TOKENS_ITEM ? -1 : b === TOKENS_ITEM ? 1 : a.localeCompare(b),
    );
  }

  let changed = 0;
  let missing = 0;
  let same = 0;
  for (const name of selected) {
    const item = await client.getItem(name);
    for (const file of item.files) {
      const relPath = targetPath(config, file);
      const absPath = await resolveInsideRoot(ctx.root, relPath);
      const info = await lstat(absPath).catch(() => null);
      if (!info) {
        missing += 1;
        out.info(`${item.name}: ${relPath} is not installed`);
        continue;
      }
      const installed = await readFile(absPath, 'utf8');
      const expected = renderContent(config, file);
      if (installed === expected) {
        same += 1;
        continue;
      }
      changed += 1;
      out.raw(
        createTwoFilesPatch(
          `installed/${relPath}`,
          `registry/${relPath}`,
          installed,
          expected,
          'your copy',
          `${item.name}@${item.version ?? 'unversioned'}`,
        ),
      );
    }
  }

  out.info('');
  out.info(
    `${changed} file(s) differ, ${same} unchanged, ${missing} not installed (registry ${client.location.display}).`,
  );
  if (changed > 0) {
    out.info(
      `Lines starting with "-" are in your copy, "+" in the registry. To take the registry version: ${BRAND} add <item> --overwrite (this replaces your changes).`,
    );
  }
  return EXIT.ok;
}
