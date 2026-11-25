/**
 * Video player: the preview plays a 12-second sample embedded in a
 * preview-only script, with captions added from code.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, openPreview } from './helpers.js';

type V = HTMLVideoElement;

test('custom controls replace the native ones, with names', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'video-player');
  const player = page.getByRole('group', { name: 'Video: Sunrise over the hills' });
  const video = player.locator('video');
  expect(await video.evaluate((v: V) => v.controls)).toBe(false);
  await expect(player.getByRole('button', { name: 'Play' }).first()).toBeVisible();
  for (const name of ['Back 10 seconds', 'Forward 10 seconds', 'Mute', 'Full screen']) {
    await expect(player.getByRole('button', { name })).toHaveCount(1);
  }
  await expect(player.getByRole('slider', { name: 'Seek' })).toHaveCount(1);
  await expect(player.getByRole('combobox', { name: 'Playback speed' })).toHaveValue('1');
  // Captions exist (added by the preview), so their button shows.
  await expect(player.getByRole('button', { name: 'Captions' })).toBeAttached();
  await expect(player.getByRole('button', { name: 'Captions' })).not.toHaveAttribute('hidden');
  expect(errors).toEqual([]);
});

test('keys: seek, mute, speed and captions without playing', async ({ page }) => {
  await openPreview(page, 'video-player');
  const player = page.locator('[data-bootcn-video]');
  const video = player.locator('video');
  await expect.poll(() => video.evaluate((v: V) => v.duration)).toBeCloseTo(12, 0);
  await expect(player.locator('[data-bootcn-video-duration]')).toHaveText('0:12');

  await player.getByRole('button', { name: 'Mute' }).focus();
  await page.keyboard.press('l');
  await expect.poll(() => video.evaluate((v: V) => v.currentTime)).toBeCloseTo(10, 0);
  await expect(player.locator('[data-bootcn-video-live]')).toHaveText('+10 s');
  await expect(player.locator('[data-bootcn-video-current]')).toHaveText('0:10');
  await page.keyboard.press('j');
  await expect.poll(() => video.evaluate((v: V) => v.currentTime)).toBeCloseTo(0, 0);
  await page.keyboard.press('5');
  await expect.poll(() => video.evaluate((v: V) => v.currentTime)).toBeCloseTo(6, 0);
  await expect(player.getByRole('slider', { name: 'Seek' })).toHaveAttribute(
    'aria-valuetext',
    '6 s of 12 s',
  );

  await page.keyboard.press('m');
  await expect(player.getByRole('button', { name: 'Mute' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await video.evaluate((v: V) => v.muted)).toBe(true);
  await page.keyboard.press('m');
  await expect(player.getByRole('button', { name: 'Mute' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );

  await player.getByRole('combobox', { name: 'Playback speed' }).selectOption('1.5');
  expect(await video.evaluate((v: V) => v.playbackRate)).toBe(1.5);
  await expect(player.locator('[data-bootcn-video-live]')).toHaveText('Speed 1.5×');

  await player.getByRole('button', { name: 'Mute' }).focus();
  await page.keyboard.press('c');
  await expect(player.getByRole('button', { name: 'Captions' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  // At 6 s the second caption is on screen.
  await expect(player.locator('[data-bootcn-video-caption-text]')).toHaveText(
    'A bird sets off across the valley.',
  );
  await page.keyboard.press('c');
  await expect(player.locator('[data-bootcn-video-caption-text]')).toHaveText('');
});

test('seek bar and volume', async ({ page }) => {
  await openPreview(page, 'video-player');
  const player = page.locator('[data-bootcn-video]');
  const video = player.locator('video');
  await expect.poll(() => video.evaluate((v: V) => v.duration)).toBeCloseTo(12, 0);
  await player.getByRole('slider', { name: 'Seek' }).fill('9');
  await expect.poll(() => video.evaluate((v: V) => v.currentTime)).toBeCloseTo(9, 0);
  // The volume slider opens when the volume control has focus or the pointer.
  await player.getByRole('button', { name: 'Mute' }).focus();
  await expect(player.getByRole('slider', { name: 'Volume' })).toBeVisible();
  await player.getByRole('slider', { name: 'Volume' }).fill('30');
  expect(await video.evaluate((v: V) => v.volume)).toBeCloseTo(0.3);
  await player.getByRole('slider', { name: 'Volume' }).fill('0');
  await expect(player.getByRole('button', { name: 'Mute' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('plays, pauses and hides the controls while idle', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'headless media playback is only reliable in Chromium');
  await openPreview(page, 'video-player');
  const player = page.locator('[data-bootcn-video]');
  await page.getByRole('button', { name: 'Play' }).first().click();
  await expect(player).toHaveClass(/is-playing/);
  await expect(
    player.locator('.bootcn-video__bar').getByRole('button', { name: 'Pause' }),
  ).toHaveCount(1);
  await expect(player.locator('.bootcn-video__big-play')).toBeHidden();
  // Focus and pointer away from the controls: they fade out.
  await page.mouse.move(5, 5);
  await page.locator('h1').click();
  await expect(player).toHaveClass(/is-idle/, { timeout: 6000 });
  await page.keyboard.press('Tab');
  await player.locator('.bootcn-video__stage').click();
  await expect(player).not.toHaveClass(/is-playing/);
  await expect(player).not.toHaveClass(/is-idle/);
});
