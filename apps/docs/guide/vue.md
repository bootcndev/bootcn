---
description: 'Use Bootcn in Vue (Vite, Nuxt and others): the CLI copies .vue components into your project, with v-model, slots and their own CSS and JavaScript.'
---

# Vue

In a Vue project the CLI copies **`.vue` components** into your project, next
to the CSS and JavaScript they are built on. They are yours to edit, like
every Bootcn file.

## Set up

```bash
npm install bootstrap
npx bootcn@latest init
```

`init` sees `vue` (or `nuxt`) in `package.json` and puts everything under
`src/`: components in `src/components/ui`, CSS and JavaScript in
`src/bootcn`. Then import Bootstrap's CSS and the design tokens once, in
`src/main.ts` (or a Nuxt plugin):

```ts
import 'bootstrap/dist/css/bootstrap.min.css';
import './bootcn/css/tokens.css';
```

## Add components

```bash
npx bootcn@latest add dialog
```

This writes `Dialog.vue` (and `Button.vue`, which it uses), `dialog.css` and
`dialog.js`. Each component imports its own CSS and loads its JavaScript in
the browser only, once mounted, so they work with server rendering too.

```vue
<script setup lang="ts">
import { ref } from 'vue';

import Button from './components/ui/Button.vue';
import Dialog from './components/ui/Dialog.vue';
import Toaster, { toast } from './components/ui/Toaster.vue';

const open = ref(false);
</script>

<template>
  <Button variant="destructive" @click="open = true">Delete project</Button>
  <Dialog
    v-model:open="open"
    title="Delete this project?"
    description="This removes the project and all of its data."
  >
    <template #footer>
      <Button variant="destructive" size="sm" @click="toast.success('Deleted')">
        Delete project
      </Button>
    </template>
  </Dialog>
  <Toaster />
</template>
```

## Components so far

| Component | Props and slots                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------- |
| `Button`  | `variant` (default, secondary, outline, ghost, destructive, link), `size`, `type`, default slot |
| `Dialog`  | `v-model:open`, `title`, `description`, `size`, default slot, `#footer` slot                    |
| `Toaster` | Put `<Toaster />` once; import `toast` from it: `toast()`, `toast.success()`…                   |

More come with each release. For an item without a Vue component yet, `add`
installs its CSS and JavaScript and says so: copy its markup from its page
into your template and it works the same.

## How they work

- The markup, classes and ARIA attributes are the same as the HTML
  versions, so the design tokens, dark mode (`data-bs-theme`) and right to
  left work unchanged.
- Bootstrap's JavaScript (for example its Modal) is imported with a dynamic
  `import()` in `onMounted`, so nothing touches `window` on the server.
- The dialog returns focus to whatever opened it and sets `open` back to
  `false` when the person closes it.
