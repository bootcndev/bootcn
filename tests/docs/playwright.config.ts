import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';

const configDir = dirname(fileURLToPath(import.meta.url));
const serverScript = resolve(configDir, '../static-server.mjs');
const siteDir = resolve(configDir, '../../_site');
const PORT = 4518;

// Serves _site (pnpm site:build) under /bootcn/, as GitHub Pages does.
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
  testDir: '.',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}/bootcn/`,
    trace: 'on-first-retry',
  },
  projects: browsers.map(({ name, device }) => ({ name, use: { ...device } })),
  webServer: {
    command: `node "${serverScript}"`,
    env: { ROOT: siteDir, PREFIX: '/bootcn', PORT: String(PORT) },
    url: `http://127.0.0.1:${PORT}/__health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
