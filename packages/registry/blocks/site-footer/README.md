# Site footer

A footer with the logo, a newsletter sign-up, three columns of links, the copyright and social links.

## Usage

Replace the links, the copyright and the social accounts. The newsletter
form posts `email`; point its `action` at your mailing list provider or your
own endpoint.

## Accessibility

- A `<footer>` landmark with a `<nav aria-label="Footer">`; each column is
  a heading and a list of links.
- The email field has a (visually hidden) label and `autocomplete="email"`;
  social links are named ("Acme on GitHub").

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `input` component.
- The `button` component.
