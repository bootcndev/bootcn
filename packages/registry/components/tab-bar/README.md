# Tab bar

A bottom navigation bar for phones, iOS style: icons with labels, the current page highlighted, badges, and a translucent bar that respects the home indicator.

## Usage

A `<nav class="bootcn-tab-bar" aria-label="Main">` with a list of links,
three to five of them. Mark the page you are on with
`aria-current="page"`: its icon fills in and takes the primary colour.

- `.bootcn-tab-bar--floating` turns the bar into a glass pill that floats
  above the content, the current tab in a tinted capsule. Combine it with
  `--fixed` to float it at the bottom of the screen.
- `.bootcn-tab-bar--fixed` pins the bar to the bottom of the screen; give
  the page `padding-bottom` (about 4.5rem) so nothing hides behind it. Add
  `.bootcn-tab-bar--phone-only` to hide it from 768px up, where a sidebar
  or navbar usually takes over.
- A count goes in `.bootcn-tab-bar__badge` inside the icon, with the same
  count for screen readers in a `.visually-hidden` span ("3 new", read as "Activity 3 new").
- The bar leaves room for the iPhone home indicator
  (`env(safe-area-inset-bottom)`); add `viewport-fit=cover` to the
  viewport meta tag to use it.

## Accessibility

- Links in a named navigation landmark, not ARIA tabs: each one opens a
  page. The current one has `aria-current="page"`.
- Labels are always shown; icons are decorative. Badge counts are read
  after the label.
- The current tab differs by colour and a filled icon.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
