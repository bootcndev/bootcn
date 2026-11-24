# Separator

A visual divider between content. Horizontal separators use `<hr>`, which is
already announced as a separator; vertical and labeled separators use
`role="separator"`.

## Usage

```html
<hr class="bootcn-separator" />

<div class="d-flex align-items-center">
  <span>Docs</span>
  <div
    class="bootcn-separator bootcn-separator--vertical"
    role="separator"
    aria-orientation="vertical"
  ></div>
  <span>Blog</span>
</div>

<div class="bootcn-separator-label" role="separator" aria-label="or continue with">
  <span class="bootcn-separator-label__text" aria-hidden="true">or continue with</span>
</div>
```

A vertical separator stretches to the height of its flex container; give the
container a height or let its content define it.

## Customizing

| Variable                     | Default                      |
| ---------------------------- | ---------------------------- |
| `--bootcn-separator-spacing` | `1rem` (margin around it)    |
| `--bootcn-separator-color`   | `var(--bootcn-border-color)` |

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.

No JavaScript.

## Accessibility

- Purely decorative dividers can use `<div class="bootcn-separator" aria-hidden="true">`
  instead of `<hr>`.
- The labeled separator exposes its text through `aria-label`; the visible text
  is hidden from assistive technology to avoid reading it twice.
