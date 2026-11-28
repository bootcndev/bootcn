<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import '{{bootcn:css}}/popover.css';

/**
 * A small overlay on Bootstrap's Popover, opened by the button in the default
 * slot and closed with Escape. Bootstrap's JavaScript loads in the browser
 * only, so it is safe with server rendering (Nuxt).
 */
const props = withDefaults(
  defineProps<{
    content: string;
    title?: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    /** click (default) toggles it; focus closes it when focus moves away. */
    trigger?: 'click' | 'focus';
  }>(),
  { placement: 'top', trigger: 'click' },
);

interface PopoverInstance {
  hide(): void;
  setContent(content: Record<string, string>): void;
  dispose(): void;
}

const wrapper = ref<HTMLSpanElement | null>(null);
let instance: PopoverInstance | null = null;
let alive = true;

function onKeydown(event: KeyboardEvent) {
  const element = wrapper.value?.firstElementChild;
  if (event.key !== 'Escape' || !(element instanceof HTMLElement)) return;
  if (!element.hasAttribute('aria-describedby')) return;
  instance?.hide();
  element.focus();
}

onMounted(() => {
  const element = wrapper.value?.firstElementChild;
  if (!element) return;
  document.addEventListener('keydown', onKeydown);
  // @ts-ignore: bootstrap has no types unless @types/bootstrap is installed
  import('bootstrap/js/dist/popover').then(({ default: Plugin }) => {
    if (!alive) return;
    instance = new Plugin(element, {
      content: props.content,
      title: props.title ?? '',
      placement: props.placement,
      trigger: props.trigger,
      customClass: 'bootcn-popover',
    }) as PopoverInstance;
  });
});

onBeforeUnmount(() => {
  alive = false;
  document.removeEventListener('keydown', onKeydown);
  instance?.dispose();
  instance = null;
});

watch(
  () => [props.content, props.title],
  () =>
    instance?.setContent({ '.popover-header': props.title ?? '', '.popover-body': props.content }),
);
</script>

<template>
  <span ref="wrapper" style="display: contents"><slot /></span>
</template>
