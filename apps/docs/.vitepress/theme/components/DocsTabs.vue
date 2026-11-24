<script setup lang="ts">
/**
 * Accessible tabs (WAI-ARIA tabs pattern): arrow keys, Home and End move
 * between tabs; panels stay in the DOM (v-show) so their content is rendered
 * at build time and searchable. Slots: `tab-0`, `tab-1`… and `actions`.
 */
import { ref, useId } from 'vue';

const props = defineProps<{ labels: string[]; label: string }>();
const selected = ref(0);
const id = useId();
const tabs = ref<HTMLButtonElement[]>([]);

function select(index: number, focus = false): void {
  const count = props.labels.length;
  selected.value = (index + count) % count;
  if (focus) tabs.value[selected.value]?.focus();
}

function onKeydown(event: KeyboardEvent): void {
  const moves: Record<string, number> = {
    ArrowRight: selected.value + 1,
    ArrowLeft: selected.value - 1,
    Home: 0,
    End: props.labels.length - 1,
  };
  const next = moves[event.key];
  if (next === undefined) return;
  event.preventDefault();
  select(next, true);
}
</script>

<template>
  <div class="bootcn-tabs">
    <div class="bootcn-tabs__list">
      <div role="tablist" class="bootcn-tabs__tablist" :aria-label="label" @keydown="onKeydown">
        <button
          v-for="(text, index) in labels"
          :id="`${id}-tab-${index}`"
          :key="text"
          ref="tabs"
          type="button"
          role="tab"
          class="bootcn-tabs__tab"
          :aria-selected="selected === index"
          :aria-controls="`${id}-panel-${index}`"
          :tabindex="selected === index ? 0 : -1"
          @click="select(index)"
        >
          {{ text }}
        </button>
      </div>
      <div v-if="$slots.actions" class="bootcn-tabs__actions"><slot name="actions" /></div>
    </div>
    <div
      v-for="(text, index) in labels"
      v-show="selected === index"
      :id="`${id}-panel-${index}`"
      :key="text"
      role="tabpanel"
      class="bootcn-tabs__panel"
      :aria-labelledby="`${id}-tab-${index}`"
      tabindex="0"
    >
      <slot :name="`tab-${index}`" />
    </div>
  </div>
</template>
