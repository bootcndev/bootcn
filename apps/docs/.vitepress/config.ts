import { type HeadConfig, defineConfig } from 'vitepress';

import {
  GITHUB_URL,
  NPM_URL,
  X_URL,
  REGISTRY_URL,
  SITE_URL,
  KINDS,
  type Kind,
  componentSearchSections,
  copyPreviews,
  grouped,
  readIndex,
} from './registry';

// Previews are served from the registry sources themselves (spec 11.3).
copyPreviews();

const index = readIndex();

/** Sidebar sections for one kind: an overview link, then one group per category. */
function kindSidebar(kind: Kind) {
  // VitePress renders sidebar text as HTML; titles come from our own manifests.
  const link = (item: { name: string; title: string; isNew?: boolean }) => ({
    text: item.isNew ? `${item.title} <span class="bootcn-new">New</span>` : item.title,
    link: `/${kind}/${item.name}`,
  });
  const overview = { text: 'Overview', link: `/${kind}/` };
  if (kind === 'templates') {
    // Few templates: one section, no category groups.
    return [
      {
        text: KINDS[kind].title,
        items: [overview, ...grouped(kind).flatMap((g) => g.items.map(link))],
      },
    ];
  }
  return [
    { text: KINDS[kind].title, items: [overview] },
    // Not collapsible: VitePress renders collapsible headers as a role="button"
    // that contains links (axe: nested-interactive).
    ...grouped(kind).map((group) => ({ text: group.label, items: group.items.map(link) })),
  ];
}

const BASE = process.env.DOCS_BASE ?? '/';

/** What an item page is called in its title: "Tree component for Bootstrap 5". */
const ITEM_NOUN: Partial<Record<Kind, string>> = {
  components: 'component',
  blocks: 'block',
  templates: 'template',
};

/** Section names for breadcrumbs, by the first path segment. */
const SECTIONS: Record<string, string> = {
  guide: 'Guide',
  components: 'Components',
  blocks: 'Blocks',
  templates: 'Templates',
  charts: 'Charts',
  ai: 'AI',
  themes: 'Themes',
};

/** schema.org BreadcrumbList: Bootcn > section > page. */
function breadcrumbs(path: string, title: string) {
  const [section, rest] = path.split(/\/(.*)/);
  const trail = [{ name: 'Bootcn', url: `${SITE_URL}/` }];
  if (section && SECTIONS[section] && section !== 'guide') {
    trail.push({ name: SECTIONS[section]!, url: `${SITE_URL}/${section}/` });
  }
  if (rest || !SECTIONS[section ?? ''] || section === 'guide') {
    trail.push({ name: title, url: `${SITE_URL}/${path}` });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: step.url,
    })),
  };
}

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Bootcn',
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/icon-512.png`,
      description:
        'Accessible copy-paste components, blocks and templates for Bootstrap 5.3, in plain HTML, CSS and vanilla JavaScript.',
      sameAs: [GITHUB_URL, NPM_URL, X_URL],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'Bootcn',
      url: `${SITE_URL}/`,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'SoftwareSourceCode',
      '@id': `${SITE_URL}/#software`,
      name: 'Bootcn',
      description:
        'A registry and CLI that copy Bootstrap 5.3 components, blocks and page templates into your project as plain HTML, CSS and JavaScript.',
      url: `${SITE_URL}/`,
      codeRepository: GITHUB_URL,
      license: 'https://opensource.org/licenses/MIT',
      programmingLanguage: ['HTML', 'CSS', 'JavaScript'],
      runtimePlatform: 'Bootstrap 5.3',
      author: { '@id': 'https://bootcn.dev/#organization' },
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
};

export default defineConfig({
  title: 'Bootcn',
  description: 'Copy-paste UI components for Bootstrap 5.3 and vanilla JavaScript.',
  lang: 'en-US',
  // Served from https://bootcn.dev next to the registry JSON. The GitHub Pages
  // mirror builds with DOCS_BASE=/bootcn/.
  base: BASE,
  cleanUrls: true,
  srcExclude: ['README.md'],
  sitemap: { hostname: SITE_URL },
  head: [
    ['meta', { name: 'theme-color', content: '#5b45d6' }],
    ['link', { rel: 'icon', href: `${BASE}favicon.ico`, sizes: '48x48' }],
    ['link', { rel: 'icon', type: 'image/png', href: `${BASE}icon-192.png`, sizes: '192x192' }],
    ['link', { rel: 'apple-touch-icon', href: `${BASE}apple-touch-icon.png` }],
    // Link previews (X, Slack, LinkedIn...): a large card with og-image.png.
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Bootcn' }],
    ['meta', { property: 'og:image', content: `${SITE_URL}/og-image.png` }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: 'Bootcn: build better with Bootstrap.' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:site', content: '@bootcndev' }],
    ['meta', { name: 'twitter:image', content: `${SITE_URL}/og-image.png` }],
  ],
  // Item pages: the manifest description, and a title that says what it is.
  transformPageData(pageData) {
    const kind = pageData.relativePath.split('/')[0] as Kind;
    const params = pageData.params as { title?: string; description?: string } | undefined;
    if (!params?.description || !(kind in ITEM_NOUN)) return;
    pageData.title = params.title ?? pageData.title;
    // VitePress writes the description into attributes without escaping quotes.
    const text = params.description.replace(/"([^"]*)"/g, '“$1”').replace(/"/g, '”');
    // Short ones say a little more, so search results have something to show.
    pageData.description =
      text.length < 110
        ? `${text} A free, accessible Bootstrap 5.3 ${ITEM_NOUN[kind]} in HTML, CSS and vanilla JavaScript.`
        : text;
    pageData.titleTemplate = `:title ${ITEM_NOUN[kind]} for Bootstrap 5 | Bootcn`;
  },
  // bootcn.dev is the canonical site, also for the GitHub Pages mirror.
  transformHead({ pageData, siteData }) {
    const path = pageData.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '');
    const url = `${SITE_URL}/${path}`;
    const title =
      path === ''
        ? 'Bootcn: build better with Bootstrap'
        : typeof pageData.titleTemplate === 'string'
          ? pageData.titleTemplate.replace(':title', pageData.title)
          : `${pageData.title} | Bootcn`;
    const description = pageData.description || siteData.description;
    const head: HeadConfig[] = [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
    ];
    // Structured data for search engines and AI answers, on the home page.
    if (path === '')
      head.push(['script', { type: 'application/ld+json' }, JSON.stringify(STRUCTURED_DATA)]);
    else
      head.push([
        'script',
        { type: 'application/ld+json' },
        JSON.stringify(breadcrumbs(path, pageData.title)),
      ]);
    return head;
  },
  // The default github themes have colours below 4.5:1 on the code background.
  markdown: { theme: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' } },
  themeConfig: {
    logo: { light: '/logo-light.png', dark: '/logo-dark.png', alt: '' },
    nav: [
      { text: 'Guide', link: '/guide/introduction', activeMatch: '^/guide/' },
      { text: 'Components', link: '/components/', activeMatch: '^/components/' },
      { text: 'Blocks', link: '/blocks/', activeMatch: '^/blocks/' },
      { text: 'Charts', link: '/charts/', activeMatch: '^/charts/' },
      { text: 'AI', link: '/ai/', activeMatch: '^/ai/' },
      { text: 'Themes', link: '/themes/', activeMatch: '^/themes/' },
      { text: 'Templates', link: '/templates/', activeMatch: '^/templates/' },
      {
        text: `v${index.version}`,
        items: [
          { text: 'Release notes', link: `${GITHUB_URL}/releases` },
          { text: 'CLI on npm', link: NPM_URL },
          { text: 'Registry versions', link: `${REGISTRY_URL}/versions.json` },
        ],
      },
    ],
    sidebar: [
      {
        text: 'Getting started',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'CLI', link: '/guide/cli' },
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'Theming', link: '/guide/theming' },
          { text: 'Dark mode', link: '/guide/dark-mode' },
          { text: 'Right to left', link: '/guide/rtl' },
          { text: 'Translations', link: '/guide/i18n' },
          { text: 'Animations', link: '/guide/animations' },
          { text: 'Laravel', link: '/guide/laravel' },
          { text: 'AI assistants (MCP)', link: '/guide/mcp' },
        ],
      },
      ...kindSidebar('components'),
      ...kindSidebar('blocks'),
      ...kindSidebar('templates'),
      {
        text: 'Resources',
        items: [
          { text: 'Theme builder', link: '/themes/' },
          { text: 'Changelog', link: '/changelog' },
          { text: 'Contributing', link: '/guide/contributing' },
          { text: 'Report an issue', link: `${GITHUB_URL}/issues` },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: GITHUB_URL },
      { icon: 'npm', link: NPM_URL },
      { icon: 'x', link: X_URL, ariaLabel: 'Bootcn on X' },
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: 'Search documentation…',
            buttonAriaLabel: 'Search documentation…',
          },
        },
        miniSearch: {
          // Generated item pages have no file on disk for the indexer to
          // read; index them from the registry. Other pages: default splitter.
          _splitIntoSections(file: string, html: string) {
            const match = /[\\/](?:components|blocks|templates)[\\/]([a-z0-9-]+)\.md$/.exec(file);
            if (!match?.[1] || html) return undefined as never;
            return Promise.resolve(componentSearchSections(match[1]));
          },
        },
      },
    },
    outline: { level: [2, 3] },
  },
});
