/**
 * Docs site (apps/docs) as deployed: built into _site next to the registry
 * JSON and served under /bootcn/.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

interface IndexItem {
  name: string;
  type: string;
  title: string;
}
interface Item {
  files: { path: string; type: string }[];
}

const SITE = resolve(import.meta.dirname, '../../_site');
const index = JSON.parse(readFileSync(resolve(SITE, 'index.json'), 'utf8')) as {
  items: IndexItem[];
};
const components = index.items.filter((item) => item.type === 'registry:ui');
const blocks = index.items.filter((item) => item.type === 'registry:block');
const templates = index.items.filter((item) => item.type === 'registry:template');
const sized = [
  ...components.map((item) => ({ item, kind: 'components' })),
  ...blocks.map((item) => ({ item, kind: 'blocks' })),
];

function readItem(name: string): Item {
  return JSON.parse(readFileSync(resolve(SITE, 'r', `${name}.json`), 'utf8')) as Item;
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.addInitScript((value) => {
    localStorage.setItem('vitepress-theme-appearance', value);
  }, theme);
}

async function expectAccessible(page: Page): Promise<void> {
  // Previews are tested on their own (tests/components); scope this to the docs UI.
  const results = await new AxeBuilder({ page }).exclude('iframe').analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

test('the registry JSON is served next to the docs', async ({ request }) => {
  const response = await request.get('index.json');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('application/json');
  expect(((await response.json()) as { items: unknown[] }).items.length).toBe(index.items.length);
});

test('home page links to the guide and the components', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bootcn');
  await page.getByRole('link', { name: 'Browse components' }).click();
  await expect(page).toHaveURL(/\/bootcn\/components\/$/);
  for (const item of components) {
    await expect(
      page.locator('.vp-doc').getByRole('link', { name: item.title, exact: true }),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});

for (const { item, kind } of sized) {
  test(`${kind} page: ${item.name}`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`${kind}/${item.name}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(item.title);
    await expect(page.locator('.vp-doc')).toContainText(`npx bootcn add ${item.name}`);

    // One source tab per registry file.
    const files = readItem(item.name).files.map((file) => file.path);
    const sourceTabs = page.locator('#source ~ .vp-code-group .tabs label');
    await expect(sourceTabs).toHaveText(files);

    // The preview is the registry's preview.html, styled and sized to fit.
    const frame = page.frameLocator('.bootcn-preview iframe');
    await expect(frame.locator(`[class*="bootcn-"]`).first()).toBeVisible();
    const iframe = page.locator('.bootcn-preview iframe');
    await iframe.scrollIntoViewIfNeeded();
    await expect
      .poll(async () =>
        iframe.evaluate((el: HTMLIFrameElement) => {
          const doc = el.contentDocument?.documentElement;
          return doc ? el.clientHeight + 2 >= doc.scrollHeight : false;
        }),
      )
      .toBe(true);

    expect(errors).toEqual([]);
  });
}

for (const theme of ['light', 'dark'] as const) {
  for (const path of [
    './',
    'guide/installation',
    'components/',
    'components/dialog',
    'blocks/',
    'blocks/transactions-table',
    'templates/admin-dashboard',
  ]) {
    test(`axe (${theme}): ${path}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await setTheme(page, theme);
      await page.goto(path);
      await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /dark/ : /^(?!.*dark)/);
      await expectAccessible(page);
    });
  }
}

test('previews follow the docs theme, without a separate dark copy', async ({ page }) => {
  await setTheme(page, 'dark');
  await page.goto('components/select');
  const frameHtml = page.frameLocator('.bootcn-preview iframe').locator('html');
  await expect(frameHtml).toHaveAttribute('data-bs-theme', 'dark');
  await expect(
    page
      .frameLocator('.bootcn-preview iframe')
      .locator('[data-bs-theme="dark"] [data-bs-theme="dark"], body [data-bs-theme]'),
  ).toHaveCount(0);

  await page.locator('.VPNavBar .VPSwitchAppearance:visible').first().click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await expect(frameHtml).toHaveAttribute('data-bs-theme', 'light');
  await expect(page.getByRole('link', { name: 'Open in a new tab' })).toHaveAttribute(
    'href',
    /preview\.html\?theme=light$/,
  );
});

test('a preview opened on its own honours ?theme=', async ({ page }) => {
  await page.goto('previews/components/button/preview.html?theme=dark');
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
  await page.goto('previews/components/button/preview.html');
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'light');
});

test('search finds a component', async ({ page }) => {
  await page.goto('guide/introduction');
  await page
    .getByRole('button', { name: /search/i })
    .first()
    .click();
  await page.getByRole('searchbox').fill('toast');
  const result = page.locator('.VPLocalSearchBox .result').filter({ hasText: 'Toast' }).first();
  await expect(result).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/components\/toast/);
});

test('copy button copies the install command', async ({ page }) => {
  // Record clipboard writes instead of depending on per-browser permissions.
  await page.addInitScript(() => {
    const copied: string[] = [];
    (window as unknown as { copied: string[] }).copied = copied;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: (text: string) => (copied.push(text), Promise.resolve()) },
    });
  });
  await page.goto('components/button');
  const block = page.locator('.vp-doc div.language-bash').first();
  await block.hover();
  const copy = block.locator('button.copy');
  await copy.click();
  await expect(copy).toHaveClass(/copied/);
  expect(await page.evaluate(() => (window as unknown as { copied: string[] }).copied)).toEqual([
    'npx bootcn add button',
  ]);
});

test('sidebar marks the current page', async ({ page }) => {
  await page.goto('components/tabs');
  await expect(page.locator('.VPSidebar .is-active').first()).toContainText('Tabs');
});

test('every internal link resolves', async ({ page, request }) => {
  const seen = new Set<string>();
  const queue = ['./'];
  const broken: string[] = [];
  while (queue.length > 0) {
    const path = queue.shift()!;
    await page.goto(path);
    const hrefs = await page.$$eval('a[href]', (links) =>
      links.map((a) => (a as HTMLAnchorElement).href),
    );
    for (const href of hrefs) {
      const url = new URL(href);
      if (url.origin !== new URL(page.url()).origin) continue;
      const key = url.pathname;
      if (seen.has(key)) continue;
      seen.add(key);
      const response = await request.get(url.href);
      if (!response.ok()) broken.push(`${key} (from ${path})`);
      else if (!/\.(json|html?)$/.test(key) && !key.includes('/previews/')) queue.push(url.href);
    }
  }
  expect(broken).toEqual([]);
  expect(seen.size).toBeGreaterThan(components.length);
});

test('blocks overview lists every block', async ({ page }) => {
  await page.goto('blocks/');
  for (const item of blocks) {
    await expect(
      page.locator('.vp-doc').getByRole('link', { name: item.title, exact: true }),
    ).toBeVisible();
  }
});

test('search finds a block', async ({ page }) => {
  await page.goto('guide/introduction');
  await page
    .getByRole('button', { name: /search/i })
    .first()
    .click();
  await page.getByRole('searchbox').fill('transactions');
  await expect(
    page.locator('.VPLocalSearchBox .result').filter({ hasText: 'Transactions table' }).first(),
  ).toBeVisible();
});

for (const item of templates) {
  const pageFile = readItem(item.name).files.find((file) => file.type === 'registry:page');
  const pageUrl = `previews/templates/${item.name}/${pageFile?.path ?? ''}`;

  test(`template page: ${item.name} shows the installed page`, async ({ page }) => {
    const errors = collectErrors(page);
    await setTheme(page, 'dark');
    await page.goto(`templates/${item.name}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(item.title);
    // Placeholders appear literally in the docs text, not as Vue expressions.
    await expect(page.locator('.vp-doc')).toContainText('{{bootcn:css}}');

    const frame = page.frameLocator('.bootcn-preview iframe');
    await expect(frame.locator('h1')).toBeVisible();
    await expect(frame.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
    const html = await frame.locator('html').evaluate((el) => el.outerHTML);
    expect(html).not.toContain('{{bootcn:');
    expect(errors).toEqual([]);
  });

  test.describe(`${item.name} as a full page`, () => {
    for (const theme of ['light', 'dark'] as const) {
      test(`no axe violations or console errors (${theme})`, async ({ page }) => {
        const errors = collectErrors(page);
        await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
        await page.goto(pageUrl);
        await expect(page.locator('html')).toHaveAttribute('data-bs-theme', theme);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
        expect(errors).toEqual([]);
      });
    }

    for (const width of [320, 768, 1280]) {
      test(`no horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(pageUrl);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        expect(overflow).toBe(false);
      });
    }

    test('the sidebar is a drawer on phones and closes with Escape', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(pageUrl);
      // Bootstrap turns the <aside> into a dialog while it is a drawer.
      const sidebar = page.locator('#bootcn-sidebar');
      const open = page.getByRole('button', { name: 'Menu' });
      await expect(page.getByRole('link', { name: 'Projects' })).toBeHidden();
      await open.click();
      await expect(sidebar.getByRole('link', { name: 'Projects' })).toBeVisible();
      // Bootstrap moves focus into the drawer when it has finished opening.
      await expect(sidebar).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(sidebar.getByRole('link', { name: 'Projects' })).toBeHidden();
      await expect(open).toBeFocused();
    });

    test('the theme toggle switches and remembers the theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto(pageUrl);
      const toggle = page.getByRole('button', { name: 'Dark mode' });
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await toggle.click();
      await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
    });
  });
}
