/**
 * Phase G1, AI chat: code block, conversation, prompt input and the AI chat
 * block that connects them.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, expectNoAxeViolations, openPreview } from './helpers.js';

/** Bootcn's global APIs, as the tests call them inside the page. */
type Api = (...args: unknown[]) => HTMLElement;
type BootcnWindow = {
  Bootcn: { conversation: Record<string, Api>; promptInput: Record<string, Api> };
};

test.describe('code block', () => {
  test('copies the code without line numbers and announces it', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'code-block');
    const numbered = page.locator('[data-bootcn-code-block]').nth(1);
    const lines = numbered.locator('.bootcn-code-block__line');
    await expect(lines).toHaveCount(6);
    // Each line starts at the left edge: no indentation leaked into <pre>.
    const lefts = await lines.evaluateAll((spans) =>
      spans.map((span) => Math.round(span.getBoundingClientRect().left)),
    );
    expect(new Set(lefts).size).toBe(1);

    const copied = page.evaluate(
      () =>
        new Promise<string>((resolve) =>
          document.addEventListener(
            'bootcn:code-block:copy',
            (event) => resolve((event as CustomEvent<{ text: string }>).detail.text),
            { once: true },
          ),
        ),
    );
    await numbered.getByRole('button', { name: 'Copy code' }).click();
    const text = await copied;
    expect(text.split('\n')).toHaveLength(6);
    expect(text.startsWith('<?php\n$name')).toBe(true);
    await expect(numbered.locator('[data-bootcn-code-block-status]')).toHaveText(
      'Copied to the clipboard.',
    );
    await expect(numbered.getByRole('button', { name: 'Copy code' })).toHaveClass(/is-copied/);
    await expectNoAxeViolations(page);
    expect(errors).toEqual([]);
  });
});

test.describe('conversation', () => {
  test('messages, actions, feedback and the scroll-to-latest button', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'conversation');
    const log = page.getByRole('log', { name: 'Messages' });
    await expect(log.locator('.bootcn-message:not([hidden])')).toHaveCount(4);
    await expectNoAxeViolations(page);

    // Starts at the latest message.
    const latest = page.getByRole('button', { name: 'Scroll to the latest message' });
    await expect(latest).toBeHidden();

    // Feedback buttons are exclusive toggles.
    const last = log
      .locator('.bootcn-message--assistant:not([data-bootcn-conversation-typing])')
      .last();
    const up = last.getByRole('button', { name: 'Good response' });
    const down = last.getByRole('button', { name: 'Bad response' });
    await up.click();
    await expect(up).toHaveAttribute('aria-pressed', 'true');
    await down.click();
    await expect(up).toHaveAttribute('aria-pressed', 'false');
    await expect(down).toHaveAttribute('aria-pressed', 'true');
    await down.click();
    await expect(down).toHaveAttribute('aria-pressed', 'false');

    await last.getByRole('button', { name: 'Copy', exact: true }).click();
    await expect(page.locator('[data-bootcn-conversation-status]')).toHaveText(
      'Copied to the clipboard.',
    );

    // Scrolled up: the button appears and brings the reader back.
    await log.evaluate((element) => element.scrollTo({ top: 0 }));
    await expect(latest).toBeVisible();
    await latest.click();
    await expect(latest).toBeHidden();
    await expect(log).toBeFocused();
    expect(errors).toEqual([]);
  });

  test('append, setText and setTyping', async ({ page }) => {
    await openPreview(page, 'conversation');
    const log = page.getByRole('log', { name: 'Messages' });
    await page.evaluate(() => {
      const root = document.querySelector('[data-bootcn-conversation]') as HTMLElement;
      const api = (window as unknown as BootcnWindow).Bootcn.conversation;
      api.append!(root, { role: 'user', text: '<b>not bold</b>' });
      api.setTyping!(root, true);
    });
    await expect(log).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('[data-bootcn-conversation-typing]')).toBeVisible();
    const user = log.locator('.bootcn-message--user').last();
    await expect(user.locator('.bootcn-message__content')).toHaveText('<b>not bold</b>');
    await expect(user.locator('b')).toHaveCount(0);

    await page.evaluate(() => {
      const root = document.querySelector('[data-bootcn-conversation]') as HTMLElement;
      const api = (window as unknown as BootcnWindow).Bootcn.conversation;
      const reply = api.append!(root, { role: 'assistant', text: '' });
      api.setText!(reply, 'First paragraph.\n\nSecond paragraph.');
      api.setTyping!(root, false);
    });
    await expect(log).not.toHaveAttribute('aria-busy', 'true');
    const reply = log.locator('.bootcn-message--assistant:not([hidden])').last();
    await expect(reply.locator('.bootcn-message__content p')).toHaveText([
      'First paragraph.',
      'Second paragraph.',
    ]);
    await expect(reply.getByRole('button', { name: 'Regenerate' })).toBeVisible();
    // The new reply is in view.
    await expect(reply).toBeInViewport();
  });
});

test.describe('prompt input', () => {
  test('Enter sends, Shift+Enter adds a line, suggestions fill the box', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'prompt-input');
    const box = page.getByRole('textbox', { name: 'Message' });
    const send = page.getByRole('button', { name: 'Send' });
    await expect(send).toBeDisabled();
    await expectNoAxeViolations(page);

    await box.fill('Hello');
    await expect(send).toBeEnabled();
    await box.press('Shift+Enter');
    await box.pressSequentially('world');
    await expect(box).toHaveValue('Hello\nworld');

    const submitted = page.evaluate(
      () =>
        new Promise<string>((resolve) =>
          document.addEventListener(
            'bootcn:prompt-input:submit',
            (event) => resolve((event as CustomEvent<{ text: string }>).detail.text),
            { once: true },
          ),
        ),
    );
    await box.press('Enter');
    expect(await submitted).toBe('Hello\nworld');
    await expect(box).toHaveValue('');
    await expect(send).toBeDisabled();
    await expect(page).toHaveURL(/preview\.html$/); // no page load

    await page.getByRole('button', { name: 'Explain dark mode' }).click();
    await expect(box).toHaveValue('Explain dark mode');
    await expect(box).toBeFocused();
    expect(errors).toEqual([]);
  });

  test('attachments: list, remove with focus kept, file input in step', async ({ page }) => {
    await openPreview(page, 'prompt-input');
    const input = page.getByLabel('Attach files');
    await input.setInputFiles([
      { name: 'report.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(2048) },
      { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') },
    ]);
    const list = page.getByRole('list', { name: 'Attachments' });
    await expect(list.getByRole('listitem')).toHaveCount(2);
    await expect(list.getByRole('listitem').first()).toContainText('report.pdf');
    await expect(list.getByRole('listitem').first()).toContainText('2 KB');
    await expect(page.locator('[data-bootcn-prompt-status]')).toHaveText('2 files attached.');
    await expect(page.getByRole('button', { name: 'Send' })).toBeEnabled();
    await expectNoAxeViolations(page);

    await page.getByRole('button', { name: 'Remove report.pdf' }).click();
    await expect(list.getByRole('listitem')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Remove notes.txt' })).toBeFocused();
    await expect(page.locator('[data-bootcn-prompt-status]')).toHaveText('report.pdf removed.');
    expect(await input.evaluate((element) => (element as HTMLInputElement).files?.length)).toBe(1);

    await page.keyboard.press('Enter');
    await expect(list).toBeHidden();
    await expect(input).toBeFocused();
  });

  test('busy: the send button becomes stop', async ({ page }) => {
    await openPreview(page, 'prompt-input');
    await page.evaluate(() => {
      const form = document.querySelector('[data-bootcn-prompt-input]');
      (window as unknown as BootcnWindow).Bootcn.promptInput.setBusy!(form, true);
    });
    const stop = page.getByRole('button', { name: 'Stop' });
    await expect(stop).toBeEnabled();
    const stopped = page.evaluate(
      () =>
        new Promise<boolean>((resolve) =>
          document.addEventListener('bootcn:prompt-input:stop', () => resolve(true), {
            once: true,
          }),
        ),
    );
    await stop.click();
    expect(await stopped).toBe(true);
  });
});

test.describe('AI chat block', () => {
  test('sends a prompt, shows typing, then the reply; New chat clears', async ({ page }) => {
    const errors = collectErrors(page);
    await openPreview(page, 'ai-chat', 'blocks');
    await expectNoAxeViolations(page);
    const log = page.getByRole('log', { name: 'Messages' });
    const box = page.getByRole('textbox', { name: 'Message' });
    await box.fill('Make a login form');
    await box.press('Enter');

    await expect(log.locator('.bootcn-message--user').last()).toHaveText(/Make a login form/);
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
    await expect(log.locator('.bootcn-message--assistant:not([hidden])').last()).toContainText(
      'sample reply to "Make a login form"',
    );
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    await expect(log).not.toHaveAttribute('aria-busy', 'true');
    await expectNoAxeViolations(page);

    await page.getByRole('button', { name: 'New chat' }).click();
    await expect(log.locator('.bootcn-message:not([hidden])')).toHaveCount(0);
    await expect(box).toBeFocused();
    expect(errors).toEqual([]);
  });

  test('Stop cancels the reply', async ({ page }) => {
    // A controlled clock: the sample reply (900 ms) cannot arrive before Stop.
    await page.clock.install();
    await openPreview(page, 'ai-chat', 'blocks');
    const log = page.getByRole('log', { name: 'Messages' });
    const box = page.getByRole('textbox', { name: 'Message' });
    const before = await log.locator('.bootcn-message--assistant:not([hidden])').count();
    await box.fill('Never mind');
    await box.press('Enter');
    await page.getByRole('button', { name: 'Stop' }).click();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    await page.clock.runFor(2000);
    await expect(log.locator('.bootcn-message--assistant:not([hidden])')).toHaveCount(before);
  });
});
