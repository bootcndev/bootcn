import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@playwright/test';

const configDir = dirname(fileURLToPath(import.meta.url));
const serverScript = resolve(configDir, '../static-server.mjs');
const BASE_URL = 'http://127.0.0.1:4517';

export default defineConfig({
  testDir: '..',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `node "${serverScript}"`,
    url: `${BASE_URL}/__health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
