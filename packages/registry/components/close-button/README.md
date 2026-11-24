# Close button

An icon button that closes dialogs, sheets, alerts and banners, in three sizes.

## Usage

Use it in place of Bootstrap's `.btn-close` when you want the Bootcn look:
add `data-bs-dismiss="modal"` (or `alert`, `offcanvas`, `toast`) as with any
Bootstrap close button. Sizes: `bootcn-close-button--sm` and
`bootcn-close-button--lg`.

## Accessibility

- Always give it an accessible name (`aria-label="Close"`, or "Close dialog"
  when several are on the page); the icon is hidden from screen readers.
- The hit area is at least 24 × 24 px, even in the small size.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
