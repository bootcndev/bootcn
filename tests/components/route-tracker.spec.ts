/**
 * Route tracker: positions come from Playwright's simulated geolocation and
 * map tiles are answered locally (helpers.ts), so nothing reaches OpenStreetMap.
 */
import { expect, test, type Page } from '@playwright/test';

import { collectErrors, openPreview } from './helpers.js';

type Api = {
  add: (root: Element, point: object) => boolean;
  points: (root: Element) => { lat: number; lng: number; gap: boolean }[];
  toGeoJSON: (root: Element) => { geometry: { type: string; coordinates: number[][][] } };
};
type W = { Bootcn: { routeTracker: Api } };

// openPreview answers the tiles locally; this records which were asked for.
function stubTiles(page: Page): string[] {
  const requested: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith('https://tile.openstreetmap.org/')) requested.push(request.url());
  });
  return requested;
}

test('tracks positions, draws the line and reports the totals', async ({ page, context }) => {
  const errors = collectErrors(page);
  const tiles = stubTiles(page);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 40.7812, longitude: -73.9665, accuracy: 10 });
  await openPreview(page, 'route-tracker');

  const root = page.getByRole('region', { name: 'Route tracker' });
  await expect(root.getByText('Press Start to draw your route')).toBeVisible();
  // Nothing is requested from the tile server before there is a position.
  expect(tiles).toEqual([]);

  await root.getByRole('button', { name: 'Start' }).click();
  await expect(root.getByRole('status')).toHaveText('Tracking your route.');
  await expect(root.getByRole('button', { name: 'Stop' })).toBeVisible();
  await expect(root.locator('[data-bootcn-route-here] .bootcn-location-dot')).toBeVisible();
  await expect(root.getByText('Press Start to draw your route')).toBeHidden();
  await expect.poll(() => tiles.length).toBeGreaterThan(0);
  await expect(root.getByRole('link', { name: 'OpenStreetMap' })).toBeVisible();

  // About 110 m north per step.
  for (const latitude of [40.7822, 40.7832, 40.7842]) {
    await context.setGeolocation({ latitude, longitude: -73.9665, accuracy: 10 });
    await page.waitForTimeout(150);
  }
  const handle = await root.elementHandle();
  await expect
    .poll(() =>
      page.evaluate(
        (el) => (window as unknown as W).Bootcn.routeTracker.points(el!).length,
        handle,
      ),
    )
    .toBe(4);
  await expect(root.locator('.bootcn-route__trail')).toHaveAttribute(
    'd',
    /^M[\d.-]+ [\d.-]+(L[\d.-]+ [\d.-]+){3}$/,
  );
  await expect(root.locator('[data-bootcn-route-distance]')).toHaveText(/^33\d m$/);

  await root.getByRole('button', { name: 'Stop' }).click();
  await expect(root.getByRole('status')).toContainText('Tracking stopped.');
  await expect(root.getByRole('button', { name: 'Start' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('filters vague and tiny moves, splits segments, exports GeoJSON', async ({ page }) => {
  stubTiles(page);
  await openPreview(page, 'route-tracker');
  const root = page.locator('[data-bootcn-route]');
  const result = await root.evaluate((el) => {
    const api = (window as unknown as W).Bootcn.routeTracker;
    const t = Date.now();
    return [
      api.add(el, { lat: 51.5, lng: -0.12, accuracy: 5, time: t }),
      api.add(el, { lat: 51.501, lng: -0.12, accuracy: 300, time: t + 1000 }), // too vague
      api.add(el, { lat: 51.50001, lng: -0.12, accuracy: 5, time: t + 2000 }), // ~1 m
      api.add(el, { lat: 51.501, lng: -0.12, accuracy: 5, time: t + 60000 }),
    ];
  });
  expect(result).toEqual([true, false, false, true]);
  await expect(root.locator('[data-bootcn-route-distance]')).toHaveText('111 m');
  await expect(root.locator('[data-bootcn-route-duration]')).toHaveText('1:00');
  await expect(root.locator('[data-bootcn-route-speed]')).toHaveText(/^6\.7 km\/h$/);

  const geo = await root.evaluate((el) =>
    (window as unknown as W).Bootcn.routeTracker.toGeoJSON(el),
  );
  expect(geo.geometry.type).toBe('MultiLineString');
  expect(geo.geometry.coordinates).toEqual([
    [
      [-0.12, 51.5],
      [-0.12, 51.501],
    ],
  ]);

  await root.getByRole('button', { name: 'Clear' }).click();
  await expect(root.getByRole('status')).toHaveText('Route cleared.');
  await expect(root.locator('[data-bootcn-route-distance]')).toHaveText('0 m');
  await expect(root.getByText('Press Start to draw your route')).toBeVisible();
});

test('map controls: zoom, fit and drag to pan', async ({ page }) => {
  const tiles = stubTiles(page);
  await openPreview(page, 'route-tracker');
  await page.getByRole('button', { name: 'Replay a sample route' }).click();
  await expect(page.getByRole('button', { name: 'Replay a sample route' })).toBeEnabled({
    timeout: 15000,
  });
  const trail = page.locator('.bootcn-route__trail');
  const width = async () => (await trail.boundingBox())!.width;
  const fitted = await width();
  expect(fitted).toBeGreaterThan(150);

  await page.getByRole('button', { name: 'Zoom out' }).click();
  await expect.poll(width).toBeLessThan(fitted * 0.6);
  expect(tiles.some((url) => /\/1[0-9]\//.test(url))).toBe(true);
  await page.getByRole('button', { name: 'Show the whole route' }).click();
  await expect.poll(width).toBeCloseTo(fitted, 0);

  const before = (await trail.boundingBox())!.x;
  const view = page.locator('[data-bootcn-route-view]');
  const box = (await view.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => (await trail.boundingBox())!.x).toBeCloseTo(before + 60, -1);
});

test('blocked location access is explained', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'permission prompts differ between engines');
  await openPreview(page, 'route-tracker');
  const root = page.getByRole('region', { name: 'Route tracker' });
  await root.getByRole('button', { name: 'Start' }).click();
  await expect(root.getByRole('status')).toHaveText(/Location access is blocked/);
  await expect(root.getByRole('button', { name: 'Start' })).toBeVisible();
});
