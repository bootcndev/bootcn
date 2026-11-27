<script setup lang="ts">
import { ref, useId } from 'vue';

import '{{bootcn:css}}/tabs.css';

/**
 * Tabs on the WAI-ARIA pattern; use v-model for the selected tab and a slot
 * named after each tab's value for its panel. Arrow keys move and select
 * (mirrored right to left), Home and End jump.
 */
const props = defineProps<{
  label: string;
  items: { value: string; label: string; disabled?: boolean }[];
}>();
const model = defineModel<string>();
const base = useId();
const tabs = ref<Record<string, HTMLButtonElement | null>>({});

function selected(): string | undefined {
  return model.value ?? props.items[0]?.value;
}

function select(value: string) {
  model.value = value;
}

function onKeydown(event: KeyboardEvent) {
  const enabled = props.items.filter((item) => !item.disabled);
  const index = enabled.findIndex((item) => item.value === selected());
  const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
  const step = ({ ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 } as Record<string, number>)[
    event.key
  ];
  let next;
  if (step) next = enabled[(index + step + enabled.length) % enabled.length];
  else if (event.key === 'Home') next = enabled[0];
  else if (event.key === 'End') next = enabled[enabled.length - 1];
  if (!next) return;
  event.preventDefault();
  select(next.value);
  tabs.value[next.value]?.focus();
}
</script>

<template>
  <div class="bootcn-tabs">
    <div
      class="nav bootcn-tabs__list"
      role="tablist"
      :aria-label="props.label"
      @keydown="onKeydown"
    >
      <button
        v-for="item in props.items"
        :key="item.value"
        :ref="(el) => (tabs[item.value] = el as HTMLButtonElement | null)"
        type="button"
        role="tab"
        :id="`${base}-tab-${item.value}`"
        :aria-controls="`${base}-panel-${item.value}`"
        :aria-selected="item.value === selected()"
        :tabindex="item.value === selected() ? 0 : -1"
        :disabled="item.disabled"
        :class="['nav-link', item.value === selected() ? 'active' : null]"
        @click="select(item.value)"
      >
        {{ item.label }}
      </button>
    </div>
    <div class="tab-content">
      <div
        v-for="item in props.items"
        :key="item.value"
        role="tabpanel"
        :id="`${base}-panel-${item.value}`"
        :aria-labelledby="`${base}-tab-${item.value}`"
        tabindex="0"
        :hidden="item.value !== selected()"
        :class="[
          'tab-pane',
          'bootcn-tabs__panel',
          item.value === selected() ? 'show active' : null,
        ]"
      >
        <slot :name="item.value" />
      </div>
    </div>
  </div>
</template>
