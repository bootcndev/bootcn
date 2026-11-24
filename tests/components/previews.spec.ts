/**
 * Checks every component and block preview, discovered from the registry, so
 * a new item is covered as soon as its directory exists:
 * - no console errors;
 * - zero axe violations in light mode and with the whole page in dark mode;
 * - no horizontal overflow at 320, 768 and 1280px;
 * - right to left (?dir=rtl, Bootstrap's RTL CSS): no errors, no axe
 *   violations, no horizontal overflow.
 */
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { type PreviewKind, collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

const here = dirname(fileURLToPath(import.meta.url));
const kinds: PreviewKind[] = ['components', 'blocks'];
const previews = kinds.flatMap((kind) =>
  readdirSync(resolve(here, '../../packages/registry', kind), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ kind, name: entry.name }))
    .sort((a, b) => a.name.localeCompare(b.name)),
);
const widths = [320, 768, 1280];

for (const { kind, name } of previews) {
  test.describe(`${name} preview`, () => {
    test('has no console errors and no axe violations in light and dark mode', async ({ page }) => {
      const errors = collectErrors(page);
      // Reduced motion sets --bootcn-transition-duration to 0ms, so colors are
      // final when axe measures them right after the theme switch.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openPreview(page, name, kind);
      await expectNoAxeViolations(page);

      await page.evaluate(() => document.documentElement.setAttribute('data-bs-theme', 'dark'));
      await expectNoAxeViolations(page);
      expect(errors).toEqual([]);
    });

    test('works right to left', async ({ page }) => {
      const errors = collectErrors(page);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const width of [320, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await openPreview(page, name, kind, '?dir=rtl');
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
        await expect(page.locator('link[href*="bootstrap.rtl.min.css"]')).toHaveCount(1);
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(overflow.scrollWidth, `at ${width}px`).toBeLessThanOrEqual(overflow.innerWidth + 1);
      }
      await expectNoAxeViolations(page);
      expect(errors).toEqual([]);
    });

    for (const width of widths) {
      test(`has no horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await openPreview(page, name, kind);
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
      });
    }
  });
}
