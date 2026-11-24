<script setup lang="ts">
/**
 * Live preview in an iframe, so its CSS and JavaScript never touch the docs
 * page (spec 11.3). Components and blocks show their registry preview.html;
 * templates show the page the CLI installed (`src`). The frame follows the
 * docs theme (set on load and on every toggle). It grows to fit its content,
 * except `fixed` frames (full pages), which keep a fixed height and scroll.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useData, withBase } from 'vitepress';

const props = withDefaults(
  defineProps<{ name: string; title: string; kind?: string; src?: string; fixed?: boolean }>(),
  { kind: 'components', src: undefined, fixed: false },
);

const { isDark } = useData();
const src = withBase(
  props.src ? `/${props.src}` : `/previews/${props.kind}/${props.name}/preview.html`,
);
const newTabHref = computed(() => `${src}?theme=${isDark.value ? 'dark' : 'light'}`);
const frame = ref<HTMLIFrameElement | null>(null);
const height = ref(props.fixed ? 720 : 320);
let observer: ResizeObserver | undefined;

function fit(): void {
  if (props.fixed) return;
  const doc = frame.value?.contentDocument;
  if (!doc?.documentElement) return;
  height.value = Math.max(320, Math.ceil(doc.documentElement.scrollHeight));
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
  <figure class="bootcn-preview" :class="{ 'bootcn-preview--fixed': fixed }">
    <iframe
      ref="frame"
      :src="src"
      :title="`${title} preview`"
      :style="{ height: `${height}px` }"
      loading="lazy"
      @load="onLoad"
    />
    <figcaption>
      {{ fixed ? 'Live preview of the installed page.' : 'Live preview of the registry source.' }}
      <a :href="newTabHref" target="_blank" rel="noreferrer">Open in a new tab</a>
    </figcaption>
  </figure>
</template>
