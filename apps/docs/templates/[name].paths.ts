import { itemPaths } from '../.vitepress/pages';

export default {
  watch: [
    '../../../packages/registry/dist/**/*.json',
    '../../../packages/registry/templates/*/README.md',
  ],
  paths: () => itemPaths('templates'),
};
