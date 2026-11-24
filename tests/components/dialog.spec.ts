import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

test.describe('dialog', () => {
  test('opens, closes with Escape and returns focus to the trigger', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'dialog');

    const trigger = page.locator('[data-bootcn-dialog-confirm]');
    const modal = page.locator('#bootcn-example-dialog');

    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(modal).toBeVisible();
    await page.waitForFunction(() => {
      const element = document.getElementById('bootcn-example-dialog');
      return Boolean(
        element && element.classList.contains('show') && element.contains(document.activeElement),
      );
    });
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    await expect(trigger).toBeFocused();

    await expectNoAxeViolations(page);
    expect(errors).toEqual([]);
  });

  test('confirm button dispatches bootcn:dialog:confirm on the trigger', async ({ page }) => {
    await openPreview(page, 'dialog');

    await page.evaluate(() => {
      const trigger = document.querySelector('[data-bootcn-dialog-confirm]');
      trigger?.addEventListener('bootcn:dialog:confirm', () => {
        (window as unknown as { __confirmed?: boolean }).__confirmed = true;
      });
    });

    const trigger = page.locator('[data-bootcn-dialog-confirm]');
    const modal = page.locator('#bootcn-example-dialog');

    await trigger.click();
    await expect(modal).toBeVisible();

    await page.locator('[data-bootcn-dialog-confirm-button]').click();
    await expect(modal).toBeHidden();
    await expect(trigger).toBeFocused();

    const confirmed = await page.evaluate(
      () => (window as unknown as { __confirmed?: boolean }).__confirmed === true,
    );
    expect(confirmed).toBe(true);
  });
});
