/**
 * Right to left: logical CSS properties, mirrored directional icons and
 * arrow keys that follow the reading direction.
 */
import { expect, test } from '@playwright/test';

import { openPreview } from './helpers.js';

test('the sidebar border and spacing follow the reading direction', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openPreview(page, 'sidebar-groups', 'blocks', '?dir=rtl');
  const sidebar = page.locator('.bootcn-sidebar-groups__sidebar, aside').first();
  const borders = await sidebar.evaluate((el) => {
    const style = getComputedStyle(el);
    return { left: style.borderLeftWidth, right: style.borderRightWidth };
  });
  expect(borders.left).not.toBe('0px');
  expect(borders.right).toBe('0px');
  // The sidebar is on the right.
  const box = (await sidebar.boundingBox())!;
  expect(box.x + box.width).toBeGreaterThan(1200);
});

test('directional icons are mirrored, others are not', async ({ page }) => {
  await openPreview(page, 'pagination', 'components', '?dir=rtl');
  const flipped = page.locator('.bootcn-rtl-flip').first();
  await expect(flipped).toHaveCSS('scale', '-1 1');
  await openPreview(page, 'pagination');
  await expect(page.locator('.bootcn-rtl-flip').first()).toHaveCSS('scale', 'none');
});

test('toolbar: ArrowLeft moves forward right to left', async ({ page }) => {
  await openPreview(page, 'toolbar', 'components', '?dir=rtl');
  const toolbar = page.getByRole('toolbar').first();
  const first = toolbar.locator('[tabindex="0"]').first();
  await first.focus();
  const before = await first.evaluate((el) => el.getAttribute('aria-label') ?? el.textContent);
  await page.keyboard.press('ArrowLeft');
  const after = await page.evaluate(
    () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent,
  );
  expect(after).not.toBe(before);
  // ArrowRight goes back.
  await page.keyboard.press('ArrowRight');
  await expect(first).toBeFocused();
});

test('calendar: ArrowLeft is the next day right to left', async ({ page }) => {
  await openPreview(page, 'calendar', 'components', '?dir=rtl');
  const day = page.locator('.bootcn-calendar__day[tabindex="0"]').first();
  const date = await day.getAttribute('data-date');
  await day.focus();
  await page.keyboard.press('ArrowLeft');
  const next = await page.evaluate(() => document.activeElement?.getAttribute('data-date'));
  const expected = new Date(`${date}T12:00:00`);
  expected.setDate(expected.getDate() + 1);
  expect(next).toBe(
    `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, '0')}-${String(expected.getDate()).padStart(2, '0')}`,
  );
});
