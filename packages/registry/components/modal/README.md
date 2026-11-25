# Modal

Modals for forms and longer content: sizes, top placement, a bottom sheet on phones, blurred backdrop, scrolling with shadows, form validation and an unsaved-changes guard.

## Usage

A Bootstrap modal with the `bootcn-dialog bootcn-modal` classes; it opens
with `data-bs-toggle="modal"` as usual. For a short confirmation, use the
`dialog` or `alert-dialog` component instead.

| Want                   | Add                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Size                   | `modal-sm`, `modal-lg`, `modal-xl` or `modal-fullscreen` (`modal-fullscreen-sm-down` and friends) on `.modal-dialog` |
| Near the top           | `bootcn-modal--top` on the modal, without `modal-dialog-centered`                                                    |
| Bottom sheet on phones | `bootcn-modal--sheet`                                                                                                |
| Blurred backdrop       | `bootcn-modal--blur` (`bootcn-modal--transparent`: none)                                                             |
| Long content           | `modal-dialog-scrollable`: the body scrolls between a fixed header and footer, with shadows while there is more      |

## Forms

`<form data-bootcn-modal-form novalidate>` inside the modal:

- Submitting checks the fields first: invalid ones get `aria-invalid="true"`,
  their message shows, and the first one is focused.
- Then `bootcn:modal:submit` fires with `detail: { form, data, close(), busy() }`.
  Without a listener the modal closes. To save first, call
  `event.preventDefault()`, `detail.busy()` (the submit button shows a
  spinner), and `detail.close()` when the request succeeds:

```js
document.addEventListener('bootcn:modal:submit', async (event) => {
  event.preventDefault();
  event.detail.busy();
  await fetch('/profile', { method: 'POST', body: event.detail.data });
  event.detail.close();
});
```

- The form is reset when the modal closes. A field with `autofocus` gets
  the focus when it opens.

### Unsaved changes

With `data-bootcn-modal-guard` on the modal, closing it after the form was
changed (Escape, the backdrop, Cancel or the close button) shows the
`[data-bootcn-modal-discard]` bar instead: **Keep editing** or **Discard**.

## JavaScript API

`Bootcn.modal.open(modal)`, `Bootcn.modal.close(modal)` (without the
question), `init()` / `destroy()`.

## Accessibility

- Bootstrap's modal: focus is kept inside, Escape closes, focus returns to
  the button that opened it. Each modal is named by its title and described
  by its first paragraph.
- A scrolling body is focusable and named, so it can be scrolled with the
  keyboard.
- Errors are tied to their fields with `aria-describedby`; the discard
  question is announced and its "Keep editing" button focused.
- Animations are skipped under reduced motion.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`, `dialog`, `button` and `input`.
