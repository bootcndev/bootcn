/**
 * CRM pack: timeline, payment card and methods, notification center and
 * filter bar.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, openPreview } from './helpers.js';

type W = { Bootcn: { timeline: { relative: (d: Date, now?: number) => string } } };

test('timeline: lists, steps and relative times', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'timeline');
  await expect(page.getByRole('list', { name: 'Activity' }).getByRole('listitem')).toHaveCount(4);
  const steps = page.getByRole('list', { name: 'Order progress' });
  await expect(steps.locator('[aria-current="step"]')).toContainText('Shipped, in progress');
  const rel = await page.evaluate(() => {
    const now = Date.parse('2026-11-25T16:00:00Z');
    const f = (iso: string) =>
      (window as unknown as W).Bootcn.timeline.relative(new Date(iso), now);
    return [f('2026-11-25T14:00:00Z'), f('2026-11-24T10:00:00Z'), f('2026-11-27T16:00:00Z')];
  });
  expect(rel).toEqual(['2 hours ago', 'yesterday', 'in 2 days']);
  // The exact date stays available.
  await expect(page.locator('time[data-bootcn-relative]').first()).toHaveAttribute('title', /.+/);
  expect(errors).toEqual([]);
});

test('payment card: live picture, formatting, flip and checks', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'payment-card');
  const card = page.locator('[data-bootcn-pay-card]');
  const number = page.getByLabel('Card number');
  await number.pressSequentially('3782822463');
  await expect(number).toHaveValue('3782 822463');
  await expect(card).toHaveAttribute('data-brand', 'amex');
  await expect(card.locator('[data-bootcn-pay-number]')).toHaveText('3782 822463 •••••');
  await number.pressSequentially('10005');
  await expect(number).toHaveValue('3782 822463 10005');
  await page.getByLabel('Name on card').fill('Olivia Martin');
  await expect(card.locator('[data-bootcn-pay-name]')).toHaveText('Olivia Martin');
  await page.getByLabel('Expiry date').pressSequentially('1130');
  await expect(card.locator('[data-bootcn-pay-expiry]')).toHaveText('11 / 30');
  await page.getByLabel('Security code').focus();
  await expect(card).toHaveClass(/is-flipped/);
  await page.getByLabel('Security code').fill('1234');
  await expect(card.locator('[data-bootcn-pay-cvc]')).toHaveText('••••');

  const submitted = page.evaluate(
    () =>
      new Promise((resolve) =>
        document.addEventListener('bootcn:pay:submit', (e) => resolve((e as CustomEvent).detail), {
          once: true,
        }),
      ),
  );
  await page.getByRole('button', { name: 'Add card' }).click();
  const detail = (await submitted) as Record<string, unknown>;
  expect(detail).toMatchObject({
    brand: 'amex',
    last4: '0005',
    name: 'Olivia Martin',
    expiry: '11 / 30',
  });
  // Never the full number or the code.
  expect(JSON.stringify({ ...detail, form: undefined })).not.toContain('378282246310005');
  expect(errors).toEqual([]);
});

test('payment card: wrong number and past date are refused', async ({ page }) => {
  await openPreview(page, 'payment-card');
  await page.getByLabel('Card number').pressSequentially('4242424242424241');
  await page.getByLabel('Name on card').fill('Olivia Martin');
  await page.getByLabel('Expiry date').pressSequentially('0120');
  await page.getByLabel('Security code').fill('123');
  await page.getByRole('button', { name: 'Add card' }).click();
  await expect(page.getByLabel('Card number')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Card number')).toBeFocused();
  await expect(page.getByLabel('Expiry date')).toHaveAttribute('aria-invalid', 'true');
});

test('payment methods: add, edit, default and remove', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'payment-methods', 'blocks');
  const list = page.locator('[data-bootcn-methods-list]');
  const live = page.locator('[data-bootcn-methods-live]');
  await expect(list.getByRole('listitem')).toHaveCount(2);
  await expect(list.getByRole('listitem').first()).toContainText('Visa ending 4242 Default');

  await page.getByRole('button', { name: 'Add card' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Add a card' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Card number').pressSequentially('5105105105105100');
  await dialog.getByLabel('Name on card').fill('Jackson Lee');
  await dialog.getByLabel('Expiry date').pressSequentially('0729');
  await dialog.getByLabel('Security code').fill('321');
  await dialog.getByRole('button', { name: 'Save card' }).click();
  await expect(dialog).toBeHidden();
  await expect(list.getByRole('listitem')).toHaveCount(3);
  await expect(list.getByRole('listitem').last()).toContainText('Mastercard ending 5100');
  await expect(live).toHaveText('Card added: Mastercard ending 5100');

  await page.getByRole('button', { name: 'Edit Mastercard ending 5100' }).click();
  const edit = page.getByRole('dialog', { name: 'Edit card' });
  await expect(edit.getByLabel('Card number')).toHaveValue('•••• •••• •••• 5100');
  // An attribute check, not toHaveJSProperty: evaluating on elements crashes
  // Playwright's Firefox here (see the file manager test).
  await expect(edit.getByLabel('Card number')).toHaveAttribute('readonly', '');
  await edit.getByLabel('Expiry date').fill('');
  await edit.getByLabel('Expiry date').pressSequentially('0830');
  await edit.getByRole('button', { name: 'Save card' }).click();
  await expect(edit).toBeHidden();
  await expect(list.getByRole('listitem').last()).toContainText('Expires 08 / 30');

  await list.getByRole('listitem').last().getByRole('button', { name: 'Set as default' }).click();
  await expect(list.getByRole('listitem').last()).toContainText('Default');
  await expect(list.getByRole('listitem').first()).not.toContainText('Default');

  await page.getByRole('button', { name: 'Remove Mastercard ending 5100' }).click();
  const confirm = page.getByRole('alertdialog', { name: 'Remove Mastercard ending 5100?' });
  await confirm.getByRole('button', { name: 'Remove card' }).click();
  await expect(list.getByRole('listitem')).toHaveCount(2);
  // The default moved to the next card.
  await expect(list.getByRole('listitem').first()).toContainText('Default');
  expect(errors).toEqual([]);
});

test('notification center: open, read, filter, add and close', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'notification-center');
  const bell = page.getByRole('button', { name: 'Notifications, 3 unread' });
  await bell.click();
  const panel = page.getByRole('region', { name: 'Notifications' });
  await expect(panel).toBeVisible();
  await expect(panel).toBeFocused();
  await expect(bell).toHaveAttribute('aria-expanded', 'true');

  await panel.getByRole('button', { name: 'Unread' }).click();
  await expect(panel.locator('[data-bootcn-notification]:visible')).toHaveCount(3);
  await panel.getByRole('button', { name: 'Mark as read' }).first().click();
  await expect(panel.locator('[data-bootcn-notification]:visible')).toHaveCount(2);
  await expect(page.locator('[data-bootcn-notifications-toggle]')).toHaveAttribute(
    'aria-label',
    'Notifications, 2 unread',
  );
  await panel.getByRole('button', { name: 'Mark all as read' }).click();
  await expect(panel.getByText("You're all caught up.")).toBeVisible();
  await expect(page.locator('[data-bootcn-notifications-count]')).toBeHidden();

  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(page.locator('[data-bootcn-notifications-toggle]')).toBeFocused();

  await page.getByRole('button', { name: 'Send a notification' }).click();
  await expect(page.locator('[data-bootcn-notifications-toggle]')).toHaveAttribute(
    'aria-label',
    'Notifications, 1 unread',
  );
  await expect(page.locator('[data-bootcn-notifications-live]')).toHaveText(
    'New notification: Olivia Martin replied to your comment',
  );
  expect(errors).toEqual([]);
});

test('filter bar: chips, ranges, search, clear', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'filter-bar');
  const bar = page.getByRole('search', { name: 'Filter contacts' });
  const count = bar.locator('[data-bootcn-filters-count]');
  const rows = page.locator('#bootcn-filter-demo tbody tr:visible');
  await expect(count).toHaveText('8 of 8 contacts');

  const status = bar.locator('[data-bootcn-filter="status"]');
  await status.getByRole('button', { name: 'Status' }).click();
  await expect(status.getByRole('button', { name: 'Status' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await status.getByLabel('Customer').check();
  await expect(count).toHaveText('3 of 8 contacts');
  await status.getByLabel('Lead').check();
  await expect(status.locator('[data-bootcn-filter-label]')).toHaveText('Status: Lead, Customer');
  await page.keyboard.press('Escape');
  await expect(status.locator('[data-bootcn-filter-toggle]')).toBeFocused();

  const value = bar.locator('[data-bootcn-filter="value"]');
  await value.locator('[data-bootcn-filter-toggle]').click();
  await value.getByLabel('Minimum').fill('10000');
  await expect(count).toHaveText('3 of 8 contacts');
  await expect(value.locator('[data-bootcn-filter-label]')).toHaveText('Deal value: $10K+');
  await expect(bar.locator('[data-bootcn-filters-live]')).toHaveText('3 of 8 contacts');

  await bar.getByRole('searchbox', { name: 'Search contacts' }).fill('north');
  await expect(rows).toHaveCount(1);
  await bar.getByRole('searchbox', { name: 'Search contacts' }).fill('zzz');
  await expect(page.getByText('No contacts match these filters.')).toBeVisible();

  await bar.getByRole('button', { name: 'Clear Status filter' }).click();
  await expect(status.locator('[data-bootcn-filter-label]')).toHaveText('Status');
  await bar.getByRole('button', { name: 'Clear all' }).click();
  await expect(count).toHaveText('8 of 8 contacts');
  expect(errors).toEqual([]);
});
