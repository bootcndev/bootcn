# Button

A flexible button built on Bootstrap's `.btn`. Works with both `<button>` and
`<a>` elements.

## Usage

```html
<button type="button" class="btn bootcn-button bootcn-button--default">Default</button>
<button type="button" class="btn bootcn-button bootcn-button--outline">Outline</button>
<button type="button" class="btn bootcn-button bootcn-button--destructive">Delete</button>
```

## Variants

- `bootcn-button--default` — primary action.
- `bootcn-button--secondary` — neutral action.
- `bootcn-button--outline` — transparent with a border.
- `bootcn-button--ghost` — transparent until hovered.
- `bootcn-button--link` — looks like a link.
- `bootcn-button--destructive` — dangerous action.

## Sizes

- `bootcn-button--sm` — small.
- `bootcn-button--lg` — large.
- `bootcn-button--icon` — square icon button; always pair with an accessible
  name (e.g. `aria-label`).

## Loading state

Set `aria-busy="true"`, disable the button, and add a spinner element:

```html
<button type="button" class="btn bootcn-button bootcn-button--default" aria-busy="true" disabled>
  <span class="bootcn-button__spinner" aria-hidden="true"></span>
  <span>Saving</span>
</button>
```

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css` (shared design tokens).

No JavaScript.

## Accessibility

- Icon-only buttons must have an accessible name (`aria-label` or visually
  hidden text); the icon itself is `aria-hidden="true"`.
- The focus ring uses the shared focus token and is visible on keyboard focus.
- For `<a>` elements used as buttons, add `role="button"` when the link does not
  navigate, and keep the loading pattern to `<button>` where `disabled` applies.
- Spinner animation is disabled under `prefers-reduced-motion: reduce`.

## Customizing

Variants set Bootstrap's own `--bs-btn-*` variables on the element, so
Bootstrap's hover, focus, active, open (`.show`) and disabled rules keep the
variant's colors. To make a custom variant, set the same variables:

```css
.bootcn-button--brand {
  --bs-btn-color: #fff;
  --bs-btn-bg: #6f42c1;
  --bs-btn-border-color: #6f42c1;
  --bs-btn-hover-color: #fff;
  --bs-btn-hover-bg: #5a32a3;
  --bs-btn-hover-border-color: #5a32a3;
  --bs-btn-active-color: #fff;
  --bs-btn-active-bg: #4c2a8a;
  --bs-btn-active-border-color: #4c2a8a;
  --bs-btn-disabled-color: #fff;
  --bs-btn-disabled-bg: #6f42c1;
  --bs-btn-disabled-border-color: #6f42c1;
}
```
