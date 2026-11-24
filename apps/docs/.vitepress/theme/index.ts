import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';

import ComponentMeta from './components/ComponentMeta.vue';
import ComponentPreview from './components/ComponentPreview.vue';
import DocsTabs from './components/DocsTabs.vue';
import ThemeBuilder from './components/ThemeBuilder.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ComponentMeta', ComponentMeta);
    app.component('ComponentPreview', ComponentPreview);
    app.component('DocsTabs', DocsTabs);
    app.component('ThemeBuilder', ThemeBuilder);
  },
} satisfies Theme;
