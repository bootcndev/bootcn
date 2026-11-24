# Table

A responsive data table with a caption, header, row hover and a totals footer.

## Usage

Keep the `<caption>`, `<thead>` with `scope="col"` and, where it helps, a row
header (`<th scope="row">`) in each row. `.table-responsive` lets wide tables
scroll sideways on small screens. For sorting, filtering and pagination, use
the Data table component.

## Accessibility

- The caption names the table; column and row headers are announced with each
  cell.
- Row hover is a visual aid only; nothing depends on it.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
