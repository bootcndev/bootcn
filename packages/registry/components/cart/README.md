# Cart

A shopping cart in a side drawer: a header button with the item count, line items with pictures, options, quantity steps and remove, a free-shipping progress bar, the subtotal and checkout; add-to-cart buttons and product forms feed it.

## Usage

Put the toggle button in your header and the drawer once per page. Then:

- Any button with `data-bootcn-cart-add` adds a product: `data-id`,
  `data-name`, `data-price`, and optionally `data-variant`, `data-image`
  (a picture URL) and `data-quantity`. In a product card, the card's
  picture is used.
- A product page form with `data-bootcn-cart-form` adds what was chosen:
  hidden `id`, `name` and `price` fields, the `color` and `size` radios
  (or the names in `data-options`) and a `quantity` field.

The same product with different options is a separate line. The drawer
opens after adding (announced); quantities step with − and +; Remove takes a
line out. `data-free-shipping="100"` shows how far the order is from free
shipping; prices use `data-currency` and `data-locale`.

With `data-storage-key="cart"` the cart is kept in this browser
(localStorage) between pages, which is what the store template does. Keep
the real cart on your server for signed-in customers.

## JavaScript API

`Bootcn.cart.add({ id, name, price, variant, quantity, image })`,
`setQuantity(id, variant, n)`, `remove(id, variant)`, `items()`,
`totals()` (`{ count, subtotal }`), `clear()`, `open()`, `init()` /
`destroy()`. Every change fires `bootcn:cart:change`
(`detail: { items, count, subtotal }`). Messages `cart.*` are translatable.

## Accessibility

- The toggle says how many items there are ("Cart, 3 items"); the drawer is
  Bootstrap's offcanvas: focus moves in, Escape closes, focus returns.
- Each line has a named quantity group ("Quantity of Everyday Tee") with
  "One less" and "One more" buttons; the focus stays on the button you
  pressed. Adding, changing and removing are announced.
- The free-shipping bar is a labelled `<progress>` with the amount in words.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle (offcanvas).
- `themes/tokens/tokens.css`, `sheet`, `button` and `product-card` (pictures and prices).
