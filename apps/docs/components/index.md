---
title: Components
---

<script setup>
import { data as groups } from './components.data'
</script>

# Components

<p class="bootcn-lead">Accessible building blocks in HTML, CSS and vanilla JavaScript, on Bootstrap 5.3.</p>

Every component is plain HTML, CSS and (when needed) a small vanilla
JavaScript file, built on [Bootstrap 5.3](https://getbootstrap.com/). Install one with the CLI, or copy its
files from its page.

```bash
npx bootcn add button
```

<template v-for="group in groups" :key="group.label">
  <h2 v-if="groups.length > 1" :id="group.label.toLowerCase().replace(/\s+/g, '-')">{{ group.label }}</h2>
  <ul class="bootcn-grid">
    <li v-for="item in group.items" :key="item.name">
      <a :href="`./${item.name}`"><strong>{{ item.title }}{{ item.isNew ? ' ' : '' }}<span v-if="item.isNew" class="bootcn-new">New</span></strong><span>{{ item.description }}</span></a>
    </li>
  </ul>
</template>
