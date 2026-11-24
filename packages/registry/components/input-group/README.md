# Input group

An input with icons, text or buttons inside the same border, such as a search box or a URL field.

## Usage

Put the input (`.bootcn-input-group__input`) and its addons inside
`.bootcn-input-group`. Addons can hold an icon, text or a small button. The
group draws one border and one focus ring around everything.

Unlike Bootstrap's `.input-group`, the addons sit inside the field.

## Accessibility

- The input still needs its own `<label>`; addon text is not part of its name.
- An icon-only button inside the group needs visually hidden text.
- The focus ring appears on the whole group when the input is focused.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button` component.
- The `label` component.
