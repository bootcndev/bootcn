import { TOKENS_ITEM } from './constants.js';
import { registryError } from './errors.js';
import type { RegistryItem } from './registry.js';

export type ItemLoader = (name: string) => Promise<RegistryItem>;

/**
 * Resolves the requested items and their registryDependencies recursively.
 * Returns each item once, dependencies before dependents, with `tokens`
 * always first. Throws on dependency cycles.
 */
export async function resolveItems(
  names: readonly string[],
  load: ItemLoader,
  options: { includeTokens?: boolean } = {},
): Promise<RegistryItem[]> {
  const ordered: RegistryItem[] = [];
  const done = new Set<string>();
  const visiting: string[] = [];

  const visit = async (name: string): Promise<void> => {
    if (done.has(name)) return;
    const cycleStart = visiting.indexOf(name);
    if (cycleStart !== -1) {
      throw registryError(
        `Dependency cycle in the registry: ${[...visiting.slice(cycleStart), name].join(' -> ')}.`,
      );
    }
    visiting.push(name);
    const item = await load(name);
    for (const dependency of item.registryDependencies ?? []) {
      await visit(dependency);
    }
    visiting.pop();
    done.add(name);
    ordered.push(item);
  };

  if (options.includeTokens ?? true) await visit(TOKENS_ITEM);
  for (const name of names) await visit(name);
  return ordered;
}
