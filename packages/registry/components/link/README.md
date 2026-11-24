# Link

Text links in default, muted and plain styles, with a clear marker for links that open in a new tab.

## Usage

Use `bootcn-link` for links in text, `--muted` for secondary links (footers,
legal), `--plain` for lists of links. For links that open a new tab, add
`target="_blank" rel="noopener"`, the icon and the hidden "(opens in a new tab)"
text.

## Accessibility

- Links in text are underlined, so they do not rely on color (WCAG 1.4.1).
- A new-tab link says so to screen readers and shows an icon to everyone.
- Focus shows the same ring as buttons.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
