# Item

A row with media, a title, a description and actions, for settings lists, files or people.

## Usage

Use `.bootcn-item` for one row: optional media (an icon in
`.bootcn-item__media--icon`, or an avatar), the content, and actions. Variants:
`--outline` (bordered) and `--muted` (filled). Make the whole row a link by
using `<a class="bootcn-item">`, without nested buttons.

## Accessibility

- Rows in a `<ul>` are announced as a list with a count.
- A linked row has one link with the title as its name; do not nest other
  interactive elements in it.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button` component.
- The `avatar` component.
