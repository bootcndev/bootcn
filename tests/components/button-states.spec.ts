/**
 * Regression test: Bootstrap's state rules (.btn:hover, :active, .active,
 * .show, :disabled) read --bs-btn-* variables. Every bootcn-button variant must
 * keep its colors in those states instead of falling back to transparent.
 */
import { expect, test, type Page } from '@playwright/test';

import { openPreview } from './helpers.js';

const PRIMARY = 'rgb(13, 110, 253)';
const WHITE = 'rgb(255, 255, 255)';

async function addButton(page: Page, classes: string, attrs = ''): Promise<string> {
  return page.evaluate(
    ({ classes, attrs }) => {
      const id = `probe-${Math.random().toString(36).slice(2)}`;
      document
        .querySelector('main')
        ?.insertAdjacentHTML(
          'beforeend',
          `<button id="${id}" type="button" class="btn bootcn-button ${classes}" ${attrs}>Probe</button>`,
        );
      return `#${id}`;
    },
    { classes, attrs },
  );
}

async function colors(page: Page, selector: string): Promise<{ bg: string; color: string }> {
  return page.$eval(selector, (element) => {
    const style = getComputedStyle(element);
    return { bg: style.backgroundColor, color: style.color };
  });
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPreview(page, 'button');
});

test('default variant keeps primary background and white text in every state', async ({ page }) => {
  for (const [classes, attrs] of [
    ['bootcn-button--default', ''],
    ['bootcn-button--default active', ''],
    ['bootcn-button--default show', ''],
    ['bootcn-button--default', 'disabled'],
  ] as const) {
    const selector = await addButton(page, classes, attrs);
    expect(await colors(page, selector), `${classes} ${attrs}`).toEqual({
      bg: PRIMARY,
      color: WHITE,
    });
  }

  const hovered = await addButton(page, 'bootcn-button--default');
  await page.hover(hovered);
  expect(await colors(page, hovered)).toEqual({ bg: PRIMARY, color: WHITE });
  await page.mouse.down();
  expect(await colors(page, hovered)).toEqual({ bg: PRIMARY, color: WHITE });
  await page.mouse.up();
});

test('outline variant gets a visible background on hover and when open', async ({ page }) => {
  const plain = await addButton(page, 'bootcn-button--outline');
  expect((await colors(page, plain)).bg).toBe('rgba(0, 0, 0, 0)');

  const open = await addButton(page, 'bootcn-button--outline show');
  expect((await colors(page, open)).bg).not.toBe('rgba(0, 0, 0, 0)');

  await page.hover(plain);
  expect((await colors(page, plain)).bg).not.toBe('rgba(0, 0, 0, 0)');
});
