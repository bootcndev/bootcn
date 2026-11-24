# Sidebar with groups

A sidebar with a team switcher, search, collapsible navigation groups, projects and the user menu.

## Usage

Each group header is a button that collapses its links (Bootstrap Collapse);
mark the current page with `aria-current="page"` and open its group (`show`
and `aria-expanded="true"`). The team switcher and the user menu are Bootstrap
dropdowns. Below 992px the sidebar is an off-canvas drawer opened from the
"Menu" button in your top bar.

## Accessibility

- An `<aside aria-label="Sidebar">` with a `<nav>`; each list is labelled by its
  heading.
- Group headers are buttons with `aria-expanded` and `aria-controls`, so screen
  readers know whether a group is open.
- The search form is a named landmark ("Sidebar") with a hidden label and
  submit button.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `dropdown` component.
- The `input` component.
- The `user-menu` block.
- The `button` component.
