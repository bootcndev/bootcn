# App sidebar

A sidebar with grouped navigation, counts and the signed-in user; it becomes an off-canvas drawer below 992px.

## Usage

Place the sidebar and your main content side by side, for example:

```html
<div class="d-lg-flex min-vh-100">
  <!-- sidebar markup -->
  <main class="flex-grow-1 p-4">…</main>
</div>
```

Below 992px the sidebar is a Bootstrap off-canvas drawer opened by the "Menu"
button; move that button into your top bar (a `<header>`), so it sits inside
a landmark. Mark the current page with
`aria-current="page"`. The drawer needs the Bootstrap JS bundle.

## Accessibility

- The sidebar is an `<aside aria-label="Sidebar">` landmark with a
  `<nav aria-label="Main">` inside; each group of links is a list labelled by
  its heading.
- Unread counts carry visually hidden text ("4 unread").
- As a drawer, Bootstrap moves focus into it, traps it while open, and closes
  it on Escape; focus returns to the "Menu" button.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `button` component.
- The `badge` component.
- The `avatar` component.
