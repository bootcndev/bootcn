# Gradient text

Text filled with a colour gradient, still or slowly moving, readable in light and dark and plain in high-contrast mode.

## Usage

Wrap a few words in `<span class="bootcn-gradient-text">`; add
`--animated` to let the colours slide. Set your own colours with
`--bootcn-gradient`. Use it for a few words of a heading, not for body
text.

## Accessibility

- The text stays real text, and every colour in the default gradients
  keeps 4.5:1 against the page in both themes (indigo 600, purple 600 and
  pink 700 on light; lighter shades on dark). Check your own colours.
- In Windows high-contrast mode it becomes plain text.
- Under `prefers-reduced-motion: reduce` the colours stand still.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
