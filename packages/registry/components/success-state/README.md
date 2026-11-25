# Success state

A "You're all set" screen: a check that draws itself, a title, a message and next steps, with optional confetti.

## Usage

Put it where the flow ends: after a form, in the last step of a `stepper`
(as its `data-bootcn-stepper-complete` panel), or in a modal. The check
draws itself when the element becomes visible (a `hidden` attribute
removed, a panel shown); `Bootcn.success.play(el)` plays it again.

With `data-bootcn-success-confetti` and the `confetti` component loaded,
confetti bursts from the check. The colour is `--bootcn-success-color`.

Event `bootcn:success:play`; `init()` / `destroy()`.

## Accessibility

- The mark is decorative; the title and the message say what happened.
  When the state replaces a form, move the focus to the title (the stepper
  does) so screen readers read it.
- Without JavaScript, and under reduced motion, the check is shown drawn,
  with no bounce and no confetti.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css` and `button` (and optionally `confetti`).
