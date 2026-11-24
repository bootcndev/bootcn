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
  if (props.fixed || !frame.value) return;
  const doc = frame.value.contentDocument;
  if (!doc?.documentElement) return;
  // The style height includes the frame's border; without it the content is
  // a couple of pixels short and the frame shows a scrollbar.
  const border = frame.value.offsetHeight - frame.value.clientHeight;
  frameHeight.value = Math.max(360, Math.ceil(doc.documentElement.scrollHeight) + border);
}

/*
 * Preview layout inside the frame (docs only; preview.html opened on its own
 * is unchanged): never show scrollbars, since the frame grows to fit; and for
 * components, center the content and visually hide the preview's own title,
 * which the docs page already shows.
 */
const FRAME_CSS = `
html { overflow: hidden; }
body > main.container:first-child[data-bootcn-docs-center] {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  max-width: none;
  padding: 2.5rem 1.5rem;
}
/* One centered block as wide as its widest child (at least 20rem), so
   full-width children such as separators and tables keep their width. */
.bootcn-docs-stage {
  width: fit-content;
  min-width: min(100%, 20rem);
  max-width: 100%;
}
body > main.container:first-child[data-bootcn-docs-center] > h1:first-child {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}`;

function prepareFrame(): void {
  const doc = frame.value?.contentDocument;
  if (!doc?.head || props.fixed || doc.querySelector('style[data-bootcn-docs]')) return;
  const style = doc.createElement('style');
  style.setAttribute('data-bootcn-docs', '');
  style.textContent = FRAME_CSS;
  doc.head.appendChild(style);
  const main = doc.body?.firstElementChild;
  if (props.kind === 'components' && main?.matches('main.container')) {
    main.setAttribute('data-bootcn-docs-center', '');
    // Moving nodes keeps their listeners, ids and component state.
    const stage = doc.createElement('div');
    stage.className = 'bootcn-docs-stage';
    Array.from(main.children)
      .filter((child) => !(child === main.firstElementChild && child.matches('h1')))
      .forEach((child) => stage.appendChild(child));
    main.appendChild(stage);
  }
}

function applyTheme(): void {
  frame.value?.contentDocument?.documentElement?.setAttribute(
    'data-bs-theme',
    isDark.value ? 'dark' : 'light',
  );
}

watch(isDark, applyTheme);

let mutations: MutationObserver | undefined;

function onLoad(): void {
  prepareFrame();
  applyTheme();
  fit();
  const body = frame.value?.contentDocument?.body;
  if (body && typeof ResizeObserver !== 'undefined') {
    observer?.disconnect();
    observer = new ResizeObserver(fit);
    observer.observe(body);
  }
  // Popups (menus, listboxes, calendars) change the content height without
  // resizing <body>; refit when the preview's DOM changes.
  if (body && !props.fixed) {
    mutations?.disconnect();
    mutations = new MutationObserver(() => requestAnimationFrame(fit));
    mutations.observe(body, { subtree: true, childList: true, attributes: true });
  }
}

// The frame may finish loading before hydration, when @load has no listener yet.
onMounted(() => {
  if (frame.value?.contentDocument?.readyState === 'complete') onLoad();
});

onBeforeUnmount(() => {
  observer?.disconnect();
  mutations?.disconnect();
});
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
