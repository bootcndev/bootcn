/**
 * iOS-style set: segmented control, action sheet, grouped list.
 */
import { expect, test } from '@playwright/test';

import {
  expectNoAxeViolations,
  expectNoAxeViolationsOnOverlay,
  openPreview,
  settleTransitions,
} from './helpers.js';

test('segmented control: native radios with arrow keys', async ({ page }) => {
  await openPreview(page, 'segmented-control');
  const group = page.getByRole('group', { name: 'Period' });
  await expect(group.getByRole('radio', { name: 'Week' })).toBeChecked();
  await group.getByRole('radio', { name: 'Week' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(group.getByRole('radio', { name: 'Month' })).toBeChecked();
  await expectNoAxeViolations(page);
});

test('action sheet: a dialog from the bottom, Escape returns focus', async ({
  page,
  browserName,
}) => {
  await openPreview(page, 'action-sheet');
  const trigger = page.getByRole('button', { name: 'Share photo' });
  await trigger.click();
  const sheet = page.getByRole('dialog', { name: 'Share photo' });
  await expect(sheet).toBeVisible();
  await settleTransitions(page);
  await expect(sheet.getByRole('button', { name: 'Delete photo' })).toBeVisible();
  await expectNoAxeViolationsOnOverlay(page, browserName);
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('grouped list: labelled groups, links with values, real switches', async ({ page }) => {
  await openPreview(page, 'grouped-list');
  await expect(
    page.getByRole('region', { name: 'Connectivity' }).getByRole('listitem'),
  ).toHaveCount(3);
  await expect(page.getByRole('link', { name: /Wi-Fi\s+Office 5G/ })).toBeVisible();
  const dark = page.getByRole('switch', { name: 'Dark mode' });
  await expect(dark).toBeChecked();
  await dark.click();
  await expect(dark).not.toBeChecked();
  await expectNoAxeViolations(page);
});
