# Stacked bar chart

A bar chart card that stacks three series per month, with the total, a legend and a data table.

## Usage

Set `"stacked": true` in the chart configuration: each month's bars are
stacked, and the scale follows the total. Keep stacks to a few series; the
data table ("Show data") lists every value.

## Accessibility

- The chart is a `<figure>` with a caption; the same numbers are in a data
  table, and each bar has a tooltip with the series, the category and the
  value.
- Series are told apart by the legend and the table, not by color alone.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `chart` component.
- The `card` component.
