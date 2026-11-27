/**
 * Event calendar block: month, week and day views, the form, the popover.
 */
import { expect, test } from '@playwright/test';

import { expectNoAxeViolations, openPreview } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openPreview(page, 'event-calendar', 'blocks');
});

test('month: Monday first, today, keyboard between days, more events', async ({ page }) => {
  const cal = page.locator('[data-bootcn-event-calendar]');
  await expect(cal.getByRole('heading', { name: 'December 2026' })).toBeVisible();
  await expect(cal.locator('thead th').first()).toHaveText('Mon');
  const today = cal.getByRole('button', { name: /Thursday, December 10, 2026, 5 events/ });
  await expect(today).toHaveAttribute('aria-current', 'date');
  await expect(cal.getByRole('button', { name: '+2 more' })).toBeVisible();
  await expectNoAxeViolations(page);

  await today.focus();
  await page.keyboard.press('ArrowDown');
  await expect(cal.getByRole('button', { name: /Thursday, December 17, 2026/ })).toBeFocused();
  await page.keyboard.press('PageDown');
  await expect(cal.getByRole('heading', { name: 'January 2027' })).toBeVisible();
  await expect(cal.getByRole('button', { name: /Sunday, January 17, 2027/ })).toBeFocused();
  await page.keyboard.press('t');
  await expect(cal.getByRole('heading', { name: 'December 2026' })).toBeVisible();

  await cal.getByRole('button', { name: 'Next month' }).click();
  await expect(cal.getByRole('heading', { name: 'January 2027' })).toBeVisible();
  await cal.getByRole('button', { name: 'Today' }).click();
  await expect(cal.getByRole('heading', { name: 'December 2026' })).toBeVisible();
});

test('week: hours, overlaps side by side, calendars can be hidden', async ({ page }) => {
  const cal = page.locator('[data-bootcn-event-calendar]');
  await cal.getByRole('button', { name: 'Week', exact: true }).click();
  await expect(cal.getByRole('button', { name: 'Week', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(cal.getByRole('heading', { name: /Dec 7\s*–\s*13, 2026/ })).toBeVisible();
  const review = cal.getByRole('button', {
    name: /Design review\s*, Thursday, December 10, 10:00\s?AM – 11:00\s?AM, Work$/,
  });
  const interview = cal.getByRole('button', { name: /Interview: product designer/ });
  const a = (await review.boundingBox())!;
  const b = (await interview.boundingBox())!;
  expect(b.x).toBeGreaterThan(a.x + a.width / 2);
  await expectNoAxeViolations(page);

  await cal.getByRole('checkbox', { name: 'Personal' }).uncheck();
  await expect(cal.getByRole('button', { name: /Lunch with Marco/ })).toHaveCount(0);
  await cal.getByRole('checkbox', { name: 'Personal' }).check();
  await expect(cal.getByRole('button', { name: /Lunch with Marco/ })).toHaveCount(1);
});

test('add, check, open, edit and delete an event', async ({ page }) => {
  const cal = page.locator('[data-bootcn-event-calendar]');
  await cal.getByRole('button', { name: 'New event' }).click();
  const dialog = page.getByRole('dialog', { name: 'New event' });
  await expect(dialog.getByLabel('Title')).toBeFocused();
  await dialog.getByLabel('Ends').fill('08:00');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog.getByText('Give the event a title.')).toBeVisible();
  await expect(dialog.getByText('End after it starts.')).toBeVisible();
  await dialog.getByLabel('Title').fill('Planning lunch');
  await dialog.getByLabel('Date').fill('2026-12-14');
  await dialog.getByLabel('Starts').fill('12:00');
  await dialog.getByLabel('Ends').fill('13:00');
  await dialog.getByLabel('Calendar').selectOption('team');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();
  await expect(cal.getByRole('status')).toHaveText('Added: Planning lunch');
  const event = cal.getByRole('button', { name: /Planning lunch\s*, Monday, December 14/ });
  await expect(event).toBeFocused();

  await event.click();
  const pop = cal.getByRole('dialog', { name: 'Planning lunch' });
  await expect(pop).toBeVisible();
  await expect(pop).toContainText('Team');
  await page.keyboard.press('Escape');
  await expect(pop).toBeHidden();
  await expect(event).toBeFocused();

  await event.click();
  await pop.getByRole('button', { name: 'Edit' }).click();
  const edit = page.getByRole('dialog', { name: 'Edit event' });
  await edit.getByLabel('Title').fill('Planning lunch (moved)');
  await edit.getByRole('button', { name: 'Save' }).click();
  await expect(cal.getByRole('status')).toHaveText('Saved: Planning lunch (moved)');

  await cal.getByRole('button', { name: /Planning lunch \(moved\)/ }).click();
  await cal
    .getByRole('dialog', { name: 'Planning lunch (moved)' })
    .getByRole('button', { name: 'Delete' })
    .click();
  await expect(cal.getByRole('status')).toHaveText('Deleted: Planning lunch (moved)');
  await expect(cal.getByRole('button', { name: /Planning lunch/ })).toHaveCount(0);
});

test('narrow: dots instead of titles in the month', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  const cal = page.locator('[data-bootcn-event-calendar]');
  await expect(cal.locator('.bootcn-event-calendar__chips').first()).toBeHidden();
  await expect(
    cal.locator('.bootcn-event-calendar__day.is-today .bootcn-event-calendar__dots span'),
  ).toHaveCount(4);
});
