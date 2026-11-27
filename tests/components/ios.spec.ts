/**
 * iOS-style set: segmented control, action sheet, grouped list.
 */
import { expect, test } from '@playwright/test';

import {
  expectNoAxeViolations,
  expectNoAxeViolationsExceptFirefox,
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

test('grouped list: labelled groups, links with values, real switches', async ({
  page,
  browserName,
}) => {
  await openPreview(page, 'grouped-list');
  await expect(
    page.getByRole('region', { name: 'Connectivity' }).getByRole('listitem'),
  ).toHaveCount(3);
  await expect(page.getByRole('link', { name: /Wi-Fi\s+Office 5G/ })).toBeVisible();
  const dark = page.getByRole('switch', { name: 'Dark mode' });
  await expect(dark).toBeChecked();
  await dark.click();
  await expect(dark).not.toBeChecked();
  await expectNoAxeViolationsExceptFirefox(
    page,
    browserName,
    'axe crashes this page in Firefox on CI; covered in Chromium and WebKit',
  );
});

test('tab bar: a named navigation with the current page and a badge', async ({ page }) => {
  await openPreview(page, 'tab-bar');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link')).toHaveCount(4);
  await expect(nav.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Activity 3 new' })).toBeVisible();
  await expectNoAxeViolations(page);
});

test('swipe actions: drag, keyboard and remove', async ({ page }) => {
  await openPreview(page, 'swipe-actions');
  const list = page.getByRole('list', { name: 'Inbox' });
  const rows = list.locator('.bootcn-swipe');
  await expect(rows).toHaveCount(4);
  await expect(list).toHaveClass(/is-ready/);

  // Drag the first row towards the start: the trailing actions open.
  const box = (await rows.nth(0).boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width - 20, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 120, y, { steps: 6 });
  await page.mouse.move(box.x + box.width - 200, y, { steps: 6 });
  await page.mouse.up();
  await expect(rows.nth(0)).toHaveAttribute('data-swipe-open', 'trailing');

  // Keyboard: Tab from the second message reaches its actions.
  const second = rows.nth(1).getByRole('link');
  await second.focus();
  await expect(rows.nth(0)).not.toHaveAttribute('data-swipe-open', /.+/);
  await page.keyboard.press('Tab');
  await expect(rows.nth(1).getByRole('button', { name: 'Mark as read' })).toBeFocused();
  await expect(rows.nth(1)).toHaveAttribute('data-swipe-open', 'leading');
  await page.keyboard.press('Escape');
  await expect(second).toBeFocused();
  await expect(rows.nth(1)).not.toHaveAttribute('data-swipe-open', /.+/);

  // Delete removes the row, says so and keeps focus in the list.
  await rows.nth(1).getByRole('button', { name: 'Delete' }).focus();
  await page.keyboard.press('Enter');
  await expect(rows).toHaveCount(3);
  await expect(page.getByRole('status')).toHaveText('Removed');
  await expect(rows.nth(1).getByRole('link')).toBeFocused();
  await expectNoAxeViolations(page);
});

test('large title: collapses into the bar when it scrolls away', async ({ page }) => {
  await openPreview(page, 'large-title');
  const header = page.locator('[data-bootcn-large-title]');
  await expect(page.getByRole('heading', { name: 'Reminders' })).toBeVisible();
  await expect(header).not.toHaveClass(/is-collapsed/);
  await page.evaluate(() => {
    document.querySelector('.bootcn-large-title-demo')!.scrollTop = 200;
  });
  await expect(header).toHaveClass(/is-collapsed/);
  await page.evaluate(() => {
    document.querySelector('.bootcn-large-title-demo')!.scrollTop = 0;
  });
  await expect(header).not.toHaveClass(/is-collapsed/);
  await expectNoAxeViolations(page);
});
