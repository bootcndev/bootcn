# Sheet

A panel that slides in from the edge of the screen for secondary tasks, built on Bootstrap Offcanvas.

## Usage

Use `offcanvas-end` (right), `offcanvas-start` (left), `offcanvas-top` or
`offcanvas-bottom` to choose the side. The trigger needs
`data-bs-toggle="offcanvas"` and `data-bs-target`. Width:
`--bs-offcanvas-width` on `.bootcn-sheet`.

## Accessibility

- Bootstrap gives it `role="dialog"` and `aria-modal` while open, traps focus
  inside, closes it on Escape and returns focus to the trigger.
- The title names the dialog (`aria-labelledby`).

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `button` component.
- The `input` component.
