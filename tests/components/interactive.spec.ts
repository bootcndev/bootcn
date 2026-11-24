/**
 * Behaviour of the phase B components: keyboard patterns from the WAI-ARIA
 * Authoring Practices, selection state and events.
 */
import { expect, test } from '@playwright/test';

import {
  collectErrors,
  expectNoAxeViolations,
  expectNoAxeViolationsOnOverlay,
  openPreview,
} from './helpers.js';

test.describe('combobox', () => {
  test('single choice: filter, choose with the keyboard, Escape closes', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'combobox');
    const input = page.getByRole('combobox', { name: 'Framework' });
    const listbox = page.getByRole('listbox', { name: 'Framework' });
    await expect(input).toHaveValue('Laravel');

    await input.fill('dja');
    await expect(listbox).toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(listbox.getByRole('option')).toHaveText(['Django']);
    await expect(page.locator('[data-bootcn-combobox-status]').first()).toHaveText('1 result.');
    await expect(input).toHaveAttribute(
      'aria-activedescendant',
      'bootcn-combobox-framework-django',
    );
    await expectNoAxeViolations(page);

    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Django');
    await expect(listbox).toBeHidden();
    await expect(page.locator('input[name="framework"]')).toHaveValue('django');

    await page.keyboard.press('ArrowDown');
    await expect(listbox).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(listbox).toBeHidden();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(errors).toEqual([]);
  });

  test('multiple choice: chips, Backspace and remove buttons', async ({ page }) => {
    await openPreview(page, 'combobox');
    const input = page.getByRole('combobox', { name: 'Your stack' });
    const values = page.locator('input[name="stack[]"]');
    await expect(values).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Remove Astro' })).toBeVisible();

    await input.fill('fla');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Remove Flask' })).toBeVisible();
    await expect(page.getByRole('listbox', { name: 'Your stack' })).toBeVisible();
    await expect(values).toHaveCount(3);

    await page.keyboard.press('Backspace');
    await expect(page.getByRole('button', { name: 'Remove Flask' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Remove Astro' }).click();
    await expect(values).toHaveCount(1);
    await expect(values).toHaveValue('django');
  });
});

test.describe('command', () => {
  test('filters groups, moves with arrows and selects with Enter', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'command');
    const inline = page.locator('[data-bootcn-command]').first();
    const input = inline.getByRole('combobox', { name: 'Search commands' });
    const events: string[] = [];
    await page.exposeFunction('recordCommand', (value: string) => events.push(value));
    await page.evaluate(() =>
      document.addEventListener('bootcn:command:select', (event) =>
        (window as unknown as { recordCommand: (v: string) => void }).recordCommand(
          (event as CustomEvent<{ value: string }>).detail.value,
        ),
      ),
    );

    await input.fill('bil');
    await expect(inline.getByRole('option')).toHaveCount(1);
    await expect(inline.getByRole('option')).toHaveAccessibleName(/Billing/);
    await expect(inline.getByRole('group', { name: 'Suggestions' })).toBeHidden();
    await page.keyboard.press('Enter');
    expect(events).toEqual(['billing']);

    await input.fill('');
    await input.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', 'bootcn-command-inline-emoji');
    await input.fill('zzz');
    await expect(inline.getByText('No results found.')).toBeVisible();
    await expectNoAxeViolations(page);
    expect(errors).toEqual([]);
  });

  test('Ctrl+K opens the palette with the search focused', async ({ page }) => {
    await openPreview(page, 'command');
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Command palette' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: 'Search commands' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});

test('context menu: right-click and Shift+F10, arrows, typeahead, Escape', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'context-menu');
  const target = page.getByRole('button', { name: 'report.pdf' });
  const menu = page.getByRole('menu', { name: 'File actions' });

  await target.click({ button: 'right' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: /Open/ })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: /Rename/ })).toBeFocused();
  await page.keyboard.press('d');
  await expect(menu.getByRole('menuitem', { name: /Duplicate/ })).toBeFocused();
  await expectNoAxeViolations(page);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(target).toBeFocused();

  await page.keyboard.press('Shift+F10');
  await expect(menu).toBeVisible();
  await expect(target).toHaveAttribute('aria-expanded', 'true');
  await menu.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(menu).toBeHidden();
  expect(errors).toEqual([]);
});

test('menubar: one tab stop, arrows between menus, checkable items', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'menubar');
  const file = page.getByRole('menuitem', { name: 'File' });
  const edit = page.getByRole('menuitem', { name: 'Edit' });
  const view = page.getByRole('menuitem', { name: 'View' });

  await file.focus();
  await page.keyboard.press('ArrowRight');
  await expect(edit).toBeFocused();
  await expect(edit).toHaveAttribute('tabindex', '0');
  await expect(file).toHaveAttribute('tabindex', '-1');

  await page.keyboard.press('ArrowDown');
  await expect(edit).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('menuitem', { name: 'Undo' })).toBeFocused();
  await expectNoAxeViolations(page);

  await page.keyboard.press('ArrowRight');
  await expect(view).toHaveAttribute('aria-expanded', 'true');
  const bookmarks = page.getByRole('menuitemcheckbox', { name: 'Show bookmarks bar' });
  await expect(bookmarks).toBeFocused();
  await page.keyboard.press('Enter');
  // The menu closes on activation, so check the (now hidden) item by selector.
  await expect(page.locator('.bootcn-menubar__check').first()).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(view).toBeFocused();
  await expect(view).toHaveAttribute('aria-expanded', 'false');

  await file.click();
  await expect(page.getByRole('menu', { name: 'File' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu', { name: 'File' })).toBeHidden();
  expect(errors).toEqual([]);
});

test('navigation menu: panels open from buttons, Escape returns focus', async ({ page }) => {
  const errors = collectErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPreview(page, 'navigation-menu');
  const trigger = page.getByRole('button', { name: 'Components' });
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const link = page.getByRole('link', { name: /Hover card/ });
  await expect(link).toBeVisible();
  await expectNoAxeViolations(page);
  await link.focus();
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});

test('carousel: next and previous change the labelled slide', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPreview(page, 'carousel');
  const carousel = page.locator('section[aria-roledescription="carousel"]');
  await expect(carousel).toHaveAccessibleName('Featured numbers');
  await expect(carousel.locator('.carousel-item.active')).toHaveAttribute('aria-label', '1 of 5');
  await page.getByRole('button', { name: 'Next slide' }).click();
  await expect(carousel.locator('.carousel-item.active')).toHaveAttribute('aria-label', '2 of 5');
  await page.getByRole('button', { name: 'Previous slide' }).click();
  await expect(carousel.locator('.carousel-item.active')).toHaveAttribute('aria-label', '1 of 5');
  await expect(carousel.locator('.carousel-inner')).toHaveAttribute('aria-live', 'polite');
});

test('input OTP: one input, digits only, slots mirror it, complete event', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'input-otp');
  const input = page.getByRole('textbox', { name: 'Verification code' });
  await expect(input).toHaveAccessibleDescription(/6-digit code/);
  await expect(input).toHaveAttribute('autocomplete', 'one-time-code');
  await page.evaluate(() => {
    document.addEventListener('bootcn:otp:complete', (event) => {
      document.body.dataset.otp = (event as CustomEvent<{ value: string }>).detail.value;
    });
  });

  await input.click();
  await page.keyboard.type('12a3');
  await expect(input).toHaveValue('123');
  await expect(page.locator('.bootcn-otp__slot')).toHaveText(['1', '2', '3', '', '', '']);
  await expect(page.locator('.bootcn-otp__slot.is-active')).toHaveCount(1);
  await expectNoAxeViolations(page);

  // Select all, then type over it: the selection is replaced, not appended to.
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('55');
  await expect(input).toHaveValue('55');

  await input.fill('987654'); // paste or SMS autofill fills every slot at once
  await expect(page.locator('.bootcn-otp__slot')).toHaveText(['9', '8', '7', '6', '5', '4']);
  await expect(page.locator('body')).toHaveAttribute('data-otp', '987654');
  expect(errors).toEqual([]);
});

test('resizable: keyboard and pointer resize the controlled panel', async ({ page }) => {
  await openPreview(page, 'resizable');
  const handle = page.getByRole('separator', { name: 'Resize sidebar' });
  const panel = page.locator('#bootcn-resizable-sidebar');
  await handle.focus();
  await page.keyboard.press('ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuenow', '55');
  expect(await panel.evaluate((el) => el.style.flexBasis)).toBe('55%');
  await page.keyboard.press('End');
  await expect(handle).toHaveAttribute('aria-valuenow', '80');
  await page.keyboard.press('Home');
  await expect(handle).toHaveAttribute('aria-valuenow', '20');

  const vertical = page.getByRole('separator', { name: 'Resize header' });
  await vertical.focus();
  await page.keyboard.press('ArrowDown');
  await expect(vertical).toHaveAttribute('aria-valuenow', '35');

  const group = await page.locator('[data-bootcn-resizable]').first().boundingBox();
  const box = await handle.boundingBox();
  if (!group || !box) throw new Error('no layout');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(group.x + group.width * 0.6, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(handle).toHaveAttribute('aria-valuenow', '60');
});

test.describe('calendar and date picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-24T10:00:00'));
  });

  test('calendar: grid keyboard navigation, limits and selection', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'calendar');
    const grid = page.getByRole('grid', { name: 'November 2026' });
    await expect(grid).toBeVisible();
    // Weeks start on Monday unless data-week-start says otherwise.
    await expect(grid.getByRole('columnheader').first()).toHaveAttribute('abbr', 'Monday');
    const day = (name: string) => page.getByRole('button', { name, exact: true });
    await expect(day('Tuesday, November 24, 2026')).toHaveAttribute('aria-current', 'date');
    await expect(page.locator('td[aria-selected="true"]')).toHaveText('24');
    await expectNoAxeViolations(page);

    await day('Tuesday, November 24, 2026').focus();
    await page.keyboard.press('ArrowRight');
    await expect(day('Wednesday, November 25, 2026')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(day('Wednesday, December 2, 2026')).toBeFocused();
    await expect(page.getByRole('grid', { name: 'December 2026' })).toBeVisible();
    await page.keyboard.press('PageUp');
    await expect(day('Monday, November 2, 2026')).toBeFocused();
    await page.keyboard.press('End');
    await expect(day('Sunday, November 8, 2026')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('input[name="date"]')).toHaveValue('2026-11-08');
    await expect(page.locator('td[aria-selected="true"]')).toHaveText('8');

    // data-min="2026-01-01": a year back stops at the limit.
    await page.keyboard.press('Shift+PageUp');
    await expect(day('Thursday, January 1, 2026')).toBeFocused();

    await page.getByRole('button', { name: 'Next month' }).click();
    await expect(page.getByRole('grid', { name: 'February 2026' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('date picker: opens on today, picks a date, returns focus', async ({
    page,
    browserName,
  }) => {
    const errors = collectErrors(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openPreview(page, 'date-picker');
    const trigger = page.getByRole('button', { name: 'Delivery date Pick a date' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Choose a delivery date' });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tuesday, November 24, 2026' })).toBeFocused();
    await expectNoAxeViolationsOnOverlay(page, browserName);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    const chosen = page.getByRole('button', { name: 'Delivery date November 25, 2026' });
    await expect(chosen).toBeFocused();
    await expect(page.locator('input[name="delivery"]')).toHaveValue('2026-11-25');

    await chosen.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(errors).toEqual([]);
  });
});

test('data table: paging, sorting, filtering and selection', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'data-table');
  const status = page.locator('[data-bootcn-data-table-status]');
  const selection = page.locator('[data-bootcn-data-table-selection]');
  const rows = page.locator('tbody tr:not([hidden])');
  const previous = page.getByRole('button', { name: 'Previous' });
  const next = page.getByRole('button', { name: 'Next' });

  await expect(status).toHaveText('Showing 1–5 of 12');
  await expect(rows).toHaveCount(5);
  await expect(previous).toBeDisabled();
  await next.click();
  await expect(status).toHaveText('Showing 6–10 of 12');
  await next.click();
  await expect(status).toHaveText('Showing 11–12 of 12');
  await expect(next).toBeDisabled();

  const amount = page.getByRole('columnheader', { name: 'Amount' });
  await amount.getByRole('button').click();
  await expect(amount).toHaveAttribute('aria-sort', 'ascending');
  await expect(status).toHaveText('Showing 1–5 of 12');
  await expect(rows.first().locator('td').last()).toHaveText('€74.00');
  await amount.getByRole('button').click();
  await expect(amount).toHaveAttribute('aria-sort', 'descending');
  await expect(rows.first().locator('td').last()).toHaveText('€980.00');
  await amount.getByRole('button').click();
  await expect(amount).toHaveAttribute('aria-sort', 'none');

  await page.getByRole('searchbox', { name: 'Filter payments' }).fill('failed');
  await expect(status).toHaveText('Showing 1–3 of 3');
  const all = page.getByRole('checkbox', { name: 'Select all rows' });
  await all.check();
  await expect(selection).toHaveText('3 of 12 rows selected.');
  await page.getByRole('checkbox', { name: 'Select carmella@example.com' }).uncheck();
  await expect(selection).toHaveText('2 of 12 rows selected.');
  expect(await all.evaluate((el) => (el as HTMLInputElement).indeterminate)).toBe(true);
  await expectNoAxeViolations(page);

  await page.getByRole('searchbox', { name: 'Filter payments' }).fill('nothing-matches');
  await expect(page.getByText('No payments match.')).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe('sidebar', () => {
  test('desktop: collapses to icons, remembers it, Ctrl+B toggles', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openPreview(page, 'sidebar');
    const layout = page.locator('[data-bootcn-sidenav-layout]');
    const toggle = page.getByRole('button', { name: 'Toggle sidebar' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.click();
    await expect(layout).toHaveClass(/is-collapsed/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // Labels are visually hidden, not removed: links keep their names.
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expectNoAxeViolations(page);

    await page.reload();
    await expect(layout).toHaveClass(/is-collapsed/);
    await page.keyboard.press('Control+b');
    await expect(layout).not.toHaveClass(/is-collapsed/);
  });

  test('phone: the toggle opens a drawer that Escape closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openPreview(page, 'sidebar');
    const toggle = page.getByRole('button', { name: 'Toggle sidebar' });
    await expect(page.getByRole('link', { name: 'Inbox' })).toBeHidden();
    await toggle.click();
    await expect(page.getByRole('link', { name: 'Inbox' })).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('link', { name: 'Inbox' })).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('charts', () => {
  test('bar chart: bars, tooltip on hover, legend and data table', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'chart-bar', 'blocks');
    const figure = page.locator('[data-bootcn-chart]');
    await expect(figure.locator('svg .bootcn-chart__bar')).toHaveCount(12);
    await expect(figure.locator('.bootcn-chart__legend li')).toHaveText(['Desktop', 'Mobile']);

    const svg = figure.locator('svg');
    const box = await svg.boundingBox();
    if (!box) throw new Error('no chart');
    await page.mouse.move(box.x + box.width * 0.18, box.y + box.height * 0.5);
    const tip = figure.locator('.bootcn-chart__tooltip');
    await expect(tip).toBeVisible();
    await expect(tip).toContainText('Jan');
    await expect(tip).toContainText('214');
    await page.mouse.move(box.x - 20, box.y - 20);
    await expect(tip).toBeHidden();

    await figure.getByText('Show data').click();
    const table = figure.getByRole('table', { name: /Desktop and mobile visitors per month/ });
    await expect(table).toBeVisible();
    await expect(table.getByRole('row')).toHaveCount(7);
    await expect(table.getByRole('row', { name: /Feb/ })).toContainText('312');
    await expectNoAxeViolations(page);
    expect(errors).toEqual([]);
  });

  test('donut chart: slice tooltip with a percentage, total in the middle', async ({ page }) => {
    await openPreview(page, 'chart-pie', 'blocks');
    const figure = page.locator('[data-bootcn-chart]');
    await expect(figure.locator('.bootcn-chart__center-value')).toHaveText('925');
    const box = await figure.locator('svg').boundingBox();
    if (!box) throw new Error('no chart');
    // The first slice (Search) starts at 12 o'clock and runs clockwise.
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 - 70);
    await expect(figure.locator('.bootcn-chart__tooltip')).toContainText('Search');
    await expect(figure.locator('.bootcn-chart__tooltip')).toContainText('29.7%');
  });

  test('charts redraw on resize and on update()', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await openPreview(page, 'chart');
    const figure = page.locator('[data-bootcn-chart]');
    const width = () => figure.locator('svg').evaluate((el) => Number(el.getAttribute('width')));
    const wide = await width();
    await page.setViewportSize({ width: 360, height: 800 });
    await expect.poll(width).toBeLessThan(wide);

    await page.evaluate(() => {
      const root = document.querySelector('[data-bootcn-chart]')!;
      (
        window as unknown as { Bootcn: { chart: { update: (r: Element, c: object) => void } } }
      ).Bootcn.chart.update(root, {
        type: 'line',
        categories: ['A', 'B'],
        series: [{ name: 'Sales', data: [1, 2] }],
      });
    });
    await expect(figure.locator('.bootcn-chart__line')).toHaveCount(1);
    await expect(figure.locator('.bootcn-chart__legend li')).toHaveText(['Sales']);
  });
});

test.describe('HeroUI-style fields and indicators', () => {
  test('number field: buttons step within min and max', async ({ page }) => {
    await openPreview(page, 'number-field');
    const guests = page.getByRole('spinbutton', { name: 'Guests' });
    const more = page.getByRole('button', { name: 'Increase guests' });
    const less = page.getByRole('button', { name: 'Decrease guests' });
    await more.click();
    await expect(guests).toHaveValue('3');
    await less.click();
    await less.click();
    await expect(guests).toHaveValue('1');
    await expect(less).toBeDisabled();
    await guests.fill('12');
    await expect(more).toBeDisabled();
    await expect(more).toHaveAttribute('tabindex', '-1');

    const width = page.getByRole('spinbutton', { name: 'Width in centimetres' });
    await page.getByRole('button', { name: 'Increase width in centimetres' }).click();
    await expect(width).toHaveValue('43');
  });

  test('search field: clear button and Escape empty it and keep focus', async ({ page }) => {
    await openPreview(page, 'search-field');
    const input = page.getByRole('searchbox', { name: 'Search the docs' });
    const clear = page.getByRole('button', { name: 'Clear search' });
    await expect(page.getByRole('search', { name: 'Documentation' })).toBeVisible();
    await expect(clear).toBeVisible();
    await clear.click();
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await expect(clear).toBeHidden();
    await input.fill('calendar');
    await expect(clear).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
  });

  test('meter and progress circle carry their values natively', async ({ page }) => {
    await openPreview(page, 'meter');
    await expect(page.getByRole('meter', { name: 'Storage used' })).toHaveAttribute('value', '72');
    await openPreview(page, 'progress-circle');
    await expect(page.getByRole('progressbar', { name: 'Course completed' })).toHaveAttribute(
      'value',
      '65',
    );
    const busy = page.getByRole('progressbar', { name: 'Loading report' });
    expect(await busy.evaluate((el) => (el as HTMLProgressElement).position)).toBe(-1);
  });

  test('link: a new-tab link says so', async ({ page }) => {
    await openPreview(page, 'link');
    await expect(
      page.getByRole('link', { name: 'Example documentation (opens in a new tab)' }),
    ).toHaveAttribute('target', '_blank');
  });
});
