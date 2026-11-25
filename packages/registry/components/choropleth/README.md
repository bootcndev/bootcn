# Choropleth map

A map of regions coloured by a value, from any GeoJSON: a metric selector, tooltips, zoom and pan, a legend and the data as a table.

## Usage

Use any GeoJSON whose features have an `id` and a `name`: countries,
regions, districts, sales areas. Simplify large files first (for example with
mapshaper) so the page stays light. The sample is Romania's 42 counties from
[geoBoundaries](https://www.geoboundaries.org/) (CC BY 4.0, World Bank),
simplified; keep the attribution line when you use that data. Render the
values JSON on the server from your database.

## JavaScript API

- `data-bootcn-choropleth` on the `<figure>`, with the boundaries: either
  `data-geo` (the URL of a GeoJSON FeatureCollection) or `data-geo-name`
  (a set registered in `window.BootcnGeo`, as the sample
  `choropleth-sample.js` does for `romania-counties`). Each feature needs an
  `id` and `properties.name`. The values go in an inline
  `<script type="application/json" data-bootcn-choropleth-data>`:
  `{ "metrics": { "revenue": { "label": "…", "format": "currency", "currency": "EUR" }, … }, "regions": { "<feature id>": { "revenue": 34900, … }, … } }`.
- The `<select data-bootcn-choropleth-metric>` chooses the metric that
  colours the map; its option values are the metric keys.
- Six colour steps from 0 to a rounded maximum (tokens
  `--bootcn-choropleth-0` … `-5`, light and dark), a legend, a tooltip with
  every metric, and a "Show data" table with all the values.
- Zoom: the +/−/reset buttons, double-click, Ctrl/⌘ + wheel or a trackpad
  pinch; drag to pan when zoomed in.
- Keyboard: the map is one tab stop; arrows move between regions (in name
  order) and show their tooltip, + and − zoom, Escape hides the tooltip.
- Events: `bootcn:choropleth:ready`, `bootcn:choropleth:metric`
  (`detail.metric`). `Bootcn.choropleth.setData(root, data)` updates the
  values; `init()` / `destroy()`.
- Numbers use `Intl.NumberFormat` with `data-locale` (else `<html lang>`).

## Accessibility

- Every region is an image named with its value ("Cluj: Estimated revenue /
  year €52,410"), reachable with the arrow keys from a single tab stop, and
  the tooltip follows keyboard focus.
- "Show data" gives all values as a table with headers, so nothing depends
  on colour.
- The plain mouse wheel keeps scrolling the page; zoom needs Ctrl/⌘ or the
  buttons, which are named.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `label` component.
- The `select` component.
