# Navigation menu

Site navigation with panels of links and descriptions that open from the top bar, built on Bootstrap Dropdown.

## Usage

Each top item that has a panel is a button with `data-bs-toggle="dropdown"`
and `data-bs-auto-close="outside"`; the panel is a `.dropdown-menu` holding a
list of links with a title and a short description. Plain top links are
`<a class="bootcn-nav-menu__trigger">`. Panels open on click and keyboard,
not on hover, so they work on touch screens.

## Accessibility

- A `<nav aria-label="Main">` landmark with lists of links (the disclosure
  navigation pattern, not an ARIA menu): links stay links for screen readers.
- Triggers are buttons with `aria-expanded` (Bootstrap) and `aria-controls`.
- Escape closes the panel and returns focus to its trigger; Tab moves through
  the links.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
