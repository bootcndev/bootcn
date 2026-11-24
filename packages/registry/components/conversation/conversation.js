(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.conversation) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-conversation]';
  const LOG = '[data-bootcn-conversation-log]';
  const NEAR_BOTTOM = 48; // px: "at the latest message" below this distance
  const timers = new WeakMap();
  let listening = false;

  // Clipboard API, else a hidden textarea and execCommand (older browsers,
  // pages without clipboard permission).
  function writeClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () {
          return true;
        },
        function () {
          return legacyCopy(text);
        },
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    const active = document.activeElement;
    area.select();
    let ok;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    if (active && active.focus) active.focus();
    return ok;
  }

  // Announces text in a live region, even when it is the same as last time.
  function announce(region, text) {
    if (!region) return;
    region.textContent = '';
    setTimeout(function () {
      region.textContent = text;
    }, 50);
  }

  function logOf(root) {
    return root && root.querySelector(LOG);
  }

  function atBottom(log) {
    return log.scrollHeight - log.scrollTop - log.clientHeight <= NEAR_BOTTOM;
  }

  function updateLatest(root) {
    const log = logOf(root);
    const button = root.querySelector('[data-bootcn-conversation-latest]');
    if (log && button) button.hidden = atBottom(log);
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function scrollToLatest(root, smooth) {
    const log = logOf(root);
    if (!log) return;
    log.scrollTo({
      top: log.scrollHeight,
      behavior: smooth && !reducedMotion() ? 'smooth' : 'auto',
    });
    updateLatest(root);
  }

  // Plain text into paragraphs (blank lines split them); never parsed as HTML.
  function setText(message, text) {
    const content = message.querySelector('.bootcn-message__content');
    if (!content) return;
    content.replaceChildren();
    String(text)
      .split(/\n{2,}/)
      .filter(function (part) {
        return part.trim() !== '';
      })
      .forEach(function (part) {
        const p = document.createElement('p');
        p.textContent = part.trim();
        content.appendChild(p);
      });
    const root = message.closest(ROOT);
    if (root && root.dataset.bootcnStick === 'true') scrollToLatest(root, false);
  }

  // Adds a message from the user or the assistant template. `html` is
  // inserted as is: pass only markup you built or sanitized.
  function append(root, options) {
    const log = logOf(root);
    if (!log) return null;
    const role = options && options.role === 'user' ? 'user' : 'assistant';
    const template = root.querySelector('[data-bootcn-conversation-template="' + role + '"]');
    if (!template) return null;
    const message = template.content.firstElementChild.cloneNode(true);
    const stick = atBottom(log);
    const typing = log.querySelector('[data-bootcn-conversation-typing]');
    log.insertBefore(message, typing);
    const content = message.querySelector('.bootcn-message__content');
    if (options && typeof options.html === 'string') content.innerHTML = options.html;
    else setText(message, (options && options.text) || '');
    root.dataset.bootcnStick = String(stick);
    if (stick || role === 'user') scrollToLatest(root, false);
    else updateLatest(root);
    return message;
  }

  function setTyping(root, typing) {
    const log = logOf(root);
    if (!log) return;
    const indicator = log.querySelector('[data-bootcn-conversation-typing]');
    const stick = atBottom(log);
    if (indicator) indicator.hidden = !typing;
    if (typing) log.setAttribute('aria-busy', 'true');
    else log.removeAttribute('aria-busy');
    if (stick) scrollToLatest(root, false);
  }

  function clear(root) {
    const log = logOf(root);
    if (!log) return;
    log
      .querySelectorAll('.bootcn-message:not([data-bootcn-conversation-typing])')
      .forEach(function (message) {
        message.remove();
      });
    setTyping(root, false);
    updateLatest(root);
  }

  function copy(button) {
    const message = button.closest('.bootcn-message');
    const root = button.closest(ROOT);
    const content = message && message.querySelector('.bootcn-message__content');
    if (!content || !root) return;
    const text = content.innerText.trim();
    writeClipboard(text).then(function (ok) {
      if (!ok) return;
      button.classList.add('is-copied');
      clearTimeout(timers.get(button));
      timers.set(
        button,
        setTimeout(function () {
          button.classList.remove('is-copied');
        }, 2000),
      );
      announce(root.querySelector('[data-bootcn-conversation-status]'), 'Copied to the clipboard.');
      message.dispatchEvent(
        new CustomEvent('bootcn:conversation:copy', { bubbles: true, detail: { text: text } }),
      );
    });
  }

  function feedback(button) {
    const group = button.closest('.bootcn-message__actions');
    const pressed = button.getAttribute('aria-pressed') !== 'true';
    group.querySelectorAll('[data-bootcn-message-feedback]').forEach(function (other) {
      other.setAttribute('aria-pressed', 'false');
    });
    button.setAttribute('aria-pressed', String(pressed));
    button.dispatchEvent(
      new CustomEvent('bootcn:conversation:feedback', {
        bubbles: true,
        detail: { value: pressed ? button.getAttribute('data-bootcn-message-feedback') : null },
      }),
    );
  }

  function onClick(event) {
    const target = event.target.closest && event.target.closest(ROOT + ' button');
    if (!target) return;
    const root = target.closest(ROOT);
    if (target.hasAttribute('data-bootcn-conversation-latest')) {
      scrollToLatest(root, true);
      const log = logOf(root);
      if (log) log.focus({ preventScroll: true });
    } else if (target.hasAttribute('data-bootcn-message-copy')) {
      copy(target);
    } else if (target.hasAttribute('data-bootcn-message-feedback')) {
      feedback(target);
    } else if (target.hasAttribute('data-bootcn-message-regenerate')) {
      target.dispatchEvent(new CustomEvent('bootcn:conversation:regenerate', { bubbles: true }));
    }
  }

  function onScroll(event) {
    const log = event.target;
    if (!(log instanceof Element) || !log.matches(LOG)) return;
    const root = log.closest(ROOT);
    if (!root) return;
    root.dataset.bootcnStick = String(atBottom(log));
    updateLatest(root);
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('scroll', onScroll, true); // scroll does not bubble
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(function (root) {
      scrollToLatest(root, false);
      root.dataset.bootcnStick = 'true';
    });
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    document.removeEventListener('scroll', onScroll, true);
    listening = false;
  }

  ns.conversation = {
    init: init,
    destroy: destroy,
    append: append,
    setText: setText,
    setTyping: setTyping,
    scrollToLatest: scrollToLatest,
    clear: clear,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
