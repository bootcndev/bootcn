# Invoice

An invoice page: brand, number and status, billing addresses and dates, line items with totals and VAT worked out from quantity and price, payment notes, and a clean printed or PDF version.

## Usage

Render the rows from your data: each `<tr data-bootcn-invoice-item>` has
`data-quantity` and `data-price`. The script fills in each amount, the
subtotal, the tax (`data-tax-rate="0.2"` for 20%) and the total, formatted
with `data-currency` (ISO code) and `data-locale`. Write the numbers in the
HTML too, so the invoice is right without JavaScript and in emails.

- Status: `data-status="paid"`, `"due"`, `"overdue"` or `"draft"` on
  `.bootcn-invoice__status`.
- **Print** and **Download PDF** open the browser's print dialog, where
  "Save as PDF" makes the file. The printed version drops the frame and the
  buttons and keeps rows whole across pages. For PDFs made on the server,
  render the same HTML with a headless browser.

`Bootcn.invoice.calculate(root)` after changing rows returns
`{ subtotal, tax, total }`; `init()` / `destroy()`.

## Accessibility

- An article named "Invoice"; addresses, dates and totals are description
  lists, so each value is read with its label.
- The items table has column headers; on small screens it scrolls inside a
  focusable, named frame.
- Status colours always come with a word ("Paid", "Due in 14 days").

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`, `button`, `badge` and `table`.
