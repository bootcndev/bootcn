# Drawer

A panel that slides up from the bottom, with a handle, for quick tasks on phones.

## Usage

A drawer is a bottom offcanvas with a decorative handle and its content
centred in a narrow column. It suits phones; on wide screens consider the
Dialog or Sheet. The handle is visual only (no drag to close); use Cancel,
Escape or the backdrop.

## Accessibility

- Bootstrap gives it `role="dialog"` and `aria-modal` while open, traps focus,
  closes on Escape and returns focus to the trigger.
- The handle is hidden from screen readers.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `button` component.
- The `input` component.
