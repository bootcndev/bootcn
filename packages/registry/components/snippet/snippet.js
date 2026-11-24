(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.snippet) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-snippet]';
  const timers = new WeakMap();
  let listening = false;

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

  function onClick(event) {
    const button =
      event.target.closest && event.target.closest(ROOT + ' [data-bootcn-snippet-copy]');
    if (!button) return;
    const root = button.closest(ROOT);
    const lines = Array.from(root.querySelectorAll('.bootcn-snippet__line')).map(function (line) {
      return line.textContent;
    });
    const text = lines.length ? lines.join('\n') : root.querySelector('code').textContent;
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
      const status = root.querySelector('[data-bootcn-snippet-status]');
      if (status) {
        status.textContent = '';
        setTimeout(function () {
          status.textContent = 'Copied to the clipboard.';
        }, 50);
      }
      root.dispatchEvent(
        new CustomEvent('bootcn:snippet:copy', { bubbles: true, detail: { text: text } }),
      );
    });
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

  ns.snippet = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
