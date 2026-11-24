import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = resolve(repoRoot, 'packages/registry/registry.json');

interface RegistrySeed {
  name?: string;
  version?: string;
  items?: unknown[];
}

async function main(): Promise<void> {
  const raw = await readFile(registryPath, 'utf8');
  const data = JSON.parse(raw) as RegistrySeed;
  const items = Array.isArray(data.items) ? data.items : [];

  if (typeof data.name !== 'string' || data.name.length === 0) {
    throw new Error('Registry is missing a non-empty "name" field.');
  }

  process.stdout.write(`Registry "${data.name}" is valid (${items.length} item(s)).\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`registry:validate failed: ${message}\n`);
  process.exit(1);
});
