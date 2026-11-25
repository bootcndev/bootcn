/**
 * From the ideas board (2): toaster, button with icons and confetti.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

type ToastApi = ((message: string, options?: object) => string) & {
  success: (message: string, options?: object) => string;
  error: (message: string, options?: object) => string;
  update: (id: string, options: object) => string;
  dismiss: (id?: string) => void;
  promise: (value: Promise<unknown>, messages: object) => Promise<unknown>;
};
type W = { Bootcn: { toast: ToastApi } };

test('toaster: types, announcement, action, stacking and dismissal', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'toaster');
  await page.getByRole('button', { name: 'Success' }).click();
  const toaster = page.getByRole('region', { name: 'Notifications' });
  await expect(
    toaster.locator('.bootcn-toaster__toast', { hasText: 'Profile saved' }),
  ).toBeVisible();
  await expect(toaster.locator('[data-live="polite"]')).toHaveText('Profile saved');
  await expect(toaster.locator('[data-type="success"]')).toHaveCount(1);

  await page.getByRole('button', { name: 'Error' }).click();
  await expect(toaster.locator('[data-live="assertive"]')).toHaveText(
    'Could not reach the server. Check your connection and try again.',
  );
  await expectNoAxeViolations(page);

  // An action runs and dismisses its toast.
  await page.evaluate(() => {
    (window as unknown as W & { undone: boolean }).undone = false;
    (window as unknown as W).Bootcn.toast('Message archived', {
      action: {
        label: 'Undo',
        onClick: () => ((window as unknown as { undone: boolean }).undone = true),
      },
      duration: 60000,
    });
  });
  await toaster.getByRole('button', { name: 'Undo' }).click();
  expect(await page.evaluate(() => (window as unknown as { undone: boolean }).undone)).toBe(true);
  await expect(
    toaster.locator('.bootcn-toaster__toast', { hasText: 'Message archived' }),
  ).toHaveCount(0);

  // Close button and dismiss-all.
  await toaster.getByRole('button', { name: 'Close notification' }).first().click();
  await page.evaluate(() => (window as unknown as W).Bootcn.toast.dismiss());
  await expect(toaster.locator('.bootcn-toaster__toast')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('toaster: hover pauses the timer; text is never parsed as HTML', async ({ page }) => {
  await openPreview(page, 'toaster');
  await page.evaluate(() => {
    (window as unknown as W).Bootcn.toast('<b>bold</b>', { duration: 2500 });
  });
  const toaster = page.getByRole('region', { name: 'Notifications' });
  const toast = toaster.locator('.bootcn-toaster__toast');
  await expect(toast).toContainText('<b>bold</b>');
  await expect(toast.locator('b')).toHaveCount(0);
  await toast.hover();
  await expect(toaster).toHaveClass(/is-paused/);
  await page.waitForTimeout(3500);
  await expect(toast).toHaveCount(1);
  await page.mouse.move(0, 0);
  await expect(toast).toHaveCount(0, { timeout: 5000 });
});

test('toaster: promise turns loading into success', async ({ page }) => {
  await openPreview(page, 'toaster');
  await page.getByRole('button', { name: 'Promise' }).click();
  const toaster = page.getByRole('region', { name: 'Notifications' });
  await expect(toaster.locator('[data-type="loading"]')).toContainText('Saving your changes…');
  await expect(toaster.locator('[data-type="success"]')).toContainText('All changes saved.');
});

test('button with icons: names, badge count in the name, busy state', async ({ page }) => {
  await openPreview(page, 'icon-button');
  await expect(page.getByRole('button', { name: 'Notifications, 3 unread' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Saving…' })).toHaveAttribute('aria-busy', 'true');
  for (const name of ['Add, small', 'Add', 'Add, large']) {
    const box = await page.getByRole('button', { name, exact: true }).boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(24);
  }
  await expectNoAxeViolations(page);
});

test('confetti: a canvas burst that removes itself; none under reduced motion', async ({
  page,
}) => {
  await openPreview(page, 'confetti');
  await page.getByRole('button', { name: 'Celebrate' }).click();
  await expect(page.locator('canvas.bootcn-confetti')).toHaveCount(1);
  await expect(page.locator('canvas.bootcn-confetti')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('canvas.bootcn-confetti')).toHaveCount(0, { timeout: 5000 });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Celebrate' }).click();
  await expect(page.locator('canvas.bootcn-confetti')).toHaveCount(0);
  await expect(page.locator('[data-bootcn-confetti-status]')).toContainText('reduced motion');
});
