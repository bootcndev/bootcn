(function () {
  'use strict';

  // Demo wiring between the prompt input and the conversation: it answers
  // with a fixed reply after a short delay. Replace reply() with a call to
  // your server (see the README).
  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.aiChat) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-ai-chat]';
  const pending = new WeakMap(); // chat -> timer
  let listening = false;

  function partsOf(chat) {
    return {
      conversation: chat.querySelector('[data-bootcn-conversation]'),
      form: chat.querySelector('[data-bootcn-prompt-input]'),
    };
  }

  function finish(chat) {
    const p = partsOf(chat);
    clearTimeout(pending.get(chat));
    pending.delete(chat);
    window.Bootcn.conversation.setTyping(p.conversation, false);
    window.Bootcn.promptInput.setBusy(p.form, false);
  }

  function reply(chat, text) {
    const p = partsOf(chat);
    window.Bootcn.conversation.setTyping(p.conversation, true);
    window.Bootcn.promptInput.setBusy(p.form, true);
    pending.set(
      chat,
      setTimeout(
        function () {
          window.Bootcn.conversation.setTyping(p.conversation, false);
          window.Bootcn.conversation.append(p.conversation, {
            role: 'assistant',
            text:
              'This is a sample reply to "' +
              text +
              '".\n\nConnect the chat to your server in ai-chat.js to get real answers.',
          });
          finish(chat);
        },
        Number(chat.getAttribute('data-delay')) || 900,
      ),
    );
  }

  function onSubmit(event) {
    const chat = event.target.closest && event.target.closest(ROOT);
    if (!chat || !window.Bootcn.conversation) return;
    event.preventDefault();
    const text = event.detail.text;
    const files = event.detail.files;
    const names = files.length
      ? '\n\nAttached: ' +
        files
          .map(function (file) {
            return file.name;
          })
          .join(', ')
      : '';
    window.Bootcn.conversation.append(partsOf(chat).conversation, {
      role: 'user',
      text: (text || 'Files') + names,
    });
    reply(chat, text || 'the attached files');
  }

  function onStop(event) {
    const chat = event.target.closest && event.target.closest(ROOT);
    if (chat) finish(chat);
  }

  function onClick(event) {
    const button =
      event.target.closest && event.target.closest(ROOT + ' [data-bootcn-ai-chat-new]');
    if (!button) return;
    const chat = button.closest(ROOT);
    finish(chat);
    window.Bootcn.conversation.clear(partsOf(chat).conversation);
    window.Bootcn.promptInput.clear(partsOf(chat).form);
    const textarea = chat.querySelector('[data-bootcn-prompt-textarea]');
    if (textarea) textarea.focus();
  }

  function init() {
    if (listening) return;
    document.addEventListener('bootcn:prompt-input:submit', onSubmit);
    document.addEventListener('bootcn:prompt-input:stop', onStop);
    document.addEventListener('click', onClick);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('bootcn:prompt-input:submit', onSubmit);
    document.removeEventListener('bootcn:prompt-input:stop', onStop);
    document.removeEventListener('click', onClick);
    listening = false;
  }

  ns.aiChat = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
