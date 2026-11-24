import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import type { Theme } from 'vitepress';

import ComponentMeta from './components/ComponentMeta.vue';
import ComponentPreview from './components/ComponentPreview.vue';
import DocsTabs from './components/DocsTabs.vue';
import HomePage from './components/HomePage.vue';
import SiteFooter from './components/SiteFooter.vue';
import ThemeBuilder from './components/ThemeBuilder.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  // The site footer replaces VitePress's on pages without a sidebar.
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-bottom': () => {
        const { frontmatter } = useData();
        return frontmatter.value.sidebar === false || frontmatter.value.layout === 'home'
          ? h(SiteFooter)
          : null;
      },
    });
  },
  enhanceApp({ app }) {
    app.component('HomePage', HomePage);
    app.component('ComponentMeta', ComponentMeta);
    app.component('ComponentPreview', ComponentPreview);
    app.component('DocsTabs', DocsTabs);
    app.component('ThemeBuilder', ThemeBuilder);
  },
} satisfies Theme;
