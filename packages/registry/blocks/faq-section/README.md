# FAQ section

Frequently asked questions in an accordion, beside a heading and a contact link.

## Usage

Each question is a button in an `<h3>`; the first answer starts open.
Remove `data-bs-parent` to let several answers stay open at once.

## Accessibility

- Bootstrap's accordion: buttons with `aria-expanded` and `aria-controls`,
  operated with Enter and Space.
- Questions are headings, so screen reader users can jump between them.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `accordion` component.
