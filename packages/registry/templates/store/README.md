# Store

An online shop in three pages, built from Bootcn's commerce components and
blocks: a catalogue (`store.html`) with filters, sorting and product cards,
a product page (`store-product.html`) with a gallery, colour and size
options and related products, and a one-page checkout
(`store-checkout.html`). One cart drawer is on every page and keeps its
items between pages (localStorage key `acme-store-cart`).

## Usage

```bash
npx bootcn add store
```

The CLI installs every component and block the pages use and writes the
three pages to your project root (or `paths.pages`). Then:

- Render the product cards, the product page and the checkout rows from
  your catalogue on the server; product links point to `store-product.html`
  as an example, use your real URLs.
- Connect the checkout to your payment provider and your discount codes
  (see the `checkout` block's README): never post raw card numbers to your
  own server.
- Keep the authoritative cart on your server for signed-in customers; the
  browser cart is for browsing.

## JavaScript

`store.js` keeps the dark mode button in sync (`Bootcn.store.setTheme`).
Everything else comes from the components: `cart.js`, `product-card.js`,
`variant-picker.js`, `product-listing.js`, `product-detail.js` and
`checkout.js`.

## Accessibility

- Every page has a "Skip to content" link, a header with a named main nav,
  `<main>` with one `<h1>`, and a footer.
- The cart toggle says how many items are in the cart; adding, changing
  and removing are announced; the checkout's errors are tied to their
  fields and its confirmation takes the focus.
- See the components and blocks for the details of each part.
