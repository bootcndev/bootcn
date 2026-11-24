# Tooltip

Short text hints on hover and keyboard focus, built on Bootstrap's **Tooltip**
plugin. Bootstrap tooltips are opt-in and need JavaScript to create them;
`tooltip.js` does that for every `[data-bs-toggle="tooltip"]` and adds one
thing Bootstrap lacks: **Escape closes an open tooltip** (WCAG 1.4.13).

## Usage

```html
<button
  type="button"
  class="btn bootcn-button bootcn-button--outline"
  data-bs-toggle="tooltip"
  data-bs-title="Add to library"
  data-bs-custom-class="bootcn-tooltip"
>
  Hover or focus me
</button>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.9/dist/js/bootstrap.bundle.min.js"></script>
<script src="assets/js/tooltip.js"></script>
```

All of Bootstrap's `data-bs-*` tooltip options work (`placement`, `trigger`,
`delay`, …). `data-bs-custom-class="bootcn-tooltip"` applies the Bootcn style.

## JavaScript API

```js
window.Bootcn.tooltip.init(container); // create tooltips under container (idempotent)
window.Bootcn.tooltip.destroy(container); // dispose them
```

`init()` runs on page load for the whole document. Call it again with the new
container after inserting HTML.

## Dependencies

- Bootstrap 5.3+ CSS and **JavaScript bundle** (Tooltip + Popper). If the bundle
  is missing, `tooltip.js` logs one console error.
- `themes/tokens/tokens.css`, `button` (example triggers).

## Accessibility

- Put tooltips only on focusable elements, so keyboard users see them too.
- A tooltip supplements an accessible name; it does not replace it. Icon
  buttons still need `aria-label`.
- Bootstrap links the tooltip with `aria-describedby` while it is shown.
- Do not put interactive content in a tooltip; use a Popover instead.
