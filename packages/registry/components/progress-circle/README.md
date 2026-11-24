# Progress circle

A circular progress indicator with the percentage inside, or an indeterminate spinner, on a native progress element.

## Usage

Set the value with the `--bootcn-progress` custom property (0–100) and keep
the hidden `<progress>` in sync: it carries the value for screen readers. Leave
out the value for work of unknown length. Sizes: `--sm`, default, `--lg`, or
set `--bootcn-progress-size`.

## Accessibility

- A visually hidden native `<progress>` with a name carries the value; the ring
  and the number are decorative.
- The indeterminate spinner slows down under reduced motion (it does not stop,
  so loading is still visible).

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
