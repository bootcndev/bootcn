---
title: Components
---

<script setup>
import { data as groups } from './components.data'
</script>

# Components

Every component is plain HTML, CSS and (when needed) a small vanilla
JavaScript file, built on Bootstrap 5.3. Install one with the CLI, or copy its
files from its page.

```bash
npx bootcn add button
```

<template v-for="group in groups" :key="group.label">
  <h2 :id="group.label.toLowerCase().replace(/\s+/g, '-')">{{ group.label }}</h2>
  <ul>
    <li v-for="item in group.items" :key="item.name">
      <a :href="`./${item.name}`">{{ item.title }}</a>: {{ item.description }}
    </li>
  </ul>
</template>
