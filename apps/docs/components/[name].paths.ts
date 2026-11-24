import { itemPaths } from '../.vitepress/pages';

export default {
  watch: [
    '../../../packages/registry/dist/**/*.json',
    '../../../packages/registry/components/*/README.md',
  ],
  paths: () => itemPaths('components'),
};
