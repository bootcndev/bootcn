/**
 * Checks every component preview, discovered from the registry, so a new
 * component is covered as soon as its directory exists:
 * - no console errors;
 * - zero axe violations in light mode and with the whole page in dark mode;
 * - no horizontal overflow at 320, 768 and 1280px.
 */
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

const here = dirname(fileURLToPath(import.meta.url));
const componentsDir = resolve(here, '../../packages/registry/components');
const components = readdirSync(componentsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const widths = [320, 768, 1280];

for (const name of components) {
  test.describe(`${name} preview`, () => {
    test('has no console errors and no axe violations in light and dark mode', async ({ page }) => {
      const errors = collectErrors(page);
      // Reduced motion sets --bootcn-transition-duration to 0ms, so colors are
      // final when axe measures them right after the theme switch.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openPreview(page, name);
      await expectNoAxeViolations(page);

      await page.evaluate(() => document.documentElement.setAttribute('data-bs-theme', 'dark'));
      await expectNoAxeViolations(page);
      expect(errors).toEqual([]);
    });

    for (const width of widths) {
      test(`has no horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await openPreview(page, name);
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
      });
    }
  });
}
