# Image

An image that fades in once loaded over a placeholder, shows its description if it fails, and can zoom on hover.

## Usage

Always give `width` and `height` (or an `aspect-ratio`) so the layout does
not jump, and `loading="lazy"` below the fold. Without JavaScript it is a
plain image in a rounded frame.

## JavaScript API

- `data-bootcn-image` on the `<figure>` around an `<img>` with `alt`,
  `width` and `height` (so the space is kept while it loads).
- While loading, the figure has `is-loading` (a shimmer, still without
  motion under reduced motion); then the image fades in.
- If it fails, the image is replaced by a box with its `alt` text and
  `bootcn:image:error` fires.
- `bootcn-image--zoom` zooms slightly on hover.
- `Bootcn.image.setup(figure)` for images added later; `init()`.

## Accessibility

- The image keeps its `alt`; a failed image shows the same text and is
  exposed as an image with that name.
- Zoom and the shimmer stop with `prefers-reduced-motion`.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
