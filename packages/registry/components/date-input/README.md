# Date input

A segmented date, time or date-time field: day, month, year, hour and minute are separate spinbuttons, ordered for the locale, typed or changed with the arrow keys.

## Usage

Without JavaScript, and on phones, people get the browser's own date
and time input, which submits the same ISO value. Validate the value on the
server; the hidden field is not checked by the browser's `required`.

## JavaScript API

- Start from a native input: `<input type="date">`, `type="time"` or
  `type="datetime-local"` with `data-bootcn-date-input-native`, inside a
  wrapper with `data-bootcn-date-input` and its `<label for>`. `value`,
  `min`, `max` and `step` (seconds; 900 = 15-minute steps) are read from it.
- The script replaces the input with a `role="group"` of spinbuttons (day,
  month, year, hour, minute, and AM/PM on 12-hour clocks), in the order and
  with the separators of the locale: `data-locale="en-GB"` on the wrapper,
  else `<html lang>`, else the browser's language. The input becomes a
  hidden field that keeps its `name` and holds the ISO value (`2026-11-24`,
  `09:30`, `2026-11-24T09:30`), or `''` until every segment is filled.
- Keys: ↑/↓ change a segment (wrapping), Page Up/Down by larger steps,
  Home/End to its limits, digits type a value and move on when it is
  complete, Backspace clears, ←/→ move between segments (swapped right to
  left), A/P choose AM or PM.
- A value outside `min`/`max` marks the segments `aria-invalid` and shows
  `data-error` (or "Choose a value in range.").
- Events: `change` on the hidden input and `bootcn:date-input:change`
  (`detail.value`).
- On touch screens the native input stays (its picker is better there); add
  `data-touch` to the wrapper to segment it anyway.
- `Bootcn.dateInput.setValue(root, iso)`, `setup(root)`, `init()` /
  `destroy()`.

## Accessibility

- Follows the date field pattern of React Aria and HeroUI: a labelled group
  of `role="spinbutton"` segments, each with its name ("day"), limits and
  value text (months read with their name: "11 – November"). Empty segments
  read "Empty".
- Every segment is a tab stop, and the label focuses the first empty one.
- The order of the segments follows the locale, so "05/17/1990" and
  "17/05/1990" read naturally for their readers.
- Out-of-range values are announced through the error text linked with
  `aria-describedby`, not only shown in red.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `field` component.
- The `label` component.
- The `input` component.
