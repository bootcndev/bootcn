# Chat

A messaging app: conversations with presence and unread counts, a thread with day separators, read receipts, files and reactions, a typing indicator, and a composer that grows, sends on Enter and attaches files; one pane at a time on phones.

## Usage

A `<section data-bootcn-chat>` with a sidebar of conversations
(`data-chat-open="id"` links) and a thread: one `<div role="log"
data-chat-thread="id">` holding an `<ol>` of messages per conversation (render the open one from your
server, the others when opened), the typing line and the composer.

- **Opening** a conversation marks it `aria-current`, shows its thread,
  clears its unread count and updates the header. Below 40rem of width it
  shows one pane at a time, with a back button.
- **Sending**: Enter sends, Shift+Enter adds a line, and the field grows
  with the text. Each message fires `bootcn:chat:send` (`detail: {
conversation, text, file }`); cancel it to send through your server and
  add the message yourself with `Bootcn.chat.add()`. Messages show Sent,
  then the status you set with `Bootcn.chat.status(root, message,
'delivered' | 'read')`.
- **Receiving**: `Bootcn.chat.receive(root, id, { text, from })` adds a
  message (and an unread count when that conversation is not open);
  `Bootcn.chat.typing(root, id, true | false)` shows "… is typing".
- **Reactions**: the smiley under a message opens five reactions;
  `bootcn:chat:react` tells you which.
- **Files**: the paperclip picks a file and sends it as a file message.
- **Search** filters the conversations by name.

Messages are built with `textContent`, never `innerHTML`, so text from
people is never run as HTML.

## Accessibility

- Each thread is a `role="log"`: screen readers read new messages as
  they arrive. Every message starts with who said it ("Lena Fischer
  said:"), hidden visually.
- The open conversation is `aria-current`; unread counts and presence are
  read with the name ("Lena Fischer, online, 2 unread").
- The composer is labelled with the person's name ("Message Lena
  Fischer"); icon buttons have names; the reaction picker is a menu with
  arrow keys and Escape. Texts are in `window.Bootcn.messages` (`chat.*`).

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `avatar` component.
