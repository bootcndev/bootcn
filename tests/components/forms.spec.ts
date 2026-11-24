import { expect, test } from '@playwright/test';

import { openPreview } from './helpers.js';

test('radio card: clicking anywhere on the card selects it', async ({ page }) => {
  await openPreview(page, 'radio-group');
  const team = page.locator('#bootcn-plan-team');
  await expect(team).not.toBeChecked();
  await page.locator('#bootcn-plan-team-description').click();
  await expect(team).toBeChecked();
  await expect(page.locator('#bootcn-plan-starter')).not.toBeChecked();
});

test('radio group: arrow keys move the selection', async ({ page }) => {
  await openPreview(page, 'radio-group');
  await page.locator('#bootcn-notify-all').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#bootcn-notify-mentions')).toBeChecked();
});

test('switch: toggles with Space and exposes the switch role', async ({ page }) => {
  await openPreview(page, 'switch');
  const marketing = page.getByRole('switch', { name: 'Marketing emails' }).first();
  await expect(marketing).not.toBeChecked();
  await marketing.focus();
  await page.keyboard.press('Space');
  await expect(marketing).toBeChecked();
});

test('checkbox: the label toggles the input', async ({ page }) => {
  await openPreview(page, 'checkbox');
  await page.getByText('Accept terms and conditions').first().click();
  await expect(page.locator('#bootcn-checkbox-terms')).toBeChecked();
});
