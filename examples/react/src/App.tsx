import { useState } from 'react';

import { Alert } from './components/ui/Alert';
import { Avatar } from './components/ui/Avatar';
import { Badge } from './components/ui/Badge';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Checkbox } from './components/ui/Checkbox';
import { Combobox } from './components/ui/Combobox';
import { DataTable } from './components/ui/DataTable';
import { DatePicker } from './components/ui/DatePicker';
import { Dialog } from './components/ui/Dialog';
import { Dropdown } from './components/ui/Dropdown';
import { Input } from './components/ui/Input';
import { Popover } from './components/ui/Popover';
import { Select } from './components/ui/Select';
import { Sheet } from './components/ui/Sheet';
import { Switch } from './components/ui/Switch';
import { Tabs } from './components/ui/Tabs';
import { Textarea } from './components/ui/Textarea';
import { Toaster, toast } from './components/ui/Toaster';
import { Tooltip } from './components/ui/Tooltip';

type Payment = { id: string; status: string; email: string; amount: number };

const PAYMENTS: Payment[] = [
  { id: 'p1', status: 'Success', email: 'ken99@example.com', amount: 316 },
  { id: 'p2', status: 'Success', email: 'abe45@example.com', amount: 242 },
  { id: 'p3', status: 'Processing', email: 'monserrat44@example.com', amount: 837 },
  { id: 'p4', status: 'Failed', email: 'carmella@example.com', amount: 721 },
  { id: 'p5', status: 'Pending', email: 'jason78@example.com', amount: 450 },
  { id: 'p6', status: 'Success', email: 'noah.b@example.com', amount: 74 },
  { id: 'p7', status: 'Pending', email: 'olivia.k@example.com', amount: 562 },
];

const FRAMEWORKS = [
  { value: 'astro', label: 'Astro' },
  { value: 'laravel', label: 'Laravel' },
  { value: 'remix', label: 'Remix' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt' },
];

export function App() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('pt');
  const [terms, setTerms] = useState(false);
  const [wifi, setWifi] = useState(true);
  const [tab, setTab] = useState('account');
  const [action, setAction] = useState('none');
  const [sheet, setSheet] = useState(false);
  const [framework, setFramework] = useState('');
  const [date, setDate] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <main className="container py-4">
      <h1 className="h4 mb-4">Bootcn with React</h1>
      <div className="d-flex gap-2">
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete project
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.success('Profile saved', { description: 'Just now' })}
        >
          Save profile
        </Button>
      </div>
      <p className="mt-3" data-testid="state">
        {deleted ? 'Project deleted' : 'Project kept'}
      </p>

      <Card
        title="Profile"
        description="How others see you."
        footer={<Badge variant="secondary">Draft</Badge>}
      >
        <div className="d-flex align-items-center gap-2 mb-3">
          <Avatar name="Lena Fischer" src="missing.png" />
          <Avatar name="Marco Bianchi" size="sm" />
        </div>
        <Input
          label="Name"
          help="Shown on your profile."
          error={name ? undefined : 'Enter your name.'}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Textarea label="Bio" rows={2} />
        <Select
          label="Country"
          placeholder="Choose a country"
          options={[
            { value: 'pt', label: 'Portugal' },
            { value: 'es', label: 'Spain' },
          ]}
          value={country}
          onChange={(event) => setCountry(event.target.value)}
        />
        <Checkbox
          label="Accept the terms"
          checked={terms}
          onChange={(event) => setTerms(event.target.checked)}
        />
        <Switch label="Wi-Fi" checked={wifi} onChange={(event) => setWifi(event.target.checked)} />
        <p data-testid="form">{`${name || '-'} / ${country} / terms ${terms ? 'yes' : 'no'} / wifi ${wifi ? 'on' : 'off'}`}</p>
      </Card>

      <Alert title="Heads up" className="mt-3">
        You can add components with the CLI.
      </Alert>

      <Tabs
        label="Account settings"
        value={tab}
        onValueChange={setTab}
        items={[
          { value: 'account', label: 'Account', content: <p>Account panel</p> },
          { value: 'password', label: 'Password', content: <p>Password panel</p> },
          { value: 'team', label: 'Team', content: <p>Team panel</p> },
        ]}
      />

      <section className="mt-4 d-flex flex-wrap align-items-start gap-3">
        <Dropdown
          label="My account"
          items={[
            { type: 'label', label: 'Signed in as ken99@example.com' },
            { label: 'Profile', shortcut: '⌘P', onSelect: () => setAction('profile') },
            { label: 'Billing (soon)', disabled: true },
            { type: 'separator' },
            { label: 'Sign out', destructive: true, onSelect: () => setAction('sign out') },
          ]}
        />
        <Tooltip content="Add to library">
          <Button variant="outline">Hover or focus me</Button>
        </Tooltip>
        <Popover title="Storage" content="You are using 7.2 GB of your 10 GB plan.">
          <Button variant="outline">Show usage</Button>
        </Popover>
        <Button variant="outline" onClick={() => setSheet(true)}>
          Edit profile
        </Button>
      </section>
      <p data-testid="action">{`action ${action}`}</p>

      <section className="mt-4 d-grid gap-3" style={{ maxWidth: '20rem' }}>
        <Combobox
          label="Framework"
          placeholder="Search frameworks…"
          options={FRAMEWORKS}
          value={framework}
          onValueChange={setFramework}
          emptyText="No framework found."
        />
        <DatePicker label="Delivery date" value={date} onValueChange={setDate} />
        <p data-testid="picked">{`framework ${framework || '-'} / date ${date || '-'}`}</p>
      </section>

      <DataTable
        caption="Payments"
        columns={[
          { key: 'status', header: 'Status', sortable: true },
          { key: 'email', header: 'Email', sortable: true },
          {
            key: 'amount',
            header: 'Amount',
            sortable: true,
            numeric: true,
            align: 'end',
            cell: (row) => `€${row.amount.toFixed(2)}`,
          },
        ]}
        rows={PAYMENTS}
        rowId={(row) => row.id}
        rowLabel={(row) => `Select ${row.email}`}
        pageSize={5}
        filterLabel="Filter payments"
        filterPlaceholder="Filter payments…"
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        emptyText="No payments match."
      />

      <Sheet
        open={sheet}
        onOpenChange={setSheet}
        title="Edit profile"
        description="Change your public details."
        footer={
          <Button size="sm" onClick={() => setSheet(false)}>
            Save changes
          </Button>
        }
      >
        <Input label="Username" defaultValue="@ken99" />
      </Sheet>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this project?"
        description="This removes the project and all of its data."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setDeleted(true);
                setOpen(false);
              }}
            >
              Delete project
            </Button>
          </>
        }
      />
      <Toaster />
    </main>
  );
}
