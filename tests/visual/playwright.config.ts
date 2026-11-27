import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';

/**
 * Visual regression: a screenshot of every component and block preview in
 * light, dark and right to left, compared with the baselines in
 * __screenshots__. Baselines come from Linux in CI (fonts render
 * differently elsewhere): run the "Update visual baselines" workflow to
 * make new ones. Chromium only, motion off, time fixed.
 */
const configDir = dirname(fileURLToPath(import.meta.url));
const serverScript = resolve(configDir, '../static-server.mjs');
const BASE_URL = 'http://127.0.0.1:4517';

export default defineConfig({
  testDir: '.',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  expect: {
    toHaveScreenshot: {
      // Same OS and browser render identically, so stay strict: a ratio let
      // a swapped "2 kB" through. A few pixels of anti-aliasing may differ.
      maxDiffPixels: 25,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  use: {
    baseURL: BASE_URL,
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'Europe/Berlin',
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: `node "${serverScript}"`,
    url: `${BASE_URL}/__health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
