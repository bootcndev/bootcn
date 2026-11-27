(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.chat) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-chat]';
  const CHECK =
    '<svg class="bootcn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m2 12 5 5L18 6" /><path d="m12 16 1 1L22 8" /></svg>';
  const SMILE =
    '<svg class="bootcn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></svg>';
  let listening = false;
  let picker = null; // { root, button }

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function fill(text, values) {
    return text.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
  }

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function thread(root, id) {
    return root.querySelector('[data-chat-thread="' + CSS.escape(id) + '"]');
  }

  function current(root) {
    const open = root.querySelector('[data-chat-thread]:not([hidden])');
    return open ? open.dataset.chatThread : null;
  }

  function link(root, id) {
    return root.querySelector('[data-chat-open="' + CSS.escape(id) + '"]');
  }

  function scrollDown(root) {
    const box = root.querySelector('[data-chat-scroll]');
    if (box) box.scrollTop = box.scrollHeight;
  }

  // ------------------------------------------------------------- open

  function open(root, id) {
    const list = thread(root, id);
    if (!list) return;
    root.querySelectorAll('[data-chat-thread]').forEach((other) => (other.hidden = other !== list));
    root.querySelectorAll('[data-chat-open]').forEach((a) => {
      if (a.dataset.chatOpen === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    const a = link(root, id);
    const unread = a && a.querySelector('[data-chat-unread]');
    if (unread) unread.remove();
    const name = list.dataset.chatName || '';
    const head = root.querySelector('[data-chat-head-name]');
    if (head) head.textContent = name;
    const status = root.querySelector('[data-chat-head-status]');
    if (status) status.textContent = list.dataset.chatStatus || '';
    const initials = root.querySelector('[data-chat-head-initials]');
    if (initials) {
      initials.firstChild.textContent = list.dataset.chatInitials || '';
      const dot = initials.querySelector('.bootcn-chat__presence');
      if (dot) dot.hidden = !(a && a.querySelector('.bootcn-chat__presence'));
    }
    const label = root.querySelector('[data-chat-input-label]');
    if (label) label.textContent = fill(t('chat.messageTo', 'Message {name}'), { name });
    typing(root, id, false);
    root.classList.add('is-reading');
    scrollDown(root);
    root.dispatchEvent(
      new CustomEvent('bootcn:chat:open', { bubbles: true, detail: { conversation: id } }),
    );
  }

  // ------------------------------------------------------- add messages

  // Builds a message with textContent only: text from people never becomes HTML.
  function add(root, id, message) {
    const list = thread(root, id);
    if (!list) return null;
    const mine = message.from === 'me' || !message.from;
    const li = el('li', 'bootcn-chat__message is-new' + (mine ? ' bootcn-chat__message--me' : ''));
    li.append(
      el(
        'span',
        'visually-hidden',
        mine
          ? t('chat.youSaid', 'You said:')
          : fill(t('chat.said', '{name} said:'), { name: message.from }),
      ),
    );
    if (message.file) {
      const file = el('a', 'bootcn-chat__file');
      file.href = message.file.url || '#';
      const text = el('span');
      text.append(
        el('span', 'bootcn-chat__file-name', message.file.name),
        el('span', 'bootcn-chat__file-size', message.file.size || ''),
      );
      file.append(text);
      li.append(file);
    } else {
      li.append(el('div', 'bootcn-chat__bubble', message.text));
    }
    if (!mine) {
      const reactions = el('div', 'bootcn-chat__reactions');
      const react = el('button', 'bootcn-chat__react');
      react.type = 'button';
      react.setAttribute('data-chat-react', '');
      react.setAttribute('aria-label', t('chat.react', 'Add a reaction'));
      react.setAttribute('aria-haspopup', 'true');
      react.setAttribute('aria-expanded', 'false');
      react.innerHTML = SMILE;
      reactions.append(react);
      li.append(reactions);
    }
    const meta = el('p', 'bootcn-chat__meta');
    meta.append(el('time', '', message.time || now()));
    if (mine) {
      const status = el('span', 'bootcn-chat__status');
      status.setAttribute('data-chat-status', '');
      status.innerHTML = CHECK;
      status.append(el('span', '', t('chat.sent', 'Sent')));
      meta.append(status);
    }
    li.append(meta);
    (list.querySelector('ol') || list).append(li);
    setTimeout(() => li.classList.remove('is-new'), 300);

    // The conversation shows the latest message and moves to the top.
    const a = link(root, id);
    if (a) {
      const preview = a.querySelector('[data-chat-preview]');
      if (preview)
        preview.textContent =
          (mine ? t('chat.you', 'You') + ': ' : '') +
          (message.file ? message.file.name : message.text);
      const time = a.querySelector('.bootcn-chat__conversation-time');
      if (time) time.textContent = message.time || now();
      const item = a.closest('li');
      item.parentElement.prepend(item);
      if (!mine && current(root) !== id) {
        let badge = a.querySelector('[data-chat-unread]');
        if (!badge) {
          badge = el('span', 'bootcn-chat__unread');
          badge.setAttribute('data-chat-unread', '');
          badge.append(
            document.createTextNode('0'),
            el('span', 'visually-hidden', ' ' + t('chat.unread', 'unread')),
          );
          a.querySelector('.bootcn-chat__conversation-bottom').append(badge);
        }
        badge.firstChild.textContent = String(Number(badge.firstChild.textContent) + 1);
      }
    }
    if (current(root) === id) scrollDown(root);
    return li;
  }

  function status(root, message, state) {
    const el2 = message && message.querySelector('[data-chat-status]');
    if (!el2) return;
    el2.dataset.state = state;
    el2.lastChild.textContent =
      state === 'read'
        ? t('chat.read', 'Read')
        : state === 'delivered'
          ? t('chat.delivered', 'Delivered')
          : t('chat.sent', 'Sent');
  }

  function receive(root, id, message) {
    typing(root, id, false);
    return add(root, id, {
      ...message,
      from: message.from || (thread(root, id) || {}).dataset.chatName,
    });
  }

  function typing(root, id, on) {
    const line = root.querySelector('[data-chat-typing]');
    if (!line) return;
    const show = on && current(root) === id;
    line.hidden = !show;
    if (show) {
      const name = (thread(root, id).dataset.chatName || '').split(' ')[0];
      line.querySelector('[data-chat-typing-text]').textContent = fill(
        t('chat.typing', '{name} is typing…'),
        { name },
      );
      scrollDown(root);
    }
  }

  // --------------------------------------------------------------- send

  function send(root, text, file) {
    const id = current(root);
    if (!id || (!text && !file)) return null;
    const detail = { conversation: id, text, file: file || null };
    if (
      !root.dispatchEvent(
        new CustomEvent('bootcn:chat:send', { bubbles: true, cancelable: true, detail }),
      )
    )
      return null;
    const message = add(
      root,
      id,
      file
        ? { from: 'me', file: { name: file.name, size: size(file.size) } }
        : { from: 'me', text },
    );
    // Demo receipts; call Bootcn.chat.status with what your server reports.
    if (!root.hasAttribute('data-chat-manual-status')) {
      setTimeout(() => status(root, message, 'delivered'), 700);
    }
    return message;
  }

  function size(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  function grow(input) {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 128) + 'px';
  }

  // ------------------------------------------------------------ reactions

  function openPicker(root, button) {
    closePicker(false);
    const menu = root.querySelector('[data-chat-picker]');
    if (!menu) return;
    menu.hidden = false;
    const r = button.getBoundingClientRect();
    const box = root.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left - box.left, box.width - menu.offsetWidth - 8));
    menu.style.left = left + 'px';
    menu.style.top = Math.max(8, r.top - box.top - menu.offsetHeight - 6) + 'px';
    button.setAttribute('aria-expanded', 'true');
    picker = { root, button, menu };
    menu.querySelector('button').focus();
  }

  function closePicker(focus) {
    if (!picker) return;
    picker.menu.hidden = true;
    picker.button.setAttribute('aria-expanded', 'false');
    if (focus) picker.button.focus();
    picker = null;
  }

  function toggleReaction(container, emoji) {
    let chip = [...container.querySelectorAll('[data-chat-reaction]')].find(
      (c) => c.dataset.chatReaction === emoji,
    );
    if (!chip) {
      chip = el('button', 'bootcn-chat__reaction');
      chip.type = 'button';
      chip.dataset.chatReaction = emoji;
      chip.setAttribute('aria-pressed', 'false');
      chip.append(
        el('span', '', emoji),
        el('span', 'visually-hidden', t('chat.reacted', 'You reacted with')),
        document.createTextNode(' '),
        el('span', '', '0'),
      );
      chip.firstChild.setAttribute('aria-hidden', 'true');
      chip.lastChild.setAttribute('data-chat-reaction-count', '');
      container.prepend(chip);
    }
    const count = chip.querySelector('[data-chat-reaction-count]');
    const pressed = chip.getAttribute('aria-pressed') === 'true';
    chip.setAttribute('aria-pressed', String(!pressed));
    count.textContent = String(Number(count.textContent) + (pressed ? -1 : 1));
    if (count.textContent === '0') chip.remove();
    container.dispatchEvent(
      new CustomEvent('bootcn:chat:react', {
        bubbles: true,
        detail: { message: container.closest('.bootcn-chat__message'), emoji, on: !pressed },
      }),
    );
  }

  // --------------------------------------------------------------- events

  function onClick(event) {
    if (
      picker &&
      !picker.menu.contains(event.target) &&
      event.target.closest('[data-chat-react]') !== picker.button
    )
      closePicker(false);
    const root = event.target.closest(ROOT);
    if (!root) return;
    const a = event.target.closest('[data-chat-open]');
    if (a) {
      event.preventDefault();
      open(root, a.dataset.chatOpen);
      const input = root.querySelector('[data-chat-input]');
      if (input) input.focus({ preventScroll: true });
      return;
    }
    if (event.target.closest('[data-chat-back]')) {
      root.classList.remove('is-reading');
      const back = link(root, current(root));
      if (back) back.focus();
      return;
    }
    if (event.target.closest('[data-chat-attach]')) {
      root.querySelector('[data-chat-file]').click();
      return;
    }
    const react = event.target.closest('[data-chat-react]');
    if (react) {
      if (picker && picker.button === react) closePicker(true);
      else openPicker(root, react);
      return;
    }
    const emoji = event.target.closest('[data-chat-emoji]');
    if (emoji && picker) {
      const container = picker.button.closest('.bootcn-chat__reactions');
      closePicker(true);
      toggleReaction(container, emoji.dataset.chatEmoji);
      return;
    }
    const chip = event.target.closest('[data-chat-reaction]');
    if (chip) toggleReaction(chip.closest('.bootcn-chat__reactions'), chip.dataset.chatReaction);
  }

  function onSubmit(event) {
    const form = event.target.closest && event.target.closest('[data-chat-composer]');
    if (!form) return;
    event.preventDefault();
    const root = form.closest(ROOT);
    const input = form.querySelector('[data-chat-input]');
    const text = input.value.trim();
    if (!text) return;
    if (send(root, text)) {
      input.value = '';
      grow(input);
    }
  }

  function onKeydown(event) {
    if (picker && picker.menu.contains(event.target)) {
      const items = [...picker.menu.querySelectorAll('button')];
      const i = items.indexOf(event.target);
      if (event.key === 'Escape') {
        event.preventDefault();
        closePicker(true);
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const dir =
          (event.key === 'ArrowRight') === (getComputedStyle(picker.menu).direction !== 'rtl')
            ? 1
            : -1;
        items[(i + dir + items.length) % items.length].focus();
      }
      return;
    }
    const input = event.target.closest && event.target.closest('[data-chat-input]');
    if (input && event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      input.form.requestSubmit();
    }
  }

  function onInput(event) {
    const input = event.target.closest && event.target.closest('[data-chat-input]');
    if (input) grow(input);
    const search = event.target.closest && event.target.closest('[data-chat-search]');
    if (search) {
      const root = search.closest(ROOT);
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      root.querySelectorAll('[data-chat-open]').forEach((a) => {
        const match =
          !q ||
          a.querySelector('.bootcn-chat__conversation-name').textContent.toLowerCase().includes(q);
        a.closest('li').hidden = !match;
        if (match) shown += 1;
      });
      const none = root.querySelector('[data-chat-none]');
      if (none) none.hidden = shown > 0;
    }
  }

  function onChange(event) {
    const picked = event.target.closest && event.target.closest('[data-chat-file]');
    if (!picked || !picked.files.length) return;
    send(picked.closest(ROOT), '', picked.files[0]);
    picked.value = '';
  }

  function setup(root) {
    scrollDown(root);
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('submit', onSubmit);
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('input', onInput);
      document.addEventListener('change', onChange);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    closePicker(false);
    document.removeEventListener('click', onClick);
    document.removeEventListener('submit', onSubmit);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('input', onInput);
    document.removeEventListener('change', onChange);
    listening = false;
  }

  ns.chat = { init, destroy, open, send, add, receive, typing, status };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
