(function () {
  'use strict';

  // Site header: with data-bootcn-site-header-autohide it slides away while
  // scrolling down and comes back on scrolling up, on focus, or with the
  // phone menu open.
  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.siteHeader) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-site-header-autohide]';
  let lastY = 0;
  let ticking = false;
  let listening = false;

  function update() {
    ticking = false;
    const y = window.scrollY;
    document.querySelectorAll(ROOT).forEach(function (header) {
      const keep =
        header.contains(document.activeElement) ||
        header.querySelector('.navbar-collapse.show, .navbar-collapse.collapsing');
      const hide = !keep && y > lastY && y > header.offsetHeight * 2;
      if (header.classList.contains('is-hidden') !== hide) {
        header.classList.toggle('is-hidden', hide);
        header.dispatchEvent(
          new CustomEvent('bootcn:site-header:' + (hide ? 'hide' : 'show'), { bubbles: true }),
        );
      }
    });
    lastY = y;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  function onFocusIn(event) {
    const header = event.target.closest && event.target.closest(ROOT);
    if (header) header.classList.remove('is-hidden');
  }

  function init() {
    if (listening) return;
    lastY = window.scrollY;
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('focusin', onFocusIn);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('focusin', onFocusIn);
    listening = false;
  }

  ns.siteHeader = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
