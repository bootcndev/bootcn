# Command

A fast, searchable list of actions: inline, or as a Ctrl/⌘ K command palette in a dialog.

## Usage

Group related commands under headings. Typing filters every group (by the
item text and `data-keywords`); empty groups and their separators hide. The
dialog version needs the Bootstrap JS bundle; the inline one works without it.

## JavaScript API

- `data-bootcn-command` on the wrapper. Items are `role="option"` elements
  with `data-value`; optional `data-href` (go to a page) and `data-keywords`
  (extra search words).
- Event `bootcn:command:select` (bubbles), `detail.value` and `detail.item`.
- For a palette, put the command in a Bootstrap modal with
  `data-bootcn-command-shortcut="k"`: Ctrl+K / ⌘K toggles it, and the search
  is cleared and focused each time it opens.
- `Bootcn.command.init(root)` / `destroy(root)`.

## Accessibility

- The search is a combobox that controls the listbox; arrow keys move the
  active item (`aria-activedescendant`), Home/End jump, Enter runs it.
- Groups are labelled by their headings; the result count is announced.
- Shortcut hints are hidden from screen readers (they are not real key
  bindings unless you add them).

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `kbd` component.
- The `button` component.
