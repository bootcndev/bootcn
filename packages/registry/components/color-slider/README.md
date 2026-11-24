# Color slider

Sliders for one color channel each (hue, saturation, lightness, opacity), with the channel painted on the track and a live swatch.

## Usage

Set the starting color in the `style` attribute of the group (and the
matching `value` of each input) on the server. The hue slider class
`bootcn-color-slider__input--hue` also works on its own, as in the Color
area component.

## JavaScript API

- `data-bootcn-color-slider` on the group; the color lives in its CSS
  variables `--bootcn-color-h`, `-s`, `-l` and `-a`. Each native range input
  names its channel with `data-channel="h|s|l|a"` (hue 0–360, the others
  0–100). Use any subset of the four.
- The tracks paint the channel with the other channels' current values; the
  `<output for>` of each input and the hidden input marked
  `data-bootcn-color-slider-value` (`hsl(h s% l% / a)`) stay in sync.
- Event `bootcn:color-slider:change` (bubbles),
  `detail: { value, h, s, l, a }`.
- `Bootcn.colorSlider.setColor(root, { h, s, l, a })`; `init()` /
  `destroy()`.

## Accessibility

- Native range inputs: arrow keys, Page Up/Down, Home and End work, and each
  slider has a visible label and a value with its unit (`aria-valuetext`,
  "262 degrees").
- The group is named by its title; the swatch is decorative and the value is
  also given as text.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `label` component.
