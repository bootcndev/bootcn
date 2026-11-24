# Login card

A centered sign-in card with email, password, a remember-me option and links to reset the password or sign up.

## Usage

Place the section where your sign-in page content goes. Point the form's
`action` at your login handler and the two links at your password reset and
sign-up pages.

The inputs use `autocomplete="email"` and `autocomplete="current-password"`,
so password managers fill them.

## Accessibility

- Every input has a visible `<label>`; required fields use `required`.
- The card heading names the section (`aria-labelledby`). Change the heading
  level to fit your page; a sign-in page usually has it as its `<h1>`.
- Show server errors next to the field: add `aria-invalid="true"` and an
  `invalid-feedback` element referenced with `aria-describedby` (see the Input
  component).

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `card` component.
- The `input` component.
- The `checkbox` component.
- The `button` component.
