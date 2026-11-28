/**
 * The same checks in both apps: the components work as components of the
 * framework (props, v-model, events) on top of Bootcn's CSS and JavaScript.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const framework of ['react', 'vue']) {
  test.describe(framework, () => {
    test.beforeEach(async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        // The avatar's missing.png fails on purpose, to show its initials.
        if (message.type() === 'error' && !message.text().includes('404')) {
          errors.push(message.text());
        }
      });
      await page.goto(`/examples/${framework}/dist/index.html`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      test.info().annotations.push({ type: 'errors', description: errors.join('\n') });
      expect(errors).toEqual([]);
    });

    test('button: variants are Bootcn buttons', async ({ page }) => {
      const remove = page.getByRole('button', { name: 'Delete project' });
      await expect(remove).toHaveClass(/btn bootcn-button bootcn-button--destructive/);
      await expect(remove).toHaveAttribute('type', 'button');
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.map((v) => v.id)).toEqual([]);
    });

    test('dialog: open from state, Escape closes it and returns focus', async ({ page }) => {
      const trigger = page.getByRole('button', { name: 'Delete project' });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: 'Delete this project?' });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleDescription(
        'This removes the project and all of its data.',
      );
      // Bootstrap moves focus in once the fade has finished.
      await expect
        .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
        .toBe(true);
      const results = await new AxeBuilder({ page }).include('.modal').analyze();
      expect(results.violations.map((v) => v.id)).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(page.getByTestId('state')).toHaveText('Project kept');

      // Open again: the state follows, and the footer button changes it.
      await trigger.click();
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Delete project' }).click();
      await expect(dialog).toBeHidden();
      await expect(page.getByTestId('state')).toHaveText('Project deleted');
    });

    test('form fields: labels, hints, errors and two-way state', async ({ page }) => {
      const name = page.getByRole('textbox', { name: 'Name' });
      await expect(name).toHaveAttribute('aria-invalid', 'true');
      await expect(name).toHaveAccessibleDescription('Shown on your profile. Enter your name.');
      await name.fill('Lena');
      await expect(name).not.toHaveAttribute('aria-invalid', 'true');
      await expect(name).toHaveAccessibleDescription('Shown on your profile.');
      await page.getByRole('combobox', { name: 'Country' }).selectOption('es');
      await page.getByRole('checkbox', { name: 'Accept the terms' }).check();
      await page.getByRole('switch', { name: 'Wi-Fi' }).uncheck();
      await expect(page.getByTestId('form')).toHaveText('Lena / es / terms yes / wifi off');
      await expect(page.getByRole('textbox', { name: 'Bio' })).toHaveClass(/bootcn-textarea/);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.map((v) => v.id)).toEqual([]);
    });

    test('tabs: arrow keys, Home and End, one tab in the Tab order', async ({ page }) => {
      const list = page.getByRole('tablist', { name: 'Account settings' });
      const account = list.getByRole('tab', { name: 'Account' });
      await expect(account).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('tabpanel', { name: 'Account' })).toHaveText('Account panel');
      await account.focus();
      await page.keyboard.press('ArrowRight');
      await expect(list.getByRole('tab', { name: 'Password' })).toBeFocused();
      await expect(page.getByRole('tabpanel', { name: 'Password' })).toBeVisible();
      await expect(page.getByRole('tabpanel', { name: 'Account' })).toBeHidden();
      await page.keyboard.press('End');
      await expect(list.getByRole('tab', { name: 'Team' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await page.keyboard.press('Home');
      await expect(account).toBeFocused();
      await expect(list.locator('[tabindex="0"]')).toHaveCount(1);
    });

    test('card, badge, alert and avatar', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Profile' })).toHaveClass(
        /bootcn-card__title/,
      );
      await expect(page.getByText('Draft')).toHaveClass(/bootcn-badge--secondary/);
      await expect(page.locator('.bootcn-alert__title')).toHaveText('Heads up');
      // The image fails, so the initials show, named for screen readers.
      await expect(page.getByRole('img', { name: 'Lena Fischer' })).toHaveText('LF');
      await expect(page.getByRole('img', { name: 'Marco Bianchi' })).toHaveClass(
        /bootcn-avatar--sm/,
      );
    });

    test('toaster: toast() shows a message', async ({ page }) => {
      await page.getByRole('button', { name: 'Save profile' }).click();
      await expect(page.getByText('Profile saved')).toBeVisible();
      await expect(page.getByText('Just now')).toBeVisible();
    });
    test('dropdown: a menu with arrow keys; items run their action', async ({ page }) => {
      const trigger = page.getByRole('button', { name: 'My account' });
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      const menu = page.locator('.bootcn-dropdown__menu');
      await expect(menu).toBeVisible();
      await expect(menu.getByRole('button', { name: 'Billing (soon)' })).toBeDisabled();
      await page.keyboard.press('ArrowDown');
      await expect(menu.getByRole('button', { name: 'Profile' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await menu.getByRole('button', { name: 'Sign out' }).click();
      await expect(menu).toBeHidden();
      await expect(page.getByTestId('action')).toHaveText('action sign out');
    });

    test('tooltip and popover: a description, closed with Escape', async ({ page }) => {
      const hint = page.getByRole('button', { name: 'Hover or focus me' });
      await hint.focus();
      const tooltip = page.getByRole('tooltip');
      await expect(tooltip).toHaveText('Add to library');
      await expect(hint).toHaveAccessibleDescription('Add to library');
      await page.keyboard.press('Escape');
      await expect(tooltip).toBeHidden();

      const usage = page.getByRole('button', { name: 'Show usage' });
      await usage.click();
      const popover = page.locator('.popover.bootcn-popover');
      await expect(popover).toBeVisible();
      await expect(popover).toContainText('Storage');
      await expect(popover).toContainText('You are using 7.2 GB of your 10 GB plan.');
      await page.keyboard.press('Escape');
      await expect(popover).toBeHidden();
      await expect(usage).toBeFocused();
    });

    test('sheet: open from state, Escape closes it and returns focus', async ({ page }) => {
      const trigger = page.getByRole('button', { name: 'Edit profile' });
      await trigger.click();
      const sheet = page.getByRole('dialog', { name: 'Edit profile' });
      await expect(sheet).toBeVisible();
      await expect(sheet).toHaveAccessibleDescription('Change your public details.');
      await expect
        .poll(() => sheet.evaluate((el) => el.contains(document.activeElement)))
        .toBe(true);
      const results = await new AxeBuilder({ page }).include('.offcanvas').analyze();
      expect(results.violations.map((v) => v.id)).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(sheet).toBeHidden();
      await expect(trigger).toBeFocused();
      // Closed by Escape, the state follows: it opens again.
      await trigger.click();
      await expect(sheet).toBeVisible();
      await sheet.getByRole('button', { name: 'Save changes' }).click();
      await expect(sheet).toBeHidden();
    });

    test('combobox: filter, arrow keys, Enter and Escape', async ({ page }) => {
      const input = page.getByRole('combobox', { name: 'Framework' });
      await input.fill('la');
      const listbox = page.getByRole('listbox', { name: 'Framework' });
      await expect(listbox).toBeVisible();
      await expect(listbox.getByRole('option')).toHaveText(['Laravel']);
      await expect(page.getByRole('status').filter({ hasText: 'result' })).toHaveText('1 result.');
      await input.fill('');
      await input.press('End');
      await input.press('ArrowDown');
      await expect(input).toHaveAttribute('aria-activedescendant', /-option-astro$/);
      await input.press('ArrowDown');
      await input.press('Enter');
      await expect(listbox).toBeHidden();
      await expect(input).toHaveValue('Laravel');
      await expect(input).toHaveAttribute('aria-expanded', 'false');
      await expect(page.getByTestId('picked')).toContainText('framework laravel');
      await input.fill('zzz');
      await expect(page.locator('.bootcn-combobox__empty')).toHaveText('No framework found.');
      await expect(page.locator('.bootcn-combobox__empty')).toBeVisible();
      await input.press('Escape');
      await expect(input).toHaveValue('Laravel');
      const results = await new AxeBuilder({ page }).include('.bootcn-combobox').analyze();
      expect(results.violations.map((v) => v.id)).toEqual([]);
    });

    test('date picker: the calendar opens, a day is chosen with the keyboard', async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-12-10T10:00:00'));
      await page.reload();
      const trigger = page.getByRole('button', { name: /Delivery date/ });
      await expect(trigger).toHaveAccessibleName('Delivery date Pick a date');
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: 'Choose a date' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('heading')).toHaveText(/December 2026/);
      // Focus moves to today; the next day is chosen with ArrowRight and Enter.
      await expect(dialog.getByRole('button', { name: /December 10, 2026/ })).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAccessibleName('Delivery date December 11, 2026');
      await expect(page.getByTestId('picked')).toContainText('date 2026-12-11');
    });

    test('data table: sort, filter, pages and selection', async ({ page }) => {
      const table = page.getByRole('table', { name: 'Payments' });
      const rows = table.locator('tbody tr');
      await expect(rows).toHaveCount(5);
      await expect(page.getByText('Showing 1–5 of 7')).toBeVisible();

      const amount = table.getByRole('columnheader', { name: 'Amount' });
      await amount.getByRole('button').click();
      await expect(amount).toHaveAttribute('aria-sort', 'ascending');
      await expect(rows.first()).toContainText('€74.00');
      await amount.getByRole('button').click();
      await expect(amount).toHaveAttribute('aria-sort', 'descending');
      await expect(rows.first()).toContainText('€837.00');

      await page.getByRole('button', { name: 'Next' }).click();
      await expect(rows).toHaveCount(2);
      await expect(page.getByText('Showing 6–7 of 7')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();

      await page.getByRole('searchbox', { name: 'Filter payments' }).fill('pending');
      await expect(rows).toHaveCount(2);
      await table.getByRole('checkbox', { name: 'Select all rows' }).check();
      await expect(page.getByText('2 of 7 rows selected.')).toBeVisible();
      await page.getByRole('searchbox', { name: 'Filter payments' }).fill('zzz');
      await expect(page.getByText('No payments match.')).toBeVisible();
      await page.getByRole('searchbox', { name: 'Filter payments' }).fill('');
      await expect(table.getByRole('checkbox', { name: 'Select all rows' })).not.toBeChecked();
      const results = await new AxeBuilder({ page }).include('.bootcn-data-table').analyze();
      expect(results.violations.map((v) => v.id)).toEqual([]);
    });
  });
}
