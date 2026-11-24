/**
 * End-to-end proof of Milestone 1: copy an example project into a temporary
 * directory, run the built CLI (`init` then `add button dialog`) against the
 * local registry, serve the result (static server or `php -S`) and drive the
 * dialog in a real browser.
 */
import { type ChildProcess, execFile, spawn, spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { AxeBuilder } from '@axe-core/playwright';
import { type Page, expect, test } from '@playwright/test';

const run = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');
const cliBin = resolve(repoRoot, 'packages/cli/dist/index.js');
const registryDist = resolve(repoRoot, 'packages/registry/dist');
const registrySource = resolve(repoRoot, 'packages/registry');
const bootstrapDist = resolve(repoRoot, 'node_modules/bootstrap/dist');

const phpAvailable = spawnSync('php', ['-v'], { stdio: 'ignore' }).status === 0;

const EXPECTED_FILES: Record<string, string> = {
  'assets/css/tokens.css': 'themes/tokens/tokens.css',
  'assets/css/button.css': 'components/button/button.css',
  'assets/css/dialog.css': 'components/dialog/dialog.css',
  'assets/js/dialog.js': 'components/dialog/dialog.js',
  'components/ui/button.html': 'components/button/button.html',
  'components/ui/dialog.html': 'components/dialog/dialog.html',
};

async function freePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolvePort(typeof address === 'object' && address ? address.port : 0));
    });
  });
}

async function waitForServer(url: string, child: ChildProcess): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server exited with code ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error(`Server at ${url} did not start in time`);
}

async function cli(args: string[]): Promise<string> {
  const { stdout, stderr } = await run(process.execPath, [cliBin, ...args], {
    cwd: repoRoot,
    env: { ...process.env, NO_COLOR: '1' },
  });
  return `${stdout}${stderr}`;
}

/** Serves Bootstrap from node_modules instead of the CDN, with CORS for SRI. */
async function routeBootstrap(page: Page): Promise<void> {
  const files: Record<string, [string, string]> = {
    '**/bootstrap@5.3.9/dist/css/bootstrap.min.css': ['css/bootstrap.min.css', 'text/css'],
    '**/bootstrap@5.3.9/dist/js/bootstrap.bundle.min.js': [
      'js/bootstrap.bundle.min.js',
      'text/javascript',
    ],
  };
  for (const [pattern, [file, contentType]] of Object.entries(files)) {
    await page.route(pattern, async (route) =>
      route.fulfill({
        body: await readFile(resolve(bootstrapDist, file)),
        contentType,
        headers: { 'access-control-allow-origin': '*' },
      }),
    );
  }
}

interface ExampleCase {
  name: 'plain-html' | 'native-php';
  entry: string;
  startServer(dir: string, port: number): ChildProcess;
}

const cases: ExampleCase[] = [
  {
    name: 'plain-html',
    entry: 'index.html',
    startServer: (dir, port) =>
      spawn(process.execPath, [resolve(repoRoot, 'tests/static-server.mjs')], {
        env: { ...process.env, ROOT: dir, PORT: String(port) },
        stdio: 'ignore',
      }),
  },
  {
    name: 'native-php',
    entry: 'index.php',
    startServer: (dir, port) =>
      spawn('php', ['-S', `127.0.0.1:${port}`, '-t', dir], { stdio: 'ignore' }),
  },
];

for (const example of cases) {
  test.describe(`install into examples/${example.name}`, () => {
    // One install and one server per example, shared by its tests.
    test.describe.configure({ mode: 'serial' });
    test.skip(
      example.name === 'native-php' && !phpAvailable,
      'PHP is not installed; skipping the native PHP end-to-end test.',
    );

    let dir: string;
    let server: ChildProcess | undefined;
    let baseUrl: string;

    test.beforeAll(async () => {
      for (const required of [cliBin, resolve(registryDist, 'index.json')]) {
        if (!(await stat(required).catch(() => null))) {
          throw new Error(`${required} is missing. Run "pnpm build" first.`);
        }
      }
      dir = await mkdtemp(join(tmpdir(), `bootcn-e2e-${example.name}-`));
      await cp(resolve(repoRoot, 'examples', example.name), dir, { recursive: true });

      const initOutput = await cli(['init', '--yes', '--cwd', dir, '--registry', registryDist]);
      expect(initOutput).toContain('wrote bootcn.json');
      const addOutput = await cli(['add', 'button', 'dialog', '--yes', '--cwd', dir]);
      expect(addOutput).toContain('wrote assets/js/dialog.js');

      const port = await freePort();
      baseUrl = `http://127.0.0.1:${port}`;
      server = example.startServer(dir, port);
      await waitForServer(`${baseUrl}/${example.entry}`, server);
    });

    test.afterAll(async () => {
      server?.kill();
      if (dir) await rm(dir, { recursive: true, force: true });
    });

    test('installs the expected files with registry contents', async () => {
      const config = JSON.parse(await readFile(resolve(dir, 'bootcn.json'), 'utf8')) as {
        paths: Record<string, string>;
      };
      expect(config.paths.css).toBe('assets/css');
      for (const [installed, origin] of Object.entries(EXPECTED_FILES)) {
        expect(await readFile(resolve(dir, installed), 'utf8'), installed).toBe(
          await readFile(resolve(registrySource, origin), 'utf8'),
        );
      }
    });

    test('dialog opens, closes with Escape and returns focus to the trigger', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await routeBootstrap(page);

      await page.goto(`${baseUrl}/${example.entry}`);
      await expect(page.locator('.bootcn-button').first()).toBeVisible();

      const trigger = page.locator('[data-bootcn-dialog-confirm]');
      const dialog = page.getByRole('dialog', { name: 'Delete this project?' });

      await trigger.click();
      await expect(dialog).toBeVisible();
      await page.waitForFunction(() => {
        const modal = document.querySelector('.bootcn-dialog.show');
        return Boolean(modal?.contains(document.activeElement));
      });

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();

      await trigger.click();
      await expect(dialog).toBeVisible();
      await page.locator('[data-bootcn-dialog-confirm-button]').click();
      await expect(dialog).toBeHidden();
      await expect(page.locator('#confirm-status')).toHaveText('Confirmed.');
      await expect(trigger).toBeFocused();

      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
      expect(errors).toEqual([]);
    });
  });
}
