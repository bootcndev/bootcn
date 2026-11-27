<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';

import '{{bootcn:css}}/dialog.css';

/**
 * A modal dialog on Bootstrap's Modal, used with v-model:open. Focus moves in
 * and back; Escape, the × and the backdrop close it. Bootstrap's JavaScript
 * loads in the browser only, so it is safe with server rendering (Nuxt).
 */
const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description?: string;
    size?: 'sm' | 'lg' | 'xl';
    closeLabel?: string;
  }>(),
  { closeLabel: 'Close dialog' },
);
const emit = defineEmits<{ 'update:open': [open: boolean] }>();

interface ModalInstance {
  show(): void;
  hide(): void;
  dispose(): void;
}

const element = ref<HTMLDivElement | null>(null);
let modal: ModalInstance | null = null;
let alive = true;
const id = useId();

// Focus goes back to what opened the dialog (Bootstrap only does that for
// data-bs-toggle buttons).
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
  el.addEventListener('show.bs.modal', onShow);
  el.addEventListener('hidden.bs.modal', onHidden);
  // @ts-ignore: bootstrap has no types unless @types/bootstrap is installed
  import('bootstrap/js/dist/modal').then(({ default: Modal }) => {
    if (!alive) return;
    modal = Modal.getOrCreateInstance(el) as ModalInstance;
    if (props.open) modal.show();
  });
});

onBeforeUnmount(() => {
  alive = false;
  element.value?.removeEventListener('show.bs.modal', onShow);
  element.value?.removeEventListener('hidden.bs.modal', onHidden);
  modal?.dispose();
  modal = null;
});

watch(
  () => props.open,
  (open) => {
    if (!modal) return;
    if (open) modal.show();
    else modal.hide();
  },
);
</script>

<template>
  <div
    ref="element"
    class="modal fade bootcn-dialog"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="`${id}-title`"
    :aria-describedby="props.description ? `${id}-description` : undefined"
  >
    <div
      :class="['modal-dialog', 'modal-dialog-centered', props.size ? `modal-${props.size}` : null]"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h2 :id="`${id}-title`" class="modal-title bootcn-dialog__title">{{ props.title }}</h2>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            :aria-label="props.closeLabel"
          />
        </div>
        <div v-if="props.description || $slots.default" class="modal-body">
          <p v-if="props.description" :id="`${id}-description`" class="bootcn-dialog__description">
            {{ props.description }}
          </p>
          <slot />
        </div>
        <div v-if="$slots.footer" class="modal-footer bootcn-dialog__footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </div>
</template>
