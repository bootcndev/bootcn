# Context menu

A menu of actions for an element, opened with a right-click, Shift+F10 or the Menu key.

## Usage

Attach a menu to any focusable element (a file, a row, a card). Right-click
opens it at the pointer; Shift+F10 or the Menu key opens it under the element.
Offer the same actions somewhere visible too: touch devices and many users
never right-click.

## JavaScript API

- `data-bootcn-context-menu="<menu id>"` on the element that owns the menu.
- The menu is a `role="menu"` list of `role="menuitem"` buttons (with the
  Dropdown component's classes).
- Event `bootcn:context-menu:select` on the trigger (bubbles),
  `detail.value` and `detail.item`.
- `Bootcn.contextMenu.show(trigger, x, y)` / `hide(returnFocus)`;
  `init()` / `destroy()`.

## Accessibility

- The trigger is focusable and announces `aria-haspopup="menu"`; a visible
  hint (linked with `aria-describedby`) explains the keyboard shortcut.
- Inside the menu: Up/Down, Home/End and first-letter typeahead move focus;
  Enter activates; Escape or Tab closes and returns focus to the trigger.
- The menu stays inside the viewport and closes on scroll or resize.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `dropdown` component.
