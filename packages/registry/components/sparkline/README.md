# Sparkline

A word-sized trend line drawn from a list of numbers, with a text summary for screen readers; up and down colours.

## Usage

Put a sparkline next to the number it explains, in stat cards and table
rows. It shows a shape, not exact values: keep the current value as text
beside it.

## JavaScript API

- `data-bootcn-sparkline` with `data-values="12,18,9,…"`, a `data-label`
  for the summary and optionally `data-format="{value}%"` and
  `data-type="bar"`.
- The element becomes `role="img"` named with a summary ("Visitors, last
  14 days: from 120 to 198 (+65%), lowest 120, highest 198."), unless you
  give it your own `aria-label`.
- Colour: `bootcn-sparkline--up`, `--down`, or `--bootcn-sparkline-color`.
- `Bootcn.sparkline.draw(element)` after changing `data-values`;
  `init()`.

## Accessibility

- Each sparkline is an image with a text summary of the trend, so the
  information is not visual only.
- Up and down colours are paired with the numbers and the summary.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
