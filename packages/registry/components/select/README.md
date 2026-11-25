# Select

A native `<select>` built on Bootstrap's `.form-select`. Native selects keep
platform keyboard behavior and mobile pickers, so this component adds styling
only.

## Usage

```html
<div class="bootcn-field">
  <label for="country" class="form-label bootcn-field__label">Country</label>
  <select
    class="form-select bootcn-select"
    id="country"
    name="country"
    aria-describedby="country-help"
  >
    <option value="">Choose a country</option>
    <option value="pt">Portugal</option>
  </select>
  <p class="bootcn-field__help" id="country-help">Used for tax calculation.</p>
</div>
```

The `bootcn-field`, `bootcn-field__label` and `bootcn-field__help` classes come
from the Input component's stylesheet. Install `input` too (it is a registry
dependency) or replace them with Bootstrap's `mb-3`/`form-text`.

## States

- Invalid: `aria-invalid="true"` plus an `.invalid-feedback` element referenced
  from `aria-describedby`.
- Disabled: the native `disabled` attribute.
- Option groups: native `<optgroup label>`.

A searchable multi-select is a separate, JavaScript-based component planned
for later.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`, `input` (field layout classes).

No JavaScript.

## Accessibility

- Always pair the select with a `<label for>`.
- Use an empty first option as a prompt rather than a placeholder-only label.
