# Range slider

A slider with two thumbs for choosing a range (a minimum and a maximum), built on two native range inputs.

## Usage

Use it for filters such as a price or a date span. Each input posts its own
field; check on the server that the minimum is not above the maximum.

## JavaScript API

- `data-bootcn-range` on the group, with two native range inputs:
  `data-bootcn-range-min` and `data-bootcn-range-max` (same `min`, `max`
  and `step`). Optional: `data-format="€{value}"` for the output and the
  value text, and an `<output data-bootcn-range-output>`.
- The thumbs cannot cross: moving one past the other stops it there.
- Event `bootcn:range:change` (bubbles), `detail: { low, high }`.
- `Bootcn.rangeSlider.setValue(root, low, high)`; `init()` / `destroy()`.
- Without JavaScript it is still two working sliders that post both values
  (`price_min`, `price_max`).

## Accessibility

- Two native sliders, each with its own name ("Minimum price", "Maximum
  price") inside a labelled group, so arrow keys, Page Up/Down, Home and End
  work and screen readers announce each value with its unit
  (`aria-valuetext`, "€20").
- The chosen range is also shown as text.
- In right-to-left text the range runs from the right, and the fill follows.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `label` component.
