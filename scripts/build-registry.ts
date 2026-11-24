import { relative, resolve } from 'node:path';

import { REGISTRY_DIR, buildRegistry } from '../packages/registry/tooling/registry.js';

async function main(): Promise<void> {
  const outDir = resolve(REGISTRY_DIR, 'dist');
  const { itemCount } = await buildRegistry(REGISTRY_DIR, outDir);
  process.stdout.write(
    `Built ${itemCount} item(s) into ${relative(process.cwd(), outDir) || '.'}.\n`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`registry:build failed: ${message}\n`);
  process.exit(1);
});
