/**
 * Registry 0.36: tree, share card, signature pad and the context menu's
 * submenus and checkable items.
 */
import { expect, test } from '@playwright/test';

import { collectErrors, openPreview } from './helpers.js';

test('tree: keyboard, expand, select and on-demand children', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'tree');
  const tree = page.getByRole('tree', { name: 'Files' });
  const item = (name: string) => tree.locator(`[data-value="${name}"]`);
  // One item in the Tab order: the selected one.
  await expect(tree.locator('[tabindex="0"]')).toHaveCount(1);
  await expect(item('Dialog.html')).toHaveAttribute('tabindex', '0');

  await item('Dialog.html').focus();
  await page.keyboard.press('ArrowDown');
  await expect(item('Tree.html')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(item('styles')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(item('styles')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(item('tokens.css')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(item('styles')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(item('styles')).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Home');
  await expect(item('src')).toBeFocused();
  await page.keyboard.press('End');
  await expect(item('README.md')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(item('README.md')).toHaveAttribute('aria-selected', 'true');
  await expect(item('Dialog.html')).toHaveAttribute('aria-selected', 'false');

  // vendor loads its children the first time it opens.
  await item('vendor').focus();
  await page.keyboard.press('ArrowRight');
  await expect(item('vendor')).toHaveAttribute('aria-busy', 'true');
  await expect(item('vendor').getByRole('treeitem')).toHaveCount(2);
  await expect(item('vendor')).not.toHaveAttribute('aria-busy');
  expect(errors).toEqual([]);
});

test('tree: checkboxes with a partial state', async ({ page }) => {
  await openPreview(page, 'tree');
  const tree = page.getByRole('tree', { name: 'Permissions' });
  const item = (name: string) => tree.locator(`[data-value="${name}"]`);
  await expect(item('Projects')).toHaveAttribute('aria-checked', 'mixed');
  await item('Delete projects').locator('.bootcn-tree__label').click();
  await expect(item('Projects')).toHaveAttribute('aria-checked', 'true');
  await item('Billing').focus();
  await page.keyboard.press('Space');
  await expect(item('Billing')).toHaveAttribute('aria-checked', 'true');
  await expect(item('Change plan')).toHaveAttribute('aria-checked', 'true');
  const checked = await page.evaluate(() =>
    (
      window as unknown as { Bootcn: { tree: { checked: (r: Element) => string[] } } }
    ).Bootcn.tree.checked(document.querySelectorAll('[data-bootcn-tree]')[1]!),
  );
  expect(checked).toEqual([
    'View projects',
    'Create projects',
    'Delete projects',
    'View invoices',
    'Change plan',
    'Invite members',
  ]);
});

test('share card: links, copy and the share sheet', async ({ page, context, browserName }) => {
  const errors = collectErrors(page);
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openPreview(page, 'share-card');
  const card = page.getByRole('region', { name: 'Share this post' });
  const url = 'https://acme.example/blog/launch-week';
  await expect(card.getByRole('link', { name: /^LinkedIn/ })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url),
  );
  await expect(card.getByRole('link', { name: /^X/ })).toHaveAttribute(
    'href',
    /x\.com\/intent\/post\?url=.+&text=Launch%20week/,
  );
  await expect(card.getByRole('link', { name: /^Email/ })).toHaveAttribute(
    'href',
    /^mailto:\?subject=Launch%20week/,
  );
  await expect(card.getByRole('link', { name: /^WhatsApp/ })).toHaveAttribute('target', '_blank');
  await expect(card.getByRole('link', { name: /^WhatsApp/ })).toHaveAccessibleName(
    'WhatsApp (opens in a new tab)',
  );
  if (browserName === 'chromium') {
    await card.getByRole('button', { name: 'Copy' }).click();
    await expect(card.getByRole('button', { name: 'Copied' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);
  }
  // "More options" shows only where the browser has a share sheet.
  const hasShare = await page.evaluate(() => 'share' in navigator);
  const native = card.locator('[data-bootcn-share-native]');
  if (hasShare) await expect(native).toBeVisible();
  else await expect(native).toBeHidden();
  expect(errors).toEqual([]);
});

test('signature pad: draw, undo, type, required', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'signature-pad');
  const pad = page.locator('[data-bootcn-signature]');
  const value = pad.locator('[name="signature"]');

  // Empty and required: the submit is stopped with a message.
  await page.getByRole('button', { name: 'Sign and continue' }).click();
  await expect(page.getByRole('alert')).toHaveText('Sign above to continue.');
  await expect(page.getByRole('tab', { name: 'Draw' })).toBeFocused();

  const canvas = page.getByRole('img', { name: /Signature drawing area/ });
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + 100);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++)
    await page.mouse.move(box.x + 30 + i * 12, box.y + 100 - Math.sin(i / 3) * 30);
  await page.mouse.up();
  await expect(value).toHaveValue(/^data:image\/png;base64,/);
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(pad.getByRole('button', { name: 'Undo' })).toBeEnabled();
  const svg = await pad.evaluate((el) =>
    (
      window as unknown as {
        Bootcn: { signature: { toDataURL: (r: Element, t: string) => string } };
      }
    ).Bootcn.signature.toDataURL(el, 'svg'),
  );
  expect(decodeURIComponent(svg)).toContain('<path d="M');

  await pad.getByRole('button', { name: 'Undo' }).click();
  await expect(value).toHaveValue('');
  await expect(pad.locator('[data-bootcn-signature-live]')).toHaveText('Last stroke removed.');

  // Typing: the keyboard way to sign.
  await page.getByRole('tab', { name: 'Draw' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Type' })).toHaveAttribute('aria-selected', 'true');
  await page.getByLabel('Type your full name').fill('Olivia Martin');
  await expect(value).toHaveValue(/^data:image\/png;base64,/);
  await page.getByRole('button', { name: 'Sign and continue' }).click();
  await expect(page.getByRole('img', { name: 'Your signature' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('context menu: submenu, checkable and radio items', async ({ page }) => {
  const errors = collectErrors(page);
  await openPreview(page, 'context-menu');
  const target = page.getByRole('button', { name: 'report.pdf' });
  const menu = page.getByRole('menu', { name: 'File actions' });
  await target.focus();
  await page.keyboard.press('Shift+F10');
  const share = menu.getByRole('menuitem', { name: 'Share' });
  await expect(share).toHaveAttribute('aria-haspopup', 'menu');
  await expect(menu.getByRole('menuitem', { name: /Open/ })).toHaveAttribute(
    'aria-keyshortcuts',
    'Meta+O',
  );
  await page.keyboard.press('s');
  await expect(share).toBeFocused();
  await page.keyboard.press('ArrowRight');
  const sub = page.getByRole('menu', { name: 'Share' });
  await expect(sub).toBeVisible();
  await expect(share).toHaveAttribute('aria-expanded', 'true');
  await expect(sub.getByRole('menuitem', { name: /Copy link/ })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(sub).toBeHidden();
  await expect(share).toBeFocused();

  const hidden = menu.getByRole('menuitemcheckbox', { name: 'Show hidden files' });
  await expect(hidden).toHaveAttribute('aria-checked', 'false');
  await hidden.click();
  await expect(hidden).toHaveAttribute('aria-checked', 'true');
  await expect(menu).toBeVisible(); // stays open
  const group = menu.getByRole('group', { name: 'Sort by' });
  await group.getByRole('menuitemradio', { name: 'Size' }).click();
  await expect(group.getByRole('menuitemradio', { name: 'Size' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(group.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute(
    'aria-checked',
    'false',
  );

  await share.click();
  await sub.getByRole('menuitem', { name: 'Email' }).click();
  await expect(menu).toBeHidden();
  await expect(target).toBeFocused();
  expect(errors).toEqual([]);
});
