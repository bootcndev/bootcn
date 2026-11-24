# Menubar

A horizontal bar of menus, like a desktop application, with full arrow-key navigation and checkable items.

## Usage

Use a menubar for application-style commands (an editor, an admin tool),
not for site navigation: for that, use the Navigation menu. Keep each menu
short and put shortcuts next to items only if they really work.

## JavaScript API

- A `role="menubar"` element with class `bootcn-menubar`; each top item is a
  `.bootcn-menubar__trigger` (`role="menuitem"`, `aria-haspopup="menu"`,
  `aria-controls` = its menu). Only the first trigger has `tabindex="0"`.
- Menu items: `role="menuitem"`, or `role="menuitemcheckbox"` with
  `aria-checked` (toggled on activation).
- Event `bootcn:menubar:select` on the bar (bubbles), `detail.item` and
  `detail.checked`.
- `Bootcn.menubar.init()` / `destroy()`.

## Accessibility

- WAI-ARIA menubar: one tab stop (roving tabindex); Left/Right move between
  menus (and switch the open menu), Down/Enter/Space open the menu at the first
  item, Up opens it at the last.
- Inside a menu: Up/Down, Home/End and first-letter typeahead; Enter/Space
  activates; Escape closes and returns focus to the trigger; Tab closes.
- Checkable items announce their state (`aria-checked`).

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `dropdown` component.
