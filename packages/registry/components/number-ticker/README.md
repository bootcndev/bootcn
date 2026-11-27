# Number ticker

Numbers that count up when they scroll into view, formatted for the page language, with the final value always in the page.

## Usage

`<span data-bootcn-ticker data-value="12400">12,400</span>`: write the
final number as the text too, so the page reads right without the script.
When the number scrolls into view it counts up from `data-from` (0) over
`data-duration` milliseconds (1600), easing out.

Options: `data-decimals`, `data-prefix` / `data-suffix` (`+`, `%`, `M`),
`data-locale` (else the page's `lang`; numbers are formatted with
`Intl.NumberFormat`). `bootcn:ticker:done` fires at the end.
`.bootcn-ticker-stats` is a ready grid of labelled stats (a `<dl>`).

`Bootcn.ticker.setup(element)` for numbers added later, `run(element)` to
start one now.

## Accessibility

- Screen readers get the final number once, from hidden text; the
  counting copy is hidden from them, so they never hear the digits change.
- Under `prefers-reduced-motion: reduce` the number appears without
  counting.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
