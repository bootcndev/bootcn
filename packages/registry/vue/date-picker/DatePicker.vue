<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';

import '{{bootcn:css}}/button.css';
import '{{bootcn:css}}/label.css';
import '{{bootcn:css}}/calendar.css';
import '{{bootcn:css}}/date-picker.css';

/**
 * A button that opens a calendar and shows the chosen date, used with v-model
 * (YYYY-MM-DD). The calendar is a WAI-ARIA date grid (arrow keys, Page
 * Up/Down, Home/End) drawn by calendar.js; the popover is Bootstrap's
 * Dropdown. Both load in the browser only, so it is safe with server
 * rendering (Nuxt).
 */
const props = withDefaults(
  defineProps<{
    label: string;
    placeholder?: string;
    /** Earliest and latest dates, YYYY-MM-DD. */
    min?: string;
    max?: string;
    /** 0 = Sunday … 6 = Saturday (default 1, Monday). */
    weekStart?: number;
    /** Month and day names; default: the page's lang. */
    locale?: string;
    /** A hidden input with this name carries the value in forms. */
    name?: string;
    dialogLabel?: string;
    previousLabel?: string;
    nextLabel?: string;
  }>(),
  {
    placeholder: 'Pick a date',
    dialogLabel: 'Choose a date',
    previousLabel: 'Previous month',
    nextLabel: 'Next month',
  },
);
const model = defineModel<string>({ default: '' });

interface CalendarApi {
  init(root: Element): void;
  setValue(root: Element, value: string): void;
  focus(root: Element): void;
}

interface DropdownInstance {
  hide(): void;
  dispose(): void;
}

const id = useId();
const root = ref<HTMLDivElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const calendar = ref<HTMLDivElement | null>(null);
let api: CalendarApi | null = null;
let dropdown: DropdownInstance | null = null;
let syncing = false;
let alive = true;
// Formatted after mount, so server and browser render the same text.
const shown = ref<string | null>(null);

function format(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const lang = props.locale ?? (document.documentElement.lang || 'en');
  return new Intl.DateTimeFormat(lang, { dateStyle: 'long' }).format(date);
}

function onSelect(event: Event) {
  if (syncing) return;
  model.value = (event as CustomEvent<{ value: string }>).detail.value;
  dropdown?.hide();
  trigger.value?.focus();
}

// Focus the selected day (or today) when the calendar opens.
function onShown() {
  if (api && calendar.value) api.focus(calendar.value);
}

onMounted(() => {
  const element = root.value;
  const button = trigger.value;
  if (!element || !button) return;
  shown.value = format(model.value);
  element.addEventListener('bootcn:calendar:select', onSelect);
  element.addEventListener('shown.bs.dropdown', onShown);
  Promise.all([
    // @ts-ignore: a plain script that sets window.Bootcn.calendar; it has no types
    import('{{bootcn:js}}/calendar.js'),
    // @ts-ignore: bootstrap has no types unless @types/bootstrap is installed
    import('bootstrap/js/dist/dropdown'),
  ]).then(([, { default: Dropdown }]) => {
    if (!alive) return;
    api = (window as unknown as { Bootcn: { calendar: CalendarApi } }).Bootcn.calendar;
    api.init(element);
    dropdown = Dropdown.getOrCreateInstance(button) as DropdownInstance;
  });
});

onBeforeUnmount(() => {
  alive = false;
  root.value?.removeEventListener('bootcn:calendar:select', onSelect);
  root.value?.removeEventListener('shown.bs.dropdown', onShown);
  dropdown?.dispose();
  dropdown = null;
});

// A value set from outside: show its month and select it.
watch([model, () => props.locale], ([value]) => {
  shown.value = format(value);
  const grid = calendar.value;
  if (!api || !grid || !value || grid.getAttribute('data-value') === value) return;
  syncing = true;
  api.setValue(grid, value);
  syncing = false;
});
</script>

<template>
  <div ref="root" class="dropdown bootcn-date-picker">
    <span :id="`${id}-label`" class="bootcn-label">{{ props.label }}</span>
    <button
      ref="trigger"
      type="button"
      class="btn bootcn-button bootcn-button--outline bootcn-date-picker__trigger"
      data-bs-toggle="dropdown"
      data-bs-auto-close="outside"
      aria-expanded="false"
      aria-haspopup="dialog"
      :aria-labelledby="`${id}-label ${id}-text`"
      :data-empty="shown ? undefined : ''"
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
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </svg>
      <span :id="`${id}-text`">{{ shown ?? props.placeholder }}</span>
    </button>
    <div
      class="dropdown-menu bootcn-date-picker__popover"
      role="dialog"
      :aria-label="props.dialogLabel"
    >
      <div
        ref="calendar"
        class="bootcn-calendar"
        data-bootcn-calendar=""
        :data-value="model || undefined"
        :data-min="props.min"
        :data-max="props.max"
        :data-week-start="props.weekStart"
        :data-locale="props.locale"
      >
        <div class="bootcn-calendar__header">
          <button
            type="button"
            class="bootcn-calendar__nav"
            data-bootcn-calendar-prev=""
            :aria-label="props.previousLabel"
          >
            <svg
              class="bootcn-icon bootcn-rtl-flip"
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
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <!-- calendar.js writes the month here. -->
          <h2 :id="`${id}-title`" class="bootcn-calendar__title" aria-live="polite" />
          <button
            type="button"
            class="bootcn-calendar__nav"
            data-bootcn-calendar-next=""
            :aria-label="props.nextLabel"
          >
            <svg
              class="bootcn-icon bootcn-rtl-flip"
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
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
        <!-- calendar.js draws the weekdays and days. -->
        <table class="bootcn-calendar__grid" role="grid" :aria-labelledby="`${id}-title`">
          <thead>
            <tr />
          </thead>
          <tbody />
        </table>
      </div>
    </div>
    <input v-if="props.name" type="hidden" :name="props.name" :value="model" />
  </div>
</template>
