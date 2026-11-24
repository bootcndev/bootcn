# Spinner

A loading indicator built on Bootstrap's `.spinner-border`.

## Usage

```html
<div class="spinner-border bootcn-spinner" role="status">
  <span class="visually-hidden">Loading…</span>
</div>

<!-- Next to visible text: hide the spinner, announce the text -->
<div class="d-flex align-items-center gap-2" role="status">
  <span class="spinner-border bootcn-spinner bootcn-spinner--sm" aria-hidden="true"></span>
  <span>Syncing your files…</span>
</div>
```

For a spinner inside a button, use the Button component's loading state.

## Modifiers

- `bootcn-spinner--sm`, `bootcn-spinner--lg` — sizes (1rem, 1.5rem default, 2.5rem).
- `bootcn-spinner--muted` — secondary text color. Any `text-*` utility also works.

Sizes are set through Bootstrap's own `--bs-spinner-*` variables on the
`bootcn-spinner` element only.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.

No JavaScript.

## Accessibility

- Use `role="status"` so the loading message is announced, and always include
  text (visible or `.visually-hidden`).
- Bootstrap slows the spin when the user prefers reduced motion; the spinner
  keeps moving slowly because it signals ongoing activity.
