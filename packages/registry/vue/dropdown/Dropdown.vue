<script lang="ts">
export type DropdownItem =
  | {
      type?: 'item';
      label: string;
      /** A link: the item is an <a>. */
      href?: string;
      onSelect?: () => void;
      /** Shown at the end, for example ⌘P (hidden from screen readers). */
      shortcut?: string;
      disabled?: boolean;
      destructive?: boolean;
    }
  | { type: 'label'; label: string }
  | { type: 'separator' };
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue';

import '{{bootcn:css}}/button.css';
import '{{bootcn:css}}/dropdown.css';

/**
 * A menu of actions on Bootstrap's Dropdown: arrow keys move between items,
 * Escape closes it and focus returns to the trigger. The trigger's content is
 * the default slot (or `label`). Bootstrap's JavaScript loads in the browser
 * only, so it is safe with server rendering (Nuxt).
 */
const props = withDefaults(
  defineProps<{
    label?: string;
    items: DropdownItem[];
    variant?: 'default' | 'secondary' | 'outline' | 'ghost';
    align?: 'start' | 'end';
  }>(),
  { variant: 'outline', align: 'start' },
);
const emit = defineEmits<{ select: [item: DropdownItem, index: number] }>();

interface DropdownInstance {
  hide(): void;
  dispose(): void;
}

const trigger = ref<HTMLButtonElement | null>(null);
let instance: DropdownInstance | null = null;
let alive = true;
const id = useId();

onMounted(() => {
  const element = trigger.value;
  if (!element) return;
  // @ts-ignore: bootstrap has no types unless @types/bootstrap is installed
  import('bootstrap/js/dist/dropdown').then(({ default: Plugin }) => {
    if (alive) instance = Plugin.getOrCreateInstance(element) as DropdownInstance;
  });
});

onBeforeUnmount(() => {
  alive = false;
  instance?.dispose();
  instance = null;
});

function choose(item: DropdownItem, index: number) {
  instance?.hide();
  trigger.value?.focus();
  if (item.type !== 'label' && item.type !== 'separator') item.onSelect?.();
  emit('select', item, index);
}

function itemClass(item: DropdownItem) {
  return [
    'dropdown-item',
    'bootcn-dropdown__item',
    'destructive' in item && item.destructive ? 'bootcn-dropdown__item--destructive' : null,
  ];
}
</script>

<template>
  <div class="dropdown bootcn-dropdown">
    <button
      :id="`${id}-trigger`"
      ref="trigger"
      :class="['btn', 'bootcn-button', `bootcn-button--${props.variant}`, 'dropdown-toggle']"
      type="button"
      data-bs-toggle="dropdown"
      aria-expanded="false"
    >
      <slot>{{ props.label }}</slot>
    </button>
    <ul
      :class="[
        'dropdown-menu',
        'bootcn-dropdown__menu',
        props.align === 'end' ? 'dropdown-menu-end' : null,
      ]"
      :aria-labelledby="`${id}-trigger`"
    >
      <li v-for="(item, index) in props.items" :key="index">
        <hr v-if="item.type === 'separator'" class="dropdown-divider bootcn-dropdown__divider" />
        <span v-else-if="item.type === 'label'" class="dropdown-header bootcn-dropdown__label">{{
          item.label
        }}</span>
        <a
          v-else-if="item.href && !item.disabled"
          :class="itemClass(item)"
          :href="item.href"
          @click="item.onSelect?.()"
        >
          {{ item.label }}
          <span v-if="item.shortcut" class="bootcn-dropdown__shortcut" aria-hidden="true">{{
            item.shortcut
          }}</span>
        </a>
        <button
          v-else
          :class="itemClass(item)"
          type="button"
          :disabled="item.disabled"
          @click="choose(item, index)"
        >
          {{ item.label }}
          <span v-if="item.shortcut" class="bootcn-dropdown__shortcut" aria-hidden="true">{{
            item.shortcut
          }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
