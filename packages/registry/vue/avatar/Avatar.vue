<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import '{{bootcn:css}}/avatar.css';

/** A picture of a person, or their initials when there is none. */
const props = withDefaults(
  defineProps<{
    name: string;
    src?: string;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg';
    square?: boolean;
  }>(),
  { size: 'md' },
);
const failed = ref(false);
watch(
  () => props.src,
  () => (failed.value = false),
);
const initials = computed(
  () =>
    props.fallback ??
    props.name
      .split(/\s+/)
      .map((word) => word[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase(),
);
const classes = computed(() => [
  'bootcn-avatar',
  props.size !== 'md' ? `bootcn-avatar--${props.size}` : null,
  props.square ? 'bootcn-avatar--square' : null,
]);
</script>

<template>
  <span v-if="props.src && !failed" :class="classes">
    <img class="bootcn-avatar__image" :src="props.src" :alt="props.name" @error="failed = true" />
  </span>
  <span v-else :class="classes" role="img" :aria-label="props.name">
    <span class="bootcn-avatar__fallback" aria-hidden="true">{{ initials }}</span>
  </span>
</template>
