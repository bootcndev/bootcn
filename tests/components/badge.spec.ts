import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

test.describe('badge', () => {
  test('renders all variants without accessibility violations', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'badge');

    // One of each variant; dark mode is the page theme, not a second copy.
    await expect(page.locator('.bootcn-badge')).toHaveCount(4);
    await expect(page.locator('.bootcn-badge--default').first()).toBeVisible();

    await expectNoAxeViolations(page);
    expect(errors).toEqual([]);
  });
});
