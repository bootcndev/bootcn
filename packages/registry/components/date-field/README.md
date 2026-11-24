# Date and time fields

Native date, time and date-time inputs styled to match, with the browser picker in the right theme.

## Usage

These are the browser's own date and time inputs: they localize the format,
work on every phone and submit ISO values (`2026-11-24`, `09:30`). Use `min`,
`max` and `step` to limit them. For a calendar in a popover, use the Date
picker or Date range picker.

## Accessibility

- Native inputs: every browser and screen reader supports them, including the
  picker.
- Each has a visible label; the dark theme switches the picker to dark too.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `label` component.
- The `input` component.
