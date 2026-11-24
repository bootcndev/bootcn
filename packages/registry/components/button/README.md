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
