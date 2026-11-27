<script setup lang="ts">
import { computed, ref } from 'vue';

import Alert from './components/ui/Alert.vue';
import Avatar from './components/ui/Avatar.vue';
import Badge from './components/ui/Badge.vue';
import Button from './components/ui/Button.vue';
import Card from './components/ui/Card.vue';
import Checkbox from './components/ui/Checkbox.vue';
import Dialog from './components/ui/Dialog.vue';
import Input from './components/ui/Input.vue';
import Select from './components/ui/Select.vue';
import Switch from './components/ui/Switch.vue';
import Tabs from './components/ui/Tabs.vue';
import Textarea from './components/ui/Textarea.vue';
import Toaster, { toast } from './components/ui/Toaster.vue';

const open = ref(false);
const deleted = ref(false);
const name = ref('');
const country = ref('pt');
const terms = ref(false);
const wifi = ref(true);
const tab = ref('account');
const summary = computed(
  () =>
    `${name.value || '-'} / ${country.value} / terms ${terms.value ? 'yes' : 'no'} / wifi ${wifi.value ? 'on' : 'off'}`,
);

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

    <Card title="Profile" description="How others see you.">
      <div class="d-flex align-items-center gap-2 mb-3">
        <Avatar name="Lena Fischer" src="missing.png" />
        <Avatar name="Marco Bianchi" size="sm" />
      </div>
      <Input
        v-model="name"
        label="Name"
        help="Shown on your profile."
        :error="name ? undefined : 'Enter your name.'"
      />
      <Textarea label="Bio" rows="2" />
      <Select
        v-model="country"
        label="Country"
        placeholder="Choose a country"
        :options="[
          { value: 'pt', label: 'Portugal' },
          { value: 'es', label: 'Spain' },
        ]"
      />
      <Checkbox v-model="terms" label="Accept the terms" />
      <Switch v-model="wifi" label="Wi-Fi" />
      <p data-testid="form">{{ summary }}</p>
      <template #footer><Badge variant="secondary">Draft</Badge></template>
    </Card>

    <Alert title="Heads up" class="mt-3">You can add components with the CLI.</Alert>

    <Tabs
      v-model="tab"
      label="Account settings"
      :items="[
        { value: 'account', label: 'Account' },
        { value: 'password', label: 'Password' },
        { value: 'team', label: 'Team' },
      ]"
    >
      <template #account><p>Account panel</p></template>
      <template #password><p>Password panel</p></template>
      <template #team><p>Team panel</p></template>
    </Tabs>

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
