# Scroll reveal

Sections and cards that fade and slide in as they scroll into view, one after another for lists, with no library and nothing hidden without the script.

## Usage

Add `data-bootcn-reveal` to anything that should appear as it scrolls into
view, with a direction: `up` (the default), `down`, `start`, `end`,
`fade` or `zoom`. `data-bootcn-reveal-stagger` on a list reveals its
children one after another (90 ms apart, or the number you give).
Tune with `--bootcn-reveal-duration` (600ms).

Elements are only hidden after the script has started (it adds
`bootcn-reveal-ready` to `<html>`), so without it, or if it fails,
everything simply shows.

`Bootcn.reveal.setup(container)` for content added later,
`show(element)` to reveal one now; `bootcn:reveal` fires on each.

## Accessibility

- Content is in the page from the start; screen readers and keyboard users
  reach it whether it has been revealed or not.
- Under `prefers-reduced-motion: reduce` everything shows at once, with no
  movement.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
