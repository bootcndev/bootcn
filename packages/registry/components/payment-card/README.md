# Payment card

A payment card picture that follows its form as people type (number, brand colour, name, expiry) and turns over for the security code, with formatting and checks; also small cards for lists.

## Usage

Point a form at the card with `data-bootcn-pay-form="card-id"` (or put the
card inside the form). Fields named `card_number`, `card_name`,
`card_expiry` and `card_cvc` drive the picture:

- the number is spaced (American Express as 4-6-5) and its brand sets the
  card's colour (`data-brand`: `visa`, `mastercard`, `amex`);
- the expiry becomes "MM / YY"; the card turns over while the security
  code has the focus;
- on submit the number must pass the Luhn check and the expiry must be in
  the future; then `bootcn:pay:submit` fires with `detail: { brand, last4,
name, expiry, id }`: **never the full number or the code**.

`bootcn-pay-card--mini` is a small card for lists (see the
`payment-methods` block).

**Real payments**: card numbers must go to your payment provider, not your
server. Use the provider's secure fields (Stripe Elements, Adyen, …) for
the number and code, and keep this picture as the preview.

`Bootcn.paymentCard.render(form)`, `brand(number)`, `luhn(number)`,
`init()` / `destroy()`.

## Accessibility

- The picture is decorative (`aria-hidden`): everything it shows is in the
  labelled fields next to it.
- Each field has autofill tokens (`cc-number`, `cc-name`, `cc-exp`,
  `cc-csc`) and its error tied with `aria-describedby`.
- The turn is skipped under reduced motion.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`, `input` and `button`.
