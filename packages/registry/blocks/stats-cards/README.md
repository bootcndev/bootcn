# Stats cards

A responsive row of metric cards with a value, an icon and the change since the last period.

## Usage

Replace the labels, values and changes with your data. Add or remove
`bootcn-stats__card` articles; the grid fits as many as the width allows.

Format numbers on the server for the user's locale. Values use tabular
figures so columns of numbers line up.

## Accessibility

- A visually hidden `<h2>` names the group; each card has an `<h3>` label, so
  screen-reader users can jump between metrics.
- The change is text (`+20.1%`, `−4.3%`), not colour alone; the arrow icons are
  decorative.
- Up and down use Bootstrap's `*-text-emphasis` colours, which keep 4.5:1
  contrast in both themes.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
