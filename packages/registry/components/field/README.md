# Field

Groups form controls with labels, descriptions and errors, in stacked, side-by-side and horizontal layouts.

## Usage

Wrap related fields in a `<fieldset class="bootcn-fieldset">` with a legend.
Each `.bootcn-field` stacks a label, a control, help text
(`.bootcn-field__help`) and an error (`.bootcn-field__error`). Put fields side
by side in `.bootcn-field-row`, and use `.bootcn-field--horizontal` for a
setting with its switch on the right.

Link help and error text to the control with `aria-describedby`, and set
`aria-invalid="true"` on a control with an error.

## Accessibility

- The legend names the group, so screen readers announce "Payment method"
  when focus enters it.
- Help and error text are announced with the control (`aria-describedby`).
- Errors are text, not color alone, and use `--bootcn-destructive-text`
  (4.5:1 in both themes).

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `input` component.
- The `select` component.
- The `switch` component.
- The `label` component.
