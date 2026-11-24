# Date range input

A start and an end date typed in one segmented field, with a check that the end is not before the start.

## Usage

Each part posts its own field (`check_in`, `check_out`) with an ISO date.
Check the order on the server too. For picking a range on a calendar,
use the Date range picker; this field is for typing.

## JavaScript API

- `data-bootcn-date-range-input` on a `role="group"` labelled by its title,
  holding two Date input parts (`data-bootcn-date-input`, each with a
  visually hidden label such as "Check-in" and its own native input and
  `name`), an error element `.bootcn-date-range-input__error` and a status
  region `data-bootcn-date-range-input-status`.
- When the end date is before the start date, the segments are marked
  `aria-invalid` and `data-error` is shown. A valid range announces its
  length ("4 days selected.").
- Typing a complete start date moves on to the end date, and ←/→ cross from
  one date to the other (Date input 1.2.0 or newer).
- Event `bootcn:date-range-input:change` (bubbles),
  `detail: { start, end, valid }`.
- `Bootcn.dateRangeInput.init()` / `destroy()`; the parts are Date inputs
  (`Bootcn.dateInput.setValue`).

## Accessibility

- One labelled group, with each date its own group of spinbuttons named by
  its hidden label ("Check-in", "Check-out"); screen readers hear "Stay,
  Check-in, day 18".
- The order error is text linked to the group with `aria-describedby`, and
  the chosen length is announced politely.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `date-input` component.
- The `label` component.
