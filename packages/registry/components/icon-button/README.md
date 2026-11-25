# Button with icons

Buttons with a leading or trailing icon, icon-only buttons in three sizes, an icon that becomes a spinner while loading, and a count badge.

## Usage

Put the icon before the text for an action (Download, Delete) and after it
for direction (Continue →); add `bootcn-rtl-flip` to directional icons. Icon-
only buttons need an `aria-label`. While loading, swap the icon for
`.bootcn-icon-button__spinner`, change the text and set `aria-busy="true"`.

## Accessibility

- Icons are hidden from screen readers; the text or `aria-label` names the
  button ("Notifications, 3 unread" includes the badge count).
- Icon-only sizes keep at least a 24 × 24 px target, and the round variant
  keeps the focus ring.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button` component.
