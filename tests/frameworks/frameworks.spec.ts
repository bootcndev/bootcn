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
  });
}
