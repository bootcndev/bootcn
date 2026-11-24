# Combobox

A searchable select: type to filter a list, pick one option or several (shown as chips), fully keyboard accessible.

## Usage

Type to filter the options; matching ignores case and accents. With one
choice the input shows the chosen label; with several, each choice is a chip
with a remove button and Backspace removes the last one. Render the options on
the server; for very long lists, filter on the server and replace the options.

## JavaScript API

- `data-bootcn-combobox` on the wrapper; `data-bootcn-combobox-name` is the
  form field name; `data-bootcn-combobox-multiple` allows several choices.
- Options are `role="option"` elements with `data-value`; mark initial choices
  with `aria-selected="true"`.
- Single choice writes its value to the hidden input marked
  `data-bootcn-combobox-value`; multiple choice creates hidden inputs named
  `<name>[]`.
- Event `bootcn:combobox:change` (bubbles), `detail.value`: a string, or an
  array for multiple choice.
- `Bootcn.combobox.init(root)` / `destroy(root)`.

## Accessibility

- WAI-ARIA combobox with a listbox popup: `aria-expanded`, `aria-controls`
  and `aria-activedescendant`, so focus stays in the input while arrow keys
  move through the options.
- Keys: Down/Up move (and open), Alt+Down opens, Alt+Up closes, Home/End,
  Enter chooses, Escape closes (a second Escape clears the text).
- The number of results and each added or removed choice are announced in a
  polite live region.
- Chip remove buttons have names ("Remove Astro").

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `label` component.
