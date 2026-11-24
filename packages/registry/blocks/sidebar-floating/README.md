# Floating sidebar

A sidebar that floats as a rounded card with a shadow, inset from the window edges, with grouped links.

## Usage

The sidebar and the content are two cards on the tinted page background.
On phones the sidebar sits above the content; for a drawer instead, use the
App sidebar block.

## Accessibility

- A `<nav aria-label="Main">` with labelled groups of links; the current
  page has `aria-current="page"`.
- Group headings are text, so the structure is also clear without the
  visual grouping.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
