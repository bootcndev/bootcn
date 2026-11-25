(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.productCard) return; // already loaded: idempotent

  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest('[data-bootcn-wishlist]');
    if (!button) return;
    const saved = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(saved));
    const card = button.closest('[data-bootcn-product]');
    const name = card && card.querySelector('.bootcn-product-card__name');
    const live = document.querySelector('[data-bootcn-wishlist-live]');
    if (live && name) {
      live.textContent =
        (saved
          ? t('product.saved', 'Saved to your wishlist:')
          : t('product.removed', 'Removed from your wishlist:')) +
        ' ' +
        name.textContent.trim();
    }
    button.dispatchEvent(
      new CustomEvent('bootcn:wishlist', {
        bubbles: true,
        detail: { id: card && card.getAttribute('data-id'), saved: saved },
      }),
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

  ns.productCard = { init: init, destroy: destroy };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
