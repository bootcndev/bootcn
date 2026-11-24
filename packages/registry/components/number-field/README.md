# Number field

A number input with decrement and increment buttons that respect min, max and step.

## Usage

It is a native `<input type="number">`, so forms submit it as usual and the
browser validates `min`, `max` and `step`. The buttons help on touch screens;
keyboard users use the arrow keys.

## JavaScript API

- `data-bootcn-number-field` on the wrapper; buttons carry
  `data-bootcn-step="down"` or `"up"`. The input's own `min`, `max` and `step`
  apply (the script uses `stepUp()` / `stepDown()`), and buttons disable at
  the limits.
- Clicking a button fires the input's `input` and `change` events.
- `Bootcn.numberField.init(root)` / `destroy()`.

## Accessibility

- The input keeps the native spinbutton role: Up/Down change the value and
  screen readers announce it.
- The buttons are named ("Increase guests") and left out of the tab order, so
  Tab goes straight to the next field.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `label` component.
- The `input` component.
