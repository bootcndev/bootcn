# Hover card

A preview card that appears when the pointer rests on or keyboard focus reaches a link, built on Bootstrap Popover.

## Usage

Use a hover card for a preview of something behind a link, such as a
profile. The link must still work on its own: touch devices and some users
never see the card. The content is copied from a `<template>` and passes
through Bootstrap's HTML sanitizer.

## JavaScript API

- `data-bootcn-hover-card="<template id>"` on the trigger: the card shows the
  content of that `<template>`.
- `data-bootcn-placement` (optional): `top`, `right`, `bottom` (default) or
  `left`.
- `Bootcn.hoverCard.init()` / `destroy()`: add or remove the delegated
  listeners (and dispose open cards).

## Accessibility

- It opens on keyboard focus as well as hover, and Escape closes it
  (WCAG 1.4.13).
- It stays open while the pointer moves from the link onto the card.
- The card is linked to the trigger with `aria-describedby` (Bootstrap), so
  screen readers read it as the link's description. Do not put links or
  buttons inside it: they cannot be reached with the keyboard.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `avatar` component.
