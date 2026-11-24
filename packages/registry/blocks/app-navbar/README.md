# App navbar

A responsive top navigation bar with brand, links, search and a user menu that collapses on small screens.

## Usage

Use it as the first element of `<body>` (wrap it in `<header>` if you like).
Mark the current page's link with `active` and `aria-current="page"`.

Below 992px the links, search and user menu collapse behind the menu button.
Collapse and the user menu need the Bootstrap JS bundle.

## Accessibility

- `<nav aria-label="Main">` makes it a named navigation landmark.
- The menu button has an accessible name and Bootstrap keeps `aria-expanded` in
  sync.
- The current page is announced via `aria-current="page"`, not only by
  styling.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `user-menu` block.
- The `input` component.
