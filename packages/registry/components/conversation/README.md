# Conversation

A chat transcript for AI assistants: user and assistant messages, reasoning, sources, copy and feedback actions, a typing indicator and a "scroll to latest" button.

## Usage

Render past messages on the server and add new ones with
`Bootcn.conversation.append`. A streamed reply:

```js
const root = document.querySelector('[data-bootcn-conversation]');
Bootcn.conversation.setTyping(root, true);
const reply = Bootcn.conversation.append(root, { role: 'assistant', text: '' });
let text = '';
for await (const chunk of stream) {
  text += chunk;
  Bootcn.conversation.setText(reply, text);
}
Bootcn.conversation.setTyping(root, false);
```

Pair it with the Prompt input component, or install the AI chat block, which
connects the two.

## JavaScript API

- Markup: `data-bootcn-conversation` on the section, the scrolling
  `role="log"` element with `data-bootcn-conversation-log`, the typing
  indicator (`data-bootcn-conversation-typing`), the "scroll to latest" button
  (`data-bootcn-conversation-latest`), a status region
  (`data-bootcn-conversation-status`) and one `<template>` per role
  (`data-bootcn-conversation-template="user"` / `"assistant"`).
- `Bootcn.conversation.append(root, { role: 'user' | 'assistant', text })`
  adds a message from the template and returns it. `text` becomes paragraphs
  (blank lines split them) and is never parsed as HTML; `html` instead of
  `text` inserts markup as is, so pass only markup you built or sanitized.
- `setText(message, text)` replaces a message's text, for streamed replies.
- `setTyping(root, true | false)` shows the typing indicator and marks the
  log `aria-busy` (screen readers then read the finished reply once).
- `scrollToLatest(root, smooth)`, `clear(root)`, `init()` / `destroy()`.
- The log stays at the latest message while the reader is there; after
  scrolling up, the "scroll to latest" button appears instead.
- Events (bubble): `bootcn:conversation:copy` (`detail.text`),
  `bootcn:conversation:feedback` (`detail.value`: `'up'`, `'down'` or
  `null`), `bootcn:conversation:regenerate`.

## Accessibility

- The transcript is a `role="log"` region, so new messages are announced.
  While a reply is generated, `aria-busy` holds the announcement until it is
  complete.
- Every message names its author ("You" is visually hidden).
- The log is focusable for keyboard scrolling; message actions are buttons
  with names, and the feedback buttons use `aria-pressed`.
- Reasoning uses a native `<details>` disclosure.
- The typing dots stop moving with `prefers-reduced-motion`.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `code-block` component.
