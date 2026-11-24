# Data table

A table with sorting, filtering, pagination and row selection, enhancing server-rendered rows.

## Usage

Render every row on the server; the script sorts, filters and pages them in
the browser. That suits a few hundred rows. For more, do the same work on the
server and keep the markup: the attributes and states are the same.

Without JavaScript all rows show and the table still reads well.

## JavaScript API

- `data-bootcn-data-table` on the wrapper; `data-page-size` (default 10).
- Sortable columns: a button with `data-bootcn-data-table-sort="<column
index>"` inside a `th[aria-sort]`; `data-type="number"` sorts numerically,
  using a cell's `data-value` when present.
- `data-bootcn-data-table-filter` (text input), `-select-all` and `-select`
  (checkboxes), `-prev` / `-next` (buttons), `-status` and `-selection`
  (text).
- Event `bootcn:data-table:change` (bubbles), `detail.page`,
  `detail.visible` and `detail.selected` (rows).
- `Bootcn.dataTable.init(root)` / `destroy(root)`.

## Accessibility

- Sort buttons sit inside the column headers, whose `aria-sort` announces
  the order; activating one cycles ascending, descending and original.
- Row checkboxes are named after their row ("Select ken99@example.com"); "Select
  all rows" becomes mixed (indeterminate) when only some rows are selected.
- The "Showing x–y of z" line is a status region, so paging and filtering are
  announced.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `table` component.
- The `input` component.
- The `button` component.
- The `checkbox` component.
