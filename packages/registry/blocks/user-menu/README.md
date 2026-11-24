# User menu

An avatar button that opens an account menu with the user's name, email, links and sign out.

## Usage

Put it at the end of your navbar or sidebar. Replace the initials (or use an
`<img>` avatar, see the Avatar component), the name, the email and the links.

The menu is Bootstrap's dropdown, so it needs the Bootstrap JS bundle.

## Accessibility

- The trigger's accessible name is the user's name. On phones the name is
  hidden visually but still read by screen readers.
- Bootstrap handles `aria-expanded`, arrow keys and Escape in the menu.
- Sign out is a `<button>`, because it performs an action; wrap it in a
  `<form method="post">` in your app.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `dropdown` component.
- The `avatar` component.
