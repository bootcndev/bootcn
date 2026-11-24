import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview, previewUrl } from './helpers.js';

// Bootstrap appends tooltips and popovers to <body>, outside any landmark,
// which axe's best-practice "region" rule flags. That placement is how
// floating overlays avoid clipping; every other rule still applies.
const FLOATING = { disableRules: ['region'] };

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('tooltip: shows on focus with bootcn styling and closes with Escape', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'tooltip');
  const trigger = page.getByRole('button', { name: 'Hover or focus me' }).first();

  await trigger.focus();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText('Add to library');
  await expect(tooltip).toHaveClass(/bootcn-tooltip/);
  await expect(trigger).toHaveAttribute('aria-describedby', /tooltip/);
  await expectNoAxeViolations(page, FLOATING);

  await page.keyboard.press('Escape');
  await expect(tooltip).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});

test('tooltip: init is idempotent and destroy disposes', async ({ page }) => {
  await openPreview(page, 'tooltip');
  const result = await page.evaluate(() => {
    const ns = (window as unknown as { Bootcn: { tooltip: { init(): void; destroy(): void } } })
      .Bootcn;
    const bs = (
      window as unknown as { bootstrap: { Tooltip: { getInstance(e: Element): unknown } } }
    ).bootstrap;
    const trigger = document.querySelector('[data-bs-toggle="tooltip"]') as Element;
    const before = bs.Tooltip.getInstance(trigger);
    ns.tooltip.init();
    const same = bs.Tooltip.getInstance(trigger) === before;
    ns.tooltip.destroy();
    return { created: before !== null, same, disposed: bs.Tooltip.getInstance(trigger) === null };
  });
  expect(result).toEqual({ created: true, same: true, disposed: true });
});

test('popover: opens on click, closes with Escape and keeps focus', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'popover');
  const trigger = page.getByRole('button', { name: 'Show usage' }).first();

  await trigger.click();
  const popover = page.locator('.popover.bootcn-popover');
  await expect(popover).toBeVisible();
  await expect(popover).toContainText('Storage');
  await expect(popover).toContainText('7.2 GB');
  await expectNoAxeViolations(page, FLOATING);

  await page.keyboard.press('Escape');
  await expect(popover).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});

test('toast: declarative show, close button and safe create()', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'toast');

  await page.getByRole('button', { name: 'Show saved toast' }).click();
  const saved = page.locator('#bootcn-toast-saved');
  await expect(saved).toBeVisible();
  await expect(saved).toHaveAttribute('role', 'status');
  await expectNoAxeViolations(page);
  await saved.getByRole('button', { name: 'Close notification' }).click();
  await expect(saved).toBeHidden();

  await page.getByRole('button', { name: 'Create error toast' }).click();
  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('Upload failed');
  await expect(alert).toHaveClass(/bootcn-toast--destructive/);

  // create() treats input as text, never HTML.
  await page.evaluate(() => {
    (window as unknown as { Bootcn: { toast: { create(o: object): void } } }).Bootcn.toast.create({
      title: '<img src=x onerror="window.__xss=1">',
      message: 'plain',
      autohide: false,
    });
  });
  await expect(page.getByText('<img src=x onerror="window.__xss=1">')).toBeVisible();
  expect(
    await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
  ).toBeUndefined();
  expect(await page.locator('.bootcn-toast img').count()).toBe(0);

  // Hidden created toasts are removed from the DOM.
  await alert.getByRole('button', { name: 'Close notification' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('toast: init twice still creates one toast per click', async ({ page }) => {
  await openPreview(page, 'toast');
  await page.evaluate(() => {
    const ns = (window as unknown as { Bootcn: { toast: { init(): void } } }).Bootcn;
    ns.toast.init();
    ns.toast.init();
  });
  await page.getByRole('button', { name: 'Create toast', exact: true }).click();
  await expect(page.locator('.bootcn-toast--success')).toHaveCount(1);
});

test('overlay scripts log one clear error when Bootstrap JS is missing', async ({ page }) => {
  const errors = collectErrors(page);
  await page.route('**/bootstrap@5.3.9/dist/js/bootstrap.bundle.min.js', (route) => route.abort());
  await page.route('**/bootstrap@5.3.9/dist/css/bootstrap.min.css', (route) =>
    route.fulfill({ body: '', contentType: 'text/css' }),
  );
  await page.goto(previewUrl('toast'));
  await expect
    .poll(() => errors.filter((message) => message.includes('[bootcn] toast')).length)
    .toBe(1);
  expect(errors.join('\n')).toContain('window.bootstrap.Toast');
});
