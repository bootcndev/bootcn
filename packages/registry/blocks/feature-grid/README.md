# Feature grid

A section heading with a responsive grid of features, each with an icon, a title and a short description.

## Usage

Add or remove `<li>` items; the grid fits as many columns as the width
allows (about 17rem each). Swap the inline SVG icons for your own; keep
`aria-hidden="true"` on them.

## Accessibility

- The features are a list, so screen readers announce how many there are.
- The section is named by its `<h2>`; each feature has an `<h3>`.
- Icons are decorative; the titles carry the meaning.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
