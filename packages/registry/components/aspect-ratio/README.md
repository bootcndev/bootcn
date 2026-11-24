# Aspect ratio

Keeps media at a fixed width-to-height ratio, cropping images to fill.

## Usage

Set the ratio with `--bootcn-aspect-ratio` (for example `1 / 1` or `4 / 3`).
Images and videos inside are cropped to fill (`object-fit: cover`). For
embeds you can also use Bootstrap's `.ratio` classes.

## Accessibility

- Give images a meaningful `alt`, or `alt=""` when they are decorative.
- Embedded iframes need a `title`.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
