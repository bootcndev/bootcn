# Slider

A native range input with a filled track, a visible value and keyboard support.

## Usage

It is a native `<input type="range">`, so forms submit it as usual. Show the
value in an `<output for="…">`. Firefox fills the track natively; the script
does it for Chromium and Safari.

## JavaScript API

- `data-bootcn-slider` on the input turns on the track fill and output updates.
- `data-bootcn-slider-prefix` / `data-bootcn-slider-suffix`: text around the
  value in the `<output>` (for example `€` or `%`).
- `Bootcn.slider.update(input)`: refresh after changing the value from script.
- `Bootcn.slider.init(root)` / `destroy()`.

Without JavaScript the slider still works; Chromium and Safari then show the
initial fill from the inline `--bootcn-slider-fill`.

## Accessibility

- Native range input: arrow keys, Page Up/Down, Home and End work, and screen
  readers announce the value.
- The visible `<label>` names it; the `<output>` shows the current value.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `label` component.
