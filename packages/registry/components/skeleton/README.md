# Skeleton

Placeholders that show the shape of content while it loads. Built on
Bootstrap's `.placeholder`, so Bootstrap's column classes (`col-6`, `w-50`) set
the width.

## Usage

```html
<div class="bootcn-skeleton-group" aria-busy="true" aria-live="polite">
  <span class="visually-hidden">Loading profile…</span>
  <div aria-hidden="true">
    <span class="placeholder bootcn-skeleton bootcn-skeleton--circle"></span>
    <span class="placeholder bootcn-skeleton bootcn-skeleton--text col-6"></span>
    <span class="placeholder bootcn-skeleton bootcn-skeleton--text col-4"></span>
  </div>
</div>
```

When the content arrives, replace the group, or remove `aria-busy` and the
placeholders.

## Shapes

- `bootcn-skeleton--text` — a line of text.
- `bootcn-skeleton--circle` — an avatar (`--bootcn-skeleton-size`, default `2.5rem`).
- `bootcn-skeleton--block` — an image or card area (8rem high; override with `style` or utilities).

## Customizing

| Variable                     | Default                  |
| ---------------------------- | ------------------------ |
| `--bootcn-skeleton-bg`       | `var(--bs-secondary-bg)` |
| `--bootcn-skeleton-duration` | `1.6s`                   |

## Dependencies

- Bootstrap 5.3+ CSS (`.placeholder`, `.visually-hidden`, column classes).
- `themes/tokens/tokens.css`.

No JavaScript.

## Accessibility

- Mark the loading region with `aria-busy="true"` and give it a visually hidden
  text such as "Loading profile…"; hide the placeholder shapes with
  `aria-hidden="true"`.
- The pulse animation stops when the user prefers reduced motion.
