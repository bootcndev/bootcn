# Meter

A gauge for a value within a known range, colored good, average or poor on the native meter element.

## Usage

Use a meter for a measurement in a range (disk, battery, a score). For the
progress of a task, use Progress. Set `low`, `high` and `optimum`: the browser
then colors the bar good, average or poor.

## Accessibility

- Native `<meter>` with a `<label>`: screen readers announce the value.
- The visible number is hidden from screen readers so it is not read twice.
- Colors have 3:1 contrast against the background; the number states the
  value in text.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
