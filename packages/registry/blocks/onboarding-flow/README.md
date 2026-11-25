# Onboarding flow

A first-run setup card: three steps (workspace, about you, invite the team) with validation, ending on a "You're all set" screen with confetti.

## Usage

Show it after sign-up. The steps are the `stepper` component; each step's
fields are checked before moving on. "Finish setup" fires
`bootcn:stepper:finish` with the form, then shows the closing
`success-state` panel. To save first:

```js
document.addEventListener('bootcn:stepper:finish', async (event) => {
  event.preventDefault();
  await fetch('/onboarding', { method: 'POST', body: new FormData(event.detail.form) });
  Bootcn.stepper.finish(event.target, { skipEvent: true });
});
```

Change the steps, fields and texts to your product's.

## Accessibility

See the `stepper` and `success-state` components: progress is an ordered
list with the current step marked, moving between steps focuses and
announces the new step, and errors are tied to their fields.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`, `stepper`, `success-state`, `confetti`,
  `input`, `select`, `textarea` and `button`.
