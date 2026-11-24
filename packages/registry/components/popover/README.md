# Popover

A small overlay with a title and text, opened by clicking a trigger. Built on
Bootstrap's **Popover** plugin. `popover.js` creates the popovers for every
`[data-bs-toggle="popover"]` (Bootstrap requires opt-in initialization) and
lets **Escape** close them.

## Usage

```html
<button
  type="button"
  class="btn bootcn-button bootcn-button--outline"
  data-bs-toggle="popover"
  data-bs-title="Storage"
  data-bs-content="You are using 7.2 GB of your 10 GB plan."
  data-bs-custom-class="bootcn-popover"
>
  Show usage
</button>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.9/dist/js/bootstrap.bundle.min.js"></script>
<script src="assets/js/popover.js"></script>
```

- `data-bs-trigger="focus"` closes the popover on the next click anywhere (use
  a `<button>` trigger).
- Content is text. Bootstrap's `html` option is off by default; if you enable it,
  only pass trusted, sanitized HTML.

## JavaScript API

```js
window.Bootcn.popover.init(container); // idempotent
window.Bootcn.popover.destroy(container);
```

## Dependencies

- Bootstrap 5.3+ CSS and **JavaScript bundle** (Popover + Popper).
- `themes/tokens/tokens.css`, `button` (example triggers).

## Accessibility

- Triggers are buttons; Bootstrap sets `aria-describedby` to the open popover.
- Escape closes the popover and focus stays on the trigger.
- Popovers are not modal and do not trap focus. For forms or complex content,
  use the Dialog component.
- Bootstrap renders the popover title as an `<h3>`. Use popovers with a title
  on pages that already have an `<h2>`, or set Bootstrap's `template` option to
  a different heading level, so heading levels do not skip.
