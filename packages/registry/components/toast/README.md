# Toast

Short notifications built on Bootstrap's **Toast** plugin. `toast.js` adds what
Bootstrap leaves to you: declarative triggers, an auto-created container, and a
`create()` API that builds toasts safely (text only, never HTML).

## Usage

Show an existing toast:

```html
<button
  type="button"
  class="btn bootcn-button bootcn-button--outline"
  data-bootcn-toast-target="#saved"
>
  Save
</button>

<div
  class="toast-container position-fixed bottom-0 end-0 p-3 bootcn-toast-container"
  data-bootcn-toast-container
>
  <div
    class="toast bootcn-toast bootcn-toast--default"
    id="saved"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <div class="bootcn-toast__body">
      <div class="bootcn-toast__text">
        <p class="bootcn-toast__title">Changes saved</p>
        <p class="bootcn-toast__description">Your profile was updated.</p>
      </div>
      <button
        type="button"
        class="btn-close bootcn-toast__close"
        data-bs-dismiss="toast"
        aria-label="Close notification"
      ></button>
    </div>
  </div>
</div>
```

Create one from a button, without writing JavaScript:

```html
<button
  type="button"
  class="btn bootcn-button bootcn-button--outline"
  data-bootcn-toast-create
  data-bootcn-toast-title="Invitation sent"
  data-bootcn-toast-message="We emailed nikos@example.com."
  data-bootcn-toast-variant="success"
>
  Invite
</button>
```

Or from your own script (for example after a `fetch`):

```js
window.Bootcn.toast.create({
  title: 'Upload failed',
  message: 'The file is larger than 10 MB.',
  variant: 'destructive', // 'default' | 'success' | 'destructive'
  autohide: true,
  delay: 5000,
});
```

Created toasts go into the first `[data-bootcn-toast-container]` (one is added
at the bottom right if none exists) and are removed from the page when hidden.

From PHP, a flash message can render a toast with `class="toast show ..."`, or
print a `create()` call with `json_encode()` for the strings.

## JavaScript API

| Method                   | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `Bootcn.toast.show(el)`  | Show an existing toast (element or selector)     |
| `Bootcn.toast.create(o)` | Build, show and later remove a toast; returns it |
| `Bootcn.toast.init()`    | Attach the delegated click handler (idempotent)  |
| `Bootcn.toast.destroy()` | Remove the handler                               |

Bootstrap's own events (`show.bs.toast`, `hidden.bs.toast`, …) fire on the
toast element.

## Dependencies

- Bootstrap 5.3+ CSS and **JavaScript bundle** (Toast). If it is missing,
  `toast.js` logs one console error.
- `themes/tokens/tokens.css`, `button` (example triggers).

## Accessibility

- Toasts use `role="status"` / `aria-live="polite"`; destructive toasts created
  with `create()` use `role="alert"` / `aria-live="assertive"`.
- Keep messages short. Do not put the only copy of important information, or
  actions the user must take, in a toast that hides itself.
- Every toast has a labelled close button. Bootstrap pauses auto-hide while the
  pointer or focus is on the toast and disables the fade under reduced motion.
