/**
 * Behaviour of the phase B components: keyboard patterns from the WAI-ARIA
 * Authoring Practices, selection state and events.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

test.describe('combobox', () => {
  test('single choice: filter, choose with the keyboard, Escape closes', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'combobox');
    const input = page.getByRole('combobox', { name: 'Framework' });
    const listbox = page.getByRole('listbox', { name: 'Framework' });
    await expect(input).toHaveValue('Laravel');

    await input.fill('dja');
    await expect(listbox).toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(listbox.getByRole('option')).toHaveText(['Django']);
    await expect(page.locator('[data-bootcn-combobox-status]').first()).toHaveText('1 result.');
    await expect(input).toHaveAttribute(
      'aria-activedescendant',
      'bootcn-combobox-framework-django',
    );
    await expectNoAxeViolations(page);

    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Django');
    await expect(listbox).toBeHidden();
    await expect(page.locator('input[name="framework"]')).toHaveValue('django');

    await page.keyboard.press('ArrowDown');
    await expect(listbox).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(listbox).toBeHidden();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(errors).toEqual([]);
  });

  test('multiple choice: chips, Backspace and remove buttons', async ({ page }) => {
    await openPreview(page, 'combobox');
    const input = page.getByRole('combobox', { name: 'Your stack' });
    const values = page.locator('input[name="stack[]"]');
    await expect(values).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Remove Astro' })).toBeVisible();

    await input.fill('fla');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Remove Flask' })).toBeVisible();
    await expect(page.getByRole('listbox', { name: 'Your stack' })).toBeVisible();
    await expect(values).toHaveCount(3);

    await page.keyboard.press('Backspace');
    await expect(page.getByRole('button', { name: 'Remove Flask' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Remove Astro' }).click();
    await expect(values).toHaveCount(1);
    await expect(values).toHaveValue('django');
  });
});

test.describe('command', () => {
  test('filters groups, moves with arrows and selects with Enter', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'command');
    const inline = page.locator('[data-bootcn-command]').first();
    const input = inline.getByRole('combobox', { name: 'Search commands' });
    const events: string[] = [];
    await page.exposeFunction('recordCommand', (value: string) => events.push(value));
    await page.evaluate(() =>
      document.addEventListener('bootcn:command:select', (event) =>
        (window as unknown as { recordCommand: (v: string) => void }).recordCommand(
          (event as CustomEvent<{ value: string }>).detail.value,
        ),
      ),
    );

    await input.fill('bil');
    await expect(inline.getByRole('option')).toHaveCount(1);
    await expect(inline.getByRole('option')).toHaveAccessibleName(/Billing/);
    await expect(inline.getByRole('group', { name: 'Suggestions' })).toBeHidden();
    await page.keyboard.press('Enter');
    expect(events).toEqual(['billing']);

    await input.fill('');
    await input.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', 'bootcn-command-inline-emoji');
    await input.fill('zzz');
    await expect(inline.getByText('No results found.')).toBeVisible();
    await expectNoAxeViolations(page);
    expect(errors).toEqual([]);
  });

  test('Ctrl+K opens the palette with the search focused', async ({ page }) => {
    await openPreview(page, 'command');
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Command palette' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: 'Search commands' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});

test('context menu: right-click and Shift+F10, arrows, typeahead, Escape', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'context-menu');
  const target = page.getByRole('button', { name: 'report.pdf' });
  const menu = page.getByRole('menu', { name: 'File actions' });

  await target.click({ button: 'right' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: /Open/ })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: /Rename/ })).toBeFocused();
  await page.keyboard.press('d');
  await expect(menu.getByRole('menuitem', { name: /Duplicate/ })).toBeFocused();
  await expectNoAxeViolations(page);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(target).toBeFocused();

  await page.keyboard.press('Shift+F10');
  await expect(menu).toBeVisible();
  await expect(target).toHaveAttribute('aria-expanded', 'true');
  await menu.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(menu).toBeHidden();
  expect(errors).toEqual([]);
});

test('menubar: one tab stop, arrows between menus, checkable items', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'menubar');
  const file = page.getByRole('menuitem', { name: 'File' });
  const edit = page.getByRole('menuitem', { name: 'Edit' });
  const view = page.getByRole('menuitem', { name: 'View' });

  await file.focus();
  await page.keyboard.press('ArrowRight');
  await expect(edit).toBeFocused();
  await expect(edit).toHaveAttribute('tabindex', '0');
  await expect(file).toHaveAttribute('tabindex', '-1');

  await page.keyboard.press('ArrowDown');
  await expect(edit).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('menuitem', { name: 'Undo' })).toBeFocused();
  await expectNoAxeViolations(page);

  await page.keyboard.press('ArrowRight');
  await expect(view).toHaveAttribute('aria-expanded', 'true');
  const bookmarks = page.getByRole('menuitemcheckbox', { name: 'Show bookmarks bar' });
  await expect(bookmarks).toBeFocused();
  await page.keyboard.press('Enter');
  // The menu closes on activation, so check the (now hidden) item by selector.
  await expect(page.locator('.bootcn-menubar__check').first()).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(view).toBeFocused();
  await expect(view).toHaveAttribute('aria-expanded', 'false');

  await file.click();
  await expect(page.getByRole('menu', { name: 'File' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu', { name: 'File' })).toBeHidden();
  expect(errors).toEqual([]);
});
