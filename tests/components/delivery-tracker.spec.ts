/**
 * Delivery tracker: updates are sent through the API as a server would.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, openPreview } from './helpers.js';

type Api = {
  update: (root: Element, data: object) => void;
  remaining: (root: Element) => number;
};
type W = { Bootcn: { deliveryTracker: Api } };

test('shows the order, moves the courier and finishes delivered', async ({ page }) => {
  const errors = collectErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPreview(page, 'delivery-tracker');
  const root = page.getByRole('region', { name: 'Delivery tracking' });
  const steps = root.getByRole('list', { name: 'Order progress' });

  await expect(root.locator('[data-bootcn-delivery-state]')).toHaveText('Preparing your order');
  await expect(steps.locator('[aria-current="step"]')).toHaveText('Preparing your order');
  await expect(steps.locator('li.is-done')).toHaveCount(1);
  await expect(root.locator('[data-bootcn-delivery-origin] .bootcn-location-pin')).toBeVisible();
  await expect(root.locator('[data-bootcn-delivery-courier]')).toBeHidden();

  const send = (data: object) =>
    root.evaluate((el, d) => (window as unknown as W).Bootcn.deliveryTracker.update(el, d), data);

  await send({ status: 'on-the-way', lat: 40.7741, lng: -73.9546, eta: 9 });
  await expect(steps.locator('[aria-current="step"]')).toHaveText('On the way');
  await expect(root.getByRole('status')).toHaveText('On the way');
  await expect(root.locator('[data-bootcn-delivery-eta]')).toHaveText('9 min');
  await expect(root.locator('[data-bootcn-delivery-arrival]')).toContainText('Arriving at');
  await expect(
    root.locator('[data-bootcn-delivery-courier] .bootcn-delivery__vehicle'),
  ).toBeVisible();

  // Moving north-east along the avenue turns the marker that way.
  await send({ lat: 40.7765, lng: -73.9537, eta: 5 });
  const heading = () =>
    root
      .locator('[data-bootcn-delivery-courier]')
      .evaluate((el) =>
        parseFloat(getComputedStyle(el).getPropertyValue('--bootcn-delivery-heading')),
      );
  await expect.poll(heading).toBeGreaterThan(5);
  expect(await heading()).toBeLessThan(60);
  await expect(root.locator('[data-bootcn-delivery-eta]')).toHaveText('5 min');
  const left = await root.evaluate((el) =>
    (window as unknown as W).Bootcn.deliveryTracker.remaining(el),
  );
  expect(left).toBeGreaterThan(500);
  expect(left).toBeLessThan(900);
  await expect(root.locator('[data-bootcn-delivery-remaining]')).toHaveText(/^\d+ m$/);
  // The road ahead and the road behind are both drawn.
  await expect(root.locator('[data-bootcn-delivery-ahead]')).toHaveAttribute('d', /^M.+L/);
  await expect(root.locator('[data-bootcn-delivery-behind]')).toHaveAttribute('d', /^M.+L/);

  // Close to the door: "nearby" once.
  await send({ lat: 40.7802, lng: -73.9549 });
  await expect(root.getByRole('status')).toHaveText('Your courier is nearby.');

  await send({ status: 'delivered' });
  await expect(root.locator('[data-bootcn-delivery-state]')).toHaveText('Delivered');
  await expect(steps.locator('li.is-done')).toHaveCount(4);
  await expect(root.locator('[data-bootcn-delivery-eta]')).toHaveText(/\d:\d\d/);
  await expect(root.locator('[data-bootcn-delivery-ahead]')).toHaveAttribute('d', '');
  expect(errors).toEqual([]);
});

test('estimates the time without an eta, and translates it', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { Bootcn: object }).Bootcn = {
      messages: { 'delivery.in': 'dans {n} min' },
    };
  });
  await openPreview(page, 'delivery-tracker');
  const root = page.locator('[data-bootcn-delivery]');
  // About 1 km at 18 km/h: a little over 3 minutes.
  await root.evaluate((el) =>
    (window as unknown as W).Bootcn.deliveryTracker.update(el, {
      status: 'on-the-way',
      lat: 40.7741,
      lng: -73.9546,
    }),
  );
  await expect(root.locator('[data-bootcn-delivery-eta]')).toHaveText(/^dans [34] min$/);
});

test('zoom buttons stop following; fit follows again', async ({ page }) => {
  await openPreview(page, 'delivery-tracker');
  const tile = page.locator('.bootcn-delivery__tile').first();
  await expect(tile).toHaveAttribute('src', /\/1[56]\//);
  const zoomOf = async () => Number((await tile.getAttribute('src'))!.match(/org\/(\d+)\//)![1]);
  const start = await zoomOf();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect.poll(zoomOf).toBe(start + 1);
  await page.getByRole('button', { name: 'Show the courier and your address' }).click();
  await expect.poll(zoomOf).toBe(start);
});
