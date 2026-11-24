import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

test.describe('card', () => {
  test('renders header, content and footer without accessibility violations', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'card');

    await expect(page.getByRole('heading', { name: 'Project settings' }).first()).toBeVisible();
    await expect(page.locator('.bootcn-card__content').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' }).first()).toBeVisible();

    await expectNoAxeViolations(page);
    expect(errors).toEqual([]);
  });
});
