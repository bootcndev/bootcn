# Flow builder

A visual builder for automations such as email sequences: steps joined by lines, yes/no branches, + buttons to add steps, warnings on unfinished ones, pan and zoom, and full keyboard control.

## Usage

The flow is plain nested lists, so the server can render it and the page
works without the script:

- `.bootcn-flow__steps` (an `<ol>`) holds steps in order. Each
  `.bootcn-flow__step` has a node and a `.bootcn-flow__link`: the line to
  the next step with a `.bootcn-flow__add` button.
- A node is a `<button class="bootcn-flow__node">` with `data-kind`
  (`trigger`, `email`, `wait`, `condition`, `tag` or your own), an
  optional `data-id`, an icon, `.bootcn-flow__eyebrow`,
  `.bootcn-flow__title`, `.bootcn-flow__subtitle` and a
  `.bootcn-flow__status` footer (`--warning` for something to fix).
- A condition step has a `.bootcn-flow__branches` list instead of a link:
  one `.bootcn-flow__branch` per answer (`Yes`, `No`, or more), each with a
  `.bootcn-flow__label`, a link and its own steps.
- `.bootcn-flow__end` closes a branch.

**Selecting**: a click or Enter on a node sets `aria-pressed="true"` and
sends `bootcn:flow:select` (`detail: { node, id, kind }`); open your editor
there.

**Adding**: each `<template data-flow-step="email" data-label="Send an
email">` inside the flow (holding one `.bootcn-flow__step`) becomes an item
in the menu of the + buttons. `bootcn:flow:add` fires when the menu opens
(`kind: null`) and when an item is picked (`kind: "email"`); call
`event.preventDefault()` to show your own dialog and call
`Bootcn.flow.add(root, button, kind)` yourself. A condition added in the
middle of a sequence takes the steps after it into its first branch.

**Removing**: Delete or Backspace on a node removes the step (and the
branches under a condition), except the trigger and nodes with
`data-flow-locked`; `bootcn:flow:remove` can be cancelled to ask first.
Every change sends `bootcn:flow:change`, and `Bootcn.flow.toJSON(root)`
returns the whole flow (`id`, `kind`, `title`, `branches`) for saving.

**Canvas**: drag the background to pan, the toolbar or Ctrl/⌘ + wheel to
zoom (40–150%), Fit to see everything. Set the height with
`--bootcn-flow-height` and the node width with `--bootcn-flow-node-width`.

## Keyboard

Tab reaches every node and + button. Arrow keys move to the nearest node
in that direction (down the sequence, across branches), Enter or Space
selects, Delete removes. In the add menu, Up and Down move, Enter picks,
Escape closes and returns to the + button.

## Accessibility

- Steps and branches are real lists, so screen readers hear the structure
  ("list, 2 items") and the order.
- Nodes are buttons whose name is their text; the selected one is
  `aria-pressed`. Each + button says where it adds ("Add a step after
  Welcome to Northwind", "Add a step at the start of No: Opened the email
  before").
- Additions and removals are announced in a status region; texts are in
  `window.Bootcn.messages` (`flow.added`, `flow.removed`, `flow.addAfter`,
  `flow.addBranch`, `flow.menu`).
- Lines and icons are decorative; warnings are text, not only colour.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
