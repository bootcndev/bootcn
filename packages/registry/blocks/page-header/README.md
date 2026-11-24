# Page header

A page title with breadcrumb navigation, a short description and primary actions.

## Usage

Put it at the top of your page's `<main>`. The last breadcrumb item is the
current page and is not a link.

On narrow screens the actions wrap below the title.

## Accessibility

- The breadcrumb is a `<nav aria-label="Breadcrumb">` with an ordered list;
  the current page has `aria-current="page"`.
- The title is the page's `<h1>`. If your layout already has an `<h1>`, change
  it to `<h2>`.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button` component.
