# Progress

Shows how far a task has got, on the native progress element, with an optional label and value.

## Usage

It is the native `<progress>` element: set `value` (and `max`, default 1)
from your script. Leave `value` out for work of unknown length; the bar
then slides. Name each bar with a `<label for>` or `aria-label`.

## Accessibility

- Native `<progress>`: screen readers announce the percentage, or "busy"
  when indeterminate.
- The visible percentage next to the label is hidden from screen readers, so
  it is not read twice.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
