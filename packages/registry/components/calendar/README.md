# Calendar

A month grid for picking a date, with full keyboard navigation, localized names and optional limits.

## Usage

The script draws the month grid; the markup only holds the header (with the
month as text, which the script keeps up to date), an empty table and the
hidden input. Month and weekday names come from the browser's
`Intl` API in the page's language. For a date inside a form field, use the
Date picker.

## JavaScript API

- `data-bootcn-calendar` on the wrapper. Options: `data-value`
  (YYYY-MM-DD, the selected date), `data-min` / `data-max`, `data-week-start`
  (0 = Sunday … 6; default 1, Monday) and `data-locale` (default: the nearest
  `lang` attribute).
- The hidden input marked `data-bootcn-calendar-input` gets the value
  (YYYY-MM-DD) for forms.
- Event `bootcn:calendar:select` (bubbles), `detail.value` and
  `detail.date`.
- `Bootcn.calendar.setValue(root, 'YYYY-MM-DD')`, `focus(root)`,
  `init(root)` / `destroy(root)`.

## Accessibility

- WAI-ARIA date grid: one tab stop (the focused day); Arrow keys move by a
  day or a week, Home/End to the start or end of the week, Page Up/Down by a
  month (with Shift by a year), Enter or Space selects.
- Each day is a button named with the full date ("Tuesday, 24 November
  2026"); the selected day's cell has `aria-selected`, today has
  `aria-current="date"`; dates outside the limits are disabled.
- The month title is a polite live region, so changing month is announced.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
