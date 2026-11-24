/**
 * Behaviour of the phase A components (keyboard, focus, ARIA state). The
 * generic preview checks (axe in both themes, overflow, console) run in
 * previews.spec.ts.
 */
import { expect, test } from '@playwright/test';

import {
  collectErrors,
  expectNoAxeViolations,
  expectNoAxeViolationsOnOverlay,
  openPreview,
  settleTransitions,
} from './helpers.js';

// Bootstrap appends floating overlays to <body>, outside the page landmarks.
const FLOATING = { disableRules: ['region'] };

test('alert: the dismissible alert closes', async ({ page }) => {
  await openPreview(page, 'alert');
  const alert = page.locator('.alert-dismissible');
  await alert.getByRole('button', { name: 'Dismiss' }).click();
  await expect(alert).toHaveCount(0);
});

test('alert dialog: alertdialog role, Cancel focused, backdrop does not close it', async ({
  page,
  browserName,
}) => {
  const errors = collectErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPreview(page, 'alert-dialog');
  const trigger = page.getByRole('button', { name: 'Delete account' });
  await trigger.click();
  const dialog = page.getByRole('alertdialog', { name: 'Delete your account?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription(/permanently deletes/);
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await expectNoAxeViolationsOnOverlay(page, browserName);

  await page.mouse.click(5, 5); // the static backdrop
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});

test('collapsible: the trigger expands the hidden items', async ({ page }) => {
  await openPreview(page, 'collapsible');
  const trigger = page.getByRole('button', { name: 'Show all invoices' });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByText('Invoice #1041')).toBeHidden();
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Invoice #1041')).toBeVisible();
});

test.describe('hover card', () => {
  test('opens on hover, stays open over the card, closes with Escape', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'hover-card');
    const trigger = page.getByRole('link', { name: '@acme' });
    const card = page.locator('.popover.bootcn-hover-card');

    await trigger.hover();
    await expect(card).toBeVisible();
    await expect(card).toContainText('Open-source tools');
    await expect(trigger).toHaveAccessibleDescription(/Open-source tools/);
    await settleTransitions(page);
    await expectNoAxeViolations(page, FLOATING);

    await card.hover(); // WCAG 1.4.13: hoverable
    await page.waitForTimeout(400);
    await expect(card).toBeVisible();

    await page.keyboard.press('Escape'); // WCAG 1.4.13: dismissible
    await expect(card).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('opens on keyboard focus and closes on blur', async ({ page }) => {
    await openPreview(page, 'hover-card');
    const trigger = page.getByRole('link', { name: '@acme' });
    await trigger.focus();
    await expect(page.locator('.popover.bootcn-hover-card')).toBeVisible();
    await trigger.blur();
    await expect(page.locator('.popover.bootcn-hover-card')).toBeHidden();
  });
});

test('slider: keyboard changes the value, the output and the fill', async ({ page }) => {
  await openPreview(page, 'slider');
  const slider = page.getByRole('slider', { name: 'Volume' });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('51');
  await expect(page.locator('output[for="bootcn-slider-volume"]')).toHaveText('51');
  expect(await slider.evaluate((el) => el.style.getPropertyValue('--bootcn-slider-fill'))).toBe(
    '51%',
  );

  const price = page.getByRole('slider', { name: 'Maximum price' });
  await price.focus();
  await page.keyboard.press('End');
  await expect(page.locator('output[for="bootcn-slider-price"]')).toHaveText('€500');
});

test('toggle and toggle group: native checkbox and radio behaviour', async ({ page }) => {
  await openPreview(page, 'toggle-group');
  const bold = page.getByRole('checkbox', { name: 'Bold' });
  await bold.focus();
  await page.keyboard.press('Space');
  await expect(bold).toBeChecked();

  const left = page.getByRole('radio', { name: 'Align left' });
  await left.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Align center' })).toBeChecked();
  await expect(page.getByRole('group', { name: 'Text formatting' })).toBeVisible();
});

for (const [name, button, title] of [
  ['sheet', 'Edit profile', 'Edit profile'],
  ['drawer', 'Set a goal', 'Daily goal'],
] as const) {
  test(`${name}: opens as a modal dialog, closes with Escape, returns focus`, async ({
    page,
    browserName,
  }) => {
    const errors = collectErrors(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openPreview(page, name);
    const trigger = page.getByRole('button', { name: button });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: title });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expectNoAxeViolationsOnOverlay(page, browserName);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(errors).toEqual([]);
  });
}

test('navigation: breadcrumb and pagination mark the current page', async ({ page }) => {
  await openPreview(page, 'breadcrumb');
  await expect(page.locator('[aria-current="page"]')).toHaveText('Breadcrumb');
  await openPreview(page, 'pagination');
  await expect(page.getByRole('link', { name: '2', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('link', { name: 'Next page' })).toBeVisible();
});

test('progress: native element with value, and indeterminate', async ({ page }) => {
  await openPreview(page, 'progress');
  await expect(page.getByRole('progressbar', { name: 'Uploading report.pdf' })).toHaveAttribute(
    'value',
    '60',
  );
  const sync = page.getByRole('progressbar', { name: 'Syncing contacts' });
  expect(await sync.evaluate((el) => (el as HTMLProgressElement).position)).toBe(-1);
});
