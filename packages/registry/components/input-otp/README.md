# Input OTP

A one-time code field shown as separate boxes, backed by one real input that autofills from SMS and accepts paste.

## Usage

Group the slots any way you like (two groups of three here) as long as the
number of slots matches `maxlength`. Paste and the phone's SMS code
suggestion fill every slot at once, because there is only one input.

## JavaScript API

- `data-bootcn-otp` on the wrapper; the input's `maxlength` sets the length,
  `inputmode="numeric"` keeps digits only.
- Event `bootcn:otp:complete` (bubbles), `detail.value`, once all slots are
  filled; use it to submit the form.
- `Bootcn.inputOtp.render(root)` after setting the value from script;
  `init(root)` / `destroy(root)`.

## Accessibility

- One labelled input, so screen readers announce one field with its help
  text, and type, paste and autofill work as usual
  (`autocomplete="one-time-code"`).
- The boxes are visual only (`aria-hidden`).
- Without JavaScript it is a normal text input.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `label` component.
