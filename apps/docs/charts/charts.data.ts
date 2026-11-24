import { itemsOf } from '../.vitepress/registry';

export default {
  watch: ['../../../packages/registry/dist/index.json'],
  load() {
    return itemsOf('blocks').filter((item) => (item.categories ?? []).includes('charts'));
  },
};
