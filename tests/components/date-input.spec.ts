/**
 * Date input: segmented date and time fields (spinbuttons) over a native
 * input, ordered by locale.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

test('segments follow the locale and keep the ISO value', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'date-input');
  const birth = page.getByRole('group', { name: 'Date of birth' });
  await expect(birth.getByRole('spinbutton')).toHaveText(['17', '05', '1990']);
  await expect(birth.getByRole('spinbutton', { name: 'month' })).toHaveAttribute(
    'aria-valuetext',
    '5 – May',
  );
  const meeting = page.getByRole('group', { name: 'Meeting' });
  await expect(meeting.getByRole('spinbutton')).toHaveText(['11', '24', '2026', '02', '30', 'PM']);
  await expect(page.locator('input[name="birthday"]')).toHaveValue('1990-05-17');
  await expect(page.locator('input[name="birthday"]')).toHaveAttribute('type', 'hidden');
  await expectNoAxeViolations(page);
  expect(errors).toEqual([]);
});

test('arrows, typing, Backspace and moving between segments', async ({ page }) => {
  await openPreview(page, 'date-input');
  const group = page.getByRole('group', { name: 'Date of birth' });
  const day = group.getByRole('spinbutton', { name: 'day' });
  const value = page.locator('input[name="birthday"]');
  await day.focus();
  await page.keyboard.press('ArrowUp');
  await expect(day).toHaveText('18');
  await expect(value).toHaveValue('1990-05-18');

  // Typing "3", "1" sets 31 and moves on to the month.
  await day.focus();
  await page.keyboard.type('31');
  await expect(day).toHaveText('31');
  await expect(group.getByRole('spinbutton', { name: 'month' })).toBeFocused();
  // February constrains the day.
  await page.keyboard.type('02');
  await expect(day).toHaveText('28');
  await expect(group.getByRole('spinbutton', { name: 'year' })).toBeFocused();

  // Backspace empties the segment and the value.
  await page.keyboard.press('Backspace');
  await expect(group.getByRole('spinbutton', { name: 'year' })).toHaveText('yyyy');
  await expect(group.getByRole('spinbutton', { name: 'year' })).toHaveAttribute(
    'aria-valuetext',
    'Empty',
  );
  await expect(value).toHaveValue('');
  await page.keyboard.type('1985');
  await expect(value).toHaveValue('1985-02-28');

  await page.keyboard.press('ArrowLeft');
  await expect(group.getByRole('spinbutton', { name: 'month' })).toBeFocused();
});

test('minute steps, AM/PM and out-of-range values', async ({ page }) => {
  await openPreview(page, 'date-input');
  const opens = page.getByRole('group', { name: 'Opening time' });
  const minute = opens.getByRole('spinbutton', { name: 'minute' });
  await minute.focus();
  await page.keyboard.press('ArrowUp');
  await expect(minute).toHaveText('45');
  await expect(page.locator('input[name="opens"]')).toHaveValue('09:45');

  const meeting = page.getByRole('group', { name: 'Meeting' });
  const period = meeting.getByRole('spinbutton', { name: 'AM/PM' });
  await period.focus();
  await page.keyboard.press('a');
  await expect(page.locator('input[name="meeting"]')).toHaveValue('2026-11-24T02:30');
  await period.focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('input[name="meeting"]')).toHaveValue('2026-11-24T14:30');

  // max is 2026-12-31: 2027 is out of range.
  const birth = page.getByRole('group', { name: 'Date of birth' });
  const year = birth.getByRole('spinbutton', { name: 'year' });
  await year.focus();
  await page.keyboard.type('2027');
  await expect(year).toHaveAttribute('aria-invalid', 'true');
  await expect(birth).toHaveAccessibleDescription(/Choose a value in range\./);
});

test('the label focuses the first segment', async ({ page }) => {
  await openPreview(page, 'date-input');
  await page.getByText('Opening time').click();
  await expect(
    page.getByRole('group', { name: 'Opening time' }).getByRole('spinbutton', { name: 'hour' }),
  ).toBeFocused();
});
