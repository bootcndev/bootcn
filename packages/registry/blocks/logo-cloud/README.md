# Logo cloud

A row of customer logos under a short line of social proof, wrapping on small screens.

## Usage

Replace each item with your customers' logos: an `<img>` with the
company name as `alt` (or an inline SVG with `role="img"` and
`aria-label`). Keep them one color (the muted foreground) so no logo shouts
louder than the others.

## Accessibility

- A section named by its heading; the logos are a list, and each company
  name is text (or the image's `alt`), not only a picture.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
