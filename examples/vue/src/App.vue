<script setup lang="ts">
import { ref } from 'vue';

import Button from './components/ui/Button.vue';
import Dialog from './components/ui/Dialog.vue';
import Toaster, { toast } from './components/ui/Toaster.vue';

const open = ref(false);
const deleted = ref(false);

function remove() {
  deleted.value = true;
  open.value = false;
}
</script>

<template>
  <main class="container py-4">
    <h1 class="h4 mb-4">Bootcn with Vue</h1>
    <div class="d-flex gap-2">
      <Button variant="destructive" @click="open = true">Delete project</Button>
      <Button
        variant="outline"
        @click="toast.success('Profile saved', { description: 'Just now' })"
      >
        Save profile
      </Button>
    </div>
    <p class="mt-3" data-testid="state">{{ deleted ? 'Project deleted' : 'Project kept' }}</p>
    <Dialog
      v-model:open="open"
      title="Delete this project?"
      description="This removes the project and all of its data."
    >
      <template #footer>
        <Button variant="outline" size="sm" @click="open = false">Cancel</Button>
        <Button variant="destructive" size="sm" @click="remove">Delete project</Button>
      </template>
    </Dialog>
    <Toaster />
  </main>
</template>
