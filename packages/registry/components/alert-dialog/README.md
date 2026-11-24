# Alert dialog

A modal confirmation that interrupts the user for an important decision, with Cancel focused first.

## Usage

Use it only for decisions that need an answer now, such as deleting data.
It is a Bootstrap modal with `data-bs-backdrop="static"`: clicking outside
does not close it, Escape and the buttons do. Put the confirm handler on the
destructive button.

## JavaScript API

`alert-dialog.js` listens for Bootstrap's `shown.bs.modal` on `.bootcn-alert-dialog`
modals: it restores `role="alertdialog"` (Bootstrap sets `dialog`) and moves
focus to the element with `data-bootcn-alert-dialog-cancel`.
`Bootcn.alertDialog.init()` / `destroy()` add and remove that listener.

## Accessibility

- `role="alertdialog"` with `aria-labelledby` and `aria-describedby`, so the
  question and its consequence are announced together.
- Focus starts on Cancel, the least destructive action, and returns to the
  trigger when the dialog closes (Bootstrap).
- Bootstrap traps focus inside while it is open.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `dialog` component.
- The `button` component.
