# Listbox

A list of options to pick one or several from, with keyboard navigation, typeahead and form values.

## Usage

Use a listbox when the options should stay visible (settings, a short list of
choices with descriptions). For a long list, or one to search, use the
Combobox; for a simple dropdown, the native Select.

## JavaScript API

- A focusable `role="listbox"` with `data-bootcn-listbox`, labelled by a visible
  label; `aria-multiselectable="true"` for several choices.
- Options: `role="option"`, an `id`, `data-value` and `aria-selected`.
- `data-bootcn-listbox-name` creates hidden inputs for forms (`name` or
  `name[]`).
- Event `bootcn:listbox:change` (bubbles), `detail.value` (array).
- `Bootcn.listbox.init(root)` / `destroy()`.

## Accessibility

- WAI-ARIA listbox: one tab stop; Up/Down, Home/End and first-letter
  typeahead move the active option (`aria-activedescendant`); Space or Enter
  selects (toggles in multiple mode).
- Selected options have `aria-selected="true"` and a check mark.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `label` component.
