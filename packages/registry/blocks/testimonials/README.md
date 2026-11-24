# Testimonials

Customer quotes in a masonry-style grid of cards, each with the person's name, role and avatar.

## Usage

Replace the quotes with real ones from your customers, with their
permission. Use photos instead of initials with the Avatar component's
`<img>` markup.

The cards flow into as many columns as fit (CSS `columns`), so quotes of
different lengths pack neatly.

## Accessibility

- Each quote is a `<figure>` with `<blockquote>` and `<figcaption>`, which
  ties the person to their words.
- Avatars are decorative (`aria-hidden`), because the name is next to them.
- Columns flow top to bottom, then left to right; the reading order follows the
  list.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `avatar` component.
