# Product listing

A shop listing: filters by category, price, colour and rating (a sidebar on large screens, a drawer on phones), sorting, a live result count and an empty state, over a grid of product cards.

## Usage

Render your products as `product-card`s, each in a
`<li data-bootcn-listing-item>`. Filters work on the card's
`data-category`, `data-price`, `data-colors` (comma separated) and
`data-rating`; the filter form's fields are named `category[]`, `color[]`
(checkboxes), `min`, `max` and `rating`. Results update as people choose,
with the count announced. Sorting: featured (your order), price both ways,
best rated.

This filters what is on the page. For large catalogues, filter on the
server: listen for `bootcn:listing:filter` (`detail` has the choices), or
make the form submit to your search page.

On screens narrower than 992px the filters move into a drawer opened by
**Filters**, which shows how many filters are on.

`Bootcn.productListing.apply(root)` after changing cards, `sort(root, by)`,
`init()` / `destroy()`. Messages `listing.one` and `listing.many`.

## Accessibility

- Each filter group is a fieldset with a legend; colours are named
  checkboxes; the price fields are labelled "Minimum price" and "Maximum
  price".
- The sort select has a label; the result count is announced politely.
- When nothing matches, a message and a Clear filters button take the
  grid's place.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle (the filters drawer).
- `themes/tokens/tokens.css`, `product-card`, `rating`, `button`, `input`, `select`, `checkbox`, `radio-group` and `sheet`.
