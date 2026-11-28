<script lang="ts">
export interface DataTableColumn {
  /** The row field this column shows, sorts and filters by. */
  key: string;
  header: string;
  sortable?: boolean;
  /** Sort as numbers (amounts, counts) instead of text. */
  numeric?: boolean;
  align?: 'start' | 'end';
}
</script>

<script setup lang="ts" generic="Row extends Record<string, unknown>">
import { computed, ref, useId, watchEffect } from 'vue';

import '{{bootcn:css}}/table.css';
import '{{bootcn:css}}/input.css';
import '{{bootcn:css}}/button.css';
import '{{bootcn:css}}/data-table.css';

/**
 * A table with sorting (ascending, descending, original order), filtering,
 * pagination and row selection (v-model:selected, row ids). Custom cells:
 * a slot named `cell-<key>` with `{ row, value }`. The page status is
 * announced.
 */
const props = withDefaults(
  defineProps<{
    columns: DataTableColumn[];
    rows: Row[];
    /** A unique, stable id for each row. */
    rowId: (row: Row) => string;
    /** For screen readers: what the table holds. */
    caption: string;
    pageSize?: number;
    /** A filter field above the table (its hidden label and placeholder). */
    filterLabel?: string;
    filterPlaceholder?: string;
    selectable?: boolean;
    /** Name of a row's checkbox, for screen readers. */
    rowLabel?: (row: Row) => string;
    emptyText?: string;
    previousLabel?: string;
    nextLabel?: string;
  }>(),
  {
    pageSize: 10,
    selectable: false,
    emptyText: 'No rows match.',
    previousLabel: 'Previous',
    nextLabel: 'Next',
  },
);
const selected = defineModel<string[]>('selected', { default: () => [] });

const id = useId();
const query = ref('');
const sort = ref<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
const page = ref(0);
const selectAll = ref<HTMLInputElement | null>(null);

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

const matching = computed(() => {
  const folded = query.value.trim().toLowerCase();
  const list = props.rows.filter(
    (row) =>
      folded === '' ||
      props.columns.some((column) => text(row[column.key]).toLowerCase().includes(folded)),
  );
  const current = sort.value;
  if (!current) return list;
  const column = props.columns.find((item) => item.key === current.key);
  const factor = current.direction === 'ascending' ? 1 : -1;
  const value = (row: Row) =>
    column?.numeric ? Number(row[current.key]) : text(row[current.key]).toLowerCase();
  return list.slice().sort((a, b) => {
    const x = value(a);
    const y = value(b);
    return (x > y ? 1 : x < y ? -1 : 0) * factor;
  });
});

const pages = computed(() => Math.max(1, Math.ceil(matching.value.length / props.pageSize)));
const current = computed(() => Math.min(page.value, pages.value - 1));
const start = computed(() => current.value * props.pageSize);
const shown = computed(() => matching.value.slice(start.value, start.value + props.pageSize));
const visibleIds = computed(() => matching.value.map(props.rowId));
const on = computed(() => visibleIds.value.filter((key) => selected.value.includes(key)).length);

watchEffect(() => {
  if (selectAll.value)
    selectAll.value.indeterminate = on.value > 0 && on.value < visibleIds.value.length;
});

function cycle(key: string) {
  const now = sort.value;
  sort.value =
    !now || now.key !== key
      ? { key, direction: 'ascending' }
      : now.direction === 'ascending'
        ? { key, direction: 'descending' }
        : null;
  page.value = 0;
}

function toggleAll(event: Event) {
  const others = selected.value.filter((key) => !visibleIds.value.includes(key));
  selected.value = (event.target as HTMLInputElement).checked
    ? [...others, ...visibleIds.value]
    : others;
}

function toggle(row: Row, event: Event) {
  const key = props.rowId(row);
  selected.value = (event.target as HTMLInputElement).checked
    ? [...selected.value, key]
    : selected.value.filter((other) => other !== key);
}

function onFilter(event: Event) {
  query.value = (event.target as HTMLInputElement).value;
  page.value = 0;
}

const label = (row: Row) =>
  props.rowLabel ? props.rowLabel(row) : `Select row ${props.rowId(row)}`;
const ariaSort = (column: DataTableColumn) =>
  column.sortable ? (sort.value?.key === column.key ? sort.value.direction : 'none') : undefined;
</script>

<template>
  <div class="bootcn-data-table">
    <div v-if="props.filterLabel" class="bootcn-data-table__toolbar">
      <label class="visually-hidden" :for="`${id}-filter`">{{ props.filterLabel }}</label>
      <input
        :id="`${id}-filter`"
        class="form-control bootcn-input bootcn-data-table__filter"
        type="search"
        :placeholder="props.filterPlaceholder"
        :value="query"
        @input="onFilter"
      />
    </div>
    <div class="table-responsive">
      <table class="table bootcn-table">
        <caption class="visually-hidden">
          {{
            props.caption
          }}
        </caption>
        <thead>
          <tr>
            <th v-if="props.selectable" scope="col" class="bootcn-data-table__check">
              <input
                ref="selectAll"
                class="form-check-input"
                type="checkbox"
                aria-label="Select all rows"
                :checked="visibleIds.length > 0 && on === visibleIds.length"
                @change="toggleAll"
              />
            </th>
            <th
              v-for="column in props.columns"
              :key="column.key"
              scope="col"
              :class="column.align === 'end' ? 'text-end' : undefined"
              :aria-sort="ariaSort(column)"
            >
              <button
                v-if="column.sortable"
                type="button"
                class="bootcn-data-table__sort"
                @click="cycle(column.key)"
              >
                {{ column.header }}
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
              <template v-else>{{ column.header }}</template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in shown"
            :key="props.rowId(row)"
            :class="selected.includes(props.rowId(row)) ? 'is-selected' : undefined"
          >
            <td v-if="props.selectable" class="bootcn-data-table__check">
              <input
                class="form-check-input"
                type="checkbox"
                :aria-label="label(row)"
                :checked="selected.includes(props.rowId(row))"
                @change="toggle(row, $event)"
              />
            </td>
            <td
              v-for="column in props.columns"
              :key="column.key"
              :class="column.align === 'end' ? 'text-end' : undefined"
            >
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">{{
                text(row[column.key])
              }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="bootcn-data-table__empty" :hidden="matching.length !== 0">{{ props.emptyText }}</p>
    <div class="bootcn-data-table__footer">
      <p v-if="props.selectable" class="bootcn-data-table__status">
        {{ selected.length }} of {{ props.rows.length }} rows selected.
      </p>
      <p class="bootcn-data-table__status" role="status">
        {{
          matching.length === 0
            ? 'No rows'
            : `Showing ${start + 1}–${start + shown.length} of ${matching.length}`
        }}
      </p>
      <div class="bootcn-data-table__pages">
        <button
          type="button"
          class="btn bootcn-button bootcn-button--outline bootcn-button--sm"
          :disabled="current === 0"
          @click="page = current - 1"
        >
          {{ props.previousLabel }}
        </button>
        <button
          type="button"
          class="btn bootcn-button bootcn-button--outline bootcn-button--sm"
          :disabled="current >= pages - 1"
          @click="page = current + 1"
        >
          {{ props.nextLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
