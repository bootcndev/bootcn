---
title: Templates
---

<script setup>
import { data as groups } from './templates.data'
</script>

# Templates

<p class="bootcn-lead">Complete pages to start from.</p>

The CLI writes the page with its
links already pointing at your CSS and JavaScript folders, and installs every
block and component it uses.

```bash
npx bootcn add admin-dashboard
```

Templates need `bootcn` 0.2.0 or newer.

<template v-for="group in groups" :key="group.label">
  <h2 v-if="groups.length > 1" :id="group.label.toLowerCase().replace(/\s+/g, '-')">{{ group.label }}</h2>
  <ul class="bootcn-grid">
    <li v-for="item in group.items" :key="item.name">
      <a :href="`./${item.name}`"><strong>{{ item.title }}</strong><span>{{ item.description }}</span></a>
    </li>
  </ul>
</template>
