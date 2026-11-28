<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';

import '{{bootcn:css}}/sheet.css';

/**
 * A panel that slides in from an edge, on Bootstrap's Offcanvas, used with
 * v-model:open. Focus moves in and back; Escape, the × and the backdrop close
 * it. Bootstrap's JavaScript loads in the browser only, so it is safe with
 * server rendering (Nuxt).
 */
const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description?: string;
    /** The edge it slides in from; end is the right in left-to-right pages. */
    side?: 'start' | 'end' | 'top' | 'bottom';
    closeLabel?: string;
  }>(),
  { side: 'end', closeLabel: 'Close' },
);
const emit = defineEmits<{ 'update:open': [open: boolean] }>();

interface OffcanvasInstance {
  show(): void;
  hide(): void;
  dispose(): void;
}

const element = ref<HTMLDivElement | null>(null);
let panel: OffcanvasInstance | null = null;
let alive = true;
const id = useId();

let opener: HTMLElement | null = null;
function onShow() {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
}
function onHidden() {
  if (opener?.isConnected) opener.focus();
  opener = null;
  if (props.open) emit('update:open', false);
}

onMounted(() => {
  const el = element.value;
  if (!el) return;
  el.addEventListener('show.bs.offcanvas', onShow);
  el.addEventListener('hidden.bs.offcanvas', onHidden);
  // @ts-ignore: bootstrap has no types unless @types/bootstrap is installed
  import('bootstrap/js/dist/offcanvas').then(({ default: Offcanvas }) => {
    if (!alive) return;
    panel = Offcanvas.getOrCreateInstance(el) as OffcanvasInstance;
    if (props.open) panel.show();
  });
});

onBeforeUnmount(() => {
  alive = false;
  element.value?.removeEventListener('show.bs.offcanvas', onShow);
  element.value?.removeEventListener('hidden.bs.offcanvas', onHidden);
  panel?.dispose();
  panel = null;
});

watch(
  () => props.open,
  (open) => {
    if (!panel) return;
    if (open) panel.show();
    else panel.hide();
  },
);
</script>

<template>
  <div
    ref="element"
    :class="['offcanvas', `offcanvas-${props.side}`, 'bootcn-sheet']"
    tabindex="-1"
    :aria-labelledby="`${id}-title`"
    :aria-describedby="props.description ? `${id}-description` : undefined"
  >
    <div class="offcanvas-header bootcn-sheet__header">
      <div>
        <h2 :id="`${id}-title`" class="offcanvas-title bootcn-sheet__title">{{ props.title }}</h2>
        <p v-if="props.description" :id="`${id}-description`" class="bootcn-sheet__description">
          {{ props.description }}
        </p>
      </div>
      <button
        type="button"
        class="btn-close"
        data-bs-dismiss="offcanvas"
        :aria-label="props.closeLabel"
      />
    </div>
    <div class="offcanvas-body bootcn-sheet__body"><slot /></div>
    <div v-if="$slots.footer" class="bootcn-sheet__footer"><slot name="footer" /></div>
  </div>
</template>
