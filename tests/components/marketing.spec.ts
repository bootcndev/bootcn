import { expect, test } from '@playwright/test';

import { collectErrors, openPreview } from './helpers.js';

test.describe('pricing table', () => {
  test('the billing switch shows one set of prices, by mouse and keyboard', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'pricing-table', 'blocks');
    const pro = page.locator('.bootcn-pricing__plan--featured');
    const monthly = page.getByRole('radio', { name: 'Monthly' });
    const yearly = page.getByRole('radio', { name: 'Yearly (save 20%)' });

    await expect(monthly).toBeChecked();
    await expect(pro.getByText('€19')).toBeVisible();
    await expect(pro.getByText('€15')).toBeHidden();

    await page.getByText('Yearly (save 20%)').click();
    await expect(yearly).toBeChecked();
    await expect(pro.getByText('€15')).toBeVisible();
    await expect(pro.getByText('per month, billed yearly')).toBeVisible();
    await expect(pro.getByText('€19')).toBeHidden();

    // Native radios: arrow keys move the selection.
    await yearly.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(monthly).toBeChecked();
    await expect(pro.getByText('€19')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('calls to action are described by their plan', async ({ page }) => {
    await openPreview(page, 'pricing-table', 'blocks');
    await expect(page.getByRole('link', { name: 'Start free trial' })).toHaveAccessibleDescription(
      'Pro',
    );
    await expect(page.locator('.bootcn-pricing__plan--featured')).toContainText('Most popular');
  });
});

test('hero: one h1 and two calls to action', async ({ page }) => {
  await openPreview(page, 'hero-section', 'blocks');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Start for free' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Book a demo' })).toBeVisible();
});

test('site header: the menu collapses on phones and opens with its button', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await openPreview(page, 'site-header', 'blocks');
  const menu = page.getByRole('button', { name: 'Menu' });
  const pricing = page.getByRole('link', { name: 'Pricing' });
  await expect(pricing).toBeHidden();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(pricing).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(menu).toBeHidden();
  await expect(pricing).toBeVisible();
});

test('FAQ section: one answer open at a time', async ({ page }) => {
  await openPreview(page, 'faq-section', 'blocks');
  const first = page.getByRole('button', { name: 'Do I need Node.js or a build step?' });
  const second = page.getByRole('button', { name: 'Is it accessible?' });
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await second.click();
  await expect(second).toHaveAttribute('aria-expanded', 'true');
  await expect(first).toHaveAttribute('aria-expanded', 'false');
});

test('app sidebar: links keep their inset on desktop', async ({ page }) => {
  // Bootstrap's .offcanvas-lg .offcanvas-body sets padding: 0 from 992px.
  await page.setViewportSize({ width: 1280, height: 800 });
  await openPreview(page, 'app-sidebar', 'blocks');
  const inset = await page.evaluate(() => {
    const sidebar = document.querySelector('.bootcn-sidebar')!.getBoundingClientRect();
    const link = document.querySelector('.bootcn-sidebar__link')!.getBoundingClientRect();
    return { start: link.left - sidebar.left, end: sidebar.right - link.right };
  });
  expect(inset.start).toBeGreaterThanOrEqual(8);
  expect(inset.end).toBeGreaterThanOrEqual(8);
});

test('booking: the summary follows the day and the time', async ({ page }) => {
  await openPreview(page, 'booking', 'blocks');
  const summary = page.locator('[data-bootcn-booking-summary]');
  await expect(summary).toHaveText('Thursday, November 26 at 10:00');
  await page.getByText('14:30', { exact: true }).click();
  await expect(summary).toHaveText('Thursday, November 26 at 14:30');
  await expect(page.getByRole('radio', { name: '11:30' })).toBeDisabled();
  await page.locator('[data-date="2026-11-27"]').click();
  await expect(summary).toHaveText('Friday, November 27 at 14:30');
});

test('sidebar rail: icon links have names and show their label on focus', async ({ page }) => {
  await openPreview(page, 'sidebar-rail', 'blocks');
  const inbox = page.getByRole('link', { name: 'Inbox' });
  await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await inbox.focus();
  await expect
    .poll(() => inbox.evaluate((el) => getComputedStyle(el, '::after').opacity))
    .toBe('1');
});

test('site header: hides while scrolling down, returns on scroll up and focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await openPreview(page, 'site-header', 'blocks');
  const header = page.locator('.bootcn-site-header');
  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.style.height = '3000px';
    document.body.appendChild(spacer);
  });
  // Scroll positions set directly: wheel scrolling is asynchronous in WebKit.
  const scrollTo = (y: number) => page.evaluate((top) => window.scrollTo(0, top), y);
  await scrollTo(800);
  await expect(header).toHaveClass(/is-hidden/);
  await scrollTo(600);
  await expect(header).not.toHaveClass(/is-hidden/);
  await scrollTo(1400);
  await expect(header).toHaveClass(/is-hidden/);
  await page.getByRole('link', { name: 'Pricing' }).focus();
  await expect(header).not.toHaveClass(/is-hidden/);
});
