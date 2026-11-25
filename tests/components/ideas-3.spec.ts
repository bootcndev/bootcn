/**
 * From the ideas board (3): social actions, location pin and audio player.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, openPreview } from './helpers.js';

test('social actions: like and follow toggle, counts are compact', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'social-actions');
  const like = page.locator('[data-bootcn-like]');
  await expect(like).toHaveAttribute('aria-pressed', 'false');
  await expect(like).toContainText('1,240');
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
  await expect(like).toContainText('1,241');
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'false');
  await expect(like).toContainText('1,240');

  const follow = page.locator('[data-bootcn-follow]').first();
  await expect(follow).toHaveAttribute('aria-pressed', 'false');
  await expect(follow.locator('.bootcn-follow__off')).toBeVisible();
  await follow.click();
  await expect(follow).toHaveAttribute('aria-pressed', 'true');
  await expect(follow.locator('.bootcn-follow__on')).toBeVisible();
  await expect(follow.locator('.bootcn-follow__off')).toBeHidden();

  const subscribers = page.locator('[data-bootcn-compact][value="12400"]');
  await expect(subscribers).toHaveText('12.4K');
  await expect(subscribers).toHaveAttribute('aria-label', '12,400');
  await expect(page.locator('[data-bootcn-compact][value="318"]')).toHaveText('318');
  await expect(page.locator('[data-bootcn-compact][value="2750000"]')).toHaveText('2.8M');
  expect(errors).toEqual([]);
});

test('social actions: like and dislike, one at a time', async ({ page }) => {
  await openPreview(page, 'social-actions');
  const group = page.getByRole('group', { name: 'Was this answer helpful?' });
  const up = group.getByRole('button', { name: /^Like/ });
  const down = group.getByRole('button', { name: /^Dislike/ });
  const votes: number[] = [];
  await page.exposeFunction('recordVote', (v: number) => votes.push(v));
  await page.evaluate(() =>
    document.addEventListener('bootcn:vote', (e) =>
      (window as unknown as { recordVote: (v: number) => void }).recordVote(
        (e as CustomEvent<{ value: number }>).detail.value,
      ),
    ),
  );
  await up.click();
  await expect(up).toHaveAttribute('aria-pressed', 'true');
  await expect(up).toContainText('49');
  await down.click();
  await expect(down).toHaveAttribute('aria-pressed', 'true');
  await expect(up).toHaveAttribute('aria-pressed', 'false');
  await expect(up).toContainText('48');
  await expect(down).toContainText('4');
  await down.click();
  await expect(down).toHaveAttribute('aria-pressed', 'false');
  await expect(down).toContainText('3');
  expect(votes).toEqual([1, -1, 0]);
});

test('location pin: markers are named images', async ({ page }) => {
  await openPreview(page, 'location-pin');
  await expect(page.getByRole('img', { name: /Your location/ })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Acme Studio' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Pickup point/ })).toContainText('4 min');
});

test('audio player: tracks, next/previous, volume and mute', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'audio-player');
  const player = page.getByRole('region', { name: 'Audio player' });
  const title = player.locator('[data-bootcn-audio-title]');
  await expect(title).toHaveText('Morning Light');
  await expect(player.getByRole('button', { name: 'Play' })).toBeVisible();

  await player.getByRole('button', { name: 'Next track' }).click();
  await expect(title).toHaveText('City Lines');
  await expect(player.locator('[data-bootcn-audio-artist]')).toHaveText('Contoso Collective');
  await expect(player.locator('.bootcn-audio__track[aria-current="true"]')).toContainText(
    'City Lines',
  );

  await player.getByRole('button', { name: /Slow Tide/ }).click();
  await expect(title).toHaveText('Slow Tide');
  await player.getByRole('button', { name: 'Previous track' }).click();
  await expect(title).toHaveText(/City Lines|Slow Tide/);

  const mute = player.getByRole('button', { name: 'Mute' });
  await mute.click();
  await expect(mute).toHaveAttribute('aria-pressed', 'true');
  expect(await player.locator('audio').evaluate((a: HTMLAudioElement) => a.muted)).toBe(true);
  await mute.click();
  await expect(mute).toHaveAttribute('aria-pressed', 'false');

  await player.getByRole('slider', { name: 'Volume' }).fill('40');
  expect(await player.locator('audio').evaluate((a: HTMLAudioElement) => a.volume)).toBeCloseTo(
    0.4,
  );
  await player.getByRole('slider', { name: 'Volume' }).fill('0');
  await expect(mute).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('audio player: play toggles to pause', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'headless media playback is only reliable in Chromium');
  await openPreview(page, 'audio-player');
  const player = page.getByRole('region', { name: 'Audio player' });
  await player.getByRole('button', { name: 'Play' }).click();
  await expect(player.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(player).toHaveClass(/is-playing/);
  await player.getByRole('button', { name: 'Pause' }).click();
  await expect(player.getByRole('button', { name: 'Play' })).toBeVisible();
});
