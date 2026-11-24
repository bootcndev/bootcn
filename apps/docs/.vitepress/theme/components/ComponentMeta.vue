<script setup lang="ts">
/**
 * Item details (version, requirements, source) and a "Copy prompt" button
 * that copies instructions for an AI assistant: install command, docs and
 * the item's JSON source with every file.
 */
import { ref } from 'vue';

const props = defineProps<{
  version: string;
  bootstrap: string;
  requires: string;
  source: string;
  name: string;
  title: string;
  kind: string;
}>();

const SITE = 'https://bootcn.dev';
const copied = ref(false);

function prompt(): string {
  return [
    `Add the Bootcn ${props.title} (${props.name}) to my Bootstrap 5.3 project.`,
    `Install it with: npx bootcn add ${props.name}`,
    `Docs: ${SITE}/${props.kind}/${props.name}`,
    `Source with every file: ${SITE}/r/${props.name}.json`,
    'Keep the bootcn- class names, the data-bootcn-* attributes and the ARIA attributes,',
    'load tokens.css before the component CSS, and do not add a JavaScript framework.',
  ].join('\n');
}

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(prompt());
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    copied.value = false;
  }
}
</script>

<template>
  <div class="bootcn-meta-row">
    <ul class="bootcn-meta" aria-label="Details">
      <li v-if="version"><span>Version</span> {{ version }}</li>
      <li><span>Bootstrap</span> {{ bootstrap }}+</li>
      <li><span>Requires</span> {{ requires }}</li>
      <li><a :href="source" target="_blank" rel="noreferrer">Source on GitHub</a></li>
    </ul>
    <button type="button" class="bootcn-meta__copy" @click="copy">
      {{ copied ? 'Copied' : 'Copy prompt' }}
    </button>
    <span class="visually-hidden" role="status">{{
      copied ? 'Prompt copied to the clipboard' : ''
    }}</span>
  </div>
</template>
