---
title: Blocks
---

<script setup>
import { data as groups } from './blocks.data'
</script>

# Blocks

<p class="bootcn-lead">Ready-made sections built from the components.</p>

Blocks are larger sections built from several components: sign-in forms,
dashboard panels, navigation. Install one and the CLI brings the components it
uses along.

```bash
npx bootcn add login-card
```

<template v-for="group in groups" :key="group.label">
  <h2 v-if="groups.length > 1" :id="group.label.toLowerCase().replace(/\s+/g, '-')">{{ group.label }}</h2>
  <ul class="bootcn-grid">
    <li v-for="item in group.items" :key="item.name">
      <a :href="`./${item.name}`"><strong>{{ item.title }}</strong><span>{{ item.description }}</span></a>
    </li>
  </ul>
</template>
