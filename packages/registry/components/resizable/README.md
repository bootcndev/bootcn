# Resizable

Panels with a draggable divider that also resizes from the keyboard, horizontally or vertically.

## Usage

Set the first panel's starting size with `flex-basis` (percent) and the same
number in the handle's `aria-valuenow`; the panel after the handle fills the
rest (`bootcn-resizable__panel--fill`). Save the size from the resize event if
you want to restore it on the next visit.

## JavaScript API

- `data-bootcn-resizable` on the group (add `bootcn-resizable--vertical` to
  stack panels); groups can nest.
- The handle (`role="separator"`) controls the panel before it
  (`aria-controls`); `aria-valuemin` / `aria-valuemax` limit its size in
  percent, `aria-valuenow` holds the current size.
- Event `bootcn:resizable:resize` (bubbles), `detail.value` in percent.
- `Bootcn.resizable.resize(handle, percent)`; `init()` / `destroy()`.

## Accessibility

- The handle is a focusable `separator` with a name and min, max and current
  values, so screen readers announce the panel size.
- Arrow keys resize by 5% (Left/Right, or Up/Down when vertical); Home and End
  jump to the limits.
- Dragging uses pointer capture and works with mouse, pen and touch.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
