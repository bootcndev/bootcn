# Search field

A search input with an icon and a clear button that appears when there is text; Escape clears it too.

## Usage

Wrap it in a `<form role="search">` with a name, so it is a search landmark,
and keep a submit button (it can be visually hidden) so Enter submits.

## JavaScript API

- `data-bootcn-search-field` on the wrapper. The clear button shows when the
  input has text; clearing (button or Escape) empties it, fires `input`,
  returns focus to the input and emits `bootcn:search-field:clear`.
- `Bootcn.searchField.init(root)` / `destroy()`.

## Accessibility

- A native `type="search"` input with a visible label inside a named search
  landmark.
- The clear button is named "Clear search" and returns focus to the input;
  Escape does the same from the keyboard.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `label` component.
