# Tree

A tree view for folders, categories and permissions: expand and collapse, full keyboard support, single or multiple selection, checkboxes with a partial state, and children loaded on demand.

## Usage

A `<ul role="tree" data-bootcn-tree>` named with `aria-labelledby`. Each
item is an `<li role="treeitem">` with a `.bootcn-tree__row` (a toggle,
an icon, a label and an optional `.bootcn-tree__meta`) and, for a parent,
`aria-expanded` and a nested `<ul role="group">`.

- **Selecting**: click or Enter/Space sets `aria-selected`;
  `aria-multiselectable="true"` on the tree lets several be selected.
  `bootcn:tree:select` (`detail: { item, value }`).
- **Checkboxes**: `data-checkable` on the tree and `aria-checked` on the
  items. Checking a parent checks everything inside; a parent with some
  children checked becomes `mixed`. `bootcn:tree:check`
  (`detail: { item, checked, values }`) and `Bootcn.tree.checked(root)`
  give the checked leaves.
- **On demand**: an item with `aria-expanded="false"` and
  `data-bootcn-tree-lazy` asks for its children the first time it opens:
  listen for `bootcn:tree:load`, call `event.preventDefault()` and then
  `event.detail.done([{ label, value, children: true }])`. A
  `<template data-bootcn-tree-template>` inside the tree is the markup for
  new items.

`Bootcn.tree.expand(root, item)`, `collapse(root, item)`, `setup(root)`,
`init()` / `destroy()`; `bootcn:tree:toggle` on every open and close.

## Keyboard

Up and Down move between visible items, Right opens an item or goes to its
first child, Left closes it or goes to its parent (mirrored right to left),
Home and End go to the first and last item, a letter jumps to the next item
starting with it, `*` opens all siblings, Enter and Space select or check.

## Accessibility

- The WAI-ARIA tree pattern: one item in the Tab order (roving
  `tabindex`), states in `aria-expanded`, `aria-selected` and
  `aria-checked` (`mixed` for partial), groups for children.
- Icons and the drawn checkboxes are decorative; items loading children
  are `aria-busy` and say "Loading…".

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
