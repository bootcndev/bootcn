# Bar chart

A card with a bar chart built on the Chart component: desktop and mobile visitors side by side.

## Usage

Replace the JSON configuration inside the `<figure>` with your data (see the
Chart component for every option) and update the title, description and
footer text. The card's CSS only styles the footer; the chart itself comes from
the Chart component (`chart.css` and `chart.js`).

## Accessibility

- The figure caption describes the data; it captions the "Show data" table,
  which holds every value for screen reader and keyboard users.
- The card is a section named by its heading.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `chart` and `card` components.
