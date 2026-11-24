import { defineConfig } from 'vitepress';

import {
  GITHUB_URL,
  NPM_URL,
  REGISTRY_URL,
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
  const link = (item: { name: string; title: string }) => ({
    text: item.title,
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

export default defineConfig({
  title: 'Bootcn',
  description: 'Copy-paste UI components for Bootstrap 5.3 and vanilla JavaScript.',
  lang: 'en-US',
  // Served from GitHub Pages next to the registry JSON.
  base: process.env.DOCS_BASE ?? '/bootcn/',
  cleanUrls: true,
  srcExclude: ['README.md'],
  head: [['meta', { name: 'theme-color', content: '#5b45d6' }]],
  // The default github themes have colours below 4.5:1 on the code background.
  markdown: { theme: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' } },
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/introduction', activeMatch: '^/guide/' },
      { text: 'Components', link: '/components/', activeMatch: '^/components/' },
      { text: 'Blocks', link: '/blocks/', activeMatch: '^/blocks/' },
      { text: 'Charts', link: '/charts/', activeMatch: '^/charts/' },
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
    footer: {
      message: 'Released under the MIT License. Not affiliated with Bootstrap or shadcn/ui.',
      copyright: 'Copyright © George Tsiros',
    },
  },
});
