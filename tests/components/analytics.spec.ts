/**
 * Maps and analytics: map embed, sparkline, funnel, heatmap.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

test('map embed: nothing from OpenStreetMap until "Show map"', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('openstreetmap.org')) requests.push(request.url());
  });
  await page.route('**://www.openstreetmap.org/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Map</title>' }),
  );
  await openPreview(page, 'map-embed');
  await expectNoAxeViolations(page);
  expect(requests).toEqual([]);

  await page.getByRole('button', { name: 'Show map' }).click();
  const frame = page.locator('iframe[title="Map of Union Square, San Francisco"]');
  await expect(frame).toBeVisible();
  await expect(frame).toBeFocused();
  const src = await frame.getAttribute('src');
  expect(src).toContain('https://www.openstreetmap.org/export/embed.html?bbox=');
  expect(src).toContain('marker=37.788%2C-122.4075');
  await expect.poll(() => requests.length).toBeGreaterThan(0);
});

test('sparkline: drawn as an image with a text summary', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'sparkline');
  const visitors = page.getByRole('img', { name: /^Visitors, last 14 days/ });
  await expect(visitors).toHaveAccessibleName(
    'Visitors, last 14 days: from 120 to 198 (+65%), lowest 120, highest 198.',
  );
  await expect(page.getByRole('img', { name: /Bounce rate/ })).toHaveAccessibleName(
    /from 48% to 37%/,
  );
  await expect(visitors.locator('polyline')).toHaveCount(1);
  await expect(page.getByRole('img', { name: /Sign-ups/ }).locator('rect')).toHaveCount(14);
  await expectNoAxeViolations(page);
  expect(errors).toEqual([]);
});

test('funnel and heatmap: the numbers are text in a list and a table', async ({ page }) => {
  await openPreview(page, 'funnel');
  const funnel = page.getByRole('figure', { name: 'Sign-up funnel, last 30 days' });
  await expect(funnel.getByRole('listitem')).toHaveCount(5);
  await expect(funnel.getByRole('listitem').nth(1)).toContainText('9,920 (40.0%)');
  await expect(funnel.getByRole('listitem').nth(1)).toContainText('40% of the previous step');
  await expectNoAxeViolations(page);

  await openPreview(page, 'heatmap');
  const table = page.getByRole('table', { name: /Visits by day and hour/ });
  await expect(table.getByRole('rowheader')).toHaveCount(7);
  await expect(table.getByRole('columnheader')).toHaveCount(8);
  await expect(table.locator('td[data-level]')).toHaveCount(56);
  await expectNoAxeViolations(page);
  await page.evaluate(() => document.documentElement.setAttribute('data-bs-theme', 'dark'));
  await expectNoAxeViolations(page);
});

test('choropleth: regions, tooltip, metric, zoom, keyboard and table', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'choropleth');
  const map = page.locator('[data-bootcn-choropleth-map]');
  const regions = map.locator('.bootcn-choropleth__region');
  await expect(regions).toHaveCount(42);
  const cluj = map.locator('[data-region="cluj"]');
  await expect(cluj).toHaveAttribute('aria-label', /^Cluj: Estimated revenue \/ year €/);
  await expectNoAxeViolations(page);

  // Hover shows the tooltip with every metric.
  await cluj.hover();
  const tooltip = map.locator('.bootcn-choropleth__tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('Cluj');
  await expect(tooltip).toContainText('Resellers');

  // Another metric recolours the map and the legend.
  const fill = () => cluj.evaluate((el) => (el as SVGPathElement).style.fill);
  const before = await fill();
  await page.getByLabel('Colour by').selectOption('resellers');
  await expect(page.locator('[data-bootcn-choropleth-legend]')).toContainText('Resellers:');
  await expect(cluj).toHaveAttribute('aria-label', /Cluj: Resellers \d+/);
  expect(typeof before).toBe('string');

  // Zoom in changes the view; reset restores it.
  const svg = map.locator('svg.bootcn-choropleth__svg');
  const full = await svg.getAttribute('viewBox');
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(svg).not.toHaveAttribute('viewBox', full!);
  await page.getByRole('button', { name: 'Reset zoom' }).click();
  await expect(svg).toHaveAttribute('viewBox', full!);

  // One tab stop; arrows move through the regions with their tooltip.
  const first = regions.first();
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(regions.nth(1)).toBeFocused();
  await expect(regions.nth(1)).toHaveAttribute('tabindex', '0');
  await expect(first).toHaveAttribute('tabindex', '-1');
  await expect(tooltip).toBeVisible();

  // Every value is in the table.
  await page.getByText('Show data').click();
  const table = page.locator('[data-bootcn-choropleth-table] table');
  await expect(table.locator('tbody tr')).toHaveCount(42);
  await expect(table.locator('thead th')).toHaveText([
    'Region',
    'Estimated revenue / year',
    'Resellers',
    'Businesses',
  ]);
  await page.evaluate(() => document.documentElement.setAttribute('data-bs-theme', 'dark'));
  await expectNoAxeViolations(page);
  expect(errors).toEqual([]);
});
