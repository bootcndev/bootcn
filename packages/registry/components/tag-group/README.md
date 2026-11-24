# Tag group

A list of tags (chips) that can be removed, or a set of selectable tags built on native checkboxes.

## Usage

Use removable tags for values the user added (skills, filters, recipients)
and selectable tags for choosing several options. To send removable tags with
a form, keep a hidden input per tag and remove it with the tag.

## JavaScript API

- Removable tags: `data-bootcn-tag-group` on the wrapper, a remove button
  (`.bootcn-tag__remove`, named "Remove …") in each tag. Click, Backspace or
  Delete removes it, focus moves to the next tag, and the live region marked
  `data-bootcn-tag-group-status` announces it.
- Event `bootcn:tag-group:remove` (bubbles), `detail.value`.
- Selectable tags need no script: `.btn-check` checkboxes in a `<fieldset>`.
- `Bootcn.tagGroup.init()` / `destroy()`.

## Accessibility

- Removable tags are a list labelled by its heading; each remove button names
  its tag, and focus never gets lost after a removal.
- Selectable tags are native checkboxes in a fieldset with a legend, so
  screen readers announce "checked" and the group name.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
