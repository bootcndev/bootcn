# Forgot password card

Asks for an email address to send a reset link, with a status message and a way back to sign in.

## Usage

After the form is submitted, render the result into the
`role="status"` paragraph (for example "If that address has an account, a
reset link is on its way."). Use the same message whether or not the address
exists, so the form does not reveal who has an account.

## Accessibility

- The status paragraph is a live region (`role="status"`): text placed in it
  is announced without moving focus. It is hidden while empty.
- The back link has visible text; its arrow icon is decorative.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `card` component.
- The `input` component.
- The `button` component.
