# Dialog

An accessible confirm dialog built on **Bootstrap's modal**. Focus trapping,
backdrop, and Escape handling come from Bootstrap; `dialog.js` only adds
declarative confirm behavior and a focus-return safety net.

## Usage

```html
<button
  type="button"
  class="btn bootcn-button bootcn-button--destructive"
  data-bootcn-dialog-confirm
  data-bs-toggle="modal"
  data-bs-target="#example-dialog"
>
  Delete project
</button>

<div
  class="modal fade bootcn-dialog"
  id="example-dialog"
  tabindex="-1"
  aria-labelledby="example-dialog-title"
  aria-describedby="example-dialog-description"
  aria-hidden="true"
>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title bootcn-dialog__title" id="example-dialog-title">Delete?</h2>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label="Close dialog"
        ></button>
      </div>
      <div class="modal-body">
        <p class="bootcn-dialog__description" id="example-dialog-description">
          This action cannot be undone.
        </p>
      </div>
      <div class="modal-footer bootcn-dialog__footer">
        <button
          type="button"
          class="btn bootcn-button bootcn-button--outline bootcn-button--sm"
          data-bs-dismiss="modal"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn bootcn-button bootcn-button--destructive bootcn-button--sm"
          data-bootcn-dialog-confirm-button
          data-bs-dismiss="modal"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</div>
```

## Attributes

- `data-bootcn-dialog-confirm` — on the trigger. Marks it as a confirm trigger;
  the confirm event is dispatched on this element.
- `data-bootcn-dialog-confirm-button` — on the confirm button inside the modal.
  Clicking it dispatches `bootcn:dialog:confirm` on the trigger that opened the
  modal.

`data-bs-toggle`, `data-bs-target` and `data-bs-dismiss` are Bootstrap's own and
must be kept.

## Events

| Event                   | Dispatched on       | Detail                |
| ----------------------- | ------------------- | --------------------- |
| `bootcn:dialog:confirm` | the confirm trigger | `{ trigger, button }` |

The event bubbles. Example:

```html
<script>
  document.addEventListener('bootcn:dialog:confirm', function (event) {
    console.log('Confirmed by', event.detail.button);
  });
</script>
```

## JavaScript API

```js
window.Bootcn.dialog.init(); // idempotent; runs automatically on load
window.Bootcn.dialog.destroy(); // removes listeners
```

## Dependencies

- Bootstrap 5.3+ **CSS and JavaScript bundle** (`window.bootstrap.Modal`). If the
  bundle is missing, `dialog.js` logs one clear console error and does nothing.
- `themes/tokens/tokens.css`.
- The Button component (`button`) for the actions in the example.

## Accessibility

- Use `aria-labelledby` for the title and `aria-describedby` for the description
  so screen readers announce both.
- Bootstrap traps focus inside the modal, closes on Escape, and returns focus to
  the trigger; `dialog.js` adds a fallback focus-return if focus is lost.
- Keep a visible close control with an accessible name.
