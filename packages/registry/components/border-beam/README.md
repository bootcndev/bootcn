# Border beam

A light that travels around the border of a card, button or panel, in your colours, with no JavaScript.

## Usage

Add `bootcn-border-beam` to any element with a border radius: a card, a
button, a pricing plan. Tune it with custom properties:

| Property                 | Default                 |
| ------------------------ | ----------------------- |
| `--bootcn-beam-color`    | `var(--bootcn-primary)` |
| `--bootcn-beam-accent`   | violet                  |
| `--bootcn-beam-width`    | `2px`                   |
| `--bootcn-beam-duration` | `4s`                    |

Use it on one thing per screen, to draw the eye to it.

## Accessibility

- Purely visual: the content and its meaning stay the same without it.
- Under `prefers-reduced-motion: reduce` the border shows a still gradient.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
