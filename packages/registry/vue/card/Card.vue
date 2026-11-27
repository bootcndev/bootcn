<script setup lang="ts">
import '{{bootcn:css}}/card.css';

/** A card with an optional header, the default slot and an optional #footer slot. */
const props = withDefaults(
  defineProps<{ title?: string; description?: string; titleAs?: 'h2' | 'h3' | 'h4' }>(),
  { titleAs: 'h2' },
);
</script>

<template>
  <article class="card bootcn-card">
    <header v-if="props.title || props.description" class="bootcn-card__header">
      <component :is="props.titleAs" v-if="props.title" class="bootcn-card__title">{{
        props.title
      }}</component>
      <p v-if="props.description" class="bootcn-card__description">{{ props.description }}</p>
    </header>
    <div class="bootcn-card__content"><slot /></div>
    <footer v-if="$slots.footer" class="bootcn-card__footer"><slot name="footer" /></footer>
  </article>
</template>
