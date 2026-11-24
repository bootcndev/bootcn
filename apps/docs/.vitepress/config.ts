import { defineConfig } from 'vitepress';

import {
  GITHUB_URL,
  NPM_URL,
  REGISTRY_URL,
  componentSearchSections,
  copyPreviews,
  groupedComponents,
  readIndex,
} from './registry';

// Previews are served from the registry sources themselves (spec 11.3).
copyPreviews();

const index = readIndex();

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
          { text: 'Theming and dark mode', link: '/guide/theming' },
        ],
      },
      {
        text: 'Components',
        items: [{ text: 'Overview', link: '/components/' }],
      },
      ...groupedComponents().map((group) => ({
        // Not collapsible: VitePress renders collapsible headers as a
        // role="button" that contains links (axe: nested-interactive).
        text: group.label,
        items: group.items.map((item) => ({ text: item.title, link: `/components/${item.name}` })),
      })),
      {
        text: 'Resources',
        items: [
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
        miniSearch: {
          // Generated component pages have no file on disk for the indexer to
          // read; index them from the registry. Other pages: default splitter.
          _splitIntoSections(file: string, html: string) {
            const match = /[\\/]components[\\/]([a-z0-9-]+)\.md$/.exec(file);
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
