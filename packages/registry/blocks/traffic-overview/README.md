# Traffic overview

An analytics section: three metrics with sparklines, a sign-up funnel and a heatmap of visits by day and hour.

## Usage

Fill the numbers from your analytics on the server: the sparklines take a
comma-separated list, the funnel the counts and shares, the heatmap one
level per cell. See each component for the details.

## Accessibility

- Each metric shows its value as text, and its sparkline has a text
  summary.
- The funnel is an ordered list and the heatmap a table with headers, so
  all the numbers are available to screen readers.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `sparkline` component.
- The `funnel` component.
- The `heatmap` component.
- The `card` component.
