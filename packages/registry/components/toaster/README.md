# Toaster

Toast notifications from one line of JavaScript: types, descriptions, an action, promise states, stacking that expands on hover, swipe to dismiss and a pausable timer.

## Usage

Use toasts for short confirmations ("Saved", "Copied") and background
results. Errors the person must act on belong next to the field or in a
dialog, and confirmations before a destructive action in the Alert dialog.
The older Toast component (Bootstrap's plugin) stays for markup-first
toasts.

## JavaScript API

```js
Bootcn.toast('Event created', { description: 'Friday at 10:00' });
Bootcn.toast.success('Profile saved');
Bootcn.toast.error('Could not reach the server');
Bootcn.toast('Message archived', { action: { label: 'Undo', onClick: restore } });
const id = Bootcn.toast.loading('Uploading…');
Bootcn.toast.update(id, { type: 'success', message: 'Uploaded' });
await Bootcn.toast.promise(save(), {
  loading: 'Saving…',
  success: 'Saved',
  error: (e) => e.message,
});
Bootcn.toast.dismiss(id); // or dismiss() for all
```

- Options: `type` (`default`, `success`, `error`, `warning`, `info`,
  `loading`), `description`, `duration` (ms, default 4000; `Infinity` keeps
  it), `action` `{ label, onClick }`, `position` (`top-left` … `bottom-right`,
  default `bottom-right`), `dismissible` (`false` hides ×), `id`.
- Without JavaScript to write: `data-bootcn-toast="Message"` on a button,
  with `data-type`, `data-description`, `data-action`, `data-position`.
- Events on `document`: `bootcn:toast:show` and `bootcn:toast:dismiss`
  (`detail.id`). Text is always set as text, never parsed as HTML.
- Messages `toast.close`, `toast.region`, `toast.loading`, `toast.done`,
  `toast.failed` can be translated with `window.Bootcn.messages`.

## Accessibility

- Every toast is read once by a live region: politely, or assertively for
  errors. Its text stays on screen while it is hovered or focused, and the
  timer pauses then.
- Alt + T moves focus to the newest notification; Escape dismisses the
  focused one; the close button is named "Close notification".
- Swiping is a shortcut, never the only way to dismiss.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button` component.
