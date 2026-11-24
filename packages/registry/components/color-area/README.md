# Color area

A two-dimensional saturation and brightness picker with a hue slider and a hex field, usable with the keyboard.

## Usage

Put the saved color in the hidden input's `value`; the script sets
everything else from it. It uses the hue slider styles of the Color slider
component. For a few fixed choices, the Color picker component (swatches) is
simpler.

## JavaScript API

- `data-bootcn-color-area` on the group, the area
  (`data-bootcn-color-area-area`) with a thumb holding two range inputs
  (`data-axis="x"` for saturation, `data-axis="y"` for brightness), the hue
  slider (`data-bootcn-color-area-hue`), the hex field
  (`data-bootcn-color-area-hex`) and the hidden form value
  (`data-bootcn-color-area-value`, the starting color).
- Drag or click in the area; with the keyboard, ←/→ change saturation and
  ↑/↓ brightness (Shift for steps of 10, Page Up/Down, Home/End).
- A valid hex (`#rgb` or `#rrggbb`) updates the color as you type; an
  invalid one gets `aria-invalid` when you leave the field and changes
  nothing.
- Event `bootcn:color-area:change` (bubbles), `detail.value` (`#rrggbb`).
- `Bootcn.colorArea.setColor(root, '#rrggbb')`; `init()` / `destroy()`.

## Accessibility

- One tab stop for the area: a range input labelled "Saturation" with the
  role description "2D slider"; its value text reads both axes ("Saturation
  84%, brightness 92%"), and the arrow keys move in two dimensions.
- The hue slider and the hex field have labels; the color is always
  available as text in the hex field.
- The focus ring is drawn around the visible thumb.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `color-slider` component.
- The `label` component.
- The `input` component.
