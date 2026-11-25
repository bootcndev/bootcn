(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.marquee) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-marquee]';
  let listening = false;

  function onClick(event) {
    const button =
      event.target.closest && event.target.closest(ROOT + ' [data-bootcn-marquee-pause]');
    if (!button) return;
    const root = button.closest(ROOT);
    const paused = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(paused));
    root.classList.toggle('is-paused', paused);
    root.dispatchEvent(
      new CustomEvent('bootcn:marquee:' + (paused ? 'pause' : 'play'), { bubbles: true }),
    );
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

  ns.marquee = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
