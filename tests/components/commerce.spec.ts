/**
 * Commerce pack: rating, variant picker, product card, cart, product
 * filters, product detail and checkout.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, openPreview } from './helpers.js';

type Cart = {
  items: () => { id: string; variant: string; quantity: number }[];
  totals: () => { count: number; subtotal: number };
};
type W = { Bootcn: { cart: Cart } };

test('rating: display in words, input as radios', async ({ page }) => {
  await openPreview(page, 'rating');
  await expect(page.getByRole('img', { name: 'Rated 4.6 out of 5, 214 reviews' })).toBeVisible();
  const group = page.getByRole('group', { name: 'Your rating' });
  await expect(group.getByRole('radio', { name: '4 stars' })).toBeChecked();
  await group.getByRole('radio', { name: '4 stars' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(group.getByRole('radio', { name: '5 stars' })).toBeChecked();
  // The fifth star is lit.
  await expect
    .poll(() =>
      group
        .locator('.bootcn-rating-input__star')
        .nth(4)
        .evaluate((el) => getComputedStyle(el).color),
    )
    .toBe('rgb(245, 158, 11)');
});

test('variant picker: shows the choice, skips sold out, reports changes', async ({ page }) => {
  await openPreview(page, 'variant-picker');
  const color = page.getByRole('group', { name: /Color/ });
  await page.locator('label[for="bootcn-variant-color-navy"]').click();
  await expect(color.locator('[data-bootcn-variant-value]')).toHaveText('Navy');
  const size = page.getByRole('group', { name: /Size/ });
  await expect(size.getByRole('radio', { name: 'XL (sold out)' })).toBeDisabled();
  const change = page.evaluate(
    () =>
      new Promise((resolve) =>
        document.addEventListener(
          'bootcn:variant:change',
          (e) => resolve((e as CustomEvent).detail),
          {
            once: true,
          },
        ),
      ),
  );
  await page.locator('label[for="bootcn-variant-size-l"]').click();
  expect(await change).toEqual({ color: 'Navy', size: 'L' });
  await expect(size.locator('[data-bootcn-variant-value]')).toHaveText('L');
});

test('product card: names, price in words, wishlist toggle', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'product-card');
  const card = page.getByRole('article', { name: 'Studio Headphones' });
  await expect(card.getByText('Price:')).toBeAttached();
  await expect(card.locator('.bootcn-price')).toContainText('$149');
  await expect(card.locator('s')).toHaveText('$179');
  await expect(card.getByRole('img', { name: /Rated 4\.7 out of 5/ })).toBeVisible();
  const wish = card.getByRole('button', { name: 'Save Studio Headphones to your wishlist' });
  await wish.click();
  await expect(wish).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-bootcn-wishlist-live]')).toHaveText(
    'Saved to your wishlist: Studio Headphones',
  );
  // The name's link covers the card, but the buttons stay on top.
  await expect(card.getByRole('link', { name: 'Studio Headphones' })).toHaveAttribute('href', '#');
  await card.getByRole('button', { name: 'Add Studio Headphones to cart' }).click({ trial: true });
  expect(errors).toEqual([]);
});

test('cart: add, step, free shipping, remove and empty', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'cart');
  const toggle = page.getByRole('button', { name: 'Cart, 0 items' });
  await expect(toggle).toBeVisible();
  await page.getByRole('button', { name: 'Add Stoneware Mug to cart' }).click();
  const drawer = page.getByRole('dialog', { name: /Your cart/ });
  await expect(drawer).toBeVisible();
  await expect(drawer.locator('[data-bootcn-cart-live]')).toHaveText(
    'Added Stoneware Mug to your cart.',
  );
  await expect(page.locator('[data-bootcn-cart-toggle]')).toHaveAttribute(
    'aria-label',
    'Cart, 1 items',
  );
  const quantity = drawer.getByRole('group', { name: 'Quantity of Stoneware Mug' });
  await expect(quantity.getByRole('button', { name: 'One less Stoneware Mug' })).toBeDisabled();
  await quantity.getByRole('button', { name: 'One more Stoneware Mug' }).click();
  await expect(quantity.locator('output')).toHaveText('2');
  await expect(drawer.getByRole('button', { name: 'One more Stoneware Mug' })).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.closest('#bootcn-cart') !== null))
    .toBe(true);
  await expect(drawer.locator('[data-bootcn-cart-subtotal]')).toHaveText('$36.00');
  await expect(drawer.locator('[data-bootcn-cart-shipping-text]')).toHaveText(
    'Add $64.00 more for free shipping',
  );

  // Two more products past $100: free shipping.
  const focusInDrawer = () =>
    page.evaluate(() => Boolean(document.activeElement?.closest('#bootcn-cart')));
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    const add = page.getByRole('button', { name: 'Add Insulated Bottle to cart' });
    if (i === 1) await expect(add).toBeFocused(); // the focus came back to it
    await add.click();
    await expect.poll(focusInDrawer).toBe(true);
  }
  await expect(drawer.locator('[data-bootcn-cart-shipping-text]')).toHaveText(
    'Your order ships free',
  );
  const totals = await page.evaluate(() => (window as unknown as W).Bootcn.cart.totals());
  expect(totals).toEqual({ count: 4, subtotal: 100 });
  await expect(drawer.getByRole('listitem')).toHaveCount(2);

  await drawer.getByRole('button', { name: 'Remove Stoneware Mug' }).click();
  await expect(drawer.getByRole('listitem')).toHaveCount(1);
  await expect(drawer.getByRole('button', { name: 'Remove Insulated Bottle' })).toBeFocused();
  await drawer.getByRole('button', { name: 'Remove Insulated Bottle' }).click();
  await expect(drawer.getByText('Your cart is empty.')).toBeVisible();
  await expect(page.locator('[data-bootcn-cart-count]')).toBeHidden();
  expect(errors).toEqual([]);
});
