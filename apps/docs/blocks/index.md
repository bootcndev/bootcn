---
title: Blocks
aside: false
---

<script setup>
import { data as groups } from './blocks.data'
</script>

# Blocks

<p class="bootcn-lead">Ready-made sections built from the components: sign-in pages, dashboards, navigation, marketing and charts.</p>

Install a block and the CLI brings the components it uses along:

```bash
npx bootcn add login-card
```

<DocsTabs :labels="groups.map((group) => group.label)" label="Block categories">
  <template v-for="(group, index) in groups" :key="group.label" #[`tab-${index}`]>
    <div class="bootcn-block-gallery">
      <section v-for="item in group.items" :key="item.name" class="bootcn-block-gallery__item" :aria-labelledby="`gallery-${item.name}`">
        <div class="bootcn-block-gallery__head">
          <div>
            <h2 :id="`gallery-${item.name}`" class="bootcn-block-gallery__title">{{ item.title }}{{ item.isNew ? ' ' : '' }}<span v-if="item.isNew" class="bootcn-new">New</span></h2>
            <p class="bootcn-block-gallery__text">{{ item.description }}</p>
          </div>
          <a class="bootcn-block-gallery__link" :href="`./${item.name}`">Code and install</a>
        </div>
        <ComponentPreview :name="item.name" :title="item.title" kind="blocks" bare />
      </section>
    </div>
  </template>
</DocsTabs>
