<script setup lang="ts">
import { computed } from 'vue';

import '{{bootcn:css}}/button.css';

/** Bootcn's button: the same classes as the HTML version, as a Vue component. */
const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    type?: 'button' | 'submit' | 'reset';
  }>(),
  { variant: 'default', size: 'md', type: 'button' },
);

const classes = computed(() => [
  'btn',
  'bootcn-button',
  `bootcn-button--${props.variant}`,
  props.size !== 'md' ? `bootcn-button--${props.size}` : null,
]);
</script>

<template>
  <button :type="props.type" :class="classes"><slot /></button>
</template>
