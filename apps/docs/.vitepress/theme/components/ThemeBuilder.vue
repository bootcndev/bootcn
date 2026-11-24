<script setup lang="ts">
/**
 * Theme builder: pick a style, a neutral scale, a primary color and a radius,
 * see them live on the installed admin dashboard template, and copy the CSS.
 * The soft style is the registry's themes/soft/soft.css, included as is.
 * Every palette was checked beforehand: text pairs keep 4.5:1 and focus rings
 * 3:1 in both themes (palettes.json).
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useData, withBase } from 'vitepress';

import palettes from '../palettes.json';
import softCss from '../../../../../packages/registry/themes/soft/soft.css?raw';

type Roles = Record<string, string>;

const { isDark } = useData();
const bases = Object.keys(palettes.bases) as (keyof typeof palettes.bases)[];
const primaries = Object.keys(palettes.primaries) as (keyof typeof palettes.primaries)[];
const radii = [0, 0.3, 0.5, 0.75, 1];

const styles = ['default', 'soft'] as const;
const style = ref<(typeof styles)[number]>('default');
const base = ref<(typeof bases)[number]>('zinc');
const primary = ref<(typeof primaries)[number]>('neutral');
const radius = ref(0.5);
const copied = ref(false);
const frame = ref<HTMLIFrameElement | null>(null);
const src = withBase('/previews/templates/admin-dashboard/admin-dashboard.html');

function rgb(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function rem(value: number): string {
  return `${Math.max(0, Math.round(value * 1000) / 1000)}rem`;
}

function block(selector: string, mode: 'light' | 'dark'): string {
  const scale = palettes.bases[base.value][mode] as Roles;
  const accent = palettes.primaries[primary.value] as null | Record<'light' | 'dark', Roles>;
  // Neutral primary: the 900 step on the 50 step in light mode, and the
  // reverse in dark mode ("tertiary" holds 50 in light and 900 in dark).
  const neutralPrimary =
    mode === 'light'
      ? { primary: scale.secondaryForeground, primaryForeground: scale.tertiary }
      : { primary: scale.foreground, primaryForeground: scale.tertiary };
  const p = accent ? accent[mode] : neutralPrimary;
  const lines = [
    `--bootcn-background: ${scale.background};`,
    `--bootcn-foreground: ${scale.foreground};`,
    `--bootcn-muted: ${scale.muted};`,
    `--bootcn-muted-foreground: ${scale.mutedForeground};`,
    `--bootcn-accent: ${scale.accent};`,
    `--bootcn-accent-foreground: ${scale.accentForeground};`,
    `--bootcn-secondary: ${scale.secondary};`,
    `--bootcn-secondary-foreground: ${scale.secondaryForeground};`,
    `--bootcn-primary: ${p.primary};`,
    `--bootcn-primary-foreground: ${p.primaryForeground};`,
    `--bootcn-border-color: ${scale.border};`,
    `--bootcn-input: ${scale.input};`,
    `--bootcn-ring: ${scale.ring};`,
    `--bs-body-bg-rgb: ${rgb(scale.background)};`,
    `--bs-body-color-rgb: ${rgb(scale.foreground)};`,
    `--bs-emphasis-color-rgb: ${rgb(scale.foreground)};`,
    `--bs-secondary-color-rgb: ${rgb(scale.mutedForeground)};`,
    `--bs-secondary-bg-rgb: ${rgb(scale.muted)};`,
    `--bs-tertiary-color-rgb: ${rgb(scale.mutedForeground)};`,
    `--bs-tertiary-bg: ${scale.tertiary};`,
    `--bs-tertiary-bg-rgb: ${rgb(scale.tertiary)};`,
    `--bs-primary-rgb: ${rgb(p.primary)};`,
    `--bs-link-color-rgb: ${rgb(scale.foreground)};`,
    `--bs-link-hover-color-rgb: ${rgb(scale.foreground)};`,
    `--bs-focus-ring-color: rgba(${rgb(scale.ring)}, 0.5);`,
  ];
  if (mode === 'light') {
    lines.push(
      `--bs-border-radius-sm: ${rem(radius.value - 0.25)};`,
      `--bs-border-radius: ${rem(radius.value - 0.125)};`,
      `--bs-border-radius-lg: ${rem(radius.value)};`,
      `--bs-border-radius-xl: ${rem(radius.value + 0.25)};`,
    );
  }
  return `${selector} {\n${lines.map((line) => `  ${line}`).join('\n')}\n}`;
}

// The soft style looks best with larger corners: switching sets the radius,
// which can still be changed afterwards.
watch(style, (value) => {
  radius.value = value === 'soft' ? 0.75 : 0.5;
});

const css = computed(
  () =>
    `/* Bootcn theme: ${style.value} style, ${base.value} base, ${primary.value} primary, ${radius.value}rem radius.\n   Load after tokens.css and the component styles. */\n` +
    (style.value === 'soft' ? `\n${softCss.trim()}\n\n/* Colors and radius */\n` : '') +
    `${block(":root,\n[data-bs-theme='light']", 'light')}\n\n${block("[data-bs-theme='dark']", 'dark')}\n`,
);

function apply(): void {
  const doc = frame.value?.contentDocument;
  if (!doc?.head) return;
  let style = doc.getElementById('bootcn-theme-builder') as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement('style');
    style.id = 'bootcn-theme-builder';
    doc.head.appendChild(style);
  }
  style.textContent = css.value;
  doc.documentElement.setAttribute('data-bs-theme', isDark.value ? 'dark' : 'light');
}

watch([css, isDark], apply);
onMounted(() => {
  if (frame.value?.contentDocument?.readyState === 'complete') apply();
});

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(css.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    copied.value = false;
  }
}
</script>

<template>
  <div class="bootcn-theme-builder">
    <div class="bootcn-theme-builder__controls">
      <fieldset>
        <legend>Style</legend>
        <label v-for="name in styles" :key="name" class="bootcn-theme-builder__option">
          <input v-model="style" type="radio" name="bootcn-theme-style" :value="name" />
          {{ name }}
        </label>
      </fieldset>
      <fieldset>
        <legend>Base color</legend>
        <label v-for="name in bases" :key="name" class="bootcn-theme-builder__option">
          <input v-model="base" type="radio" name="bootcn-theme-base" :value="name" />
          <span
            class="bootcn-theme-builder__swatch"
            :style="{ background: palettes.bases[name].swatch }"
            aria-hidden="true"
          ></span>
          {{ name }}
        </label>
      </fieldset>
      <fieldset>
        <legend>Primary color</legend>
        <label v-for="name in primaries" :key="name" class="bootcn-theme-builder__option">
          <input v-model="primary" type="radio" name="bootcn-theme-primary" :value="name" />
          <span
            class="bootcn-theme-builder__swatch"
            :style="{
              background: palettes.primaries[name]?.swatch ?? palettes.bases[base].light.foreground,
            }"
            aria-hidden="true"
          ></span>
          {{ name }}
        </label>
      </fieldset>
      <fieldset>
        <legend>Radius</legend>
        <label v-for="value in radii" :key="value" class="bootcn-theme-builder__option">
          <input v-model.number="radius" type="radio" name="bootcn-theme-radius" :value="value" />
          {{ value }}rem
        </label>
      </fieldset>
    </div>

    <iframe
      ref="frame"
      class="bootcn-theme-builder__preview"
      :src="src"
      title="Theme preview: the admin dashboard template"
      @load="apply"
    />

    <div class="bootcn-theme-builder__code">
      <div class="bootcn-theme-builder__code-head">
        <h2 id="your-css">Your CSS</h2>
        <button type="button" class="bootcn-theme-builder__copy" @click="copy">
          {{ copied ? 'Copied' : 'Copy CSS' }}
        </button>
        <span class="visually-hidden" role="status">{{
          copied ? 'CSS copied to the clipboard' : ''
        }}</span>
      </div>
      <p>Save it as <code>theme.css</code> and load it after <code>tokens.css</code>.</p>
      <pre tabindex="0" aria-label="Generated theme CSS"><code>{{ css }}</code></pre>
    </div>
  </div>
</template>
