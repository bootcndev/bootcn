<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import '{{bootcn:css}}/tooltip.css';

/**
 * A short hint on Bootstrap's Tooltip, shown on hover and focus of the one
 * element in the default slot (a button or a link) and dismissed with Escape
 * (WCAG 1.4.13). Bootstrap's JavaScript loads in the browser only, so it is
 * safe with server rendering (Nuxt).
 */
const props = withDefaults(
  defineProps<{
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
  }>(),
  { placement: 'top' },
);

interface TooltipInstance {
  hide(): void;
  setContent(content: Record<string, string>): void;
  dispose(): void;
}

const wrapper = ref<HTMLSpanElement | null>(null);
let instance: TooltipInstance | null = null;
let alive = true;

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') instance?.hide();
}

onMounted(() => {
  const element = wrapper.value?.firstElementChild;
  if (!element) return;
  document.addEventListener('keydown', onKeydown);
  // @ts-ignore: bootstrap has no types unless @types/bootstrap is installed
  import('bootstrap/js/dist/tooltip').then(({ default: Plugin }) => {
    if (!alive) return;
    instance = new Plugin(element, {
      title: props.content,
      placement: props.placement,
      customClass: 'bootcn-tooltip',
    }) as TooltipInstance;
  });
});

onBeforeUnmount(() => {
  alive = false;
  document.removeEventListener('keydown', onKeydown);
  instance?.dispose();
  instance = null;
});

watch(
  () => props.content,
  (content) => instance?.setContent({ '.tooltip-inner': content }),
);
</script>

<template>
  <span ref="wrapper" style="display: contents"><slot /></span>
</template>
