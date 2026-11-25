# Product card

A product tile for shop grids: picture, sale or new badge, wishlist toggle, category, name linking to the product, rating, colours, price with the old price and saving, and an add-to-cart button.

## Usage

Put cards in `.bootcn-product-grid` (a responsive grid). Use an `<img>` in
`.bootcn-product-card__media` for real photos (`alt=""`: the name is right
below); the examples use `.bootcn-product-art`, a tinted panel with a
drawing.

- The product name's link covers the whole card; the wishlist and add
  buttons stay clickable above it.
- Prices: `.bootcn-price` with the current price, the old one in `<s>` and
  the saving. Hidden text reads it as "Price: $149, was $179".
- `data-bootcn-cart-add` on the add button, with `data-id`, `data-name`,
  `data-price` and `data-variant`, is all the `cart` component needs.
- `data-id`, `data-category`, `data-price`, `data-rating` and `data-colors`
  on the card are what the `product-filters` block filters and sorts by.

The wishlist button toggles `aria-pressed` and fires `bootcn:wishlist`
(`detail: { id, saved }`); `[data-bootcn-wishlist-live]` announces it.

## Accessibility

- Each card is an article named by the product; its heading level is yours
  to choose (h2 in a grid under the page title, h3 under a section title).
- The wishlist and add buttons are named after the product ("Add Studio
  Headphones to cart"); colours are listed by name; sale badges are words.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`, `rating` and `button`.
