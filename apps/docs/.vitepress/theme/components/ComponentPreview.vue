<script setup lang="ts">
/**
 * Live preview: the component's own preview.html from the registry, in an
 * iframe so its CSS and JavaScript never touch the docs page (spec 11.3).
 * The frame grows to fit its content (same origin) and follows the docs
 * theme: preview.html reads it on load, and toggles are mirrored here.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useData, withBase } from 'vitepress';

const props = defineProps<{ name: string; title: string }>();

const { isDark } = useData();
const src = withBase(`/previews/components/${props.name}/preview.html`);
const newTabHref = computed(() => `${src}?theme=${isDark.value ? 'dark' : 'light'}`);
const frame = ref<HTMLIFrameElement | null>(null);
const height = ref(320);
let observer: ResizeObserver | undefined;

function fit(): void {
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
  <figure class="bootcn-preview">
    <iframe
      ref="frame"
      :src="src"
      :title="`${title} preview`"
      :style="{ height: `${height}px` }"
      loading="lazy"
      @load="onLoad"
    />
    <figcaption>
      Live preview of the registry source.
      <a :href="newTabHref" target="_blank" rel="noreferrer">Open in a new tab</a>
    </figcaption>
  </figure>
</template>
