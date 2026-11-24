---
title: Templates
---

<script setup>
import { data as groups } from './templates.data'
</script>

# Templates

Templates are complete pages to start from. The CLI writes the page with its
links already pointing at your CSS and JavaScript folders, and installs every
block and component it uses.

```bash
npx bootcn add admin-dashboard
```

Templates need `bootcn` 0.2.0 or newer.

<ul>
  <template v-for="group in groups" :key="group.label">
    <li v-for="item in group.items" :key="item.name">
      <a :href="`./${item.name}`">{{ item.title }}</a>: {{ item.description }}
    </li>
  </template>
</ul>
