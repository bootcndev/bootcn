(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.resizable) return; // already loaded: idempotent

  const HANDLE = '[data-bootcn-resizable] > .bootcn-resizable__handle';
  const STEP = 5;
  let drag = null;
  let listening = false;

  function limits(handle) {
    return {
      min: Number(handle.getAttribute('aria-valuemin') || 0),
      max: Number(handle.getAttribute('aria-valuemax') || 100),
    };
  }

  function vertical(handle) {
    return handle.parentElement.classList.contains('bootcn-resizable--vertical');
  }

  // Sets the controlled (first) panel to `percent` of the group, clamped.
  function resize(handle, percent) {
    const panel = document.getElementById(handle.getAttribute('aria-controls'));
    if (!panel) return;
    const { min, max } = limits(handle);
    const value = Math.round(Math.min(max, Math.max(min, percent)));
    panel.style.flexBasis = value + '%';
    handle.setAttribute('aria-valuenow', String(value));
    handle.dispatchEvent(
      new CustomEvent('bootcn:resizable:resize', { bubbles: true, detail: { value: value } }),
    );
  }

  // In right-to-left text, the left and right arrow keys swap meaning.
  function logicalKey(event, element) {
    if (getComputedStyle(element).direction !== 'rtl') return event.key;
    if (event.key === 'ArrowLeft') return 'ArrowRight';
    if (event.key === 'ArrowRight') return 'ArrowLeft';
    return event.key;
  }

  function onKeydown(event) {
    const handle = event.target.closest && event.target.closest(HANDLE);
    if (!handle) return;
    const now = Number(handle.getAttribute('aria-valuenow') || 50);
    const { min, max } = limits(handle);
    const back = vertical(handle) ? 'ArrowUp' : 'ArrowLeft';
    const forward = vertical(handle) ? 'ArrowDown' : 'ArrowRight';
    const key = logicalKey(event, handle);
    let next = null;
    if (key === back) next = now - STEP;
    else if (key === forward) next = now + STEP;
    else if (event.key === 'Home') next = min;
    else if (event.key === 'End') next = max;
    if (next === null) return;
    event.preventDefault();
    resize(handle, next);
  }

  function onPointerDown(event) {
    const handle = event.target.closest && event.target.closest(HANDLE);
    if (!handle || event.button !== 0) return;
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    handle.focus();
    drag = { handle: handle, rect: handle.parentElement.getBoundingClientRect() };
  }

  function onPointerMove(event) {
    if (!drag) return;
    const { handle, rect } = drag;
    // The first panel starts at the right edge in right-to-left text.
    const rtl = getComputedStyle(handle).direction === 'rtl';
    const percent = vertical(handle)
      ? ((event.clientY - rect.top) / rect.height) * 100
      : ((rtl ? rect.right - event.clientX : event.clientX - rect.left) / rect.width) * 100;
    resize(handle, percent);
  }

  function onPointerUp() {
    drag = null;
  }

  function init() {
    if (listening) return;
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    listening = false;
    drag = null;
  }

  ns.resizable = { init: init, destroy: destroy, resize: resize };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
