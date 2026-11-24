<script setup lang="ts">
/**
 * Live preview in an iframe, so its CSS and JavaScript never touch the docs
 * page (spec 11.3), with Preview / Code tabs. Components and blocks show their
 * registry preview.html; templates show the page the CLI installed (`src`).
 * The frame follows the docs theme (set on load and on every toggle). It grows
 * to fit its content, except `fixed` frames (full pages), which keep a fixed
 * height and scroll. `bare` drops the tabs (home page showcase).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useData, withBase } from 'vitepress';

import DocsTabs from './DocsTabs.vue';

const props = withDefaults(
  defineProps<{
    name: string;
    title: string;
    kind?: string;
    src?: string;
    fixed?: boolean;
    bare?: boolean;
    height?: number;
  }>(),
  { kind: 'components', src: undefined, fixed: false, bare: false, height: 720 },
);

const { isDark } = useData();
const src = withBase(
  props.src ? `/${props.src}` : `/previews/${props.kind}/${props.name}/preview.html`,
);
const newTabHref = computed(() => `${src}?theme=${isDark.value ? 'dark' : 'light'}`);
const frame = ref<HTMLIFrameElement | null>(null);
const frameHeight = ref(props.fixed ? props.height : 360);
let observer: ResizeObserver | undefined;

function fit(): void {
  if (props.fixed) return;
  const doc = frame.value?.contentDocument;
  if (!doc?.documentElement) return;
  frameHeight.value = Math.max(360, Math.ceil(doc.documentElement.scrollHeight));
}

function applyTheme(): void {
  frame.value?.contentDocument?.documentElement?.setAttribute(
    'data-bs-theme',
    isDark.value ? 'dark' : 'light',
  );
}

watch(isDark, applyTheme);

function onLoad(): void {
  applyTheme();
  fit();
  const body = frame.value?.contentDocument?.body;
  if (body && typeof ResizeObserver !== 'undefined') {
    observer?.disconnect();
    observer = new ResizeObserver(fit);
    observer.observe(body);
  }
}

// The frame may finish loading before hydration, when @load has no listener yet.
onMounted(() => {
  if (frame.value?.contentDocument?.readyState === 'complete') onLoad();
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <figure v-if="bare" class="bootcn-preview">
    <iframe
      ref="frame"
      :src="src"
      :title="`${title} preview`"
      :style="{ height: `${frameHeight}px` }"
      loading="lazy"
      @load="onLoad"
    />
  </figure>
  <DocsTabs v-else :labels="['Preview', 'Code']" :label="`${title} preview and code`">
    <template #actions>
      <a :href="newTabHref" target="_blank" rel="noreferrer">Open in a new tab</a>
    </template>
    <template #tab-0>
      <figure class="bootcn-preview">
        <iframe
          ref="frame"
          :src="src"
          :title="`${title} preview`"
          :style="{ height: `${frameHeight}px` }"
          loading="lazy"
          @load="onLoad"
        />
      </figure>
    </template>
    <template #tab-1>
      <slot name="code" />
    </template>
  </DocsTabs>
</template>
