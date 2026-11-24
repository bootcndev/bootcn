# Sign-up card

A registration card with name, email, password rules and a terms checkbox.

## Usage

Point the form's `action` at your registration handler. Validate on the
server too: `required` and `minlength` only help the browser give early
feedback.

`autocomplete="new-password"` lets password managers suggest a strong
password.

## Accessibility

- The password rule is visible help text linked with `aria-describedby`, so
  screen readers announce it with the field.
- The terms checkbox is `required`; its links stay inside the label so the
  whole sentence is read together.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `card` component.
- The `input` component.
- The `checkbox` component.
- The `button` component.
