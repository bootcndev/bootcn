# Chart

Accessible SVG charts (area, bar, line, pie, radar, radial) from a small JSON configuration, with tooltips, a legend and a data table.

## Usage

Charts are drawn as SVG by `chart.js` (no chart library) and redraw when
their container resizes. Numbers are formatted for the page language. The
configuration is JSON, so render it from your data on the server.

## JavaScript API

Put a `<figure data-bootcn-chart>` with a `<figcaption>` and a
`<script type="application/json">` configuration on the page:

| Key                                                            | Meaning                                                                          |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `type`                                                         | `area`, `bar`, `line`, `pie`, `radar` or `radial`                                |
| `categories`                                                   | labels along the category axis (or slice names)                                  |
| `series`                                                       | `[{ "name", "data": [numbers], "color"? }]`; pie and radial use the first series |
| `stacked`                                                      | stack area or bar series                                                         |
| `orientation`                                                  | `"horizontal"` for horizontal bars                                               |
| `curve`                                                        | `monotone` (default), `linear` or `step` for lines and areas                     |
| `dots`                                                         | show points on lines                                                             |
| `donut`, `centerLabel`                                         | a donut with the total in the middle                                             |
| `colors`                                                       | slice colors for pie and radial                                                  |
| `max`                                                          | the full-circle value for radial (default: a round number above the largest)     |
| `format`                                                       | `Intl.NumberFormat` options, e.g. `{ "style": "currency", "currency": "EUR" }`   |
| `height`, `valueAxis`, `legend`, `categoryLabel`, `tableLabel` | layout and labels                                                                |

Colors default to `--bootcn-chart-1` … `--bootcn-chart-5`.
`Bootcn.chart.update(figure, config)` redraws with new data;
`Bootcn.chart.init(root)` / `destroy(root)`.

## Accessibility

- The SVG is decorative; the same numbers are in a real table behind a
  "Show data" toggle, captioned with the figure caption. Screen reader and
  keyboard users get every value.
- Series colors have at least 3:1 contrast against the background in both
  themes (WCAG 1.4.11); the legend and tooltip name each series too, so color
  is not the only cue.
- Tooltips follow the pointer only and never hold information that is not in
  the table.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
