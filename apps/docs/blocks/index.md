---
title: Blocks
---

<script setup>
import { data as groups } from './blocks.data'
</script>

# Blocks

Blocks are larger sections built from several components: sign-in forms,
dashboard panels, navigation. Install one and the CLI brings the components it
uses along.

```bash
npx bootcn add login-card
```

<template v-for="group in groups" :key="group.label">
  <h2 :id="group.label.toLowerCase().replace(/\s+/g, '-')">{{ group.label }}</h2>
  <ul>
    <li v-for="item in group.items" :key="item.name">
      <a :href="`./${item.name}`">{{ item.title }}</a>: {{ item.description }}
    </li>
  </ul>
</template>
