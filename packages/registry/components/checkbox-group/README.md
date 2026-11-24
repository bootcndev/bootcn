# Checkbox group

Related checkboxes in a fieldset, with a "Select all" box, a minimum selection and an error message.

## Usage

Give the items one `name` ending in `[]`, so PHP receives an array
(`$_POST['notify']`). Add `bootcn-checkbox-group--horizontal` for short
labels in a row.

## JavaScript API

- `data-bootcn-checkbox-group` on the `<fieldset>`. Optional: a "Select all"
  checkbox with `data-bootcn-checkbox-group-all` (checked, unchecked or mixed
  as the items change), `data-min` (fewest checked boxes) with `data-error`
  (the message), and an element `.bootcn-checkbox-group__error` for it.
- Below the minimum, the first checkbox gets a custom validity message, so
  `form.checkValidity()` fails too. Submitting the form shows the error,
  stops the submission and focuses the first checkbox.
- Event `bootcn:checkbox-group:change` (bubbles), `detail.values`.
- `Bootcn.checkboxGroup.validate(group)`; `init()` / `destroy()`.
- Without JavaScript the boxes still post as `name[]` values; check the
  minimum on the server too.

## Accessibility

- A `<fieldset>` with a `<legend>` names the group; the help text and the
  error are linked with `aria-describedby`.
- "Select all" controls the items (`aria-controls`) and shows the mixed state
  with `indeterminate`, which screen readers announce as "mixed".
- The error is text, not only a red border.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `checkbox` component.
