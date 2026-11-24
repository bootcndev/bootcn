# AI chat

A complete chat panel: a header with "New chat", the conversation and the prompt input with suggestions and attachments, wired together.

## Usage

The block's `ai-chat.js` connects the prompt input to the conversation and
answers with a sample reply. Replace its `reply()` function with a request to
your server, for example a PHP endpoint that calls your AI provider and
streams the answer:

```js
const response = await fetch('/chat.php', { method: 'POST', body: formData });
const reader = response.body.getReader();
const decoder = new TextDecoder();
const message = Bootcn.conversation.append(conversation, { role: 'assistant', text: '' });
let text = '';
for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  text += decoder.decode(value, { stream: true });
  Bootcn.conversation.setText(message, text);
}
```

Keep API keys on the server; never put them in the page.

## JavaScript

`ai-chat.js` (`Bootcn.aiChat.init()` / `destroy()`) handles
`bootcn:prompt-input:submit` and `bootcn:prompt-input:stop` inside
`[data-bootcn-ai-chat]` and the "New chat" button (`data-bootcn-ai-chat-new`).

## Accessibility

- A labelled section with a heading; the conversation is a `role="log"`
  region that announces finished replies.
- "New chat" clears the conversation and moves focus to the message box.
- The prompt input and the conversation keep their own keyboard support.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `conversation` component.
- The `prompt-input` component.
- The `button` component.
