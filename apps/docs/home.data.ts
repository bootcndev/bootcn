import { itemsOf, readIndex } from './.vitepress/registry';

/** Counts for the home page, read from the built registry. */
export default {
  watch: ['../../packages/registry/dist/index.json'],
  load() {
    return {
      version: readIndex().version,
      components: itemsOf('components').length,
      blocks: itemsOf('blocks').length,
      templates: itemsOf('templates').length,
    };
  },
};
