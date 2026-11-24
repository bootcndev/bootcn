# Login with email link

A passwordless sign-in card: enter an email and receive a one-time sign-in link, with a password fallback.

## Usage

Post the email to your server, create a single-use token with a short
expiry, and email a link containing it. Always answer "Check your email"
whether or not the address has an account, so the form cannot be used to
find out who is registered.

## Accessibility

- A labelled section with a heading; the email field has a visible label,
  `autocomplete="email"` and help text linked with `aria-describedby`.
- The password fallback is a normal link.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `card` component.
- The `input` component.
- The `button` component.
- The `label` component.
