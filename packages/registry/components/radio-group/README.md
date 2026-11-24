# Radio group

A `<fieldset>` of radio options built on Bootstrap's `.form-check`, as a list
or as selectable cards.

## Usage

```html
<fieldset class="bootcn-radio-group">
  <legend class="bootcn-radio-group__legend">Notify me about</legend>
  <div class="form-check bootcn-radio-group__item">
    <input
      class="form-check-input"
      type="radio"
      name="notify"
      id="notify-all"
      value="all"
      checked
    />
    <label class="form-check-label" for="notify-all">All new messages</label>
  </div>
  <!-- more options with the same name -->
</fieldset>
```

Add `bootcn-radio-group--cards` to the fieldset for a card layout. Add a
`.bootcn-radio-group__description` (referenced with `aria-describedby`) under
any label.

The selected card highlight uses `:has()`; in browsers without it the radio
button itself still shows the selection.

## Customizing

| Variable              | Default    |
| --------------------- | ---------- |
| `--bootcn-radio-size` | `1.125rem` |
| `--bootcn-radio-gap`  | `0.625rem` |

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.

No JavaScript.

## Accessibility

- `<fieldset>` and `<legend>` name the group for screen readers.
- Native radios give arrow-key navigation within the group for free.
- In the card layout the label is stretched over the card, so clicking anywhere
  selects the option without extra JavaScript.
