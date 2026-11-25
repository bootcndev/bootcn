# Loader

Small loading indicators: typing dots, pulse, bars and a shimmering "Thinking…" text, in three sizes, still under reduced motion.

## Usage

Use a loader for short waits inside a component (a reply being written, a
list being fetched). For a page or a button, Bootstrap's spinner or the
Button's loading state fit better; for content that will appear, a Skeleton.
Change the colour with `--bootcn-loader-color` and the size with `--sm`,
`--lg` or `--bootcn-loader-size`.

## Accessibility

- Each loader is a `role="status"` with text ("Loading", visually hidden,
  or the visible "Thinking…"), so screen readers announce it politely.
- With `prefers-reduced-motion` the animations stop and the text loader
  becomes plain muted text.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
