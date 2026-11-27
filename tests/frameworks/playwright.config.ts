import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';

/**
 * React and Vue: the CLI installs Bootcn into examples/react and
 * examples/vue (setup.ts), Vite builds them, and these tests use the built
 * apps. Needs a built CLI and registry (pnpm build).
 */
const configDir = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://127.0.0.1:4517';

export default defineConfig({
  testDir: '.',
  globalSetup: resolve(configDir, 'setup.ts'),
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { baseURL: BASE_URL, ...devices['Desktop Chrome'] },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: `node "${resolve(configDir, '../static-server.mjs')}"`,
    url: `${BASE_URL}/__health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
