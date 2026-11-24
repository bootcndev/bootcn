# Textarea

A multi-line text field built on Bootstrap's `.form-control`.

## Usage

```html
<div class="bootcn-field">
  <label for="bio" class="form-label bootcn-field__label">Bio</label>
  <textarea
    class="form-control bootcn-textarea"
    id="bio"
    name="bio"
    rows="3"
    aria-describedby="bio-help"
  ></textarea>
  <p class="bootcn-field__help" id="bio-help">Up to 280 characters.</p>
</div>
```

The `bootcn-field`, `bootcn-field__label` and `bootcn-field__help` classes come
from the Input component's stylesheet. Install `input` too (it is a registry
dependency) or replace them with Bootstrap's `mb-3`/`form-text`.

## Modifiers and states

- `bootcn-textarea--autosize` — grows with its content (up to 20rem) in
  browsers that support `field-sizing: content`; elsewhere it keeps its `rows`
  height and can be resized by the user.
- Invalid: `aria-invalid="true"` plus an `.invalid-feedback` element referenced
  from `aria-describedby`.
- Disabled: the native `disabled` attribute.

## Customizing

| Variable                       | Default |
| ------------------------------ | ------- |
| `--bootcn-textarea-min-height` | `5rem`  |

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`, `input` (field layout classes).

No JavaScript.

## Accessibility

- Always pair the textarea with a `<label for>`.
- Connect help and error text with `aria-describedby`; set `aria-invalid`
  only while the value is invalid.
