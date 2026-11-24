# Breadcrumb

Shows where the current page sits in the site hierarchy, with links to each parent.

## Usage

List the parents in order and make the last item the current page, without
a link and with `aria-current="page"`. Change the separator with
`--bs-breadcrumb-divider` (a quoted string, for example `'/'`).

## Accessibility

- A `<nav aria-label="Breadcrumb">` landmark around an ordered list.
- The separator is CSS content, so screen readers do not read it.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
