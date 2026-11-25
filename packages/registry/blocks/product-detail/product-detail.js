(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.productDetail) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-detail]';
  let listening = false;

  // Shows the chosen picture in the large frame.
  function select(thumb) {
    const root = thumb.closest(ROOT);
    const main = root.querySelector('[data-bootcn-detail-main]');
    const view = thumb.querySelector('[data-bootcn-detail-view]');
    root.querySelectorAll('[data-bootcn-detail-thumb]').forEach(function (other) {
      other.setAttribute('aria-pressed', String(other === thumb));
    });
    if (main && view) {
      main.textContent = '';
      main.appendChild(view.cloneNode(true));
      main.setAttribute('aria-label', thumb.getAttribute('aria-label') || '');
    }
  }

  function onClick(event) {
    const thumb = event.target.closest && event.target.closest('[data-bootcn-detail-thumb]');
    if (thumb && thumb.closest(ROOT)) select(thumb);
  }

  // Arrow keys move between the thumbnails.
  function onKeydown(event) {
    const thumb = event.target.closest && event.target.closest('[data-bootcn-detail-thumb]');
    if (!thumb || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(event.key) < 0)
      return;
    const all = Array.from(thumb.closest(ROOT).querySelectorAll('[data-bootcn-detail-thumb]'));
    const rtl = getComputedStyle(thumb).direction === 'rtl';
    const forward = event.key === 'ArrowDown' || event.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
    const next = all[(all.indexOf(thumb) + (forward ? 1 : all.length - 1)) % all.length];
    event.preventDefault();
    next.focus();
    select(next);
  }

  function init() {
    if (listening) return;
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKeydown);
    listening = false;
  }

  ns.productDetail = { init: init, destroy: destroy, select: select };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
