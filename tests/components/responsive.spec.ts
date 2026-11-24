import { expect, test } from '@playwright/test';

import { openPreview } from './helpers.js';

const components = ['badge', 'button', 'card', 'input', 'dialog'];
const widths = [320, 768, 1280];

for (const name of components) {
  test.describe(`${name} responsiveness`, () => {
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
