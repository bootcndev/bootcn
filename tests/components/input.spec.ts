import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

test.describe('input', () => {
  test('renders label, help, invalid, disabled and icon states without violations', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'input');

    await expect(page.getByLabel('Name').first()).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
    await expect(page.locator('#bootcn-input-disabled')).toBeDisabled();
    await expect(page.getByLabel('Search')).toBeVisible();

    await expectNoAxeViolations(page);
    expect(errors).toEqual([]);
  });
});
