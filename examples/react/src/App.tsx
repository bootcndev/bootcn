import { useState } from 'react';

import { Button } from './components/ui/Button';
import { Dialog } from './components/ui/Dialog';
import { Toaster, toast } from './components/ui/Toaster';

export function App() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

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
