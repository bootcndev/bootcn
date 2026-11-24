import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';

import ComponentMeta from './components/ComponentMeta.vue';
import ComponentPreview from './components/ComponentPreview.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ComponentMeta', ComponentMeta);
    app.component('ComponentPreview', ComponentPreview);
  },
} satisfies Theme;
