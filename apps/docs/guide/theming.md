# Theming and dark mode

`tokens.css` defines the shared `--bootcn-*` custom properties every Bootcn
component reads: radius, borders, shadows, focus ring, motion and component
dimensions. Load it **after** Bootstrap's CSS and **before** any component CSS.

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.9/dist/css/bootstrap.min.css"
/>
<link rel="stylesheet" href="assets/css/tokens.css" />
<link rel="stylesheet" href="assets/css/button.css" />
```

The CLI installs this item automatically the first time you run `bootcn init`
or `bootcn add`.

## Customizing

Override any token in your own stylesheet, loaded after `tokens.css`:

```css
:root {
  --bootcn-radius: 0.25rem;
  --bootcn-transition-duration: 100ms;
}
```

Tokens build on Bootstrap's `--bs-*` variables where possible, so changing the
Bootstrap theme also changes Bootcn components.

## Dark mode

Dark values live under `[data-bs-theme='dark']`. Set `data-bs-theme="dark"` on
`<html>` (or on any container) as you would for Bootstrap itself.

## Reduced motion

Under `prefers-reduced-motion: reduce`, `--bootcn-transition-duration` becomes
`0ms`.

## Per-component variables

Many components also expose their own variables, such as
`--bootcn-avatar-size`. Components built on Bootstrap plugins (buttons,
dropdowns, tabs…) are styled through Bootstrap's `--bs-*` variables set on the
`bootcn-` class, so Bootstrap's own states keep working. Each component page
lists its variables under **Customizing**.
