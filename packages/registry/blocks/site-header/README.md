# Site header

A marketing site header: logo, section links and sign-in buttons, collapsing into a menu on phones; sticky with a blurred background.

## Usage

Point the links at the sections of your page (`id="features"`…) or at
other pages. On phones the links collapse behind the "Menu" button
(Bootstrap's Collapse). The header sticks to the top with a translucent,
blurred background; remove `position: sticky` if you prefer it to scroll
away.

## Accessibility

- A `<header>` landmark holding a `<nav aria-label="Main">`.
- The menu button names itself ("Menu") and reports `aria-expanded`.
- Links have a visible focus ring; the muted link color keeps 4.5:1.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `button` component.
