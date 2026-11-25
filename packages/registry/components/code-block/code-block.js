(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.codeBlock) return; // already loaded: idempotent

  // Messages: override them for your language with window.Bootcn.messages,
  // e.g. { 'copy.done': 'Copié.' } (see the Translations guide).
  // Plural keys end in .one, .other… as chosen by Intl.PluralRules.
  function t(key, fallback, vars) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    let text = typeof custom === 'string' ? custom : fallback;
    Object.keys(vars || {}).forEach(function (name) {
      text = text.split('{' + name + '}').join(String(vars[name]));
    });
    return text;
  }

  const ROOT = '[data-bootcn-code-block]';
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

  function copy(button) {
    const root = button.closest(ROOT);
    const code = root && root.querySelector('code');
    if (!code) return;
    const text = code.textContent;
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
      announce(
        root.querySelector('[data-bootcn-code-block-status]'),
        t('copy.done', 'Copied to the clipboard.'),
      );
      root.dispatchEvent(
        new CustomEvent('bootcn:code-block:copy', { bubbles: true, detail: { text: text } }),
      );
    });
  }

  function onClick(event) {
    const button =
      event.target.closest && event.target.closest(ROOT + ' [data-bootcn-code-block-copy]');
    if (button) copy(button);
  }

  function init() {
    if (listening) return;
    document.addEventListener('click', onClick);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    listening = false;
  }

  ns.codeBlock = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
