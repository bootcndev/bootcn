# Scroll area

A scrollable region with thin, theme-aware scrollbars that keyboard users can reach and scroll.

## Usage

Give the area a height (or max-height) and put any content inside. For a
horizontal strip, give it a width and let the content be wider.

## Accessibility

- `tabindex="0"` lets keyboard users focus the area and scroll it with the
  arrow keys; a `<section>` with `aria-label` makes it a named region.
- Scrollbars stay visible and use theme colors in both modes.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
