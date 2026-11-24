# Badge

A small status label built on Bootstrap's `.badge`.

## Usage

```html
<span class="badge bootcn-badge bootcn-badge--default">Default</span>
<span class="badge bootcn-badge bootcn-badge--secondary">Secondary</span>
<span class="badge bootcn-badge bootcn-badge--outline">Outline</span>
<span class="badge bootcn-badge bootcn-badge--destructive">Destructive</span>
```

## Variants

- `bootcn-badge--default` — primary emphasis (default).
- `bootcn-badge--secondary` — neutral.
- `bootcn-badge--outline` — transparent with a border.
- `bootcn-badge--destructive` — danger emphasis.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css` (shared design tokens).

No JavaScript.

## Accessibility

- Badges are decorative or supplementary; the text inside is read inline. If a
  badge conveys state that is not otherwise described, include that information
  in the surrounding text or on the related control.
- Colors use Bootstrap's subtle/emphasis tokens, which have sufficient contrast
  in light and dark mode.
- Motion is disabled when the user prefers reduced motion.
