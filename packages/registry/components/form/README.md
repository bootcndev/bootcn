# Form

Form validation with the browser's own rules: messages under each field, an error summary that takes focus, and live checks after the first attempt.

## Usage

Validate on the server as well. To show server errors, render the same
markup: `aria-invalid="true"` on the field, the message in its
`.bootcn-field__error` (without `hidden`), and the summary filled in and
visible. Works with the Checkbox group component, whose minimum is a custom
validity message.

## JavaScript API

- `data-bootcn-form` and `novalidate` on the `<form>`: the browser's
  constraint rules (`required`, `type="email"`, `minlength`, `pattern`,
  `min`/`max`…) still apply, but Bootcn shows the messages.
- Each field lists its error element (`.bootcn-field__error`) in
  `aria-describedby`; the field gets `aria-invalid="true"` and the message.
  Override a browser message with `data-error-value-missing`,
  `data-error-type-mismatch`, `data-error-too-short`, `data-error-pattern-mismatch`
  and the other `data-error-*` names of the `ValidityState` flags.
- `data-bootcn-form-summary` (optional): an error summary listing every
  problem as a link to its field. It is shown and focused when a submission
  fails; without it, the first invalid field gets focus.
- Fields are checked when left with a value, and on every change after the
  first submission.
- Events (bubble): `bootcn:form:invalid` (`detail.fields`) and
  `bootcn:form:submit` (cancelable, `detail.data` is a `FormData`). A form
  without `action` is handled in JavaScript only and shows `data-success` (or
  "Saved.") in `data-bootcn-form-success`; with `action` it posts normally
  unless a listener calls `preventDefault()`.
- `Bootcn.form.validate(form)` returns `true` or `false`;
  `init()` / `destroy()`.

## Accessibility

- Errors are text linked to their fields with `aria-describedby`, and
  fields are marked `aria-invalid`, so screen readers read the message with
  the label.
- On a failed submission the error summary takes focus and is read with its
  heading ("There are 3 problems"); each link moves focus to its field.
- Messages appear after a field is left or the form is submitted, not while
  someone is still typing.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `field` component.
- The `label` component.
- The `input` component.
- The `select` component.
- The `checkbox` component.
- The `button` component.
