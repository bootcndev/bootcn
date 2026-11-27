/**
 * Flow builder: nested lists of steps with branches, add/remove, zoom.
 */
import { expect, test } from '@playwright/test';

import { expectNoAxeViolations, openPreview } from './helpers.js';

const node = (id: string) => `.bootcn-flow__node[data-id="${id}"]`;

test('flow builder: select, arrow keys, add from the menu, remove', async ({ page }) => {
  await openPreview(page, 'flow-builder');
  const flow = page.locator('[data-bootcn-flow]');
  await expect(flow.getByRole('list', { name: 'Welcome sequence' })).toBeVisible();
  await expect(flow.locator('.bootcn-flow__node')).toHaveCount(9);
  await expectNoAxeViolations(page);

  // Selecting.
  await page.locator(node('email-1')).click();
  await expect(page.locator(node('email-1'))).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(node('email-2b'))).toHaveAttribute('aria-pressed', 'false');

  // Arrow keys follow the drawing: down the sequence, across branches.
  await page.keyboard.press('ArrowDown');
  await expect(page.locator(node('wait-1'))).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator(node('email-2a'))).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(node('email-2b'))).toBeFocused();

  // The + after "3 days" names its place and opens a menu of steps.
  const add = page.getByRole('button', { name: 'Add a step after 3 days' });
  await add.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu', { name: 'Add a step' });
  await expect(menu.getByRole('menuitem')).toHaveCount(4);
  await expect(menu.getByRole('menuitem', { name: 'Send an email' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(add).toBeFocused();

  await page.keyboard.press('Enter');
  await page.keyboard.press('End');
  await expect(menu.getByRole('menuitem', { name: 'Condition (yes or no)' })).toBeFocused();
  await page.keyboard.press('Enter');
  const added = flow.locator('.bootcn-flow__node[aria-pressed="true"]');
  await expect(added).toContainText('Opened the last email');
  await expect(added).toBeFocused();
  await expect(page.locator('[data-bootcn-flow-status]')).toHaveText(
    'Added: Opened the last email',
  );

  // The steps that followed moved into its Yes branch.
  const tree = await page.evaluate(() => {
    const root = document.querySelector('[data-bootcn-flow]')!;
    type Step = { kind: string; title?: string; branches?: { label: string; steps: Step[] }[] };
    const flowApi = (window as unknown as { Bootcn: { flow: { toJSON(el: Element): Step[] } } })
      .Bootcn.flow;
    const steps = flowApi.toJSON(root);
    const no = steps[3]!.branches![1]!.steps;
    const inserted = no[2]!;
    return {
      after: no.map((step) => step.kind),
      yes: inserted.branches![0]!.steps.map((step) => step.title ?? step.kind),
      no: inserted.branches![1]!.steps.map((step) => step.kind),
    };
  });
  expect(tree).toEqual({
    after: ['email', 'wait', 'condition'],
    yes: ['Clicked a link'],
    no: ['end'],
  });

  // Delete removes a step; the trigger stays.
  await page.locator(node('wait-1')).focus();
  await page.keyboard.press('Delete');
  await expect(page.locator(node('wait-1'))).toHaveCount(0);
  await expect(page.locator('[data-bootcn-flow-status]')).toHaveText('Removed: 2 days');
  await expect(page.locator(node('email-1'))).toBeFocused();
  await page.locator(node('trigger')).focus();
  await page.keyboard.press('Delete');
  await expect(page.locator(node('trigger'))).toHaveCount(1);
  await expectNoAxeViolations(page);
});

test('flow builder: zoom buttons and fit', async ({ page }) => {
  await openPreview(page, 'flow-builder');
  const zoom = page.locator('.bootcn-flow__zoom');
  await expect(zoom).toHaveText('100%');
  await page.getByRole('button', { name: 'Zoom out' }).click();
  await expect(zoom).toHaveText('90%');
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(zoom).toHaveText('110%');
  await page.getByRole('button', { name: 'Fit to screen' }).click();
  const fitted = Number((await zoom.textContent())!.replace('%', ''));
  expect(fitted).toBeLessThan(100);
  expect(fitted).toBeGreaterThanOrEqual(40);
});
