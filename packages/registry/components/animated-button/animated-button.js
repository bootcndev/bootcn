(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.animatedButton) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-ripple]';
  let listening = false;

  // A ripple from the click point; none under reduced motion or for
  // keyboard clicks (detail 0), which have no point.
  function onPointerDown(event) {
    const button = event.target.closest && event.target.closest(ROOT);
    if (!button || button.disabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const ripple = document.createElement('span');
    ripple.className = 'bootcn-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    ripple.style.left = event.clientX - rect.left - size / 2 + 'px';
    ripple.style.top = event.clientY - rect.top - size / 2 + 'px';
    button.appendChild(ripple);
    ripple.addEventListener('animationend', function () {
      ripple.remove();
    });
  }

  function init() {
    if (listening) return;
    document.addEventListener('pointerdown', onPointerDown);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('pointerdown', onPointerDown);
    listening = false;
  }

  ns.animatedButton = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
