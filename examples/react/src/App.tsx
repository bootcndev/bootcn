import { useState } from 'react';

import { Alert } from './components/ui/Alert';
import { Avatar } from './components/ui/Avatar';
import { Badge } from './components/ui/Badge';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Checkbox } from './components/ui/Checkbox';
import { Dialog } from './components/ui/Dialog';
import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { Switch } from './components/ui/Switch';
import { Tabs } from './components/ui/Tabs';
import { Textarea } from './components/ui/Textarea';
import { Toaster, toast } from './components/ui/Toaster';

export function App() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('pt');
  const [terms, setTerms] = useState(false);
  const [wifi, setWifi] = useState(true);
  const [tab, setTab] = useState('account');

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
