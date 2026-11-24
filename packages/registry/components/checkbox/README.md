# Checkbox

A checkbox built on Bootstrap's `.form-check`, with an optional description
and error message aligned under the label.

## Usage

```html
<div class="form-check bootcn-checkbox">
  <input
    class="form-check-input bootcn-checkbox__input"
    type="checkbox"
    id="news"
    name="newsletter"
    aria-describedby="news-description"
  />
  <label class="form-check-label bootcn-checkbox__label" for="news">Product updates</label>
  <p class="bootcn-checkbox__description" id="news-description">One email a month.</p>
</div>
```

## States

- Checked / disabled / required: native attributes.
- Invalid: `aria-invalid="true"` and a `.bootcn-checkbox__error` element
  referenced from `aria-describedby`.
- Indeterminate: set `input.indeterminate = true` from your own script; there is
  no HTML attribute for it. Bootstrap styles the state.

## Customizing

| Variable                 | Default    |
| ------------------------ | ---------- |
| `--bootcn-checkbox-size` | `1.125rem` |
| `--bootcn-checkbox-gap`  | `0.625rem` |

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.

No JavaScript.

## Accessibility

- The whole label is clickable because it uses `<label for>`.
- Group related checkboxes in a `<fieldset>` with a `<legend>`.
- Use `aria-describedby` for descriptions and errors, and `aria-invalid` only
  while the field is invalid.
