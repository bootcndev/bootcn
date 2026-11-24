# Scroll shadow

A scrollable area that shows soft shadows at the edges while there is more content, in pure CSS.

## Usage

Give the area a height or max-height. The shadows come from background
gradients (no JavaScript): the content's background covers them at the start
and end, so a shadow appears only when there is more to scroll. On a colored
background, set `--bootcn-scroll-shadow-cover` to that color.

## Accessibility

- A focusable `<section>` with a name, so keyboard users can scroll it.
- The shadows are a visual hint only; nothing depends on them.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
