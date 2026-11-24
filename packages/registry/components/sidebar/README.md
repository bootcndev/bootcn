# Sidebar

An app sidebar that collapses to icons on desktop (remembered, Ctrl/⌘ B) and becomes a drawer on phones.

## Usage

Use it as the page layout: sidebar, then the main column with a header that
holds the toggle. The app-sidebar block is a richer, static variant; this
component adds collapsing. Links carry a `title`, so the collapsed rail shows a
native tooltip.

## JavaScript API

- `data-bootcn-sidenav-layout` on the layout; the sidebar is a Bootstrap
  `offcanvas-lg` `<aside>`; the button with `data-bootcn-sidenav-toggle`
  (`aria-controls` = the sidebar id) toggles it.
- From 992px the toggle collapses the sidebar to an icon rail (class
  `is-collapsed` on the layout, saved in `localStorage` as
  `bootcn-sidenav-collapsed`); below it, it opens the drawer.
- Ctrl+B / ⌘B toggles it. Event `bootcn:sidebar:toggle` (bubbles),
  `detail.collapsed`.
- Widths: `--bootcn-sidenav-width` and `--bootcn-sidenav-collapsed-width`.
- `Bootcn.sidebar.toggle(layout)`; `init()` / `destroy()`.

## Accessibility

- The sidebar is an `<aside aria-label="Sidebar">` with a `<nav>`; the current
  page has `aria-current="page"`.
- Collapsed, the labels are visually hidden but still read, so every link
  keeps its name.
- The toggle has a name and `aria-expanded` (collapsed state on desktop, drawer
  state on phones). As a drawer, Bootstrap traps focus and closes on Escape.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `avatar` component.
