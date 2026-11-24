# Pricing table

Three plans with a monthly/yearly switch, a highlighted plan, prices, calls to action and feature lists.

## Usage

Edit the plans, prices and features. Each price is written twice, once in
`bootcn-pricing__monthly` and once in `bootcn-pricing__yearly`; the billing
switch shows one set with CSS (`:has()`), no JavaScript. In browsers without
`:has()` the monthly prices stay visible.

Point each call to action at your sign-up or checkout page, passing the plan
and period your server needs.

## Accessibility

- The billing switch is a `<fieldset>` of two real radio buttons with a
  (visually hidden) legend, so it works with the keyboard and screen readers.
- Hidden prices use `display: none`, so only the selected period is read.
- Each call to action is described by its plan name (`aria-describedby`), so
  "Get started" is announced as "Get started, Starter".
- The highlighted plan is marked with text ("Most popular"), not only a
  border.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button` component.
- The `badge` component.
