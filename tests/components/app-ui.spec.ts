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

test('dropzone: checks files, shows progress and removes them', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'dropzone');
  const zone = page.locator('[data-bootcn-dropzone]');
  await zone.locator('input[type="file"]').setInputFiles([
    { name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from('89504e47', 'hex') },
    { name: 'notes.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('x') },
    {
      name: 'huge.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(11 * 1024 * 1024),
    },
  ]);
  const items = zone.getByRole('listitem');
  await expect(items).toHaveCount(3);
  await expect(items.nth(1)).toContainText('This type of file is not allowed');
  await expect(items.nth(2)).toContainText('Too large (max 10.5 MB)');
  await expect(items.nth(0)).toContainText('Uploaded', { timeout: 5000 });
  await expect(zone.locator('[data-bootcn-dropzone-live]')).toContainText('logo.png');

  await zone.getByRole('button', { name: 'Remove notes.exe' }).click();
  await expect(items).toHaveCount(2);
  await expect(zone.getByRole('button', { name: 'Remove huge.pdf' })).toBeFocused();

  // Dropping files works like choosing them.
  const transfer = await page.evaluateHandle(() => {
    const dt = new DataTransfer();
    dt.items.add(new File(['a,b'], 'data.csv', { type: 'text/csv' }));
    return dt;
  });
  const area = zone.locator('.bootcn-dropzone__area');
  await area.dispatchEvent('dragover', { dataTransfer: transfer });
  await expect(zone).toHaveClass(/is-dragging/);
  await area.dispatchEvent('drop', { dataTransfer: transfer });
  await expect(zone).not.toHaveClass(/is-dragging/);
  await expect(items).toHaveCount(3);
  await expect(zone.getByRole('listitem').filter({ hasText: 'data.csv' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('file manager: sort, search, select, delete, view and upload', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'file-manager');
  const files = page.getByRole('region', { name: 'Files' });
  const table = files.getByRole('table', { name: 'Files in Website' });
  // page.evaluate, not locator.evaluateAll: in Playwright's Firefox an
  // evaluateAll on these rows followed by a click crashes the page (a
  // test-tool bug, not the component's).
  const names = () =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-bootcn-files-item]')).map((r) =>
        r.getAttribute('data-name'),
      ),
    );
  expect((await names()).slice(0, 2)).toEqual(['Brand assets', 'Invoices']);

  // Size, largest first: folders stay on top.
  await table.getByRole('button', { name: 'Size' }).click();
  await table.getByRole('button', { name: 'Size' }).click();
  await expect(table.getByRole('columnheader', { name: 'Size' })).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  expect((await names()).slice(0, 4)).toEqual([
    'Brand assets',
    'Invoices',
    'Product demo.mp4',
    'Homepage hero.png',
  ]);

  await files.getByRole('searchbox', { name: 'Search files' }).fill('.p');
  // "Homepage hero.png" and "Q3 report.pdf".
  await expect(table.locator('[data-bootcn-files-item]:visible')).toHaveCount(2);
  await files.getByRole('searchbox', { name: 'Search files' }).fill('zzz');
  await expect(files.getByText('No files match your search.')).toBeVisible();
  await files.getByRole('searchbox', { name: 'Search files' }).fill('');

  await table.getByRole('checkbox', { name: 'Select Q3 report.pdf' }).check();
  await table.getByRole('checkbox', { name: 'Select Customers.csv' }).check();
  await expect(files.locator('[data-bootcn-files-count]')).toHaveText('2 selected');
  const all = table.getByRole('checkbox', { name: 'Select all' });
  expect(await all.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);

  const action = page.evaluate(
    () =>
      new Promise<{ action: string; names: string[] }>((resolve) =>
        document.addEventListener(
          'bootcn:files:action',
          (e) => resolve((e as CustomEvent<{ action: string; names: string[] }>).detail),
          { once: true },
        ),
      ),
  );
  await files.locator('[data-bootcn-files-bulk]').getByRole('button', { name: 'Delete' }).click();
  expect(await action).toMatchObject({
    action: 'delete',
    names: ['Q3 report.pdf', 'Customers.csv'],
  });
  await expect(table.locator('[data-bootcn-files-item]')).toHaveCount(5);
  await expect(files.locator('[data-bootcn-files-bulk]')).toBeHidden();
  await expect(files.locator('[data-bootcn-files-live]')).toHaveText('Deleted 2 files');

  // One file from its menu.
  await table.getByRole('button', { name: 'Actions for Meeting notes.txt' }).click();
  await table
    .getByRole('menu')
    .or(table.locator('.dropdown-menu.show'))
    .getByRole('button', { name: 'Delete' })
    .click();
  await expect(table.locator('[data-name="Meeting notes.txt"]')).toHaveCount(0);

  await files.getByRole('button', { name: 'Grid' }).click();
  await expect(files.getByRole('button', { name: 'Grid' })).toHaveAttribute('aria-pressed', 'true');
  await expect(files).toHaveAttribute('data-view', 'grid');

  await files.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(files.getByRole('button', { name: 'Upload', exact: true })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await files.locator('input[type="file"]').setInputFiles({
    name: 'Budget 2027.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from('x'.repeat(2048)),
  });
  const added = table.locator('[data-name="Budget 2027.xlsx"]');
  await expect(added).toBeVisible({ timeout: 5000 });
  await expect(added).toHaveAttribute('data-type', 'sheet');
  await expect(added.getByRole('checkbox', { name: 'Select Budget 2027.xlsx' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('kanban: keyboard moves, cancel, limits and adding cards', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'kanban');
  const board = page.getByRole('region', { name: 'Website launch' });
  const column = (name: string) => board.getByRole('region', { name });
  const live = board.locator('[data-bootcn-kanban-live]');
  const moves: unknown[] = [];
  await page.exposeFunction('recordMove', (detail: unknown) => moves.push(detail));
  await page.evaluate(() =>
    document.addEventListener('bootcn:kanban:move', (e) =>
      (window as unknown as { recordMove: (d: unknown) => void }).recordMove(
        (e as CustomEvent).detail,
      ),
    ),
  );

  const card = board.locator('[data-bootcn-kanban-card="c1"]');
  await card.focus();
  await page.keyboard.press('Space');
  await expect(live).toContainText('Picked up Hero illustration for the homepage');
  await page.keyboard.press('ArrowRight');
  await expect(live).toHaveText('In progress, position 1 of 3.');
  await page.keyboard.press('ArrowDown');
  await expect(live).toHaveText('In progress, position 2 of 3.');
  await expect(card).toBeFocused();
  await page.keyboard.press('Space');
  await expect(live).toHaveText(
    'Dropped Hero illustration for the homepage in In progress, position 2 of 3.',
  );
  expect(moves).toEqual([{ card: 'c1', from: 'todo', to: 'doing', index: 1 }]);
  await expect(column('In progress').locator('[data-bootcn-kanban-count]')).toHaveText('3 / 3');
  await expect(column('To do').locator('[data-bootcn-kanban-count]')).toHaveText('2');

  // Over the limit: marked.
  const other = board.locator('[data-bootcn-kanban-card="c6"]');
  await other.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect(column('In progress')).toHaveClass(/is-over-limit/);
  await expect(column('In progress').locator('[data-bootcn-kanban-count]')).toHaveText('4 / 3');

  // Escape puts the card back where it was.
  const done = board.locator('[data-bootcn-kanban-card="c7"]');
  await done.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Escape');
  await expect(live).toHaveText('Move cancelled. Choose the analytics tool is back in Done.');
  await expect(column('Done').locator('[data-bootcn-kanban-card="c7"]')).toHaveCount(1);
  await expect(done).toBeFocused();

  // Without a card picked up, arrows move the focus.
  await page.keyboard.press('ArrowDown');
  await expect(board.locator('[data-bootcn-kanban-card="c8"]')).toBeFocused();

  // Add a card.
  await column('Review').getByRole('button', { name: 'Add a card' }).click();
  const field = column('Review').getByLabel('New card in Review');
  await expect(field).toBeFocused();
  await field.fill('Accessibility audit');
  await page.keyboard.press('Enter');
  await expect(column('Review').locator('.bootcn-kanban__title')).toContainText([
    'Accessibility audit',
  ]);
  await expect(live).toHaveText('Added Accessibility audit to Review.');
  await page.keyboard.press('Escape');
  await expect(column('Review').getByRole('button', { name: 'Add a card' })).toBeFocused();
  // A column with cards hides its "Drop cards here" hint.
  await expect(column('Review').locator('[data-bootcn-kanban-empty]')).toBeHidden();
  expect(errors).toEqual([]);
});

test('kanban: drag and drop with the mouse', async ({ page }) => {
  await openPreview(page, 'kanban');
  await page.setViewportSize({ width: 1280, height: 900 });
  const board = page.getByRole('region', { name: 'Website launch' });
  const card = board.locator('[data-bootcn-kanban-card="c3"]');
  const target = board.locator('[data-bootcn-kanban-card="c6"]');
  const from = (await card.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + 30, from.y + 20);
  await page.mouse.down();
  await page.mouse.move(from.x + 60, from.y + 40, { steps: 3 });
  await expect(card).toHaveClass(/is-dragging/);
  await expect(board.locator('.bootcn-kanban__placeholder')).toHaveCount(1);
  // Above the middle of the Review card: lands before it.
  await page.mouse.move(to.x + 30, to.y + 5, { steps: 8 });
  await page.mouse.up();
  await expect(card).not.toHaveClass(/is-dragging/);
  await expect(board.locator('.bootcn-kanban__placeholder')).toHaveCount(0);
  const review = board.getByRole('region', { name: 'Review' });
  await expect(review.locator('[data-bootcn-kanban-card]').first()).toHaveAttribute(
    'data-bootcn-kanban-card',
    'c3',
  );
  await expect(review.locator('[data-bootcn-kanban-count]')).toHaveText('2');
});
