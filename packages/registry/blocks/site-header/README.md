# Site header

A marketing site header: logo, section links and sign-in buttons, collapsing into a menu on phones; sticky with a blurred background.

## Usage

Point the links at the sections of your page (`id="features"`…) or at
other pages. On phones the links collapse behind the "Menu" button
(Bootstrap's Collapse). The header sticks to the top with a translucent,
blurred background; remove `position: sticky` if you prefer it to scroll
away.

## Hide on scroll

With `data-bootcn-site-header-autohide` on the `<header>` and `site-header.js`
loaded, the header slides away while the page scrolls down and comes back
on the first scroll up. It stays while it holds focus or while the phone
menu is open, and it moves without animation under reduced motion. Remove
the attribute to keep it always visible. Events: `bootcn:site-header:hide`
and `bootcn:site-header:show`.

## Accessibility

- A `<header>` landmark holding a `<nav aria-label="Main">`.
- The menu button names itself ("Menu") and reports `aria-expanded`.
- Links have a visible focus ring; the muted link color keeps 4.5:1.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `button` component.
