/**
 * Screenshots of every component and block preview, discovered from the
 * registry: light, dark and right to left. Compared with the baselines in
 * tests/visual/__screenshots__, made on Linux by the "Update visual
 * baselines" workflow. Elsewhere (macOS, Windows) fonts render differently,
 * so the tests only run on Linux unless VISUAL_ANY_OS=1.
 */
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { type PreviewKind, openPreview } from '../components/helpers.js';

const here = dirname(fileURLToPath(import.meta.url));
const kinds: PreviewKind[] = ['components', 'blocks'];
const previews = kinds.flatMap((kind) =>
  readdirSync(resolve(here, '../../packages/registry', kind), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ kind, name: entry.name }))
    .sort((a, b) => a.name.localeCompare(b.name)),
);

const variants = [
  { id: 'light', query: '?theme=light' },
  { id: 'dark', query: '?theme=dark' },
  { id: 'rtl', query: '?theme=light&dir=rtl' },
] as const;

test.skip(
  process.platform !== 'linux' && !process.env.VISUAL_ANY_OS,
  'baselines are made on Linux; set VISUAL_ANY_OS=1 to run anyway',
);

for (const { kind, name } of previews) {
  for (const variant of variants) {
    test(`${kind}/${name} ${variant.id}`, async ({ page }) => {
      // The same moment every run: today, clocks and relative times stay put.
      await page.clock.setFixedTime(new Date('2026-12-10T10:15:00+01:00'));
      await openPreview(page, name, kind, variant.query);
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      const main = page.locator('main');
      await expect(main).toHaveScreenshot(`${kind}/${name}-${variant.id}.png`, {
        // Moving pictures and drawings vary between runs.
        mask: [page.locator('video, canvas, iframe')],
      });
    });
  }
}
