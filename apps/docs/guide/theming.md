# Theming and dark mode

`tokens.css` gives Bootstrap 5.3 a neutral, Tailwind-like look and defines the
`--bootcn-*` tokens every Bootcn component reads. Everything stays Bootstrap:
no Tailwind, no build step. Load it **after** Bootstrap's CSS and **before**
any component CSS.

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

## What it changes

- **Palette roles**, in light and dark mode, on a zinc scale:
  `--bootcn-background`, `--bootcn-foreground`, `--bootcn-primary` (near-black
  in light mode, near-white in dark mode) and `--bootcn-primary-foreground`,
  `--bootcn-secondary`, `--bootcn-muted`, `--bootcn-muted-foreground`,
  `--bootcn-accent`, `--bootcn-destructive`, `--bootcn-border-color`,
  `--bootcn-input` and `--bootcn-ring`.
- **Bootstrap's own variables** (`--bs-body-bg`, `--bs-body-color`,
  `--bs-secondary-color`, `--bs-border-color`, `--bs-primary`,
  `--bs-link-color`, `--bs-border-radius`…) point at those roles, so plain
  Bootstrap classes such as `.text-body-secondary`, `.border` or `.bg-primary`
  match the components.
- **Shape and type:** a system font stack, `rounded-md` corners (0.375rem),
  Tailwind's shadow scale (`--bootcn-shadow-sm` to `--bootcn-shadow-lg`),
  controls 2.25rem high with `text-sm`, and a focus ring offset from the
  element.

Muted text is `#6b6b73` rather than zinc-500, so it keeps 4.5:1 contrast on the
muted background as well as on white.

## Customizing

Override roles in your own stylesheet, loaded after `tokens.css`. For example,
a blue primary and rounder corners:

```css
:root,
[data-bs-theme='light'] {
  --bootcn-primary: #2563eb;
  --bootcn-primary-foreground: #fff;
  --bs-primary-rgb: 37, 99, 235;
  --bs-border-radius: 0.5rem;
}

[data-bs-theme='dark'] {
  --bootcn-primary: #3b82f6;
  --bootcn-primary-foreground: #fff;
  --bs-primary-rgb: 59, 130, 246;
}
```

Check the contrast of any pair you change (text on its background should be at
least 4.5:1).

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
