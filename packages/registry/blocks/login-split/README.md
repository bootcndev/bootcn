# Login split screen

A two-column sign-in page: a brand panel with a quote beside the form, stacking on small screens.

## Usage

Use it as the content of the sign-in page's `<main>` element. From 768px the
brand panel and the form sit side by side at full height; on phones the panel
shrinks to the logo above the form.

Replace the logo, the quote and its author with your own.

## Accessibility

- The heading is an `<h1>` because the block is the page; keep one `<h1>` per
  page.
- The quote uses `<figure>`, `<blockquote>` and `<figcaption>`, so the author is
  tied to the quote.
- The brand panel inverts the page colours (`--bs-emphasis-color` on
  `--bs-body-bg`), which keeps the contrast in light and dark mode.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `input` component.
- The `checkbox` component.
- The `button` component.
