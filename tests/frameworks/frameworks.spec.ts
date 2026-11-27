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
        if (message.type() === 'error') errors.push(message.text());
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

    test('toaster: toast() shows a message', async ({ page }) => {
      await page.getByRole('button', { name: 'Save profile' }).click();
      await expect(page.getByText('Profile saved')).toBeVisible();
      await expect(page.getByText('Just now')).toBeVisible();
    });
  });
}
