# Booking

Book an appointment: a calendar for the day, a grid of available times and a summary with the confirm button.

## Usage

The calendar sets the hidden `date` field and the radio buttons the `time`
field, so the form posts both (`date=2026-11-26&time=10:00`). Render the
available times for the chosen day on the server, mark taken ones
`disabled`, and check the slot again when the form is submitted.
`booking.js` keeps the summary line in sync.

## Accessibility

- The calendar is a keyboard grid (arrow keys, Page Up/Down); the times are
  native radio buttons in a fieldset with a legend, so arrow keys move
  between them and taken slots are skipped.
- Taken slots are disabled and struck through, not only greyed out.
- The summary is a polite live region that repeats the choice in words.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `calendar` component.
- The `card` component.
- The `button` component.
