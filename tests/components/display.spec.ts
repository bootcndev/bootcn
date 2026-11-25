/**
 * Phase I1: range slider, user, snippet and image.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

test('range slider: two thumbs that cannot cross', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'range-slider');
  const low = page.getByRole('slider', { name: 'Minimum price' });
  const high = page.getByRole('slider', { name: 'Maximum price' });
  const output = page.locator('[data-bootcn-range-output]');
  await expect(low).toHaveAttribute('aria-valuetext', '€20');
  await expect(output).toHaveText('€20 – €80');

  await low.focus();
  await page.keyboard.press('ArrowRight');
  await expect(output).toHaveText('€25 – €80');
  // Past the maximum, the low thumb stops at it.
  await low.fill('95');
  await expect(low).toHaveValue('80');
  await expect(output).toHaveText('€80 – €80');
  await expect(low).toHaveClass(/is-front/);

  await high.focus();
  await page.keyboard.press('End');
  await expect(output).toHaveText('€80 – €100');
  const track = page.locator('.bootcn-range__track');
  await expect(track).toHaveAttribute(
    'style',
    /--bootcn-range-low: 80%; --bootcn-range-high: 100%/,
  );
  await expectNoAxeViolations(page);
  expect(errors).toEqual([]);
});

test('user: names as text, the link variant is one target', async ({ page }) => {
  await openPreview(page, 'user');
  await expect(page.getByText('Olivia Martin')).toBeVisible();
  const link = page.getByRole('link', { name: /Isabella Nguyen/ });
  await expect(link).toHaveAttribute('href', '#profile');
  await link.focus();
  await expect(link).toBeFocused();
});

test('snippet: copies the commands without the prompt', async ({ page }) => {
  await openPreview(page, 'snippet');
  const copied = page.evaluate(
    () =>
      new Promise<string>((resolve) =>
        document.addEventListener(
          'bootcn:snippet:copy',
          (event) => resolve((event as CustomEvent<{ text: string }>).detail.text),
          { once: true },
        ),
      ),
  );
  await page.getByRole('button', { name: 'Copy commands' }).click();
  expect(await copied).toBe('npm install\nnpm run dev');
  await expect(page.locator('[data-bootcn-snippet-status]').nth(1)).toHaveText(
    'Copied to the clipboard.',
  );
});

test('image: shows its description when it fails to load', async ({ page }) => {
  await openPreview(page, 'image');
  await expect(page.locator('.bootcn-image.is-loading')).toHaveCount(0);
  await page.route('**/missing.png', (route) => route.abort());
  await page.evaluate(() => {
    const figure = document.createElement('figure');
    figure.className = 'bootcn-image';
    figure.setAttribute('data-bootcn-image', '');
    figure.innerHTML =
      '<img class="bootcn-image__img" src="missing.png" alt="Team photo" width="320" height="180">';
    document.querySelector('main')!.appendChild(figure);
    (
      window as unknown as { Bootcn: { image: { setup: (el: Element) => void } } }
    ).Bootcn.image.setup(figure);
  });
  await expect(page.getByRole('img', { name: 'Team photo' }).last()).toBeVisible();
  await expect(page.locator('.bootcn-image.is-error')).toHaveCount(1);
});
