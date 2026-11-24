# Avatar

A circular user image with an initials fallback, three sizes, a square variant
and an overlapping group.

## Usage

```html
<!-- Image -->
<span class="bootcn-avatar">
  <img class="bootcn-avatar__image" src="/img/maria.jpg" alt="Maria Papadopoulou" />
</span>

<!-- Initials when there is no image -->
<span class="bootcn-avatar" role="img" aria-label="Nikos Georgiou">
  <span class="bootcn-avatar__fallback" aria-hidden="true">NG</span>
</span>

<!-- Group -->
<div class="bootcn-avatar-group" role="group" aria-label="Project members">
  <span class="bootcn-avatar">...</span>
  <span class="bootcn-avatar">...</span>
</div>
```

In PHP, choose between the image and the initials on the server, for example
`<?php if ($user->photo): ?> ... <?php else: ?> ... <?php endif; ?>`. The
component has no JavaScript, so it does not swap a broken image for initials.

## Modifiers

- `bootcn-avatar--sm`, `bootcn-avatar--lg` — sizes.
- `bootcn-avatar--square` — rounded square instead of a circle.

## Customizing

| Variable                        | Default                    |
| ------------------------------- | -------------------------- |
| `--bootcn-avatar-size`          | `2.5rem`                   |
| `--bootcn-avatar-radius`        | `50%`                      |
| `--bootcn-avatar-bg`            | `var(--bs-secondary-bg)`   |
| `--bootcn-avatar-color`         | `var(--bs-emphasis-color)` |
| `--bootcn-avatar-group-overlap` | `-0.5rem`                 |

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.

No JavaScript.

## Accessibility

- Give every image a meaningful `alt` (usually the person's name), or `alt=""`
  when the name is already next to the avatar.
- Initials avatars use `role="img"` with an `aria-label`; the initials
  themselves are hidden from assistive technology.
- Label avatar groups with `role="group"` and `aria-label`.
