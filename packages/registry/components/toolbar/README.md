# Toolbar

A row of related controls with one tab stop and arrow-key navigation, with toggles and grouped choices.

## Usage

Group related actions (formatting, view options) in a toolbar. Separate
groups with `role="separator"`. Keep the number of controls small; for many
commands, use a Menubar.

## JavaScript API

- `role="toolbar"` with `data-bootcn-toolbar` and an `aria-label`. One control
  has `tabindex="0"`, the others `-1` (the script keeps it that way).
- Buttons with `aria-pressed` toggle; inside a group marked
  `data-bootcn-toolbar-exclusive`, pressing one releases the others.
- Event `bootcn:toolbar:change` (bubbles), `detail.button` and
  `detail.pressed`.
- `Bootcn.toolbar.init(root)` / `destroy()`.

## Accessibility

- WAI-ARIA toolbar: one tab stop; Left/Right move between controls (wrapping),
  Home and End jump to the ends.
- Toggles announce "pressed"; groups are named ("Style", "Alignment");
  icon-only buttons have visually hidden names.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
