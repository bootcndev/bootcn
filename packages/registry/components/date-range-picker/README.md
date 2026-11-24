# Date range picker

A button that opens a range calendar and shows the chosen start and end dates.

## Usage

Load `calendar.js` before `date-range-picker.js`. The form submits the two
hidden inputs (YYYY-MM-DD). Set `data-start` and `data-end` on the calendar to
start with a range, and `data-min` / `data-max` to limit it.

## JavaScript API

- `data-bootcn-date-range-picker` on the wrapper; inside the popover is a
  Calendar in range mode (`data-mode="range"`, hidden inputs marked
  `data-bootcn-calendar-input="start"` and `"end"`).
- The trigger text shows the range (`Intl.DateTimeFormat.formatRange`, in the
  page language) once a start is chosen; the popover closes when the end is
  chosen.
- `Bootcn.dateRangePicker.init(root)` / `destroy()`.

## Accessibility

- The trigger's name is its label plus the current range ("Stay, 20 – 27 Jan
  2027").
- Inside the calendar, days in the range have `aria-selected="true"`; keys are
  the same as the Calendar's. Choosing the end closes the popover and returns
  focus to the trigger; Escape closes it too.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `calendar` component.
- The `button` component.
- The `label` component.
