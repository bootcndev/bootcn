import { REGISTRY_DIR, validateRegistry } from '../packages/registry/tooling/registry.js';

async function main(): Promise<void> {
  const { meta, items, errors } = await validateRegistry(REGISTRY_DIR);
  if (errors.length > 0) {
    process.stderr.write(`registry:validate found ${errors.length} problem(s):\n`);
    for (const error of errors) process.stderr.write(`  - ${error}\n`);
    process.exit(1);
  }
  process.stdout.write(
    `Registry "${meta?.name}" ${meta?.version} is valid (${items.length} item(s): ${items
      .map((item) => item.manifest.name)
      .join(', ')}).\n`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`registry:validate failed: ${message}\n`);
  process.exit(1);
});
