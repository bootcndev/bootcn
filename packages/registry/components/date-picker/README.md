# Date picker

A button that opens a calendar in a popover and shows the chosen date, with keyboard support and form value.

## Usage

Load `calendar.js` before `date-picker.js`. Set `data-value` on the calendar
to start with a date. For a quick native alternative, `<input type="date">`
with the Input component also works well.

## JavaScript API

- `data-bootcn-date-picker` on the wrapper (a Bootstrap `.dropdown`); the
  trigger opens the popover; inside is a Calendar component.
- The text marked `data-bootcn-date-picker-text` shows the chosen date (long
  format, page language) or its original placeholder.
- The form value is the calendar's hidden input (YYYY-MM-DD); listen for
  `bootcn:calendar:select` for changes.
- `Bootcn.datePicker.init(root)` / `destroy()`.

## Accessibility

- The trigger's name combines its label and the current date
  (`aria-labelledby`), for example "Delivery date, 24 November 2026".
- Opening moves focus to the selected day (or today); choosing a day closes
  the popover and returns focus to the trigger; Escape closes it too
  (Bootstrap).
- The popover is a labelled, non-modal dialog.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `calendar` component.
- The `button` component.
- The `label` component.
