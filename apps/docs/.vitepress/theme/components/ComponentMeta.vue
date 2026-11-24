<script setup lang="ts">
defineProps<{ version: string; bootstrap: string; requires: string; source: string }>();
</script>

<template>
  <ul class="bootcn-meta" aria-label="Component details">
    <li v-if="version"><span>Version</span> {{ version }}</li>
    <li><span>Bootstrap</span> {{ bootstrap }}+</li>
    <li><span>Requires</span> {{ requires }}</li>
    <li><a :href="source" target="_blank" rel="noreferrer">Source on GitHub</a></li>
  </ul>
</template>
