/**
 * Installs Bootcn into the React and Vue example apps with the real CLI (from
 * the built registry), type-checks the React app, and builds both with Vite.
 */
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cli = resolve(root, 'packages/cli/dist/index.js');
const registry = resolve(root, 'packages/registry/dist');

function run(command: string, args: string[], cwd = root): void {
  execFileSync(command, args, { cwd, stdio: 'pipe' });
}

export default function setup(): void {
  for (const framework of ['react', 'vue']) {
    const app = resolve(root, 'examples', framework);
    for (const generated of ['bootcn.json', 'src/components/ui', 'src/bootcn', 'dist']) {
      rmSync(resolve(app, generated), { recursive: true, force: true });
    }
    run('node', [cli, 'init', '--yes', '--cwd', app, '--registry', registry]);
    run('node', [
      cli,
      'add',
      'button',
      'dialog',
      'toaster',
      '--yes',
      '--cwd',
      app,
      '--registry',
      registry,
    ]);
    if (framework === 'react') run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.json'], app);
    run('pnpm', ['exec', 'vite', 'build'], app);
  }
}
