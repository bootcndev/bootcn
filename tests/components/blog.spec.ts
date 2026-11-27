/**
 * Blog blocks: the post list with topic filters and the article page.
 */
import { expect, test } from '@playwright/test';

import {
  expectNoAxeViolations,
  expectNoAxeViolationsExceptFirefox,
  openPreview,
} from './helpers.js';

test('blog list: topic filters show matching posts and say how many', async ({ page }) => {
  await openPreview(page, 'blog-list', 'blocks');
  const posts = page.locator('.bootcn-blog__post:visible');
  await expect(posts).toHaveCount(7);
  const filters = page.getByRole('group', { name: 'Filter by topic' });
  await filters.getByRole('button', { name: 'Engineering' }).click();
  await expect(filters.getByRole('button', { name: 'Engineering' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(filters.getByRole('button', { name: 'All' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(posts).toHaveCount(2);
  await expect(page.locator('[data-blog-status]')).toHaveText('2 posts');
  await filters.getByRole('button', { name: 'Design' }).click();
  await expect(page.locator('[data-blog-status]')).toHaveText('1 post');
  await expect(
    page.getByRole('article', { name: 'Designing for dark mode from day one' }),
  ).toBeVisible();
  await expect(page.locator('[data-blog-empty]')).toBeHidden();
  await expectNoAxeViolations(page);
});

test('blog article: contents follow the reading, copy link, share links', async ({
  page,
  context,
  browserName,
}) => {
  await openPreview(page, 'blog-article', 'blocks');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'How we cut our page load time in half',
  );
  const toc = page.getByRole('navigation', { name: 'On this page' });
  await expect(
    toc.getByRole('link', { name: 'Measure before you change anything' }),
  ).toHaveAttribute('aria-current', 'true');
  await page.evaluate(() => document.getElementById('results')!.scrollIntoView());
  await expect(toc.getByRole('link', { name: 'The results' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(toc.locator('[aria-current]')).toHaveCount(1);

  const x = page.getByRole('link', { name: 'Share on X (opens in a new tab)' });
  await expect(x).toHaveAttribute('href', /url=.*blog-article.*text=How\+we\+cut/);

  if (browserName === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.locator('[data-article-status]')).toHaveText('Link copied');
  }
  await expectNoAxeViolationsExceptFirefox(
    page,
    browserName,
    'axe crashes this page in Firefox on CI; covered in Chromium and WebKit',
  );
});
