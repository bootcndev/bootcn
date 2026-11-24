import { itemPaths } from '../.vitepress/pages';

export default {
  watch: [
    '../../../packages/registry/dist/**/*.json',
    '../../../packages/registry/blocks/*/README.md',
  ],
  paths: () => itemPaths('blocks'),
};
