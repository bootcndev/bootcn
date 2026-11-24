import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const registryDir = resolve(repoRoot, 'packages/registry');
const registryPath = resolve(registryDir, 'registry.json');
const distDir = resolve(registryDir, 'dist');

interface RegistrySeed {
  name?: string;
  version?: string;
  items?: unknown[];
}

async function main(): Promise<void> {
  const raw = await readFile(registryPath, 'utf8');
  const data = JSON.parse(raw) as RegistrySeed;

  const index = {
    name: data.name ?? 'bootcn',
    version: data.version ?? '0.0.0',
    items: [] as unknown[],
  };

  await mkdir(distDir, { recursive: true });
  const outputPath = resolve(distDir, 'index.json');
  await writeFile(outputPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');

  process.stdout.write(`Wrote ${outputPath} (${index.items.length} item(s)).\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`registry:build failed: ${message}\n`);
  process.exit(1);
});
