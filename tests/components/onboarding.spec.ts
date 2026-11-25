/**
 * Modals and the onboarding set: stepper, success state, checklist, tour
 * and the onboarding-flow block.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, openPreview } from './helpers.js';

test('modal: autofocus, validation, unsaved-changes guard, submit', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'modal');
  await page.getByRole('button', { name: 'Edit profile' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit profile' });
  await expect(dialog).toBeVisible();
  const name = dialog.getByLabel('Name');
  await expect(name).toBeFocused();

  // Changed, then Escape: asked first.
  await name.fill('');
  await page.keyboard.press('Escape');
  await expect(dialog.getByText('Discard your unsaved changes?')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Keep editing' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Keep editing' }).click();
  await expect(dialog.getByText('Discard your unsaved changes?')).toBeHidden();

  // Invalid: stays open, the field says why.
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toBeFocused();
  await expect(dialog.getByText('Enter your name.')).toBeVisible();

  // Valid: the submit event fires and the modal closes.
  await page.evaluate(() => {
    document.addEventListener('bootcn:modal:submit', (event) => {
      (window as unknown as { saved: string }).saved = String(
        (event as CustomEvent<{ data: FormData }>).detail.data.get('name'),
      );
    });
  });
  await name.fill('Olivia Martin-Lee');
  await expect(name).not.toHaveAttribute('aria-invalid');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => (window as unknown as { saved: string }).saved)).toBe(
    'Olivia Martin-Lee',
  );

  // Discard closes without saving and resets the form.
  await page.getByRole('button', { name: 'Edit profile' }).click();
  await expect(name).toHaveValue('Olivia Martin');
  await name.fill('Someone else');
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await dialog.getByRole('button', { name: 'Discard' }).click();
  await expect(dialog).toBeHidden();
  expect(errors).toEqual([]);
});

test('modal: scrolling body shows shadows', async ({ page }) => {
  await openPreview(page, 'modal');
  await page.getByRole('button', { name: 'Terms of service' }).click();
  const dialog = page.getByRole('dialog', { name: 'Terms of service' });
  await expect(dialog).toBeVisible();
  const content = dialog.locator('.modal-content');
  await page.setViewportSize({ width: 800, height: 420 });
  await dialog.locator('.modal-body').evaluate((el) => el.dispatchEvent(new Event('scroll')));
  await expect(content).toHaveClass(/has-more/);
  await dialog.locator('.modal-body').evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(content).toHaveClass(/is-scrolled/);
  await expect(content).not.toHaveClass(/has-more/);
});

test('stepper: validates, moves, announces and finishes', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'stepper');
  const stepper = page.locator('[data-bootcn-stepper]').first();
  const steps = stepper.getByRole('list', { name: 'Sign-up progress' }).getByRole('listitem');
  await expect(steps.nth(0)).toHaveAttribute('aria-current', 'step');
  await expect(stepper.getByRole('button', { name: 'Back' })).toBeHidden();

  await stepper.getByRole('button', { name: 'Continue' }).click();
  await expect(stepper.getByLabel('Full name')).toHaveAttribute('aria-invalid', 'true');
  await expect(stepper.getByLabel('Full name')).toBeFocused();
  await expect(steps.nth(0)).toHaveAttribute('aria-current', 'step');

  await stepper.getByLabel('Full name').fill('Jackson Lee');
  await stepper.getByLabel('Email').fill('jackson@example.com');
  await page.keyboard.press('Enter');
  await expect(steps.nth(1)).toHaveAttribute('aria-current', 'step');
  await expect(steps.nth(0)).toHaveClass(/is-complete/);
  await expect(steps.nth(0)).toContainText('Completed');
  await expect(stepper.getByRole('heading', { name: 'Pick a plan' })).toBeFocused();
  await expect(stepper.locator('[data-bootcn-stepper-live]')).toHaveText('Step 2 of 3: Plan');

  await stepper.getByRole('button', { name: 'Back' }).click();
  await expect(stepper.getByRole('heading', { name: 'Your details' })).toBeFocused();
  await stepper.getByRole('button', { name: 'Continue' }).click();
  await stepper.getByRole('button', { name: 'Continue' }).click();
  const finish = stepper.getByRole('button', { name: 'Create account' });
  await expect(finish).toBeVisible();
  const finished = page.evaluate(
    () =>
      new Promise<boolean>((resolve) =>
        document.addEventListener('bootcn:stepper:finish', () => resolve(true), { once: true }),
      ),
  );
  await finish.click();
  await expect(stepper.getByText('Agree to the terms to continue.')).toBeVisible();
  await stepper.getByLabel('I agree to the terms of service').check();
  await finish.click();
  expect(await finished).toBe(true);

  // The vertical one shows progress only.
  const vertical = page.locator('.bootcn-stepper--vertical');
  await expect(vertical.locator('[aria-current="step"]')).toContainText('Packed');
  expect(errors).toEqual([]);
});

test('onboarding flow: steps end on the success state', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'onboarding-flow', 'blocks');
  await page.getByLabel('Workspace name').fill('Acme');
  await page.getByLabel('Workspace URL').fill('Acme Inc');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Use lowercase letters, numbers and dashes only.')).toBeVisible();
  await page.getByLabel('Workspace URL').fill('acme');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Your role').selectOption('Design');
  await page.getByText('2–10').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Finish setup' }).click();
  const title = page.getByRole('heading', { name: "You're all set" });
  await expect(title).toBeVisible();
  await expect(title).toBeFocused();
  await expect(page.locator('.bootcn-success')).toHaveClass(/is-playing/);
  await expect(page.getByRole('button', { name: 'Finish setup' })).toBeHidden();
  expect(errors).toEqual([]);
});

test('success state: drawn already under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPreview(page, 'success-state');
  const offset = await page
    .locator('.bootcn-success__tick')
    .evaluate((el) => getComputedStyle(el).strokeDashoffset);
  expect(offset).toMatch(/^0(px)?$/);
  expect(await page.locator('canvas.bootcn-confetti').count()).toBe(0);
});

test('onboarding checklist: toggles, counts, completes and remembers', async ({ page }) => {
  await openPreview(page, 'onboarding-checklist');
  const card = page.getByRole('region', { name: 'Get started' });
  await expect(card.locator('[data-bootcn-checklist-count]')).toHaveText('2 of 5 done');
  const invite = card.getByRole('button', { name: 'Done: Invite your team' });
  await expect(invite).toHaveAttribute('aria-pressed', 'false');
  await invite.click();
  await expect(invite).toHaveAttribute('aria-pressed', 'true');
  await expect(card.locator('[data-bootcn-checklist-count]')).toHaveText('3 of 5 done');
  await expect(card.locator('[data-bootcn-checklist-live]')).toHaveText('3 of 5 done');
  await expect(card.getByRole('progressbar', { name: 'Setup progress' })).toHaveAttribute(
    'value',
    '60',
  );

  const completed = page.evaluate(
    () =>
      new Promise<boolean>((resolve) =>
        document.addEventListener('bootcn:checklist:complete', () => resolve(true), {
          once: true,
        }),
      ),
  );
  await card.getByRole('link', { name: 'Browse apps' }).click();
  await card.getByRole('button', { name: 'Done: Create your first project' }).click();
  expect(await completed).toBe(true);
  await expect(card.getByText("You're all set. You can dismiss this list.")).toBeVisible();

  await card.getByRole('button', { name: 'Show tasks' }).click();
  await expect(card.getByRole('button', { name: 'Show tasks' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await expect(card.getByRole('list')).toBeHidden();

  // Remembered with data-storage-key.
  await page.evaluate(() => {
    const root = document.querySelector('[data-bootcn-checklist]')!;
    root.setAttribute('data-storage-key', 'test-checklist');
    const api = (
      window as unknown as {
        Bootcn: { checklist: { undo: (r: Element, id: string) => void } };
      }
    ).Bootcn.checklist;
    api.undo(root, 'project');
  });
  await card.getByRole('button', { name: 'Dismiss the checklist' }).click();
  await expect(card).toBeHidden();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('test-checklist')!));
  expect(stored.dismissed).toBe(true);
  expect(stored.done).not.toContain('project');
  expect(stored.done).toContain('invite');
});

test('tour: spotlight, steps, keyboard and focus return', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'tour');
  const start = page.getByRole('button', { name: 'Take the tour' });
  await start.click();
  const card = page.getByRole('dialog', { name: 'Search everything' });
  await expect(card).toBeVisible();
  await expect(card).toBeFocused();
  await expect(card.getByText('1 of 3')).toBeVisible();
  await expect(card.getByRole('button', { name: 'Back' })).toBeHidden();

  // The spotlight surrounds the step's element.
  const target = await page.getByRole('button', { name: 'Search' }).first().boundingBox();
  const spot = await page.locator('.bootcn-tour__spotlight').boundingBox();
  await expect
    .poll(async () => (await page.locator('.bootcn-tour__spotlight').boundingBox())!.x)
    .toBeCloseTo(target!.x - 6, 0);
  expect(spot!.width).toBeGreaterThan(target!.width);

  await card.getByRole('button', { name: 'Next' }).click();
  const second = page.getByRole('dialog', { name: 'Start a project' });
  await expect(second.getByText('2 of 3')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  const third = page.getByRole('dialog', { name: 'Stay in the loop' });
  await expect(third.getByRole('button', { name: 'Done' })).toBeVisible();

  // Tab stays in the card.
  for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
  expect(
    await page.evaluate(() => Boolean(document.activeElement?.closest('.bootcn-tour__card'))),
  ).toBe(true);

  const ended = page.evaluate(
    () =>
      new Promise<boolean>((resolve) =>
        document.addEventListener(
          'bootcn:tour:end',
          (event) => resolve((event as CustomEvent<{ completed: boolean }>).detail.completed),
          { once: true },
        ),
      ),
  );
  await third.getByRole('button', { name: 'Done' }).click();
  expect(await ended).toBe(true);
  await expect(page.locator('[data-bootcn-tour]')).toBeHidden();
  await expect(start).toBeFocused();

  await start.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-bootcn-tour]')).toBeHidden();
  expect(errors).toEqual([]);
});
