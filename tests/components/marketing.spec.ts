import { expect, test } from '@playwright/test';

import { collectErrors, openPreview } from './helpers.js';

test.describe('pricing table', () => {
  test('the billing switch shows one set of prices, by mouse and keyboard', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'pricing-table', 'blocks');
    const pro = page.locator('.bootcn-pricing__plan--featured');
    const monthly = page.getByRole('radio', { name: 'Monthly' });
    const yearly = page.getByRole('radio', { name: 'Yearly (save 20%)' });

    await expect(monthly).toBeChecked();
    await expect(pro.getByText('€19')).toBeVisible();
    await expect(pro.getByText('€15')).toBeHidden();

    await page.getByText('Yearly (save 20%)').click();
    await expect(yearly).toBeChecked();
    await expect(pro.getByText('€15')).toBeVisible();
    await expect(pro.getByText('per month, billed yearly')).toBeVisible();
    await expect(pro.getByText('€19')).toBeHidden();

    // Native radios: arrow keys move the selection.
    await yearly.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(monthly).toBeChecked();
    await expect(pro.getByText('€19')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('calls to action are described by their plan', async ({ page }) => {
    await openPreview(page, 'pricing-table', 'blocks');
    await expect(page.getByRole('link', { name: 'Start free trial' })).toHaveAccessibleDescription(
      'Pro',
    );
    await expect(page.locator('.bootcn-pricing__plan--featured')).toContainText('Most popular');
  });
});

test('hero: one h1 and two calls to action', async ({ page }) => {
  await openPreview(page, 'hero-section', 'blocks');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Start for free' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Book a demo' })).toBeVisible();
});
