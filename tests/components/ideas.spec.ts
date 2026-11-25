/**
 * From the ideas board: password strength, loader, marquee, animated buttons.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

test('password strength: rules, level, show/hide and validity', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'password-strength');
  const root = page.locator('[data-bootcn-password]');
  const input = page.getByLabel('Password', { exact: true });
  await expect(root).toHaveAttribute('data-level', '0');
  await expect(input).toHaveAccessibleDescription(/Strength: too weak/);

  await input.fill('abc');
  await expect(root).toHaveAttribute('data-level', '1');
  await input.fill('Bootcn2026');
  await expect(root).toHaveAttribute('data-level', '3');
  await expect(page.locator('[data-rule="symbol"]')).toHaveAttribute('data-met', 'false');
  await expect(page.locator('[data-rule="symbol"]')).toContainText('(not yet)');
  expect(await input.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
  await expect(page.locator('[data-bootcn-password-status]')).toHaveText('Strength: good');

  await input.fill('Bootcn2026!');
  await expect(root).toHaveAttribute('data-level', '4');
  await expect(page.locator('[data-bootcn-password-strength]')).toHaveText('Strength: strong');
  expect(await input.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(true);

  const toggle = page.getByRole('button', { name: 'Show password' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(input).toHaveAttribute('type', 'text');
  await expectNoAxeViolations(page);
  expect(errors).toEqual([]);
});

test('loader: each loader is a named status; still under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPreview(page, 'loader');
  await expect(page.getByRole('status')).toHaveCount(5);
  await expect(page.getByRole('status').filter({ hasText: 'Thinking…' })).toBeVisible();
  const animation = await page
    .locator('.bootcn-loader__dot')
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe('none');
});

test('marquee: pauses with its button, the copy is hidden', async ({ page }) => {
  await openPreview(page, 'marquee');
  const region = page.getByRole('region', { name: 'Customers' });
  await expect(region.getByRole('listitem')).toHaveCount(6);
  const pause = region.getByRole('button', { name: 'Pause' });
  await pause.click();
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  await expect(region).toHaveClass(/is-paused/);
  const state = await region
    .locator('.bootcn-marquee__group')
    .first()
    .evaluate((el) => getComputedStyle(el).animationPlayState);
  expect(state).toBe('paused');
  await expectNoAxeViolations(page);
});

test('marquee: stands still and wraps under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPreview(page, 'marquee');
  const region = page.getByRole('region', { name: 'Customers' });
  await expect(region.getByRole('button', { name: 'Pause' })).toBeHidden();
  await expect(region.locator('.bootcn-marquee__group').nth(1)).toBeHidden();
});

test('animated button: ripple on click, none under reduced motion', async ({ page }) => {
  await openPreview(page, 'animated-button');
  const button = page.getByRole('button', { name: 'Ripple' });
  await button.click();
  await expect(button.locator('.bootcn-ripple')).toHaveCount(1);
  await expect(button.locator('.bootcn-ripple')).toHaveCount(0);
  await expectNoAxeViolations(page);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await button.click();
  await expect(button.locator('.bootcn-ripple')).toHaveCount(0);
});
