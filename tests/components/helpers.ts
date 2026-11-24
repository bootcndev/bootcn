import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const bootstrapRoot = resolve(here, '../../node_modules/bootstrap/dist');

const CDN_CSS = '**/bootstrap@5.3.9/dist/css/bootstrap.min.css';
const CDN_JS = '**/bootstrap@5.3.9/dist/js/bootstrap.bundle.min.js';

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

export async function openPreview(
  page: Page,
  name: string,
  kind: PreviewKind = 'components',
): Promise<void> {
  await page.route(CDN_CSS, (route) =>
    route.fulfill({
      path: resolve(bootstrapRoot, 'css/bootstrap.min.css'),
      contentType: 'text/css',
    }),
  );
  await page.route(CDN_JS, (route) =>
    route.fulfill({
      path: resolve(bootstrapRoot, 'js/bootstrap.bundle.min.js'),
      contentType: 'text/javascript',
    }),
  );
  await page.goto(previewUrl(name, kind));
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
