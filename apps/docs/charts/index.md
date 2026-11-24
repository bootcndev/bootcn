---
title: Charts
aside: false
---

<script setup>
import { data as charts } from './charts.data'
</script>

# Charts

<p class="bootcn-lead">Area, bar, line, donut, radar and radial charts, drawn as accessible SVG without a chart library.</p>

Every chart comes from the [Chart component](../components/chart): a `<figure>`
with a small JSON configuration that `chart.js` turns into SVG, with a tooltip,
a legend and the same numbers in a data table ("Show data"). The cards below
are blocks you can install as they are:

```bash
npx bootcn add chart-area
```

<div class="bootcn-chart-gallery">
  <div v-for="item in charts" :key="item.name">
    <ComponentPreview :name="item.name" :title="item.title" kind="blocks" bare />
    <a class="bootcn-chart-gallery__link" :href="`../blocks/${item.name}`">{{ item.title }}: code and options</a>
  </div>
</div>
