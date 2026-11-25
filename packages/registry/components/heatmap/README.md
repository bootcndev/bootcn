# Heatmap

A table of values coloured by intensity (days by hours, weeks by days), with every number readable and a Less–More legend.

## Usage

Render the table on the server and give each cell `data-level` 0–4 (for
example `min(4, floor(value / max * 5))`). The colours are tokens
(`--bootcn-heat-0` … `-4` with matching `--bootcn-heat-ink-*`), set for
light and dark mode; if you change them, keep 4.5:1 between each pair.

## Accessibility

- It is a real table with a caption and row and column headers, so screen
  readers can move by row and column and hear every value.
- The numbers are printed in the cells, so colour is never the only way to
  read the data; text keeps 4.5:1 on every step.
- The wrapper scrolls sideways on narrow screens and can be focused to
  scroll with the keyboard.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
