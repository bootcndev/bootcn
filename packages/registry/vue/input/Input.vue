<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue';

import '{{bootcn:css}}/input.css';

/** A labelled input with an optional hint and error, wired with aria-describedby; use v-model. */
defineOptions({ inheritAttrs: false });
const props = defineProps<{
  label: string;
  help?: string;
  error?: string;
  id?: string;
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
    <input
      v-bind="attrs"
      :id="fieldId"
      v-model="model"
      class="form-control bootcn-input"
      :aria-describedby="describedBy"
      :aria-invalid="invalid"
    />
    <p v-if="props.help" :id="`${fieldId}-help`" class="bootcn-field__help">{{ props.help }}</p>
    <div v-if="props.error" :id="`${fieldId}-error`" class="invalid-feedback d-block">
      {{ props.error }}
    </div>
  </div>
</template>
