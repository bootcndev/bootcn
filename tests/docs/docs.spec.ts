/**
 * Docs site (apps/docs) as deployed: built into _site next to the registry
 * JSON and served at the root, as on https://bootcn.dev.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface IndexItem {
  name: string;
  type: string;
  title: string;
  categories?: string[];
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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build better with Bootstrap.');
  // The showcase starts on the installed admin template, following the site theme.
  await expect(page.frameLocator('.bootcn-home__showcase iframe').first().locator('h1')).toHaveText(
    'Dashboard',
  );
  // The other templates are a tab away.
  await page.getByRole('tab', { name: 'Landing page' }).click();
  await expect(
    page.frameLocator('.bootcn-home__showcase iframe').nth(2).locator('h1'),
  ).toContainText('Ship your product site');
  // Bootstrap is linked to its own site; the footer carries the notices.
  await expect(
    page.locator('.bootcn-landing__lead').getByRole('link', { name: 'Bootstrap' }),
  ).toHaveAttribute('href', 'https://getbootstrap.com/');
  await expect(page.getByRole('contentinfo')).toContainText('MIT License');
  await expect(page.getByRole('navigation', { name: 'Footer' })).toBeVisible();
  await page.getByRole('link', { name: 'Browse components' }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/components\/$/);
  for (const item of components) {
    // Each card is a link whose title is the item name.
    await expect(
      page.locator('.bootcn-grid a').filter({
        // Recent items end with a "New" badge.
        has: page.locator('strong').getByText(new RegExp(`^${escapeRegExp(item.title)}( New)?$`)),
      }),
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
    // The frame fits its content exactly: no scrollbar in either direction.
    await expect
      .poll(async () =>
        iframe.evaluate((el: HTMLIFrameElement) => {
          const doc = el.contentDocument?.documentElement;
          if (!doc) return 'no document';
          return {
            fits: el.clientHeight >= doc.scrollHeight && el.clientWidth >= doc.scrollWidth,
            overflow: getComputedStyle(doc).overflow,
          };
        }),
      )
      .toEqual({ fits: true, overflow: 'hidden' });
    if (kind === 'components' && item.name !== 'sidebar') {
      // Components are centered; their own title is visually hidden.
      await expect(page.frameLocator('.bootcn-preview iframe').locator('main')).toHaveAttribute(
        'data-bootcn-docs-center',
        '',
      );
    }

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
    'themes/',
    'guide/dark-mode',
    'ai/',
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

test('items from the latest releases are marked New', async ({ page }) => {
  const registry = resolve(import.meta.dirname, '../../packages/registry');
  const { version } = JSON.parse(readFileSync(resolve(registry, 'registry.json'), 'utf8')) as {
    version: string;
  };
  const added = (name: string) =>
    (
      JSON.parse(readFileSync(resolve(registry, 'components', name, 'manifest.json'), 'utf8')) as {
        added?: string;
      }
    ).added;
  const latest = ['tree', 'button'].find((name) => added(name) === version);
  test.skip(!latest, 'no component in this release to check');

  await page.goto(`components/${latest}`);
  await expect(page.locator('.bootcn-meta__new')).toHaveText(`New in ${version}`);
  const title = index.items.find((item) => item.name === latest)!.title;
  await expect(
    page.locator('.VPSidebar').getByRole('link', { name: `${title} New`, exact: true }),
  ).toBeVisible();

  await page.goto('components/');
  await expect(
    page.locator('.bootcn-grid').getByRole('link', { name: new RegExp(`^${title} New`) }),
  ).toHaveCount(1);

  await page.goto('components/button');
  await expect(page.locator('.bootcn-meta__new')).toHaveCount(0);
  await expect(page.locator('.bootcn-meta')).toContainText(`Since ${added('button')}`);
  await expect(
    page.locator('.VPSidebar').getByRole('link', { name: 'Button', exact: true }),
  ).toBeVisible();
});

test('every page in the sitemap has its own title, description and canonical', async ({
  request,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'browser-independent; runs in Chromium');
  test.setTimeout(120_000);
  const sitemap = await (await request.get('sitemap.xml')).text();
  const urls = [...sitemap.matchAll(/<loc>https:\/\/bootcn\.dev\/([^<]*)<\/loc>/g)].map(
    (m) => m[1]!,
  );
  expect(urls.length).toBeGreaterThan(150);
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  const problems: string[] = [];
  for (const path of urls) {
    const html = await (await request.get(path || '/')).text();
    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '';
    const description = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? '';
    const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1];
    if (canonical !== `https://bootcn.dev/${path}`)
      problems.push(`${path}: canonical ${canonical}`);
    if (html.includes('name="robots" content="noindex"')) problems.push(`${path}: noindex`);
    if (description.length < 50) problems.push(`${path}: short description`);
    if (/content="[^"]*"[^\s>/]/.test(html))
      problems.push(`${path}: unescaped quote in an attribute`);
    if (titles.has(title)) problems.push(`${path}: same title as ${titles.get(title)}`);
    if (descriptions.has(description))
      problems.push(`${path}: same description as ${descriptions.get(description)}`);
    titles.set(title, path);
    descriptions.set(description, path);
  }
  expect(problems).toEqual([]);
});

test('previews and the 404 page are not indexed', async ({ request, browserName }) => {
  test.skip(browserName !== 'chromium', 'browser-independent; runs in Chromium');
  for (const path of [
    '404.html',
    'previews/components/tree/preview.html',
    'previews/templates/crm/crm.html',
  ]) {
    expect(await (await request.get(path)).text(), path).toContain(
      '<meta name="robots" content="noindex">',
    );
  }
  await expect(async () => {
    const html = await (await request.get('components/tree')).text();
    expect(html).toContain('<title>Tree component for Bootstrap 5 | Bootcn</title>');
    expect(html).toContain('"@type":"BreadcrumbList"');
  }).toPass();
});

test('every internal link resolves', async ({ request, browserName }) => {
  // Link checking does not depend on the browser: read the static HTML once.
  test.skip(browserName !== 'chromium', 'browser-independent; runs in Chromium');
  test.setTimeout(120_000);
  const base = new URL('http://127.0.0.1:4518/');
  const seen = new Set<string>();
  const queue = [base.href];
  const broken: string[] = [];
  while (queue.length > 0) {
    const pageUrl = queue.shift()!;
    const html = await (await request.get(pageUrl)).text();
    for (const match of html.matchAll(/href="([^"#]+)/g)) {
      const url = new URL(match[1]!, pageUrl);
      if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) continue;
      if (seen.has(url.pathname)) continue;
      seen.add(url.pathname);
      const response = await request.get(url.href);
      if (!response.ok()) broken.push(`${url.pathname} (from ${new URL(pageUrl).pathname})`);
      else if (!/\.[a-z0-9]+$/i.test(url.pathname) || url.pathname.endsWith('.html')) {
        if (!url.pathname.includes('/previews/')) queue.push(url.href);
      }
    }
  }
  expect(broken).toEqual([]);
  expect(seen.size).toBeGreaterThan(components.length);
});

test('blocks page: a live gallery with one tab per category', async ({ page }) => {
  await page.goto('blocks/');
  const tabs = page.getByRole('tablist', { name: 'Block categories' }).getByRole('tab');
  await expect(tabs.first()).toHaveText('Authentication');
  await expect(page.locator('.bootcn-block-gallery__item')).toHaveCount(blocks.length);
  await expect(page.getByRole('heading', { name: 'Login card', exact: true })).toBeVisible();

  await page.getByRole('tab', { name: 'Charts' }).click();
  const area = page.locator('.bootcn-block-gallery__item', { hasText: 'Area chart' });
  await expect(area).toBeVisible();
  await expect(area.getByRole('link', { name: 'Code and install' })).toHaveAttribute(
    'href',
    /chart-area/,
  );
  await expect(page.getByRole('heading', { name: 'Login card', exact: true })).toBeHidden();
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
      test.skip(item.name !== 'admin-dashboard', 'admin dashboard markup (app-sidebar block)');
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

test('preview and code tabs follow the ARIA tabs pattern', async ({ page }) => {
  await page.goto('components/dialog');
  const tabs = page.getByRole('tablist', { name: 'Dialog preview and code' });
  const preview = tabs.getByRole('tab', { name: 'Preview' });
  const code = tabs.getByRole('tab', { name: 'Code' });
  await expect(preview).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.bootcn-preview iframe')).toBeVisible();

  await preview.focus();
  await page.keyboard.press('ArrowRight');
  await expect(code).toBeFocused();
  await expect(code).toHaveAttribute('aria-selected', 'true');
  const codePanel = page.locator(`#${await code.getAttribute('aria-controls')}`);
  await expect(codePanel).toBeVisible();
  await expect(codePanel).toContainText('bootcn-dialog');
  await expect(page.locator('.bootcn-preview iframe')).toBeHidden();

  await page.keyboard.press('Home');
  await expect(preview).toBeFocused();
  await expect(page.locator('.bootcn-preview iframe')).toBeVisible();
});

test('installation offers CLI and manual tabs', async ({ page }) => {
  await page.goto('blocks/login-card');
  const tabs = page.getByRole('tablist', { name: 'Installation method' });
  await expect(page.locator('.vp-doc')).toContainText('npx bootcn add login-card');
  await tabs.getByRole('tab', { name: 'Manual' }).click();
  await expect(page.getByRole('cell', { name: 'login-card.css', exact: true })).toBeVisible();
});

test('charts page shows every chart block live', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('charts/');
  const charts = index.items.filter((item) => (item.categories ?? []).includes('charts'));
  expect(charts.length).toBeGreaterThanOrEqual(6);
  const frames = page.locator('.bootcn-chart-gallery iframe');
  await expect(frames).toHaveCount(charts.length);
  await frames.first().scrollIntoViewIfNeeded();
  await expect(
    page.frameLocator('.bootcn-chart-gallery iframe').first().locator('svg.bootcn-chart__svg'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Area chart: code and options/ })).toHaveAttribute(
    'href',
    /blocks\/chart-area/,
  );
  expect(errors).toEqual([]);
});

test('analytics dashboard: collapsible sidebar, date picker, charts and table', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.clock.setFixedTime(new Date('2026-11-24T10:00:00'));
  await page.goto('previews/templates/analytics-dashboard/analytics-dashboard.html');
  await expect(page.getByRole('heading', { level: 1, name: 'Analytics' })).toBeVisible();
  await expect(page.locator('svg.bootcn-chart__svg')).toHaveCount(4);

  const layout = page.locator('[data-bootcn-sidenav-layout]');
  await page.keyboard.press('Control+b');
  await expect(layout).toHaveClass(/is-collapsed/);
  await page.keyboard.press('Control+b');
  await expect(layout).not.toHaveClass(/is-collapsed/);

  await page.getByRole('button', { name: 'Report date Pick a date' }).click();
  await expect(page.getByRole('dialog', { name: 'Choose the report date' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Report date November 24, 2026' })).toBeFocused();

  await page.getByRole('searchbox', { name: 'Filter payments' }).fill('failed');
  await expect(page.locator('[data-bootcn-data-table-status]')).toHaveText('Showing 1–3 of 3');
  expect(errors).toEqual([]);
});

test('theme builder: choices restyle the preview and the CSS can be copied', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    const copied: string[] = [];
    (window as unknown as { copied: string[] }).copied = copied;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: (text: string) => (copied.push(text), Promise.resolve()) },
    });
  });
  await page.goto('themes/');
  const frame = page.frameLocator('.bootcn-theme-builder__preview');
  await expect(frame.locator('h1')).toHaveText('Dashboard');

  await page.getByRole('radio', { name: 'slate' }).check();
  await page.getByRole('radio', { name: 'violet' }).check();
  await page.getByRole('radio', { name: '1rem' }).check();
  const root = page.locator('.bootcn-theme-builder__preview');
  await expect
    .poll(() =>
      root.evaluate((el: HTMLIFrameElement) =>
        getComputedStyle(el.contentDocument!.documentElement)
          .getPropertyValue('--bootcn-primary')
          .trim(),
      ),
    )
    .toBe('#7c3aed');

  await page.getByRole('button', { name: 'Copy CSS' }).click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  const copied = await page.evaluate(() => (window as unknown as { copied: string[] }).copied);
  expect(copied[0]).toContain('default style, slate base, violet primary, 1rem radius');
  expect(copied[0]).toContain('--bs-border-radius-lg: 1rem;');
  expect(errors).toEqual([]);
});

test('llms.txt lists the docs and every item with its source', async ({ request }) => {
  const response = await request.get('llms.txt');
  expect(response.ok()).toBe(true);
  const text = await response.text();
  expect(text.startsWith('# Bootcn')).toBe(true);
  for (const item of index.items.filter((entry) => entry.type !== 'registry:theme')) {
    expect(text).toContain(`/r/${item.name}.json`);
  }
});

test('item pages copy a prompt for AI assistants', async ({ page }) => {
  await page.addInitScript(() => {
    const copied: string[] = [];
    (window as unknown as { copied: string[] }).copied = copied;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: (text: string) => (copied.push(text), Promise.resolve()) },
    });
  });
  await page.goto('components/combobox');
  await page.getByRole('button', { name: 'Copy prompt' }).click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  const [text] = await page.evaluate(() => (window as unknown as { copied: string[] }).copied);
  expect(text).toContain('npx bootcn add combobox');
  expect(text).toContain('/r/combobox.json');
});

test('previews switch to right to left', async ({ page }) => {
  await page.goto('components/toolbar');
  const frame = page.locator('.bootcn-preview iframe').first();
  const rtl = page.getByRole('button', { name: 'RTL' });
  await expect(rtl).toHaveAttribute('aria-pressed', 'false');
  await rtl.click();
  await expect(rtl).toHaveAttribute('aria-pressed', 'true');
  await expect(frame).toHaveAttribute('src', /\?dir=rtl$/);
  await expect(page.frameLocator('.bootcn-preview iframe').first().locator('html')).toHaveAttribute(
    'dir',
    'rtl',
  );
  await expect(page.getByRole('link', { name: 'Open in a new tab' })).toHaveAttribute(
    'href',
    /&dir=rtl$/,
  );
});

test('theme builder: the soft style fills fields and rounds corners', async ({ page }) => {
  await page.goto('themes/');
  const frame = page.locator('.bootcn-theme-builder__preview');
  await expect(page.frameLocator('.bootcn-theme-builder__preview').locator('h1')).toHaveText(
    'Dashboard',
  );
  await page.getByRole('radio', { name: 'soft' }).check();
  await expect(page.getByRole('radio', { name: '0.75rem' })).toBeChecked();
  const field = () =>
    frame.evaluate((el: HTMLIFrameElement) => {
      const input = el.contentDocument!.querySelector('.bootcn-input') as HTMLElement;
      const style = getComputedStyle(input);
      return { border: style.borderTopColor, background: style.backgroundColor };
    });
  await expect.poll(async () => (await field()).border).toBe('rgba(0, 0, 0, 0)');
  expect((await field()).background).not.toBe('rgba(0, 0, 0, 0)');
  await expect(page.locator('.bootcn-theme-builder__code pre')).toContainText('Bootcn soft style');
  await page.getByRole('radio', { name: 'default' }).check();
  await expect(page.getByRole('radio', { name: '0.5rem' })).toBeChecked();
  await expect.poll(async () => (await field()).border).not.toBe('rgba(0, 0, 0, 0)');
});

test('on phones, code blocks line up with the text', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('components/toolbar');
  const heading = await page.locator('.vp-doc h2').first().boundingBox();
  const group = await page.locator('.vp-doc .vp-code-group').first().boundingBox();
  expect(Math.round(group!.x)).toBe(Math.round(heading!.x));
  expect(Math.round(group!.x + group!.width)).toBeLessThanOrEqual(375 - Math.round(heading!.x));
});

test('pages have link preview tags for X and Open Graph', async ({ page, request }) => {
  await page.goto('components/dialog');
  const meta = (selector: string) => page.locator(`head meta[${selector}]`).getAttribute('content');
  expect(await meta('name="twitter:card"')).toBe('summary_large_image');
  expect(await meta('property="og:image"')).toBe('https://bootcn.dev/og-image.png');
  expect(await meta('property="og:title"')).toBe('Dialog component for Bootstrap 5 | Bootcn');
  expect(await meta('property="og:url"')).toBe('https://bootcn.dev/components/dialog');
  expect(await meta('property="og:description"')).toBeTruthy();
  const image = await request.get('og-image.png');
  expect(image.ok()).toBe(true);
  expect(image.headers()['content-type']).toContain('image/png');
});

test('the home page has structured data and the site has robots.txt', async ({ page, request }) => {
  await page.goto('./');
  const json = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(json!) as { '@graph': { '@type': string; sameAs?: string[] }[] };
  const types = data['@graph'].map((node) => node['@type']);
  expect(types).toEqual(['Organization', 'WebSite', 'SoftwareSourceCode']);
  expect(data['@graph'][0]!.sameAs).toContain('https://x.com/bootcndev');
  const robots = await request.get('robots.txt');
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain('Sitemap: https://bootcn.dev/sitemap.xml');
});

// Site pages on phones: decorations and tab rows must not make the page
// scroll sideways.
for (const path of [
  '',
  'components/',
  'blocks/',
  'templates/',
  'themes/',
  'charts/',
  'guide/introduction',
  'changelog',
]) {
  for (const width of [320, 375]) {
    test(`site page /${path} has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}

test('home page live previews are centered on phones', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('');
  const card = page.locator('.bootcn-landing__live iframe').first();
  await card.scrollIntoViewIfNeeded();
  const frame = page.frameLocator('.bootcn-landing__live iframe').first();
  await expect(frame.locator('.bootcn-docs-stage')).toBeAttached();
  const gaps = await card.evaluate((el: HTMLIFrameElement) => {
    const child = el.contentDocument!.querySelector('.bootcn-docs-stage')!.firstElementChild!;
    const box = child.getBoundingClientRect();
    return { left: box.left, right: el.clientWidth - box.right };
  });
  expect(gaps.left).toBeGreaterThan(0);
  expect(Math.abs(gaps.left - gaps.right)).toBeLessThanOrEqual(2);
});

test('e-commerce template: the cart follows you from the catalogue to the checkout', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('previews/templates/ecommerce/ecommerce.html');
  await page.evaluate(() => localStorage.removeItem('acme-ecommerce-cart'));
  await page.reload();
  await page.getByRole('button', { name: 'Add Studio Headphones to cart' }).click();
  await expect(page.getByRole('dialog', { name: /Your cart/ })).toBeVisible();
  await page
    .getByRole('dialog', { name: /Your cart/ })
    .getByRole('link', { name: 'Checkout' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Checkout' })).toBeVisible();
  await expect(page.locator('.bootcn-checkout__item-name')).toHaveText(['Studio Headphones']);
  // $149 + 8% tax.
  await expect(page.locator('[data-bootcn-checkout-total]')).toHaveText('$160.92');

  await page.goto('previews/templates/ecommerce/ecommerce-product.html');
  await page.locator('label[for="bootcn-detail-size-l"]').click();
  await page.getByLabel('Quantity', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  const drawer = page.getByRole('dialog', { name: /Your cart/ });
  await expect(drawer.getByText('Sand / L')).toBeVisible();
  await expect(page.locator('[data-bootcn-cart-count]').first()).toHaveText('3');
});

for (const pageName of ['ecommerce-product', 'ecommerce-checkout']) {
  for (const theme of ['light', 'dark'] as const) {
    test(`e-commerce template: ${pageName} has no axe violations in ${theme} mode`, async ({
      page,
    }) => {
      await page.addInitScript((t) => localStorage.setItem('bootcn-theme', t), theme);
      await page.goto(`previews/templates/ecommerce/${pageName}.html`);
      await expect(page.locator('html')).toHaveAttribute('data-bs-theme', theme);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
}

test('crm template: moving a deal updates the stage totals', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('previews/templates/crm/crm.html');
  const total = (stage: string) =>
    page.locator(`[data-bootcn-kanban-column="${stage}"] [data-crm-column-total]`);
  await expect(total('negotiation')).toHaveText('$48,000');
  await expect(page.locator('[data-crm-stat="open"]')).toHaveText('$131,700');
  const deal = page.locator('[data-bootcn-kanban-card="d6"]');
  await deal.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await expect(total('won')).toHaveText('$139,000');
  await expect(total('negotiation')).toHaveText('$0');
  await expect(page.locator('[data-crm-stat="won"]')).toHaveText('$139,000');
  await expect(page.locator('[data-crm-stat="open"]')).toHaveText('$83,700');
});

test('crm template: filter contacts and add one', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('previews/templates/crm/crm-contacts.html');
  const count = page.locator('[data-bootcn-filters-count]');
  await expect(count).toHaveText('8 of 8 contacts');
  await page.locator('[data-bootcn-filter="owner"] [data-bootcn-filter-toggle]').click();
  await page.getByLabel('Jackson Lee').check();
  await expect(count).toHaveText('3 of 8 contacts');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Add contact' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Add contact' });
  await dialog.getByLabel('Name').fill('Grace Lee');
  await dialog.getByLabel('Email').fill('grace@example.com');
  await dialog.getByLabel('Owner').selectOption('Jackson Lee');
  await dialog.getByRole('button', { name: 'Add contact' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-crm-contacts] tr').first()).toContainText('Grace Lee');
  // It matches the owner filter, so it shows and counts.
  await expect(count).toHaveText('4 of 9 contacts');
});

test('crm template: a note joins the activity timeline', async ({ page }) => {
  await page.goto('previews/templates/crm/crm-contact.html');
  await page.getByRole('button', { name: 'Add note' }).click();
  await expect(page.getByLabel('Add a note')).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Add a note').fill('Sent the revised quote.');
  await page.getByRole('button', { name: 'Add note' }).click();
  const first = page.getByRole('list', { name: 'Activity' }).getByRole('listitem').first();
  await expect(first).toContainText('Sent the revised quote.');
  await expect(page.getByLabel('Add a note')).toHaveValue('');
});

for (const pageName of ['crm-contacts', 'crm-contact']) {
  for (const theme of ['light', 'dark'] as const) {
    test(`crm template: ${pageName} has no axe violations in ${theme} mode`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('bootcn-theme', t), theme);
      await page.goto(`previews/templates/crm/${pageName}.html`);
      await expect(page.locator('html')).toHaveAttribute('data-bs-theme', theme);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
}
