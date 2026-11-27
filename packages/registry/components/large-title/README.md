# Large title

An iOS-style navigation bar with a large title that shrinks into the bar as the page scrolls, with a back link, actions and an optional search field.

## Usage

A `<div class="bootcn-large-title" data-bootcn-large-title>` at the top of the page (or of a
scrolling panel) with:

- `.bootcn-large-title__bar`: a back link, `.bootcn-large-title__small`
  (the same title again, `aria-hidden`) and `.bootcn-large-title__actions`.
  It sticks to the top.
- `.bootcn-large-title__title`: the page's `<h1>`.
- Optionally `.bootcn-large-title__search`, a search field under it.

When the large title scrolls under the bar, the header gets `is-collapsed`:
the small title fades in and the bar turns translucent with a hairline.
`bootcn:large-title:change` (`detail: { collapsed }`) tells you when.

Inside a scrolling box the script finds it by itself; set
`data-scroll-container="#id"` to name another one. `Bootcn.largeTitle.setup(root)`,
`init()` / `destroy()`.

## Accessibility

- One heading: the large title is the page's `<h1>`; the small copy in
  the bar is hidden from screen readers.
- Icon buttons have an `aria-label`; the back link names where it goes.
- Without the script, or with reduced motion, the title simply scrolls
  away with no animation.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
