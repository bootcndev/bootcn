# Toggle group

A set of toggles: several independent ones, or one choice from a set, built on native inputs.

## Usage

For independent options (bold, italic), use checkboxes in a
`<div role="group" aria-label="…">`. For one choice from a set (alignment), use
radio buttons with the same `name` in a `<fieldset>` with a legend. Both use
the Toggle component's labels.

## Accessibility

- Checkbox groups are announced as a named group; radio groups by their legend.
- In a radio group, arrow keys move the choice, as in any native radio group.
- Icon-only toggles have visually hidden names.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `toggle` component.
