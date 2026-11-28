---
description: 'Use Bootcn in React (Vite, Next.js and others): the CLI copies .tsx components into your project, each importing its own CSS and loading its JavaScript in the browser.'
---

# React

In a React project the CLI copies **`.tsx` components** into your project,
next to the CSS and JavaScript they are built on. They are yours to edit,
like every Bootcn file.

## Set up

```bash
npm install bootstrap
npx bootcn@latest init
```

`init` sees `react` (or `next`) in `package.json` and puts everything under
`src/`: components in `src/components/ui`, CSS and JavaScript in
`src/bootcn`. Then import Bootstrap's CSS and the design tokens once, in your
entry file (`src/main.tsx`, or the root layout in Next.js):

```tsx
import 'bootstrap/dist/css/bootstrap.min.css';
import './bootcn/css/tokens.css';
```

## Add components

```bash
npx bootcn@latest add dialog
```

This writes `Dialog.tsx` (and `Button.tsx`, which it uses), `dialog.css` and
`dialog.js`. Each component imports its own CSS and loads its JavaScript in
the browser only, after the component mounts, so they work with server
rendering too.

```tsx
import { useState } from 'react';

import { Button } from './components/ui/Button';
import { Dialog } from './components/ui/Dialog';
import { Toaster, toast } from './components/ui/Toaster';

export function App() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete project
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this project?"
        description="This removes the project and all of its data."
        footer={
          <Button variant="destructive" size="sm" onClick={() => toast.success('Deleted')}>
            Delete project
          </Button>
        }
      />
      <Toaster />
    </>
  );
}
```

## Components so far

| Component                     | Props                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`                      | `variant` (default, secondary, outline, ghost, destructive, link), `size`, and every button attribute                                                                    |
| `Dialog`                      | `open`, `onOpenChange`, `title`, `description`, `children`, `footer`, `size`                                                                                             |
| `Toaster`                     | Put `<Toaster />` once; call `toast()`, `toast.success()`, `toast.promise()`…                                                                                            |
| `Input`, `Textarea`, `Select` | `label`, `help`, `error`, and every attribute of the field; `Select` also `options` and `placeholder`                                                                    |
| `Checkbox`, `Switch`          | `label`, `checked`, `onChange`, and every input attribute                                                                                                                |
| `Tabs`                        | `label`, `items` (`value`, `label`, `content`), `value` / `defaultValue`, `onValueChange`                                                                                |
| `Card`                        | `title`, `description`, `titleAs`, `footer`, `children`                                                                                                                  |
| `Alert`                       | `title`, `variant` (default, destructive), `icon`, `children`                                                                                                            |
| `Badge`                       | `variant` (default, secondary, outline, destructive)                                                                                                                     |
| `Avatar`                      | `name`, `src` (initials when missing or broken), `fallback`, `size`, `square`                                                                                            |
| `Dropdown`                    | `label`, `items` (`label`, `onSelect`, `href`, `shortcut`, `disabled`, `destructive`; or `type: 'label'` / `'separator'`), `variant`, `align`                            |
| `Tooltip`, `Popover`          | Wrap one button: `content`, `placement`; Popover also `title` and `trigger` (click or focus)                                                                             |
| `Sheet`                       | `open`, `onOpenChange`, `title`, `description`, `side` (start, end, top, bottom), `children`, `footer`                                                                   |
| `Combobox`                    | `label`, `options` (`value`, `label`, `disabled`), `value` / `defaultValue`, `onValueChange`, `placeholder`, `emptyText`, `name`                                         |
| `DatePicker`                  | `label`, `value` (YYYY-MM-DD), `onValueChange`, `min`, `max`, `weekStart`, `locale`, `name`                                                                              |
| `DataTable`                   | `columns` (`key`, `header`, `sortable`, `numeric`, `align`, `cell`), `rows`, `rowId`, `caption`, `pageSize`, `filterLabel`, `selectable`, `selected`, `onSelectedChange` |

Dropdown, Tooltip, Popover and the Date picker use Bootstrap's JavaScript,
which needs Popper: `npm install bootstrap @popperjs/core`.

More come with each release. For an item without a React component yet,
`add` installs its CSS and JavaScript and says so: copy its markup from its
page into your JSX (`class` becomes `className`) and it works the same.

## How they work

- The markup, classes and ARIA attributes are the same as the HTML
  versions, so the design tokens, dark mode (`data-bs-theme`) and right to
  left work unchanged.
- Bootstrap's JavaScript (for example its Modal) is imported with a dynamic
  `import()` inside `useEffect`, so nothing touches `window` on the server.
- The dialog returns focus to whatever opened it and reports closing
  (Escape, the ×, the backdrop) through `onOpenChange(false)`.
