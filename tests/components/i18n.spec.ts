/**
 * Messages read window.Bootcn.messages, with plurals from Intl.PluralRules.
 */
import { expect, test } from '@playwright/test';

import { openPreview } from './helpers.js';

test('autocomplete and snippet speak the page language', async ({ page }) => {
  await page.addInitScript(() => {
    // <html> does not exist yet when init scripts run.
    document.addEventListener('DOMContentLoaded', () => (document.documentElement.lang = 'el'));
    (window as unknown as { Bootcn: object }).Bootcn = {
      messages: {
        'autocomplete.count.one': '1 πρόταση.',
        'autocomplete.count.other': '{count} προτάσεις.',
        'copy.done': 'Αντιγράφηκε.',
      },
    };
  });
  await openPreview(page, 'autocomplete');
  const input = page.getByRole('combobox', { name: 'City' });
  await input.pressSequentially('lo');
  await expect(page.locator('[data-bootcn-autocomplete-status]')).toHaveText('3 προτάσεις.');
  await input.fill('lond');
  await expect(page.locator('[data-bootcn-autocomplete-status]')).toHaveText('1 πρόταση.');

  await openPreview(page, 'snippet');
  await page.getByRole('button', { name: 'Copy command', exact: true }).click();
  await expect(page.locator('[data-bootcn-snippet-status]').first()).toHaveText('Αντιγράφηκε.');
});

test('date input segment names and placeholders can be translated', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { Bootcn: object }).Bootcn = {
      messages: { 'date-input.day': 'ημέρα', 'date-input.placeholder.day': 'ηη' },
    };
  });
  await openPreview(page, 'date-input');
  const day = page.getByRole('group', { name: 'Date of birth' }).getByRole('spinbutton', {
    name: 'ημέρα',
  });
  await day.focus();
  await page.keyboard.press('Backspace');
  await expect(day).toHaveText('ηη');
});
