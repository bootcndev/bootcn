# User

A person at a glance: avatar, name and a second line (role, email or handle), in three sizes or as a link.

## Usage

Use it in lists, comments, menus and table cells. Long names and emails are
cut with an ellipsis; give the parent a width. With a link, use
`<span>`s inside the `<a>`.

## Accessibility

- The name and description are text, read in order; the avatar is
  decorative here (empty `alt` or `aria-hidden`), because the name is next to
  it.
- As a link, the whole row is one focusable target with a visible focus ring.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `avatar` component.
