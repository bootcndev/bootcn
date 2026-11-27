<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue';

import '{{bootcn:css}}/checkbox.css';

/** A checkbox with its label; use v-model. */
defineOptions({ inheritAttrs: false });
const props = defineProps<{ label: string; id?: string }>();
const model = defineModel<boolean>({ default: false });
const attrs = useAttrs();
const auto = useId();
const inputId = computed(() => props.id ?? auto);
</script>

<template>
  <div class="form-check bootcn-checkbox">
    <input
      v-bind="attrs"
      :id="inputId"
      v-model="model"
      type="checkbox"
      class="form-check-input bootcn-checkbox__input"
    />
    <label class="form-check-label bootcn-checkbox__label" :for="inputId">{{ props.label }}</label>
  </div>
</template>
