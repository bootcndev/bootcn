# Funnel

A conversion funnel as an ordered list: each step with its count, its share of the first step and of the previous one, and a bar.

## Usage

Compute the numbers on the server: each step's count, its share of the
first step (the `--bootcn-funnel-value` width and the text in brackets) and
of the previous step. The bars are decoration; the text carries the data.

## Accessibility

- An ordered list, so the steps are read in order with their position.
- Every value is text: count, share of the first step and conversion from
  the previous step. The bars are hidden from screen readers.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
