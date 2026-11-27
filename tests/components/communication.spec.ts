/**
 * Communication pack: the chat and the email inbox.
 */
import { expect, test } from '@playwright/test';

import { expectNoAxeViolations, openPreview } from './helpers.js';

test('chat: switch conversations, send safely, receive, react', async ({ page }) => {
  await openPreview(page, 'chat', 'blocks');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const chat = page.locator('[data-bootcn-chat]');
  await expect(chat.getByRole('log', { name: 'Messages with Lena Fischer' })).toBeVisible();
  await expectNoAxeViolations(page);

  // Opening the design team clears its unread count.
  const team = chat.getByRole('link', { name: /Design team/ });
  await expect(team).toContainText('2');
  await team.click();
  await expect(team).toHaveAttribute('aria-current', 'true');
  await expect(team.locator('[data-chat-unread]')).toHaveCount(0);
  await expect(chat.getByRole('log', { name: 'Messages with Design team' })).toBeVisible();
  await expect(chat.getByLabel('Message Design team')).toBeFocused();

  // Back to Lena; Enter sends, and text stays text.
  await chat.getByRole('link', { name: /Lena Fischer/ }).click();
  const input = chat.getByLabel('Message Lena Fischer');
  await input.fill('Bring <b>snacks</b>');
  await input.press('Enter');
  const log = chat.getByRole('log', { name: 'Messages with Lena Fischer' });
  await expect(log.locator('.bootcn-chat__message--me').last()).toContainText(
    'Bring <b>snacks</b>',
  );
  await expect(log.locator('b')).toHaveCount(0);
  await expect(input).toHaveValue('');
  await expect(chat.getByRole('link', { name: /Lena Fischer/ })).toContainText('You: Bring');

  // The demo reply arrives after "is typing".
  await expect(chat.getByText('Lena is typing…')).toBeVisible();
  await expect(log.locator('.bootcn-chat__message').last()).toContainText('Sounds good!');
  await expect(chat.getByText('Lena is typing…')).toBeHidden();

  // A reaction from the picker, then undone from its chip.
  const react = log.locator('[data-chat-react]').last();
  await react.click();
  await expect(chat.getByRole('menu', { name: 'Reactions' })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(react).toBeFocused();
  const chip = log.locator('.bootcn-chat__message').last().locator('[data-chat-reaction]');
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await chip.click();
  await expect(chip).toHaveCount(0);
});

test('chat: one pane at a time when narrow', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await openPreview(page, 'chat', 'blocks');
  const chat = page.locator('[data-bootcn-chat]');
  await expect(chat.locator('.bootcn-chat__thread')).toBeHidden();
  await chat.getByRole('link', { name: /Marco Bianchi/ }).click();
  await expect(chat.locator('.bootcn-chat__sidebar')).toBeHidden();
  await chat.getByRole('button', { name: 'Back to conversations' }).click();
  await expect(chat.getByRole('link', { name: /Marco Bianchi/ })).toBeFocused();
});

test('email inbox: keys, archive with undo, folders, bulk delete', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await openPreview(page, 'email-inbox', 'blocks');
  const inbox = page.locator('[data-bootcn-inbox]');
  const list = inbox.getByRole('list', { name: 'Inbox' });
  const shown = list.locator('.bootcn-inbox__row:visible');
  await expect(shown).toHaveCount(7);
  await expectNoAxeViolations(page);

  // j opens the next message and marks it read.
  await inbox.getByRole('link', { name: /Lena Fischer/ }).focus();
  await page.keyboard.press('j');
  await expect(inbox.getByRole('heading', { name: 'Your invoice for November' })).toBeVisible();
  await expect(inbox.getByRole('link', { name: /Northwind Billing/ })).toBeFocused();
  await expect(inbox.locator('[data-inbox-count]')).toHaveText('2 unread');

  // e archives; Undo brings it back.
  await page.keyboard.press('e');
  await expect(inbox.getByRole('status')).toHaveText('Archived 1 message');
  await expect(shown).toHaveCount(6);
  await inbox.getByRole('button', { name: 'Undo' }).click();
  await expect(shown).toHaveCount(7);

  // s stars; the Starred folder shows it.
  await page.keyboard.press('s');
  await inbox.getByRole('link', { name: 'Starred' }).click();
  await expect(
    inbox.getByRole('list', { name: 'Starred' }).locator('.bootcn-inbox__row:visible'),
  ).toHaveCount(3);
  await inbox.getByRole('link', { name: /^Inbox/ }).click();

  // Bulk: select two and delete them.
  const bulkDelete = inbox.getByRole('button', { name: 'Delete selected' });
  await expect(bulkDelete).toBeDisabled();
  await inbox.getByRole('checkbox', { name: /Select: Marco Bianchi/ }).check();
  await inbox.getByRole('checkbox', { name: /Select: Mountain Club/ }).check();
  // page.evaluate, not toHaveJSProperty: that crashes Firefox's page in CI.
  expect(
    await page.evaluate(
      () => document.querySelector<HTMLInputElement>('[data-inbox-select-all]')!.indeterminate,
    ),
  ).toBe(true);
  await bulkDelete.click();
  await expect(inbox.getByRole('status')).toHaveText('Moved 2 messages to Trash');
  await expect(shown).toHaveCount(5);
  await inbox.getByRole('link', { name: 'Trash' }).click();
  await expect(
    inbox.getByRole('list', { name: 'Trash' }).locator('.bootcn-inbox__row:visible'),
  ).toHaveCount(2);
});

test('email inbox: compose checks the address and files the message in Sent', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await openPreview(page, 'email-inbox', 'blocks');
  const inbox = page.locator('[data-bootcn-inbox]');
  await inbox.getByRole('link', { name: /Lena Fischer/ }).focus();
  await page.keyboard.press('c');
  const dialog = page.getByRole('dialog', { name: 'New message' });
  await expect(dialog.getByLabel('To')).toBeFocused();
  await dialog.getByLabel('To').fill('not an address');
  await dialog.getByRole('button', { name: 'Send' }).click();
  await expect(dialog.getByText('Enter an email address')).toBeVisible();
  await dialog.getByLabel('To').fill('grace@example.com');
  await dialog.getByLabel('Subject').fill('Lunch on Friday?');
  await dialog.getByLabel('Message').fill('Shall we try the new place?');
  await dialog.getByRole('button', { name: 'Send' }).click();
  await expect(dialog).toBeHidden();
  await expect(inbox.getByRole('status')).toHaveText('Message sent');
  await inbox.getByRole('link', { name: 'Sent' }).click();
  await expect(inbox.getByRole('list', { name: 'Sent' })).toContainText('Lunch on Friday?');
});

test('email inbox: the reader replaces the list when narrow', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await openPreview(page, 'email-inbox', 'blocks');
  const inbox = page.locator('[data-bootcn-inbox]');
  await expect(inbox.locator('[data-inbox-reader]')).toBeHidden();
  await inbox.getByRole('link', { name: /Ava Martinez/ }).click();
  await expect(inbox.getByRole('heading', { name: 'Onboarding emails, draft 2' })).toBeVisible();
  await expect(inbox.getByRole('list', { name: 'Inbox' })).toBeHidden();
  await inbox.getByRole('button', { name: 'Back to the list' }).click();
  await expect(inbox.getByRole('link', { name: /Ava Martinez/ })).toBeFocused();
});
