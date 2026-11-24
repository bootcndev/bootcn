---
title: AI
aside: false
---

# AI

<p class="bootcn-lead">Chat interfaces for AI assistants: a complete chat panel and the pieces it is made of.</p>

Install the whole panel, or only the parts you need. Everything is plain HTML,
CSS and vanilla JavaScript; connect it to your own server, which keeps the API
keys and calls your AI provider.

```bash
npx bootcn add ai-chat
```

## AI chat

The [AI chat block](../blocks/ai-chat) wires the prompt input to the
conversation: send a message, see the typing indicator, then the reply. It
answers with a sample reply until you connect it to your server.

<ComponentPreview name="ai-chat" title="AI chat" kind="blocks" bare />

## The pieces

<div class="bootcn-chart-gallery">
  <div>
    <ComponentPreview name="conversation" title="Conversation" bare />
    <a class="bootcn-chart-gallery__link" href="../components/conversation">Conversation: messages, reasoning, sources, copy and feedback</a>
  </div>
  <div>
    <ComponentPreview name="prompt-input" title="Prompt input" bare />
    <a class="bootcn-chart-gallery__link" href="../components/prompt-input">Prompt input: attachments, model choice, send and stop</a>
  </div>
  <div>
    <ComponentPreview name="code-block" title="Code block" bare />
    <a class="bootcn-chart-gallery__link" href="../components/code-block">Code block: copy and line numbers</a>
  </div>
</div>

## Streaming a reply

```js
const conversation = document.querySelector('[data-bootcn-conversation]');
Bootcn.conversation.setTyping(conversation, true);
const reply = Bootcn.conversation.append(conversation, { role: 'assistant', text: '' });
let text = '';
for await (const chunk of stream) {
  text += chunk;
  Bootcn.conversation.setText(reply, text);
}
Bootcn.conversation.setTyping(conversation, false);
```

Text is never parsed as HTML, and screen readers hear the finished reply once
(the log is `aria-busy` while it streams).
