import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

test.describe('button', () => {
  test('renders variants, sizes, icon and loading state without violations', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'button');

    await expect(page.locator('.bootcn-button--default').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add item' })).toBeVisible();

    const busy = page.locator('.bootcn-button[aria-busy="true"]');
    await expect(busy).toBeDisabled();
    await expect(busy.locator('.bootcn-button__spinner')).toBeVisible();

    await expectNoAxeViolations(page);
    expect(errors).toEqual([]);
  });
});
