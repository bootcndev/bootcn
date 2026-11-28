<script lang="ts">
export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue';

import '{{bootcn:css}}/label.css';
import '{{bootcn:css}}/combobox.css';

/**
 * A searchable select (WAI-ARIA combobox with a listbox), used with v-model:
 * type to filter, arrow keys to move, Enter to choose, Escape to close.
 * Matching ignores case and accents; the number of results is announced.
 */
const props = withDefaults(
  defineProps<{
    label: string;
    options: ComboboxOption[];
    placeholder?: string;
    /** Shown when nothing matches. */
    emptyText?: string;
    /** A hidden input with this name carries the value in forms. */
    name?: string;
    id?: string;
    disabled?: boolean;
    /** Announced counts: (count) => text. */
    countText?: (count: number) => string;
  }>(),
  {
    emptyText: 'No results.',
    countText: (count: number) => (count === 1 ? '1 result.' : `${count} results.`),
  },
);
const model = defineModel<string>({ default: '' });

const autoId = useId();
const base = computed(() => props.id ?? autoId);
const selectedLabel = computed(
  () => props.options.find((option) => option.value === model.value)?.label ?? '',
);
const text = ref(selectedLabel.value);
const query = ref('');
const open = ref(false);
const active = ref<string | null>(null);
const status = ref('');
const listbox = ref<HTMLUListElement | null>(null);
const input = ref<HTMLInputElement | null>(null);

// Case- and accent-insensitive matching ("e" finds "é").
function fold(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const visible = computed(() => {
  const folded = fold(query.value.trim());
  return props.options.filter((option) => folded === '' || fold(option.label).includes(folded));
});
const enabled = computed(() => visible.value.filter((option) => !option.disabled));
const expanded = computed(() => open.value && visible.value.length > 0);
const activeOption = computed(() => enabled.value.find((option) => option.value === active.value));
const optionId = (option: ComboboxOption) => `${base.value}-option-${option.value}`;

// Show the chosen label when the value changes from outside.
watch(selectedLabel, (label) => {
  if (!open.value) text.value = label;
});

watch(active, async (value) => {
  await nextTick();
  if (!value || !listbox.value) return;
  listbox.value
    .querySelector(`[data-value="${CSS.escape(value)}"]`)
    ?.scrollIntoView({ block: 'nearest' });
});

function show(last = false) {
  const list = enabled.value;
  open.value = true;
  status.value = list.length === 0 ? props.emptyText : props.countText(list.length);
  if (!active.value || !list.some((option) => option.value === active.value)) {
    active.value = (last ? list[list.length - 1] : list[0])?.value ?? null;
  }
}

function close() {
  open.value = false;
  active.value = null;
  query.value = '';
  text.value = selectedLabel.value;
}

function choose(option: ComboboxOption) {
  if (option.disabled) return;
  model.value = option.value;
  text.value = option.label;
  open.value = false;
  active.value = null;
  query.value = '';
}

function move(step: number) {
  const list = enabled.value;
  if (list.length === 0) return;
  const index = list.findIndex((option) => option.value === active.value);
  active.value = list[(index + step + list.length) % list.length]!.value;
}

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  text.value = value;
  query.value = value;
  active.value = null;
  show();
}

function onKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (!open.value) show();
      else if (!event.altKey) move(1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (event.altKey) close();
      else if (!open.value) show(true);
      else move(-1);
      break;
    case 'Home':
    case 'End': {
      const list = enabled.value;
      if (!open.value || list.length === 0) return;
      event.preventDefault();
      active.value = (event.key === 'Home' ? list[0] : list[list.length - 1])!.value;
      break;
    }
    case 'Enter':
      if (open.value && activeOption.value) {
        event.preventDefault();
        choose(activeOption.value);
      }
      break;
    case 'Escape':
      if (open.value) {
        event.preventDefault();
        close();
      } else if (text.value) {
        text.value = '';
      }
      break;
    default:
      break;
  }
}

function onFocusout(event: FocusEvent) {
  const root = event.currentTarget as HTMLElement;
  if (!root.contains(event.relatedTarget as Node | null)) close();
}

function onToggle() {
  if (open.value) close();
  else show();
  input.value?.focus();
}
</script>

<template>
  <div class="bootcn-combobox" @focusout="onFocusout">
    <label :id="`${base}-label`" class="bootcn-label" :for="`${base}-input`">{{
      props.label
    }}</label>
    <div class="bootcn-combobox__control">
      <input
        :id="`${base}-input`"
        ref="input"
        class="bootcn-combobox__input"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="expanded"
        :aria-controls="`${base}-listbox`"
        :aria-activedescendant="expanded && activeOption ? optionId(activeOption) : undefined"
        autocomplete="off"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        :value="text"
        @input="onInput"
        @click="show()"
        @keydown="onKeydown"
      />
      <button
        type="button"
        class="bootcn-combobox__toggle"
        tabindex="-1"
        aria-hidden="true"
        :disabled="props.disabled"
        @mousedown.prevent="onToggle"
      >
        <svg
          class="bootcn-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </svg>
      </button>
    </div>
    <!-- mousedown.prevent keeps focus in the input when choosing with the pointer. -->
    <ul
      :id="`${base}-listbox`"
      ref="listbox"
      class="bootcn-combobox__listbox"
      role="listbox"
      :aria-labelledby="`${base}-label`"
      :hidden="!expanded"
      @mousedown.prevent
    >
      <li
        v-for="option in visible"
        :id="optionId(option)"
        :key="option.value"
        :class="['bootcn-combobox__option', option.value === active ? 'is-active' : null]"
        role="option"
        :data-value="option.value"
        :aria-selected="option.value === model"
        :aria-disabled="option.disabled || undefined"
        @click="choose(option)"
      >
        <span>{{ option.label }}</span>
        <svg
          class="bootcn-icon bootcn-combobox__check"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </li>
    </ul>
    <p class="bootcn-combobox__empty" :hidden="!(open && visible.length === 0)">
      {{ props.emptyText }}
    </p>
    <p class="visually-hidden" role="status" aria-live="polite">{{ status }}</p>
    <input v-if="props.name" type="hidden" :name="props.name" :value="model" />
  </div>
</template>
