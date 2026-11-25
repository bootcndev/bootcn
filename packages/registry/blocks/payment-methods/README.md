# Payment methods

Saved payment cards: a list with the default card, Set as default, Edit and Remove (confirmed), and an Add card dialog whose card picture follows the form.

## Usage

Render the saved cards from your payment provider: each list item has
`data-card-id`, `data-brand`, `data-last4`, `data-name` and
`data-expiry`. **Add card** and **Edit** open the dialog (the
`payment-card` form and picture); editing shows the number masked and lets
people change the name and the expiry. **Remove** asks first; removing the
default card makes the next one the default.

## Connect it

Each change fires `bootcn:payment-methods:change` with
`detail: { action, id, card }` (`add`, `update`, `default`, `remove`); save
it on your server. Adding a card should go through your payment provider's
secure fields (for example Stripe's SetupIntent with Elements), which
returns the brand and last four digits to show here; this block never
keeps the full number or the code.

`Bootcn.paymentMethods.add(root, { id, brand, last4, name, expiry })`,
`init()` / `destroy()`. Messages `methods.*` are translatable.

## Accessibility

- A section named by its heading; each card is a list item read as "Visa
  ending 4242, Default, Expires 12 / 28".
- Edit and Remove are named after the card; removal is confirmed in an
  alert dialog with the focus on Cancel; changes are announced.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`, `payment-card`, `badge`, `button`, `input`, `dialog`, `modal` and `alert-dialog` (load `alert-dialog.js`).
