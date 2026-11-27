/**
 * Effects pack: ticker, reveal, glow, recent purchase, floating tab bar, palette.
 */
import { expect, test } from '@playwright/test';

import { expectNoAxeViolations, openPreview } from './helpers.js';

test('number ticker: counts to the value, which screen readers get once', async ({ page }) => {
  await openPreview(page, 'number-ticker');
  const teams = page.locator('[data-bootcn-ticker][data-value="12400"]');
  await expect(teams.locator('.visually-hidden')).toHaveText('12,400+');
  await expect(teams.locator('.bootcn-ticker__count')).toHaveAttribute('aria-hidden', 'true');
  await expect(teams.locator('.bootcn-ticker__count')).toHaveText('12,400+');
  await expect(page.locator('[data-value="99.98"] .bootcn-ticker__count')).toHaveText('99.98%');
  await expectNoAxeViolations(page);
});

test('number ticker: no counting with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPreview(page, 'number-ticker');
  await expect(page.locator('[data-value="2.4"] .bootcn-ticker__count')).toHaveText('2.4M');
});

test('scroll reveal: parts appear as they scroll into view, all at once without motion', async ({
  page,
}) => {
  await openPreview(page, 'scroll-reveal');
  await expect(page.locator('html')).toHaveClass(/bootcn-reveal-ready/);
  const cards = page.locator('.bootcn-reveal-demo__card');
  await expect(cards.first()).not.toHaveClass(/is-revealed/);
  await cards.last().scrollIntoViewIfNeeded();
  await expect(cards.last()).toHaveClass(/is-revealed/);
  await expect(page.locator('#bootcn-reveal-title')).toHaveClass(/is-revealed/);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPreview(page, 'scroll-reveal');
  await expect(cards.first()).toHaveClass(/is-revealed/);
});

test('glow card: the light follows the pointer', async ({ page }) => {
  await openPreview(page, 'glow-card');
  const card = page.locator('.bootcn-glow-card').first();
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + 40, box.y + 30);
  await expect(card).toHaveClass(/is-glowing/);
  await expect(card).toHaveAttribute('style', /--bootcn-glow-x: 40px/);
  await expectNoAxeViolations(page);
});

test('recent purchase: real orders, one at a time, and a way to switch them off', async ({
  page,
}) => {
  await openPreview(page, 'recent-purchase');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const region = page.locator('[data-bootcn-purchase]');
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await page.evaluate(() => {
    const api = (
      window as unknown as {
        Bootcn: { purchases: { show(root: Element, p: Record<string, string>): void } };
      }
    ).Bootcn.purchases;
    const root = document.querySelector('[data-bootcn-purchase]')!;
    api.show(root, { id: 'a', name: 'Lena', place: 'Berlin', product: 'Linen <b>shirt</b>' });
    api.show(root, { id: 'b', name: 'Marco', product: 'Canvas tote' });
    api.show(root, { id: 'a', name: 'Lena', place: 'Berlin', product: 'Again' });
  });
  await expect(region.locator('.bootcn-purchase__notice')).toHaveCount(1);
  await expect(region).toContainText('Lena in Berlin bought Linen <b>shirt</b>');
  await expectNoAxeViolations(page);
  await region.getByRole('button', { name: 'Hide purchase notifications' }).click();
  await expect(region.locator('.bootcn-purchase__notice')).toHaveCount(0);
  await page.waitForTimeout(1800);
  await expect(region.locator('.bootcn-purchase__notice')).toHaveCount(0);
});

test('tab bar: the floating variant', async ({ page }) => {
  await openPreview(page, 'tab-bar');
  const floating = page.getByRole('navigation', { name: 'Main (floating)' });
  await expect(floating).toHaveClass(/bootcn-tab-bar--floating/);
  await expect(floating.getByRole('link', { name: 'Home' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expectNoAxeViolations(page);
});
