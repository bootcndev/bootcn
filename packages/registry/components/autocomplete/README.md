# Autocomplete

A text input that suggests values as you type, from the page or from your server, and still accepts any text.

## Usage

Use Autocomplete when any text is allowed and suggestions only help
(cities, tags, search). When the value must be one of the options, use
Combobox instead.

A PHP endpoint for remote suggestions:

```php
<?php
header('Content-Type: application/json');
$q = mb_strtolower($_GET['q'] ?? '');
$matches = array_values(array_filter($cities, fn ($c) => str_contains(mb_strtolower($c), $q)));
echo json_encode(array_slice($matches, 0, 20));
```

## JavaScript API

- `data-bootcn-autocomplete` on the wrapper, an `<input role="combobox"
aria-autocomplete="list">` and a `role="listbox"` list of
  `role="option"` items (optional `data-value`; the text is the label).
- Typing filters the suggestions (case-insensitive, anywhere in the label)
  and marks the match. ↓/↑ move through them, Enter picks one, Escape closes
  the list and then clears the input, Alt + ↓ opens it.
- The input keeps any text: it is a normal text field for the form.
- Remote suggestions: `data-bootcn-autocomplete-url="/cities.php?q="` on
  the wrapper. The query is appended (encoded) 200 ms after typing stops;
  the response is a JSON array of strings or `{ value, label }` objects.
  Older requests are cancelled.
- Event `bootcn:autocomplete:select` (bubbles), `detail: { value, label }`;
  the input also fires `change`.
- `Bootcn.autocomplete.close(root)`; `init()` / `destroy()`.

## Accessibility

- Follows the WAI-ARIA combobox pattern with list autocomplete: the input
  owns the listbox (`aria-controls`), `aria-expanded` follows the list and
  `aria-activedescendant` points to the highlighted suggestion.
- The number of suggestions is announced in a live region.
- Matches are marked with `<mark>` and bold text, not colour alone.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `label` component.
