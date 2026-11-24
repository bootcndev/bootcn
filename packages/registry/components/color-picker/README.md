# Color picker

Preset swatches, a custom color from the system picker and a hex field, kept in sync with one form value.

## Usage

Offer a few brand-safe presets and let people pick any other color with the
system picker or by typing a hex value. If text will sit on the chosen color,
check its contrast before saving it.

## JavaScript API

- `data-bootcn-color-picker` on the fieldset. Swatches are radio inputs (their
  `value` is the hex color), with the system picker (`type="color"`), the hex
  field and the hidden input marked `data-bootcn-color-picker-value` kept in
  sync.
- An invalid hex gets `aria-invalid="true"` and changes nothing.
- Event `bootcn:color-picker:change` (bubbles), `detail.value`.
- `Bootcn.colorPicker.setColor(root, '#rrggbb')`; `init()` / `destroy()`.

## Accessibility

- A fieldset with a legend; swatches are native radio buttons named after
  their color ("Blue"), so arrow keys move between them and screen readers
  announce the choice.
- The selected swatch has a ring in the foreground color (not color alone);
  the hex field has a label, help text and an error state.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `label` component.
