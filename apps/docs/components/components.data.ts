import { groupedComponents } from '../.vitepress/registry';

export default {
  watch: ['../../../packages/registry/dist/index.json'],
  load() {
    return groupedComponents();
  },
};
