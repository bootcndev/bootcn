# Password strength

A new-password field with a strength meter, a checklist of rules that ticks as you type, and a show/hide button.

## Usage

Use it on sign-up and change-password forms, with
`autocomplete="new-password"` so password managers offer a strong one.
Check the same rules on the server: the meter is guidance, not security.

## JavaScript API

- `data-bootcn-password` on the wrapper; the input has
  `data-bootcn-password-input`, the eye button `data-bootcn-password-toggle`,
  the strength text `data-bootcn-password-strength`, and each rule is an
  `<li data-rule="length|number|symbol|case">` (`data-min` on the length
  rule, default 8). Remove the rules you do not need.
- The wrapper gets `data-level` 0–4 (the meter's colour); each rule
  `data-met`. A `required` field gets a custom validity message until every
  rule is met, so the browser and the Form component block a weak password.
- Event `bootcn:password:change` (bubbles), `detail: { level, valid }`.
- Messages (`password.level.0` … `password.level.4`, `password.strength`,
  `password.invalid`, `password.met`, `password.unmet`) can be translated
  with `window.Bootcn.messages`.
- `Bootcn.passwordStrength.init()` / `destroy()`.

## Accessibility

- The input is described by the strength text and the rule list, and each
  rule says "(done)" or "(not yet)" in text, not only with a colour or icon.
- The strength is announced after a pause in typing, not on every key.
- The show/hide button is a toggle (`aria-pressed`) named "Show password".

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `label` component.
- The `input` component.
