<script setup lang="ts">
import { computed, ref } from 'vue';

import Alert from './components/ui/Alert.vue';
import Avatar from './components/ui/Avatar.vue';
import Badge from './components/ui/Badge.vue';
import Button from './components/ui/Button.vue';
import Card from './components/ui/Card.vue';
import Checkbox from './components/ui/Checkbox.vue';
import Combobox from './components/ui/Combobox.vue';
import DataTable from './components/ui/DataTable.vue';
import DatePicker from './components/ui/DatePicker.vue';
import Dialog from './components/ui/Dialog.vue';
import Dropdown from './components/ui/Dropdown.vue';
import Input from './components/ui/Input.vue';
import Popover from './components/ui/Popover.vue';
import Select from './components/ui/Select.vue';
import Sheet from './components/ui/Sheet.vue';
import Switch from './components/ui/Switch.vue';
import Tabs from './components/ui/Tabs.vue';
import Textarea from './components/ui/Textarea.vue';
import Toaster, { toast } from './components/ui/Toaster.vue';
import Tooltip from './components/ui/Tooltip.vue';

const payments = [
  { id: 'p1', status: 'Success', email: 'ken99@example.com', amount: 316 },
  { id: 'p2', status: 'Success', email: 'abe45@example.com', amount: 242 },
  { id: 'p3', status: 'Processing', email: 'monserrat44@example.com', amount: 837 },
  { id: 'p4', status: 'Failed', email: 'carmella@example.com', amount: 721 },
  { id: 'p5', status: 'Pending', email: 'jason78@example.com', amount: 450 },
  { id: 'p6', status: 'Success', email: 'noah.b@example.com', amount: 74 },
  { id: 'p7', status: 'Pending', email: 'olivia.k@example.com', amount: 562 },
];
type Payment = (typeof payments)[number];

const frameworks = [
  { value: 'astro', label: 'Astro' },
  { value: 'laravel', label: 'Laravel' },
  { value: 'remix', label: 'Remix' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt' },
];

const open = ref(false);
const deleted = ref(false);
const name = ref('');
const country = ref('pt');
const terms = ref(false);
const wifi = ref(true);
const tab = ref('account');
const action = ref('none');
const sheet = ref(false);
const framework = ref('');
const date = ref('');
const selected = ref<string[]>([]);
const menu = [
  { type: 'label' as const, label: 'Signed in as ken99@example.com' },
  { label: 'Profile', shortcut: '⌘P', onSelect: () => (action.value = 'profile') },
  { label: 'Billing (soon)', disabled: true },
  { type: 'separator' as const },
  { label: 'Sign out', destructive: true, onSelect: () => (action.value = 'sign out') },
];
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

    <section class="mt-4 d-flex flex-wrap align-items-start gap-3">
      <Dropdown label="My account" :items="menu" />
      <Tooltip content="Add to library">
        <Button variant="outline">Hover or focus me</Button>
      </Tooltip>
      <Popover title="Storage" content="You are using 7.2 GB of your 10 GB plan.">
        <Button variant="outline">Show usage</Button>
      </Popover>
      <Button variant="outline" @click="sheet = true">Edit profile</Button>
    </section>
    <p data-testid="action">action {{ action }}</p>

    <section class="mt-4 d-grid gap-3" style="max-width: 20rem">
      <Combobox
        v-model="framework"
        label="Framework"
        placeholder="Search frameworks…"
        :options="frameworks"
        empty-text="No framework found."
      />
      <DatePicker v-model="date" label="Delivery date" />
      <p data-testid="picked">framework {{ framework || '-' }} / date {{ date || '-' }}</p>
    </section>

    <DataTable
      v-model:selected="selected"
      caption="Payments"
      :columns="[
        { key: 'status', header: 'Status', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
        { key: 'amount', header: 'Amount', sortable: true, numeric: true, align: 'end' },
      ]"
      :rows="payments"
      :row-id="(row: Payment) => row.id"
      :row-label="(row: Payment) => `Select ${row.email}`"
      :page-size="5"
      filter-label="Filter payments"
      filter-placeholder="Filter payments…"
      selectable
      empty-text="No payments match."
    >
      <template #cell-amount="{ row }">€{{ row.amount.toFixed(2) }}</template>
    </DataTable>

    <Sheet v-model:open="sheet" title="Edit profile" description="Change your public details.">
      <Input label="Username" model-value="@ken99" />
      <template #footer>
        <Button size="sm" @click="sheet = false">Save changes</Button>
      </template>
    </Sheet>

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
