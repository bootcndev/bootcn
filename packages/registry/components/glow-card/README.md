# Glow card

Cards with a soft light that follows the pointer and lights up their border; a still glow on keyboard focus.

## Usage

Put `.bootcn-glow-card` elements inside a container with
`data-bootcn-glow` (or put `data-bootcn-glow` on a single card). Moving a
mouse or pen over a card moves the light; the colour is
`--bootcn-glow-color` (the primary colour by default). `.bootcn-glow-grid`
lays cards out in a responsive grid.

Touch screens have no hover, so the light stays off there; keyboard focus
inside a card shows it.

`Bootcn.glow.init()` / `destroy()`.

## Accessibility

- Purely visual: the cards read the same without it.
- No motion of its own: the light only follows the pointer.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
