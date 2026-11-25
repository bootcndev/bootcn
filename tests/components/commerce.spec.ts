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

test('product listing: filters, count, sort and empty state', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'product-listing', 'blocks');
  await page.setViewportSize({ width: 1280, height: 900 });
  const listing = page.getByRole('region', { name: 'All products' });
  const count = listing.locator('[data-bootcn-listing-count]');
  const visible = listing.locator('[data-bootcn-listing-item]:visible');
  await expect(count).toHaveText('9 products');

  await listing.getByLabel('Home (5)').check();
  await expect(count).toHaveText('5 products');
  await expect(listing.locator('[data-bootcn-listing-live]')).toHaveText('5 products');
  await listing.getByLabel('Maximum price').fill('30');
  // The mug ($18) and the fern ($24); the bottle is $32.
  await expect(visible).toHaveCount(2);
  await listing.getByLabel('4.5 and up').check();
  await expect(count).toHaveText('1 product');
  await expect(visible.getByRole('heading')).toHaveText('Stoneware Mug');

  await listing.getByLabel('Maximum price').fill('1');
  await expect(listing.getByText('No products match these filters.')).toBeVisible();
  await listing
    .locator('[data-bootcn-listing-empty]')
    .getByRole('button', { name: 'Clear filters' })
    .click();
  await expect(count).toHaveText('9 products');

  await listing.getByLabel('Sort by').selectOption('price-desc');
  await expect(visible.first().getByRole('heading')).toHaveText('Oak Side Chair');
  await listing.getByLabel('Sort by').selectOption('price-asc');
  await expect(visible.first().getByRole('heading')).toHaveText('Stoneware Mug');
  await listing.getByLabel('Sort by').selectOption('featured');
  await expect(visible.first().getByRole('heading')).toHaveText('Everyday Tee');
  expect(errors).toEqual([]);
});

test('product listing: filters in a drawer on phones', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await openPreview(page, 'product-listing', 'blocks');
  const open = page.getByRole('button', { name: /Filters/ });
  await open.click();
  const drawer = page.getByRole('dialog', { name: 'Filters' });
  await expect(drawer).toBeVisible();
  await drawer.getByLabel('Electronics (1)').check();
  await drawer.getByRole('button', { name: 'Show results' }).click();
  await expect(drawer).toBeHidden();
  await expect(page.locator('[data-bootcn-listing-count]')).toHaveText('1 product');
  await expect(page.locator('[data-bootcn-listing-active]')).toHaveText('1');
});

test('product detail: gallery and add to cart with options', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'product-detail', 'blocks');
  const detail = page.getByRole('article', { name: 'Everyday Tee' });
  await expect(detail.getByRole('img', { name: 'Front view' })).toBeVisible();
  await detail.getByRole('button', { name: 'Back view' }).click();
  await expect(detail.getByRole('button', { name: 'Back view' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(detail.locator('[data-bootcn-detail-main]')).toHaveAttribute(
    'aria-label',
    'Back view',
  );
  await page.keyboard.press('ArrowRight');
  await expect(detail.getByRole('button', { name: 'Detail view' })).toBeFocused();
  await expect(detail.locator('[data-bootcn-detail-main]')).toHaveAttribute(
    'aria-label',
    'Detail view',
  );
  await expect(detail.getByRole('radio', { name: 'XL (sold out)' })).toBeDisabled();
  await detail.locator('label[for="bootcn-detail-color-navy"]').click();
  await expect(
    detail.getByRole('group', { name: /Color/ }).locator('[data-bootcn-variant-value]'),
  ).toHaveText('Navy');
  expect(errors).toEqual([]);
});

test('checkout: validation, card formatting, discount, shipping and confirmation', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await openPreview(page, 'checkout', 'blocks');
  const checkout = page.getByRole('region', { name: 'Checkout' });
  const total = checkout.locator('[data-bootcn-checkout-total]');
  await expect(total).toHaveText('$191.16');
  await expect(checkout.getByRole('button', { name: /Pay \$191\.16/ })).toBeVisible();

  await checkout.getByRole('button', { name: /Pay/ }).click();
  await expect(checkout.getByLabel('Email', { exact: true })).toBeFocused();
  await expect(checkout.getByLabel('Email', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(
    checkout.getByRole('status').filter({ hasText: 'Some details need fixing.' }),
  ).toBeVisible();

  await checkout.getByLabel('Discount code').fill('nope');
  await checkout.getByRole('button', { name: 'Apply' }).click();
  await expect(checkout.getByText('This code is not valid.')).toBeVisible();
  await checkout.getByLabel('Discount code').fill('welcome10');
  await page.keyboard.press('Enter');
  await expect(checkout.getByText('WELCOME10 applied.')).toBeVisible();
  await checkout.getByLabel(/Express/).check();
  // 177 − 17.70 + 12 + 8% of 159.30.
  await expect(total).toHaveText('$184.04');

  await checkout.getByLabel('Email', { exact: true }).fill('olivia@example.com');
  await checkout.getByLabel('First name').fill('Olivia');
  await checkout.getByLabel('Last name').fill('Martin');
  await checkout.getByLabel('Address', { exact: true }).fill('450 Market Street');
  await checkout.getByLabel('City').fill('San Francisco');
  await checkout.getByLabel('Postal code').fill('94105');
  const card = checkout.getByLabel('Card number');
  await card.pressSequentially('4242424242424241');
  await expect(card).toHaveValue('4242 4242 4242 4241');
  await expect(checkout.locator('[data-bootcn-checkout-brand]')).toHaveText('Visa');
  await checkout.getByLabel('Expiry date').pressSequentially('1230');
  await expect(checkout.getByLabel('Expiry date')).toHaveValue('12 / 30');
  await checkout.getByLabel('Security code').fill('123');
  await checkout.getByLabel('Name on card').fill('Olivia Martin');
  await checkout.getByRole('button', { name: /Pay/ }).click();
  // The Luhn check catches the last digit.
  await expect(card).toHaveAttribute('aria-invalid', 'true');
  await expect(card).toBeFocused();
  await card.fill('');
  await card.pressSequentially('4242424242424242');
  await checkout.getByRole('button', { name: /Pay/ }).click();
  const done = page.getByRole('heading', { name: 'Thank you for your order' });
  await expect(done).toBeVisible();
  await expect(done).toBeFocused();
  await expect(page.locator('[data-bootcn-checkout-order-number]')).toHaveText(/^#\d{6}$/);
  expect(errors).toEqual([]);
});
