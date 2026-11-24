/**
 * Phase G2, HeroUI extras: close button, checkbox group, form validation,
 * autocomplete, color slider and color area.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

test('close button: named, focus ring, disabled', async ({ page }) => {
  await openPreview(page, 'close-button');
  const buttons = page.getByRole('button', { name: 'Close' });
  await expect(buttons).toHaveCount(4);
  await expect(buttons.nth(3)).toBeDisabled();
  for (let i = 0; i < 3; i += 1) {
    const box = await buttons.nth(i).boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(24);
  }
  await page.keyboard.press('Tab');
  await expect(buttons.first()).toBeFocused();
  expect(await buttons.first().evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
  await expectNoAxeViolations(page);
});

test('checkbox group: select all, mixed state, minimum on submit', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'checkbox-group');
  const group = page.getByRole('group', { name: 'Notifications' });
  const all = group.getByRole('checkbox', { name: 'Select all' });
  await expect(all).toHaveJSProperty('indeterminate', true);
  await expectNoAxeViolations(page);

  await all.check();
  await expect(group.locator('.bootcn-checkbox-group__items input:checked')).toHaveCount(4);
  await expect(all).toHaveJSProperty('indeterminate', false);
  await all.uncheck();
  await expect(group.locator('.bootcn-checkbox-group__items input:checked')).toHaveCount(0);

  // Below the minimum: the error shows, is linked, and submit is stopped.
  await expect(group.locator('.bootcn-checkbox-group__error')).toHaveText(
    'Choose at least one channel.',
  );
  await expect(group).toHaveAttribute('aria-describedby', /bootcn-checkbox-group-error/);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(group.getByRole('checkbox', { name: 'Email' })).toBeFocused();
  await expect(page).toHaveURL(/preview\.html$/);
  await expectNoAxeViolations(page);

  await group.getByRole('checkbox', { name: 'Slack' }).check();
  await expect(group.locator('.bootcn-checkbox-group__error')).toBeHidden();
  await expect(all).toHaveJSProperty('indeterminate', true);
  expect(errors).toEqual([]);
});

test('form: errors and the summary have no axe violations', async ({ page, browserName }) => {
  // axe followed by typing crashes Firefox's page in CI (Playwright 1.65),
  // as over overlays; Chromium and WebKit run the check.
  test.skip(browserName === 'firefox', 'axe crashes the Firefox page here');
  await openPreview(page, 'form');
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.locator('[data-bootcn-form-summary]')).toBeFocused();
  await expectNoAxeViolations(page);
});

test('form: messages, focused summary, live checks, success', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'form');
  const submit = page.getByRole('button', { name: 'Create account' });
  await submit.click();

  const summary = page.locator('[data-bootcn-form-summary]');
  await expect(summary).toBeFocused();
  await expect(summary).toContainText('There are 5 problems');
  const email = page.getByRole('textbox', { name: 'Email' });
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAccessibleDescription(/Enter your email address\./);

  // A summary link moves focus to its field.
  await summary.getByRole('link', { name: /Email:/ }).click();
  await expect(email).toBeFocused();

  // After the first submit, fields are checked as you type.
  await email.fill('not-an-email');
  await expect(page.locator('#bootcn-form-email-error')).toHaveText(
    'Enter an email address like name@example.com.',
  );
  await email.fill('ada@example.com');
  await expect(email).not.toHaveAttribute('aria-invalid', 'true');
  await expect(summary).toContainText('There are 4 problems');

  await page.getByRole('textbox', { name: 'Full name' }).fill('Ada Lovelace');
  await page.getByLabel('Password').fill('short');
  await expect(page.locator('#bootcn-form-password-error')).toHaveText(
    'Use at least 8 characters.',
  );
  await page.getByLabel('Password').fill('correct horse battery');
  await page.getByRole('combobox', { name: 'Plan' }).selectOption('pro');
  await page.getByRole('checkbox', { name: /accept the terms/ }).check();
  await submit.click();
  await expect(summary).toBeHidden();
  await expect(page.locator('[data-bootcn-form-success]')).toHaveText('Saved.');
  expect(errors).toEqual([]);
});

test('form: no error while typing before the first submit', async ({ page }) => {
  await openPreview(page, 'form');
  const email = page.getByRole('textbox', { name: 'Email' });
  await email.pressSequentially('ada');
  await expect(email).not.toHaveAttribute('aria-invalid', 'true');
  await page.keyboard.press('Tab');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
});

test('autocomplete: filter, mark the match, choose, free text', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'autocomplete');
  const input = page.getByRole('combobox', { name: 'City' });
  const list = page.getByRole('listbox', { name: 'City' });
  await input.pressSequentially('lo');
  await expect(list).toBeVisible();
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(list.getByRole('option')).toHaveText(['Barcelona', 'London', 'Thessaloniki']);
  await expect(list.getByRole('option', { name: 'London' }).locator('mark')).toHaveText('Lo');
  await expect(page.locator('[data-bootcn-autocomplete-status]')).toHaveText('3 suggestions.');
  await expectNoAxeViolations(page);

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', 'bootcn-autocomplete-city-london');
  await expect(list.getByRole('option', { name: 'London' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('London');
  await expect(list).toBeHidden();

  // Any text is allowed.
  await input.fill('Heraklion');
  await expect(list).toBeHidden();
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('Heraklion');

  // Escape closes, then clears.
  await input.fill('a');
  await expect(list).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(list).toBeHidden();
  await expect(input).toHaveValue('a');
  await page.keyboard.press('Escape');
  await expect(input).toHaveValue('');

  // Mouse: clicking a suggestion keeps focus in the input.
  await input.fill('vie');
  await list.getByRole('option', { name: 'Vienna' }).click();
  await expect(input).toHaveValue('Vienna');
  await expect(input).toBeFocused();
  expect(errors).toEqual([]);
});

test('autocomplete: remote suggestions from a URL', async ({ page }) => {
  await openPreview(page, 'autocomplete');
  await page.route('**/cities?q=*', (route) => {
    const q = new URL(route.request().url()).searchParams.get('q');
    return route.fulfill({
      json: [{ value: 'ath', label: `Athens (${q})` }, 'Atlanta <b>US</b>'],
    });
  });
  await page.evaluate(() =>
    document
      .querySelector('[data-bootcn-autocomplete]')!
      .setAttribute('data-bootcn-autocomplete-url', '/cities?q='),
  );
  const input = page.getByRole('combobox', { name: 'City' });
  await input.pressSequentially('at');
  const list = page.getByRole('listbox', { name: 'City' });
  await expect(list.getByRole('option')).toHaveText(['Athens (at)', 'Atlanta <b>US</b>']);
  await expect(list.locator('b')).toHaveCount(0);
  await list.getByRole('option').first().click();
  await expect(input).toHaveValue('ath');
});

test('color slider: channels paint the swatch and the form value', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'color-slider');
  await expectNoAxeViolations(page);
  const hue = page.getByRole('slider', { name: 'Hue' });
  await expect(hue).toHaveAttribute('aria-valuetext', '262 degrees');
  await hue.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('output[for="bootcn-color-slider-hue"]')).toHaveText('263°');
  const alpha = page.getByRole('slider', { name: 'Opacity' });
  await alpha.fill('50');
  await expect(page.locator('[data-bootcn-color-slider-value]')).toHaveValue(
    'hsl(263 83% 58% / 0.5)',
  );
  await expect(page.locator('output[for="bootcn-color-slider-alpha"]')).toHaveText('50%');
  expect(errors).toEqual([]);
});

test('color area: keyboard in two dimensions, pointer, hue and hex', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'color-area');
  const value = page.locator('[data-bootcn-color-area-value]');
  const hex = page.getByRole('textbox', { name: 'Hex' });
  await expect(hex).toHaveValue('#2563eb');
  await expectNoAxeViolations(page);

  const area = page.getByRole('slider', { name: 'Saturation' });
  await expect(area).toHaveAttribute('aria-valuetext', 'Saturation 84%, brightness 92%');
  await area.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Shift+ArrowLeft');
  await expect(area).toHaveAttribute('aria-valuetext', 'Saturation 74%, brightness 91%');
  await expect(value).not.toHaveValue('#2563eb');

  // Pointer: a click inside the area moves the thumb and keeps the focus
  // on it; End and Page Up then reach the top-right corner (the pure hue).
  const box = (await page.locator('[data-bootcn-color-area-area]').boundingBox())!;
  await page.mouse.click(box.x + box.width / 4, box.y + box.height / 2);
  await expect(area).toBeFocused();
  await expect(area).toHaveAttribute('aria-valuetext', /Saturation 2[45]%, brightness 5[01]%/);
  await page.keyboard.press('End');
  for (let i = 0; i < 5; i += 1) await page.keyboard.press('PageUp');
  await page.getByRole('slider', { name: 'Hue' }).fill('0');
  await expect(value).toHaveValue('#ff0000');

  // Hex: valid values apply as you type, invalid ones are flagged on leave.
  await hex.fill('#0f0');
  await expect(value).toHaveValue('#00ff00');
  await expect(page.getByRole('slider', { name: 'Hue' })).toHaveValue('120');
  await hex.fill('nope');
  await hex.blur();
  await expect(hex).toHaveAttribute('aria-invalid', 'true');
  await expect(value).toHaveValue('#00ff00');
  expect(errors).toEqual([]);
});
