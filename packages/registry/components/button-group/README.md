# Button group

Joins related buttons into one control, horizontally or vertically.

## Usage

Wrap buttons in Bootstrap's `.btn-group` (or `.btn-group-vertical`) with
`role="group"` and an `aria-label` that names the set.

## Accessibility

- `role="group"` and a label tell screen readers the buttons belong together.
- Each button keeps its own name; tab order follows the visual order.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button` component.
