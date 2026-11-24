import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';

const configDir = dirname(fileURLToPath(import.meta.url));
const serverScript = resolve(configDir, '../static-server.mjs');
const BASE_URL = 'http://127.0.0.1:4517';

// CI runs every engine; locally only Chromium unless PW_ALL_BROWSERS=1, so a
// fresh clone does not need the Firefox and WebKit downloads.
const allBrowsers = Boolean(process.env.CI || process.env.PW_ALL_BROWSERS);
const browsers = [
  { name: 'chromium', device: devices['Desktop Chrome'] },
  ...(allBrowsers
    ? [
        { name: 'firefox', device: devices['Desktop Firefox'] },
        { name: 'webkit', device: devices['Desktop Safari'] },
      ]
    : []),
];

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
  projects: browsers.map(({ name, device }) => ({ name, use: { ...device } })),
  webServer: {
    command: `node "${serverScript}"`,
    url: `${BASE_URL}/__health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
