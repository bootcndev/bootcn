# Prompt input

The message box of an AI chat: a growing textarea, file attachments, a model choice, suggestions and a send button that turns into stop.

## Usage

Send the prompt to your server with `fetch` and show the reply in a
Conversation:

```js
document.addEventListener('bootcn:prompt-input:submit', async (event) => {
  event.preventDefault(); // handled here, no page load
  const form = event.target;
  Bootcn.promptInput.setBusy(form, true);
  const response = await fetch('/chat.php', { method: 'POST', body: event.detail.data });
  // ...append the reply...
  Bootcn.promptInput.setBusy(form, false);
});
```

For a page without JavaScript handling, give the form `action`, `method="post"`
and `enctype="multipart/form-data"`; PHP receives `$_POST['message']`,
`$_POST['model']` and `$_FILES['files']`.

## JavaScript API

- `data-bootcn-prompt-input` on the `<form>`, with
  `data-bootcn-prompt-textarea`, `data-bootcn-prompt-submit`, and optionally
  `data-bootcn-prompt-file` (a native file input), `data-bootcn-prompt-attachments`
  (the list) and `data-bootcn-prompt-status` (a live region).
- Enter sends, Shift + Enter adds a line; the textarea grows up to 12rem.
  The send button is disabled while there is no text and no file.
- Attachments: choose files or drop them on the box. Each one is listed
  with its size and a remove button; the file input's `FileList` is kept in
  step, so a normal form post sends exactly the files shown.
- Event `bootcn:prompt-input:submit` (bubbles, cancelable),
  `detail: { text, files, data }` (`data` is a `FormData`). A form without an
  `action` attribute is handled in JavaScript only and is cleared after the
  event. With an `action`, it posts normally (`enctype="multipart/form-data"`)
  unless a listener calls `event.preventDefault()`.
- `Bootcn.promptInput.setBusy(form, true)` turns the send button into a stop
  button, which emits `bootcn:prompt-input:stop`.
- Suggestion buttons (`data-bootcn-prompt-suggestion`) fill the textarea and
  emit `bootcn:prompt-input:suggestion` (`detail.text`).
- `clear(form)`, `refresh(form)`, `files(form)`, `init()` / `destroy()`.

## Accessibility

- The textarea has a (visually hidden) label and a visible hint describing
  Enter and Shift + Enter.
- The attach button is a native file input with a label, so it works with
  the keyboard and screen readers; attachments are a labelled list, each with
  a named remove button, and focus moves to the next one after a removal.
- Attaching and removing files is announced in a live region.
- The send button is named "Send", or "Stop" while busy.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
