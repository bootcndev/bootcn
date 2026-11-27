import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const bootstrapRoot = resolve(here, '../../node_modules/bootstrap/dist');

const CDN_CSS = '**/bootstrap@5.3.9/dist/css/bootstrap.min.css';
const CDN_RTL_CSS = '**/bootstrap@5.3.9/dist/css/bootstrap.rtl.min.css';
const CDN_JS = '**/bootstrap@5.3.9/dist/js/bootstrap.bundle.min.js';

// Map tiles are answered locally: tests never reach OpenStreetMap.
const TILES = 'https://tile.openstreetmap.org/**';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

export type PreviewKind = 'components' | 'blocks';

export function previewUrl(name: string, kind: PreviewKind = 'components'): string {
  return `/packages/registry/${kind}/${name}/preview.html`;
}

export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

/** Opens a preview; `query` is e.g. '?dir=rtl' or '?theme=dark'. */
export async function openPreview(
  page: Page,
  name: string,
  kind: PreviewKind = 'components',
  query = '',
): Promise<void> {
  await page.route(CDN_CSS, (route) =>
    route.fulfill({
      path: resolve(bootstrapRoot, 'css/bootstrap.min.css'),
      contentType: 'text/css',
    }),
  );
  await page.route(CDN_RTL_CSS, (route) =>
    route.fulfill({
      path: resolve(bootstrapRoot, 'css/bootstrap.rtl.min.css'),
      contentType: 'text/css',
    }),
  );
  await page.route(CDN_JS, (route) =>
    route.fulfill({
      path: resolve(bootstrapRoot, 'js/bootstrap.bundle.min.js'),
      contentType: 'text/javascript',
    }),
  );
  await page.route(TILES, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG }),
  );
  await page.goto(previewUrl(name, kind) + query);
}

export async function expectNoAxeViolations(
  page: Page,
  options: { disableRules?: string[] } = {},
): Promise<void> {
  const results = await new AxeBuilder({ page }).disableRules(options.disableRules ?? []).analyze();
  const summary = results.violations
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`)
    .join('\n');
  expect(results.violations, summary).toEqual([]);
}

/**
 * Waits until no CSS transition is running (Bootstrap's fade and slide of
 * modals, offcanvas and popovers), so axe measures final colors. Firefox can
 * report an overlay as shown while its fade is still in progress.
 */
export async function settleTransitions(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      document.getAnimations().filter((animation) => animation instanceof CSSTransition).length ===
        0 && !document.querySelector('.showing, .hiding, .collapsing'),
  );
}

/**
 * axe over an open Bootstrap modal, offcanvas or dropdown crashes Firefox's
 * page in CI ("Page crashed", Playwright 1.65). The open state is checked
 * with axe in Chromium and WebKit; Firefox still runs every behaviour
 * assertion. The skip is recorded as a test annotation.
 */
/**
 * Some pages crash Firefox's page in CI while axe runs over them ("Page
 * crashed" inside AxeBuilder.analyze), with no error in the page itself and
 * no way to reproduce it locally. Those tests check axe in Chromium and
 * WebKit; Firefox runs every behaviour assertion. Recorded as an annotation.
 */
export async function expectNoAxeViolationsExceptFirefox(
  page: Page,
  browserName: string,
  reason: string,
): Promise<void> {
  if (browserName === 'firefox') {
    test.info().annotations.push({ type: 'skip-axe', description: reason });
    return;
  }
  await expectNoAxeViolations(page);
}

export async function expectNoAxeViolationsOnOverlay(
  page: Page,
  browserName: string,
  options: { disableRules?: string[] } = {},
): Promise<void> {
  if (browserName === 'firefox') {
    test.info().annotations.push({
      type: 'skip-axe',
      description: 'axe on an open overlay crashes Firefox; covered in Chromium and WebKit',
    });
    return;
  }
  await settleTransitions(page);
  await expectNoAxeViolations(page, options);
}
