<script setup lang="ts">
/**
 * Site footer, on pages without a sidebar (home, gallery pages): the logo,
 * link columns, and the license and trademark notes.
 */
import { withBase } from 'vitepress';

const year = new Date().getFullYear();

const columns = [
  {
    title: 'Docs',
    links: [
      { text: 'Introduction', href: withBase('/guide/introduction') },
      { text: 'Installation', href: withBase('/guide/installation') },
      { text: 'Theming', href: withBase('/guide/theming') },
      { text: 'Dark mode', href: withBase('/guide/dark-mode') },
      { text: 'Right to left', href: withBase('/guide/rtl') },
      { text: 'AI assistants (MCP)', href: withBase('/guide/mcp') },
    ],
  },
  {
    title: 'Frameworks',
    links: [
      { text: 'HTML and PHP', href: withBase('/guide/installation') },
      { text: 'Laravel', href: withBase('/guide/laravel') },
      { text: 'React', href: withBase('/guide/react') },
      { text: 'Vue', href: withBase('/guide/vue') },
    ],
  },
  {
    title: 'Library',
    links: [
      { text: 'Components', href: withBase('/components/') },
      { text: 'Blocks', href: withBase('/blocks/') },
      { text: 'Charts', href: withBase('/charts/') },
      { text: 'AI', href: withBase('/ai/') },
      { text: 'Templates', href: withBase('/templates/') },
      { text: 'Theme builder', href: withBase('/themes/') },
    ],
  },
  {
    title: 'Project',
    links: [
      { text: 'Changelog', href: withBase('/changelog') },
      { text: 'GitHub', href: 'https://github.com/bootcndev/bootcn', external: true },
      { text: 'npm', href: 'https://www.npmjs.com/package/bootcn', external: true },
      { text: 'X (@bootcndev)', href: 'https://x.com/bootcndev', external: true },
      { text: 'llms.txt', href: withBase('/llms.txt') },
    ],
  },
];
</script>

<template>
  <footer class="bootcn-footer">
    <div class="bootcn-footer__inner">
      <div class="bootcn-footer__about">
        <a class="bootcn-footer__brand" :href="withBase('/')">
          <img
            class="bootcn-footer__logo bootcn-footer__logo--light"
            :src="withBase('/logo-light.png')"
            alt=""
            width="24"
            height="24"
          />
          <img
            class="bootcn-footer__logo bootcn-footer__logo--dark"
            :src="withBase('/logo-dark.png')"
            alt=""
            width="24"
            height="24"
          />
          Bootcn
        </a>
        <p>
          Build better with
          <a href="https://getbootstrap.com/" target="_blank" rel="noreferrer">Bootstrap</a>.
          Copy-paste components, blocks and templates in plain HTML, CSS and JavaScript, with React
          and Vue components.
        </p>
      </div>
      <nav class="bootcn-footer__nav" aria-label="Footer">
        <div v-for="column in columns" :key="column.title" class="bootcn-footer__column">
          <h2>{{ column.title }}</h2>
          <ul>
            <li v-for="link in column.links" :key="link.text">
              <a
                :href="link.href"
                v-bind="link.external ? { target: '_blank', rel: 'noreferrer' } : {}"
                >{{ link.text }}</a
              >
            </li>
          </ul>
        </div>
      </nav>
    </div>
    <div class="bootcn-footer__bottom">
      <p>
        © {{ year }} Bootcn. Released under the
        <a
          href="https://github.com/bootcndev/bootcn/blob/main/LICENSE"
          target="_blank"
          rel="noreferrer"
          >MIT License</a
        >.
      </p>
    </div>
  </footer>
</template>
