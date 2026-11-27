---
description: 'Dark mode for Bootcn components with Bootstrap 5.3 color modes: data-bs-theme, the system preference and a theme toggle.'
---

# Dark mode

Bootcn uses [Bootstrap's own color modes](https://getbootstrap.com/docs/5.3/customize/color-modes/): set `data-bs-theme="dark"` on `<html>`
(or on any element) and every component switches, because their colors are
tokens with a light and a dark value.

```html
<html lang="en" data-bs-theme="dark"></html>
```

## Follow the system, remember the choice

Set the theme before the page paints, so it never flashes the wrong colors.
This snippet uses the visitor's saved choice, or else their system setting:

```html
<script>
  (function () {
    var theme = null;
    try {
      theme = localStorage.getItem('bootcn-theme');
    } catch (error) {}
    if (theme !== 'dark' && theme !== 'light') {
      theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-bs-theme', theme);
  })();
</script>
```

Put it in `<head>`, before the stylesheets. The
[admin dashboard](../templates/admin-dashboard) and
[analytics dashboard](../templates/analytics-dashboard) templates include it,
with a toggle button that saves the choice.

## A toggle button

A theme toggle is a button with `aria-pressed`, named for what it turns on:

```html
<button
  type="button"
  class="btn bootcn-button bootcn-button--ghost bootcn-button--icon"
  aria-pressed="false"
>
  <span class="visually-hidden">Dark mode</span>
  <!-- moon / sun icons, aria-hidden -->
</button>
```

On click, flip `data-bs-theme`, store the value under `bootcn-theme` and update
`aria-pressed`.

## Dark sections

`data-bs-theme` works on any element, so a light page can hold a dark panel:

```html
<section data-bs-theme="dark" class="p-4 rounded" style="background: var(--bs-body-bg)">…</section>
```

## Contrast

The dark palette is checked like the light one: body and muted text keep
4.5:1, chart colors and focus rings 3:1. If you change colors with the
[theme builder](../themes/) or by hand, check the pairs you change.
