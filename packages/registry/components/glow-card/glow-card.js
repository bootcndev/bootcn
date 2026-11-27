(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.glow) return; // already loaded: idempotent

  const CARD = '[data-bootcn-glow] .bootcn-glow-card, .bootcn-glow-card[data-bootcn-glow]';
  let frame = 0;
  let pending = null;
  let listening = false;

  // The light follows a mouse or pen; touch has no hover, so it stays off.
  function onMove(event) {
    if (event.pointerType === 'touch') return;
    pending = event;
    if (!frame) frame = requestAnimationFrame(update);
  }

  function update() {
    frame = 0;
    const event = pending;
    if (!event) return;
    const card = event.target.closest && event.target.closest(CARD);
    document.querySelectorAll('.bootcn-glow-card.is-glowing').forEach((other) => {
      if (other !== card) other.classList.remove('is-glowing');
    });
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--bootcn-glow-x', event.clientX - rect.left + 'px');
    card.style.setProperty('--bootcn-glow-y', event.clientY - rect.top + 'px');
    card.classList.add('is-glowing');
  }

  function onLeave(event) {
    if (event.target === document.documentElement || !event.relatedTarget) {
      document
        .querySelectorAll('.bootcn-glow-card.is-glowing')
        .forEach((card) => card.classList.remove('is-glowing'));
    }
  }

  function init() {
    if (listening) return;
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onLeave);
    listening = true;
  }

  function destroy() {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerout', onLeave);
    listening = false;
  }

  ns.glow = { init, destroy };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
