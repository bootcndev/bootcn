/**
 * Spotlight search, the reviews block and the feedback component.
 */
import { expect, test } from '@playwright/test';

import { expectNoAxeViolations, openPreview } from './helpers.js';

test('spotlight: Ctrl/⌘ K, grouped results, keyboard, select and focus return', async ({
  page,
}) => {
  await openPreview(page, 'spotlight');
  // axe reads colours from the start of the dialog's fade-in; without motion
  // it sees the real ones (checked: the muted text is #6b6b73, 4.9:1).
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const trigger = page.getByRole('button', { name: /Search…/ });
  await trigger.focus();
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: 'Search' });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole('combobox', { name: 'Search' });
  await expect(input).toBeFocused();
  // Empty: the suggestions.
  await expect(dialog.getByRole('group', { name: 'Suggestions' }).getByRole('option')).toHaveCount(
    3,
  );
  await expectNoAxeViolations(page);

  // Accents and case are ignored; titles starting with the query come first.
  await input.fill('MA');
  const people = dialog.getByRole('group', { name: 'People' }).getByRole('option');
  await expect(people).toHaveText([/Marco Bianchi/, /Ava Martinez/]);
  await expect(dialog.getByRole('group', { name: 'Files' })).toBeVisible();
  await expect(page.locator('[data-spotlight-status]')).toHaveText('3 results');
  await expect(people.first()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(people.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(input).toHaveAttribute(
    'aria-activedescendant',
    (await people.nth(1).getAttribute('id'))!,
  );

  await input.fill('zzz');
  await expect(dialog.getByRole('option')).toHaveCount(0);
  await expect(dialog.getByText('No results for “zzz”.')).toBeVisible();

  // An action: cancel the event and run it yourself.
  await page.evaluate(() => {
    document.addEventListener('bootcn:spotlight:select', (event) => {
      event.preventDefault();
      (window as unknown as { picked: string }).picked = (event as CustomEvent).detail.value;
    });
  });
  await input.fill('invite');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => (window as unknown as { picked: string }).picked)).toBe(
    'invite',
  );

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('spotlight: your own source and recent picks', async ({ page }) => {
  await openPreview(page, 'spotlight');
  await page.evaluate(() => {
    const api = (
      window as unknown as {
        Bootcn: {
          spotlight: { register: (root: Element | null, source: (q: string) => unknown) => void };
        };
      }
    ).Bootcn.spotlight;
    api.register(document.querySelector('[data-bootcn-spotlight]'), (query: string) =>
      Promise.resolve([{ group: 'Invoices', title: `Invoice for ${query}`, value: 'inv' }]),
    );
  });
  await page.getByRole('button', { name: /Search…/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Search' });
  await dialog.getByRole('combobox').fill('acme');
  await expect(dialog.getByRole('group', { name: 'Invoices' })).toContainText('Invoice for acme');

  // Picking a link remembers it for next time.
  await dialog.getByRole('combobox').fill('billing');
  await dialog.getByRole('option', { name: /Billing/ }).click();
  await expect(page).toHaveURL(/#billing$/);
  await page.getByRole('button', { name: /Search…/ }).click();
  await expect(dialog.getByRole('group', { name: 'Recent' })).toContainText('Billing');
});

test('reviews: filter by stars, sort, vote and write a review', async ({ page }) => {
  await openPreview(page, 'reviews', 'blocks');
  const reviews = page.locator('.bootcn-reviews__item:visible');
  await expect(reviews).toHaveCount(5);
  await expectNoAxeViolations(page);

  await page.getByRole('button', { name: /^5 stars/ }).click();
  await expect(reviews).toHaveCount(3);
  await expect(page.locator('[data-reviews-showing]')).toHaveText('Showing 3 reviews');
  await page.getByRole('button', { name: /^5 stars/ }).click();
  await expect(reviews).toHaveCount(5);

  await page.getByLabel('Sort by').selectOption('low');
  await expect(reviews.first()).toContainText('Good start, reports need work');

  const vote = reviews.first().getByRole('button', { name: /Yes, helpful/ });
  await vote.click();
  await expect(vote).toHaveAttribute('aria-pressed', 'true');
  await expect(vote).toContainText('7');

  await page.getByRole('button', { name: 'Write a review' }).click();
  const dialog = page.getByRole('dialog', { name: 'Write a review' });
  await dialog.getByRole('button', { name: 'Post review' }).click();
  await expect(dialog.getByText('Choose a rating.')).toBeVisible();
  await expect(dialog.getByText('Write at least 20 characters.')).toBeVisible();
  await dialog.getByText('4 stars').click({ force: true });
  await dialog.getByLabel('Your review').fill('Solid tool, the reports finally export to PDF.');
  await dialog.getByLabel('Your name').fill('Grace Lee');
  await dialog.getByRole('button', { name: 'Post review' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-reviews-total]')).toHaveText('129');
  await expect(
    page.getByRole('heading', { name: 'Solid tool, the reports finally export to PDF' }),
  ).toBeFocused();
  await expect(page.locator('[data-reviews-status]')).toHaveText('Thanks, your review was added.');
});

test('feedback: widget and "Was this page helpful?"', async ({ page }) => {
  await openPreview(page, 'feedback');
  await expectNoAxeViolations(page);

  // Inline.
  const inline = page.locator('[data-bootcn-feedback-inline]');
  await inline.getByRole('button', { name: 'Yes' }).click();
  await expect(inline.getByLabel('What did you find useful?')).toBeFocused();
  await inline.getByLabel('What did you find useful?').fill('The examples.');
  await inline.getByRole('button', { name: 'Send' }).click();
  await expect(inline.getByText('Thanks for letting us know.')).toBeFocused();

  // Widget.
  await page.evaluate(() => {
    document.addEventListener('bootcn:feedback:submit', (event) => {
      (window as unknown as { sent: unknown }).sent = (event as CustomEvent).detail;
    });
  });
  const toggle = page.getByRole('button', { name: 'Feedback', exact: true });
  await toggle.click();
  const panel = page.getByRole('dialog', { name: 'How is your experience?' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('radio', { name: 'Terrible' })).toBeFocused();
  await panel.getByRole('button', { name: 'Send feedback' }).click();
  await expect(panel.getByText('Pick how you feel first.')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(panel.getByRole('radio', { name: 'Okay' })).toBeChecked();
  await panel.getByLabel('Tell us more (optional)').fill('Dark mode please.');
  await panel.getByLabel('You can contact me about this').check();
  await panel.getByLabel('Email').fill('grace@example.com');
  await panel.getByRole('button', { name: 'Send feedback' }).click();
  await expect(panel.getByText('Thanks for your feedback!')).toBeVisible();
  const sent = await page.evaluate(
    () => (window as unknown as { sent: Record<string, unknown> }).sent,
  );
  expect(sent).toMatchObject({
    rating: 3,
    label: 'Okay',
    comment: 'Dark mode please.',
    email: 'grace@example.com',
  });
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();
});
