<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue';

import '{{bootcn:css}}/input.css';
import '{{bootcn:css}}/select.css';

/** A labelled select with an optional hint and error, wired with aria-describedby; use v-model. */
defineOptions({ inheritAttrs: false });
const props = defineProps<{
  label: string;
  help?: string;
  error?: string;
  id?: string;
  /** Options as data; or put <option> elements in the default slot. */
  options?: { value: string; label: string; disabled?: boolean }[];
  /** A first, empty option, such as "Choose a country". */
  placeholder?: string;
}>();
const model = defineModel<string>();
const attrs = useAttrs();
const auto = useId();
const fieldId = computed(() => props.id ?? auto);
const describedBy = computed(
  () =>
    [
      attrs['aria-describedby'],
      props.help ? `${fieldId.value}-help` : null,
      props.error ? `${fieldId.value}-error` : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined,
);
const invalid = computed(() =>
  props.error ? 'true' : (attrs['aria-invalid'] as 'true' | 'false' | undefined),
);
</script>

<template>
  <div class="bootcn-field">
    <label :for="fieldId" class="form-label bootcn-field__label">{{ props.label }}</label>
    <select
      v-bind="attrs"
      :id="fieldId"
      v-model="model"
      class="form-select bootcn-select"
      :aria-describedby="describedBy"
      :aria-invalid="invalid"
    >
      <option v-if="props.placeholder !== undefined" value="">{{ props.placeholder }}</option>
      <option
        v-for="option in props.options ?? []"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </option>
      <slot />
    </select>
    <p v-if="props.help" :id="`${fieldId}-help`" class="bootcn-field__help">{{ props.help }}</p>
    <div v-if="props.error" :id="`${fieldId}-error`" class="invalid-feedback d-block">
      {{ props.error }}
    </div>
  </div>
</template>
