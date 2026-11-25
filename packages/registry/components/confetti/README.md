# Confetti

A burst of confetti from a button or any point, drawn on a canvas in the theme colours, with no library; skipped under reduced motion.

## Usage

Save it for real moments: a finished onboarding, a first sale, a goal met.
Always say what happened in text too ("Your shop is live"), because the
confetti is decoration and is skipped for people who prefer less motion.

## JavaScript API

- `Bootcn.confetti({ x, y, particles: 120, spread: 70, colors })` bursts
  from a point in the viewport (default: the centre) and returns `true`, or
  `false` when nothing is drawn (reduced motion).
- `data-bootcn-confetti` on a button bursts from its centre; optional
  `data-particles` and `data-spread` (degrees).
- Colours default to the chart tokens (`--bootcn-chart-1` … `-5`).
- Event `bootcn:confetti` on `document`. `init()` / `destroy()`.

## Accessibility

- The canvas is hidden from screen readers and takes no clicks; it removes
  itself after about 2.5 seconds.
- Nothing is drawn under `prefers-reduced-motion`; the message next to it
  carries the news.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button` component.
