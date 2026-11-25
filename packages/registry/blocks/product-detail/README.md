# Product detail

A product page section: breadcrumbs, a picture gallery with thumbnails, name, rating, price, colour and size choices, quantity, add to cart and wishlist, delivery perks and expandable details.

## Usage

- **Gallery**: each thumbnail button holds its picture in
  `[data-bootcn-detail-view]` (an `<img>` for photos); clicking it, or the
  arrow keys between thumbnails, shows it in the large frame. Name each
  thumbnail ("Back view"): the large frame takes that name.
- **Buying**: the form has `data-bootcn-cart-form`, hidden `id`, `name` and
  `price` fields, the `variant-picker` groups and a `quantity` field. With
  the `cart` component on the page, Add to cart puts "Sand / M" × 2 in the
  cart and opens it. Without it, the form submits wherever you point it.
- **Details**: native `<details>` sections; add as many as you need.

`Bootcn.productDetail.select(thumb)`, `init()` / `destroy()`.

## Accessibility

- An article named by the product's `<h1>`; breadcrumbs in a named nav
  with `aria-current="page"`.
- The large picture is an image named after the chosen view; thumbnails are
  toggle buttons (`aria-pressed`) in a named list.
- Options are native radio groups; the quantity field is labelled; the
  wishlist button is named after the product.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`, `product-card`, `rating`, `variant-picker`, `cart`, `breadcrumb`, `input` and `button`.
