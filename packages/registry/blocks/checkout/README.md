# Checkout

A one-page checkout: contact, delivery address, shipping method and card details with formatting and checks, beside an order summary with a discount code and totals, ending on an order confirmation.

## Usage

- **Items**: with the `cart` component on the page and items in it, the
  summary lists the cart. Otherwise it uses the rows in the HTML
  (`data-bootcn-checkout-item` with `data-name`, `data-price`,
  `data-quantity`); render them from your server's cart.
- **Totals**: subtotal, discount, shipping (each method's `data-cost`), tax
  (`data-tax-rate`) and total update as people choose; the Pay button shows
  the total. Currency: `data-currency` and `data-locale`.
- **Validation**: required fields, email, a card number that passes the
  Luhn check, an expiry date in the future, a 3–4 digit code. The card
  number is spaced in fours as people type and its brand is shown; the
  expiry becomes "MM / YY".

## Payments: connect your provider

**Do not send raw card numbers to your own server.** Replace the card
fields with your payment provider's secure fields (for example Stripe
Elements, Adyen or Braintree hosted fields), which keeps you out of PCI
scope. Then take the payment in the submit event:

```js
document.addEventListener('bootcn:checkout:submit', async (event) => {
  event.preventDefault();
  const result = await payWithYourProvider(event.detail.totals.total);
  if (result.ok) event.detail.done(result.orderNumber);
  else event.detail.fail('Your card was declined.');
});

document.addEventListener('bootcn:checkout:discount', async (event) => {
  event.preventDefault();
  const { percent } = await (
    await fetch('/discount?code=' + encodeURIComponent(event.detail.code))
  ).json();
  if (percent) event.detail.apply(percent);
  else event.detail.reject();
});
```

Without listeners the block is a working prototype: it accepts the code
`WELCOME10` (10% off) and confirms the order. On success the form is
replaced by the confirmation (the `success-state` component) and the cart
is emptied.

`Bootcn.checkout.totals(root)`, `setup(root)`, `luhn(number)`, `init()` /
`destroy()`. Messages `checkout.*` are translatable.

## Accessibility

- Sections are fieldsets with legends; every field has a label, autofill
  tokens (`email`, `address-line1`, `cc-number`, …) and its error tied with
  `aria-describedby`; the first invalid field gets the focus.
- Shipping methods are radio buttons; the whole card is the label.
- The discount result, problems and payment failures are announced; the
  confirmation's heading takes the focus.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`, `product-card` (the item pictures), `success-state`, `confetti`, `input`, `select`, `checkbox` and `button`.
