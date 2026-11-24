# Input

A text input built on Bootstrap's `.form-control` and `.form-label`.

## Usage

```html
<div class="bootcn-field">
  <label for="name" class="form-label bootcn-field__label">Name</label>
  <input type="text" class="form-control bootcn-input" id="name" aria-describedby="name-help" />
  <p class="bootcn-field__help" id="name-help">Shown on your public profile.</p>
</div>
```

## Invalid state

Add `aria-invalid="true"` and reference the error text with `aria-describedby`.
The error uses Bootstrap's `.invalid-feedback`, shown by the component CSS:

```html
<input
  type="email"
  class="form-control bootcn-input"
  id="email"
  aria-invalid="true"
  aria-describedby="email-help email-error"
/>
<p class="bootcn-field__help" id="email-help">We never share your email.</p>
<div class="invalid-feedback" id="email-error">Enter a valid email address.</div>
```

## With an icon

Use Bootstrap's `.input-group` with an `.input-group-text`; mark the icon
`aria-hidden="true"` and keep the input's own label.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.

No JavaScript.

## Accessibility

- Every input needs a real `<label>` linked with `for`/`id`.
- Help and error text are connected with `aria-describedby`, not placed as
  adjacent text only.
- Use `aria-invalid="true"` for invalid state; do not rely on color alone.
- Disabled inputs use the native `disabled` attribute.
