<script setup lang="ts">
import '{{bootcn:css}}/badge.css';

/** A small label for a status or a count. */
const props = withDefaults(
  defineProps<{ variant?: 'default' | 'secondary' | 'outline' | 'destructive' }>(),
  {
    variant: 'default',
  },
);
</script>

<template>
  <span :class="['badge', 'bootcn-badge', `bootcn-badge--${props.variant}`]"><slot /></span>
</template>
