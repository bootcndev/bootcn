# Pagination

Links to the pages of a long list, with previous and next, the current page and a gap.

## Usage

Render the page links on the server. Mark the current page with `active` on
its `.page-item` and `aria-current="page"` on its link. Leave out Previous on
the first page and Next on the last (or render them as `disabled` items).

## Accessibility

- A `<nav aria-label="Pagination">` landmark around a list of links.
- Previous and Next are named "Previous page" and "Next page"; on phones their
  text is visually hidden but still read.
- The gap ("…") is hidden from screen readers.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
