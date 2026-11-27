<script setup lang="ts">
import '{{bootcn:css}}/alert.css';

/**
 * A message in the flow of the page: the title, then the default slot. Add
 * role="alert" only for something that just happened and needs attention.
 * An #icon slot goes before the text, hidden from screen readers.
 */
const props = withDefaults(defineProps<{ title: string; variant?: 'default' | 'destructive' }>(), {
  variant: 'default',
});
</script>

<template>
  <div
    :class="[
      'alert',
      'bootcn-alert',
      props.variant === 'destructive' ? 'bootcn-alert--destructive' : null,
    ]"
  >
    <span v-if="$slots.icon" aria-hidden="true"><slot name="icon" /></span>
    <div class="bootcn-alert__body">
      <p class="bootcn-alert__title">{{ props.title }}</p>
      <div v-if="$slots.default" class="bootcn-alert__description"><slot /></div>
    </div>
  </div>
</template>
