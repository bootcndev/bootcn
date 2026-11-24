# Inset sidebar

The collapsible Sidebar with the page content raised in a rounded panel beside it.

## Usage

This is the Sidebar component's markup with
`bootcn-sidenav-layout--inset` on the layout. It keeps every Sidebar feature:
collapse to icons (remembered, Ctrl/⌘ B) on desktop and a drawer on phones.

## Accessibility

- Same structure as the Sidebar component: a labelled `<aside>` with a `<nav>`,
  `aria-current` on the current page and a toggle with `aria-expanded`.
- The panel is visual only; the landmarks do not change.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `sidebar` component.
