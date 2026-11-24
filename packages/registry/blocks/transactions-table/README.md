# Transactions table

A card with a searchable, responsive table of payments, status badges and pagination.

## Usage

Render one `<tr>` per transaction from your data. The search form submits
`q` to the current page; handle it on the server, or filter rows with your own
script.

On narrow screens the table scrolls sideways inside the card
(`.table-responsive`) instead of squeezing the columns.

## Accessibility

- The table has a caption and `scope="col"` headers, so each cell is announced
  with its column.
- Status is text in a badge, not colour alone.
- The search form is a landmark named "Transactions", so it stays distinct
  from a site-wide search on the same page. The disabled "Previous" link
  uses `aria-disabled="true"` and is taken out of the tab order.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `card` component.
- The `badge` component.
- The `button` component.
- The `input` component.
