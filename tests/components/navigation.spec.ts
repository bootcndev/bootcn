import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('tabs: click and arrow keys switch panels', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'tabs');
  const list = page.getByRole('tablist', { name: 'Account settings' }).first();
  const account = list.getByRole('tab', { name: 'Account' });
  const password = list.getByRole('tab', { name: 'Password' });

  await expect(account).toHaveAttribute('aria-selected', 'true');
  await password.click();
  await expect(password).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#bootcn-tabpanel-password')).toBeVisible();
  await expect(page.locator('#bootcn-tabpanel-account')).toBeHidden();

  await page.keyboard.press('ArrowRight');
  const team = list.getByRole('tab', { name: 'Team' });
  await expect(team).toBeFocused();
  await expect(team).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#bootcn-tabpanel-team')).toBeVisible();

  await page.keyboard.press('ArrowLeft');
  await expect(password).toBeFocused();
  expect(errors).toEqual([]);
});

test('accordion: one section open at a time, toggled by keyboard', async ({ page }) => {
  await openPreview(page, 'accordion');
  const first = page.locator('#bootcn-accordion-faq button.accordion-button').nth(0);
  const second = page.locator('#bootcn-accordion-faq button.accordion-button').nth(1);

  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await second.focus();
  await page.keyboard.press('Enter');
  await expect(second).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#bootcn-accordion-faq-two')).toBeVisible();
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#bootcn-accordion-faq-one')).toBeHidden();
});

test('dropdown: opens, arrow keys move, Escape closes and restores focus', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'dropdown');
  const trigger = page.locator('#bootcn-dropdown-trigger');
  const menu = page.locator('#bootcn-dropdown-trigger + .dropdown-menu');

  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toBeVisible();
  await expectNoAxeViolations(page);

  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('link', { name: /Profile/ })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('link', { name: /Settings/ })).toBeFocused();
  // Disabled items are skipped.
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('button', { name: 'Sign out' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});
