<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue';

import '{{bootcn:css}}/switch.css';

/** A switch (a checkbox that reads as on/off) with its label; use v-model. */
defineOptions({ inheritAttrs: false });
const props = defineProps<{ label: string; id?: string }>();
const model = defineModel<boolean>({ default: false });
const attrs = useAttrs();
const auto = useId();
const inputId = computed(() => props.id ?? auto);
</script>

<template>
  <div class="form-check form-switch bootcn-switch">
    <input
      v-bind="attrs"
      :id="inputId"
      v-model="model"
      type="checkbox"
      role="switch"
      class="form-check-input bootcn-switch__input"
    />
    <label class="form-check-label bootcn-switch__label" :for="inputId">{{ props.label }}</label>
  </div>
</template>
