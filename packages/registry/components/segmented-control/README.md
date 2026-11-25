# Segmented control

A row of mutually exclusive options in one rounded track, iOS style, built on native radio buttons.

## Usage

Use it to switch between a few views or periods of the same content (2–5
options). It posts like any radio group (`period=week`). For navigation
between pages use Tabs; for many options, a Select.

## Accessibility

- Native radio buttons in a fieldset with a (hidden) legend: one tab stop,
  arrow keys move the selection, and screen readers say "Week, radio button,
  2 of 4, checked".
- The selected option is shown by a raised surface and darker text, not by
  colour alone.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
