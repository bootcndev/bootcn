/**
 * App UI pack: experience timeline, API keys, invoice, dropzone, file
 * manager and kanban.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, openPreview } from './helpers.js';

type W = {
  Bootcn: {
    experience: { duration: (start: string, end?: string) => string };
    invoice: { calculate: (root: Element) => { subtotal: number; tax: number; total: number } };
  };
};

test('experience timeline: structure and durations', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'experience-timeline');
  const section = page.getByRole('region', { name: 'Experience' });
  await expect(section.getByRole('heading', { level: 3 })).toHaveText([
    'Northwind',
    'Product Designer',
    'Design Intern',
  ]);
  await expect(section.getByRole('heading', { level: 4 })).toHaveText([
    'Design Lead',
    'Senior Product Designer',
  ]);
  // Fixed ranges: both the first and the last month count.
  await expect(section.locator('[data-start="2021-03"][data-end="2023-12"]')).toHaveText(
    '2 yrs 10 mos',
  );
  await expect(section.locator('[data-start="2017-09"]')).toHaveText('6 mos');
  const d = (start: string, end?: string) =>
    page.evaluate(
      ([s, e]) => (window as unknown as W).Bootcn.experience.duration(s!, e),
      [start, end],
    );
  expect(await d('2024-01', '2024-01')).toBe('1 mo');
  expect(await d('2023-01', '2023-12')).toBe('1 yr');
  expect(await d('2020-05', '2022-06')).toBe('2 yrs 2 mos');
  expect(errors).toEqual([]);
});

test('api keys: create shows the key once, revoke asks first', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'api-keys', 'blocks');
  const block = page.getByRole('region', { name: 'API keys' });
  const rows = block.locator('tbody [data-bootcn-api-key]');
  await expect(rows).toHaveCount(3);

  await block.getByRole('button', { name: 'Create key' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create an API key' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Name')).toBeFocused();
  await dialog.getByRole('button', { name: 'Create key' }).click();
  await expect(dialog.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');

  await dialog.getByLabel('Name').fill('Mobile app');
  await dialog.getByLabel('Permissions').selectOption('read');
  await dialog.getByRole('button', { name: 'Create key' }).click();
  const save = page.getByRole('dialog', { name: 'Save your key' });
  await expect(save.getByText("you won't be able to see it again")).toBeVisible();
  const secret = save.getByLabel('Your new key');
  await expect(secret).toHaveValue(/^key_live_ro_[A-Za-z0-9]{32}$/);
  const key = await secret.inputValue();
  await expect(rows).toHaveCount(4);
  const first = rows.first();
  await expect(first.getByRole('rowheader')).toHaveText('Mobile app');
  await expect(first.locator('code')).toHaveText(`key_live_ro_••••••••${key.slice(-4)}`);
  await expect(first).toContainText('Read only');
  await expect(first).toContainText('Never');

  // Closing removes the full key from the page.
  await save.getByRole('button', { name: 'Done' }).click();
  await expect(save).toBeHidden();
  expect(await page.content()).not.toContain(key);

  await block.getByRole('button', { name: 'Revoke CI pipeline' }).click();
  const confirm = page.getByRole('alertdialog', { name: 'Revoke CI pipeline?' });
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(rows).toHaveCount(4);
  await block.getByRole('button', { name: 'Revoke CI pipeline' }).click();
  await confirm.getByRole('button', { name: 'Revoke key' }).click();
  await expect(confirm).toBeHidden();
  await expect(rows).toHaveCount(3);
  await expect(block.locator('[data-bootcn-api-keys-live]')).toHaveText('Key revoked: CI pipeline');
  expect(errors).toEqual([]);
});

test('api keys: the server can supply the key', async ({ page }) => {
  await openPreview(page, 'api-keys', 'blocks');
  await page.evaluate(() => {
    document.addEventListener('bootcn:api-keys:create', (event) => {
      event.preventDefault();
      const detail = (event as CustomEvent<{ done: (key: string, id: string) => void }>).detail;
      setTimeout(() => detail.done('key_live_fromserver000000000000000000000000', 'srv-1'), 50);
    });
  });
  await page.getByRole('button', { name: 'Create key' }).click();
  await page.getByLabel('Name').fill('Server key');
  await page.getByRole('dialog').getByRole('button', { name: 'Create key' }).click();
  await expect(page.getByLabel('Your new key')).toHaveValue(
    'key_live_fromserver000000000000000000000000',
  );
  await expect(page.locator('[data-bootcn-api-key="srv-1"]')).toBeVisible();
});

test('invoice: amounts and totals from quantity and price', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'invoice', 'blocks');
  const invoice = page.getByRole('article', { name: 'Invoice' });
  await expect(invoice.locator('[data-bootcn-invoice-total]')).toHaveText('$10,269.60');
  await expect(invoice.locator('[data-bootcn-invoice-tax]')).toHaveText('$1,711.60');
  await expect(invoice.getByRole('row', { name: /Hosting/ })).toContainText('$588.00');

  // A changed row and another currency: everything is recalculated.
  const totals = await invoice.evaluate((root) => {
    root.setAttribute('data-currency', 'EUR');
    root.setAttribute('data-locale', 'de-DE');
    root.querySelector('[data-bootcn-invoice-item]')!.setAttribute('data-quantity', '2');
    return (window as unknown as W).Bootcn.invoice.calculate(root);
  });
  expect(totals.subtotal).toBe(13358);
  expect(totals.total).toBeCloseTo(16029.6);
  await expect(invoice.locator('[data-bootcn-invoice-total]')).toHaveText(/16\.029,60\s€/);

  // Printing hides the buttons.
  await page.emulateMedia({ media: 'print' });
  await expect(invoice.getByRole('button', { name: 'Print' })).toBeHidden();
  await expect(invoice.getByText('Due in 14 days')).toBeVisible();
  expect(errors).toEqual([]);
});
