# Animated button

Button effects for calls to action: a shimmer sweep, a glowing animated border, a ripple on click and a press effect.

## Usage

Keep effects for one call to action per screen; a page full of moving
buttons is tiring. The effects add no meaning, so the button text must say
everything.

## JavaScript API

- Add a class to any Bootcn button: `bootcn-button--shimmer` (a light
  sweep every 3 seconds), `bootcn-button--glow` (a rotating gradient
  border; use it on outline or ghost buttons), `bootcn-button--press` (a
  small give when pressed), `bootcn-button--nudge` (the icon moves on hover).
- `data-bootcn-ripple` adds a ripple from the pointer on click
  (`animated-button.js`).
- `Bootcn.animatedButton.init()` / `destroy()`.

## Accessibility

- Effects are decorative: the buttons keep their names, focus rings and
  contrast (the shimmer is a translucent band over the same colours).
- Every animation stops with `prefers-reduced-motion`; no ripple is drawn
  for keyboard presses.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button` component.
