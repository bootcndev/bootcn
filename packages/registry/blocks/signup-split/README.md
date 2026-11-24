# Sign-up split screen

A two-column sign-up page: what you get on one side, the registration form on the other.

## Usage

Use it as the content of the sign-up page's `<main>`. Replace the pitch and
the feature list with your own. On phones only the logo stays above the form.

## Accessibility

- The heading is the page's `<h1>`; the feature list is a real list.
- The password rule is linked to the field (`aria-describedby`); the terms
  checkbox is required.
- The inverted panel keeps its contrast in light and dark mode.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `input` component.
- The `checkbox` component.
- The `button` component.
