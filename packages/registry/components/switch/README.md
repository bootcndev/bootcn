# Switch

An on/off toggle built on Bootstrap's `.form-switch`. It is a native checkbox,
so it submits with forms and works without JavaScript.

## Usage

```html
<div class="form-check form-switch bootcn-switch">
  <input
    class="form-check-input bootcn-switch__input"
    type="checkbox"
    role="switch"
    id="wifi"
    name="wifi"
    checked
  />
  <label class="form-check-label bootcn-switch__label" for="wifi">Wi-Fi</label>
</div>
```

Add a `.bootcn-switch__description` (referenced with `aria-describedby`) for
helper text, and `bootcn-switch--lg` for a larger switch.

## Customizing

| Variable                 | Default   |
| ------------------------ | --------- |
| `--bootcn-switch-width`  | `2.25rem` |
| `--bootcn-switch-height` | `1.25rem` |
| `--bootcn-switch-gap`    | `0.75rem` |

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.

No JavaScript.

## Accessibility

- `role="switch"` makes screen readers announce "on/off" instead of
  "checked/not checked".
- Use a switch for settings that apply immediately; use a checkbox for choices
  submitted with a form.
- The thumb animation is disabled under `prefers-reduced-motion`.
