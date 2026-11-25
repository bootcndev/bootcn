# Rating

Star ratings: a display that fills to any value (4.6 shows six tenths of a star) with the review count, and a rating input made of five native radio buttons.

## Usage

**Display**: set the fill as a percentage of five stars,
`style="--bootcn-rating-value: 92%"` for 4.6, and say it in words with
`role="img"` and `aria-label="Rated 4.6 out of 5, 214 reviews"`. Sizes:
`bootcn-rating--sm`, `--md`, `--lg`; the colour is `--bootcn-rating-color`.

**Input**: a fieldset with five radio buttons (`value` 1 to 5) and their
labels; the stars light up to the checked one and to the one under the
pointer. It submits like any radio group. No JavaScript.

## Accessibility

- The display is one image with the rating in words; the stars themselves
  are hidden from screen readers.
- The input is a native radio group in a fieldset with a legend: arrow keys
  change the rating, each star is named ("4 stars"), and the focus ring
  shows on the star.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
